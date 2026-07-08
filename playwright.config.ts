import { defineConfig, devices } from '@playwright/test';

// MF-01 scaffold: a single desktop-chromium project proves the wiring.
// The mobile device-emulation projects (Pixel / iPhone descriptors, touch)
// are the point of this repo and land with the E2E suite in MF-10/MF-11.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Serve the built app: deterministic, no HMR, same artefact Pages will host.
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
