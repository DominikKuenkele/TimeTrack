import React from 'react';
import { Activity, getActivityDurationInSeconds } from '../../types';
import { formatDateTime, formatRuntime } from '../../utils/timeUtils';
import './ActivityItem.css';

interface ActivityItemProps {
    activity: Activity;
    totalRuntime: number;
    isSelectedProject: boolean;
    setSelectedProject: (projectName: string) => void;
    color: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, totalRuntime, isSelectedProject, setSelectedProject, color }) => {
    const runtime = getActivityDurationInSeconds(activity);

    return (
        <div
            className={`activity-item ${isSelectedProject && 'is-selected'}`}
            data-id={activity.id}
            style={{ height: `max(60px, ${runtime / 30}px)`, backgroundColor: `${color}30` }}
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
                    {activity.startedAt && formatDateTime(activity.startedAt)}
                </div>
                <div>
                    {activity.endedAt && formatDateTime(activity.endedAt)}
                </div>
            </div>
        </div>
    );
};

export default ActivityItem; 