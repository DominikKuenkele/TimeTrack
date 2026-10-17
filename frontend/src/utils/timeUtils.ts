/**
 * Format time in seconds to HH:MM:SS format
 */
export const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
};

/**
 * Format runtime in a human-readable format (Xh Ym Zs)
 */
export const formatRuntime = (totalSeconds: number): string => {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);

    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;

    const prefix = isNegative ? '-' : '';

    if (hours > 0) {
        return `${prefix}${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${prefix}${minutes}m ${seconds}s`;
    } else {
        return `${prefix}${seconds}s`;
    }
};

/**
 * Format the local calendar day of a date as YYYY-MM-DD
 */
export const dateToDayString = (date: Date | null) => {
    if (!date) {
        return ''
    }

    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`
}

/**
 * Move a date by whole calendar days, keeping the local time of day (also across DST changes)
 */
export const shiftDay = (day: Date, delta: number): Date => {
    const shifted = new Date(day);
    shifted.setDate(shifted.getDate() + delta);
    return shifted;
}

/**
 * Parse the value of a date input (YYYY-MM-DD) as local midnight, null if it is not a date
 */
export const parseDayInput = (value: string): Date | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return null;
    }

    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}


export const dateToString = (date: Date | null) => {
    return date ? date.toLocaleString('de') : ''
}

export const toLocalISOString = (date: Date | null): string => {
    if (!date) {
        return ""
    }

    const offset = date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset > 0 ? '-' : '+';

    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    const isoString = localDate.toISOString().replace('Z', offsetString);

    return isoString;
}

export function formatDateTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}