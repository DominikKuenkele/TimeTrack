import { AUTH_CONFIG } from '../config/auth';

interface User {
    access_token: string;
    id_token: string;
    profile: {
        sub: string;
        email: string;
        name: string;
    };
    expired: boolean;
}

const STORAGE_KEYS = {
    USER: 'auth_user',
    STATE: 'auth_state',
    CODE_VERIFIER: 'auth_code_verifier'
} as const;

// Generate a random string for state and code verifier
function generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate PKCE code verifier and challenge
async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const codeVerifier = generateRandomString(64);
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return { codeVerifier, codeChallenge };
}

export async function startAuthentication(): Promise<void> {
    try {
        const state = generateRandomString(32);
        const { codeVerifier, codeChallenge } = await generatePKCE();

        // Store state and code verifier in session storage
        sessionStorage.setItem(STORAGE_KEYS.STATE, state);
        sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

        const params = new URLSearchParams({
            client_id: AUTH_CONFIG.clientId,
            redirect_uri: AUTH_CONFIG.redirectUri,
            response_type: 'code',
            scope: AUTH_CONFIG.scope,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        window.location.href = `${AUTH_CONFIG.authServerUrl}/application/o/authorize/?${params.toString()}`;
    } catch (error) {
        console.error('Error starting authentication:', error);
        throw error;
    }
}

export async function exchangeCodeForToken(): Promise<User> {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
        const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);

        if (!code || !state || !storedState || !codeVerifier) {
            throw new Error('Missing required parameters');
        }

        if (state !== storedState) {
            throw new Error('State mismatch');
        }

        const tokenResponse = await fetch(`${AUTH_CONFIG.authServerUrl}/application/o/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: AUTH_CONFIG.clientId,
                code_verifier: codeVerifier,
                code,
                redirect_uri: AUTH_CONFIG.redirectUri,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json();

        // Fetch user info
        const userInfoResponse = await fetch(`${AUTH_CONFIG.authServerUrl}/application/o/userinfo/`, {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userInfo = await userInfoResponse.json();

        const user: User = {
            access_token: tokenData.access_token,
            id_token: tokenData.id_token,
            profile: userInfo,
            expired: false
        };

        // Store user in session storage
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        // Clean up state and code verifier
        sessionStorage.removeItem(STORAGE_KEYS.STATE);
        sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);

        return user;
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw error;
    }
}

export async function isAuthenticated(): Promise<boolean> {
    try {
        const user = await getUser();
        if (!user) return false;

        // Check if token is expired
        const tokenData = JSON.parse(atob(user.id_token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
        return Date.now() < expirationTime;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

export async function getUser(): Promise<User | null> {
    try {
        const userStr = sessionStorage.getItem(STORAGE_KEYS.USER);
        if (!userStr) return null;

        const user: User = JSON.parse(userStr);

        // Check if token is expired
        const tokenData = JSON.parse(atob(user.id_token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
        user.expired = Date.now() >= expirationTime;

        return user;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

export async function logout(): Promise<void> {
    try {
        const user = await getUser();
        if (user) {
            // Clear session storage
            sessionStorage.removeItem(STORAGE_KEYS.USER);
            sessionStorage.removeItem(STORAGE_KEYS.STATE);
            sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);

            // Redirect to logout endpoint
            const params = new URLSearchParams({
                client_id: AUTH_CONFIG.clientId,
                post_logout_redirect_uri: `${window.location.origin}/`
            });

            window.location.href = `${AUTH_CONFIG.authServerUrl}/application/o/end-session/?${params.toString()}`;
        }
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
} 