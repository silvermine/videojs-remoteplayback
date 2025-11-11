import videojs, { ComponentOptions } from '@silvermine/video.js';
import type { VideoJsPlayer } from '../../../@types/videojs';
import { RemotePlaybackAvailabilityEvent } from '../../../@types/remote-playback';
import { RemotePlaybackPlugin } from '../RemotePlaybackPlugin';
import { getVideoElement } from './ChromecastManager';
import { AVAILABILITY_STATES, EVENTS } from '../constants/remote-playback';
import { LOG_MESSAGES } from '../constants/log-messages';
import { checkClientChromecastSupport } from './ChromecastManager';

export const CHROMECAST_COMPONENT_NAMES = {
   CHROMECAST_BUTTON: 'ChromecastButton',
   CONTROL_BAR: 'controlBar',
   FULLSCREEN_TOGGLE: 'fullscreenToggle',
} as const;

const CSS_CLASSES = {
   CHROMECAST_BUTTON: 'vjs-chromecast-button',
   CHROMECAST_BUTTON_LARGE: 'vjs-chromecast-button-lg',
   CHROMECAST_BUTTON_LABEL: 'vjs-chromecast-button-label',
   CHROMECAST_CONNECTED: 'vjs-chromecast-connected',
   CHROMECAST_CONNECTING: 'vjs-chromecast-connecting',
   ICON_PLACEHOLDER: 'vjs-icon-placeholder',
   CHROMECAST_CASTING: 'vjs-chromecast-casting-state',
   CONTROL_TEXT: 'vjs-control-text',
} as const;

export interface ChromecastButtonOptions extends ComponentOptions {
   addChromecastLabelToButton?: boolean;
}

const Button = videojs.getComponent('Button');

/**
 * Chromecast control button for the Video.js control bar.
 *
 * Responsibilities:
 * - Render a clickable control that asks the RemotePlayback plugin's
 *   ChromecastManager to open the Chromecast device picker.
 * - Decide when the button should be visible by listening to availability
 *   events from both the plugin and the underlying Remote Playback API.
 * - Update its CSS classes when Chromecast is connecting / connected /
 *   disconnected so the UI clearly reflects the current state.
 * - Display dynamic button text ("Cast" / "Disconnect Cast") when
 *   addChromecastLabelToButton option is enabled.
 */
export class ChromecastButton extends Button {
   private readonly _player: VideoJsPlayer;
   private _labelEl?: HTMLSpanElement;
   private _isChromecastConnected = false;

   public constructor(player: VideoJsPlayer, options: ChromecastButtonOptions = {}) {
      super(player, options);

      this._player = player;

      this._initialize(options);
   }

   /**
    * Build the CSS class string for the button.
    *
    * Includes base classes, connection state classes, and large button
    * classes when the label option is enabled.
    *
    * @returns The complete CSS class string
    */
   public buildCSSClass(): string {
      const options = this.options_ as ChromecastButtonOptions;

      return `${CSS_CLASSES.CHROMECAST_BUTTON} ${
         this._isChromecastConnected ? CSS_CLASSES.CHROMECAST_CASTING : ''
      }${
         options.addChromecastLabelToButton ? `${CSS_CLASSES.CHROMECAST_BUTTON_LARGE} ` : ''
      }${super.buildCSSClass()}`;
   }

   /**
    * Create the button DOM element.
    *
    * Creates the button structure with icon placeholder and
    * control text for accessibility.
    *
    * @returns The configured button element
    */
   public createEl(): HTMLButtonElement {
      const el = super.createEl('button', { className: this.buildCSSClass() }) as HTMLButtonElement;

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

   /**
    * Handle button click events.
    *
    * Triggers the Chromecast device picker through the ChromecastManager.
    * Logs success or error messages accordingly.
    */
   public handleClick(): void {
      const chromecastManager = this.plugin?.chromecastManager;

      if (!this.plugin) {
         videojs.log.error('RemotePlayback plugin not available');
         return;
      }

      if (!chromecastManager) {
         this.plugin.log.error('Chromecast manager not available');
         return;
      }

      chromecastManager.prompt()
         .then(() => {
            this.plugin?.log(LOG_MESSAGES.CHROMECAST_PICKER_OPENED);
         })
         .catch((error: Error) => {
            this.plugin?.log.error('Failed to open Chromecast picker', error);
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

   /**
    * Initialize the button with options and set up event listeners.
    *
    * Configures visibility based on Chromecast support, adds optional
    * label, and sets up availability and state event listeners.
    *
    * @param options - Button configuration options
    */
   private _initialize(options: ChromecastButtonOptions): void {
      // Start with button hidden. Only show when we know devices are available.
      // This prevents showing a non-functional button on browsers with the API
      // but no actual Cast devices (like Chrome Desktop without cast devices).
      this.hide();

      if (checkClientChromecastSupport()) {
         videojs.log(LOG_MESSAGES.CHROMECAST_SUPPORTED);
      } else {
         videojs.log(LOG_MESSAGES.CHROMECAST_NOT_SUPPORTED);
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

      this._setupAvailabilityListeners();
      this._setupDirectAPIListeners();
      this._setupStateEventListeners();
   }

   /**
    * Update the Chromecast connection state.
    *
    * Central method for updating connection state and refreshing
    * the button appearance and label accordingly.
    *
    * @param isConnected - Whether Chromecast is connected
    */
   private _updateChromecastState(isConnected: boolean): void {
      this._isChromecastConnected = isConnected;
      this._reloadCSSClasses();
      this._updateCastLabelText();
   }

   /**
    * Reload the button CSS classes.
    *
    * Rebuilds and applies the CSS class string to update the
    * button's visual state.
    */
   private _reloadCSSClasses(): void {
      const el = this.el();

      if (!el) {
         return;
      }
      el.className = this.buildCSSClass();
   }

   /**
    * Update the button label text based on connection state.
    *
    * Shows "Cast" when disconnected and "Disconnect Cast" when
    * connected. Only applies when the label option is enabled.
    */
   private _updateCastLabelText(): void {
      if (!this._labelEl) {
         return;
      }
      this._labelEl.textContent = this._isChromecastConnected ? this.localize('Disconnect Cast') : this.localize('Cast');
   }

   private _setupAvailabilityListeners(): void {
      this._player.on(EVENTS.REMOTE_PLAYBACK.AVAILABLE, () => {
         this.show();
      });

      this._player.on(EVENTS.REMOTE_PLAYBACK.UNAVAILABLE, () => {
         this.hide();
      });
   }

   private _setupDirectAPIListeners(): void {
      if (!checkClientChromecastSupport()) {
         return;
      }

      this._player.one('loadstart', () => {
         const videoElement = getVideoElement(this._player);

         if (!videoElement) {
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

         videoElement.remote.addEventListener('availabilitychange', onAvailabilityChange);
         this.on('dispose', () => {
            videoElement.remote?.removeEventListener('availabilitychange', onAvailabilityChange);
         });
      });
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
         this.removeClass(CSS_CLASSES.CHROMECAST_CONNECTED);
         this.removeClass(CSS_CLASSES.CHROMECAST_CONNECTING);
         this._updateChromecastState(false);
      });
   }
}

videojs.registerComponent(CHROMECAST_COMPONENT_NAMES.CHROMECAST_BUTTON, ChromecastButton);
