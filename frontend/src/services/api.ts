import axios, { AxiosInstance } from 'axios';
import { PaginatedProjects, Project } from '../types';

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
            const response = await api.get<PaginatedProjects>(`/projects?page=${page}&per_page=${perPage}&search_term=${searchTerm}`);
            if (response.data.activeProject === undefined) {
                response.data.activeProject = null;
            }
            return response.data;
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    createProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}`);
            return response.data;
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
            return response.data;
        } catch (error) {
            logErrorIfNeeded(error);
            throw error;
        }
    },

    stopProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}/stop`);
            return response.data;
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

export default api; 