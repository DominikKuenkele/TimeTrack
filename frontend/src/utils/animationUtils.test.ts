import { describe, expect, it } from 'vitest';
import { computeMoves } from './animationUtils';

const at = (...tops: number[]) =>
    Object.fromEntries(tops.map((top, i) => [String.fromCharCode(97 + i), { top }]));

describe('computeMoves', () => {
    it('ignores moves of 5px or less', () => {
        expect(computeMoves(at(0, 100), at(5, 95), null, null)).toEqual([]);
        expect(computeMoves(at(0), at(6), null, null)).toEqual([{ id: 'a', deltaY: -6, kind: 'other' }]);
    });

    it('reports other items with the offset to animate from', () => {
        expect(computeMoves(at(0, 100, 200), at(0, 200, 100), 'a', 'a')).toEqual([
            { id: 'b', deltaY: -100, kind: 'other' },
            { id: 'c', deltaY: 100, kind: 'other' },
        ]);
    });

    it('marks an item that moved up to the first place', () => {
        const moves = computeMoves(at(0, 100, 200), { a: { top: 100 }, b: { top: 200 }, c: { top: 0 } }, 'c', 'a');
        expect(moves).toContainEqual({ id: 'c', deltaY: 200, kind: 'toTop' });
        expect(moves).toContainEqual({ id: 'a', deltaY: -100, kind: 'fromTop' });
    });

    it('does not mark the first item as moving to the top if it moved down', () => {
        expect(computeMoves(at(0), at(100), 'a', 'a')).toEqual([{ id: 'a', deltaY: -100, kind: 'other' }]);
    });

    it('ignores items that are not in both layouts', () => {
        expect(computeMoves({ a: { top: 0 } }, { b: { top: 100 } }, 'b', 'a')).toEqual([]);
    });
});
