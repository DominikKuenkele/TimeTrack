export interface Project {
    ID: number;
    Name: string;
    RuntimeInSeconds: number;
    StartedAt: string | null;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
} 