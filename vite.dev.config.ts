import { defineConfig } from 'vite';

export default defineConfig({
   root: 'examples',
   server: {
      port: 3000,
      open: true,
      fs: {
         // Allow serving files from parent directory
         allow: [ '..' ],
      },
   },
   // Serve dist files at root path (makes /videojs-remoteplayback.* available)
   publicDir: '../dist',
   build: {
      outDir: '../dev-dist',
      emptyOutDir: true,
   },
});
