import { expect, test } from '@playwright/test';
import { passwordField, projectsHeading, submitLoginForm, usernameField } from '../support/auth';
import { API_URL, AUTHENTIK_URL } from '../support/env';
import { PASSWORD, users } from '../support/users';

// These tests start without any session and use the real login form

test.describe('login', () => {
    for (const path of ['/', '/projects', '/activities']) {
        test(`${path} sends a logged-out user to the login`, async ({ page }) => {
            await page.goto(path);

            await expect(page).toHaveURL(new RegExp(`^${AUTHENTIK_URL}/`));
            await expect(usernameField(page)).toBeVisible();
        });
    }

    test('brings the user back to the app after the login', async ({ page }) => {
        await page.goto('/activities');
        await submitLoginForm(page, users.alice);

        // The app always continues on the start page after the login
        await expect(projectsHeading(page)).toBeVisible({ timeout: 30_000 });
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Login' })).toHaveCount(0);
    });

    test('keeps the session over a reload', async ({ page }) => {
        await page.goto('/');
        await submitLoginForm(page, users.alice);
        await expect(projectsHeading(page)).toBeVisible({ timeout: 30_000 });

        await page.reload();

        await expect(projectsHeading(page)).toBeVisible();
    });

    test('rejects a wrong password', async ({ page }) => {
        await page.goto('/');
        await submitLoginForm(page, users.alice, `${PASSWORD}-wrong`);

        await expect(passwordField(page)).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`^${AUTHENTIK_URL}/`));
        await expect(projectsHeading(page)).toHaveCount(0);
    });

    test('rejects an unknown user', async ({ page }) => {
        await page.goto('/');
        await usernameField(page).fill('e2e-nobody');
        await page.getByRole('button', { name: /continue|log in/i }).click();
        // Authentik asks for the password first, so that it doesn't reveal which users exist
        await passwordField(page).fill(PASSWORD);
        await page.getByRole('button', { name: /continue|log in/i }).click();

        await expect(page).toHaveURL(new RegExp(`^${AUTHENTIK_URL}/`));
        await expect(projectsHeading(page)).toHaveCount(0);
    });
});

test.describe('logout', () => {
    test('ends the session', async ({ page }) => {
        await page.goto('/');
        await submitLoginForm(page, users.alice);
        await expect(projectsHeading(page)).toBeVisible({ timeout: 30_000 });

        await page.getByRole('button', { name: 'Logout' }).click();

        // The app forgets the user ...
        await expect.poll(() => page.evaluate(
            () => Object.keys(window.localStorage).filter((k) => k.startsWith('oidc.user:')).length,
        ).catch(() => 0)).toBe(0);

        // ... and so does Authentik: opening the app asks for the credentials again
        await page.goto('/projects');
        await expect(usernameField(page)).toBeVisible();
        await expect(projectsHeading(page)).toHaveCount(0);
    });
});

test.describe('API without login', () => {
    for (const path of ['/projects/', '/activities/?day=2024-01-01']) {
        test(`GET ${path} needs a token`, async ({ request }) => {
            const response = await request.get(`${API_URL}${path}`);

            expect(response.status()).toBe(401);
        });
    }

    test('rejects a token that is not valid', async ({ request }) => {
        const response = await request.get(`${API_URL}/projects/`, { headers: { Authorization: 'Bearer not-a-token' } });

        expect(response.status()).toBe(401);
    });

    test('rejects other authorization schemes', async ({ request }) => {
        const response = await request.get(`${API_URL}/projects/`, { headers: { Authorization: 'Basic YWxpY2U6YWxpY2U=' } });

        expect(response.status()).toBe(401);
    });
});
