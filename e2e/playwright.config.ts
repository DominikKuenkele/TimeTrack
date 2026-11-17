import { defineConfig, devices } from '@playwright/test';

// The stack is reached by its compose service names (see ../compose.e2e.yaml)
export const BASE_URL = process.env.BASE_URL ?? 'http://frontend:3000';

export default defineConfig({
    testDir: './tests',
    // One shared stack and one database: tests create uniquely named data, but run one at a time
    workers: 1,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    // On CI the retry records a trace, but a test that only passes on the retry still fails the job
    retries: process.env.CI ? 1 : 0,
    failOnFlakyTests: !!process.env.CI,
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'junit/junit.xml' }],
    ],
    expect: { timeout: 10_000 },
    use: {
        baseURL: BASE_URL,
        // The database and the backend run in UTC, so the browser does as well
        timezoneId: 'UTC',
        locale: 'en-US',
        trace: 'on-first-retry',
        actionTimeout: 10_000,
        ...devices['Desktop Chrome'],
        // The image only has the full Chromium, not Playwright's default headless shell (Dockerfile)
        channel: 'chromium',
        launchOptions: {
            args: ['--disable-dev-shm-usage'],
        },
    },
    projects: [
        { name: 'chromium', testMatch: /.*\.spec\.ts/ },
    ],
});
