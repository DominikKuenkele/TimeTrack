import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activityService, projectService } from './api';

const respond = (body: unknown, init: { status?: number; statusText?: string } = {}) =>
    new Response(body === undefined ? '' : JSON.stringify(body), init);

const fetchMock = vi.fn<typeof fetch>();

const project = { id: 1, name: 'a', runtimeInSeconds: 10, startedAt: null };

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    window.sessionStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => { });
});

describe('projectService.getProjectsLike', () => {
    const page = { projects: [], total: 0, page: 1, perPage: 20, totalPages: 0 };

    it('turns startedAt strings into Dates', async () => {
        fetchMock.mockResolvedValue(respond({
            ...page,
            activeProject: { ...project, id: 2, name: 'b', startedAt: '2025-01-01T10:00:00Z' },
            projects: [project, { ...project, id: 3, name: 'c', startedAt: '2025-01-02T10:00:00Z' }],
        }));

        const result = await projectService.getProjectsLike(1, 20, '');

        expect(result.activeProject?.startedAt).toEqual(new Date('2025-01-01T10:00:00Z'));
        expect(result.projects[0].startedAt).toBeNull();
        expect(result.projects[1].startedAt).toEqual(new Date('2025-01-02T10:00:00Z'));
    });

    it.each([
        ['null', { activeProject: null }],
        ['missing', {}],
    ])('handles an activeProject that is %s', async (_, extra) => {
        fetchMock.mockResolvedValue(respond({ ...page, projects: [project], ...extra }));

        const result = await projectService.getProjectsLike();

        expect(result.activeProject).toBeNull();
        expect(result.projects).toHaveLength(1);
    });

    it('asks the API on the same host for page, page size and search term', async () => {
        fetchMock.mockResolvedValue(respond({ ...page, activeProject: null }));

        await projectService.getProjectsLike(3, 10, 'abc');

        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toBe('/api/projects/?page=3&per_page=10&search_term=abc');
        expect(init?.redirect).toBe('manual');
    });
});

describe('error handling', () => {
    const reload = vi.fn();
    const redirectToLogin = { type: 'opaqueredirect', status: 0, ok: false } as Response;

    beforeEach(() => {
        reload.mockReset();
        vi.stubGlobal('location', { reload });
    });

    it.each([
        ['is redirected to the login', () => redirectToLogin],
        ['gets a 401', () => respond({}, { status: 401 })],
    ])('reloads the page for the login when a request %s', async (_, response) => {
        fetchMock.mockResolvedValue(response());

        await expect(projectService.getProjectsLike()).rejects.toThrow('Session expired');
        expect(reload).toHaveBeenCalledOnce();
    });

    it('reloads only once a minute, so a login that does not help cannot loop', async () => {
        fetchMock.mockResolvedValue(redirectToLogin);
        const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);

        await expect(projectService.getProjectsLike()).rejects.toThrow('Session expired');
        now.mockReturnValue(1_000_000 + 59_000);
        await expect(projectService.getProjectsLike()).rejects.toThrow('Session expired');
        expect(reload).toHaveBeenCalledOnce();

        now.mockReturnValue(1_000_000 + 61_000);
        await expect(projectService.getProjectsLike()).rejects.toThrow('Session expired');
        expect(reload).toHaveBeenCalledTimes(2);
    });

    it('rejects on other error statuses without reloading', async () => {
        fetchMock.mockResolvedValue(respond({}, { status: 500, statusText: 'Internal Server Error' }));

        await expect(projectService.getProjectsLike()).rejects.toThrow('API request failed: Internal Server Error');
        expect(reload).not.toHaveBeenCalled();
    });

    it('passes network errors on', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(projectService.getProjectsLike()).rejects.toThrow('Failed to fetch');
        expect(reload).not.toHaveBeenCalled();
    });
});

describe('projectService.createProject', () => {
    it('accepts the empty response of the backend and encodes the name', async () => {
        fetchMock.mockResolvedValue(new Response('', { status: 201 }));

        await expect(projectService.createProject('my/project')).resolves.toBeUndefined();
        expect(String(fetchMock.mock.calls[0][0])).toContain('/projects/my%2Fproject');
    });

    it('accepts an empty response body', async () => {
        fetchMock.mockResolvedValue(new Response(''));

        await expect(projectService.startProject('a')).resolves.toBeUndefined();
    });
});

describe('activityService', () => {
    it('turns activity dates into Dates and keeps a missing end null', async () => {
        fetchMock.mockResolvedValue(respond({
            activities: [
                { id: 1, projectName: 'a', startedAt: '2025-01-01T10:00:00Z', endedAt: '2025-01-01T11:00:00Z' },
                { id: 2, projectName: 'b', startedAt: '2025-01-01T11:00:00Z', endedAt: null },
            ],
            worktime: 3600, breaktime: 0, overtime: -100,
        }));

        const result = await activityService.getDailyActivities(new Date(2025, 0, 1, 12));

        expect(result.activities[0].startedAt).toEqual(new Date('2025-01-01T10:00:00Z'));
        expect(result.activities[0].endedAt).toEqual(new Date('2025-01-01T11:00:00Z'));
        expect(result.activities[1].endedAt).toBeNull();
        expect(result.overtime).toBe(-100);
        expect(String(fetchMock.mock.calls[0][0])).toContain('/activities/?day=2025-01-01');
    });

    it('posts the changed activity', async () => {
        fetchMock.mockResolvedValue(new Response(''));
        const startedAt = new Date('2025-01-01T10:00:00Z');

        await activityService.changeActivity({ id: 7, projectName: 'a', startedAt, endedAt: null });

        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toContain('/activities/7');
        expect(init?.method).toBe('POST');
        expect(JSON.parse(init?.body as string)).toEqual({
            projectName: 'a', startedAt: startedAt.toISOString(), endedAt: null,
        });
    });
});
