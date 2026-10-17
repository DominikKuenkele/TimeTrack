import { expect, test } from '@playwright/test';
import { emailField, projectsHeading, submitLoginForm } from '../support/auth';
import { API_URL, DEX_URL } from '../support/env';
import { PASSWORD, users } from '../support/users';

// These tests start without any session and use the real login form

test.describe('login', () => {
    for (const path of ['/', '/projects', '/activities']) {
        test(`${path} sends a logged-out user to the login`, async ({ page }) => {
            await page.goto(path);

            await expect(page).toHaveURL(new RegExp(`^${DEX_URL}/`));
            await expect(emailField(page)).toBeVisible();
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

        await expect(page.getByText('Invalid Email Address and password.')).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`^${DEX_URL}/`));
        await expect(projectsHeading(page)).toHaveCount(0);
    });

    test('rejects an unknown user', async ({ page }) => {
        await page.goto('/');
        await submitLoginForm(page, 'e2e-nobody@timetrack.local', PASSWORD);

        await expect(page.getByText('Invalid Email Address and password.')).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`^${DEX_URL}/`));
        await expect(projectsHeading(page)).toHaveCount(0);
    });
});

test.describe('logout', () => {
    test('ends the session', async ({ page }) => {
        await page.goto('/');
        await submitLoginForm(page, users.alice);
        await expect(projectsHeading(page)).toBeVisible({ timeout: 30_000 });

        await page.getByRole('button', { name: 'Logout' }).click();

        // The app forgets the user and sends them to the login right away ...
        await expect(page).toHaveURL(new RegExp(`^${DEX_URL}/`));
        await expect(emailField(page)).toBeVisible();
        const { origins } = await page.context().storageState();
        expect(origins.flatMap((origin) => origin.localStorage).filter(({ name }) => name.startsWith('oidc.user:'))).toEqual([]);

        // ... and opening the app again asks for the credentials as well
        await page.goto('/projects');
        await expect(page).toHaveURL(new RegExp(`^${DEX_URL}/`));
        await expect(emailField(page)).toBeVisible();
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
