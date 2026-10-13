import { assets as fixtureAssets, locations as fixtureLocations, type Asset, type Location } from './fixtures';
import { assertVerifiedPortal } from './portal-write.mjs';
import { createPortalPlan, isCompliantPortal, portalUrl } from './policy.mjs';
import { apiRows, referenceId } from './upkeep-normalize.mjs';

const baseV2 = process.env.UPKEEP_API_BASE_V2 ?? 'https://api.onupkeep.com/api/v2';
const baseV3 = process.env.UPKEEP_API_BASE_V3 ?? 'https://api.onupkeep.com/api/v3';
const configuredSessionToken = process.env.UPKEEP_SESSION_TOKEN ?? process.env.UPKEEP_API_KEY ?? '';
const upkeepEmail = process.env.UPKEEP_EMAIL ?? '';
const upkeepPassword = process.env.UPKEEP_PASSWORD ?? '';
let cachedSessionToken = configuredSessionToken;
let cachedSessionExpiresAt = 0;

type JsonRecord = Record<string, unknown>;
type PortalRecord = JsonRecord & { id?: string; customUrl?: string; assets?: string[]; customFields?: unknown[] };

export class PortalConflictError extends Error {}

const asRecord = (value: unknown): JsonRecord => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
const stringValue = (value: unknown): string => typeof value === 'string' ? value : '';
const resultRecord = (value: unknown): JsonRecord => {
  const record = asRecord(value);
  return asRecord(record.result ?? record.data ?? record);
};
const bindingIds = (value: unknown): string[] => Array.isArray(value)
  ? value.map((item) => typeof item === 'string' ? item : stringValue(asRecord(item).id ?? asRecord(item)._id)).filter(Boolean)
  : [];

async function sessionToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedSessionToken && (!cachedSessionExpiresAt || cachedSessionExpiresAt > Date.now() + 60000)) return cachedSessionToken;
  if (!upkeepEmail || !upkeepPassword) {
    if (cachedSessionToken) return cachedSessionToken;
    throw new Error('UpKeep credentials are not configured.');
  }
  const response = await fetch(`${baseV2.replace(/\/$/, '')}/auth/`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: upkeepEmail, password: upkeepPassword }).toString(),
    cache: 'no-store',
    signal: AbortSignal.timeout(20000)
  });
  let data: unknown = {};
  try { data = await response.json(); } catch {}
  const result = asRecord(asRecord(data).result);
  const token = stringValue(result.sessionToken);
  if (!response.ok || asRecord(data).success === false || !token) throw new Error(`UpKeep authentication failed (${response.status}).`);
  cachedSessionToken = token;
  const expiresAt = Date.parse(stringValue(result.expiresAt));
  cachedSessionExpiresAt = Number.isFinite(expiresAt) ? expiresAt : 0;
  return cachedSessionToken;
}

async function upkeep(path: string, options: { base?: string; method?: 'GET' | 'POST'; body?: JsonRecord } = {}, retried = false) {
  const token = await sessionToken();
  const response = await fetch(`${options.base ?? baseV2}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Session-Token': token,
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(20000)
  });
  if (response.status === 401 && upkeepEmail && upkeepPassword && !retried) {
    cachedSessionToken = '';
    cachedSessionExpiresAt = 0;
    await sessionToken(true);
    return upkeep(path, options, true);
  }
  const text = await response.text();
  let data: unknown = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok || asRecord(data).success === false) {
    const detail = stringValue(asRecord(data).message ?? asRecord(data).error ?? asRecord(data).raw) || text;
    throw new Error(`UpKeep ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return data;
}

/** Fetch every v2 page so location filtering is not limited to the first API page. */
async function listAllV2(path: string, resourceKeys: string[]): Promise<JsonRecord[]> {
  const limit = 100;
  const output: JsonRecord[] = [];
  const pageSignatures = new Set<string>();

  for (let offset = 0; offset < 10000; offset += limit) {
    const response = await upkeep(`${path}${path.includes('?') ? '&' : '?'}limit=${limit}&offset=${offset}`);
    const page = apiRows(response, resourceKeys) as JsonRecord[];
    if (!page.length) return output;

    const signature = `${stringValue(page[0]?.id ?? page[0]?._id)}:${stringValue(page.at(-1)?.id ?? page.at(-1)?._id)}:${page.length}`;
    if (pageSignatures.has(signature)) throw new Error(`UpKeep pagination repeated while loading ${path}.`);
    pageSignatures.add(signature);
    output.push(...page);
    if (page.length < limit) return output;
  }

  throw new Error(`UpKeep returned more than 10,000 records for ${path}; narrow the inventory request.`);
}

function normalizePortal(value: unknown): PortalRecord {
  const portal = asRecord(value);
  return {
    ...portal,
    id: stringValue(portal.id ?? portal._id),
    customUrl: stringValue(portal.customUrl),
    assets: bindingIds(portal.assets),
    locations: bindingIds(portal.locations),
    ...(Array.isArray(portal.customFields) ? { customFields: portal.customFields } : {})
  };
}

async function mapLimited<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      output[index] = await mapper(items[index]);
    }
  }));
  return output;
}

