import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
          react(), 
          tailwindcss(),
        ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false
      }
    }
  },

   // ✅ TAMBAHKAN INI
  // build: {
  //   minify: 'terser', // Pastikan menggunakan terser
  //   terserOptions: {
  //     compress: {
  //       drop_console: true,    // Hapus semua console.log, console.info, dll
  //       drop_debugger: true    // Hapus debugger statements
  //     }
  //   }
  // }
})

