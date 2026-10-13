export const PORTAL_FIELD_POLICY = Object.freeze({
  files: 'optional',
  priority: 'optional',
  location: 'hidden',
  asset: 'hidden',
  category: 'hidden',
  dueDate: 'hidden',
  assignedUser: 'hidden',
  team: 'hidden'
});

export function isCompliantPortal(portal, assetId) {
  if (!portal || portal.portalType !== 'asset' || !portal.customUrl) return false;
  if (!Array.isArray(portal.assets) || !portal.assets.includes(assetId)) return false;
  if (!Array.isArray(portal.customFields) || portal.customFields.length !== 0) return false;
  return Object.entries(PORTAL_FIELD_POLICY).every(([key, value]) => portal[key] === value);
}

export function portalUrl(customUrl) {
  if (!customUrl || !/^[a-z0-9][a-z0-9-]*$/i.test(customUrl)) return null;
  return `https://request-portal.onupkeep.com/${customUrl}`;
}

export function portalSlug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function suggestedPortalSlug(asset) {
  const identifier = asset.code && asset.code !== asset.id && asset.code !== asset.name ? `${asset.code}-` : '';
  return portalSlug(`${identifier}${asset.name || asset.id}`);
}

export function expandQueue(queue) {
  return queue.flatMap((item) => Array.from({ length: Math.max(1, Math.min(99, Number(item.quantity) || 1)) }, () => item));
}

export function paginate(items, pageSize = 4) {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('pageSize must be a positive integer');
  const pages = [];
  for (let index = 0; index < items.length; index += pageSize) pages.push(items.slice(index, index + pageSize));
  return pages;
}

export function createPortalPlan(asset, customUrl) {
  const safeSlug = portalSlug(customUrl);
  if (!asset?.id || !asset?.name) throw new Error('A valid asset is required');
  if (!safeSlug || safeSlug !== customUrl) throw new Error('Portal URL slug is invalid');
  return {
    name: `${asset.name} Maintenance Request`,
    customUrl: safeSlug,
    portalType: 'asset',
    assets: [asset.id],
    locations: [],
    ...PORTAL_FIELD_POLICY,
    customFields: []
  };
}
