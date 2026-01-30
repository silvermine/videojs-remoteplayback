import type { VideoJsPlayer } from '../../../@types/videojs';
import type { RemotePlaybackState } from '../../../@types/remote-playback';
import videojs from '@silvermine/video.js';
import { LOG_MESSAGES } from '../constants/log-messages';
import { EVENTS } from '../constants/remote-playback';

export function checkClientChromecastSupport(): boolean {
   return typeof window !== 'undefined' &&
          'HTMLVideoElement' in window &&
          'remote' in HTMLVideoElement.prototype &&
          isChromeBrowser();
}

export function isVideoElementWithCast(el: Element | null): el is HTMLVideoElement {
   return !!el && el instanceof HTMLVideoElement && 'remote' in el;
}

export function isChromeBrowser(): boolean {
   const userAgent = navigator.userAgent.toLowerCase();

   return userAgent.includes('chrome') && !userAgent.includes('edg'); // Chrome but not Edge
}

export function getVideoElement(player: VideoJsPlayer): HTMLVideoElement | null {
   const videoEl = player.el().querySelector('video');

   if (isVideoElementWithCast(videoEl)) {
      return videoEl;
   }

   // If not found, check if the player element itself is the video
   const playerEl = player.el();

   if (playerEl instanceof HTMLVideoElement && isVideoElementWithCast(playerEl)) {
      return playerEl;
   }

   return null;
}

/**
 * Orchestrates Chromecast / remote playback behavior for a single Video.js player.
 *
 * Responsibilities:
 * - Detect whether the current client supports Chromecast (Chrome browser with
 *   Remote Playback API support).
 * - Initialize and hold references to the underlying RemotePlayback object for
 *   Chromecast functionality.
 * - Expose `isAvailable` so callers can determine whether Chromecast should
 *   be offered, emitting AVAILABILITY_CHANGE events on the player.
 * - Open the Chromecast device picker via `prompt` using the Remote Playback API.
 * - Handle media readiness requirements for Chromecast casting.
 * - Listen to low-level API events and re-emit them as high-level
 *   `EVENTS.CHROMECAST.*` events on the Video.js player.
 */
export class ChromecastManager {
   private readonly _player: VideoJsPlayer;
   private _remotePlayback: RemotePlayback | null = null;
   private _isAwaitingDeviceAvailability = false;
   private _eventListeners: Array<{ event: string; handler: () => void }> = [];
   private _isSetup = false;

   public constructor(player: VideoJsPlayer) {
      this._player = player;
      this._initialize();
   }

   /**
    * Check whether Chromecast is available on the current device.
    *
    * This method verifies Chrome browser support and Remote Playback API
    * availability, then sets up availability watching if supported.
    *
    * @returns Promise that resolves to true if Chromecast is available, false otherwise
    */
   public async isChromecastAvailable(): Promise<boolean> {
      if (!checkClientChromecastSupport()) {
         videojs.log(LOG_MESSAGES.CHROMECAST_NOT_SUPPORTED);
         return false;
      }

      videojs.log(LOG_MESSAGES.CHROMECAST_SUPPORTED);

      if (this._remotePlayback && this._isSetup) {
         try {
            await this._remotePlayback.watchAvailability((available: boolean) => {
               this._player.trigger(EVENTS.CHROMECAST.AVAILABILITY_CHANGE, { available });
            });
            return true;
         } catch(error) {
            videojs.log.error('Error checking Remote Playback availability for Chromecast', error);
         }
      }

      return false;
   }

   /**
    * Get the current Remote Playback state.
    *
    * @returns The current state ('connecting', 'connected', 'disconnected')
    *          or null if not available
    */
   public getState(): RemotePlaybackState | null {
      return this._remotePlayback?.state || null;
   }

   /**
    * Check whether Chromecast is currently connected.
    *
    * @returns True if connected to a Chromecast device, false otherwise
    */
   public isConnected(): boolean {
      return this._remotePlayback?.state === 'connected';
   }

