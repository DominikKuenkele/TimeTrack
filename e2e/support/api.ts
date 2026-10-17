import { APIRequestContext, APIResponse, Page } from '@playwright/test';
import { accessToken } from './auth';
import { API_URL } from './env';
import { NAME_PREFIX } from './names';

interface ApiProject {
    name: string;
    startedAt: string | null;
    runtimeInSeconds: number;
}

export interface ApiActivity {
    id: number;
    projectName: string;
    startedAt: string;
    endedAt: string | null;
}

interface PaginatedProjects {
    activeProject?: ApiProject;
    projects: ApiProject[];
    total: number;
    totalPages: number;
}

interface DailyActivities {
    activities: ApiActivity[];
    worktime: number;
    breaktime: number;
    overtime: number;
}

// The backend API as the logged in user of a page, for preparing and checking data (and cleaning up)
export class Api {
    constructor(private readonly page: Page, private readonly request: APIRequestContext) { }

    async raw(method: string, path: string, data?: unknown): Promise<APIResponse> {
        const token = await accessToken(this.page);
        return this.request.fetch(`${API_URL}${path}`, {
            method,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            data: data === undefined ? undefined : JSON.stringify(data),
        });
    }

    private async ok(method: string, path: string, data?: unknown) {
        const response = await this.raw(method, path, data);
        if (!response.ok()) {
            throw new Error(`${method} ${path} failed: ${response.status()} ${await response.text()}`);
        }
        return response;
    }

    private static projectPath = (name: string) => `/projects/${encodeURIComponent(name)}`;

    async createProject(name: string) {
        await this.ok('POST', Api.projectPath(name));
        return name;
    }

    async startProject(name: string) {
        await this.ok('POST', `${Api.projectPath(name)}/start`);
    }

    async stopProject(name: string) {
        await this.ok('POST', `${Api.projectPath(name)}/stop`);
    }

    async deleteProject(name: string) {
        await this.ok('DELETE', Api.projectPath(name));
    }

    async projects(search = '', perPage = 1000): Promise<PaginatedProjects> {
        const response = await this.ok('GET', `/projects/?page=1&per_page=${perPage}&search_term=${encodeURIComponent(search)}`);
        return response.json();
    }

    async dailyActivities(day: string): Promise<DailyActivities> {
        const response = await this.ok('GET', `/activities/?day=${day}`);
        return response.json();
    }

    async changeActivity(id: number, activity: { projectName: string; startedAt: string; endedAt: string | null }) {
        return this.raw('POST', `/activities/${id}`, activity);
    }

    // Creates a finished activity of a project on a day, with times like "09:00" (UTC)
    async seedActivity(projectName: string, day: string, from: string, to: string): Promise<ApiActivity> {
        await this.startProject(projectName);
        await this.stopProject(projectName);

        const today = new Date().toISOString().slice(0, 10);
        const created = (await this.dailyActivities(today)).activities
            .filter((a) => a.projectName === projectName)
            .reduce((latest, a) => (a.id > latest.id ? a : latest));

        const startedAt = `${day}T${from}:00Z`;
        const endedAt = `${day}T${to}:00Z`;
        const response = await this.changeActivity(created.id, { projectName, startedAt, endedAt });
        if (!response.ok()) {
            throw new Error(`seeding activity failed: ${response.status()} ${await response.text()}`);
        }

        return { id: created.id, projectName, startedAt, endedAt };
    }

    // Deletes the projects (and with them the activities) the tests of this user created
    async cleanup() {
        const { activeProject, projects } = await this.projects(NAME_PREFIX);
        if (activeProject) await this.stopProject(activeProject.name);
        for (const project of [...(activeProject ? [activeProject] : []), ...projects]) {
            await this.deleteProject(project.name);
        }
    }
}
