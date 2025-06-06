import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthorizationUrl, isAuthenticated } from '../../utils/auth';

export const Login = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // If already authenticated, redirect to home
        if (isAuthenticated()) {
            navigate('/');
            return;
        }

        // Start the OAuth flow
        const startAuth = async () => {
            try {
                const authUrl = await getAuthorizationUrl();
                window.location.href = authUrl;
            } catch (error) {
                console.error('Failed to start authentication:', error);
                // Handle error appropriately
            }
        };

        startAuth();
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Redirecting to login...</h1>
                <p className="text-gray-600">Please wait while we redirect you to the login page.</p>
            </div>
        </div>
    );
}; 