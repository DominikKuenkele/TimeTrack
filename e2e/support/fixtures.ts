import { BrowserContext, Page, test as base } from '@playwright/test';
import { Api } from './api';
import { authHeaders, projectsHeading } from './auth';
import { BASE_URL } from './env';
import { UserKey, users } from './users';

export interface Session {
    context: BrowserContext;
    page: Page;
    api: Api;
}

interface Fixtures {
    // Opens the app as a user, whose every request carries the headers of forward auth
    login: (user: UserKey, path?: string) => Promise<Session>;
}

export const test = base.extend<Fixtures>({
    login: async ({ browser }, use) => {
        const sessions: Session[] = [];

        await use(async (user, path = '/projects') => {
            const context = await browser.newContext({
                baseURL: BASE_URL,
                extraHTTPHeaders: authHeaders(users[user]),
                timezoneId: 'UTC',
                locale: 'en-US',
            });
            const page = await context.newPage();
            await page.goto(path);
            // the activities page also has to load the activities of the day, before its summary means anything
            await projectsHeading(page).or(page.locator('.activity-overview[data-day]')).waitFor({ timeout: 30_000 });

            const session = { context, page, api: new Api(context.request) };
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
