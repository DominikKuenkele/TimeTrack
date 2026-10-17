import { describe, expect, it } from 'vitest';
import { getPageRange } from './paginationUtils';

describe('getPageRange', () => {
    it('shows all pages if there are few', () => {
        expect(getPageRange(1, 1)).toEqual([1]);
        expect(getPageRange(2, 3)).toEqual([1, 2, 3]);
        expect(getPageRange(3, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('shows nothing without pages', () => {
        expect(getPageRange(1, 0)).toEqual([]);
    });

    it('shows a window with a trailing ellipsis at the start', () => {
        expect(getPageRange(1, 50)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 50]);
        expect(getPageRange(2, 50)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 50]);
    });

    it('shows ellipses on both sides in the middle', () => {
        expect(getPageRange(25, 50)).toEqual([1, 'ellipsis', 23, 24, 25, 26, 27, 'ellipsis', 50]);
    });

    it('shows a window with a leading ellipsis at the end', () => {
        expect(getPageRange(50, 50)).toEqual([1, 'ellipsis', 46, 47, 48, 49, 50]);
        expect(getPageRange(49, 50)).toEqual([1, 'ellipsis', 46, 47, 48, 49, 50]);
    });

    it('has no ellipsis where the window touches the first or last page', () => {
        expect(getPageRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(getPageRange(3, 8)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 8]);
    });

    it('uses an ellipsis even for a single skipped page', () => {
        expect(getPageRange(5, 9)).toEqual([1, 'ellipsis', 3, 4, 5, 6, 7, 'ellipsis', 9]);
    });

    it('respects maxButtons', () => {
        expect(getPageRange(5, 10, 3)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    });
});
