import type { VideoJsPlayer } from '../../../@types/videojs';
import { Button } from '@silvermine/video.js';
import EVENTS from '../constants/events';
import { RemotePlaybackPlugin, RemotePlaybackStrategy } from '../RemotePlaybackPlugin';
import { BaseButton, BaseButtonOptions } from '../buttons/BaseButton';
import { AirPlayButton } from '../buttons/AirPlayButton';
import { getVideoElement } from '../lib/get-video-element';
import { checkClientSupport, checkClientSupportWithAirPlay } from '../lib/check-client-support';

/**
 * Orchestrates remote playback behavior for a single Video.js player.
 */
export class RemotePlaybackManager implements RemotePlaybackStrategy {
   public readonly kind = 'RemotePlaybackAPI';
   private readonly _listeners = {
      'connect': () => { this._player.trigger(EVENTS.CONNECTED); },
      'connecting': () => { this._player.trigger(EVENTS.CONNECTING); },
      'disconnect': () => { this._player.trigger(EVENTS.DISCONNECTED); },
   };
   private readonly _player: VideoJsPlayer;
   private _remotePlayback: RemotePlayback | null = null;
   private _availabilityWatchId: number | null = null;

   public constructor(player: VideoJsPlayer) {
      this._player = player;

      // Only proceed if the browser supports the Remote Playback API
      if (!checkClientSupport()) {
         this.plugin?.log.error('Remote Playback API not supported!');
         return;
      }

      // Get the video element
      const videoElement = getVideoElement(this._player);

      if (!videoElement) {
         this.plugin?.log.error('Video element not found!');
         return;
      }

      // Only after all checks do we hold a reference to the Remote Playback API
      this._remotePlayback = videoElement.remote || null;
      this._setupEventListeners();
      this.plugin?.log('Remote Playback API strategy initialization successful.');
   }

   public get player(): VideoJsPlayer {
      return this._player;
   }

   public makeButton(options: Partial<BaseButtonOptions> = {}): Button | undefined {
      if (checkClientSupportWithAirPlay()) {
         // If AirPlay is available, we use that detection to use an AirPlay button just
         // to provide a different icon/label appearance.
         return new AirPlayButton(this._player, options);
      } else if (checkClientSupport()) {
         return new BaseButton(this._player, options);
      }
   }

   /**
    * Open the Remote Playback device picker for the current media element.
    */
   public async prompt(): Promise<void> {
      if (!this._remotePlayback) {
         this.plugin?.log.error('No Remote Playback was captured during initialization.');
         return;
      }
      try {
         await this._remotePlayback.prompt();
         this.plugin?.log('Device picker opened.');
      } catch(error) {
         this.plugin?.log.error('Failed to open device picker!', error);
      }
   }

   /**
    * Clean up resources and event listeners.
    */
   public dispose(): void {
      Object.entries(this._listeners).forEach(([ event, listener ]) => {
         this._remotePlayback?.removeEventListener(event, listener);
      });
      if (this._availabilityWatchId !== null) {
         this._remotePlayback?.cancelWatchAvailability(this._availabilityWatchId).catch((error: DOMException) => {
            this.plugin?.log.error('Failed to cancel Remote Playback availability watch.', error);
         });
      }
      this._remotePlayback = null;
   }

   private get plugin(): RemotePlaybackPlugin | undefined {
      return this._player.usingPlugin('remotePlayback') ? this._player.remotePlayback() : undefined;
   }

   /**
    * Wire up connection state events for the Remote Playback API. These events are
    * re-emitted on the Video.js player so UI components (e.g. the button) can respond
    * to events.
    */
   private _setupEventListeners(): void {
      if (!this._remotePlayback) {
         return;
      }

      this._remotePlayback
         .watchAvailability((available: boolean): void => {
            this.plugin?.log('Availability changed:', available);
            this._player.trigger(available ? EVENTS.AVAILABLE : EVENTS.UNAVAILABLE);
         })
         .then((id) => {
            this.plugin?.log('Started watching availability with ID:', id);
            this._availabilityWatchId = id;
         })
         .catch((error: DOMException) => {
            this.plugin?.log.error('Failed to watch availability.', error);
         });

      Object.entries(this._listeners).forEach(([ event, listener ]) => {
         this._remotePlayback?.addEventListener(event, listener);
      });
   }

}
