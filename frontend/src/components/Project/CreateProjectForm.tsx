import React, { useState } from 'react';
import { projectService } from '../../services/api';
import { extractErrorMessage } from '../../utils/errorUtils';
import './CreateProjectForm.css';

interface CreateProjectFormProps {
    onProjectCreated: () => void;
}

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onProjectCreated }) => {
    const [newProjectName, setNewProjectName] = useState<string>('');
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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
            onProjectCreated();
            setError(null);
        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(
                err,
                `Failed to create project "${newProjectName}"`
            );
            setError(`Error: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    return (
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
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default CreateProjectForm; 