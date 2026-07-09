import { defineConfig, devices } from "playwright/test";

const basePath = "/upkeep-sso-upgrade";
const host = "127.0.0.1";
const port = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: "line",
  use: {
    baseURL: `http://${host}:${port}${basePath}`,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: `npm run dev -- --hostname ${host} --port ${port}`,
    env: {
      NEXT_PUBLIC_BASE_PATH: basePath
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: `http://${host}:${port}${basePath}/`
  }
});
