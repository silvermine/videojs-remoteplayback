import type { VideoJsPlayer } from '../../../@types/videojs';
import type {
   RemotePlaybackState,
   HTMLVideoElementWithAirPlay,
   WebKitPlaybackTargetAvailabilityEvent,
} from '../../../@types/remote-playback';
import videojs from '@silvermine/video.js';
import { LOG_MESSAGES } from '../constants/log-messages';
import { EVENTS } from '../constants/remote-playback';

export function checkClientAirPlaySupport(): boolean {
   if (typeof window === 'undefined') {
      return false;
   }

   const hasPickerMethod = 'HTMLVideoElement' in window && 'webkitShowPlaybackTargetPicker' in HTMLVideoElement.prototype,
         hasAvailabilityEvent = 'WebKitPlaybackTargetAvailabilityEvent' in window;

   return hasPickerMethod || hasAvailabilityEvent;
}

export function isVideoElementWithAirPlay(el: Element | null): el is HTMLVideoElementWithAirPlay {
   return !!el && el instanceof HTMLVideoElement && 'webkitShowPlaybackTargetPicker' in el &&
      'webkitCurrentPlaybackTargetIsWireless' in el &&
      'remote' in el;
}

export function getAirPlayVideoElement(player: VideoJsPlayer): HTMLVideoElementWithAirPlay | null {
   const videoEl = player.el().querySelector('video');

   if (isVideoElementWithAirPlay(videoEl)) {
      return videoEl;
   }

   return null;
}

/**
 * Orchestrates AirPlay / remote playback behavior for a single Video.js player.
 *
 * Responsibilities:
 * - Detect whether the current client supports AirPlay (WebKit APIs and/or the
 *   standardized Remote Playback API).
 * - Initialize and hold references to the underlying RemotePlayback object and
 *   WebKit AirPlay capabilities.
 * - Expose `isAirPlayAvailable` so callers can determine whether AirPlay should
 *   be offered, emitting AVAILABILITY_CHANGE events on the player.
 * - Open the AirPlay device picker via `prompt`, preferring WebKit AirPlay on
 *   Apple platforms and falling back to the Remote Playback API where
 *   available.
 * - Listen to low-level API events and re-emit them as high-level
 *   `EVENTS.AIRPLAY.*` events on the Video.js player.
 */
export class AirPlayManager {
   private readonly _player: VideoJsPlayer;
   private _remotePlayback: RemotePlayback | null = null;
   private _webkitAirPlaySupported = false;

   public constructor(player: VideoJsPlayer) {
      this._player = player;
      this._initialize();
   }

   public async isAirPlayAvailable(): Promise<boolean> {
      if (!checkClientAirPlaySupport()) {
         videojs.log(LOG_MESSAGES.AIRPLAY_NOT_SUPPORTED);
         return false;
      }

      videojs.log(LOG_MESSAGES.AIRPLAY_SUPPORTED);

      if (this._remotePlayback) {
         try {
            await this._remotePlayback.watchAvailability((available: boolean) => {
               this._player.trigger(EVENTS.AIRPLAY.AVAILABILITY_CHANGE, { available });
            });
            return true;
         } catch(error) {
            videojs.log.error('Error checking Remote Playback availability', error);
         }
      }

      if (this._webkitAirPlaySupported) {
         return this._checkWebKitAirPlayAvailability();
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
    * Open the AirPlay device picker for the current media element.
    *
    * This prefers the WebKit AirPlay API (Safari / Apple devices) when available,
    * falling back to the standardized Remote Playback API for limited
    * cross-browser support. If neither API is available, an error is thrown.
    */
   public async prompt(): Promise<void> {
      if (this._webkitAirPlaySupported) {
         const videoElement = getAirPlayVideoElement(this._player);

         if (!videoElement) {
            videojs.log.error('Video element not found');
            return;
         }

         videojs.log(LOG_MESSAGES.WEBKIT_AIRPLAY_PREFERRED);
         videoElement.webkitShowPlaybackTargetPicker();
         return Promise.resolve();
      }

      if (this._remotePlayback) {
         videojs.log('Using Remote Playback API - limited device compatibility');
         return this._remotePlayback.prompt();
      }

      throw new Error('No AirPlay API available');
   }

   private _initialize(): void {
      const videoElement = getAirPlayVideoElement(this._player);

      if (!videoElement) {
         videojs.log.error('Video element not found');
         return;
      }

      if (checkClientAirPlaySupport()) {
         this._remotePlayback = videoElement.remote || null;
         this._webkitAirPlaySupported = true;
         videojs.log('Remote Playback API initialized');
         videojs.log(LOG_MESSAGES.WEBKIT_AIRPLAY_SUPPORTED);
      }

      this._setupEventListeners();

      if (this._webkitAirPlaySupported) {
         this._setupWebKitEventListeners();
      }
   }

   private _checkWebKitAirPlayAvailability(): boolean {
      const videoElement = getAirPlayVideoElement(this._player);

      if (!videoElement) {
         return false;
      }

      const onAvailabilityChange = (event: Event): void => {
         // This is a safe assertion since we know this is a webkit event
         const webkitEvent = event as WebKitPlaybackTargetAvailabilityEvent,
               available = webkitEvent.availability === 'available';

         this._player.trigger(EVENTS.AIRPLAY.AVAILABILITY_CHANGE, { available });
      };

      videoElement.addEventListener('webkitplaybacktargetavailabilitychanged', onAvailabilityChange);

      return true;
   }

   /**
    * Wire up connection state events for both the Remote Playback API and
    * WebKit AirPlay implementation. These events are re-emitted on the
    * Video.js player so UI components (e.g. the AirPlay button) can respond
    * to connect / connecting / disconnect transitions.
    */
   private _setupEventListeners(): void {
      if (this._remotePlayback) {
         this._remotePlayback.addEventListener('connect', () => {
            this._player.trigger(EVENTS.AIRPLAY.CONNECTED);
         });

         this._remotePlayback.addEventListener('connecting', () => {
            this._player.trigger(EVENTS.AIRPLAY.CONNECTING);
         });

         this._remotePlayback.addEventListener('disconnect', () => {
            this._player.trigger(EVENTS.AIRPLAY.DISCONNECTED);
         });
      }
   }

   /**
    * Listen for WebKit-specific AirPlay target changes and translate them
    * into generic AirPlay CONNECTED / DISCONNECTED events on the Video.js
    * player. This covers Safari / Apple devices where WebKit exposes
    * `webkitcurrentplaybacktargetiswirelesschanged`.
    */
   private _setupWebKitEventListeners(): void {
      const videoElement = getAirPlayVideoElement(this._player);

      if (!videoElement) {
         return;
      }

      const onPlaybackTargetChange = (): void => {
         if (videoElement.webkitCurrentPlaybackTargetIsWireless) {
            this._player.trigger(EVENTS.AIRPLAY.CONNECTED);
         } else {
            this._player.trigger(EVENTS.AIRPLAY.DISCONNECTED);
         }
      };

      videoElement.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', onPlaybackTargetChange);
   }
}

export { AirPlayButton } from './AirPlayButton';
