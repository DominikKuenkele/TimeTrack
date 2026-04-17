// react-oidc-context handles the code exchange and calls onSigninCallback in
// App.tsx, which clears the URL params. This component just shows a brief
// loading state while that happens.
export const Callback = () => {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Completing authentication...</h1>
                <p className="text-gray-600">Please wait while we complete the login process.</p>
            </div>
        </div>
    );
};
