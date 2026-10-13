const authUrl = 'https://api.onupkeep.com/api/v2/auth/';

export function validateUpKeepCredentials(value) {
  const email = typeof value?.email === 'string' ? value.email.trim() : '';
  const password = typeof value?.password === 'string' ? value.password : '';
  if (!email || !password) throw new Error('Enter both the UpKeep email and password.');
  if (email.length > 320 || password.length > 4096) throw new Error('The UpKeep credentials are too long.');
  return { email, password };
}

export async function authenticateUpKeep(value, fetchImpl = fetch) {
  const credentials = validateUpKeepCredentials(value);
  const response = await fetchImpl(authUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(credentials).toString(),
    signal: AbortSignal.timeout(20000)
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok || data?.success === false) {
    throw new Error(`UpKeep sign-in failed (${response.status}). Check the email and password and try again.`);
  }
  const sessionToken = typeof data?.result?.sessionToken === 'string' ? data.result.sessionToken : '';
  if (!sessionToken) throw new Error('UpKeep sign-in succeeded but did not return a session token.');
  return { sessionToken, expiresAt: data?.result?.expiresAt ?? null };
}
