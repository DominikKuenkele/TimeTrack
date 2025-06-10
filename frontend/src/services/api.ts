import { Activity, DailyActivities, PaginatedProjects, Project } from '../types';
import { getUser } from '../utils/auth';

const API_BASE_URL = '/api';
const NODE_ENV = import.meta.env.VITE_NODE_ENV;


const logErrorIfNeeded = (error: any) => {
    if (NODE_ENV !== 'production') {
        console.log('API Error Response:', error.response?.data);
    }
    throw error;
};

const mapProject = (project: any): Project => {
    return {
        ...project,
        startedAt: project.startedAt ? new Date(project.startedAt) : null,
    };
};

const mapActivity = (activity: any): Activity => {
    return {
        ...activity,
        startedAt: new Date(activity.startedAt),
        endedAt: activity.endedAt ? new Date(activity.endedAt) : null,
    };
};

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function handleResponse(response: Response) {
    if (!response.ok) {
        if (response.status === 401) {
            // Redirect to login on unauthorized
            window.location.href = '/auth/login';
            throw new ApiError(response.status, 'Unauthorized');
        }
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new ApiError(response.status, error.message || 'Request failed');
    }
    return response.json();
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const user = await getUser();
    const headers = new Headers({
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    });

    // Add authorization header if user is authenticated
    if (user?.access_token) {
        headers.set('Authorization', `Bearer ${user.access_token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for session management
    });

    return handleResponse(response);
}

export const api = {
    get: <T>(endpoint: string): Promise<T> => {
        return request<T>(endpoint, { method: 'GET' });
    },

    post: <T>(endpoint: string, data: unknown): Promise<T> => {
        return request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put: <T>(endpoint: string, data: unknown): Promise<T> => {
        return request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: <T>(endpoint: string): Promise<T> => {
        return request<T>(endpoint, { method: 'DELETE' });
    }
};

// Project-related API calls
export const projectService = {
    getProjectsLike: async (page = 1, perPage = 20, searchTerm = ""): Promise<PaginatedProjects> => {
        try {
            const response = await api.get<PaginatedProjects>(`/projects/?page=${page}&per_page=${perPage}&search_term=${searchTerm}`);

            if (response.activeProject === undefined) {
                return {
                    ...response,
                    activeProject: null
                };
            }

            return {
                ...response,
                activeProject: mapProject(response.activeProject)
            };
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    createProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}`, {});
            return mapProject(response);
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

    startProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}/start`, {});
            return mapProject(response);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    stopProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}/stop`, {});
            return mapProject(response);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    }
};

// Activity-related API calls
export const activityService = {
    getDailyActivities: async (day: Date): Promise<DailyActivities> => {
        try {
            const response = await api.get<DailyActivities>(`/activities/daily?date=${day.toISOString()}`);
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
                projectName: activity.projectName,
                startedAt: activity.startedAt,
                endedAt: activity.endedAt
            };

            await api.post<void>(`/activities/${activity.id}`, data);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    }
};

// User-related API calls
export const userService = {
    logout: async (): Promise<void> => {
        try {
            await api.post('/auth/logout', {});
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    createUser: async (username = "", password = ""): Promise<void> => {
        try {
            const data = {
                username,
                password
            };

            await api.post<void>('/user/create', data);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    }
}; 