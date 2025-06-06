import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Loading...</h1>
                    <p className="text-gray-600">Please wait while we check your authentication status.</p>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return <Navigate to="/auth/login" replace />;
    }

    return <>{children}</>;
}; 