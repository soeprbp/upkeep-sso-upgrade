import { portalSlug } from './policy.mjs';

export function validatePortalCreateRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid portal creation request.');
  const allowed = new Set(['assetId', 'customUrl', 'confirmed']);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`Unexpected portal creation field: ${key}`);
  const assetId = typeof value.assetId === 'string' ? value.assetId.trim() : '';
  const customUrl = typeof value.customUrl === 'string' ? value.customUrl.trim() : '';
  if (!assetId || assetId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(assetId)) throw new Error('Asset ID is invalid.');
  if (!customUrl || customUrl.length > 80 || portalSlug(customUrl) !== customUrl) throw new Error('Portal URL slug is invalid.');
  if (value.confirmed !== true) throw new Error('Portal creation must be explicitly confirmed.');
  return { assetId, customUrl };
}

export function assertVerifiedPortal(portal, assetId, customUrl, isCompliant) {
  if (!portal || portal.customUrl !== customUrl || !isCompliant(portal, assetId)) {
    throw new Error('UpKeep returned a portal that did not pass post-write verification.');
  }
  return portal;
}
