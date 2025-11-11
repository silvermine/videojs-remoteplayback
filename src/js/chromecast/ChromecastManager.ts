import type {
   VideoJsPlayer,
   RemotePlaybackState,
} from '../types';
import {
   getMediaElement,
   logInfo,
   logError,
} from '../utils';
import { EVENTS, LOG_MESSAGES } from '../constants';
import { hasChromecastSupport, hasRemotePlaybackSupport } from './Chromecast.functions';


class ChromecastManager {
   private readonly _player: VideoJsPlayer;
   private _remotePlayback: RemotePlayback | null = null;
   private _isAwaitingDeviceAvailability = false;
   private _isSetup = false;

   public constructor(player: VideoJsPlayer) {
      this._player = player;
      this._initialize();
   }

   public async isAvailable(): Promise<boolean> {
      if (!hasChromecastSupport()) {
         logInfo(LOG_MESSAGES.CHROMECAST_NOT_SUPPORTED);
         return false;
      }

      logInfo(LOG_MESSAGES.CHROMECAST_SUPPORTED);

      if (this._remotePlayback && this._isSetup) {
         try {
            await this._remotePlayback.watchAvailability((available: boolean) => {
               this._player.trigger(EVENTS.CHROMECAST.AVAILABILITY_CHANGE, { available });
            });
            return true;
         } catch(error) {
            logError('Error checking Remote Playback availability for Chromecast', error);
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

   public async prompt(): Promise<void> {
      if (this._isAwaitingDeviceAvailability) {
         return;
      }

      if (!this._isSetup) {
         throw new Error('ChromecastManager not properly initialized. Call setup first.');
      }

      if (!this._remotePlayback) {
         throw new Error('Remote Playback API not available');
      }

      // Handle the critical case where media isn't ready for casting yet
      try {
         await this._remotePlayback.prompt();
         logInfo(LOG_MESSAGES.CHROMECAST_PICKER_OPENED);
      } catch(error) {
         const errorMessage = error instanceof Error ? error.message : String(error);

         // Handle specific error cases
         if (errorMessage.includes('No remote playback devices found')) {
            logInfo('No Chromecast devices found on network - this is normal if no devices are available');
            throw new Error('No Chromecast devices found. Make sure your Chromecast is on the same network and try again.');
         }

         if (errorMessage.includes('NotAllowedError') || errorMessage.includes('not allowed')) {
            logError('User denied Chromecast permission or gesture required', error);
            throw new Error('Chromecast permission denied. Please try clicking the button again.');
         }

         const mediaEl = getMediaElement(this._player);

         if (!mediaEl) {
            logError('Media element not found', error);
            throw error;
         }

         // Check if media is playing and ready for casting
         const isPlaying = mediaEl.currentTime > 0 &&
                          !mediaEl.paused &&
                          !mediaEl.ended &&
                          mediaEl.readyState > 2;

         if (isPlaying || this.isConnected()) {
            logError('Remote Playback prompt failed despite media being ready', error);
            throw error;
         }

         // Media needs to start playing for Chromecast to work
         this._isAwaitingDeviceAvailability = true;

         // Set up one-time listener for device availability
         const handleAvailabilityChange = (): void => {
            this._isAwaitingDeviceAvailability = false;
            this._player.off(EVENTS.CHROMECAST.AVAILABILITY_CHANGE, handleAvailabilityChange);

            if (this._remotePlayback) {
               this._remotePlayback.prompt().catch((promptError) => {
                  logError('Retry prompt failed', promptError);
               });
            }
         };

         this._player.on(EVENTS.CHROMECAST.AVAILABILITY_CHANGE, handleAvailabilityChange);

         // Start playback to enable casting
         logInfo('Starting media playback to enable Chromecast');
         mediaEl.play().catch((playError) => {
            logError('Failed to start media playback', playError);
            this._isAwaitingDeviceAvailability = false;
         });
      }
   }

   private _initialize(): void {
      const videoElement = getMediaElement(this._player);

      if (!videoElement) {
         logError('Video element not found');
         return;
      }

      if (hasRemotePlaybackSupport() && 'remote' in videoElement) {
         this._remotePlayback = videoElement.remote || null;
         logInfo('Remote Playback API initialized for Chromecast');
         this._setupEventListeners();
         this._isSetup = true;
      } else {
         logError('Remote Playback API not supported');
      }
   }

   private _setupEventListeners(): void {
      if (!this._remotePlayback) {
         return;
      }

      // Set up Remote Playback API event listeners
      this._remotePlayback.addEventListener('connect', () => {
         this._player.trigger(EVENTS.CHROMECAST.CONNECTED);
      });

      this._remotePlayback.addEventListener('connecting', () => {
         this._player.trigger(EVENTS.CHROMECAST.CONNECTING);
      });

      this._remotePlayback.addEventListener('disconnect', () => {
         this._player.trigger(EVENTS.CHROMECAST.DISCONNECTED);
      });

      logInfo('Chromecast event listeners setup successfully');
   }

}

export { ChromecastManager };
