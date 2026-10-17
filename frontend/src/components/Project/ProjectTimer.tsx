import React, { useEffect, useState } from 'react';
import { formatTime } from '../../utils/timeUtils';
import './ProjectTimer.css';

interface ProjectTimerProps {
    startedAt: Date;
}

const ProjectTimer: React.FC<ProjectTimerProps> = ({ startedAt }) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const elapsedTime = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));

    return (
        <div className="project-timer">
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">{formatTime(elapsedTime)}</span>
        </div>
    );
};

export default ProjectTimer; 