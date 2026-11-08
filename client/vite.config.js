import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Disable socket reuse race conditions that trigger ECONNRESET in Node 18/20+
            proxyReq.setHeader('Connection', 'close');
          });
          proxy.on('error', (err, req, res) => {
            // Gracefully handle backend reconnects and prevent noisy console proxy crashes
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, {
                'Content-Type': 'application/json',
                'Retry-After': '2',
              });
              res.end(
                JSON.stringify({
                  success: false,
                  message: 'Backend server is reconnecting. Please retry in a few seconds.',
                  code: err.code || 'ECONNRESET',
                })
              );
            }
          });
        },
      },
    },
  },
});
