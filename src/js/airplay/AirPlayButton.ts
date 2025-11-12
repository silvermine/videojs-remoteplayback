import videojs from '@silvermine/video.js';
import type { VideoJsPlayer } from '../../../@types/videojs';
import type { RemotePlaybackAvailabilityEvent } from '../../../@types/remote-playback';
import { AirPlayButtonOptions } from './interfaces/Airplay.interfaces';
import { logError, logInfo } from '../../lib/logging';
import { getMediaElement } from '../../lib/get-media-element';
import { hasAirPlaySupport } from './lib/hasAirplaySupport';
import { CSS_CLASSES } from './constants/css-classes';
import { COMPONENT_NAMES } from './constants/component-names';
import { LOG_MESSAGES } from '../../constants/log-messages';
import { AVAILABILITY_STATES, EVENTS } from '../../constants/remote-playback';
import { hasRemotePlaybackSupport } from '../../lib/hasRemotePlaybackSupport';

class AirPlayButton extends videojs.getComponent('Button') {
   private readonly _player: VideoJsPlayer;
   private _labelEl?: HTMLSpanElement;

   public constructor(player: VideoJsPlayer, options: AirPlayButtonOptions = {}) {
      super(player, options as Record<string, unknown>);

      this._player = player;

      this._initializeButton(options);
      this._setupEventListeners();
   }

   public buildCSSClass(): string {
      return `${CSS_CLASSES.AIRPLAY_BUTTON} ${super.buildCSSClass()}`;
   }

   public handleClick(): void {
      if (!this._player.airPlay) {
         logError('AirPlay manager not available');
         return;
      }

      this._player.airPlay.prompt()
         .then(() => {
            logInfo(LOG_MESSAGES.PICKER_OPENED);
         })
         .catch((error: Error) => {
            logError('Failed to open AirPlay picker', error);
         });
   }


   private _initializeButton(options: AirPlayButtonOptions): void {
      if (hasAirPlaySupport()) {
         logInfo(LOG_MESSAGES.AIRPLAY_SUPPORTED);
      } else {
         this.hide();
         logInfo(LOG_MESSAGES.AIRPLAY_NOT_SUPPORTED);
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
   }

   private _setupEventListeners(): void {
      this._setupAvailabilityListeners();
      this._setupStateEventListeners();
   }

   private _setupAvailabilityListeners(): void {
      this._player.on(EVENTS.REMOTE_PLAYBACK.AVAILABLE, () => {
         this.show();
      });

      this._player.on(EVENTS.REMOTE_PLAYBACK.UNAVAILABLE, () => {
         this.hide();
      });

      this._setupDirectAPIListeners();
   }

   private _setupDirectAPIListeners(): void {
      const mediaEl = getMediaElement(this._player);

      if (!mediaEl || !hasAirPlaySupport()) {
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

      if (hasRemotePlaybackSupport() && mediaEl.remote) {
         mediaEl.remote.addEventListener('availabilitychange', onAvailabilityChange);
         this.on('dispose', () => {
            if (mediaEl.remote) {
               mediaEl.remote.removeEventListener('availabilitychange', onAvailabilityChange);
            }
         });
      }
   }

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

export { AirPlayButton, hasRemotePlaybackSupport };
