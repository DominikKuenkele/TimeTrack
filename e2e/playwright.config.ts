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
        // For both projects: the logins of the setup need the same browser as the tests. The full Chromium, as the
        // headless shell (Playwright's default) ignores the secure origin flag below.
        channel: 'chromium',
        launchOptions: {
            args: [
                '--disable-dev-shm-usage',
                // oidc-client-ts needs crypto.subtle (PKCE), which browsers only offer on https and
                // localhost; the app is served by its service name here
                `--unsafely-treat-insecure-origin-as-secure=${BASE_URL}`,
            ],
        },
    },
    projects: [
        { name: 'setup', testMatch: /auth\.setup\.ts/ },
        { name: 'chromium', dependencies: ['setup'], testMatch: /.*\.spec\.ts/ },
    ],
});
