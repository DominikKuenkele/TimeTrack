import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/api';
import { Activity } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';
import { dateToDayString } from '../../utils/timeUtils';
import { useAuth } from '../AuthContext';
import ActivityList from './ActivityList';
import './ActivityOverview.css';


const ActivityOverview: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [startDay, setStartDay] = useState<Date>(new Date());

    const { isLoggedIn, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, isLoading, navigate])

    useEffect(() => {
        fetchActivities();
    }, [startDay])

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
        }
    };

    return (
        <div className="activity-overview">
            <h2>Activities</h2>

            <div className="activity-overview-header">
                <div className='activity-date-picker'>
                    <button onClick={() => setStartDay(new Date(startDay.getTime() - 86400000))}>⮜</button>
                    <input
                        type="date"
                        value={dateToDayString(startDay)}
                        onChange={(e) => setStartDay(new Date(e.target.value))}
                        placeholder="Select start date"
                    />
                    <button onClick={() => setStartDay(new Date(startDay.getTime() + 86400000))}>⮞</button>
                </div>
            </div>

            {error && <div className="activity-overview-error">{error}</div>}

            <ActivityList
                activities={activities}
            />
        </div >
    );
};

export default ActivityOverview; 