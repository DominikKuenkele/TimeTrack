import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        open: true
    },
    define: {
        'process.env': {
            REACT_APP_API_URL: JSON.stringify(process.env.VITE_API_URL)
        }
    }
}) 