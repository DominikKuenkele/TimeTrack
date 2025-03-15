import React, { useEffect, useRef, useState } from 'react';
import { projectService } from '../services/api';
import { Project } from '../types';
import { extractErrorMessage } from '../utils/errorUtils';
import CreateProjectForm from './CreateProjectForm';
import ProjectItem from './ProjectItem';
import './ProjectList.css';

const getPositions = (container: HTMLElement | null): Record<string, DOMRect> => {
    if (!container) return {};

    const positions: Record<string, DOMRect> = {};
    const projectElements = container.querySelectorAll('.project-item');

    projectElements.forEach((el) => {
        const id = el.getAttribute('data-id');
        if (id) {
            positions[id] = el.getBoundingClientRect();
        }
    });

    return positions;
};

const ProjectList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

    const [movingToTop, setMovingToTop] = useState<Set<string>>(new Set());
    const [movingFromTop, setMovingFromTop] = useState<Set<string>>(new Set());

    const previousFirstProjectRef = useRef<string | null>(null);

    const projectListRef = useRef<HTMLUListElement>(null);
    const previousPositions = useRef<Record<string, DOMRect>>({});

    const hasActiveProject = projects.length > 0 && projects[0].StartedAt !== null;

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!loading && projects.length > 0) {
            const currentFirstProjectId = String(projects[0].ID);
            if (!isAnimating) {
                previousFirstProjectRef.current = currentFirstProjectId;
            }
        }
    }, [projects, loading, isAnimating]);

    useEffect(() => {
        if (loading || !projectListRef.current) return;

        const currentPositions = getPositions(projectListRef.current);
        const previousPos = previousPositions.current;

        if (Object.keys(previousPos).length) {
            setIsAnimating(true);
            const movingItems = new Set<string>();
            const topMovers = new Set<string>();
            const fromTopMovers = new Set<string>();

            let currentFirstPositionId: string | null = null;
            if (projects.length > 0) {
                currentFirstPositionId = String(projects[0].ID);
            }

            const previousFirstPositionId = previousFirstProjectRef.current;

            const projectElements = projectListRef.current.querySelectorAll('.project-item');

            projectElements.forEach((el) => {
                const id = el.getAttribute('data-id');
                if (id && previousPos[id] && currentPositions[id]) {
                    const deltaY = previousPos[id].top - currentPositions[id].top;

                    if (Math.abs(deltaY) > 5) {
                        el.classList.add('animating');
                        movingItems.add(id);

                        const htmlEl = el as HTMLElement;

                        const isMovingUp = deltaY > 0;
                        const isMovingToTop = id === currentFirstPositionId && isMovingUp;

                        const wasAtTop = id === previousFirstPositionId && id !== currentFirstPositionId;

                        if (isMovingToTop) {
                            htmlEl.style.zIndex = '15';
                            topMovers.add(id);
                        } else if (wasAtTop) {
                            htmlEl.style.zIndex = '10';
                            fromTopMovers.add(id);
                        } else {
                            htmlEl.style.zIndex = isMovingUp ? '5' : '1';
                        }

                        htmlEl.style.transform = `translateY(${deltaY}px)`;
                        htmlEl.style.transition = 'none';

                        void htmlEl.offsetHeight;

                        htmlEl.style.transform = '';
                        htmlEl.style.transition = 'transform 0.5s ease-out';
                    }
                }
            });

            setAnimatingItems(movingItems);
            setMovingToTop(topMovers);
            setMovingFromTop(fromTopMovers);

            const clearAnimation = setTimeout(() => {
                projectElements.forEach(el => {
                    el.classList.remove('animating');
                    const htmlEl = el as HTMLElement;
                    htmlEl.style.transform = '';
                    htmlEl.style.zIndex = '';
                });
                setIsAnimating(false);
                setAnimatingItems(new Set());
                setMovingToTop(new Set());
                setMovingFromTop(new Set());

                if (currentFirstPositionId) {
                    previousFirstProjectRef.current = currentFirstPositionId;
                }
            }, 300);

            return () => clearTimeout(clearAnimation);
        }

        previousPositions.current = currentPositions;
    }, [projects, loading]);

    const fetchProjects = async (showLoading = true): Promise<void> => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            if (projectListRef.current && !showLoading) {
                previousPositions.current = getPositions(projectListRef.current);
            }

            const data = await projectService.getAllProjects();
            setProjects(data);
            setError(null);
        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(
                err,
                'Failed to fetch projects. Please try again later.'
            );
            setError(`Error: ${errorMessage}`);
            console.error(err);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading projects...</div>;
    }

    return (
        <div className="project-list-container">
            <h2>Projects</h2>

            <CreateProjectForm onProjectCreated={() => fetchProjects(false)} />

            {error && <div className="error">{error}</div>}

            {projects.length === 0 ? (
                <div className="no-projects">No projects found. Create your first project!</div>
            ) : (
                <ul className={`project-list ${hasActiveProject ? 'has-active-project' : ''}`} ref={projectListRef}>
                    {projects.map((project, index) => {
                        const isMovingToTop = movingToTop.has(String(project.ID));
                        const isMovingFromTop = movingFromTop.has(String(project.ID));
                        const isAnimating = animatingItems.has(String(project.ID));

                        let animationClass = '';
                        if (isAnimating) {
                            if (isMovingToTop) {
                                animationClass = 'animating moving-to-top';
                            } else if (isMovingFromTop) {
                                animationClass = 'animating moving-from-top';
                            } else {
                                animationClass = 'animating';
                            }
                        }

                        // Return the project item
                        const projectItem = (
                            <li key={`project-${project.ID}`}>
                                <ProjectItem
                                    project={project}
                                    onProjectUpdated={() => fetchProjects(false)}
                                    data-id={project.ID}
                                    className={animationClass}
                                />
                            </li>
                        );

                        // Add separator after the first item if it's active
                        if (index === 0 && hasActiveProject) {
                            return [
                                projectItem,
                                <li key="separator" className="separator-item">
                                    <div className="project-separator"></div>
                                </li>
                            ];
                        }

                        return projectItem;
                    })}
                </ul>
            )}
        </div>
    );
};

export default ProjectList; 