import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    dateToDayString,
    dateToString,
    formatDateTime,
    formatRuntime,
    formatTime,
    parseDayInput,
    shiftDay,
    toLocalISOString,
} from './timeUtils';

const originalTZ = process.env.TZ;

const useTimeZone = (tz: string) => {
    beforeEach(() => {
        process.env.TZ = tz;
    });
    afterEach(() => {
        process.env.TZ = originalTZ;
    });
};

describe('formatTime', () => {
    it('pads to HH:MM:SS', () => {
        expect(formatTime(0)).toBe('00:00:00');
        expect(formatTime(3661)).toBe('01:01:01');
    });

    it('does not wrap hours beyond a day', () => {
        expect(formatTime(100 * 3600 + 59)).toBe('100:00:59');
    });
});

describe('formatRuntime', () => {
    it('shows only the units needed', () => {
        expect(formatRuntime(5)).toBe('5s');
        expect(formatRuntime(65)).toBe('1m 5s');
        expect(formatRuntime(3600)).toBe('1h 0m 0s');
        expect(formatRuntime(3 * 3600 + 25 * 60 + 7)).toBe('3h 25m 7s');
    });

    it('prefixes negative values', () => {
        expect(formatRuntime(-5)).toBe('-5s');
        expect(formatRuntime(-3725)).toBe('-1h 2m 5s');
    });
});

describe('in Europe/Berlin', () => {
    useTimeZone('Europe/Berlin');

    describe('dateToDayString', () => {
        it('uses the local day, not the UTC day', () => {
            // 00:30 local on 2025-06-10 is still 2025-06-09 in UTC
            expect(dateToDayString(new Date(2025, 5, 10, 0, 30))).toBe('2025-06-10');
            expect(dateToDayString(new Date(2025, 0, 10, 23, 59, 59))).toBe('2025-01-10');
        });

        it('returns an empty string for null', () => {
            expect(dateToDayString(null)).toBe('');
        });
    });

    describe('shiftDay', () => {
        it('moves by calendar days across the spring DST change', () => {
            // 2025-03-30 is only 23 hours long
            const shifted = shiftDay(new Date(2025, 2, 29, 12), 1);
            expect(dateToDayString(shifted)).toBe('2025-03-30');
            expect(shifted.getHours()).toBe(12);
            expect(dateToDayString(shiftDay(shifted, 1))).toBe('2025-03-31');
        });

        it('moves by calendar days across the autumn DST change', () => {
            // 2025-10-26 is 25 hours long
            const shifted = shiftDay(new Date(2025, 9, 25, 0, 30), 1);
            expect(dateToDayString(shifted)).toBe('2025-10-26');
            expect(dateToDayString(shiftDay(shifted, 1))).toBe('2025-10-27');
            expect(dateToDayString(shiftDay(shifted, -1))).toBe('2025-10-25');
        });

        it('crosses month and year boundaries and does not mutate its input', () => {
            const start = new Date(2025, 11, 31, 10);
            expect(dateToDayString(shiftDay(start, 1))).toBe('2026-01-01');
            expect(dateToDayString(start)).toBe('2025-12-31');
        });
    });

    describe('parseDayInput', () => {
        it('returns local midnight', () => {
            const parsed = parseDayInput('2025-06-10');
            expect(parsed).toEqual(new Date(2025, 5, 10));
            expect(dateToDayString(parsed)).toBe('2025-06-10');
        });

        it('returns null for empty or malformed input', () => {
            expect(parseDayInput('')).toBeNull();
            expect(parseDayInput('10.06.2025')).toBeNull();
        });
    });

    describe('toLocalISOString', () => {
        it('uses the offset of the date itself', () => {
            expect(toLocalISOString(new Date('2025-01-10T10:00:00Z'))).toBe('2025-01-10T11:00:00.000+01:00');
            expect(toLocalISOString(new Date('2025-07-10T10:00:00Z'))).toBe('2025-07-10T12:00:00.000+02:00');
        });

        it('returns an empty string for null', () => {
            expect(toLocalISOString(null)).toBe('');
        });

        it('round-trips through Date', () => {
            const date = new Date('2025-10-26T00:30:00Z');
            expect(new Date(toLocalISOString(date)).getTime()).toBe(date.getTime());
        });
    });

    describe('formatDateTime', () => {
        it('formats the local time with padding', () => {
            expect(formatDateTime(new Date(2025, 5, 10, 7, 5, 3))).toBe('07:05:03');
            expect(formatDateTime(new Date('2025-06-10T22:30:00Z'))).toBe('00:30:00');
        });
    });

    describe('dateToString', () => {
        it('formats german style and handles null', () => {
            expect(dateToString(new Date(2025, 5, 10, 7, 5, 3))).toBe('10.6.2025, 07:05:03');
            expect(dateToString(null)).toBe('');
        });
    });
});

describe('in America/Los_Angeles', () => {
    useTimeZone('America/Los_Angeles');

    it('dateToDayString keeps the local day in the evening, when UTC is already the next day', () => {
        expect(dateToDayString(new Date(2025, 5, 10, 20, 0))).toBe('2025-06-10');
    });

    it('parseDayInput and dateToDayString round-trip', () => {
        expect(dateToDayString(parseDayInput('2025-06-10'))).toBe('2025-06-10');
    });

    it('shiftDay crosses the spring DST change', () => {
        expect(dateToDayString(shiftDay(new Date(2025, 2, 9, 0, 30), 1))).toBe('2025-03-10');
        expect(dateToDayString(shiftDay(new Date(2025, 2, 8, 12), 1))).toBe('2025-03-09');
    });

    it('toLocalISOString has a negative offset', () => {
        expect(toLocalISOString(new Date('2025-01-10T10:00:00Z'))).toBe('2025-01-10T02:00:00.000-08:00');
    });
});

describe('in Asia/Kolkata', () => {
    useTimeZone('Asia/Kolkata');

    it('toLocalISOString keeps half-hour offsets', () => {
        expect(toLocalISOString(new Date('2025-01-10T10:00:00Z'))).toBe('2025-01-10T15:30:00.000+05:30');
    });
});

describe('in America/St_Johns', () => {
    useTimeZone('America/St_Johns');

    it('toLocalISOString keeps negative half-hour offsets', () => {
        expect(toLocalISOString(new Date('2025-01-10T12:00:00Z'))).toBe('2025-01-10T08:30:00.000-03:30');
    });
});
