import { expect, test } from '../support/fixtures';
import { uniqueName } from '../support/names';
import { activityItems, goToActivities, projectItem } from '../support/ui';

const timerSeconds = async (timer: import('@playwright/test').Locator) => {
    const [h, m, s] = (await timer.innerText()).split(':').map(Number);
    return h * 3600 + m * 60 + s;
};

test.describe('start and stop', () => {
    test('starts a project, runs the timer and stops it', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await page.reload();
        const item = projectItem(page, name);

        await item.getByRole('button', { name: 'Start' }).click();

        await expect(item).toContainText('Active');
        await expect(item.getByRole('button', { name: 'Start' })).toBeDisabled();
        await expect(item.getByRole('button', { name: 'Stop' })).toBeEnabled();
        await expect(item.getByRole('button', { name: 'Delete' })).toBeDisabled();
        const timer = item.locator('.timer-value');
        await expect(timer).toHaveText(/^00:00:\d\d$/);
        await expect.poll(() => timerSeconds(timer), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);

        await item.getByRole('button', { name: 'Stop' }).click();

        await expect(item).toContainText('Inactive');
        await expect(timer).toHaveCount(0);
        await expect(item.getByRole('button', { name: 'Start' })).toBeEnabled();
        await expect(item.getByRole('button', { name: 'Stop' })).toBeDisabled();
        // the runtime of the finished activity is added up
        await expect(item).toContainText(/Total Runtime: (2|3|4|5|6|7|8|9|\d\d)s/);
    });

    test('adds the runtime of every run', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await page.reload();
        const item = projectItem(page, name);

        for (let run = 0; run < 3; run++) {
            await item.getByRole('button', { name: 'Start' }).click();
            await expect(item).toContainText('Active');
            await item.getByRole('button', { name: 'Stop' }).click();
            await expect(item).toContainText('Inactive');
        }

        const today = new Date().toISOString().slice(0, 10);
        const activities = (await api.dailyActivities(today)).activities.filter((a) => a.projectName === name);
        expect(activities).toHaveLength(3);
        expect(activities.every((a) => a.endedAt !== null)).toBe(true);
    });

    test('starting a project stops the running one', async ({ login }) => {
        const { page, api } = await login('alice');
        const first = await api.createProject(uniqueName('first'));
        const second = await api.createProject(uniqueName('second'));
        await page.reload();

        await projectItem(page, first).getByRole('button', { name: 'Start' }).click();
        await expect(projectItem(page, first)).toContainText('Active');
        await projectItem(page, second).getByRole('button', { name: 'Start' }).click();

        await expect(projectItem(page, second)).toContainText('Active');
        await expect(projectItem(page, first)).toContainText('Inactive');
        await expect(page.locator('.project-item.active-project')).toHaveCount(1);
        // the active project moves to the top
        await expect(page.locator('.project-item').first()).toContainText(second);

        const today = new Date().toISOString().slice(0, 10);
        const activities = (await api.dailyActivities(today)).activities;
        const ofFirst = activities.filter((a) => a.projectName === first);
        const ofSecond = activities.filter((a) => a.projectName === second);
        expect(ofFirst).toHaveLength(1);
        expect(ofFirst[0].endedAt).not.toBeNull();
        expect(ofSecond).toHaveLength(1);
        expect(ofSecond[0].endedAt).toBeNull();
        // one ends exactly when the other starts
        expect(ofFirst[0].endedAt).toBe(ofSecond[0].startedAt);
    });

    test('a running project survives a reload', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await page.reload();
        const item = projectItem(page, name);
        await item.getByRole('button', { name: 'Start' }).click();
        await expect.poll(() => timerSeconds(item.locator('.timer-value')), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);

        await page.reload();

        await expect(item).toContainText('Active');
        // the timer continues with the time since the start instead of beginning at 0 again
        await expect.poll(() => timerSeconds(item.locator('.timer-value'))).toBeGreaterThanOrEqual(2);
        await expect(page.locator('.project-item').first()).toContainText(name);
    });

    test('a running project is also running in a second tab', async ({ login }) => {
        const { page, context, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await api.startProject(name);

        const other = await context.newPage();
        await other.goto('/projects');

        await expect(projectItem(other, name)).toContainText('Active');
        await projectItem(other, name).getByRole('button', { name: 'Stop' }).click();
        await page.reload();
        await expect(projectItem(page, name)).toContainText('Inactive');
    });

    test('the activity shows up on the activities page', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await page.reload();
        await projectItem(page, name).getByRole('button', { name: 'Start' }).click();
        await expect(projectItem(page, name)).toContainText('Active');

        await goToActivities(page);

        await expect(activityItems(page).filter({ hasText: name })).toHaveCount(1);
        // a running activity has no end yet
        await expect(activityItems(page).filter({ hasText: name }).locator('.activity-runtime div').nth(1)).toHaveText('');
    });
});

test.describe('invalid actions', () => {
    test('starting a running project fails', async ({ login }) => {
        const { api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await api.startProject(name);

        const response = await api.raw('POST', `/projects/${encodeURIComponent(name)}/start`);

        expect(response.status()).toBe(400);
        expect(await response.json()).toMatchObject({ message: 'project already started' });
        const today = new Date().toISOString().slice(0, 10);
        expect((await api.dailyActivities(today)).activities.filter((a) => a.projectName === name)).toHaveLength(1);
    });

    test('stopping a project that is not running fails', async ({ login }) => {
        const { api } = await login('alice');
        const name = await api.createProject(uniqueName());

        const response = await api.raw('POST', `/projects/${encodeURIComponent(name)}/stop`);

        expect(response.status()).toBe(400);
    });

    test('starting an unknown project fails', async ({ login }) => {
        const { api } = await login('alice');

        const response = await api.raw('POST', `/projects/${encodeURIComponent(uniqueName('missing'))}/start`);

        expect(response.status()).toBe(400);
    });

    test('a failed start leaves the running project alone', async ({ login }) => {
        const { api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await api.startProject(name);

        await api.raw('POST', `/projects/${encodeURIComponent(uniqueName('missing'))}/start`);

        const { activeProject } = await api.projects();
        expect(activeProject?.name).toBe(name);
    });

    test('unknown actions and methods are rejected', async ({ login }) => {
        const { api } = await login('alice');
        const name = await api.createProject(uniqueName());

        expect((await api.raw('POST', `/projects/${encodeURIComponent(name)}/pause`)).status()).toBe(400);
        expect((await api.raw('PUT', `/projects/${encodeURIComponent(name)}`)).status()).toBe(405);
    });
});
