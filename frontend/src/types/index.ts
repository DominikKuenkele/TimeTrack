export interface Project {
    id: number;
    name: string;
    runtimeInSeconds: number;
    startedAt: Date | null;
}

export interface PaginatedProjects {
    activeProject: Project | null;
    projects: Project[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
} 