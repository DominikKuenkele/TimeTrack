import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { extractErrorMessage } from '../utils/errorUtils';
import { useAuth } from './AuthContext';
import './Login.css';


const Login: React.FC = () => {
    const { isLoggedIn, login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await userService.login(username, password);
            setError(null);
            login();
        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(err, "Failed to login");
            setError(errorMessage);
            console.error(err);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            navigate("/");
        }
    }, [isLoggedIn, navigate]);

    return (
        <div className="login-container">
            <form onSubmit={handleLogin} className="login-form">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && <div className="login-error">{error}</div>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;