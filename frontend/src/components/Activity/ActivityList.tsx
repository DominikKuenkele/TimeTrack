import React from 'react';
import { Activity, getActivityDurationInSeconds } from '../../types';
import ActivityItem from './ActivityItem';
import './ActivityList.css';

interface ActivityListListProps {
    activities: Activity[]
}

const ActivityList: React.FC<ActivityListListProps> = ({
    activities,
}) => {
    const totalRuntimeMap = activities.reduce((acc, activity) => {
        acc[activity.projectName] = (acc[activity.projectName] || 0) + getActivityDurationInSeconds(activity);
        return acc;
    }, {} as Record<string, number>);

    return activities.length === 0 ? (
        <div className="no-activities">No activites found.</div>
    ) : (
        <>
            <ul className={'activity-list'}>
                {activities.map((activity) => (
                    <li key={`activity-${activity.id}`}>
                        <ActivityItem
                            activity={activity}
                            totalRuntime={totalRuntimeMap[activity.projectName]}
                        />
                    </li>
                ))}
            </ul>
        </>
    )
};

export default ActivityList; 