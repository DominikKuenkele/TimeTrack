import React, { useEffect, useState } from 'react';
import { formatTime } from '../../utils/timeUtils';
import './ProjectTimer.css';

interface ProjectTimerProps {
    startedAt: Date;
}

const ProjectTimer: React.FC<ProjectTimerProps> = ({ startedAt }) => {
    const [elapsedTime, setElapsedTime] = useState<number>(0);

    useEffect(() => {
        const startTime = startedAt.getTime();
        const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(initialElapsed);

        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [startedAt]);

    return (
        <div className="project-timer">
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">{formatTime(elapsedTime)}</span>
        </div>
    );
};

export default ProjectTimer; 