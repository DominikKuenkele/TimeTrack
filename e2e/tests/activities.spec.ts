import { expect, test } from '../support/fixtures';
import { pastDay, shiftDayString, uniqueName } from '../support/names';
import {
    activityItem, activityItems, goToActivities, openChangeDialogue, readSummary, submitChange,
} from '../support/ui';

test.describe('list', () => {
    test('shows a message and no times for a day without activities', async ({ login }) => {
        const { page } = await login('alice');

        await goToActivities(page, pastDay());

        await expect(page.getByText('No activites found.')).toBeVisible();
        expect(await readSummary(page)).toMatchObject({ worktime: 0, breaktime: 0 });
    });

    test('lists the activities of the selected day by start time', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const [first, second] = [await api.createProject(uniqueName('first')), await api.createProject(uniqueName('second'))];
        // created in the opposite order
        const later = await api.seedActivity(second, day, '13:00', '14:15');
        const earlier = await api.seedActivity(first, day, '09:00', '10:30');

        await goToActivities(page, day);

        await expect(activityItems(page)).toHaveCount(2);
        await expect(activityItems(page).nth(0)).toContainText(first);
        await expect(activityItems(page).nth(0)).toContainText('09:00:00');
        await expect(activityItems(page).nth(0)).toContainText('10:30:00');
        await expect(activityItems(page).nth(1)).toContainText(second);
        await expect(activityItems(page).nth(1)).toContainText('13:00:00');
        await expect(activityItems(page).nth(1)).toContainText('14:15:00');
        await expect(activityItem(page, earlier.id)).toBeVisible();
        await expect(activityItem(page, later.id)).toBeVisible();
    });

    test('switches between days', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const nextDay = shiftDayString(day, 1);
        const name = await api.createProject(uniqueName());
        const onDay = await api.seedActivity(name, day, '09:00', '10:00');
        const onNextDay = await api.seedActivity(name, nextDay, '11:00', '12:00');
        await goToActivities(page, day);
        const dateInput = page.locator('input[type="date"]');

        await expect(activityItem(page, onDay.id)).toBeVisible();
        await expect(activityItem(page, onNextDay.id)).toHaveCount(0);

        await page.getByRole('button', { name: '▶' }).click();
        await expect(dateInput).toHaveValue(nextDay);
        await expect(activityItem(page, onNextDay.id)).toBeVisible();
        await expect(activityItem(page, onDay.id)).toHaveCount(0);

        await page.getByRole('button', { name: '◀' }).click();
        await expect(dateInput).toHaveValue(day);
        await expect(activityItem(page, onDay.id)).toBeVisible();

        await dateInput.fill(nextDay);
        await expect(activityItem(page, onNextDay.id)).toBeVisible();
    });

    test('starts on today', async ({ login }) => {
        const { page } = await login('alice', '/activities');

        await expect(page.locator('input[type="date"]')).toHaveValue(new Date().toISOString().slice(0, 10));
    });

    test('a day can be crossed at the end of the month and the year', async ({ login }) => {
        const { page } = await login('alice', '/activities');
        const dateInput = page.locator('input[type="date"]');

        await dateInput.fill('2019-12-31');
        await page.getByRole('button', { name: '▶' }).click();
        await expect(dateInput).toHaveValue('2020-01-01');

        await dateInput.fill('2020-03-01');
        await page.getByRole('button', { name: '◀' }).click();
        await expect(dateInput).toHaveValue('2020-02-29');
    });

    test('shows the total time of a project when pointing at an activity', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const name = await api.createProject(uniqueName());
        const first = await api.seedActivity(name, day, '09:00', '10:00');
        await api.seedActivity(name, day, '11:00', '11:30');
        await goToActivities(page, day);

        await activityItem(page, first.id).hover();

        await expect(activityItem(page, first.id).locator('.activity-total-runtime')).toHaveText('1h 30m 0s');
    });

    test('a new user has no projects and no activities', async ({ login }) => {
        const { page } = await login('fresh4', '/projects');
        await expect(page.getByText('No projects found.')).toBeVisible();

        await goToActivities(page);

        await expect(page.getByText('No activites found.')).toBeVisible();
        expect(await readSummary(page)).toEqual({ worktime: 0, breaktime: 0, overtime: 0 });
    });
});

