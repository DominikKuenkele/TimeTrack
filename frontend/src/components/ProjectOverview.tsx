import React, { useEffect, useState } from 'react';
import { projectService } from '../services/api';
import { Project } from '../types';
import { extractErrorMessage } from '../utils/errorUtils';
import CreateProjectForm from './CreateProjectForm';
import ProjectList from './ProjectList';
import './ProjectOverview.css';
import SearchForm from './SearchForm';


const ProjectOverview: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState<string>('');

    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalProjects, setTotalProjects] = useState<number>(0);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(20);

    const [updateProjects, setUpdateProjects] = useState<boolean>(true);

    useEffect(() => {
        fetchProjects();
    }, [currentPage, perPage, searchTerm, updateProjects])

    const fetchProjects = async (): Promise<void> => {
        try {
            const data = await projectService.getProjectsLike(currentPage, perPage, searchTerm);
            if (currentPage > data.totalPages) {
                setCurrentPage(data.totalPages)
            }
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
            setUpdateProjects(false);
        }
    };

    const handleProjectCreation = () => {
        setCurrentPage(1);
        setUpdateProjects(true);
    }

    const udpateSearchTerm = (searchTerm: string) => {
        setCurrentPage(1);
        setSearchTerm(searchTerm);
    }

    return (
        <div className="project-overview">
            <h2>Projects</h2>

            <div className="project-overview-header">
                <SearchForm searchTerm={searchTerm} setSearchTerm={udpateSearchTerm} />
                <CreateProjectForm onProjectCreated={handleProjectCreation} />
            </div>

            {error && <div className="project-overview-error">{error}</div>}

            <ProjectList
                activeProject={activeProject}
                projects={projects}
                totalPages={totalPages}
                totalProjects={totalProjects}
                perPage={perPage}
                setPerPage={setPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                fetchProjects={fetchProjects}
            />
        </div>
    );
};

export default ProjectOverview; 