// Created by backend/docker/authentik/blueprints-e2e/timetrack-e2e.yaml
export const PASSWORD = 'e2e-password';

// alice and bob are shared by all tests, which only touch their own, uniquely named data. The fresh users
// are for tests that need a user without any history (overtime sums up all days of a user), one per test.
export const users = {
    alice: 'e2e-alice',
    bob: 'e2e-bob',
    fresh1: 'e2e-fresh-1',
    fresh2: 'e2e-fresh-2',
    fresh3: 'e2e-fresh-3',
    fresh4: 'e2e-fresh-4',
} as const;

export type UserKey = keyof typeof users;

export const storageStatePath = (user: UserKey) => `.auth/${user}.json`;
