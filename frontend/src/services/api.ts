import axios, { AxiosInstance } from 'axios';
import { Activity, DailyActivities, PaginatedProjects, Project } from '../types';
import { dateToDayString } from '../utils/timeUtils';

const API_URL = import.meta.env.VITE_API_URL;
const NODE_ENV = import.meta.env.VITE_NODE_ENV;

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

const logErrorIfNeeded = (error: any) => {
    if (NODE_ENV !== 'production') {
        console.log('API Error Response:', error.response?.data);
    }
    throw error; // Re-throw the error to be caught by the component
};

export const projectService = {
    getProjectsLike: async (page = 1, perPage = 20, searchTerm = ""): Promise<PaginatedProjects> => {
        try {
            const response = await api.get<PaginatedProjects>(`/projects/?page=${page}&per_page=${perPage}&search_term=${searchTerm}`);

            if (response.data.activeProject === undefined) {
                response.data.activeProject = null;
            } else {
                response.data.activeProject = mapProject(response.data.activeProject!)
            }


            return {
                ...response.data,
                projects: response.data.projects.map(project => mapProject(project)),
            };;
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    createProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}`);
            return mapProject(response.data);
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
            return mapProject(response.data);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    stopProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}/stop`);
            return mapProject(response.data);
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },
};

export const activityService = {
    getDailyActivities: async (day: Date): Promise<DailyActivities> => {
        try {
            const response = await api.get<DailyActivities>(`/activities/?day=${dateToDayString(day)}`);
            return {
                activities: response.data.activities.map(activity => mapActivity(activity)),
                worktime: response.data.worktime,
                breaktime: response.data.breaktime,
                overtime: response.data.overtime
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
            }

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
            return response.data;
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },
};

function mapProject(oldProject: Project): Project {
    const project: Project = {
        ...oldProject,
        startedAt: oldProject.startedAt ? new Date(oldProject.startedAt) : null,
    };

    return project
}

function mapActivity(oldActivity: Activity): Activity {
    const activity: Activity = {
        ...oldActivity,
        startedAt: new Date(oldActivity.startedAt),
        endedAt: oldActivity.endedAt ? new Date(oldActivity.endedAt) : null
    };

    return activity
}

export default api; 