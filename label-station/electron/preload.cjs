const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('labelStationDesktop', Object.freeze({
  getSettings: () => ipcRenderer.invoke('label-station:get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('label-station:save-settings', {
    mode: settings?.mode,
    email: typeof settings?.email === 'string' ? settings.email : '',
    password: typeof settings?.password === 'string' ? settings.password : '',
    removeApiKey: settings?.removeApiKey === true
  })
}));
