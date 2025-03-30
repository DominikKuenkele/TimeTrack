import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/api';
import { Activity } from '../../types';
import { dateToDayString } from '../../utils/dateUtils';
import { extractErrorMessage } from '../../utils/errorUtils';
import { useAuth } from '../AuthContext';
import './ActivityOverview.css';


const ActivityOverview: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [startDay, setStartDay] = useState<Date>(new Date());
    const [endDay, setEndDay] = useState<Date>(new Date());

    const { isLoggedIn, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log(isLoading, isLoggedIn);
        if (!isLoading && !isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, isLoading, navigate])

    useEffect(() => {
        fetchActivities();
    }, [startDay, endDay])

    const fetchActivities = async (): Promise<void> => {
        if (!isLoggedIn) {
            return
        }

        try {
            const data = await activityService.getActivities(startDay, endDay);

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
            <h2>Projects</h2>

            <div className="activity-overview-header">
                <input
                    type="date"
                    value={dateToDayString(startDay)}
                    onChange={(e) => setStartDay(new Date(e.target.value))}
                    placeholder="Select start date"
                />
                <input
                    type="date"
                    value={dateToDayString(endDay)}
                    onChange={(e) => setEndDay(new Date(e.target.value))}
                    placeholder="Select end date"
                />
            </div>

            {error && <div className="activity-overview-error">{error}</div>}

            {/* <ActivityList
                activities={activities}
            /> */}
        </div>
    );
};

export default ActivityOverview; 