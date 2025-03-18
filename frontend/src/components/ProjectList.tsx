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
    const [activeProject, setActiveProject] = useState<Project | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(20);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalProjects, setTotalProjects] = useState<number>(0);

    const [movingToTop, setMovingToTop] = useState<Set<string>>(new Set());
    const [movingFromTop, setMovingFromTop] = useState<Set<string>>(new Set());

    const previousFirstProjectRef = useRef<string | null>(null);

    const projectListRef = useRef<HTMLUListElement>(null);
    const previousPositions = useRef<Record<string, DOMRect>>({});

    // Add ref to track the previous page and prevent animations during page changes
    const previousPageRef = useRef<number>(currentPage);

    const hasActiveProject = activeProject !== undefined;

    // Remove showCustomInput state since we're using direct input
    const [perPageInput, setPerPageInput] = useState<string>(perPage.toString());

    useEffect(() => {
        fetchProjects();
    }, [currentPage, perPage]);

    // Reset animation tracking when page changes
    useEffect(() => {
        // If the page has changed, reset animation tracking
        if (previousPageRef.current !== currentPage) {
            // Clear position tracking to prevent incorrect animations
            previousPositions.current = {};
            setIsAnimating(false);
            setAnimatingItems(new Set());
            setMovingToTop(new Set());
            setMovingFromTop(new Set());
            previousPageRef.current = currentPage;
        }
    }, [currentPage]);

    useEffect(() => {
        if (!loading && projects.length > 0) {
            const currentFirstProjectId = String(projects[0].id);
            if (!isAnimating) {
                previousFirstProjectRef.current = currentFirstProjectId;
            }
        }
    }, [projects, loading, isAnimating]);

    useEffect(() => {
        // Skip animation if we're loading or page just changed
        if (loading || !projectListRef.current || previousPageRef.current !== currentPage) return;

        const currentPositions = getPositions(projectListRef.current);
        const previousPos = previousPositions.current;

        // Only animate if we have previous positions and we're not changing pages
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
                // Only animate elements that exist in both previous and current positions
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
    }, [projects, loading, currentPage]);

    const fetchProjects = async (showLoading = true): Promise<void> => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            // Only store positions for animation if we're not changing pages and it's not initial load
            if (projectListRef.current && !showLoading && previousPageRef.current === currentPage) {
                previousPositions.current = getPositions(projectListRef.current);
            }

            const data = await projectService.getAllProjects(currentPage, perPage);
            setProjects(data.projects);
            setActiveProject(data.activeProject ?? undefined);
            setTotalPages(data.totalPages);
            setTotalProjects(data.total);
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

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            // Clear positions to prevent incorrect animations when page changes
            previousPositions.current = {};
            setCurrentPage(newPage);
            // Scroll to top when changing pages
            window.scrollTo(0, 0);
        }
    };

    // Handle items per page change
    const handlePerPageChange = (newPerPage: number) => {
        if (newPerPage !== perPage) {
            // Reset to first page when changing items per page
            previousPositions.current = {};
            setPerPage(newPerPage);
            setCurrentPage(1);
            // Scroll to top when changing per page
            window.scrollTo(0, 0);
        }
    };

    // Handle per page input change
    const handlePerPageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow positive numbers
        const value = e.target.value.replace(/\D/g, '');
        setPerPageInput(value);

        // Apply the value immediately if valid
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
            handlePerPageChange(numValue);
        }
    };

    // Handle blur event (for when user clicks away)
    const handlePerPageInputBlur = () => {
        // Reset to current perPage if empty or invalid
        if (!perPageInput || parseInt(perPageInput, 10) <= 0) {
            setPerPageInput(perPage.toString());
        }
    };

    // Generate page number buttons
    const renderPageNumbers = () => {
        const pageNumbers: React.ReactNode[] = [];
        const maxPageButtons = 5; // Maximum number of page buttons to show

        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        // Adjust start if we're near the end
        if (endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        // Add first page button if not included in range
        if (startPage > 1) {
            pageNumbers.push(
                <button
                    key="1"
                    onClick={() => handlePageChange(1)}
                    className={`pagination-page-button ${1 === currentPage ? 'active' : ''}`}
                >
                    1
                </button>
            );

            // Add ellipsis if there's a gap
            if (startPage > 2) {
                pageNumbers.push(
                    <span key="ellipsis1" className="pagination-ellipsis">...</span>
                );
            }
        }

        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`pagination-page-button ${i === currentPage ? 'active' : ''}`}
                >
                    {i}
                </button>
            );
        }

        // Add last page button if not included in range
        if (endPage < totalPages) {
            // Add ellipsis if there's a gap
            if (endPage < totalPages - 1) {
                pageNumbers.push(
                    <span key="ellipsis2" className="pagination-ellipsis">...</span>
                );
            }

            pageNumbers.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className={`pagination-page-button ${totalPages === currentPage ? 'active' : ''}`}
                >
                    {totalPages}
                </button>
            );
        }

        return pageNumbers;
    };

    if (loading) {
        return <div className="loading">Loading projects...</div>;
    }

    const displayProjects = [];
    if (activeProject) {
        displayProjects.push(activeProject);
    }
    displayProjects.push(...projects);

    return (
        <div className="project-list-container">
            <h2>Projects</h2>

            <CreateProjectForm onProjectCreated={() => fetchProjects(false)} />

            {error && <div className="error">{error}</div>}

            {displayProjects.length === 0 ? (
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
                                        onProjectUpdated={() => fetchProjects(false)}
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

                    {totalPages > 0 && (
                        <div className="pagination-container">
                            <div className="pagination">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="pagination-button"
                                >
                                    Previous
                                </button>

                                <div className="pagination-numbers">
                                    {renderPageNumbers()}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="pagination-button"
                                >
                                    Next
                                </button>
                            </div>

                            <div className="pagination-info">
                                Page {currentPage} of {totalPages} -
                                ({totalProjects} {totalProjects === 1 ? 'project' : 'projects'})
                            </div>

                            <div className="per-page-selector">
                                <label htmlFor="per-page">Projects per page:</label>
                                <input
                                    type="text"
                                    id="per-page"
                                    value={perPageInput}
                                    onChange={handlePerPageInputChange}
                                    onBlur={handlePerPageInputBlur}
                                    className="per-page-input"
                                    placeholder="Enter number"
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProjectList; 