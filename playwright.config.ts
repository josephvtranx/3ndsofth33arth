import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3101", channel: "chrome", trace: "retain-on-failure" },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "pnpm dev --port 3101",
    url: "http://localhost:3101",
    reuseExistingServer: false,
    env: { BROWSER_TEST_BUILD: "1", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "browser-test-key" },
  },
});
