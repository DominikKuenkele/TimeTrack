import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

export const oidcSettings = {
    authority: import.meta.env.VITE_OIDC_AUTHORITY as string,
    client_id: import.meta.env.VITE_OIDC_CLIENT_ID as string,
    redirect_uri: window.location.origin + '/auth/callback',
    post_logout_redirect_uri: window.location.origin,
    scope: 'openid profile email',
    automaticSilentRenew: true,
    loadUserInfo: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
};

// Shared UserManager instance used both by react-oidc-context and by the API
// service layer to retrieve the current access token.
export const userManager = new UserManager(oidcSettings);
