import videojs, { ComponentOptions } from '@silvermine/video.js';
import type { VideoJsPlayer } from '../../../@types/videojs';
import type { RemotePlaybackAvailabilityEvent } from '../../../@types/remote-playback';
import { LOG_MESSAGES } from '../constants/log-messages';
import { AVAILABILITY_STATES, EVENTS } from '../constants/remote-playback';
import { checkClientRemotePlaybackSupport, RemotePlaybackPlugin } from '../RemotePlaybackPlugin';
import { checkClientAirPlaySupport, getVideoElement } from './AirPlayManager';

const CSS_CLASSES = {
   AIRPLAY_BUTTON: 'vjs-airplay-button',
   AIRPLAY_BUTTON_LARGE: 'vjs-airplay-button-lg',
   AIRPLAY_BUTTON_LABEL: 'vjs-airplay-button-label',
   AIRPLAY_CONNECTED: 'vjs-airplay-connected',
   AIRPLAY_CONNECTING: 'vjs-airplay-connecting',
   ICON_PLACEHOLDER: 'vjs-icon-placeholder',
   CONTROL_TEXT: 'vjs-control-text',
} as const;

export const COMPONENT_NAMES = {
   AIRPLAY_BUTTON: 'AirPlayButton',
   CONTROL_BAR: 'controlBar',
   FULLSCREEN_TOGGLE: 'fullscreenToggle',
} as const;

export interface AirPlayButtonOptions extends ComponentOptions {
   addAirPlayLabelToButton?: boolean;
}

const Button = videojs.getComponent('Button');

/**
 * AirPlay control button for the Video.js control bar.
 *
 * Responsibilities:
 * - Render a clickable control that asks the RemotePlayback plugin's
 *   AirPlayManager to open the AirPlay device picker.
 * - Decide when the button should be visible by listening to availability
 *   events from both the plugin and the underlying Remote Playback API.
 * - Update its CSS classes when AirPlay is connecting / connected /
 *   disconnected so the UI clearly reflects the current state.
 */
export class AirPlayButton extends Button {
   private readonly _player: VideoJsPlayer;
   private _labelEl?: HTMLSpanElement;

   public constructor(player: VideoJsPlayer, options: AirPlayButtonOptions = {}) {
      super(player, options);

      this._player = player;

      this._initialize(options);
   }

   public buildCSSClass(): string {
      return `${CSS_CLASSES.AIRPLAY_BUTTON} ${super.buildCSSClass()}`;
   }

   public handleClick(): void {
      const airplayManager = this.plugin?.airPlayManager;

      if (!this.plugin) {
         videojs.log.error('RemotePlayback plugin not available');
         return;
      }

      if (!airplayManager) {
         this.plugin.log.error('AirPlay manager not available');
         return;
      }

      airplayManager.prompt()
         .then(() => {
            this.plugin?.log(LOG_MESSAGES.PICKER_OPENED);
         })
         .catch((error: Error) => {
            this.plugin?.log.error('Failed to open AirPlay picker', error);
         });
   }

   /**
    * Convenience accessor for the RemotePlayback plugin instance used by
    * this button. Safely checks whether the player is using the plugin
    * before attempting to access it, returning null when unavailable.
    */
   private get plugin(): RemotePlaybackPlugin | null {
      return this._player.usingPlugin('remotePlayback') ? this._player.remotePlayback() : null;
   }


   private _initialize(options: AirPlayButtonOptions): void {
      if (checkClientAirPlaySupport()) {
         videojs.log(LOG_MESSAGES.AIRPLAY_SUPPORTED);
      } else {
         this.hide();
         videojs.log(LOG_MESSAGES.AIRPLAY_NOT_SUPPORTED);
      }

      if (options.addAirPlayLabelToButton) {
         this.el().classList.add(CSS_CLASSES.AIRPLAY_BUTTON_LARGE);

         this._labelEl = document.createElement('span');
         this._labelEl.classList.add(CSS_CLASSES.AIRPLAY_BUTTON_LABEL);
         this._labelEl.textContent = this.localize('AirPlay');

         this.el().appendChild(this._labelEl);
      } else {
         this.controlText('Start AirPlay');
      }


      this._setupAvailabilityListeners();
      this._setupDirectAPIListeners();
      this._setupStateEventListeners();
   }

   private _setupAvailabilityListeners(): void {
      this._player.on(EVENTS.REMOTE_PLAYBACK.AVAILABLE, () => {
         this.show();
      });

      this._player.on(EVENTS.REMOTE_PLAYBACK.UNAVAILABLE, () => {
         this.hide();
      });
   }

   /**
    * Attach direct Remote Playback API listeners on the underlying media
    * element so the AirPlay button can respond immediately to
    * `availabilitychange` events (showing when AirPlay is available and
    * hiding when it is not), independent of higher-level plugin events.
    */
   private _setupDirectAPIListeners(): void {
      const videoElement = getVideoElement(this._player);

      if (!videoElement || !checkClientAirPlaySupport()) {
         return;
      }

      const onAvailabilityChange = (event: Event): void => {
         const remoteEvent = event as RemotePlaybackAvailabilityEvent;

         if (remoteEvent.availability === AVAILABILITY_STATES.AVAILABLE) {
            this.show();
         } else {
            this.hide();
         }
      };

      if (checkClientRemotePlaybackSupport()) {
         videoElement.remote.addEventListener('availabilitychange', onAvailabilityChange);
         this.on('dispose', () => {
            if (videoElement.remote) {
               videoElement.remote.removeEventListener('availabilitychange', onAvailabilityChange);
            }
         });
      }
   }

   /**
    * Listen for high-level AirPlay state events from the player and toggle
    * CSS classes so the button visually reflects CONNECTING / CONNECTED /
    * DISCONNECTED states (e.g. animating while connecting, highlighted when
    * connected).
    */
   private _setupStateEventListeners(): void {
      this._player.on(EVENTS.AIRPLAY.CONNECTING, () => {
         this.removeClass(CSS_CLASSES.AIRPLAY_CONNECTED);
         this.addClass(CSS_CLASSES.AIRPLAY_CONNECTING);
      });

      this._player.on(EVENTS.AIRPLAY.CONNECTED, () => {
         this.removeClass(CSS_CLASSES.AIRPLAY_CONNECTING);
         this.addClass(CSS_CLASSES.AIRPLAY_CONNECTED);
      });

      this._player.on(EVENTS.AIRPLAY.DISCONNECTED, () => {
         this.removeClass(CSS_CLASSES.AIRPLAY_CONNECTING);
         this.removeClass(CSS_CLASSES.AIRPLAY_CONNECTED);
      });
   }
}

videojs.registerComponent(COMPONENT_NAMES.AIRPLAY_BUTTON, AirPlayButton);
