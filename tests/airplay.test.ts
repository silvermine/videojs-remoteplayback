import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoJsPlayer } from '../@types/videojs';
import { AirPlayManager, getVideoElement } from '../src/js/airplay/AirPlayManager';

describe('AirPlayManager', () => {
   let mockPlayer: VideoJsPlayer,
       mockRemotePlayback: any,
       airPlayManager: AirPlayManager;

   beforeEach(() => {
      // Mock browser APIs for AirPlay detection
      Object.defineProperty(HTMLVideoElement.prototype, 'remote', {
         value: {},
         writable: true,
         configurable: true,
      });

      Object.defineProperty(HTMLVideoElement.prototype, 'webkitShowPlaybackTargetPicker', {
         value: vi.fn(),
         writable: true,
         configurable: true,
      });

      Object.defineProperty(window, 'WebKitPlaybackTargetAvailabilityEvent', {
         value: class MockWebKitPlaybackTargetAvailabilityEvent extends Event {
            public availability: 'available' | 'not-available' = 'available';
         },
         writable: true,
         configurable: true,
      });

      mockRemotePlayback = {
         state: 'disconnected',
         watchAvailability: vi.fn(),
         addEventListener: vi.fn(),
      };

      const mockVideoElement = document.createElement('video') as any;

      mockVideoElement.remote = mockRemotePlayback;
      mockVideoElement.addEventListener = vi.fn();
      mockVideoElement.removeEventListener = vi.fn();
      mockVideoElement.webkitShowPlaybackTargetPicker = vi.fn();
      mockVideoElement.webkitCurrentPlaybackTargetIsWireless = false;

      mockPlayer = {
         el: vi.fn().mockReturnValue({
            querySelector: vi.fn().mockReturnValue(mockVideoElement),
         }),
         trigger: vi.fn(),
         on: vi.fn(),
      } as unknown as VideoJsPlayer;

      airPlayManager = new AirPlayManager(mockPlayer);
   });

   it('should initialize without errors', () => {
      expect(airPlayManager).toBeDefined();
   });

   it('should return true when RemotePlayback is available', async () => {
      mockRemotePlayback.watchAvailability.mockResolvedValue(undefined);

      const result = await airPlayManager.isAirPlayAvailable();

      expect(result).toBe(true);
   });

   it('should fallback to WebKit AirPlay when RemotePlayback throws error', async () => {
      mockRemotePlayback.watchAvailability.mockRejectedValue(new Error('Not supported'));

      const result = await airPlayManager.isAirPlayAvailable();

      // Should return true because WebKit AirPlay API is available as fallback
      expect(result).toBe(true);
   });

   it('should return current state', () => {
      // Get the video element
      const videoEl = getVideoElement(mockPlayer);

      if (videoEl) {
         // set its remote state
         (videoEl.remote as any).state = 'connected';
      }

      const state = airPlayManager.getState();

      expect(state).toBe('connected');
   });

   it('should return connection status', () => {
      // Get the video element
      const videoEl = getVideoElement(mockPlayer);

      expect(videoEl).not.toBeNull();

      if (videoEl) {
         // set its remote state
         (videoEl.remote as any).state = 'connected';
      }

      const connected = airPlayManager.isConnected();

      expect(connected).toBe(true);
   });
});
