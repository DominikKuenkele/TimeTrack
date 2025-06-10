import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';
import { useAuth } from '../AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isLoggedIn, isLoading } = useAuth();
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authed = await isAuthenticated();
                setIsAuthed(authed);
            } catch (error) {
                console.error('Error checking authentication:', error);
                setIsAuthed(false);
            } finally {
                setIsAuthChecked(true);
            }
        };

        checkAuth();
    }, []);

    if (isLoading || !isAuthChecked) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Loading...</h1>
                    <p className="text-gray-600">Please wait while we check your authentication status.</p>
                </div>
            </div>
        );
    }

    if (!isLoggedIn || !isAuthed) {
        return <Navigate to="/auth/login" replace />;
    }

    return <>{children}</>;
}; 