import { expect, test } from '../support/fixtures';
import { pastDay, uniqueName } from '../support/names';
import { activityItem, activityItems, createProject, goToActivities, projectItem, readSummary, reloadActivities, searchProjects } from '../support/ui';

test.describe('two users', () => {
    test('do not see each others projects', async ({ login }) => {
        const alice = await login('alice');
        const bob = await login('bob');
        const aliceProject = await alice.api.createProject(uniqueName('alice'));
        const bobProject = await bob.api.createProject(uniqueName('bob'));

        await alice.page.reload();
        await bob.page.reload();

        await expect(projectItem(alice.page, aliceProject)).toBeVisible();
        await expect(projectItem(alice.page, bobProject)).toHaveCount(0);
        await expect(projectItem(bob.page, bobProject)).toBeVisible();
        await expect(projectItem(bob.page, aliceProject)).toHaveCount(0);

        await searchProjects(bob.page, aliceProject);
        await expect(bob.page.getByText('No projects found.')).toBeVisible();
        expect((await bob.api.projects(aliceProject)).total).toBe(0);
        expect((await bob.api.projects()).projects.map((p) => p.name)).not.toContain(aliceProject);
    });

    test('can use the same project name', async ({ login }) => {
        const alice = await login('alice');
        const bob = await login('bob');
        const name = uniqueName('shared');

        await alice.api.createProject(name);
        await alice.page.reload();
        await bob.page.reload();
        await createProject(bob.page, name);

        await expect(projectItem(bob.page, name)).toBeVisible();
        await expect(bob.page.locator('.create-project-form .error')).toHaveCount(0);

        // deleting one does not touch the other
        await alice.api.deleteProject(name);
        expect((await bob.api.projects(name)).total).toBe(1);
        expect((await alice.api.projects(name)).total).toBe(0);
    });

    test('run their projects independently', async ({ login }) => {
        const alice = await login('alice');
        const bob = await login('bob');
        const aliceProject = await alice.api.createProject(uniqueName('alice'));
        const bobProject = await bob.api.createProject(uniqueName('bob'));
        await alice.page.reload();
        await bob.page.reload();

        await projectItem(alice.page, aliceProject).getByRole('button', { name: 'Start' }).click();
        await projectItem(bob.page, bobProject).getByRole('button', { name: 'Start' }).click();
        await expect(projectItem(alice.page, aliceProject)).toContainText('Active');
        await expect(projectItem(bob.page, bobProject)).toContainText('Active');

        // starting a project of one user does not stop the project of the other
        expect((await alice.api.projects()).activeProject?.name).toBe(aliceProject);
        expect((await bob.api.projects()).activeProject?.name).toBe(bobProject);

        await projectItem(bob.page, bobProject).getByRole('button', { name: 'Stop' }).click();
        await expect(projectItem(bob.page, bobProject)).toContainText('Inactive');
        expect((await alice.api.projects()).activeProject?.name).toBe(aliceProject);
    });

    test('do not see each others activities', async ({ login }) => {
        const alice = await login('alice');
        const bob = await login('bob');
        const day = pastDay();
        const aliceProject = await alice.api.createProject(uniqueName('alice'));
        const bobProject = await bob.api.createProject(uniqueName('bob'));
        const aliceActivity = await alice.api.seedActivity(aliceProject, day, '09:00', '12:00');
        const bobActivity = await bob.api.seedActivity(bobProject, day, '10:00', '11:00');

        await goToActivities(alice.page, day);
        await goToActivities(bob.page, day);

        await expect(activityItems(alice.page)).toHaveCount(1);
        await expect(activityItem(alice.page, aliceActivity.id)).toBeVisible();
        await expect(activityItems(bob.page)).toHaveCount(1);
        await expect(activityItem(bob.page, bobActivity.id)).toBeVisible();
        expect((await alice.api.dailyActivities(day)).activities.map((a) => a.id)).toEqual([aliceActivity.id]);
        expect((await bob.api.dailyActivities(day)).activities.map((a) => a.id)).toEqual([bobActivity.id]);
        // also the sums are per user
        expect(await readSummary(alice.page)).toMatchObject({ worktime: 3 * 3600 });
        expect(await readSummary(bob.page)).toMatchObject({ worktime: 3600 });
    });

    test('cannot start, stop or delete the project of the other', async ({ login }) => {
        const alice = await login('alice');
        const bob = await login('bob');
        const name = await alice.api.createProject(uniqueName('alice'));
        await alice.api.startProject(name);
        const path = `/projects/${encodeURIComponent(name)}`;

        expect((await bob.api.raw('POST', `${path}/start`)).status()).toBe(400);
        expect((await bob.api.raw('POST', `${path}/stop`)).status()).toBe(400);
        expect((await bob.api.raw('DELETE', path)).status()).toBe(400);
        expect((await bob.api.raw('GET', path)).status()).toBe(400);

        const { activeProject } = await alice.api.projects();
        expect(activeProject?.name).toBe(name);
    });

    test('cannot use the project of the other for an activity', async ({ login }) => {
        const alice = await login('alice');
        const bob = await login('bob');
        const day = pastDay();
        const aliceProject = await alice.api.createProject(uniqueName('alice'));
        const bobActivity = await bob.api.seedActivity(await bob.api.createProject(uniqueName('bob')), day, '09:00', '10:00');

        const response = await bob.api.changeActivity(bobActivity.id, {
            projectName: aliceProject, startedAt: bobActivity.startedAt, endedAt: bobActivity.endedAt,
        });

        expect(response.status()).toBe(400);
        expect((await alice.api.dailyActivities(day)).activities).toHaveLength(0);
    });

    test('cannot change the activity of the other', async ({ login }) => {
        const alice = await login('alice');
        const bob = await login('bob');
        const day = pastDay();
        const aliceActivity = await alice.api.seedActivity(await alice.api.createProject(uniqueName('alice')), day, '09:00', '10:00');
        const bobProject = await bob.api.createProject(uniqueName('bob'));

        const response = await bob.api.changeActivity(aliceActivity.id, {
            projectName: bobProject, startedAt: aliceActivity.startedAt, endedAt: aliceActivity.endedAt,
        });

        expect(response.ok()).toBe(false);
        expect((await alice.api.dailyActivities(day)).activities.map((a) => a.id)).toEqual([aliceActivity.id]);
    });

    test('have their own overtime', async ({ login }) => {
        const first = await login('fresh2', '/activities');
        const second = await login('fresh3', '/activities');
        const day = pastDay();
        await first.api.seedActivity(await first.api.createProject(uniqueName()), day, '09:00', '12:00');

        await reloadActivities(first.page);
        await reloadActivities(second.page);

        expect((await readSummary(first.page)).overtime).not.toBe(0);
        expect((await readSummary(second.page)).overtime).toBe(0);
    });
});
