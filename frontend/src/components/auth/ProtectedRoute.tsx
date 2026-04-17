import { ReactNode, useEffect } from 'react';
import { useAuth } from '../AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isLoggedIn, isLoading, login } = useAuth();

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            login();
        }
    }, [isLoading, isLoggedIn]);

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
        return null;
    }

    return <>{children}</>;
};
