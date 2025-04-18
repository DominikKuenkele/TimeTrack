import React, { useState } from 'react';
import { Activity, getActivityDurationInSeconds, getBreakTimeInSeconds } from '../../types';
import ActivityItem from './ActivityItem';
import './ActivityList.css';

interface ActivityListListProps {
    activities: Activity[]
    setUpdateActivities: (update: boolean) => void
}


const colors = [
    '#FFDFBA', '#FFB3BA', '#BAFFC9', '#BAE1FF', '#E0BBE4',
    '#957DAD', '#D291BC', '#FEC8D8', '#FFABAB', '#F49AC2'
];

const ActivityList: React.FC<ActivityListListProps> = ({
    activities,
    setUpdateActivities,
}) => {
    const [selectedProject, setSelectedProject] = useState<string>("");

    const totalRuntimeMap = activities.reduce((acc, activity) => {
        acc[activity.projectName] = (acc[activity.projectName] || 0) + getActivityDurationInSeconds(activity);
        return acc;
    }, {} as Record<string, number>);

    const colorMap = activities.reduce((acc, activity) => {
        if (!acc[activity.projectName]) {
            const colorIndex = Object.keys(acc).length % colors.length;
            acc[activity.projectName] = colors[colorIndex];
        }
        return acc;
    }, {} as Record<string, string>);

    return activities.length === 0 ? (
        <div className="no-activities">No activites found.</div>
    ) : (
        <>
            <ul className={'activity-list'}>
                {activities.map((activity, index) => {
                    const breakTime = activities[index + 1] && getBreakTimeInSeconds(activity, activities[index + 1]);

                    return <li
                        key={`activity-${activity.id}`}
                        style={{ marginBottom: `${breakTime / 30}px` }}
                    >
                        <ActivityItem
                            activity={activity}
                            totalRuntime={totalRuntimeMap[activity.projectName]}
                            isSelectedProject={selectedProject === activity.projectName}
                            setSelectedProject={setSelectedProject}
                            color={colorMap[activity.projectName]}
                            setUpdateActivities={setUpdateActivities}
                        />
                    </li>
                })}
            </ul>
        </>
    )
};

export default ActivityList; 