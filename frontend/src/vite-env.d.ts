/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_NODE_ENV: string;
    readonly VITE_AUTH_CLIENT_ID: string;
    readonly VITE_AUTH_SERVER_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
} 