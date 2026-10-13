import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRows, referenceId } from '../lib/upkeep-normalize.mjs';

test('extracts UpKeep rows from direct and nested response envelopes', () => {
  assert.deepEqual(apiRows({ results: [{ id: 'asset-1' }] }), [{ id: 'asset-1' }]);
  assert.deepEqual(apiRows({ result: { assets: [{ id: 'asset-2' }] } }, ['assets']), [{ id: 'asset-2' }]);
  assert.deepEqual(apiRows({ data: { items: [{ id: 'asset-3' }] } }), [{ id: 'asset-3' }]);
});

test('resolves asset locations returned as IDs or expanded objects', () => {
  assert.equal(referenceId('location-1'), 'location-1');
  assert.equal(referenceId({ id: 'location-2', name: 'Plant 2' }), 'location-2');
  assert.equal(referenceId({ _id: 'location-3', name: 'Plant 3' }), 'location-3');
  assert.equal(referenceId(null), '');
});
