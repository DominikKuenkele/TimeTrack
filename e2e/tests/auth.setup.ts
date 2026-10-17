import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test as setup } from '@playwright/test';
import { login } from '../support/auth';
import { BASE_URL } from '../support/env';
import { storageStatePath, UserKey, users } from '../support/users';

// Logs every test user in once through the Authentik form and keeps the Authentik session (cookies) for the
// tests. The access token of the app is not kept: it expires after a few minutes, and the app gets a new one
// from the session on every start.
for (const [key, username] of Object.entries(users)) {
    setup(`login ${username}`, async ({ browser }) => {
        setup.setTimeout(120_000);

        const context = await browser.newContext({ baseURL: BASE_URL, timezoneId: 'UTC', locale: 'en-US' });
        const page = await context.newPage();

        // Authentik applies the blueprint with the users shortly after it is healthy
        await expect(async () => {
            await page.context().clearCookies();
            await login(page, username);
        }).toPass({ timeout: 90_000, intervals: [2_000, 5_000] });

        const { cookies } = await context.storageState();
        expect(cookies.length).toBeGreaterThan(0);
        const path = storageStatePath(key as UserKey);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, JSON.stringify({ cookies, origins: [] }));
        await context.close();
    });
}
