import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

    server: {
    host: '0.0.0.0',
    port: 4173,
    // Autoriser tous les hosts pour le développement
    allowedHosts: [
      'localhost',
      '.sslip.io',
      '31.97.192.67',
      'n4g4088o0gswkwwg8c0wcoo8.31.97.192.67.sslip.io'
    ]
  },
  
  preview: {
    host: '0.0.0.0',
    port: 4173,
    // CORRECTION PRINCIPALE : Autoriser votre domaine Coolify
    allowedHosts: [
      'localhost',
      '.sslip.io', // Wildcard pour tous les sous-domaines sslip.io
      '31.97.192.67',
      'n4g4088o0gswkwwg8c0wcoo8.31.97.192.67.sslip.io' // Votre domaine exact
    ]
  },
  
  // Configuration pour éviter les problèmes de CORS
  define: {
    global: 'globalThis'
  }
})
