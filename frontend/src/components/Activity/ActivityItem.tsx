import React, { useState } from 'react';
import { Activity, getActivityDurationInSeconds } from '../../types';
import { formatDateTime, formatRuntime } from '../../utils/timeUtils';
import './ActivityItem.css';

interface ActivityItemProps {
    activity: Activity;
    totalRuntime: number;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, totalRuntime }) => {
    const [hovered, setHovered] = useState(false);

    const runtime = getActivityDurationInSeconds(activity);

    return (
        <div
            className={'activity-item'} data-id={activity.id} style={{ height: `max(60px, ${runtime / 100}px)` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <h3>{activity.projectName}</h3>
            <div className="activity-runtime">
                <div>
                    {activity.startedAt && formatDateTime(activity.startedAt)}
                </div>
                <div>
                    {activity.endedAt && formatDateTime(activity.endedAt)}
                </div>
            </div>
            {hovered && (
                <div className="activity-total-runtime">
                    {formatRuntime(totalRuntime)}
                </div>
            )}
        </div>
    );
};

export default ActivityItem; 