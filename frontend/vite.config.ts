import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        open: true
    },
    define: {
        // For compatibility with code that might still use process.env
        'process.env': {
            REACT_APP_API_URL: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8080')
        }
    }
}) 