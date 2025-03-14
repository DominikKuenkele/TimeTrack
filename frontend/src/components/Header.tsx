import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header-container">
                <h1 className="logo">
                    <Link to="/">TimeTrack</Link>
                </h1>
                <nav className="nav">
                    <ul>
                        <li>
                            <Link to="/">Projects</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header; 