async function listPortals(): Promise<PortalRecord[]> {
  const portalResponse = await upkeep('/request-portal/?limit=1000&offset=0', { base: baseV3 });
  const portals = apiRows(portalResponse, ['requestPortals', 'portals']).map(normalizePortal);
  return mapLimited(portals, 6, async (portal) => {
    if (Array.isArray(portal.customFields) || !portal.id) return portal;
    try {
      const customFieldResponse = await upkeep(`/request-portal/${encodeURIComponent(portal.id)}/custom-fields`, { base: baseV3 });
      return { ...portal, customFields: apiRows(customFieldResponse, ['customFields']) };
    } catch {
      return portal;
    }
  });
}

async function liveInventory(): Promise<{ locations: Location[]; assets: Asset[]; portals: PortalRecord[] }> {
  const [locationRows, assetRows, portals] = await Promise.all([
    listAllV2('/locations', ['locations']),
    listAllV2('/assets', ['assets']),
    listPortals()
  ]);
  const locations: Location[] = locationRows.map((item) => ({
    id: stringValue(item.id ?? item._id),
    name: stringValue(item.name)
  })).filter((item) => item.id && item.name);
  const assets: Asset[] = assetRows.map((item) => {
    const id = stringValue(item.id ?? item._id);
    const name = stringValue(item.name);
    const category = asRecord(item.category);
    const portal = portals.find((candidate) => candidate.assets?.includes(id));
    const humanIdentifier = [item.assetId, item.barcode, item.serialNumber, item.serial]
      .map(stringValue)
      .find((value) => value && value !== id);
    return {
      id,
      name,
      // Never expose UpKeep's opaque record ID as the human-facing asset text.
      code: humanIdentifier || name,
      type: stringValue(category.name) || 'Asset',
      locationId: referenceId(item.location) || referenceId(item.locationId),
      portal: portal as Asset['portal']
    };
  }).filter((item) => item.id && item.name);
  return { locations, assets, portals };
}

export async function getInventory(): Promise<{ mode: 'fixture' | 'live'; locations: Location[]; assets: Asset[] }> {
  if (process.env.UPKEEP_LABEL_MODE !== 'live') return { mode: 'fixture', locations: fixtureLocations, assets: fixtureAssets };
  const inventory = await liveInventory();
  return { mode: 'live', locations: inventory.locations, assets: inventory.assets };
}

export async function createPortalForAsset(assetId: string, customUrl: string) {
  if (process.env.UPKEEP_LABEL_MODE !== 'live') throw new Error('Live UpKeep mode is required to create a portal.');
  if (process.env.UPKEEP_LABEL_ALLOW_WRITES !== 'true') throw new Error('Portal creation is disabled for this Label Station build.');

  const inventory = await liveInventory();
  const asset = inventory.assets.find((candidate) => candidate.id === assetId);
  if (!asset) throw new Error('The selected asset no longer exists in UpKeep.');

  const boundPortal = inventory.portals.find((portal) => portal.assets?.includes(assetId));
  if (boundPortal) {
    if (isCompliantPortal(boundPortal, assetId)) {
      return { created: false, portal: boundPortal, publicUrl: portalUrl(boundPortal.customUrl) };
    }
    throw new PortalConflictError('This asset already has a portal, but its fields do not match the Welch label policy. Review it in UpKeep before printing.');
  }
  if (inventory.portals.some((portal) => portal.customUrl === customUrl)) {
    throw new PortalConflictError('That portal URL is already in use. Change the URL slug and try again.');
  }

  const plan = createPortalPlan(asset, customUrl) as JsonRecord;
  const createResponse = await upkeep('/request-portal/', { base: baseV3, method: 'POST', body: plan });
  const created = normalizePortal(resultRecord(createResponse));
  const createdId = created.id;

  const refreshed = await listPortals();
  const verifiedCandidate = refreshed.find((portal) => createdId ? portal.id === createdId : portal.customUrl === customUrl);
  const verified = assertVerifiedPortal(verifiedCandidate, assetId, customUrl, isCompliantPortal) as PortalRecord;
  return { created: true, portal: verified, publicUrl: portalUrl(verified.customUrl) };
}
