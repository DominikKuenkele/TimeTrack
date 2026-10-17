import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activityService } from '../../services/api';
import { Activity, DailyActivities } from '../../types';
import { dateToDayString } from '../../utils/timeUtils';
import ActivityOverview from './ActivityOverview';

vi.mock('../../services/api', () => ({
    activityService: { getDailyActivities: vi.fn(), changeActivity: vi.fn() },
}));
vi.mock('../useAuth', () => ({ useAuth: () => ({ isLoggedIn: true, isLoading: false }) }));

const activity = (id: number, projectName: string): Activity => ({
    id,
    projectName,
    startedAt: new Date(2025, 5, 10, 8, 0),
    endedAt: new Date(2025, 5, 10, 9, 0),
});

const dayOf = (...activities: Activity[]): DailyActivities => ({
    activities, worktime: 3600 * activities.length, breaktime: 0, overtime: 0,
});

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => { resolve = res; });
    return { promise, resolve };
};

const getDailyActivities = vi.mocked(activityService.getDailyActivities);

const renderOverview = () => render(<MemoryRouter><ActivityOverview /></MemoryRouter>);

const requestedDays = () => getDailyActivities.mock.calls.map(([day]) => dateToDayString(day));

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('ActivityOverview', () => {
    it('reloads after an activity was changed', async () => {
        getDailyActivities.mockResolvedValueOnce(dayOf(activity(1, 'old name')));
        vi.mocked(activityService.changeActivity).mockResolvedValue();
        renderOverview();
        await screen.findByText('old name');

        getDailyActivities.mockResolvedValue(dayOf(activity(1, 'new name')));
        await userEvent.click(screen.getByRole('button', { name: 'Change' }));
        const name = screen.getByPlaceholderText('Project name');
        await userEvent.clear(name);
        await userEvent.type(name, 'new name');
        await userEvent.click(screen.getAllByRole('button', { name: 'Change' })[0]);

        await screen.findByRole('heading', { name: 'new name' });
        expect(activityService.changeActivity).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, projectName: 'new name' })
        );
        expect(getDailyActivities).toHaveBeenCalledTimes(2);
    });

    it('steps through the days with the buttons', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2025, 2, 31, 0, 30));
        getDailyActivities.mockResolvedValue(dayOf());
        renderOverview();

        fireEvent.click(screen.getByRole('button', { name: '◀' }));
        fireEvent.click(screen.getByRole('button', { name: '◀' }));
        fireEvent.click(screen.getByRole('button', { name: '▶' }));

        await waitFor(() => expect(requestedDays()).toEqual(['2025-03-31', '2025-03-30', '2025-03-29', '2025-03-30']));
    });

    it('takes the day from the date input and ignores clearing it', async () => {
        getDailyActivities.mockResolvedValue(dayOf());
        renderOverview();
        const input = screen.getByPlaceholderText('Select start date');

        fireEvent.change(input, { target: { value: '2025-06-10' } });
        await waitFor(() => expect(requestedDays().pop()).toBe('2025-06-10'));

        fireEvent.change(input, { target: { value: '' } });
        expect(input).toHaveValue('2025-06-10');
    });

    it('ignores a late response for a previous day', async () => {
        getDailyActivities.mockResolvedValueOnce(dayOf());
        renderOverview();
        await waitFor(() => expect(getDailyActivities).toHaveBeenCalledTimes(1));

        const slow = deferred<DailyActivities>();
        const fast = deferred<DailyActivities>();
        getDailyActivities.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);
        await userEvent.click(screen.getByRole('button', { name: '◀' }));
        await userEvent.click(screen.getByRole('button', { name: '◀' }));

        await act(async () => { fast.resolve(dayOf(activity(2, 'newer day'))); });
        await screen.findByText('newer day');
        await act(async () => { slow.resolve(dayOf(activity(1, 'older day'))); });

        expect(screen.getByText('newer day')).toBeInTheDocument();
        expect(screen.queryByText('older day')).not.toBeInTheDocument();
    });

    it('shows the error of a failed request', async () => {
        getDailyActivities.mockRejectedValue(new TypeError('Failed to fetch'));
        renderOverview();

        await screen.findByText('Error: Failed to fetch');
    });
});