test.describe('change', () => {
    test('changes start and end', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const name = await api.createProject(uniqueName());
        const activity = await api.seedActivity(name, day, '09:00', '10:00');
        await goToActivities(page, day);
        const item = activityItem(page, activity.id);

        await openChangeDialogue(item);
        await submitChange(item, { start: `${day}T09:30:00Z`, end: `${day}T11:00:00Z` });

        await expect(item.locator('.change-dialogue')).toHaveCount(0);
        await expect(item).toContainText('09:30:00');
        await expect(item).toContainText('11:00:00');
        expect((await readSummary(page)).worktime).toBe(90 * 60);
    });

    test('shows the current values in the dialogue', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const name = await api.createProject(uniqueName());
        const activity = await api.seedActivity(name, day, '09:00', '10:00');
        await goToActivities(page, day);
        const item = activityItem(page, activity.id);

        await openChangeDialogue(item);

        await expect(item.getByPlaceholder('Project name')).toHaveValue(name);
        await expect(item.getByPlaceholder('Start time')).toHaveValue(new RegExp(`^${day}T09:00:00`));
        await expect(item.getByPlaceholder('End time')).toHaveValue(new RegExp(`^${day}T10:00:00`));
    });

    test('changes the project', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const before = await api.createProject(uniqueName('before'));
        const after = await api.createProject(uniqueName('after'));
        const activity = await api.seedActivity(before, day, '09:00', '10:00');
        await goToActivities(page, day);
        const item = activityItem(page, activity.id);

        await openChangeDialogue(item);
        await submitChange(item, { project: after });

        await expect(item.getByRole('heading', { name: after })).toBeVisible();
        await expect(item.getByRole('heading', { name: before })).toHaveCount(0);
        const stored = (await api.dailyActivities(day)).activities;
        expect(stored.map((a) => [a.id, a.projectName])).toEqual([[activity.id, after]]);
    });

    test('moves an activity to another day', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const otherDay = shiftDayString(day, 3);
        const name = await api.createProject(uniqueName());
        const activity = await api.seedActivity(name, day, '09:00', '10:00');
        await goToActivities(page, day);
        const item = activityItem(page, activity.id);

        await openChangeDialogue(item);
        await submitChange(item, { start: `${otherDay}T09:00:00Z`, end: `${otherDay}T10:00:00Z` });

        await expect(item).toHaveCount(0);
        await expect(page.getByText('No activites found.')).toBeVisible();
        await page.locator('input[type="date"]').fill(otherDay);
        await expect(activityItem(page, activity.id)).toBeVisible();
    });

    test('cancel keeps the activity as it is', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const name = await api.createProject(uniqueName());
        const activity = await api.seedActivity(name, day, '09:00', '10:00');
        await goToActivities(page, day);
        const item = activityItem(page, activity.id);

        await openChangeDialogue(item);
        await item.getByPlaceholder('End time').fill(`${day}T12:00:00Z`);
        await item.getByRole('button', { name: 'Cancel' }).click();

        await expect(item.locator('.change-dialogue')).toHaveCount(0);
        await expect(item).toContainText('10:00:00');
        expect((await api.dailyActivities(day)).activities[0].endedAt).toBe(activity.endedAt);
    });

    test('the end of a running activity can be left empty', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await api.startProject(name);
        await goToActivities(page);
        const item = activityItems(page).filter({ hasText: name });

        await openChangeDialogue(item);
        await expect(item.getByPlaceholder('End time')).toHaveValue('');
        await submitChange(item, { project: name });

        await expect(item.locator('.change-dialogue')).toHaveCount(0);
        const { activeProject } = await api.projects();
        expect(activeProject?.name).toBe(name);
    });

    test.describe('invalid input', () => {
        const setup = async (login: (u: 'alice') => Promise<import('../support/fixtures').Session>) => {
            const { page, api } = await login('alice');
            const day = pastDay();
            const name = await api.createProject(uniqueName());
            const activity = await api.seedActivity(name, day, '09:00', '10:00');
            await goToActivities(page, day);
            const item = activityItem(page, activity.id);
            await openChangeDialogue(item);
            const unchanged = async () => {
                const stored = (await api.dailyActivities(day)).activities;
                expect(stored.map((a) => [a.projectName, a.startedAt, a.endedAt]))
                    .toEqual([[name, activity.startedAt, activity.endedAt]]);
            };
            return { page, api, day, name, item, unchanged };
        };

        test('an end before the start', async ({ login }) => {
            const { day, item, unchanged } = await setup(login);

            await submitChange(item, { start: `${day}T10:00:00Z`, end: `${day}T09:00:00Z` });

            await expect(item.locator('.change-error')).toContainText('Error:');
            await expect(item.locator('.change-dialogue')).toBeVisible();
            await unchanged();
        });

        test('a start that is not a time', async ({ login }) => {
            const { item, unchanged } = await setup(login);

            await submitChange(item, { start: 'half past nine' });

            await expect(item.locator('.change-error')).toHaveText('startedAt invalid');
            await unchanged();
        });

        test('an empty start', async ({ login }) => {
            const { item, unchanged } = await setup(login);

            await submitChange(item, { start: '' });

            await expect(item.locator('.change-error')).toHaveText('startedAt invalid');
            await unchanged();
        });

        test('an end that is not a time', async ({ login }) => {
            const { item, unchanged } = await setup(login);

            await submitChange(item, { end: '25:99' });

            await expect(item.locator('.change-error')).toHaveText('endedAt invalid');
            await unchanged();
        });

        test('an empty project', async ({ login }) => {
            const { item, unchanged } = await setup(login);

            await submitChange(item, { project: '   ' });

            await expect(item.locator('.change-error')).toHaveText('Project name cannot be empty.');
            await unchanged();
        });

        test('a project that does not exist', async ({ login }) => {
            const { item, unchanged } = await setup(login);

            await submitChange(item, { project: uniqueName('missing') });

            await expect(item.locator('.change-error')).toContainText('Error:');
            await unchanged();
        });

        test('the error is gone after a valid change', async ({ login }) => {
            const { day, item } = await setup(login);
            await submitChange(item, { start: 'nonsense' });
            await expect(item.locator('.change-error')).toBeVisible();

            await submitChange(item, { start: `${day}T09:10:00Z` });

            await expect(item.locator('.change-dialogue')).toHaveCount(0);
            await expect(item).toContainText('09:10:00');
        });

        test('an end equal to the start is allowed and has no duration', async ({ login }) => {
            const { page, day, item } = await setup(login);

            await submitChange(item, { start: `${day}T09:00:00Z`, end: `${day}T09:00:00Z` });

            await expect(item.locator('.change-dialogue')).toHaveCount(0);
            expect((await readSummary(page)).worktime).toBe(0);
        });
    });
});