   /**
    * Open the Chromecast device picker for the current media element.
    *
    * Uses the Remote Playback API to show available Chromecast devices.
    * Handles the critical case where media isn't ready for casting by
    * automatically starting playback and retrying the prompt.
    *
    * @throws Error if Chromecast is not available or if the prompt fails
    */
   public async prompt(): Promise<void> {
      if (this._isAwaitingDeviceAvailability) {
         return;
      }

      if (!this._isSetup) {
         throw new Error('ChromecastManager initialization failed - video element with Remote Playback support not found');
      }

      if (!this._remotePlayback) {
         throw new Error('Remote Playback API not available');
      }

      // Handle the critical case where media isn't ready for casting yet
      try {
         await this._remotePlayback.prompt();
         videojs.log(LOG_MESSAGES.CHROMECAST_PICKER_OPENED);
      } catch(error) {
         const errorMessage = error instanceof Error ? error.message : String(error);

         // Handle specific error cases
         if (errorMessage.includes('No remote playback devices found')) {
            videojs.log('No Chromecast devices found on network - this is normal if no devices are available');
            throw new Error('No Chromecast devices found. Make sure your Chromecast is on the same network and try again.');
         }

         if (errorMessage.includes('NotAllowedError') || errorMessage.includes('not allowed')) {
            videojs.log.error('User denied Chromecast permission or gesture required', error);
            throw new Error('Chromecast permission denied. Please try clicking the button again.');
         }

         const videoElement = getVideoElement(this._player);

         if (!videoElement) {
            videojs.log.error('Video element not found', error);
            throw error;
         }

         // Check if media is playing and ready for casting
         const isPlaying = videoElement.currentTime > 0 && !videoElement.paused && !videoElement.ended && videoElement.readyState > 2;

         if (isPlaying || this.isConnected()) {
            videojs.log.error('Remote Playback prompt failed despite media being ready', error);
            throw error;
         }

         this._isAwaitingDeviceAvailability = true;

         const handleAvailabilityChange = (): void => {
            this._isAwaitingDeviceAvailability = false;
            this._player.off(EVENTS.CHROMECAST.AVAILABILITY_CHANGE, handleAvailabilityChange);

            if (this._remotePlayback) {
               this._remotePlayback.prompt().catch((promptError) => {
                  videojs.log.error('Retry prompt failed', promptError);
               });
            }
         };

         this._player.on(EVENTS.CHROMECAST.AVAILABILITY_CHANGE, handleAvailabilityChange);

         videojs.log('Starting media playback to enable Chromecast');
         videoElement.play().catch((playError: Error) => {
            videojs.log.error('Failed to start media playback', playError);
            this._isAwaitingDeviceAvailability = false;
         });
      }
   }

   /**
    * Clean up resources and event listeners.
    *
    * Removes all Remote Playback API event listeners to prevent memory leaks.
    * Should be called when the ChromecastManager is no longer needed.
    */
   public dispose(): void {
      if (this._remotePlayback) {
         this._eventListeners.forEach(({ event, handler }) => {
            this._remotePlayback?.removeEventListener(event, handler);
         });
         this._eventListeners = [];
      }

      this._remotePlayback = null;
      this._isSetup = false;
      this._isAwaitingDeviceAvailability = false;

      videojs.log('ChromecastManager disposed');
   }

   /**
    * Initialize the Chromecast manager.
    *
    * Sets up the Remote Playback API reference and configures
    * event listeners for Chromecast state changes.
    */
   private _initialize(): void {
      const videoElement = getVideoElement(this._player);

      if (!videoElement) {
         videojs.log.error('Video element not found');
         return;
      }

      if (checkClientChromecastSupport()) {
         this._remotePlayback = videoElement.remote || null;
         videojs.log('Remote Playback API initialized for Chromecast');
         this._setupEventListeners();
         this._isSetup = true;
      } else {
         videojs.log.error('Remote Playback API not supported');
      }
   }

   /**
    * Set up event listeners for Remote Playback API events.
    *
    * These events are re-emitted on the Video.js player so UI components
    * (e.g. the Chromecast button) can respond to connect / connecting /
    * disconnect transitions.
    */
   private _setupEventListeners(): void {
      if (!this._remotePlayback) {
         return;
      }

      const connectHandler = (): void => {
         this._player.trigger(EVENTS.CHROMECAST.CONNECTED);
      };

      const connectingHandler = (): void => {
         this._player.trigger(EVENTS.CHROMECAST.CONNECTING);
      };

      const disconnectHandler = (): void => {
         this._player.trigger(EVENTS.CHROMECAST.DISCONNECTED);
      };

      this._remotePlayback.addEventListener('connect', connectHandler);
      this._remotePlayback.addEventListener('connecting', connectingHandler);
      this._remotePlayback.addEventListener('disconnect', disconnectHandler);

      // Store listeners for cleanup
      this._eventListeners.push(
         { event: 'connect', handler: connectHandler },
         { event: 'connecting', handler: connectingHandler },
         { event: 'disconnect', handler: disconnectHandler }
      );

      videojs.log('Chromecast event listeners setup successfully');
   }

}

export { ChromecastButton } from './ChromecastButton';
