import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import api from '../services/api';
import './Header.css';

const Header: React.FC = () => {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState<string>('Waiting for the backend…');

    useEffect(() => {
        api.get<{ message: string }>('/greeting', { requiresAuth: false })
            .then((response) => setGreeting(response.message))
            .catch(() => setGreeting('The backend did not answer'));
    }, []);

    const logoutAction = async () => {
        await logout();
        navigate('/');
    }

    return (
        <header className="header">
            <div className="header-container">
                <h1 className="logo">
                    <Link to="/">TimeTrack</Link>
                </h1>
                <nav>
                    <Link to="/projects">Projects</Link>
                    <Link to="/activities">Activities</Link>
                    {isLoggedIn
                        ? <button onClick={logoutAction}>Logout</button>
                        : <Link to="/auth/login">Login</Link>
                    }
                </nav>
            </div>
            <div className="test-slot-banner">🧪 Test slot · {greeting}</div>
        </header>
    );
};

export default Header; 