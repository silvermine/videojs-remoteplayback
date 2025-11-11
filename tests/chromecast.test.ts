import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoJsPlayer } from '../@types/videojs';
import {
   ChromecastManager,
   checkClientChromecastSupport,
} from '../src/js/chromecast/ChromecastManager';

// Mock the AirPlay check so Chromecast support isn't excluded
vi.mock('../src/js/airplay/AirPlayManager', () => {
   return {
      checkClientAirPlaySupport: vi.fn().mockReturnValue(false),
   };
});

describe('ChromecastManager', () => {
   let mockPlayer: VideoJsPlayer,
       mockRemotePlayback: any,
       chromecastManager: ChromecastManager;

   beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
         value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
         writable: true,
         configurable: true,
      });

      if (!('RemotePlayback' in window)) {
         (window as any).RemotePlayback = class RemotePlayback {};
      }

      Object.defineProperty(HTMLVideoElement.prototype, 'remote', {
         value: {},
         writable: true,
         configurable: true,
      });

      mockRemotePlayback = {
         state: 'disconnected',
         watchAvailability: vi.fn(),
         addEventListener: vi.fn(),
         prompt: vi.fn(),
      };

      const mockVideoElement = Object.create(HTMLVideoElement.prototype, {
         webkitShowPlaybackTargetPicker: { value: vi.fn() },
         webkitCurrentPlaybackTargetIsWireless: { value: false },
         remote: { value: mockRemotePlayback },
         addEventListener: { value: vi.fn() },
         removeEventListener: { value: vi.fn() },
         play: { value: vi.fn().mockResolvedValue(undefined) },
         paused: { value: true, writable: true },
         ended: { value: false, writable: true },
         currentTime: { value: 0, writable: true },
         readyState: { value: 0, writable: true },
      });

      mockPlayer = {
         el: vi.fn().mockReturnValue({
            querySelector: vi.fn().mockReturnValue(mockVideoElement),
         }),
         trigger: vi.fn(),
         on: vi.fn(),
         off: vi.fn(),
      } as unknown as VideoJsPlayer;

      chromecastManager = new ChromecastManager(mockPlayer);
      chromecastManager.initialize(); // ← add this
   });

   describe('Feature Detection', () => {
      it('should return true when Chromecast is supported', () => {
         expect(checkClientChromecastSupport()).toBe(true);
      });

      it('should return false when Remote Playback API is not supported', () => {
         const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'remote');

         delete (HTMLVideoElement.prototype as any).remote;

         expect(checkClientChromecastSupport()).toBe(false);

         if (originalDescriptor) {
            Object.defineProperty(HTMLVideoElement.prototype, 'remote', originalDescriptor);
         }
      });
   });

   describe('Initialization', () => {
      it('should initialize without errors', () => {
         expect(chromecastManager).toBeDefined();
      });

      it('should set up event listeners', () => {
         expect(mockRemotePlayback.addEventListener).toHaveBeenCalledWith('connect', expect.any(Function));
         expect(mockRemotePlayback.addEventListener).toHaveBeenCalledWith('connecting', expect.any(Function));
         expect(mockRemotePlayback.addEventListener).toHaveBeenCalledWith('disconnect', expect.any(Function));
      });
   });

   describe('Availability', () => {
      it('should return true when Remote Playback is available', async () => {
         mockRemotePlayback.watchAvailability.mockResolvedValue(undefined);

         const result = await chromecastManager.isChromecastAvailable();

         expect(result).toBe(true);
      });

      it('should return false when Remote Playback throws error', async () => {
         mockRemotePlayback.watchAvailability.mockRejectedValue(new Error('Not supported'));

         const result = await chromecastManager.isChromecastAvailable();

         expect(result).toBe(false);
      });

      it('should trigger availability change events', async () => {
         const mockCallback = vi.fn();

         mockRemotePlayback.watchAvailability.mockImplementation(
            (callback: (available: boolean) => void) => {
               mockCallback(callback);
               return Promise.resolve(1);
            }
         );

         await chromecastManager.isChromecastAvailable();

         expect(mockCallback).toHaveBeenCalledWith(expect.any(Function));
      });
   });

   describe('State Management', () => {
      it('should return current state', () => {
         mockRemotePlayback.state = 'connected';

         const state = chromecastManager.getState();

         expect(state).toBe('connected');
      });

      it('should return null when Remote Playback is not available', () => {
         chromecastManager = new ChromecastManager({
            el: vi.fn().mockReturnValue({
               querySelector: vi.fn().mockReturnValue(null),
            }),
         } as unknown as VideoJsPlayer);

         chromecastManager.initialize(); // ← add this too

         const state = chromecastManager.getState();

         expect(state).toBeNull();
      });

      it('should return connection status', () => {
         mockRemotePlayback.state = 'connected';

         const connected = chromecastManager.isConnected();

         expect(connected).toBe(true);
      });

      it('should return false when not connected', () => {
         mockRemotePlayback.state = 'disconnected';

         const connected = chromecastManager.isConnected();

         expect(connected).toBe(false);
      });
   });

   describe('Prompt Functionality', () => {
      it('should call prompt on Remote Playback API', async () => {
         await chromecastManager.prompt();

         expect(mockRemotePlayback.prompt).toHaveBeenCalled();
      });

      it('should handle "No devices found" error gracefully', async () => {
         mockRemotePlayback.prompt.mockRejectedValue(new Error('No remote playback devices found'));

         await expect(chromecastManager.prompt()).rejects.toThrow(
            'No Chromecast devices found. Make sure your Chromecast is on the same network and try again.'
         );
      });

      it('should handle permission denied errors', async () => {
         mockRemotePlayback.prompt.mockRejectedValue(new Error('NotAllowedError: User denied permission'));

         await expect(chromecastManager.prompt()).rejects.toThrow(
            'Chromecast permission denied. Please try clicking the button again.'
         );
      });
   });
});
