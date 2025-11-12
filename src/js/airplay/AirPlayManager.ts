import type { VideoJsPlayer } from '../../../@types/videojs';
import type {
   RemotePlaybackState,
   HTMLVideoElementWithAirPlay,
   WebKitPlaybackTargetAvailabilityEvent,
} from '../../../@types/remote-playback';
import { getMediaElement } from '../../lib/get-media-element';
import { logInfo, logError } from '../../lib/logging';
import { EVENTS } from '../../constants/remote-playback';
import { LOG_MESSAGES } from '../../constants/log-messages';
import { hasAirPlaySupport } from './lib/hasAirplaySupport';
import { hasRemotePlaybackSupport } from '../../lib/hasRemotePlaybackSupport';
import { hasWebKitAirPlaySupport } from './lib/hasWebkitAirplaySupport';

class AirPlayManager {
   private readonly _player: VideoJsPlayer;
   private _remotePlayback: RemotePlayback | null = null;
   private _webkitAirPlaySupported = false;

   public constructor(player: VideoJsPlayer) {
      this._player = player;
      this._initialize();
   }

   public async isAvailable(): Promise<boolean> {
      if (!hasAirPlaySupport()) {
         logInfo(LOG_MESSAGES.AIRPLAY_NOT_SUPPORTED);
         return false;
      }

      logInfo(LOG_MESSAGES.AIRPLAY_SUPPORTED);

      if (this._remotePlayback) {
         try {
            await this._remotePlayback.watchAvailability((available: boolean) => {
               this._player.trigger(EVENTS.AIRPLAY.AVAILABILITY_CHANGE, { available });
            });
            return true;
         } catch(error) {
            logError('Error checking Remote Playback availability', error);
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

   public async prompt(): Promise<void> {
      if (this._webkitAirPlaySupported) {
         const videoElement = getMediaElement(this._player) as HTMLVideoElementWithAirPlay;

         if (videoElement?.webkitShowPlaybackTargetPicker) {
            logInfo(LOG_MESSAGES.WEBKIT_AIRPLAY_PREFERRED);
            videoElement.webkitShowPlaybackTargetPicker();
            return Promise.resolve();
         }
      }

      if (this._remotePlayback) {
         logInfo('Using Remote Playback API - limited device compatibility');
         return this._remotePlayback.prompt();
      }

      throw new Error('No AirPlay API available');
   }

   private _initialize(): void {
      const videoElement = getMediaElement(this._player);

      if (!videoElement) {
         logError('Video element not found');
         return;
      }

      if (hasRemotePlaybackSupport() && 'remote' in videoElement) {
         this._remotePlayback = videoElement.remote || null;
         logInfo('Remote Playback API initialized');
      }

      if (hasWebKitAirPlaySupport()) {
         this._webkitAirPlaySupported = true;
         logInfo(LOG_MESSAGES.WEBKIT_AIRPLAY_SUPPORTED);
      }

      this._setupEventListeners();
   }

   private _checkWebKitAirPlayAvailability(): boolean {
      const videoElement = getMediaElement(this._player) as HTMLVideoElementWithAirPlay;

      if (!videoElement) {
         return false;
      }

      const onAvailabilityChange = (event: Event): void => {
         const webkitEvent = event as WebKitPlaybackTargetAvailabilityEvent;

         const available = webkitEvent.availability === 'available';

         this._player.trigger(EVENTS.AIRPLAY.AVAILABILITY_CHANGE, { available });
      };

      videoElement.addEventListener('webkitplaybacktargetavailabilitychanged', onAvailabilityChange);

      return true;
   }

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

      if (this._webkitAirPlaySupported) {
         this._setupWebKitEventListeners();
      }
   }

   private _setupWebKitEventListeners(): void {
      const videoElement = getMediaElement(this._player) as HTMLVideoElementWithAirPlay;

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

export { AirPlayManager };
export { AirPlayButton } from './AirPlayButton';
