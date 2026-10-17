import { expect, test } from '../support/fixtures';
import { uniqueName } from '../support/names';
import { createProject, projectItem, searchProjects } from '../support/ui';

test.describe('create', () => {
    test('adds an inactive project to the list', async ({ login }) => {
        const { page } = await login('alice');
        const name = uniqueName();

        await createProject(page, name);

        const item = projectItem(page, name);
        await expect(item).toBeVisible();
        await expect(item).toContainText('Inactive');
        await expect(item).toContainText('Total Runtime: 0s');
        await expect(page.getByPlaceholder('New project name')).toHaveValue('');
    });

    test('does not allow an empty or blank name', async ({ login }) => {
        const { page, api } = await login('alice');
        const before = (await api.projects()).total;
        const button = page.getByRole('button', { name: 'Create Project' });

        await expect(button).toBeDisabled();
        await page.getByPlaceholder('New project name').fill('   ');
        await expect(button).toBeDisabled();
        await page.getByPlaceholder('New project name').press('Enter');

        expect((await api.projects()).total).toBe(before);
    });

    test('rejects a duplicate name', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = uniqueName();
        await api.createProject(name);
        await page.reload();

        await createProject(page, name);

        await expect(page.locator('.create-project-form .error')).toContainText('Error:');
        expect((await api.projects(name)).total).toBe(1);
    });

    test('names are case sensitive', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = uniqueName('Case');

        await createProject(page, name);
        await expect(projectItem(page, name)).toBeVisible();
        await createProject(page, name.toLowerCase());

        await expect(projectItem(page, name.toLowerCase())).toBeVisible();
        expect((await api.projects(name)).total).toBe(2);
    });

    // The name travels percent-encoded in the path of the request
    const specialNames = [
        'with spaces  inside',
        'ümläute & Café',
        '日本語プロジェクト',
        'emoji 🚀⏱️',
        'q?x=1&y=2#frag',
        'plus+and=equals',
        '"quotes" and \'apostrophes\'',
        '<img src=x onerror=alert(1)>',
        'back\\slash',
        'dots..and..more',
        // decoded once only, not turned into "A"
        '%41',
        '100%',
    ];
    for (const special of specialNames) {
        test(`handles the name "${special}"`, async ({ login }) => {
            const { page } = await login('alice');
            const name = `${uniqueName()} ${special}`;

            await createProject(page, name);

            await expect(projectItem(page, name)).toBeVisible();
            // it is the real name, also after loading the list again
            await page.reload();
            await searchProjects(page, name.slice(0, 10));
            await expect(projectItem(page, name)).toBeVisible();

            await projectItem(page, name).getByRole('button', { name: 'Start' }).click();
            await expect(projectItem(page, name)).toContainText('Active');
            await projectItem(page, name).getByRole('button', { name: 'Stop' }).click();
            await projectItem(page, name).getByRole('button', { name: 'Delete' }).click();
            await projectItem(page, name).getByRole('button', { name: 'Yes, Delete' }).click();
            await expect(projectItem(page, name)).toHaveCount(0);
        });
    }

    // Project names must not contain a slash
    for (const rejected of ['with/slash', '<b>html</b>']) {
        test(`rejects the name "${rejected}" with an error`, async ({ login }) => {
            const { page, api } = await login('alice');
            const name = `${uniqueName()}-${rejected}`;

            await createProject(page, name);

            await expect(page.locator('.create-project-form .error')).toHaveText("Error: Project name must not contain '/'.");
            await expect(projectItem(page, name)).toHaveCount(0);
            expect((await api.projects(name.slice(0, 10))).projects.map((p) => p.name)).not.toContain(name);
        });
    }

    test('the API rejects a slash in the name instead of reading it as a path', async ({ login }) => {
        const { api } = await login('alice');
        const name = await api.createProject(uniqueName());

        // "<name>/start" as one encoded segment is a name, not the start of <name>
        const response = await api.raw('POST', `/projects/${encodeURIComponent(`${name}/start`)}`);

        expect(response.status()).toBe(400);
        const { activeProject, projects } = await api.projects(name);
        expect(activeProject).toBeUndefined();
        expect(projects.map((p) => p.name)).toEqual([name]);
    });
});

