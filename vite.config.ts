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
      sourcemap: true,
      lib: {
         entry: 'src/js/index.ts',
         name: 'VideoJsRemotePlayback',
         fileName: 'videojs-remoteplayback',
         formats: [ 'es', 'umd' ],
      },
      rollupOptions: {
         output: {
            exports: 'named',
            assetFileNames: 'videojs-remoteplayback.css',
         },
      },
      assetsInlineLimit: 10000, // Inline assets smaller than 10KB (our SVG is ~623 bytes)
   },
});
