// eslint-disable-next-line @typescript-eslint/triple-slash-reference, spaced-comment
/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
   build: {
      lib: {
         entry: 'src/index.ts',
         name: 'VideoJsRemotePlayback',
         fileName: 'videojs-remoteplayback',
      },
      rollupOptions: {
         external: [ 'video.js' ],
         output: {
            globals: {
               'video.js': 'videojs',
            },
         },
      },
   },
   test: {
      globals: true,
      environment: 'jsdom',
   },
});
