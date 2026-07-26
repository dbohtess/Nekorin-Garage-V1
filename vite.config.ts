import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/assets/nekorin-altima.png') {
            res.writeHead(302, {
              Location: '/input_file_5.png',
            });
            res.end();
            return;
          }

          next();
        });
      },

      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
