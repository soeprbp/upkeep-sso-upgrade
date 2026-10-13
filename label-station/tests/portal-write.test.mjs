import test from 'node:test';
import assert from 'node:assert/strict';
import { assertVerifiedPortal, validatePortalCreateRequest } from '../lib/portal-write.mjs';

test('portal creation requires a narrow explicitly confirmed request', () => {
  assert.deepEqual(validatePortalCreateRequest({ assetId: 'asset_1', customUrl: 'elk-148-load-form', confirmed: true }), {
    assetId: 'asset_1', customUrl: 'elk-148-load-form'
  });
  assert.throws(() => validatePortalCreateRequest({ assetId: 'asset_1', customUrl: 'elk-148-load-form' }), /confirmed/);
  assert.throws(() => validatePortalCreateRequest({ assetId: 'asset_1', customUrl: '../admin', confirmed: true }), /invalid/);
  assert.throws(() => validatePortalCreateRequest({ assetId: 'asset_1', customUrl: 'safe', confirmed: true, priority: 'required' }), /Unexpected/);
});

test('post-write verification must match the asset and URL', () => {
  const portal = { customUrl: 'elk-148-load-form', assets: ['asset_1'] };
  assert.equal(assertVerifiedPortal(portal, 'asset_1', 'elk-148-load-form', () => true), portal);
  assert.throws(() => assertVerifiedPortal(portal, 'asset_1', 'wrong-url', () => true), /verification/);
  assert.throws(() => assertVerifiedPortal(portal, 'asset_1', 'elk-148-load-form', () => false), /verification/);
});
