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

export interface Activity {
    id: number;
    projectName: string;
    startedAt: Date | null;
    endedAt: Date | null;
}

export const getActivityDuration = (activity: Activity): number => {
    return activity.endedAt && activity.startedAt
        ? Math.floor((activity.endedAt.getTime() - activity.startedAt.getTime()) / 1000)
        : 0;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
} 