import React, { useState } from 'react';
import { projectService } from '../services/api';
import { Project } from '../types';
import { extractErrorMessage } from '../utils/errorUtils';
import { formatRuntime } from '../utils/timeUtils';
import './ProjectItem.css';
import ProjectTimer from './ProjectTimer';

interface ProjectItemProps {
    project: Project;
    onProjectUpdated: () => void;
    'data-id'?: string | number;
    className?: string;
}

const ProjectItem: React.FC<ProjectItemProps> = ({ project, onProjectUpdated, className = '', ...props }) => {
    const [deleteConfirmation, setDeleteConfirmation] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isProjectActive = (): boolean => {
        return project.StartedAt !== null;
    };

    const handleStartProject = async (): Promise<void> => {
        try {
            await projectService.startProject(project.Name);
            onProjectUpdated();
            setError(null);

            const scrollDuration = 300;
            const scrollStep = -window.scrollY / (scrollDuration / 15);

            const scrollInterval = setInterval(() => {
                if (window.scrollY !== 0) {
                    window.scrollBy(0, scrollStep);
                } else {
                    clearInterval(scrollInterval);
                }
            }, 15);

            setTimeout(() => {
                clearInterval(scrollInterval);
                window.scrollTo(0, 0);
            }, scrollDuration);

        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(
                err,
                `Failed to start project "${project.Name}"`
            );
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleStopProject = async (): Promise<void> => {
        try {
            await projectService.stopProject(project.Name);
            onProjectUpdated();
            setError(null);
        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(
                err,
                `Failed to stop project "${project.Name}"`
            );
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDeleteProject = async (): Promise<void> => {
        try {
            await projectService.deleteProject(project.Name);
            setDeleteConfirmation(false);
            onProjectUpdated();
            setError(null);
        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(
                err,
                `Failed to delete project "${project.Name}"`
            );
            setError(errorMessage);
            console.error(err);
            setDeleteConfirmation(true);
        }
    };

    const confirmDelete = (): void => {
        setDeleteConfirmation(true);
    };

    const cancelDelete = (): void => {
        setDeleteConfirmation(false);
        setError(null);
    };

    return (
        <li className={`project-item ${className}`} data-id={project.ID} {...props}>
            <div className="project-info">
                <h3>{project.Name}</h3>
                <div className="project-runtime">
                    Total Runtime: {formatRuntime(project.RuntimeInSeconds)}
                </div>
                <div className="project-status">
                    Status: <span className={isProjectActive() ? 'active' : 'inactive'}>
                        {isProjectActive() ? 'Active' : 'Inactive'}
                    </span>
                </div>
                {error && <div className="error">{error}</div>}
            </div>

            <div className="project-timer-container">
                {isProjectActive() && project.StartedAt && (
                    <ProjectTimer
                        startedAt={project.StartedAt}
                        runtimeSeconds={project.RuntimeInSeconds}
                    />
                )}
            </div>

            <div className="project-actions">
                <button
                    className="start-button"
                    onClick={handleStartProject}
                    disabled={isProjectActive()}
                >
                    Start
                </button>
                <button
                    className="stop-button"
                    onClick={handleStopProject}
                    disabled={!isProjectActive()}
                >
                    Stop
                </button>
                <button
                    className="delete-button"
                    onClick={confirmDelete}
                    disabled={isProjectActive()}
                >
                    Delete
                </button>
            </div>

            {deleteConfirmation && (
                <div className="delete-confirmation">
                    <p>Are you sure you want to delete <strong>{project.Name}</strong>?</p>
                    {error && <div className="error confirmation-error">{error}</div>}
                    <div className="confirmation-buttons">
                        <button
                            className="confirm-delete-button"
                            onClick={handleDeleteProject}
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
    );
};

export default ProjectItem; 