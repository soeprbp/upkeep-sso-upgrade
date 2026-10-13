import { localRequestAuthorized } from '../../../lib/local-auth';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  if (!localRequestAuthorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({ service: 'upkeep-label-station' });
}
