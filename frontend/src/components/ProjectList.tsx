import React, { useEffect, useRef, useState } from 'react';
import { Project } from '../types';
import Pagination from './Pagination';
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

interface ProjectListProps {
    activeProject: Project | undefined
    projects: Project[]

    totalPages: number
    totalProjects: number
    perPage: number
    setPerPage: (perPage: number) => void
    currentPage: number
    setCurrentPage: (currentPage: number) => void

    fetchProjects: (currentPage: number, perPage: number) => void
}

const ProjectList: React.FC<ProjectListProps> = ({
    activeProject,
    projects,
    totalPages,
    totalProjects,
    perPage,
    setPerPage,
    currentPage,
    setCurrentPage,
    fetchProjects
}) => {
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

    const [movingToTop, setMovingToTop] = useState<Set<string>>(new Set());
    const [movingFromTop, setMovingFromTop] = useState<Set<string>>(new Set());

    const previousFirstProjectRef = useRef<string | null>(null);

    const projectListRef = useRef<HTMLUListElement>(null);
    const previousPositions = useRef<Record<string, DOMRect>>({});

    const previousPageRef = useRef<number>(currentPage);

    const hasActiveProject = activeProject !== undefined;

    const updateProjects = () => {
        if (projectListRef.current && previousPageRef.current === currentPage) {
            previousPositions.current = getPositions(projectListRef.current);
        }

        fetchProjects(currentPage, perPage);
    }

    useEffect(() => {
        updateProjects()
    }, [currentPage, perPage]);

    useEffect(() => {
        if (previousPageRef.current !== currentPage) {
            previousPositions.current = {};
            setIsAnimating(false);
            setAnimatingItems(new Set());
            setMovingToTop(new Set());
            setMovingFromTop(new Set());
            previousPageRef.current = currentPage;
        }
    }, [currentPage]);

    useEffect(() => {
        if (projects.length > 0) {
            const currentFirstProjectId = String(projects[0].id);
            if (!isAnimating) {
                previousFirstProjectRef.current = currentFirstProjectId;
            }
        }
    }, [projects, isAnimating]);

    useEffect(() => {
        if (!projectListRef.current || previousPageRef.current !== currentPage) return;

        const currentPositions = getPositions(projectListRef.current);
        const previousPos = previousPositions.current;

        if (Object.keys(previousPos).length && previousPageRef.current === currentPage) {
            setIsAnimating(true);
            const movingItems = new Set<string>();
            const topMovers = new Set<string>();
            const fromTopMovers = new Set<string>();

            let currentFirstPositionId: string | null = null;
            if (projects.length > 0) {
                currentFirstPositionId = String(projects[0].id);
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
    }, [projects, currentPage]);

    const displayProjects = [];
    if (activeProject) {
        displayProjects.push(activeProject);
    }
    displayProjects.push(...projects);

    return displayProjects.length === 0 ? (
        <div className="no-projects">No projects found. Create your first project!</div>
    ) : (
        <>
            <ul className={`project-list ${hasActiveProject ? 'has-active-project' : ''}`} ref={projectListRef}>
                {displayProjects.map((project, index) => {
                    const isMovingToTop = movingToTop.has(String(project.id));
                    const isMovingFromTop = movingFromTop.has(String(project.id));
                    const isAnimating = animatingItems.has(String(project.id));

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

                    const projectItem = (
                        <li key={`project-${project.id}`}>
                            <ProjectItem
                                project={project}
                                onProjectUpdated={() => updateProjects()}
                                data-id={project.id}
                                className={animationClass}
                            />
                        </li>
                    );

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

            <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                perPage={perPage}
                setPerPage={setPerPage}
                totalPages={totalPages}
                totalProjects={totalProjects}
            />
        </>
    )
};

export default ProjectList; 