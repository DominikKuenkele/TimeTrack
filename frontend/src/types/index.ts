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
    startedAt: Date;
    endedAt: Date | null;
}

export interface DailyActivities {
    activities: Activity[];
    worktime: number;
    breaktime: number;
    overtime: number;
}

export const getActivityDurationInSeconds = (activity: Activity): number => {
    return activity.endedAt
        ? Math.floor((activity.endedAt.getTime() - activity.startedAt.getTime()) / 1000)
        : 0;
}

export const getBreakTimeInSeconds = (previous: Activity, next: Activity): number => {
    return previous.endedAt
        ? Math.floor((next.startedAt.getTime() - previous.endedAt.getTime()) / 1000)
        : 0;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
} 