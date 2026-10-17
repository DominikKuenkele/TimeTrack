import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        // The e2e stack (compose.e2e.yaml) reaches the dev server by its service name
        allowedHosts: ['frontend'],
        open: true,
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        restoreMocks: true,
        mockReset: true,
        env: { TZ: 'Europe/Berlin' },
    },
}) 