import type { RemotePlaybackPluginOptions, RemotePlaybackState } from '../../@types/remote-playback';
import type { VideoJsPlayer } from '../../@types/videojs';
import { AirPlayManager, AirPlayButton } from './airplay/AirPlayManager';
import videojs from '@silvermine/video.js';
import { LOG_MESSAGES } from './constants/log-messages';
import { COMPONENT_NAMES } from './airplay/AirPlayButton';
import { EVENTS } from './constants/remote-playback';

const Plugin = videojs.getPlugin('plugin');

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

const defaultOptions: RemotePlaybackPluginOptions = {
   addAirPlayLabelToButton: true,
};

export class RemotePlaybackPlugin extends Plugin {

   public readonly log!: videojs.Log;

   private readonly _player: VideoJsPlayer;
   private readonly _airPlayManager: AirPlayManager;
   private readonly _options: RemotePlaybackPluginOptions;

   public constructor(player: videojs.Player, options?: RemotePlaybackPluginOptions) {
      super(player, options);
      // The constructor receives a standard Video.js Player, but then we assert the type
      // of our custom VideoJsPlayer. This is safe because the plugin has been registered
      // at this point.
      this._player = player as VideoJsPlayer;
      this._airPlayManager = new AirPlayManager(this._player);
      this.log('initializing Remote Playback plugin...');

      // Store options for later use
      this._options = Object.assign({}, defaultOptions, options);

      this._initialize();
   }

   public dispose(): void {
      super.dispose();
      this.log('Remote Playback plugin disposed');
   }

   public get airPlayManager(): AirPlayManager {
      return this._airPlayManager;
   }

   public getState(): RemotePlaybackState | null {
      return this._airPlayManager.getState();
   }

   public isConnected(): boolean {
      return this._airPlayManager.isConnected();
   }

   private _initialize(): void {
      this.log('Initializing Remote Playback plugin...');
      this._player.ready(() => {
         this.log(LOG_MESSAGES.PLAYER_READY);
         this._addButtonToControlBar();
      });
      this._checkAvailability();
   }

   private _addButtonToControlBar(): void {
      const controlBar = this._player.getChild(COMPONENT_NAMES.CONTROL_BAR);

      if (!controlBar) {
         this.log.error(LOG_MESSAGES.CONTROL_BAR_NOT_FOUND);
         return;
      }

      try {
         const airPlayButton = new AirPlayButton(this._player, { addAirPlayLabelToButton: this._options.addAirPlayLabelToButton });

         this.log(LOG_MESSAGES.BUTTON_CREATED);

         const fullscreenToggle = controlBar.getChild(COMPONENT_NAMES.FULLSCREEN_TOGGLE);

         if (fullscreenToggle) {
            const children = controlBar.children(),
                  fullscreenToggleIndex = children.indexOf(fullscreenToggle),
                  insertIndex = fullscreenToggleIndex >= 0 ? fullscreenToggleIndex : children.length;

            controlBar.addChild(airPlayButton, {}, insertIndex);
         } else {
            controlBar.addChild(airPlayButton);
         }

         this.log(LOG_MESSAGES.BUTTON_ADDED);
      } catch(error) {
         this.log.error('Failed to create or add AirPlay button', error);
      }
   }

   private async _checkAvailability(): Promise<void> {
      try {
         const available = await this._airPlayManager.isAirPlayAvailable();

         this.log('checking remote playback availability...', available);

         if (available) {
            this._player.trigger(EVENTS.REMOTE_PLAYBACK.AVAILABLE);
         } else {
            this._player.trigger(EVENTS.REMOTE_PLAYBACK.UNAVAILABLE);
         }
      } catch(error) {
         this.log.error('Error checking remote playback availability', error);
      }
   }
}
