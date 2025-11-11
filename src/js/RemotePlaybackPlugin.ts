import type { RemotePlaybackState } from '../../@types/remote-playback';
import type { VideoJsPlayer } from '../../@types/videojs';
import { AirPlayManager, AirPlayButton, checkClientAirPlaySupport } from './airplay/AirPlayManager';
import videojs from '@silvermine/video.js';
import { LOG_MESSAGES } from './constants/log-messages';
import { AIRPLAY_COMPONENT_NAMES } from './airplay/AirPlayButton';
import { EVENTS } from './constants/remote-playback';
import { checkClientChromecastSupport, ChromecastButton, ChromecastManager } from './chromecast/ChromecastManager';

const Plugin = videojs.getPlugin('plugin');

export interface RemotePlaybackStrategy {
   initialize(): void;
   isAvailable(): Promise<boolean>;
   isConnected(): boolean;
   getState(): RemotePlaybackState | null;
   dispose(): void;
}

export type StrategyConstructor
   <T extends RemotePlaybackStrategy = RemotePlaybackStrategy
> = new (player: VideoJsPlayer) => T;

export interface RemotePlaybackPluginOptions {
   addLabelToButton?: boolean;
}

export function isPlayerWithRemotePlaybackPlugin(o: unknown): o is VideoJsPlayer {
   return typeof o === 'object' && o !== null &&
      // Check for presence of some standard Player methods
      'ready' in o && typeof o.ready === 'function' &&
      'currentTime' in o && typeof o.currentTime === 'function' &&
      'play' in o && typeof o.play === 'function' &&
      'pause' in o && typeof o.pause === 'function' &&
      // Finally, check for presence of our plugin
      'remotePlayback' in o && typeof o.remotePlayback === 'function';
}

export function checkClientRemotePlaybackSupport(): boolean {
   return typeof window !== 'undefined' &&
      'HTMLVideoElement' in window &&
      'remote' in HTMLVideoElement.prototype;
}

const defaultOptions = {
   addLabelToButton: true,
};

export class RemotePlaybackPlugin extends Plugin {
   public readonly log!: videojs.Log;
   private readonly _player: VideoJsPlayer;
   private _strategies: RemotePlaybackStrategy[] = [];
   private _activeStrategy: RemotePlaybackStrategy | null = null;
   private readonly _options: RemotePlaybackPluginOptions;

   public constructor(player: videojs.Player, options?: RemotePlaybackPluginOptions) {
      super(player, options);
      // The constructor receives a standard Video.js Player, but then we assert the type
      // of our custom VideoJsPlayer. This is safe because the plugin has been registered
      // at this point.
      this._player = player as VideoJsPlayer;
      this._options = Object.assign({}, defaultOptions, options);
      this.log('initializing Remote Playback plugin...');
      this._initialize();
   }

   public dispose(): void {
      super.dispose();
      this._strategies.forEach((strategy) => {
         strategy.dispose();
      });
      this.log('Remote Playback plugin disposed');
   }

   public getActiveStrategy(): RemotePlaybackStrategy | null {
      return this._activeStrategy;
   }

   public getState(): RemotePlaybackState | null {
      return this._activeStrategy?.getState() ?? null;
   }

   public isConnected(): boolean {
      return this._activeStrategy?.isConnected() || false;
   }

   public get airPlayManager(): AirPlayManager | null {
      return this._strategies.find((s) => { return s instanceof AirPlayManager; }) as AirPlayManager ?? null;
   }

   public get chromecastManager(): ChromecastManager | null {
      return this._strategies.find((s) => { return s instanceof ChromecastManager; }) as ChromecastManager ?? null;
   }

   private _initialize(): void {
      this.log('Initializing Remote Playback plugin...');
      this._player.ready(() => {
         this._strategies = [
            new AirPlayManager(this._player),
            new ChromecastManager(this._player),
         ];

         // Initialize each strategy now that the player is ready and the
         // video element exists in the DOM.
         this._strategies.forEach((s) => { s.initialize(); });

         this.log(LOG_MESSAGES.PLAYER_READY);
         this._addButtonToControlBar();
         this._checkAvailability();
      });
   }

   /**
    * Select the best strategy:
    * 1. Prefer currently connected strategy
    * 2. Otherwise pick first available (priority order)
    */
   private async _selectStrategy(): Promise<void> {
      for (const strategy of this._strategies) {
         if (strategy.isConnected()) {
            this._activeStrategy = strategy;
            return;
         }
      }

      // Otherwise pick first available
      for (const strategy of this._strategies) {
         if (await strategy.isAvailable()) {
            this._activeStrategy = strategy;
            return;
         }
      }

      this._activeStrategy = null;
   }

   private _addButtonToControlBar(): void {
      const controlBar = this._player.getChild(AIRPLAY_COMPONENT_NAMES.CONTROL_BAR);

      if (!controlBar) {
         this.log.error(LOG_MESSAGES.CONTROL_BAR_NOT_FOUND);
         return;
      }

      try {
         const fullscreenToggle = controlBar.getChild(AIRPLAY_COMPONENT_NAMES.FULLSCREEN_TOGGLE),
               children = controlBar.children(),
               fullscreenToggleIndex = fullscreenToggle ? children.indexOf(fullscreenToggle) : -1,
               insertIndex = fullscreenToggleIndex >= 0 ? fullscreenToggleIndex : children.length;

         if (checkClientAirPlaySupport()) {
            const airPlayButton = new AirPlayButton(this._player, { addAirPlayLabelToButton: this._options.addLabelToButton });

            controlBar.addChild(airPlayButton, {}, insertIndex);
            this.log(LOG_MESSAGES.BUTTON_ADDED);
         }

         if (checkClientChromecastSupport()) {
            const chromecastButton = new ChromecastButton(this._player, { addChromecastLabelToButton: this._options.addLabelToButton });

            controlBar.addChild(chromecastButton, {}, insertIndex);
            this.log(LOG_MESSAGES.BUTTON_ADDED);
         }

         this.log(LOG_MESSAGES.BUTTON_CREATED);
      } catch(error) {
         this.log.error('Failed to create or add buttons', error);
      }
   }

   private async _checkAvailability(): Promise<void> {
      try {
         await this._selectStrategy();

         const available = this._activeStrategy !== null;

         this.log('checking remote playback availability...', available);

         this._player.trigger(
            available
               ? EVENTS.REMOTE_PLAYBACK.AVAILABLE
               : EVENTS.REMOTE_PLAYBACK.UNAVAILABLE
         );
      } catch(error) {
         this.log.error('Error checking remote playback availability', error);
      }
   }
}
