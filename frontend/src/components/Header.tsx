import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const LOGOUT_URL = '/outpost.goauthentik.io/sign_out';

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header-container">
                <h1 className="logo">
                    <Link to="/">TimeTrack</Link>
                </h1>
                <nav>
                    <Link to="/projects">Projects</Link>
                    <Link to="/activities">Activities</Link>
                    <a href={LOGOUT_URL}>Logout</a>
                </nav>
            </div>
        </header>
    );
};

export default Header;
