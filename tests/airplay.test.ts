import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoJsPlayer } from '../@types/videojs';
import type { AirPlayManager as AirPlayManagerType } from '../src/js/airplay/interfaces/Airplay.interfaces';
import { AirPlayManager } from '../src/js/airplay/AirPlayManager';

describe('AirPlayManager', () => {
   let mockPlayer: VideoJsPlayer,
       mockRemotePlayback: any,
       airPlayManager: AirPlayManagerType;

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

      const mockVideoElement = {
         remote: mockRemotePlayback,
         addEventListener: vi.fn(),
         removeEventListener: vi.fn(),
         webkitShowPlaybackTargetPicker: vi.fn(),
         webkitCurrentPlaybackTargetIsWireless: false,
      };

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

      const result = await airPlayManager.isAvailable();

      expect(result).toBe(true);
   });

   it('should fallback to WebKit AirPlay when RemotePlayback throws error', async () => {
      mockRemotePlayback.watchAvailability.mockRejectedValue(new Error('Not supported'));

      const result = await airPlayManager.isAvailable();

      // Should return true because WebKit AirPlay API is available as fallback
      expect(result).toBe(true);
   });

   it('should return current state', () => {
      mockRemotePlayback.state = 'connected';

      const state = airPlayManager.getState();

      expect(state).toBe('connected');
   });

   it('should return connection status', () => {
      mockRemotePlayback.state = 'connected';

      const connected = airPlayManager.isConnected();

      expect(connected).toBe(true);
   });
});
