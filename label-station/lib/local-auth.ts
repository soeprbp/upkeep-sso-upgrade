import { timingSafeEqual } from 'node:crypto';

export function localRequestAuthorized(request: Request) {
  const expected = process.env.LABEL_STATION_SESSION_TOKEN;
  if (!expected) return true;
  const supplied = request.headers.get('x-label-station-token') ?? '';
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}
