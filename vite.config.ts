import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Automatically sync static assets to public directory for deployment compilation
const publicDir = path.resolve(__dirname, 'public');
const publicUploadsDir = path.resolve(publicDir, 'uploads');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

// Copy logo.jpeg
const rootLogo = path.resolve(__dirname, 'logo.jpeg');
const publicLogo = path.resolve(publicDir, 'logo.jpeg');
if (fs.existsSync(rootLogo)) {
  fs.copyFileSync(rootLogo, publicLogo);
}

// Copy uploads contents
const rootUploads = path.resolve(__dirname, 'uploads');
if (fs.existsSync(rootUploads)) {
  const files = fs.readdirSync(rootUploads);
  for (const file of files) {
    const srcPath = path.resolve(rootUploads, file);
    const destPath = path.resolve(publicUploadsDir, file);
    if (fs.lstatSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
