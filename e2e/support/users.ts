// What Authentik's forward auth passes for a user. alice and bob are shared by all tests, which only touch their
// own, uniquely named data. The fresh users are for tests that need a user without any history (overtime sums up
// all days of a user), one per test.
export interface Identity {
    uid: string;
    username?: string;
}

export const users = {
    alice: { uid: 'e2e-uid-alice', username: 'e2e-alice' },
    bob: { uid: 'e2e-uid-bob', username: 'e2e-bob' },
    fresh1: { uid: 'e2e-uid-fresh-1', username: 'e2e-fresh-1' },
    fresh2: { uid: 'e2e-uid-fresh-2', username: 'e2e-fresh-2' },
    fresh3: { uid: 'e2e-uid-fresh-3', username: 'e2e-fresh-3' },
    fresh4: { uid: 'e2e-uid-fresh-4', username: 'e2e-fresh-4' },
} as const satisfies Record<string, Identity>;

export type UserKey = keyof typeof users;
