import { randomBytes } from 'node:crypto';

// Every project name carries the prefix, so that session cleanup finds what the tests created
export const NAME_PREFIX = 'e2e-';

export const uniqueName = (label = 'p') => `${NAME_PREFIX}${randomBytes(3).toString('hex')}-${label}`;

// A random day in the past, so that the activities of a test don't mix with other tests' (or today's)
export const pastDay = (): string => {
    const start = Date.UTC(2000, 0, 1);
    const days = Math.floor(Math.random() * 7000);
    return new Date(start + days * 86_400_000).toISOString().slice(0, 10);
};

export const shiftDayString = (day: string, delta: number): string =>
    new Date(Date.parse(`${day}T00:00:00Z`) + delta * 86_400_000).toISOString().slice(0, 10);
