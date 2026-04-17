import { User } from 'oidc-client-ts';
import { userManager } from '../oidcConfig';

// Get the current OIDC user (returns null if not signed in or token expired)
export async function getUser(): Promise<User | null> {
    try {
        return await userManager.getUser();
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

// Check if the user is authenticated and the token has not expired
export async function isAuthenticated(): Promise<boolean> {
    try {
        const user = await userManager.getUser();
        return !!user && !user.expired;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}
