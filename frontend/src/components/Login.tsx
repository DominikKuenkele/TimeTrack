import { useEffect } from 'react';
import { redirect } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const Login = () => {
    const { isLoggedIn, login } = useAuth();

    useEffect(() => {
        if (isLoggedIn) {
            redirect('/');
            return;
        }
        // Kick off the OIDC redirect flow
        login();
    }, [isLoggedIn]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Redirecting to login...</h1>
                <p className="text-gray-600">Please wait while we redirect you to the login page.</p>
            </div>
        </div>
    );
};