test.describe('delete', () => {
    test('asks for a confirmation and deletes the project', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await page.reload();
        const item = projectItem(page, name);

        await item.getByRole('button', { name: 'Delete' }).click();
        await expect(item).toContainText(`Are you sure you want to delete ${name}?`);
        await item.getByRole('button', { name: 'Cancel' }).click();
        await expect(item).not.toContainText('Are you sure');
        expect((await api.projects(name)).total).toBe(1);

        await item.getByRole('button', { name: 'Delete' }).click();
        await item.getByRole('button', { name: 'Yes, Delete' }).click();

        await expect(item).toHaveCount(0);
        expect((await api.projects(name)).total).toBe(0);
    });

    test('a running project cannot be deleted', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await api.startProject(name);
        await page.reload();

        await expect(projectItem(page, name).getByRole('button', { name: 'Delete' })).toBeDisabled();
    });

    test('the name can be used again afterwards', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await api.deleteProject(name);
        await page.reload();

        await createProject(page, name);

        await expect(projectItem(page, name)).toBeVisible();
    });

    test('deleting an unknown project fails', async ({ login }) => {
        const { api } = await login('alice');

        const response = await api.raw('DELETE', `/projects/${encodeURIComponent(uniqueName('missing'))}`);

        expect(response.status()).toBe(400);
    });

    test('also deletes the activities of the project', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName());
        await api.startProject(name);
        await api.stopProject(name);
        const today = new Date().toISOString().slice(0, 10);
        expect((await api.dailyActivities(today)).activities.map((a) => a.projectName)).toContain(name);
        await page.reload();

        await projectItem(page, name).getByRole('button', { name: 'Delete' }).click();
        await projectItem(page, name).getByRole('button', { name: 'Yes, Delete' }).click();
        await expect(projectItem(page, name)).toHaveCount(0);

        expect((await api.dailyActivities(today)).activities.map((a) => a.projectName)).not.toContain(name);
    });
});

test.describe('search', () => {
    test('finds projects by a part of the name, ignoring the case', async ({ login }) => {
        const { page, api } = await login('alice');
        const base = uniqueName('Search');
        const hit = await api.createProject(`${base}-Alpha`);
        const other = await api.createProject(`${base}-beta`);
        await page.reload();

        await searchProjects(page, `${base}-ALPHA`.toLowerCase());
        await expect(projectItem(page, hit)).toBeVisible();
        await expect(projectItem(page, other)).toHaveCount(0);

        await searchProjects(page, `${base}-`);
        await expect(projectItem(page, hit)).toBeVisible();
        await expect(projectItem(page, other)).toBeVisible();
    });

    test('shows a message when nothing matches', async ({ login }) => {
        const { page } = await login('alice');

        await searchProjects(page, uniqueName('does-not-exist'));

        await expect(page.getByText('No projects found.')).toBeVisible();
    });

    test('finds unicode names', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(`${uniqueName()}-Übung`);
        await page.reload();

        await searchProjects(page, 'übung');

        await expect(projectItem(page, name)).toBeVisible();
    });

    test('finds the running project too', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName('Running'));
        await api.startProject(name);
        await page.reload();

        await searchProjects(page, name);

        await expect(projectItem(page, name)).toContainText('Active');
        await searchProjects(page, uniqueName('none'));
        await expect(projectItem(page, name)).toHaveCount(0);
    });

    test('goes back to the first page', async ({ login }) => {
        const { page, api } = await login('alice');
        const base = uniqueName('Back');
        for (const i of [1, 2, 3]) await api.createProject(`${base}-${i}`);
        await page.reload();
        await searchProjects(page, base);
        await page.locator('#per-page').fill('1');
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Page 2 of 3')).toBeVisible();

        await searchProjects(page, `${base}-1`);

        await expect(page.getByText('Page 1 of 1')).toBeVisible();
    });
});

