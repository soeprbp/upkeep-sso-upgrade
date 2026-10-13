import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTAL_FIELD_POLICY, createPortalPlan, expandQueue, isCompliantPortal, paginate, portalSlug, portalUrl, suggestedPortalSlug } from '../lib/policy.mjs';

const compliant = {
  portalType: 'asset', assets: ['asset-1'], customUrl: 'elk-148-load-form', customFields: [], ...PORTAL_FIELD_POLICY
};

test('accepts only an exact asset-bound portal with no custom fields', () => {
  assert.equal(isCompliantPortal(compliant, 'asset-1'), true);
  assert.equal(isCompliantPortal({ ...compliant, priority: 'hidden' }, 'asset-1'), false);
  assert.equal(isCompliantPortal({ ...compliant, assets: ['asset-2'] }, 'asset-1'), false);
  assert.equal(isCompliantPortal({ ...compliant, customFields: [{ id: 'field-1' }] }, 'asset-1'), false);
  assert.equal(isCompliantPortal({ ...compliant, customFields: 'none' }, 'asset-1'), false);
  assert.equal(isCompliantPortal({ ...compliant, customFields: {} }, 'asset-1'), false);
  assert.equal(isCompliantPortal({ ...compliant, customFields: null }, 'asset-1'), false);
  assert.equal(isCompliantPortal({ ...compliant, portalType: 'location' }, 'asset-1'), false);
});

test('constructs only safe UpKeep public portal URLs', () => {
  assert.equal(portalUrl('elk-148-load-form'), 'https://request-portal.onupkeep.com/elk-148-load-form');
  assert.equal(portalUrl('https://evil.example/test'), null);
  assert.equal(portalUrl('../admin'), null);
  assert.equal(portalUrl(''), null);
});

test('normalizes a deterministic asset portal slug', () => {
  assert.equal(portalSlug(' ELK-148 / Load Form! '), 'elk-148-load-form');
  assert.equal(suggestedPortalSlug({ id: 'asset-1', code: 'ELK-148', name: 'Load Form' }), 'elk-148-load-form');
  assert.equal(suggestedPortalSlug({ id: 'opaque-id', code: 'opaque-id', name: 'Main Air Compressor' }), 'main-air-compressor');
  assert.equal(suggestedPortalSlug({ id: 'opaque-id', code: 'Main Air Compressor', name: 'Main Air Compressor' }), 'main-air-compressor');
  assert.equal(portalSlug('---'), '');
});

test('expands queue quantities and clamps them between one and 99', () => {
  const expanded = expandQueue([{ id: 'a', quantity: 2 }, { id: 'b', quantity: 3 }]);
  assert.deepEqual(expanded.map((item) => item.id), ['a', 'a', 'b', 'b', 'b']);
  assert.equal(expandQueue([{ id: 'a', quantity: 0 }]).length, 1);
  assert.equal(expandQueue([{ id: 'a', quantity: 400 }]).length, 99);
});

test('paginates Letter 4-up output four physical labels per sheet', () => {
  const pages = paginate([1, 2, 3, 4, 5, 6, 7], 4);
  assert.deepEqual(pages, [[1, 2, 3, 4], [5, 6, 7]]);
  assert.throws(() => paginate([1], 0), /positive integer/);
});

test('portal plan locks every field except Attachments and Priority', () => {
  const plan = createPortalPlan({ id: 'asset-1', name: 'Load Form' }, 'elk-148-load-form');
  assert.equal(plan.files, 'optional');
  assert.equal(plan.priority, 'optional');
  for (const field of ['location', 'asset', 'category', 'dueDate', 'assignedUser', 'team']) assert.equal(plan[field], 'hidden');
  assert.deepEqual(plan.customFields, []);
  assert.deepEqual(plan.locations, []);
  assert.equal(Object.hasOwn(plan, 'attachments'), false);
  assert.throws(() => createPortalPlan({ id: 'asset-1', name: 'Load Form' }, '../bad'), /invalid/);
});
