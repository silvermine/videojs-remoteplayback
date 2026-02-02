import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoJsPlayer } from '../@types/videojs';
import {
   ChromecastManager,
   checkClientChromecastSupport,
   isChromeBrowser,
   getVideoElement,
} from '../src/js/chromecast/ChromecastManager';

describe('ChromecastManager', () => {
   let mockPlayer: VideoJsPlayer,
       mockRemotePlayback: any,
       chromecastManager: ChromecastManager;

   beforeEach(() => {
      // Mock navigator.userAgent to simulate Chrome
      Object.defineProperty(navigator, 'userAgent', {
         value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
         writable: true,
         configurable: true,
      });

      // Mock browser APIs for Chromecast detection
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

      // Create a mock video element that passes instanceof checks
      const mockVideoElement = Object.create(HTMLVideoElement.prototype, {
         // WebKit AirPlay properties (needed for isVideoElementWithAirPlay check)
         webkitShowPlaybackTargetPicker: { value: vi.fn() },
         webkitCurrentPlaybackTargetIsWireless: { value: false },
         // Remote Playback API
         remote: { value: mockRemotePlayback },
         // Event handlers
         addEventListener: { value: vi.fn() },
         removeEventListener: { value: vi.fn() },
         play: { value: vi.fn().mockResolvedValue(undefined) },
         // Video state properties
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
   });

   describe('Browser Detection', () => {
      it('should detect Chrome browser correctly', () => {
         expect(isChromeBrowser()).toBe(true);
      });

      it('should return true when Chromecast is supported', () => {
         expect(checkClientChromecastSupport()).toBe(true);
      });

      it('should return false when Remote Playback API is not supported', () => {
         // Temporarily remove remote support
         const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'remote');

         // Delete the property completely
         delete (HTMLVideoElement.prototype as any).remote;

         expect(checkClientChromecastSupport()).toBe(false);

         // Restore original value for other tests
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
            'No Chromecast devices found. Make sure your Chromecast is on the same network '
            + 'and try again.'
         );
      });

      it('should handle permission denied errors', async () => {
         mockRemotePlayback.prompt.mockRejectedValue(new Error('NotAllowedError: User denied permission'));

         await expect(chromecastManager.prompt()).rejects.toThrow(
            'Chromecast permission denied. Please try clicking the button again.'
         );
      });

      it('should start playback when media is not ready', async () => {
         const mockVideoElement = getVideoElement(mockPlayer);

         mockRemotePlayback.prompt.mockRejectedValue(new Error('Media not ready'));

         // Set up video element as not playing
         if (mockVideoElement) {
            (mockVideoElement as any).paused = true;
            (mockVideoElement as any).currentTime = 0;
            (mockVideoElement as any).readyState = 0;
         }

         await chromecastManager.prompt();

         expect(mockVideoElement?.play).toHaveBeenCalled();
      });

      it('should not start playback if already awaiting device availability', async () => {
         // Reset mocks
         vi.clearAllMocks();

         // Make prompt throw an error to trigger the awaiting state
         mockRemotePlayback.prompt.mockRejectedValue(new Error('Media not ready'));

         // Call prompt twice in succession
         const firstCall = chromecastManager.prompt();

         // Wait a tick so the first call can set the flag
         await new Promise((resolve) => { return setTimeout(resolve, 0); });

         const secondCall = chromecastManager.prompt();

         await Promise.all([ firstCall, secondCall ]);

         // play should only be called once for the first prompt
         const mockVideoElement = getVideoElement(mockPlayer);

         expect(mockVideoElement?.play).toHaveBeenCalledTimes(1);
      });

      it('should throw error if not properly initialized', async () => {
         chromecastManager = new ChromecastManager({
            el: vi.fn().mockReturnValue({
               querySelector: vi.fn().mockReturnValue(null),
            }),
         } as unknown as VideoJsPlayer);

         await expect(chromecastManager.prompt()).rejects.toThrow(
            'ChromecastManager not properly initialized. Call setup first.'
         );
      });
   });
});
