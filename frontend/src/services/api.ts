import axios, { AxiosInstance } from 'axios';
import { Project } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const projectService = {
    getAllProjects: async (): Promise<Project[]> => {
        try {
            const response = await api.get<Project[]>('/projects');
            return response.data;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    },

    createProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}`);
            return response.data;
        } catch (error) {
            console.error(`Error creating project ${projectName}:`, error);
            throw error;
        }
    },

    deleteProject: async (projectName: string): Promise<void> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            await api.delete(`/projects/${encodedName}`);
        } catch (error) {
            console.error(`Error deleting project ${projectName}:`, error);
            throw error;
        }
    },

    startProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}/start`);
            return response.data;
        } catch (error) {
            console.error(`Error starting project ${projectName}:`, error);
            throw error;
        }
    },

    stopProject: async (projectName: string): Promise<Project> => {
        try {
            const encodedName = encodeURIComponent(projectName);
            const response = await api.post<Project>(`/projects/${encodedName}/stop`);
            return response.data;
        } catch (error) {
            console.error(`Error stopping project ${projectName}:`, error);
            throw error;
        }
    },
};

export default api; 