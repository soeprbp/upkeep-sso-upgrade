import { app, BrowserWindow, dialog, ipcMain, safeStorage, session } from 'electron';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDevelopmentUrl } from './runtime-options.mjs';
import { publicSettings, readDesktopConfig, writeDesktopConfig } from './settings.mjs';
import { authenticateUpKeep } from './upkeep-auth.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const loopbackHost = '127.0.0.1';
const devUrl = resolveDevelopmentUrl(process.argv, app.isPackaged);
let mainWindow;
let serverProcess;
let applicationOrigin = '';
let restartPromise = Promise.resolve();
let isQuitting = false;
let sessionToken = '';

if (!app.requestSingleInstanceLock()) app.quit();

function encryptionProvider() {
  return {
    encrypt: async (plainText) => {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows secure storage is unavailable.');
      return safeStorage.encryptStringAsync(plainText);
    },
    decrypt: async (encrypted) => {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows secure storage is unavailable.');
      const result = await safeStorage.decryptStringAsync(encrypted);
      return result.result;
    }
  };
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

async function loadConfig() {
  return readDesktopConfig(settingsPath(), encryptionProvider());
}

function trustedSender(event) {
  try {
    return Boolean(applicationOrigin) && new URL(event.senderFrame.url).origin === applicationOrigin;
  } catch {
    return false;
  }
}

function registerIpc() {
  ipcMain.handle('label-station:get-settings', async (event) => {
    if (!trustedSender(event)) throw new Error('Untrusted settings request.');
    return publicSettings(await loadConfig());
  });

  ipcMain.handle('label-station:save-settings', async (event, request) => {
    if (!trustedSender(event)) throw new Error('Untrusted settings request.');
    const current = await loadConfig();
    let saveRequest = request;
    if (request?.mode === 'live' && (request?.email || request?.password)) {
      const authenticated = await authenticateUpKeep({ email: request.email, password: request.password });
      saveRequest = { ...request, apiKey: authenticated.sessionToken };
    }
    const updated = await writeDesktopConfig(settingsPath(), saveRequest, current, encryptionProvider());
    if (!devUrl) {
      setTimeout(() => {
        restartPromise = restartPromise.then(restartPackagedServer).catch(showFatalError);
      }, 250);
    }
    return { ...publicSettings(updated), restartScheduled: !devUrl };
  });
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, loopbackHost, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForServer(url, token, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${url}/api/health`, {
        redirect: 'manual',
        headers: { 'x-label-station-token': token }
      });
      if (response.ok) {
        const body = await response.json();
        if (body?.service === 'upkeep-label-station') return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('The local Label Station service did not start in time.');
}

async function stopServer() {
  const child = serverProcess;
  serverProcess = undefined;
  if (!child || child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 3000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    child.kill();
  });
}

async function startPackagedServer() {
  const port = await availablePort();
  const config = await loadConfig();
  const serverRoot = path.join(process.resourcesPath, 'app-server');
  const serverScript = path.join(serverRoot, 'server.js');
  applicationOrigin = `http://${loopbackHost}:${port}`;
  sessionToken = randomBytes(32).toString('base64url');
  const child = spawn(process.execPath, [serverScript], {
    cwd: serverRoot,
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_PATH: path.join(serverRoot, 'vendor'),
      NODE_ENV: 'production',
      HOSTNAME: loopbackHost,
      PORT: String(port),
      LABEL_STATION_SESSION_TOKEN: sessionToken,
      UPKEEP_LABEL_MODE: config.mode,
      UPKEEP_SESSION_TOKEN: config.mode === 'live' ? config.apiKey : '',
      UPKEEP_EMAIL: config.mode === 'live' ? config.email : '',
      UPKEEP_PASSWORD: config.mode === 'live' ? config.password : '',
      UPKEEP_LABEL_ALLOW_WRITES: 'true'
    }
  });
  serverProcess = child;
  child.once('exit', (code) => {
    if (!isQuitting && serverProcess === child) {
      showFatalError(new Error(`The local Label Station service stopped unexpectedly${code === null ? '' : ` with code ${code}`}.`));
    }
  });
  await waitForServer(applicationOrigin, sessionToken);
  return applicationOrigin;
}

async function restartPackagedServer() {
  await stopServer();
  const url = await startPackagedServer();
  if (mainWindow && !mainWindow.isDestroyed()) await mainWindow.loadURL(url);
}

function secureWindow(url) {
  const window = new BrowserWindow({
    width: 1500,
    height: 980,
    minWidth: 1000,
    minHeight: 720,
    show: false,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(here, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      if (new URL(navigationUrl).origin !== applicationOrigin) event.preventDefault();
    } catch {
      event.preventDefault();
    }
  });
  window.once('ready-to-show', () => window.show());
  window.loadURL(url);
  return window;
}

async function showFatalError(error) {
  const message = error instanceof Error ? error.message : 'The Label Station could not start.';
  await dialog.showMessageBox({ type: 'error', title: 'UpKeep Label Station', message, detail: 'Close the application and try again. No UpKeep changes were made.' });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    let trusted = false;
    try { trusted = Boolean(applicationOrigin) && new URL(details.url).origin === applicationOrigin; } catch {}
    if (trusted && sessionToken) details.requestHeaders['X-Label-Station-Token'] = sessionToken;
    callback({ requestHeaders: details.requestHeaders });
  });
  registerIpc();
  try {
    if (devUrl) {
      const parsed = new URL(devUrl);
      if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') throw new Error('Desktop development URL must be local.');
      applicationOrigin = parsed.origin;
    } else {
      await startPackagedServer();
    }
    mainWindow = secureWindow(applicationOrigin);
  } catch (error) {
    await showFatalError(error);
    app.quit();
  }
});

app.on('before-quit', () => { isQuitting = true; });
app.on('window-all-closed', () => app.quit());
app.on('quit', () => { if (serverProcess && serverProcess.exitCode === null) serverProcess.kill(); });
