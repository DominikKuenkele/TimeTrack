import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/api';
import { Activity, getBreakTimeInSeconds } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';
import { dateToDayString, formatRuntime } from '../../utils/timeUtils';
import { useAuth } from '../AuthContext';
import ActivityList from './ActivityList';
import './ActivityOverview.css';


const ActivityOverview: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [startDay, setStartDay] = useState<Date>(new Date());

    const { isLoggedIn, isLoading } = useAuth();
    const navigate = useNavigate();

    const [updateProjects, setUpdateActivities] = useState<boolean>(true);

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, isLoading, navigate])

    useEffect(() => {
        fetchActivities();
    }, [startDay, updateProjects])

    const fetchActivities = async (): Promise<void> => {
        if (!isLoggedIn) {
            return
        }

        try {
            const data = await activityService.getActivities(startDay);

            setActivities(data);
            setError(null);
        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(
                err,
                'Failed to fetch projects. Please try again later.'
            );
            setError(`Error: ${errorMessage}`);
            console.error(err);
        } finally {
            setUpdateActivities(false);
        }
    };

    const totalRuntime = activities.length > 0
        ? Math.floor(((activities[activities.length - 1].endedAt?.getTime() ?? activities[activities.length - 1].startedAt.getTime()) - activities[0].startedAt.getTime()) / 1000)
        : 0;

    const lunchBreak = activities.reduce((breakTime, activity, index) => {
        return Math.max(breakTime, activities[index + 1] ? getBreakTimeInSeconds(activity, activities[index + 1]) : 0);
    }, 0 as number);

    return (
        <div className="activity-overview">
            <h2>Activities</h2>

            <div className="activity-overview-header">
                <div className='activity-date-picker'>
                    <button onClick={() => setStartDay(new Date(startDay.getTime() - 86400000))}>◀</button>
                    <input
                        type="date"
                        value={dateToDayString(startDay)}
                        onChange={(e) => setStartDay(new Date(e.target.value))}
                        placeholder="Select start date"
                    />
                    <button onClick={() => setStartDay(new Date(startDay.getTime() + 86400000))}>▶</button>
                </div>
            </div>

            {error && <div className="activity-overview-error">{error}</div>}

            <div className="activity-overview-total-runtime">
                <strong>Total Time: </strong>{formatRuntime(totalRuntime)} (Break: {formatRuntime(lunchBreak)})
            </div>

            <ActivityList
                activities={activities}
                setUpdateActivities={setUpdateActivities}
            />
        </div >
    );
};

export default ActivityOverview; 