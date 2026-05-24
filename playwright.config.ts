/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for LMS E2E Testing
 * PASS test vẫn có video + trace để xem lại bằng show-report
 */

export default defineConfig({
  testDir: './e2e',

  /* Global setup */
  globalSetup: './e2e/global-setup.ts',

  /* Parallel */
  fullyParallel: true,

  /* CI protection */
  forbidOnly: !!process.env.CI,

  /* Retry */
  retries: process.env.CI ? 2 : 1,

  /* Workers */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter */
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],

  /* Shared settings */
  use: {
    baseURL: 'http://localhost:5173',

    /* PASS test vẫn record */
    trace: 'on',
    video: 'on',
    screenshot: 'on',

    viewport: { width: 1280, height: 720 },

    actionTimeout: 10000,
    navigationTimeout: 30000,

    headless: true,

    ignoreHTTPSErrors: true,
  },

  projects: [
    /**
     * AUTH SETUP
     */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /**
     * PUBLIC
     */
    {
      name: 'public',
      testMatch: /public-pages\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    /**
     * STUDENT
     */
    {
      name: 'student',
      testMatch: /student-flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/student.json',
      },
      dependencies: ['setup'],
    },

    /**
     * TEACHER
     */
    {
      name: 'teacher',
      testMatch: /teacher-flow\.spec\.ts|ai-ingest-flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/teacher.json',
      },
      dependencies: ['setup'],
    },

    /**
     * ADMIN
     */
    {
      name: 'admin',
      testMatch: /admin-flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    /**
     * MOBILE
     */
    {
      name: 'mobile',
      testMatch: /mobile-.*\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
      },
    },

    /**
     * CROSS BROWSER
     */
    {
      name: 'cross-browser-chromium',
      testMatch: /critical-path\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'cross-browser-firefox',
      testMatch: /critical-path\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'cross-browser-webkit',
      testMatch: /critical-path\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],

  /* Optional auto run dev server */
  /*
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  */
});