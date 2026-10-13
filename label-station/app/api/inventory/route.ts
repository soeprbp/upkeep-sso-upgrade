import { NextResponse } from 'next/server';
import { localRequestAuthorized } from '../../../lib/local-auth';
import { getInventory } from '../../../lib/upkeep';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!localRequestAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await getInventory());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load UpKeep inventory' }, { status: 502 });
  }
}
