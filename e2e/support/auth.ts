import { expect, Page } from '@playwright/test';
import { PASSWORD } from './users';

// The Authentik flow elements live in web components; locators pierce their shadow DOM
export const usernameField = (page: Page) => page.locator('input[name="uidField"]');
export const passwordField = (page: Page) => page.locator('input[name="password"]');

export const projectsHeading = (page: Page) => page.getByRole('heading', { name: 'Projects', level: 2 });

// Fills the Authentik login form of a user and waits until the app is shown again
export async function submitLoginForm(page: Page, username: string, password = PASSWORD) {
    await usernameField(page).fill(username);
    await page.getByRole('button', { name: /continue|log in/i }).click();
    await passwordField(page).fill(password);
    await page.getByRole('button', { name: /continue|log in/i }).click();
}

// Opens the app without a session and logs in through Authentik
export async function login(page: Page, username: string) {
    await page.goto('/');
    await submitLoginForm(page, username);
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
