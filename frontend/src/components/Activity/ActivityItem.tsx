import React, { useState } from 'react';
import { activityService } from '../../services/api';
import { Activity, getActivityDurationInSeconds } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';
import { formatDateTime, formatRuntime, toLocalISOString } from '../../utils/timeUtils';
import './ActivityItem.css';

interface ActivityItemProps {
    activity: Activity;
    totalRuntime: number;
    isSelectedProject: boolean;
    setSelectedProject: (projectName: string) => void;
    color: string;
    setUpdateActivities: (update: boolean) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, totalRuntime, isSelectedProject, setSelectedProject, color, setUpdateActivities }) => {
    const [changedProjectName, setChangedProjectName] = useState<string>(activity.projectName);
    const [changedStartetAt, setChangedStartedAt] = useState<string>(toLocalISOString(activity.startedAt));
    const [changedEndedAt, setChangedEndedAt] = useState<string>(toLocalISOString(activity.endedAt));

    const [changeDialogue, setChangeDialogue] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const runtime = getActivityDurationInSeconds(activity);

    const handleCreateProject = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!changedProjectName.trim()) {
            setError('Project name cannot be empty.');
            return;
        }

        try {
            const changedActivity: Activity = {
                id: activity.id,
                projectName: changedProjectName,
                startedAt: new Date(changedStartetAt),
                endedAt: changedEndedAt ? new Date(changedEndedAt) : null
            }

            if (isNaN(changedActivity.startedAt.getTime())) {
                setError("startedAt invalid")
                return
            }

            if (changedActivity.endedAt && isNaN(changedActivity.endedAt.getTime())) {
                setError("endedAt invalid")
                return
            }

            await activityService.changeActivity(changedActivity);
            setError("");
            setChangeDialogue(false);
            setUpdateActivities(true);
        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(
                err,
                'Failed to change activity'
            );
            setError(`Error: ${errorMessage}`);
            console.error(err);
        }
    }

    return (
        <div
            className={`activity-item ${isSelectedProject && 'is-selected'}`}
            data-id={activity.id}
            style={{ height: `max(${changeDialogue ? 250 : 60}px, ${runtime / 30}px)`, backgroundColor: `${color}30` }}
            onMouseEnter={() => setSelectedProject(activity.projectName)}
            onMouseLeave={() => setSelectedProject("")}
        >
            <h3>{activity.projectName}</h3>
            {isSelectedProject && (
                <div className="activity-total-runtime">
                    {formatRuntime(totalRuntime)}
                </div>
            )}
            <div className="activity-runtime">
                <div>
                    {formatDateTime(activity.startedAt)}
                </div>
                <div>
                    {activity.endedAt && formatDateTime(activity.endedAt)}
                </div>
            </div>


            {!changeDialogue
                ? (
                    <button
                        className="change-button"
                        onClick={() => setChangeDialogue(true)}
                    >
                        Change
                    </button>
                )
                : (
                    <div className="change-dialogue">
                        {error && <div className="error change-error">{error}</div>}
                        <form onSubmit={handleCreateProject}>
                            <input
                                type="text"
                                placeholder="Project name"
                                value={changedProjectName}
                                onChange={(e) => setChangedProjectName(e.target.value)}
                            />
                            <input
                                type="text"
                                value={changedStartetAt}
                                onChange={(e) => setChangedStartedAt(e.target.value)}
                                placeholder="Start time"
                            />
                            <input
                                type="text"
                                value={changedEndedAt}
                                onChange={(e) => setChangedEndedAt(e.target.value)}
                                placeholder="End time"
                            />
                            <div className="confirmation-buttons">
                                <button
                                    type="submit"
                                    className="confirm-change-button"
                                >
                                    Change
                                </button>
                                <button
                                    className="cancel-button"
                                    onClick={() => setChangeDialogue(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
        </div>
    );
};

export default ActivityItem; 