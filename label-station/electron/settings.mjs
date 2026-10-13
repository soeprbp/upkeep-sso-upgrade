import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MAX_API_KEY_LENGTH = 4096;

export function validateSaveRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid settings request.');
  const mode = value.mode;
  if (mode !== 'fixture' && mode !== 'live') throw new Error('Mode must be fixture or live.');
  if (value.email !== undefined && typeof value.email !== 'string') throw new Error('Email must be text.');
  if (value.password !== undefined && typeof value.password !== 'string') throw new Error('Password must be text.');
  if (value.apiKey !== undefined && typeof value.apiKey !== 'string') throw new Error('Session token must be text.');
  if (value.removeApiKey !== undefined && typeof value.removeApiKey !== 'boolean') throw new Error('Remove API key must be true or false.');
  const email = typeof value.email === 'string' ? value.email.trim() : '';
  const password = typeof value.password === 'string' ? value.password : '';
  const apiKey = typeof value.apiKey === 'string' ? value.apiKey.trim() : '';
  if (email.length > 320 || password.length > MAX_API_KEY_LENGTH || apiKey.length > MAX_API_KEY_LENGTH) throw new Error('The UpKeep credentials are too long.');
  if ((email && !password) || (!email && password)) throw new Error('Enter both the UpKeep email and password.');
  return { mode, email, password, apiKey, removeApiKey: value.removeApiKey === true };
}

async function decryptValue(value, cryptoProvider) {
  if (typeof value !== 'string' || !value) return '';
  try { return await cryptoProvider.decrypt(Buffer.from(value, 'base64')); }
  catch { throw new Error('The saved UpKeep connection cannot be decrypted for this Windows user.'); }
}

export async function readDesktopConfig(filePath, cryptoProvider) {
  let stored;
  try {
    stored = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return { configured: false, mode: 'fixture', email: '', password: '', apiKey: '' };
    throw new Error('Desktop settings could not be read.');
  }

  const mode = stored?.mode === 'live' ? 'live' : 'fixture';
  const [email, password, apiKey] = await Promise.all([
    decryptValue(stored?.encryptedEmail, cryptoProvider),
    decryptValue(stored?.encryptedPassword, cryptoProvider),
    decryptValue(stored?.encryptedApiKey, cryptoProvider)
  ]);
  return { configured: true, mode, email, password, apiKey };
}

export async function writeDesktopConfig(filePath, request, current, cryptoProvider) {
  const input = validateSaveRequest(request);
  const email = input.removeApiKey ? '' : (input.email || current.email || '');
  const password = input.removeApiKey ? '' : (input.password || current.password || '');
  const apiKey = input.removeApiKey ? '' : (input.apiKey || current.apiKey || '');
  if (input.mode === 'live' && !((email && password) || apiKey)) throw new Error('UpKeep credentials are required for live mode.');

  const [encryptedEmail, encryptedPassword, encryptedApiKey] = await Promise.all([
    email ? cryptoProvider.encrypt(email).then((value) => value.toString('base64')) : '',
    password ? cryptoProvider.encrypt(password).then((value) => value.toString('base64')) : '',
    apiKey ? cryptoProvider.encrypt(apiKey).then((value) => value.toString('base64')) : ''
  ]);

  const output = JSON.stringify({ version: 2, mode: input.mode, encryptedEmail, encryptedPassword, encryptedApiKey }, null, 2);
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, output, { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, filePath);
  return { configured: true, mode: input.mode, email, password, apiKey };
}

export function publicSettings(config) {
  return { configured: config.configured, mode: config.mode, hasCredentials: Boolean(config.email && config.password), hasApiKey: Boolean(config.apiKey) };
}
