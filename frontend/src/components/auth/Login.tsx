import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthorizationUrl } from '../../utils/auth';
import { useAuth } from '../AuthContext';

export const Login = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If already authenticated, redirect to home
        if (isLoggedIn) {
            navigate('/');
            return;
        }

        // Start the OAuth flow
        const startAuth = async () => {
            try {
                const authUrl = await getAuthorizationUrl();
                // Use window.location.replace instead of href to prevent adding to history
                window.location.replace(authUrl);
            } catch (error) {
                console.error('Failed to start authentication:', error);
                setError('Failed to start authentication. Please try again.');
            }
        };

        startAuth();
    }, [navigate, isLoggedIn]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Redirecting to login...</h1>
                <p className="text-gray-600">Please wait while we redirect you to the login page.</p>
            </div>
        </div>
    );
}; 