import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Header.css';

const Header: React.FC = () => {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

    const logoutAction = async () => {
        await logout();
        navigate('/login');
    }

    return (
        <header className="header">
            <div className="header-container">
                <h1 className="logo">
                    <Link to="/">TimeTrack</Link>
                </h1>
                <nav>
                    {isLoggedIn
                        ? <button onClick={logoutAction}>Logout</button>
                        : <Link to="/login">Login</Link>
                    }
                </nav>
            </div>
        </header>
    );
};

export default Header; 