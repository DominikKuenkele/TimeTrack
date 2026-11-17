import { expect as baseExpect, test as baseTest } from '@playwright/test';
import { authHeaders } from '../support/auth';
import { API_URL } from '../support/env';
import { expect, test } from '../support/fixtures';
import { uniqueName } from '../support/names';
import { projectItem } from '../support/ui';
import { users } from '../support/users';

// Authentik's forward auth signs users in before a request reaches the app, so the app only sees its headers

baseTest.describe('API without the headers of forward auth', () => {
    for (const path of ['/projects/', '/activities/?day=2024-01-01']) {
        baseTest(`GET ${path} is rejected`, async ({ request }) => {
            const response = await request.get(`${API_URL}${path}`);

            baseExpect(response.status()).toBe(401);
        });
    }

    baseTest('a username alone is not enough', async ({ request }) => {
        const response = await request.get(`${API_URL}/projects/`, { headers: { 'X-authentik-username': users.alice.username } });

        baseExpect(response.status()).toBe(401);
    });

    baseTest('a bearer token is not accepted any more', async ({ request }) => {
        const response = await request.get(`${API_URL}/projects/`, { headers: { Authorization: 'Bearer some-token' } });

        baseExpect(response.status()).toBe(401);
    });
});

test('the API goes by the uid', async ({ login, request }) => {
    const { api } = await login('alice');
    const name = await api.createProject(uniqueName());

    const sameUid = await request.get(`${API_URL}/projects/?page=1&per_page=1000&search_term=${encodeURIComponent(name)}`, {
        headers: authHeaders({ uid: users.alice.uid, username: 'someone-else' }),
    });

    expect((await sameUid.json()).total).toBe(1);
});

test('logout leads to the sign-out of Authentik', async ({ login }) => {
    const { page } = await login('alice');

    await expect(page.getByRole('link', { name: 'Logout' })).toHaveAttribute('href', '/outpost.goauthentik.io/sign_out');
});

// Before forward auth, the data of a user was stored under their username (the subject of their OIDC token)
test('a user takes over the data stored under their username', async ({ login }) => {
    const username = uniqueName('legacy');
    const before = await login({ uid: username });
    const name = await before.api.createProject(uniqueName());
    await before.api.startProject(name);

    const after = await login({ uid: uniqueName('uid'), username });

    await expect(projectItem(after.page, name)).toContainText('Active');
    expect((await before.api.projects(name)).total).toBe(0);
});