test.describe('paging', () => {
    const create = async (api: { createProject: (n: string) => Promise<string> }, base: string, count: number) => {
        const names: string[] = [];
        for (let i = 1; i <= count; i++) names.push(await api.createProject(`${base}-${i}`));
        return names;
    };

    test('splits the projects into pages, newest first', async ({ login }) => {
        const { page, api } = await login('alice');
        const base = uniqueName('Page');
        const names = await create(api, base, 5);
        await page.reload();
        await searchProjects(page, base);
        await page.locator('#per-page').fill('2');

        await expect(page.getByText('Page 1 of 3')).toBeVisible();
        await expect(page.getByText('(5 projects)')).toBeVisible();
        await expect(page.locator('.project-item h3')).toHaveText([names[4], names[3]]);
        await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();

        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Page 2 of 3')).toBeVisible();
        await expect(page.locator('.project-item h3')).toHaveText([names[2], names[1]]);

        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Page 3 of 3')).toBeVisible();
        await expect(page.locator('.project-item h3')).toHaveText([names[0]]);
        await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

        await page.getByRole('button', { name: 'Previous' }).click();
        await expect(page.getByText('Page 2 of 3')).toBeVisible();
    });

    test('jumps to a page by its number', async ({ login }) => {
        const { page, api } = await login('alice');
        const base = uniqueName('Jump');
        const names = await create(api, base, 3);
        await page.reload();
        await searchProjects(page, base);
        await page.locator('#per-page').fill('1');

        await page.locator('.pagination-page-button', { hasText: /^3$/ }).click();

        await expect(page.getByText('Page 3 of 3')).toBeVisible();
        await expect(page.locator('.project-item h3')).toHaveText([names[0]]);
    });

    test('the page size can be changed', async ({ login }) => {
        const { page, api } = await login('alice');
        const base = uniqueName('Size');
        await create(api, base, 4);
        await page.reload();
        await searchProjects(page, base);

        await page.locator('#per-page').fill('3');
        await expect(page.getByText('Page 1 of 2')).toBeVisible();
        await expect(page.locator('.project-item')).toHaveCount(3);

        await page.locator('#per-page').fill('10');
        await expect(page.getByText('Page 1 of 1')).toBeVisible();
        await expect(page.locator('.project-item')).toHaveCount(4);
    });

    test('changing the page size goes back to the first page', async ({ login }) => {
        const { page, api } = await login('alice');
        const base = uniqueName('Reset');
        await create(api, base, 4);
        await page.reload();
        await searchProjects(page, base);
        await page.locator('#per-page').fill('1');
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Page 2 of 4')).toBeVisible();

        await page.locator('#per-page').fill('2');

        await expect(page.getByText('Page 1 of 2')).toBeVisible();
    });

    test('ignores everything but digits in the page size', async ({ login }) => {
        const { page, api } = await login('alice');
        const base = uniqueName('Digits');
        await create(api, base, 3);
        await page.reload();
        await searchProjects(page, base);
        const input = page.locator('#per-page');

        await input.fill('abc');
        await expect(input).toHaveValue('');
        await input.blur();
        await expect(input).toHaveValue('20');

        await input.fill('0');
        await input.blur();
        await expect(input).toHaveValue('20');

        await input.fill('2x');
        await expect(input).toHaveValue('2');
        await expect(page.getByText('Page 1 of 2')).toBeVisible();
    });

    test('a single page for few projects', async ({ login }) => {
        const { page, api } = await login('alice');
        const name = await api.createProject(uniqueName('Single'));
        await page.reload();
        await searchProjects(page, name);

        await expect(page.getByText('Page 1 of 1')).toBeVisible();
        await expect(page.getByText('(1 project)')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    test('shows the active project on top, outside of the pages', async ({ login }) => {
        const { page, api } = await login('alice');
        const base = uniqueName('Active');
        const names = await create(api, base, 3);
        await api.startProject(names[0]); // the oldest one
        await page.reload();
        await searchProjects(page, base);
        await page.locator('#per-page').fill('1');

        // all 3 are counted, but only the 2 others are paged
        await expect(page.getByText('(3 projects)')).toBeVisible();
        await expect(page.getByText('Page 1 of 2')).toBeVisible();
        await expect(page.locator('.project-item h3')).toHaveText([names[0], names[2]]);
        await expect(page.locator('.project-item').first()).toHaveClass(/active-project/);
        await expect(page.locator('.project-item.active-project')).toHaveCount(1);

        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.locator('.project-item h3')).toHaveText([names[0], names[1]]);
    });
});
