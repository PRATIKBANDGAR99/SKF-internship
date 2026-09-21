import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      include: '**/*.{jsx,js}',
    }),
  ],
  esbuild: {
    loader: 'jsx',
    include: /.*\.jsx?$|Frontend\/.*\.js$/,
    exclude: [],
  },
  server: {
    port: 3030,
    host: true,
  },
  preview: {
    port: 3030,
    host: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