test.describe('worktime and breaktime', () => {
    test('worktime spans the first start to the last end, break is the longest gap', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const name = await api.createProject(uniqueName());
        await api.seedActivity(name, day, '08:00', '12:00');
        await api.seedActivity(name, day, '13:00', '17:30');
        await goToActivities(page, day);

        expect(await readSummary(page)).toMatchObject({ worktime: 9.5 * 3600, breaktime: 3600 });
        await expect(page.locator('.activity-overview-total-runtime')).toContainText('Total Time: 9h 30m 0s (Break: 1h 0m 0s)');

        // a shorter gap doesn't add to the break
        await api.seedActivity(name, day, '17:45', '18:00');
        await page.reload();
        await page.locator('input[type="date"]').fill(day);
        await expect(page.locator('.activity-overview-total-runtime')).toContainText('Total Time: 10h 0m 0s (Break: 1h 0m 0s)');
    });

    test('a single activity has no break', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        await api.seedActivity(await api.createProject(uniqueName()), day, '09:00', '09:45');
        await goToActivities(page, day);

        expect(await readSummary(page)).toMatchObject({ worktime: 45 * 60, breaktime: 0 });
    });

    test('overlapping activities have no break', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const name = await api.createProject(uniqueName());
        await api.seedActivity(name, day, '09:00', '11:00');
        await api.seedActivity(name, day, '10:00', '12:00');
        await goToActivities(page, day);

        expect(await readSummary(page)).toMatchObject({ worktime: 3 * 3600, breaktime: 0 });
    });

    test('are recalculated after a change', async ({ login }) => {
        const { page, api } = await login('alice');
        const day = pastDay();
        const name = await api.createProject(uniqueName());
        await api.seedActivity(name, day, '08:00', '12:00');
        const second = await api.seedActivity(name, day, '13:00', '17:00');
        await goToActivities(page, day);
        expect(await readSummary(page)).toMatchObject({ worktime: 9 * 3600, breaktime: 3600 });

        const item = activityItem(page, second.id);
        await openChangeDialogue(item);
        await submitChange(item, { start: `${day}T14:00:00Z`, end: `${day}T18:00:00Z` });

        await expect.poll(() => readSummary(page)).toMatchObject({ worktime: 10 * 3600, breaktime: 2 * 3600 });
    });

    test('the running activity does not count until it ends', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await api.startProject(name);
        await goToActivities(page);

        const summary = await readSummary(page);

        expect(summary.worktime).toBe(0);
        expect(summary.breaktime).toBe(0);
    });
});

