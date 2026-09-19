import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // WASM init is heavy — run sequentially to avoid port conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
            : {}),
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
  ],

  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        // Support-prompt tests (support-prompt.spec.ts, a11y.spec.ts's "support
        // prompt" case) only exercise real app behavior when this is set — it
        // gates the modal in PdfPreview.tsx. Without it those tests can only
        // self-skip, since the feature they're testing doesn't exist to test.
        // A placeholder here is fine: it's never deployed, only read by the
        // local/CI dev server this config spins up for e2e runs.
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPPORT_URL: 'https://github.com/sponsors/dperezarbues',
        },
      },
})
