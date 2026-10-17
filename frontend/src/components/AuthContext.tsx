import React, { ReactNode, useCallback } from 'react';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import { userManager } from '../oidcConfig';
import { AuthContext } from './useAuth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const auth = useOidcAuth();

    const login = useCallback(() => auth.signinRedirect(), [auth]);
    const logout = useCallback(async () => {
        if (await userManager.metadataService.getEndSessionEndpoint()) await auth.signoutRedirect();
        else await auth.removeUser();
    }, [auth]);

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
