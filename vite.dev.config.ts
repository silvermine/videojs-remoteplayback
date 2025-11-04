import { defineConfig } from 'vite';

export default defineConfig({
   root: 'examples',
   server: {
      port: 3000,
      open: true,
   },
   publicDir: '../dist',
   build: {
      outDir: '../dev-dist',
      emptyOutDir: true,
   },
});
