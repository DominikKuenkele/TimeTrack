import { Page } from '@playwright/test';
import { Identity } from './users';

export const projectsHeading = (page: Page) => page.getByRole('heading', { name: 'Projects', level: 2 });

// The headers Authentik's forward auth sets on every request of a signed-in user
export const authHeaders = ({ uid, username }: Identity): Record<string, string> => ({
    'X-authentik-uid': uid,
    ...(username ? { 'X-authentik-username': username } : {}),
});
