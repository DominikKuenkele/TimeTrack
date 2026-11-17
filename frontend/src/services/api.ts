import { Activity, DailyActivities, PaginatedProjects, Project } from '../types';
import { dateToDayString } from '../utils/timeUtils';

const API_BASE_URL = '/api';
const NODE_ENV = import.meta.env.VITE_NODE_ENV;

const logErrorIfNeeded = (error: unknown) => {
    if (NODE_ENV !== 'production') {
        console.log('API Error Response:', (error as { response?: { data?: unknown } })?.response?.data);
    }
    throw error;
};

const mapProject = (project: Project): Project => {
    return {
        ...project,
        startedAt: project.startedAt ? new Date(project.startedAt) : null,
    };
};

const mapActivity = (activity: Activity): Activity => {
    return {
        ...activity,
        startedAt: new Date(activity.startedAt),
        endedAt: activity.endedAt ? new Date(activity.endedAt) : null,
    };
};

// Set when the page reloaded for an expired session, so a login that doesn't help can't loop
const RELOADED_AT_KEY = 'timetrack.sessionReloadedAt';
const RELOAD_GUARD_MS = 60_000;

// Authentik's forward auth signs the user in on a page load; a request can only find the session gone
function reloadForLogin() {
    try {
        const reloadedAt = Number(window.sessionStorage.getItem(RELOADED_AT_KEY) ?? 0);
        if (Date.now() - reloadedAt < RELOAD_GUARD_MS) return;
        window.sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
    } catch {
        return;
    }
    window.location.reload();
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { headers = {}, ...rest } = options;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: new Headers({
            'Content-Type': 'application/json',
            ...headers,
        }),
        ...rest,
        // An expired session answers with a redirect to Authentik's login, which fetch can't follow
        redirect: 'manual',
    });

    if (response.type === 'opaqueredirect' || response.status === 401) {
        reloadForLogin();
        throw new Error('Session expired');
    }
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : (null as unknown as T);
}

export const api = {
    get: <T>(endpoint: string, options?: RequestInit) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        }),

    put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: <T>(endpoint: string, options?: RequestInit) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Project-related API calls
export const projectService = {
    getProjectsLike: async (page = 1, perPage = 20, searchTerm = ""): Promise<PaginatedProjects> => {
        try {
            const response = await api.get<PaginatedProjects>(`/projects/?page=${page}&per_page=${perPage}&search_term=${searchTerm}`);

            response.activeProject = response.activeProject ? mapProject(response.activeProject) : null;

            return {
                ...response,
                projects: response.projects.map(project => mapProject(project)),
            };
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    createProject: async (projectName: string): Promise<void> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            await api.post<void>(`/projects/${encodedName}`);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    deleteProject: async (projectName: string): Promise<void> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            await api.delete(`/projects/${encodedName}`);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    startProject: async (projectName: string): Promise<void> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            await api.post<void>(`/projects/${encodedName}/start`);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    stopProject: async (projectName: string): Promise<void> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            await api.post<void>(`/projects/${encodedName}/stop`);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },
};

// Activity-related API calls
export const activityService = {
    getDailyActivities: async (day: Date): Promise<DailyActivities> => {
        try {
            const response = await api.get<DailyActivities>(`/activities/?day=${dateToDayString(day)}`);
            return {
                activities: response.activities.map(activity => mapActivity(activity)),
                worktime: response.worktime,
                breaktime: response.breaktime,
                overtime: response.overtime
            };
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    changeActivity: async (activity: Activity): Promise<void> => {
        try {
            const data = {
                "projectName": activity.projectName,
                "startedAt": activity.startedAt,
                "endedAt": activity.endedAt
            };

            await api.post<void>(`/activities/${activity.id}`, data);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },
};

export default api;