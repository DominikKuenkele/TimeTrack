import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { AUTH_CONFIG } from '../config/auth';

const userManager = new UserManager({
    authority: AUTH_CONFIG.authServerUrl,
    client_id: AUTH_CONFIG.clientId,
    redirect_uri: AUTH_CONFIG.redirectUri,
    response_type: AUTH_CONFIG.responseType,
    scope: AUTH_CONFIG.scope,
    loadUserInfo: true,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    post_logout_redirect_uri: `${window.location.origin}/auth/login`,
    metadata: {
        authorization_endpoint: `${AUTH_CONFIG.authServerUrl}/application/o/authorize/`,
        token_endpoint: `${AUTH_CONFIG.authServerUrl}/application/o/token/`,
        userinfo_endpoint: `${AUTH_CONFIG.authServerUrl}/application/o/userinfo/`,
        end_session_endpoint: `${AUTH_CONFIG.authServerUrl}/application/o/end-session/`,
    }
});

export async function startAuthentication(): Promise<void> {
    try {
        await userManager.signinRedirect();
    } catch (error) {
        console.error('Error starting authentication:', error);
        throw error;
    }
}

export async function exchangeCodeForToken(): Promise<User> {
    try {
        const user = await userManager.signinCallback();
        if (!user) {
            throw new Error('No user returned from authentication callback');
        }
        return user;
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw error;
    }
}

export async function isAuthenticated(): Promise<boolean> {
    try {
        const user = await userManager.getUser();
        return !!user && !user.expired;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

export async function getUser(): Promise<User | null> {
    try {
        return await userManager.getUser();
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

export async function logout(): Promise<void> {
    try {
        await userManager.signoutRedirect();
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
} 