import React, { createContext, ReactNode, useContext, useState } from 'react';
import { userService } from '../services/api';

interface AuthContextType {
    isLoggedIn: boolean;
    login: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

    const login = () => setIsLoggedIn(true);
    const logout = async () => {
        try {
            await userService.logout();
            setIsLoggedIn(false);
        } catch (err: unknown) {
            console.error('Logout error:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
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