import { defineConfig, devices } from '@playwright/test';

// The point of this repo: mobile device emulation. Journeys under tests/e2e/mobile/**
// run on a Pixel 7 (Chromium engine, Android characteristics) AND an iPhone 14
// (WebKit engine, iOS characteristics) - real mobile viewports with touch input.
// The rest of tests/e2e/** exercises the app on desktop Chrome.
export default defineConfig({
  testDir: './tests/e2e',
  // Only serialises tests WITHIN a file; different files/projects still run in parallel
  // (the `workers` default and the 4-way project matrix above are unaffected).
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
      testIgnore: '**/mobile/**',
    },
    {
      name: 'mobile-pixel', // Android / Chromium engine, touch
      use: { ...devices['Pixel 7'] },
      testMatch: '**/mobile/**',
    },
    {
      name: 'mobile-iphone', // iOS / WebKit engine, touch
      use: { ...devices['iPhone 14'] },
      testMatch: '**/mobile/**',
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
