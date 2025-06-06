export const AUTH_CONFIG = {
    clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
    authServerUrl: import.meta.env.VITE_AUTH_SERVER_URL,
    redirectUri: window.location.origin + '/auth/callback',
    scope: 'openid profile email',
    responseType: 'code',
} as const;

export const AUTH_ENDPOINTS = {
    authorization: `${AUTH_CONFIG.authServerUrl}/application/o/authorize/`,
    token: `${AUTH_CONFIG.authServerUrl}/application/o/token/`,
    userInfo: `${AUTH_CONFIG.authServerUrl}/application/o/userinfo/`,
} as const; 