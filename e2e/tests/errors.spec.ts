import { Page, Route } from '@playwright/test';
import { API_URL, AUTHENTIK_URL, BASE_URL } from '../support/env';
import { projectsHeading } from '../support/auth';
import { expect, test } from '../support/fixtures';
import { pastDay, uniqueName } from '../support/names';
import { activityItem, createProject, goToActivities, openChangeDialogue, projectItem, submitChange } from '../support/ui';

// Answers like the backend would, so that the browser accepts the response (CORS)
const respond = (route: Route, status: number) => route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': BASE_URL, 'Access-Control-Allow-Credentials': 'true' },
    body: JSON.stringify({ error: 'Internal Error', message: 'something broke' }),
});

// Lets the requests with another method (and the CORS preflight) through to the backend
const failRequests = (page: Page, method: string, url: RegExp, how: number | 'unreachable' = 500) =>
    page.route(url, (route) => {
        if (route.request().method() !== method) return route.fallback();
        return how === 'unreachable' ? route.abort('connectionrefused') : respond(route, how);
    });

const projectListUrl = /\/projects\/\?/;
const projectUrl = /\/projects\/[^/?]+$/;
const startUrl = /\/projects\/[^/]+\/start$/;
const activitiesUrl = /\/activities\/\?/;
const activityUrl = /\/activities\/\d+$/;

test.describe('backend returns an error', () => {
    test('the project list shows it', async ({ login }) => {
        const { page } = await login('alice');
        await failRequests(page, 'GET', projectListUrl);

        await page.reload();

        await expect(page.locator('.project-overview-error')).toContainText('Error: API request failed: Internal Server Error');
        await expect(page.locator('.project-item')).toHaveCount(0);
    });

    test('the activity list shows it', async ({ login }) => {
        const { page } = await login('alice');
        await goToActivities(page);
        await failRequests(page, 'GET', activitiesUrl);

        await page.reload();

        await expect(page.locator('.activity-overview-error')).toContainText('Error: API request failed: Internal Server Error');
    });

    test('creating a project shows it and keeps the name', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = uniqueName();
        await failRequests(page, 'POST', projectUrl);

        await createProject(page, name);

        await expect(page.locator('.create-project-form .error')).toContainText('Error: API request failed');
        await expect(page.getByPlaceholder('New project name')).toHaveValue(name);
        await expect(projectItem(page, name)).toHaveCount(0);
        expect((await api.projects(name)).total).toBe(0);
        // the button is usable again
        await expect(page.getByRole('button', { name: 'Create Project' })).toBeEnabled();
    });

    test('starting a project shows it at the project', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        const other = await api.createProject(uniqueName());
        await page.reload();
        await failRequests(page, 'POST', startUrl);

        await projectItem(page, name).getByRole('button', { name: 'Start' }).click();

        await expect(projectItem(page, name).locator('.error')).toContainText('API request failed');
        await expect(projectItem(page, name)).toContainText('Inactive');
        // the other projects don't show the error
        await expect(projectItem(page, other).locator('.error')).toHaveCount(0);
    });

    test('deleting a project shows it in the confirmation', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await page.reload();
        await failRequests(page, 'DELETE', projectUrl);
        const item = projectItem(page, name);

        await item.getByRole('button', { name: 'Delete' }).click();
        await item.getByRole('button', { name: 'Yes, Delete' }).click();

        await expect(item.locator('.confirmation-error')).toContainText('API request failed');
        await expect(item).toBeVisible();
        expect((await api.projects(name)).total).toBe(1);
    });

    test('changing an activity shows it in the dialogue', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const activity = await api.seedActivity(await api.createProject(uniqueName()), day, '09:00', '10:00');
        await goToActivities(page, day);
        await failRequests(page, 'POST', activityUrl);
        const item = activityItem(page, activity.id);

        await openChangeDialogue(item);
        await submitChange(item, { end: `${day}T11:00:00Z` });

        await expect(item.locator('.change-error')).toContainText('Error: API request failed');
        await expect(item.locator('.change-dialogue')).toBeVisible();
        expect((await api.dailyActivities(day)).activities[0].endedAt).toBe(activity.endedAt);
    });
});

test.describe('backend is not reachable', () => {
    test('the project list shows it and recovers', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await page.route(`${API_URL}/**`, (route) => route.abort('connectionrefused'));

        await page.reload();

        await expect(page.locator('.project-overview-error')).toContainText('Error:');
        await expect(page.locator('.project-item')).toHaveCount(0);

        await page.unroute(`${API_URL}/**`);
        await page.reload();

        await expect(page.locator('.project-overview-error')).toHaveCount(0);
        await expect(projectItem(page, name)).toBeVisible();
    });

    test('the activity list shows it', async ({ login }) => {
        const { page } = await login('alice');
        await goToActivities(page);
        await failRequests(page, 'GET', activitiesUrl, 'unreachable');

        await page.reload();

        await expect(page.locator('.activity-overview-error')).toContainText('Error:');
    });

    test('creating, starting and changing show it', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await page.reload();
        await failRequests(page, 'POST', /\/projects\//, 'unreachable');

        await createProject(page, uniqueName());
        await expect(page.locator('.create-project-form .error')).toContainText('Error:');

        await projectItem(page, name).getByRole('button', { name: 'Start' }).click();
        await expect(projectItem(page, name).locator('.error')).toContainText('Error:');
        await expect(projectItem(page, name)).toContainText('Inactive');
    });
});

test.describe('token is not accepted', () => {
    for (const reason of ['is not a token', 'has expired'] as const) {
        test(`logs in again when the token ${reason}`, async ({ login }) => {
            const { page, api } = await login('alice');
            const name = await api.createProject(uniqueName());
            await page.evaluate((spoilExpiry) => {
                const key = Object.keys(window.localStorage).find((k) => k.startsWith('oidc.user:')) as string;
                const user = JSON.parse(window.localStorage.getItem(key) as string);
                if (spoilExpiry) user.expires_at = Math.floor(Date.now() / 1000) - 3600;
                else user.access_token = 'not-a-token';
                window.localStorage.setItem(key, JSON.stringify(user));
            }, reason === 'has expired');

            // the app is sent to Authentik, whose session is still valid, and comes back with a new token
            const authorize = page.waitForRequest((request) => request.url().startsWith(AUTHENTIK_URL) && request.url().includes('/authorize'));
            await page.reload();
            await authorize;

            await expect(projectsHeading(page)).toBeVisible({ timeout: 30_000 });
            await expect(projectItem(page, name)).toBeVisible();
        });
    }
});
