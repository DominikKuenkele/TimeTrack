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
});

// Generate authorization URL and start login
export async function getAuthorizationUrl(): Promise<string> {
    try {
        await userManager.signinRedirect();
        // This URL won't be used as signinRedirect handles the redirect
        return AUTH_CONFIG.authServerUrl;
    } catch (error) {
        console.error('Error starting authentication:', error);
        throw error;
    }
}

// Handle the callback and exchange code for token
export async function exchangeCodeForToken(): Promise<User> {
    try {
        return await userManager.signinRedirectCallback();
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw error;
    }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
    try {
        const user = await userManager.getUser();
        return !!user && !user.expired;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

// Get the current user
export async function getUser(): Promise<User | null> {
    try {
        return await userManager.getUser();
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

// Logout
export async function logout(): Promise<void> {
    try {
        await userManager.signoutRedirect();
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
} 