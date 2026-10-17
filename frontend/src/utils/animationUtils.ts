export type MoveKind = 'toTop' | 'fromTop' | 'other';

export interface Move {
    id: string;
    deltaY: number;
    kind: MoveKind;
}

const MIN_MOVE_PX = 5;

/**
 * Items whose vertical position changed by more than a few pixels, with the offset
 * they have to be animated from. Items only present in one of the layouts are ignored.
 */
export const computeMoves = (
    previous: Record<string, { top: number }>,
    current: Record<string, { top: number }>,
    currentFirstId: string | null,
    previousFirstId: string | null,
): Move[] => {
    const moves: Move[] = [];

    for (const id of Object.keys(current)) {
        if (!previous[id]) continue;

        const deltaY = previous[id].top - current[id].top;
        if (Math.abs(deltaY) <= MIN_MOVE_PX) continue;

        let kind: MoveKind = 'other';
        if (id === currentFirstId && deltaY > 0) {
            kind = 'toTop';
        } else if (id === previousFirstId && id !== currentFirstId) {
            kind = 'fromTop';
        }

        moves.push({ id, deltaY, kind });
    }

    return moves;
};
