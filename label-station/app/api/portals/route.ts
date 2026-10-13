import { NextResponse } from 'next/server';
import { assets as fixtureAssets } from '../../../lib/fixtures';
import { localRequestAuthorized } from '../../../lib/local-auth';
import { validatePortalCreateRequest } from '../../../lib/portal-write.mjs';
import { createPortalPlan, portalUrl } from '../../../lib/policy.mjs';
import { createPortalForAsset, PortalConflictError } from '../../../lib/upkeep';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!localRequestAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 4096) return NextResponse.json({ error: 'Portal request is too large.' }, { status: 413 });

  try {
    const input = validatePortalCreateRequest(await request.json());
    if (process.env.UPKEEP_LABEL_MODE !== 'live') {
      const asset = fixtureAssets.find((candidate) => candidate.id === input.assetId);
      if (!asset) return NextResponse.json({ error: 'Fixture asset was not found.' }, { status: 404 });
      const portal = { id: `fixture-${asset.id}`, ...createPortalPlan(asset, input.customUrl) };
      return NextResponse.json({ mode: 'fixture', created: true, simulated: true, portal, publicUrl: portalUrl(input.customUrl) });
    }

    const result = await createPortalForAsset(input.assetId, input.customUrl);
    return NextResponse.json({ mode: 'live', simulated: false, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create the UpKeep portal.';
    const status = error instanceof PortalConflictError ? 409 : /invalid|confirmed|Unexpected/.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
