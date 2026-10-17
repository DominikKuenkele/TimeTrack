import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectService } from '../../services/api';
import { PaginatedProjects, Project } from '../../types';
import ProjectOverview from './ProjectOverview';

vi.mock('../../services/api', () => ({
    projectService: { getProjectsLike: vi.fn(), createProject: vi.fn() },
}));
vi.mock('../useAuth', () => ({ useAuth: () => ({ isLoggedIn: true, isLoading: false }) }));
// the list itself is not under test, only what the overview passes to it
vi.mock('./ProjectItem', () => ({
    default: ({ project }: { project: Project }) => <div className="project-item">{project.name}</div>,
}));

const project = (name: string): Project => ({ id: name.charCodeAt(0), name, runtimeInSeconds: 0, startedAt: null });

const pageOf = (names: string[], totalPages = 1): PaginatedProjects => ({
    activeProject: null,
    projects: names.map(project),
    total: names.length,
    page: 1,
    perPage: 20,
    totalPages,
});

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => { resolve = res; });
    return { promise, resolve };
};

const getProjectsLike = vi.mocked(projectService.getProjectsLike);

// ProjectList fetches on mount in addition to the overview, so requests are answered by their
// arguments instead of by call order
const serve = (handler: (page?: number, perPage?: number, searchTerm?: string) => Promise<PaginatedProjects>) =>
    getProjectsLike.mockImplementation(handler);

const renderOverview = () => render(<MemoryRouter><ProjectOverview /></MemoryRouter>);

beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => { });
});

describe('ProjectOverview', () => {
    it('reloads on the first page after a project was created', async () => {
        let created = false;
        serve(async (page) => {
            if (page === 2) return pageOf(['gamma'], 3);
            return pageOf(created ? ['beta', 'alpha'] : ['alpha'], 3);
        });
        vi.mocked(projectService.createProject).mockImplementation(async () => {
            created = true;
        });
        renderOverview();
        await screen.findByText('alpha');

        // go to page 2 first, so the reset to page 1 is visible
        await userEvent.click(screen.getByRole('button', { name: '2' }));
        await screen.findByText('gamma');

        await userEvent.type(screen.getByPlaceholderText('New project name'), 'beta');
        await userEvent.click(screen.getByRole('button', { name: 'Create Project' }));

        await screen.findByText('beta');
        expect(projectService.createProject).toHaveBeenCalledWith('beta');
        expect(screen.queryByText('gamma')).not.toBeInTheDocument();
        expect(getProjectsLike).toHaveBeenLastCalledWith(1, 20, '');
    });

    it('falls back to the last page if the current one is beyond it', async () => {
        serve(async (page) => {
            if (page === 1) return pageOf(['first'], 3);
            if (page === 2) return pageOf(['last'], 2);
            return pageOf([], 2);
        });
        renderOverview();
        await screen.findByText('first');

        await userEvent.click(screen.getByRole('button', { name: '3' }));

        await screen.findByText('last');
        expect(getProjectsLike).toHaveBeenLastCalledWith(2, 20, '');
    });

    it('stays on the first page if there are no projects at all', async () => {
        serve(async () => pageOf([], 0));
        renderOverview();

        await screen.findByText('No projects found.');
        await waitFor(() => expect(getProjectsLike).toHaveBeenCalled());
        expect(getProjectsLike.mock.calls.every(([page]) => page === 1)).toBe(true);
    });

    it('ignores a late response for an older search term', async () => {
        const slow = deferred<PaginatedProjects>();
        const fast = deferred<PaginatedProjects>();
        serve((_page, _perPage, searchTerm) => {
            if (searchTerm === 'x') return slow.promise;
            if (searchTerm === 'xy') return fast.promise;
            return Promise.resolve(pageOf(['initial']));
        });
        renderOverview();
        await screen.findByText('initial');

        await userEvent.type(screen.getByPlaceholderText('Search Project...'), 'xy');

        await act(async () => { fast.resolve(pageOf(['new result'])); });
        await screen.findByText('new result');
        await act(async () => { slow.resolve(pageOf(['stale result'])); });

        expect(screen.getByText('new result')).toBeInTheDocument();
        expect(screen.queryByText('stale result')).not.toBeInTheDocument();
    });

    it('ignores a late response for an older page', async () => {
        const slow = deferred<PaginatedProjects>();
        const fast = deferred<PaginatedProjects>();
        serve((page) => {
            if (page === 2) return slow.promise;
            if (page === 3) return fast.promise;
            return Promise.resolve(pageOf(['first'], 5));
        });
        renderOverview();
        await screen.findByText('first');

        await userEvent.click(screen.getByRole('button', { name: '2' }));
        await userEvent.click(screen.getByRole('button', { name: '3' }));

        await act(async () => { fast.resolve(pageOf(['third'], 5)); });
        await screen.findByText('third');
        await act(async () => { slow.resolve(pageOf(['second'], 5)); });

        expect(screen.queryByText('second')).not.toBeInTheDocument();
        expect(screen.getByText('third')).toBeInTheDocument();
    });

    it('shows the error of a failed request', async () => {
        serve(async () => { throw new TypeError('Failed to fetch'); });
        renderOverview();

        await screen.findByText('Error: Failed to fetch');
    });

    it('clears the error after a successful reload', async () => {
        serve(async () => { throw new Error('down'); });
        vi.mocked(projectService.createProject).mockResolvedValue();
        renderOverview();
        await screen.findByText('Error: down');

        serve(async () => pageOf(['beta']));
        await userEvent.type(screen.getByPlaceholderText('New project name'), 'beta');
        await userEvent.click(screen.getByRole('button', { name: 'Create Project' }));

        await screen.findByText('beta');
        expect(screen.queryByText('Error: down')).not.toBeInTheDocument();
    });
});
