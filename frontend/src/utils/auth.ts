import { AUTH_CONFIG, AUTH_ENDPOINTS } from '../config/auth';

// Generate a random string for PKCE
function generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate code verifier and challenge for PKCE
export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
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

// Store PKCE values in session storage
export function storePKCE(codeVerifier: string): void {
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
}

// Get stored PKCE code verifier
export function getStoredPKCE(): string | null {
    return sessionStorage.getItem('pkce_code_verifier');
}

// Clear stored PKCE values
export function clearPKCE(): void {
    sessionStorage.removeItem('pkce_code_verifier');
}

// Store access token
export function storeAccessToken(token: string): void {
    sessionStorage.setItem('access_token', token);
}

// Get stored access token
export function getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
}

// Clear stored access token
export function clearAccessToken(): void {
    sessionStorage.removeItem('access_token');
}

// Generate authorization URL
export async function getAuthorizationUrl(): Promise<string> {
    const { codeVerifier, codeChallenge } = await generatePKCE();
    storePKCE(codeVerifier);

    const params = new URLSearchParams({
        client_id: AUTH_CONFIG.clientId,
        redirect_uri: AUTH_CONFIG.redirectUri,
        response_type: AUTH_CONFIG.responseType,
        scope: AUTH_CONFIG.scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    return `${AUTH_ENDPOINTS.authorization}?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<string> {
    const codeVerifier = getStoredPKCE();
    if (!codeVerifier) {
        throw new Error('No code verifier found');
    }

    const params = new URLSearchParams({
        client_id: AUTH_CONFIG.clientId,
        code_verifier: codeVerifier,
        code: code,
        redirect_uri: AUTH_CONFIG.redirectUri,
        grant_type: 'authorization_code',
    });

    const response = await fetch(AUTH_ENDPOINTS.token, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    storeAccessToken(data.access_token);
    clearPKCE();
    return data.access_token;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
    return !!getAccessToken();
}

// Logout
export function logout(): void {
    clearAccessToken();
    clearPKCE();
    window.location.href = '/';
} 