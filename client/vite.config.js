import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [react()],
    server: {
      port: process.env.PORT || 3000,  // Default port is 3000 if no PORT env is specified
    },
    define: {
      'process.env.VITE_USER_NAME': `"${process.env.VITE_USER_NAME}"`
    }
  };
});
