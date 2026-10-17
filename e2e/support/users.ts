// The static users of backend/docker/dex/config.e2e.yaml, logged in by their email
export const PASSWORD = 'e2e-password';

// alice and bob are shared by all tests, which only touch their own, uniquely named data. The fresh users
// are for tests that need a user without any history (overtime sums up all days of a user), one per test.
export const users = {
    alice: 'e2e-alice@timetrack.local',
    bob: 'e2e-bob@timetrack.local',
    fresh1: 'e2e-fresh-1@timetrack.local',
    fresh2: 'e2e-fresh-2@timetrack.local',
    fresh3: 'e2e-fresh-3@timetrack.local',
    fresh4: 'e2e-fresh-4@timetrack.local',
} as const;

export type UserKey = keyof typeof users;

export const storageStatePath = (user: UserKey) => `.auth/${user}.json`;
