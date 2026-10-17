import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/api';
import { DailyActivities } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';
import { dateToDayString, formatRuntime } from '../../utils/timeUtils';
import { useAuth } from '../useAuth';
import ActivityList from './ActivityList';
import './ActivityOverview.css';


const ActivityOverview: React.FC = () => {
    const [dailyActivities, setDailyActivities] = useState<DailyActivities>({
        activities: [],
        worktime: 0,
        breaktime: 0,
        overtime: 0,
    });
    const [error, setError] = useState<string | null>(null);

    const [day, setDay] = useState<Date>(new Date());

    const { isLoggedIn, isLoading } = useAuth();
    const navigate = useNavigate();

    const [reload, setReload] = useState<number>(0);

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, isLoading, navigate])

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }
        let cancelled = false;
        activityService.getDailyActivities(day)
            .then((data) => {
                if (cancelled) return;
                setDailyActivities(data);
                setError(null);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                const errorMessage = extractErrorMessage(
                    err,
                    'Failed to fetch projects. Please try again later.'
                );
                setError(`Error: ${errorMessage}`);
                console.error(err);
            });
        return () => { cancelled = true; };
    }, [isLoggedIn, day, reload])

    const setUpdateActivities = useCallback((update: boolean) => {
        if (update) setReload((n) => n + 1);
    }, []);

    return (
        <div className="activity-overview">
            <h2>Activities</h2>

            <div className="activity-overview-header">
                <div className='activity-date-picker'>
                    <button onClick={() => setDay(new Date(day.getTime() - 86400000))}>◀</button>
                    <input
                        type="date"
                        value={dateToDayString(day)}
                        onChange={(e) => setDay(new Date(e.target.value))}
                        placeholder="Select start date"
                    />
                    <button onClick={() => setDay(new Date(day.getTime() + 86400000))}>▶</button>
                </div>
            </div>

            {error && <div className="activity-overview-error">{error}</div>}

            <div className="activity-overview-total-runtime">
                <strong>Total Time: </strong>{formatRuntime(dailyActivities.worktime)} (Break: {formatRuntime(dailyActivities.breaktime)}),
                <strong> Overtime: </strong>{formatRuntime(dailyActivities.overtime)}
            </div>

            <ActivityList
                dailyActivities={dailyActivities}
                setUpdateActivities={setUpdateActivities}
            />
        </div >
    );
};

export default ActivityOverview; 