import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { resolveDevelopmentUrl } from '../runtime-options.mjs';
import { publicSettings, readDesktopConfig, validateSaveRequest, writeDesktopConfig } from '../settings.mjs';

const cryptoProvider = {
  encrypt: async (value) => Buffer.from(`encrypted:${value}`, 'utf8'),
  decrypt: async (value) => value.toString('utf8').replace(/^encrypted:/, '')
};

test('desktop settings validate mode and credentials', () => {
  assert.deepEqual(validateSaveRequest({ mode: 'fixture', apiKey: '  key  ' }), { mode: 'fixture', email: '', password: '', apiKey: 'key', removeApiKey: false });
  assert.deepEqual(validateSaveRequest({ mode: 'live', email: ' api@welchpkg.com ', password: 'secret' }), { mode: 'live', email: 'api@welchpkg.com', password: 'secret', apiKey: '', removeApiKey: false });
  assert.throws(() => validateSaveRequest({ mode: 'other' }), /Mode/);
  assert.throws(() => validateSaveRequest({ mode: 'live', email: 'api@welchpkg.com' }), /both/);
  assert.throws(() => validateSaveRequest({ mode: 'live', apiKey: 7 }), /text/);
  assert.throws(() => validateSaveRequest({ mode: 'live', apiKey: 'x'.repeat(4097) }), /too long/);
});

test('desktop settings encrypt the key and never expose it publicly', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'label-station-settings-'));
  const filePath = path.join(directory, 'settings.json');
  try {
    const saved = await writeDesktopConfig(filePath, { mode: 'live', apiKey: 'secret-key' }, { mode: 'fixture', apiKey: '' }, cryptoProvider);
    const onDisk = await readFile(filePath, 'utf8');
    assert.equal(onDisk.includes('secret-key'), false);
    assert.deepEqual(publicSettings(saved), { configured: true, mode: 'live', hasCredentials: false, hasApiKey: true });
    const loaded = await readDesktopConfig(filePath, cryptoProvider);
    assert.equal(loaded.apiKey, 'secret-key');
    assert.deepEqual(publicSettings(loaded), { configured: true, mode: 'live', hasCredentials: false, hasApiKey: true });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('saved API key can be explicitly removed in fixture mode', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'label-station-settings-'));
  const filePath = path.join(directory, 'settings.json');
  try {
    const saved = await writeDesktopConfig(filePath, { mode: 'fixture', removeApiKey: true }, { mode: 'live', apiKey: 'secret-key' }, cryptoProvider);
    assert.deepEqual(publicSettings(saved), { configured: true, mode: 'fixture', hasCredentials: false, hasApiKey: false });
    assert.equal((await readFile(filePath, 'utf8')).includes('encrypted:'), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('desktop settings encrypt UpKeep credentials and preserve them when fields are blank', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'label-station-settings-'));
  const filePath = path.join(directory, 'settings.json');
  try {
    const saved = await writeDesktopConfig(filePath, { mode: 'live', email: 'api@welchpkg.com', password: 'top-secret', apiKey: 'session-value' }, { mode: 'fixture', email: '', password: '', apiKey: '' }, cryptoProvider);
    const onDisk = await readFile(filePath, 'utf8');
    assert.equal(onDisk.includes('api@welchpkg.com'), false);
    assert.equal(onDisk.includes('top-secret'), false);
    assert.equal(onDisk.includes('session-value'), false);
    assert.deepEqual(publicSettings(saved), { configured: true, mode: 'live', hasCredentials: true, hasApiKey: true });

    const retained = await writeDesktopConfig(filePath, { mode: 'live' }, saved, cryptoProvider);
    assert.equal(retained.email, 'api@welchpkg.com');
    assert.equal(retained.password, 'top-secret');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('live mode fails closed without a key', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'label-station-settings-'));
  try {
    await assert.rejects(() => writeDesktopConfig(path.join(directory, 'settings.json'), { mode: 'live', apiKey: '' }, { mode: 'fixture', apiKey: '' }, cryptoProvider), /required/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('packaged builds ignore development URL overrides', () => {
  const argumentsList = ['app.exe', '--dev-url=http://127.0.0.1:9999'];
  assert.equal(resolveDevelopmentUrl(argumentsList, true), '');
  assert.equal(resolveDevelopmentUrl(argumentsList, false), 'http://127.0.0.1:9999');
});
