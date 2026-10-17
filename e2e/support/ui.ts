import { expect, Locator, Page } from '@playwright/test';

export const projectItem = (page: Page, name: string): Locator =>
    page.locator('.project-item', { has: page.getByRole('heading', { name, exact: true }) });

export const createProject = async (page: Page, name: string) => {
    await page.getByPlaceholder('New project name').fill(name);
    await page.getByRole('button', { name: 'Create Project' }).click();
};

export const searchProjects = (page: Page, term: string) => page.getByPlaceholder('Search Project...').fill(term);

export const goToActivities = async (page: Page, day?: string) => {
    await page.getByRole('link', { name: 'Activities' }).click();
    await expect(page.getByRole('heading', { name: 'Activities', level: 2 })).toBeVisible();
    if (day) await selectDay(page, day);
    else await expect(page.locator('.activity-overview[data-day]')).toBeAttached();
};

// The summary and the list show the previous day until the activities of the selected one are loaded
export const selectDay = async (page: Page, day: string) => {
    await page.locator('input[type="date"]').fill(day);
    await expect(page.locator(`.activity-overview[data-day="${day}"]`)).toBeAttached();
};

export const activityItems = (page: Page) => page.locator('.activity-item');

export const activityItem = (page: Page, id: number) => page.locator(`.activity-item[data-id="${id}"]`);

export const parseRuntime = (text: string): number => {
    const match = /^(-)?(?:(\d+)h )?(?:(\d+)m )?(\d+)s$/.exec(text.trim());
    if (!match) throw new Error(`not a runtime: "${text}"`);
    const [, sign, hours = '0', minutes = '0', seconds] = match;
    return (sign ? -1 : 1) * (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds));
};

// The summary above the activities: "Total Time: 9h 30m 0s (Break: 1h 0m 0s), Overtime: 30m 0s"
export const readSummary = async (page: Page) => {
    const text = (await page.locator('.activity-overview-total-runtime').innerText()).replace(/\s+/g, ' ');
    const match = /Total Time: (.+?) \(Break: (.+?)\), Overtime: (.+)$/.exec(text);
    if (!match) throw new Error(`unexpected summary: "${text}"`);
    return { worktime: parseRuntime(match[1]), breaktime: parseRuntime(match[2]), overtime: parseRuntime(match[3]) };
};

export const openChangeDialogue = async (item: Locator) => {
    await item.getByRole('button', { name: 'Change', exact: true }).click();
};

export const submitChange = async (
    item: Locator,
    values: { project?: string; start?: string; end?: string },
) => {
    if (values.project !== undefined) await item.getByPlaceholder('Project name').fill(values.project);
    if (values.start !== undefined) await item.getByPlaceholder('Start time').fill(values.start);
    if (values.end !== undefined) await item.getByPlaceholder('End time').fill(values.end);
    await item.locator('.confirm-change-button').click();
};
