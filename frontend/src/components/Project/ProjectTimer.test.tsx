import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectTimer from './ProjectTimer';

const NOW = new Date('2025-06-10T12:00:00Z');

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
});

afterEach(() => {
    vi.useRealTimers();
});

const secondsAgo = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

describe('ProjectTimer', () => {
    it('shows the time since startedAt and keeps counting', () => {
        render(<ProjectTimer startedAt={secondsAgo(3661)} />);
        expect(screen.getByText('01:01:01')).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(1000); });
        expect(screen.getByText('01:01:02')).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(60000); });
        expect(screen.getByText('01:02:02')).toBeInTheDocument();
    });

    it('does not show negative time if startedAt is in the future', () => {
        render(<ProjectTimer startedAt={secondsAgo(-30)} />);

        expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });

    it('updates when startedAt changes', () => {
        const { rerender } = render(<ProjectTimer startedAt={secondsAgo(10)} />);
        expect(screen.getByText('00:00:10')).toBeInTheDocument();

        rerender(<ProjectTimer startedAt={secondsAgo(125)} />);
        expect(screen.getByText('00:02:05')).toBeInTheDocument();
    });

    it('stops its interval on unmount', () => {
        const { unmount } = render(<ProjectTimer startedAt={secondsAgo(1)} />);

        unmount();

        expect(vi.getTimerCount()).toBe(0);
    });
});
