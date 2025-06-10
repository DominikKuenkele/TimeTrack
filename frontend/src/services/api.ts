import { Activity, DailyActivities, PaginatedProjects, Project } from '../types';
import { getUser } from '../utils/auth';
import { dateToDayString } from '../utils/timeUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const NODE_ENV = import.meta.env.VITE_NODE_ENV;

interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}

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

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = true, headers = {}, ...rest } = options;

    const requestHeaders = new Headers({
        'Content-Type': 'application/json',
        ...headers,
    });

    if (requiresAuth) {
        const user = await getUser();
        if (!user?.access_token) {
            throw new Error('No access token available');
        }
        requestHeaders.set('Authorization', `Bearer ${user.access_token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: requestHeaders,
        ...rest,
        credentials: 'include', // Include cookies in requests
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Handle unauthorized access
            window.location.href = '/auth/login';
            throw new Error('Unauthorized');
        }
        throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        }),

    put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: <T>(endpoint: string, options?: RequestOptions) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Project-related API calls
export const projectService = {
    getProjectsLike: async (page = 1, perPage = 20, searchTerm = ""): Promise<PaginatedProjects> => {
        try {
            const response = await api.get<PaginatedProjects>(`/projects/?page=${page}&per_page=${perPage}&search_term=${searchTerm}`);

            if (response.activeProject === undefined) {
                response.activeProject = null;
            } else {
                response.activeProject = mapProject(response.activeProject);
            }

            return {
                ...response,
                projects: response.projects.map(project => mapProject(project)),
            };
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    createProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}`);
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
            const response = await api.post<Project>(`/projects/${encodedName}/start`);
            return mapProject(response);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    stopProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}/stop`);
            return mapProject(response);
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

export const userService = {
    login: async (username = "", password = ""): Promise<void> => {
        try {
            const data = {
                "username": username,
                "password": password
            }

            await api.post<void>('/user/login', data);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        try {
            await api.post<void>('/user/logout');
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    createUser: async (username = "", password = ""): Promise<void> => {
        try {
            const data = {
                "username": username,
                "password": password
            }

            await api.post<void>('/user/create', data);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    validate: async (): Promise<boolean> => {
        try {
            const response = await api.get<boolean>('/user/validate');
            return response;
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },
};

export default api; 