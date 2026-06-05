import { describe, it, expect } from 'vitest';
import './mocks/video-js-mock';
import videojs from '@silvermine/video.js';
import initializePlugin from '../src/js';

describe('Remote Playback Plugin', () => {
   it('should initialize plugin without errors', () => {
      const initFunction = (): void => {
         initializePlugin(videojs);
      };

      expect(initFunction).not.toThrow();
      expect(videojs.registerPlugin).toHaveBeenCalled();
   });
});
