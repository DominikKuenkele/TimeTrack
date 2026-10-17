import { expect, test as setup } from '@playwright/test';
import { login } from '../support/auth';
import { BASE_URL } from '../support/env';
import { storageStatePath, UserKey, users } from '../support/users';

// Logs every test user in once through the Dex form and keeps the token of the app (local storage) for the tests.
// Dex keeps no login session, but its tokens last a day (config.e2e.yaml).
for (const [key, email] of Object.entries(users)) {
    setup(`login ${email}`, async ({ browser }) => {
        const context = await browser.newContext({ baseURL: BASE_URL, timezoneId: 'UTC', locale: 'en-US' });
        const page = await context.newPage();

        await login(page, email);

        const state = await context.storageState({ path: storageStatePath(key as UserKey) });
        expect(state.origins.flatMap((origin) => origin.localStorage).some(({ name }) => name.startsWith('oidc.user:'))).toBe(true);
        await context.close();
    });
}
