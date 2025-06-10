import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken } from '../../utils/auth';
import { useAuth } from '../AuthContext';

type AuthState = 'processing' | 'error' | 'success';

export const Callback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [authState, setAuthState] = useState<AuthState>('processing');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(true);
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            // Check for required parameters
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            // Handle OAuth errors from the provider
            if (error) {
                if (!isActive) return;
                setErrorMessage(errorDescription || 'Authentication failed');
                setAuthState('error');
                return;
            }

            // Validate required parameters
            if (!code || !state) {
                if (!isActive) return;
                setErrorMessage('Missing required authentication parameters');
                setAuthState('error');
                return;
            }

            try {
                const user = await exchangeCodeForToken();
                if (!isActive) return;

                if (user?.access_token) {
                    login();
                    setAuthState('success');
                    // Small delay to show success state before redirect
                    setTimeout(() => {
                        if (isActive) {
                            navigate('/');
                        }
                    }, 1000);
                } else {
                    throw new Error('No access token received');
                }
            } catch (err) {
                if (!isActive) return;
                const error = err as Error;
                setErrorMessage(error.message || 'Failed to complete authentication');
                setAuthState('error');
                console.error('Authentication error:', err);
            }
        };

        handleCallback();

        return () => {
            setIsActive(false);
        };
    }, [navigate, login, searchParams, isActive]);

    const handleRetry = () => {
        setIsActive(true);
        setAuthState('processing');
        setErrorMessage(null);
        navigate('/auth/login');
    };

    if (authState === 'error') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
                        <p className="text-gray-600 mb-6">{errorMessage}</p>
                        <button
                            onClick={handleRetry}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (authState === 'processing') {
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
    }

    if (authState === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-green-600 mb-4">Authentication Successful</h1>
                        <p className="text-gray-600">Redirecting to dashboard...</p>
                        <div className="mt-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}; 