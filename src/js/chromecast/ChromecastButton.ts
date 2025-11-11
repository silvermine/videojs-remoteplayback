import videojs from '@silvermine/video.js';
import { ChromecastButtonOptions } from './interfaces/Chromecast.interfaces';
import { hasChromecastSupport } from './lib/hasChromecastSupport';
import { CSS_CLASSES } from './constants/css-classes';
import { COMPONENT_NAMES } from './constants/component-names';
import { LOG_MESSAGES } from '../../constants/log-messages';
import { AVAILABILITY_STATES, EVENTS } from '../../constants/remote-playback';
import { hasRemotePlaybackSupport } from '../../lib/hasRemotePlaybackSupport';
import type { VideoJsPlayer } from '../../../@types/videojs';
import { logError, logInfo } from '../../lib/logging';
import { getMediaElement } from '../../lib/get-media-element';
import { RemotePlaybackAvailabilityEvent } from '../../../@types/remote-playback';

class ChromecastButton extends videojs.getComponent('Button') {
   private readonly _player: VideoJsPlayer;
   private _labelEl?: HTMLSpanElement;
   private _isChromecastConnected = false;

   public constructor(player: VideoJsPlayer, options: ChromecastButtonOptions = {}) {
      super(player, options as Record<string, unknown>);

      this._player = player;

      // Set up event listeners for chromecast events
      player.on(EVENTS.CHROMECAST.CONNECTED, this._onChromecastConnected.bind(this));
      player.on(EVENTS.CHROMECAST.DISCONNECTED, this._onChromecastDisconnected.bind(this));
      player.on(EVENTS.CHROMECAST.CONNECTING, this._onChromecastConnecting.bind(this));

      this._initializeButton(options);
      this._setupEventListeners();
   }

   public buildCSSClass(): string {
      const options = this.options_ as ChromecastButtonOptions;

      return `${CSS_CLASSES.CHROMECAST_BUTTON} ${
         this._isChromecastConnected ? 'vjs-chromecast-casting-state ' : ''
      }${
         options.addChromecastLabelToButton ? `${CSS_CLASSES.CHROMECAST_BUTTON_LARGE} ` : ''
      }${super.buildCSSClass()}`;
   }

   public createEl(): HTMLButtonElement {
      const el = super.createEl('button', {
         className: this.buildCSSClass(),
      }) as HTMLButtonElement;

      // Clear any existing content to avoid duplication
      el.innerHTML = '';

      // Create icon placeholder span
      const iconPlaceholder = document.createElement('span');

      iconPlaceholder.classList.add(CSS_CLASSES.ICON_PLACEHOLDER);
      iconPlaceholder.setAttribute('aria-hidden', 'true');

      el.appendChild(iconPlaceholder);

      // Add control text for accessibility
      const controlText = document.createElement('span');

      controlText.classList.add(CSS_CLASSES.CONTROL_TEXT);
      controlText.textContent = this.localize('Open Chromecast menu');

      el.appendChild(controlText);

      return el;
   }

   public handleClick(): void {
      if (!this._player.chromecast) {
         logError('Chromecast manager not available');
         return;
      }

      this._player.chromecast.prompt()
         .then(() => {
            logInfo(LOG_MESSAGES.CHROMECAST_PICKER_OPENED);
         })
         .catch((error: Error) => {
            logError('Failed to open Chromecast picker', error);
         });
   }

   private _initializeButton(options: ChromecastButtonOptions): void {
      if (hasChromecastSupport()) {
         logInfo(LOG_MESSAGES.CHROMECAST_SUPPORTED);
      } else {
         this.hide();
         logInfo(LOG_MESSAGES.CHROMECAST_NOT_SUPPORTED);
      }

      if (options.addChromecastLabelToButton) {
         this.el().classList.add(CSS_CLASSES.CHROMECAST_BUTTON_LARGE);

         this._labelEl = document.createElement('span');
         this._labelEl.classList.add(CSS_CLASSES.CHROMECAST_BUTTON_LABEL);
         this._updateCastLabelText();

         this.el().appendChild(this._labelEl);
      } else {
         this.controlText('Open Chromecast menu');
      }
   }

   private _onChromecastConnected(): void {
      this._isChromecastConnected = true;
      this._reloadCSSClasses();
      this._updateCastLabelText();
   }

   private _onChromecastDisconnected(): void {
      this._isChromecastConnected = false;
      this._reloadCSSClasses();
      this._updateCastLabelText();
   }

   private _onChromecastConnecting(): void {
      this._isChromecastConnected = false;
      this._reloadCSSClasses();
   }

   private _reloadCSSClasses(): void {
      const el = this.el();

      if (!el) {
         return;
      }
      el.className = this.buildCSSClass();
   }

   private _updateCastLabelText(): void {
      if (!this._labelEl) {
         return;
      }
      this._labelEl.textContent = this._isChromecastConnected ?
         this.localize('Disconnect Cast') :
         this.localize('Cast');
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

      if (!mediaEl || !hasChromecastSupport()) {
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
      this._player.on(EVENTS.CHROMECAST.CONNECTING, () => {
         this.removeClass(CSS_CLASSES.CHROMECAST_CONNECTED);
         this.addClass(CSS_CLASSES.CHROMECAST_CONNECTING);
      });

      this._player.on(EVENTS.CHROMECAST.CONNECTED, () => {
         this.removeClass(CSS_CLASSES.CHROMECAST_CONNECTING);
         this.addClass(CSS_CLASSES.CHROMECAST_CONNECTED);
      });

      this._player.on(EVENTS.CHROMECAST.DISCONNECTED, () => {
         this.removeClass(CSS_CLASSES.CHROMECAST_CONNECTING);
         this.removeClass(CSS_CLASSES.CHROMECAST_CONNECTED);
      });
   }
}

videojs.registerComponent(COMPONENT_NAMES.CHROMECAST_BUTTON, ChromecastButton);

export { ChromecastButton, hasRemotePlaybackSupport };