// The overtime sums up the days of a user (worktime - break - 8h each), so these tests need a user nobody else
// worked as. The days a test creates stay, so they must not be repeated: no retries.
test.describe('overtime', () => {
    test.describe.configure({ retries: 0 });

    // The activities are created today and then moved to the day, which leaves a row for today in the
    // worktime (close to 0 hours). That is why the tests compare the overtime before and after a change.
    const tolerance = 5;

    test('is the sum of the days and follows the changes', async ({ login }) => {
        const { page, api } = await login('fresh1', '/activities');
        const day = pastDay();
        const otherDay = shiftDayString(day, 10);
        const name = await api.createProject(uniqueName());
        expect((await readSummary(page)).overtime).toBe(0);

        // exactly the 8 hours of a day
        const first = await api.seedActivity(name, day, '09:00', '17:00');
        await goToActivities(page, day);
        const base = (await readSummary(page)).overtime;
        expect((await readSummary(page)).worktime).toBe(8 * 3600);

        // one more hour on that day
        const item = activityItem(page, first.id);
        await openChangeDialogue(item);
        await submitChange(item, { end: `${day}T18:00:00Z` });
        await expect.poll(async () => (await readSummary(page)).overtime).toBe(base + 3600);

        // a second activity after a break adds its time but not the break
        await api.seedActivity(name, day, '19:00', '19:30');
        await page.reload();
        await page.locator('input[type="date"]').fill(day);
        await expect.poll(async () => Math.abs((await readSummary(page)).overtime - (base + 3600 + 1800))).toBeLessThanOrEqual(tolerance);
        const afterSecond = (await readSummary(page)).overtime;

        // a short day lowers the overtime of all days, which is shown on every day
        await api.seedActivity(name, otherDay, '09:00', '15:00');
        await page.reload();
        await page.locator('input[type="date"]').fill(otherDay);
        await expect.poll(async () => Math.abs((await readSummary(page)).overtime - (afterSecond - 2 * 3600))).toBeLessThanOrEqual(tolerance);
        await page.locator('input[type="date"]').fill(day);
        await expect.poll(async () => Math.abs((await readSummary(page)).overtime - (afterSecond - 2 * 3600))).toBeLessThanOrEqual(tolerance);

        await expect(activityItem(page, first.id)).toBeVisible();
    });
});
