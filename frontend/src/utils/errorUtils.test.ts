import { describe, expect, it } from 'vitest';
import { extractErrorMessage, isApiErrorResponse } from './errorUtils';

const fallback = 'fallback';

describe('isApiErrorResponse', () => {
    it('requires string error and message', () => {
        expect(isApiErrorResponse({ error: 'e', message: 'm' })).toBe(true);
        expect(isApiErrorResponse({ message: 'm' })).toBe(false);
        expect(isApiErrorResponse({ error: 'e', message: 1 })).toBe(false);
        expect(isApiErrorResponse(null)).toBe(false);
        expect(isApiErrorResponse('m')).toBe(false);
    });
});

describe('extractErrorMessage', () => {
    it('uses the message of an API error response', () => {
        const err = { response: { data: { error: 'Bad Request', message: 'name taken' } } };
        expect(extractErrorMessage(err, fallback)).toBe('name taken');
    });

    it('uses a message without error field', () => {
        expect(extractErrorMessage({ response: { data: { message: 'boom' } } }, fallback)).toBe('boom');
    });

    it('uses string response data', () => {
        expect(extractErrorMessage({ response: { data: 'plain text' } }, fallback)).toBe('plain text');
    });

    it('uses the message of a plain Error, like the one fetch throws on network failure', () => {
        expect(extractErrorMessage(new TypeError('Failed to fetch'), fallback)).toBe('Failed to fetch');
        expect(extractErrorMessage(new Error('API request failed: Bad Gateway'), fallback)).toBe('API request failed: Bad Gateway');
    });

    it('prefers the response data over the Error message', () => {
        const err = Object.assign(new Error('Request failed with status code 400'), {
            response: { data: { error: 'e', message: 'details' } },
        });
        expect(extractErrorMessage(err, fallback)).toBe('details');
    });

    it('falls back for Errors with an unusable response and unknown values', () => {
        expect(extractErrorMessage({ response: { data: 42 } }, fallback)).toBe(fallback);
        expect(extractErrorMessage({ response: null }, fallback)).toBe(fallback);
        expect(extractErrorMessage('oops', fallback)).toBe(fallback);
        expect(extractErrorMessage(undefined, fallback)).toBe(fallback);
    });
});
