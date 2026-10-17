import { BrowserContext, Page, test as base } from '@playwright/test';
import { Api } from './api';
import { projectsHeading } from './auth';
import { BASE_URL } from './env';
import { storageStatePath, UserKey } from './users';

export interface Session {
    context: BrowserContext;
    page: Page;
    api: Api;
}

interface Fixtures {
    // Opens the app as a user, logged in by the Authentik session saved by auth.setup.ts
    login: (user: UserKey, path?: string) => Promise<Session>;
}

export const test = base.extend<Fixtures>({
    login: async ({ browser }, use) => {
        const sessions: Session[] = [];

        await use(async (user, path = '/projects') => {
            const context = await browser.newContext({
                baseURL: BASE_URL,
                storageState: storageStatePath(user),
                timezoneId: 'UTC',
                locale: 'en-US',
            });
            const page = await context.newPage();
            // The saved state only holds the Authentik session: the app sends the browser to Authentik,
            // which sends it right back with a new token
            await page.goto(path);
            await projectsHeading(page).or(page.getByRole('heading', { name: 'Activities', level: 2 })).waitFor({ timeout: 30_000 });

            const session = { context, page, api: new Api(page, context.request) };
            sessions.push(session);
            return session;
        });

        for (const { api, context } of sessions) {
            await api.cleanup().catch(() => { /* the session may have ended in the test */ });
            await context.close();
        }
    },
});

export { expect } from '@playwright/test';
