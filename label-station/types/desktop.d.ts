type DesktopSettings = {
  configured: boolean;
  mode: 'fixture' | 'live';
  hasCredentials: boolean;
  hasApiKey: boolean;
  restartScheduled?: boolean;
};

interface Window {
  labelStationDesktop?: {
    getSettings: () => Promise<DesktopSettings>;
    saveSettings: (settings: { mode: 'fixture' | 'live'; email?: string; password?: string; removeApiKey?: boolean }) => Promise<DesktopSettings>;
  };
}
