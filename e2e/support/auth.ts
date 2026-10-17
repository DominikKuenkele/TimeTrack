import { expect, Page } from '@playwright/test';
import { PASSWORD } from './users';

// The login form of Dex (password connector)
export const emailField = (page: Page) => page.locator('input[name="login"]');
export const passwordField = (page: Page) => page.locator('input[name="password"]');

export const projectsHeading = (page: Page) => page.getByRole('heading', { name: 'Projects', level: 2 });

// Fills the Dex login form of a user
export async function submitLoginForm(page: Page, email: string, password = PASSWORD) {
    await emailField(page).fill(email);
    await passwordField(page).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
}

// Opens the app without a session and logs in through Dex
export async function login(page: Page, email: string) {
    await page.goto('/');
    await submitLoginForm(page, email);
    await expect(projectsHeading(page)).toBeVisible({ timeout: 30_000 });
}

// Reads the access token the app keeps (oidc-client-ts) in the local storage
export async function accessToken(page: Page): Promise<string> {
    const token = await page.evaluate(() => {
        const key = Object.keys(window.localStorage).find((k) => k.startsWith('oidc.user:'));
        return key ? (JSON.parse(window.localStorage.getItem(key) as string).access_token as string) : null;
    });
    if (!token) throw new Error('no oidc user in the local storage');
    return token;
}
