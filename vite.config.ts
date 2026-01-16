import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
   plugins: [
      dts({
         insertTypesEntry: true,
         outDir: 'dist',
         include: [ 'src/**/*', '@types/**/*' ],
         exclude: [ 'tests/**/*', 'examples/**/*', '**/*.test.*', '**/*.spec.*' ],
         rollupTypes: true,
      }),
   ],
   build: {
      lib: {
         entry: 'src/js/index.ts',
         name: 'VideoJsRemotePlayback',
         fileName: 'videojs-remoteplayback',
      },
      rollupOptions: {
         external: [ '@silvermine/video.js' ],
         output: {
            globals: {
               '@silvermine/video.js': 'videojs',
            },
            assetFileNames: 'videojs-remoteplayback.css',
         },
      },
      assetsInlineLimit: 10000, // Inline assets smaller than 10KB (our SVG is ~623 bytes)
   },
});
