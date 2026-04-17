import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth as useOidcAuth } from 'react-oidc-context';

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    login: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const auth = useOidcAuth();

    const login = () => auth.signinRedirect();
    const logout = async () => { await auth.signoutRedirect(); };

    return (
        <AuthContext.Provider value={{
            isLoggedIn: auth.isAuthenticated,
            isLoading: auth.isLoading,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
