import videojs from '@silvermine/video.js';
import type { ComponentOptions } from '@silvermine/video.js';
import type { VideoJsPlayer } from '../../../@types/videojs';
import EVENTS from '../constants/events';
import type { RemotePlaybackPlugin, RemotePlaybackStrategy } from '../RemotePlaybackPlugin';

// INTERFACES

export interface BaseButtonOptions extends ComponentOptions {
   addLabelToButton: boolean;
   label: string;
}

// DEFAULTS

export const defaultButtonOptions: BaseButtonOptions = {
   addLabelToButton: true,
   label: 'Cast',
};

// CONSTANTS

const CSS_CLASSES = {
   BUTTON: 'vjs-remoteplayback-button',
   BUTTON_LARGE: 'vjs-remoteplayback-button-lg',
   BUTTON_LABEL: 'vjs-remoteplayback-button-label',
   CONNECTED: 'connected',
   CONNECTING: 'connecting',
   ICON_PLACEHOLDER: 'vjs-icon-placeholder',
} as const;

const Button = videojs.getComponent('Button');

export class BaseButton extends Button {
   private readonly _listeners = {
      [EVENTS.CONNECTING]: () => {
         this.removeClass(CSS_CLASSES.CONNECTED);
         this.addClass(CSS_CLASSES.CONNECTING);
      },
      [EVENTS.CONNECTED]: () => {
         this.removeClass(CSS_CLASSES.CONNECTING);
         this.addClass(CSS_CLASSES.CONNECTED);
      },
      [EVENTS.DISCONNECTED]: () => {
         this.removeClass(CSS_CLASSES.CONNECTING);
         this.removeClass(CSS_CLASSES.CONNECTED);
      },
      [EVENTS.AVAILABLE]: () => {
         this.show();
      },
      [EVENTS.UNAVAILABLE]: () => {
         this.hide();
      },
   };
   private readonly _options: BaseButtonOptions;
   private readonly _player: VideoJsPlayer;
   private readonly _manager: RemotePlaybackStrategy;
   private _labelEl?: HTMLSpanElement;

   public constructor(manager: RemotePlaybackStrategy, options: Partial<BaseButtonOptions> = {}) {
      super(manager.player, options);

      this._options = Object.assign({}, defaultButtonOptions, options);
      this._manager = manager;
      this._player = manager.player;

      // Add label if configured to do so
      if (this._options.addLabelToButton) {
         this.el().classList.add(CSS_CLASSES.BUTTON_LARGE);

         this._labelEl = document.createElement('span');
         this._labelEl.classList.add(CSS_CLASSES.BUTTON_LABEL);
         this._labelEl.textContent = this._options.label;

         this.el().appendChild(this._labelEl);
      } else {
         this.controlText(this._options.label);
      }

      // Add event listeners
      Object.entries(this._listeners).forEach(([ event, listener ]) => {
         this._player.on(event, listener);
      });
   }

   public buildCSSClass(): string {
      return `${CSS_CLASSES.BUTTON} ${super.buildCSSClass()}`;
   }

   public handleClick(): void {
      if (!this._manager) {
         this.plugin?.log.error('Manager not available');
         return;
      }
      this._manager.prompt().catch((error: Error) => {
         this.plugin?.log.error(error);
      });
   }

   public dispose(): void {
      Object.entries(this._listeners).forEach(([ event, listener ]) => {
         this._player.off(event, listener);
      });
      super.dispose();
   }

   private get plugin(): RemotePlaybackPlugin | undefined {
      return this._player.usingPlugin('remotePlayback') ? this._player.remotePlayback() : undefined;
   }

}
