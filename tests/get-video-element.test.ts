import { afterEach, describe, expect, it } from 'vitest';
import type { VideoJsPlayer } from '../@types/videojs';
import {
   getVideoElement,
   getVideoElementWithAirPlay,
   isVideoElement,
   isVideoElementWithAirPlay,
} from '../src/js/lib/get-video-element';

function createPlayer(container: HTMLElement): VideoJsPlayer {
   return {
      el: () => { return container; },
   } as unknown as VideoJsPlayer;
}

afterEach(() => {
   delete (HTMLVideoElement.prototype as any).remote;
   delete (HTMLVideoElement.prototype as any).webkitShowPlaybackTargetPicker;
   delete (HTMLVideoElement.prototype as any).webkitCurrentPlaybackTargetIsWireless;
});

describe('isVideoElement', () => {
   it('returns true for a video element with remote playback support', () => {
      const video = document.createElement('video');

      Object.defineProperty(video, 'remote', { value: {}, configurable: true });
      expect(isVideoElement(video)).toBe(true);
   });

   it('returns false for a video element without remote playback support', () => {
      const video = document.createElement('video');

      expect(isVideoElement(video)).toBe(false);
   });

   it('returns false for non-video elements and nullish values', () => {
      const div = document.createElement('div');

      expect(isVideoElement(div)).toBe(false);
      expect(isVideoElement(null)).toBe(false);
      expect(isVideoElement(undefined)).toBe(false);
   });
});

describe('getVideoElement', () => {
   it('returns the video element when it supports remote playback', () => {
      const container = document.createElement('div'),
            video = document.createElement('video');

      Object.defineProperty(video, 'remote', { value: {}, configurable: true });
      container.appendChild(video);
      expect(getVideoElement(createPlayer(container))).toBe(video);
   });

   it('returns null when no video element is present', () => {
      const container = document.createElement('div');

      expect(getVideoElement(createPlayer(container))).toBeNull();
   });

   it('returns null when the video element does not support remote playback', () => {
      const container = document.createElement('div'),
            video = document.createElement('video');

      container.appendChild(video);
      expect(getVideoElement(createPlayer(container))).toBeNull();
   });
});

describe('isVideoElementWithAirPlay', () => {
   it('returns true when video has AirPlay properties', () => {
      const video = document.createElement('video');

      Object.defineProperty(video, 'webkitShowPlaybackTargetPicker', {
         value: () => { return undefined; },
         configurable: true,
      });
      Object.defineProperty(video, 'webkitCurrentPlaybackTargetIsWireless', {
         value: false,
         configurable: true,
      });
      expect(isVideoElementWithAirPlay(video)).toBe(true);
   });

   it('returns false when only some AirPlay properties are present', () => {
      const video = document.createElement('video');

      Object.defineProperty(video, 'webkitShowPlaybackTargetPicker', {
         value: () => { return undefined; },
         configurable: true,
      });
      expect(isVideoElementWithAirPlay(video)).toBe(false);
   });
});

describe('getVideoElementWithAirPlay', () => {
   it('returns the video element when it supports AirPlay', () => {
      const container = document.createElement('div'),
            video = document.createElement('video');

      Object.defineProperty(video, 'webkitShowPlaybackTargetPicker', {
         value: () => { return undefined; },
         configurable: true,
      });
      Object.defineProperty(video, 'webkitCurrentPlaybackTargetIsWireless', {
         value: false,
         configurable: true,
      });
      container.appendChild(video);
      expect(getVideoElementWithAirPlay(createPlayer(container))).toBe(video);
   });

   it('returns null when the video element does not fully support AirPlay', () => {
      const container = document.createElement('div'),
            video = document.createElement('video');

      Object.defineProperty(video, 'webkitShowPlaybackTargetPicker', {
         value: () => { return undefined; },
         configurable: true,
      });
      container.appendChild(video);
      expect(getVideoElementWithAirPlay(createPlayer(container))).toBeNull();
   });
});
