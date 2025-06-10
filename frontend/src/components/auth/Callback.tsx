import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken } from '../../utils/auth';
import { useAuth } from '../AuthContext';

export const Callback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                setError(`Authentication failed: ${error}`);
                setIsProcessing(false);
                return;
            }

            if (!code) {
                setError('No authorization code received');
                setIsProcessing(false);
                return;
            }

            try {
                await exchangeCodeForToken(code);
                login(); // Update auth state after successful token exchange
                navigate('/');
            } catch (err) {
                setError('Failed to exchange code for token');
                console.error('Token exchange error:', err);
                setIsProcessing(false);
            }
        };

        handleCallback();
    }, [searchParams, navigate, login]);

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