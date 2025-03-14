import React, { useEffect, useState } from 'react';
import { projectService } from '../services/api';
import { Project } from '../types';
import './ProjectList.css';

// Timer component to show real-time duration
const ProjectTimer: React.FC<{ startedAt: string; runtimeSeconds: number }> = ({ startedAt, runtimeSeconds }) => {
    const [elapsedTime, setElapsedTime] = useState<number>(0);

    useEffect(() => {
        // Calculate initial elapsed time
        const startTime = new Date(startedAt).getTime();
        const initialElapsed = Math.floor((Date.now() - startTime) / 1000) + runtimeSeconds;
        setElapsedTime(initialElapsed);

        // Update timer every second
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        // Clean up interval on unmount
        return () => clearInterval(timer);
    }, [startedAt, runtimeSeconds]);

    // Format time as HH:MM:SS
    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    };

    return (
        <div className="project-timer">
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">{formatTime(elapsedTime)}</span>
        </div>
    );
};

const ProjectList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [newProjectName, setNewProjectName] = useState<string>('');
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

    // Fetch all projects on component mount
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async (showLoading = true): Promise<void> => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const data = await projectService.getAllProjects();
            setProjects(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch projects. Please try again later.');
            console.error(err);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const handleStartProject = async (projectName: string): Promise<void> => {
        try {
            await projectService.startProject(projectName);
            fetchProjects();
        } catch (err) {
            setError(`Failed to start project "${projectName}". Please try again.`);
            console.error(err);
        }
    };

    const handleStopProject = async (projectName: string): Promise<void> => {
        try {
            await projectService.stopProject(projectName);
            fetchProjects();
        } catch (err) {
            setError(`Failed to stop project "${projectName}". Please try again.`);
            console.error(err);
        }
    };

    const handleCreateProject = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!newProjectName.trim()) {
            setError('Project name cannot be empty.');
            return;
        }

        try {
            setIsCreating(true);
            await projectService.createProject(newProjectName);
            setNewProjectName('');
            fetchProjects();
            setError(null);
        } catch (err) {
            setError(`Failed to create project "${newProjectName}". Please try again.`);
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async (projectName: string): Promise<void> => {
        try {
            await projectService.deleteProject(projectName);
            setDeleteConfirmation(null);
            fetchProjects();
        } catch (err) {
            setError(`Failed to delete project "${projectName}". Please try again.`);
            console.error(err);
        }
    };

    const confirmDelete = (projectName: string): void => {
        setDeleteConfirmation(projectName);
    };

    const cancelDelete = (): void => {
        setDeleteConfirmation(null);
    };

    const isProjectActive = (project: Project): boolean => {
        return project.StartedAt !== null;
    };

    // Format runtime in HH:MM:SS format from seconds
    const formatRuntime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    if (loading) {
        return <div className="loading">Loading projects...</div>;
    }

    return (
        <div className="project-list-container">
            <h2>Projects</h2>

            {/* Create Project Form */}
            <div className="create-project-form">
                <form onSubmit={handleCreateProject}>
                    <input
                        type="text"
                        placeholder="New project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        disabled={isCreating}
                    />
                    <button
                        type="submit"
                        className="create-button"
                        disabled={isCreating || !newProjectName.trim()}
                    >
                        {isCreating ? 'Creating...' : 'Create Project'}
                    </button>
                </form>
            </div>

            {/* Error Message */}
            {error && <div className="error">{error}</div>}

            {/* Project List */}
            {projects.length === 0 ? (
                <p className="no-projects">No projects found.</p>
            ) : (
                <ul className="project-list">
                    {projects.map((project) => (
                        <li key={project.ID} className="project-item">
                            {/* Project Info (Left) */}
                            <div className="project-info">
                                <h3>{project.Name}</h3>
                                <div className="project-runtime">
                                    Total Runtime: {formatRuntime(project.RuntimeInSeconds)}
                                </div>
                                <div className="project-status">
                                    Status: <span className={isProjectActive(project) ? 'active' : 'inactive'}>
                                        {isProjectActive(project) ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {/* Timer (Middle) */}
                            <div className="project-timer-container">
                                {isProjectActive(project) && project.StartedAt && (
                                    <ProjectTimer
                                        startedAt={project.StartedAt}
                                        runtimeSeconds={project.RuntimeInSeconds}
                                    />
                                )}
                            </div>

                            {/* Actions (Right) */}
                            <div className="project-actions">
                                <button
                                    className="start-button"
                                    onClick={() => handleStartProject(project.Name)}
                                    disabled={isProjectActive(project)}
                                >
                                    Start
                                </button>
                                <button
                                    className="stop-button"
                                    onClick={() => handleStopProject(project.Name)}
                                    disabled={!isProjectActive(project)}
                                >
                                    Stop
                                </button>
                                <button
                                    className="delete-button"
                                    onClick={() => confirmDelete(project.Name)}
                                    disabled={isProjectActive(project)}
                                >
                                    Delete
                                </button>
                            </div>

                            {/* Delete Confirmation */}
                            {deleteConfirmation === project.Name && (
                                <div className="delete-confirmation">
                                    <p>Are you sure you want to delete <strong>{project.Name}</strong>?</p>
                                    <div className="confirmation-buttons">
                                        <button
                                            className="confirm-delete-button"
                                            onClick={() => handleDeleteProject(project.Name)}
                                        >
                                            Yes, Delete
                                        </button>
                                        <button
                                            className="cancel-button"
                                            onClick={cancelDelete}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProjectList; 