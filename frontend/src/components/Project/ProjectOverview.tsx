import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/api';
import { Project } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';
import { useAuth } from '../AuthContext';
import SearchForm from '../SearchForm';
import CreateProjectForm from './CreateProjectForm';
import ProjectList from './ProjectList';
import './ProjectOverview.css';


const ProjectOverview: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState<string>('');

    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalProjects, setTotalProjects] = useState<number>(0);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(20);

    const [updateProjects, setUpdateProjects] = useState<boolean>(true);

    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, navigate])

    useEffect(() => {
        fetchProjects();
    }, [currentPage, perPage, searchTerm, updateProjects])

    const fetchProjects = async (): Promise<void> => {
        if (!isLoggedIn) {
            return
        }

        try {
            const data = await projectService.getProjectsLike(currentPage, perPage, searchTerm);
            if (currentPage > data.totalPages) {
                setCurrentPage(data.totalPages)
            }
            setProjects(data.projects);
            setActiveProject(data.activeProject);
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
                <CreateProjectForm onProjectCreated={handleProjectCreation} />
                <SearchForm searchTerm={searchTerm} setSearchTerm={udpateSearchTerm} />
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