import axios, { AxiosInstance } from 'axios';
import { PaginatedProjects, Project } from '../types';

const API_URL = import.meta.env.VITE_API_URL;
const NODE_ENV = import.meta.env.VITE_NODE_ENV;

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const logErrorIfNeeded = (error: any) => {
    if (NODE_ENV !== 'production') {
        console.log('API Error Response:', error.response?.data);
    }
    throw error; // Re-throw the error to be caught by the component
};

export const projectService = {
    getAllProjects: async (page = 1, perPage = 20): Promise<PaginatedProjects> => {
        try {
            const response = await api.get<PaginatedProjects>(`/projects?page=${page}&per_page=${perPage}`);
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

export default api; 