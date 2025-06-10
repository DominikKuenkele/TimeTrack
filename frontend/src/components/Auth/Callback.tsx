import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken } from '../../utils/auth';
import { useAuth } from '../AuthContext';

export const Callback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (error) {
                setError(errorDescription || 'Authentication failed');
                return;
            }

            if (!code) {
                setError('No authorization code received');
                return;
            }

            try {
                await exchangeCodeForToken();
                login();
                navigate('/');
            } catch (err) {
                console.error('Authentication error:', err);
                setError('Failed to complete authentication');
            }
        };

        handleCallback();
    }, [navigate, login, searchParams]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/auth/login')}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Completing authentication...</h1>
                    <p className="text-gray-600">Please wait while we complete the login process.</p>
                    <div className="mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 