import { describe, it, expect } from 'vitest';
import initializePlugin from '../src/js';
import { mockVideoJs } from './mocks/video-js-mock';

describe('Remote Playback Plugin', () => {
   it('should initialize plugin without errors', () => {
      const initFunction = (): void => {
         initializePlugin(mockVideoJs);
      };

      expect(initFunction).not.toThrow();

      expect(mockVideoJs.registerPlugin).toHaveBeenCalled();
   });
});
