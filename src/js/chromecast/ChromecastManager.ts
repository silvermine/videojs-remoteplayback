import type { VideoJsPlayer } from '../../../@types/videojs';
import type { RemotePlaybackState } from '../../../@types/remote-playback';
import videojs from '@silvermine/video.js';
import { LOG_MESSAGES } from '../constants/log-messages';
import { EVENTS } from '../constants/remote-playback';
import { checkClientAirPlaySupport } from '../airplay/AirPlayManager';
import { RemotePlaybackStrategy } from '../RemotePlaybackPlugin';

export function checkClientChromecastSupport(): boolean {
   if (typeof window === 'undefined') {
      return false;
   }

   // The Remote Playback API ('remote' on HTMLVideoElement) is the standard
   // mechanism for Chromecast in Chrome. We additionally check for the
   // RemotePlayback global constructor and that the WebKit AirPlay picker is
   // NOT present, which distinguishes Chrome's Chromecast implementation from
   // Safari's AirPlay implementation of the same API.
   const hasRemotePlaybackAPI = 'HTMLVideoElement' in window &&
      'remote' in HTMLVideoElement.prototype &&
      'RemotePlayback' in window;

   return hasRemotePlaybackAPI && !checkClientAirPlaySupport();
}

export function isVideoElementWithCast(el: Element | null): el is HTMLVideoElement {
   return !!el && el instanceof HTMLVideoElement && 'remote' in el;
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
 * - Detect whether the current client supports Chromecast (Remote Playback API).
 * - Initialize and hold references to the underlying RemotePlayback object.
 * - Expose `isChromecastAvailable` so callers can determine whether Chromecast should
 *   be offered, emitting AVAILABILITY_CHANGE events on the player.
 * - Open the Chromecast device picker via `prompt` using the Remote Playback API.
 * - Handle media readiness requirements for Chromecast casting.
 * - Listen to low-level API events and re-emit them as high-level
 *   `EVENTS.CHROMECAST.*` events on the Video.js player.
 */
export class ChromecastManager implements RemotePlaybackStrategy {
   private readonly _player: VideoJsPlayer;
   private _remotePlayback: RemotePlayback | null = null;

   public constructor(player: VideoJsPlayer) {
      this._player = player;
   }

   /**
    * Initialize the Chromecast manager.
    *
    * Called by the plugin after the player is ready and the video element
    * exists in the DOM. Sets up the Remote Playback API reference and
    * configures event listeners for Chromecast state changes.
    */
   public initialize(): void {
      // Only proceed if the browser supports Chromecast
      if (!checkClientChromecastSupport()) {
         videojs.log(LOG_MESSAGES.CHROMECAST_NOT_SUPPORTED);
         return;
      }

      // Browser supports Chromecast, now check if video element exists
      const videoElement = getVideoElement(this._player);

      if (!videoElement) {
         videojs.log.error('Chromecast: Video element not found');
         return;
      }

      this._remotePlayback = videoElement.remote ?? null;
      videojs.log('Remote Playback API initialized for Chromecast');
      this._setupEventListeners();
   }

   public async isAvailable(): Promise<boolean> {
      return await this.isChromecastAvailable();
   }

   public async isChromecastAvailable(): Promise<boolean> {
      if (!checkClientChromecastSupport()) {
         videojs.log(LOG_MESSAGES.CHROMECAST_NOT_SUPPORTED);
         return false;
      }

      videojs.log(LOG_MESSAGES.CHROMECAST_SUPPORTED);

      if (this._remotePlayback) {
         try {
            await this._remotePlayback.watchAvailability((available: boolean) => {
               this._player.trigger(EVENTS.CHROMECAST.AVAILABILITY_CHANGE, { available });
            });
            return true;
         } catch(error) {
            videojs.log.error('Error checking Chromecast availability', error);
         }
      }

      return false;
   }

   public getState(): RemotePlaybackState | null {
      return this._remotePlayback?.state || null;
   }

   public isConnected(): boolean {
      return this._remotePlayback?.state === 'connected';
   }

   /**
    * Open the Chromecast device picker for the current media element.
    *
    * Uses the Remote Playback API to show available Chromecast devices.
    *
    * @throws Error if Chromecast is not available or if the prompt fails
    */
   public async prompt(): Promise<void> {
      if (this._remotePlayback) {
         videojs.log('Using Remote Playback API for Chromecast');

         try {
            return await this._remotePlayback.prompt();
         } catch(error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('No remote playback devices found')) {
               videojs.log('No Chromecast devices found on network - this is normal if no devices are available');
               throw new Error('No Chromecast devices found. Make sure your Chromecast is on the same network and try again.');
            }

            if (errorMessage.includes('NotAllowedError') || errorMessage.includes('not allowed')) {
               videojs.log.error('User denied Chromecast permission or gesture required', error);
               throw new Error('Chromecast permission denied. Please try clicking the button again.');
            }

            throw error;
         }
      }

      throw new Error('Chromecast not available - Remote Playback API not supported');
   }

   /**
    * Clean up resources and event listeners.
    *
    * Should be called when the ChromecastManager is no longer needed.
    */
   public dispose(): void {
      this._remotePlayback = null;
      videojs.log('ChromecastManager disposed');
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

      this._remotePlayback.addEventListener('connect', () => {
         this._player.trigger(EVENTS.CHROMECAST.CONNECTED);
      });

      this._remotePlayback.addEventListener('connecting', () => {
         this._player.trigger(EVENTS.CHROMECAST.CONNECTING);
      });

      this._remotePlayback.addEventListener('disconnect', () => {
         this._player.trigger(EVENTS.CHROMECAST.DISCONNECTED);
      });

      videojs.log('Chromecast event listeners setup successfully');
   }
}

export { ChromecastButton } from './ChromecastButton';
