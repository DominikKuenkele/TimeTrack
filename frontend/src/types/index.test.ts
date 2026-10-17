import { describe, expect, it } from 'vitest';
import { Activity, getActivityDurationInSeconds, getBreakTimeInSeconds } from './index';

const activity = (startedAt: string, endedAt: string | null): Activity => ({
    id: 1,
    projectName: 'p',
    startedAt: new Date(startedAt),
    endedAt: endedAt ? new Date(endedAt) : null,
});

describe('getActivityDurationInSeconds', () => {
    it('is the time between start and end', () => {
        expect(getActivityDurationInSeconds(activity('2025-01-01T10:00:00Z', '2025-01-01T11:01:05Z'))).toBe(3665);
    });

    it('is 0 for a running activity without an end', () => {
        expect(getActivityDurationInSeconds(activity('2025-01-01T10:00:00Z', null))).toBe(0);
    });

    it('floors partial seconds', () => {
        expect(getActivityDurationInSeconds(activity('2025-01-01T10:00:00.000Z', '2025-01-01T10:00:01.999Z'))).toBe(1);
    });
});

describe('getBreakTimeInSeconds', () => {
    it('is the time between the end of one and the start of the next activity', () => {
        const previous = activity('2025-01-01T10:00:00Z', '2025-01-01T11:00:00Z');
        const next = activity('2025-01-01T11:15:30Z', null);
        expect(getBreakTimeInSeconds(previous, next)).toBe(930);
    });

    it('is 0 if the previous activity is still running', () => {
        const previous = activity('2025-01-01T10:00:00Z', null);
        const next = activity('2025-01-01T11:15:30Z', null);
        expect(getBreakTimeInSeconds(previous, next)).toBe(0);
    });

    it('floors partial seconds', () => {
        const previous = activity('2025-01-01T10:00:00Z', '2025-01-01T11:00:00.000Z');
        const next = activity('2025-01-01T11:00:02.500Z', null);
        expect(getBreakTimeInSeconds(previous, next)).toBe(2);
    });
});
