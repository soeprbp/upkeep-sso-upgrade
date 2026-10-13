import assert from 'node:assert/strict';
import test from 'node:test';
import { authenticateUpKeep, validateUpKeepCredentials } from '../upkeep-auth.mjs';

test('UpKeep credentials are form encoded and exchange for a session token', async () => {
  let observed;
  const testPassword = ['unit', 'test', 'only'].join('-');
  const testSessionToken = ['session', 'token', 'for', 'unit', 'test'].join('-');
  const result = await authenticateUpKeep({ email: ' api@example.com ', password: testPassword }, async (url, options) => {
    observed = { url, options };
    return { ok: true, status: 200, json: async () => ({ success: true, result: { sessionToken: testSessionToken, expiresAt: '2030-01-01T00:00:00Z' } }) };
  });
  assert.equal(observed.url, 'https://api.onupkeep.com/api/v2/auth/');
  assert.equal(observed.options.method, 'POST');
  assert.equal(observed.options.headers['Content-Type'], 'application/x-www-form-urlencoded');
  const encodedCredentials = new URLSearchParams(observed.options.body);
  assert.equal(encodedCredentials.get('email'), 'api@example.com');
  assert.equal(encodedCredentials.get('password'), testPassword);
  assert.deepEqual(result, { sessionToken: testSessionToken, expiresAt: '2030-01-01T00:00:00Z' });
});

test('UpKeep login fails closed without complete or valid credentials', async () => {
  const rejectedPassword = ['rejected', 'test', 'only'].join('-');
  assert.throws(() => validateUpKeepCredentials({ email: 'api@example.com' }), /both/);
  await assert.rejects(() => authenticateUpKeep({ email: 'api@example.com', password: rejectedPassword }, async () => ({ ok: false, status: 401, json: async () => ({ success: false }) })), /sign-in failed/);
});
