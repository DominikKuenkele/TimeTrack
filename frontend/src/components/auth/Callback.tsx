import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../../utils/auth';
import { useAuth } from '../AuthContext';

export const Callback = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const user = await exchangeCodeForToken();
                if (user?.access_token) {
                    login(); // Update auth state after successful token exchange
                    navigate('/');
                } else {
                    throw new Error('No access token received');
                }
            } catch (err) {
                setError('Failed to complete authentication');
                console.error('Authentication error:', err);
                setIsProcessing(false);
            }
        };

        handleCallback();
    }, [navigate, login]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={() => navigate('/auth/login')}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (isProcessing) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Completing authentication...</h1>
                    <p className="text-gray-600">Please wait while we complete the login process.</p>
                </div>
            </div>
        );
    }

    return null;
}; 