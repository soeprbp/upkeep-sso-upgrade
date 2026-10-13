/**
 * Extract rows from the response envelopes used by UpKeep v2/v3 endpoints.
 *
 * UpKeep has returned both direct arrays and arrays nested below `result`,
 * `results`, `data`, or resource-specific keys. Keeping this boundary tolerant
 * prevents a valid empty-looking UI when the transport succeeded but the
 * response envelope changed.
 */
export function apiRows(value, resourceKeys = []) {
  const keys = [...resourceKeys, 'results', 'result', 'data', 'items'];
  let candidates = [value];

  for (let depth = 0; depth < 4 && candidates.length; depth += 1) {
    const next = [];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate.map(asRecord);
      const record = asRecord(candidate);
      for (const key of keys) {
        const nested = record[key];
        if (Array.isArray(nested)) return nested.map(asRecord);
        if (nested !== null && typeof nested === 'object') next.push(nested);
      }
    }
    candidates = next;
  }
  return [];
}

/** Resolve either a plain UpKeep ID or an expanded object reference. */
export function referenceId(value) {
  if (typeof value === 'string') return value;
  const record = asRecord(value);
  return stringValue(record.id ?? record._id);
}

function asRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function stringValue(value) {
  return typeof value === 'string' ? value : '';
}
