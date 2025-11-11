import type { RemotePlaybackState } from '../@types/remote-playback';
import type { VideoJsPlayer } from '../@types/videojs';
import { AirPlayManager, AirPlayButton } from './js/airplay/AirPlayManager';
import { logError, logInfo } from './lib/logging';
import { COMPONENT_NAMES } from './js/airplay/constants/component-names';
import { EVENTS } from './constants/remote-playback';
import { LOG_MESSAGES } from './constants/log-messages';

class RemotePlaybackPlugin {
   private readonly _player: VideoJsPlayer;
   private readonly _airPlayManager: AirPlayManager;
   private readonly _chromecastManager: ChromecastManager;

   public constructor(player: VideoJsPlayer) {
      this._player = player;
      this._airPlayManager = new AirPlayManager(player);
      this._chromecastManager = new ChromecastManager(player);

      this._player.airPlay = this._airPlayManager;
      this._player.chromecast = this._chromecastManager;

      this._initialize();
   }

   public getState(): RemotePlaybackState | null {
      return this._airPlayManager.getState();
   }

   public isConnected(): boolean {
      return this._airPlayManager.isConnected();
   }

   private _initialize(): void {
      this._addRemotePlaybackButtons();
      this._checkAvailability();
   }

   private _addRemotePlaybackButtons(): void {
      logInfo('Initializing remote playback buttons...');

      this._player.ready(() => {
         logInfo(LOG_MESSAGES.PLAYER_READY);
         this._addButtonsToControlBar();
      });
   }

   private _addButtonsToControlBar(): void {
      const controlBar = this._player.getChild(COMPONENT_NAMES.CONTROL_BAR);

      if (!controlBar) {
         logError(LOG_MESSAGES.CONTROL_BAR_NOT_FOUND);
         return;
      }

      // Add AirPlay button
      try {
         const airPlayButton = new AirPlayButton(this._player, { addAirPlayLabelToButton: false });

         logInfo('AirPlay button created successfully');
         this._insertButtonInControlBar(controlBar, airPlayButton);
         logInfo('AirPlay button added to control bar');
      } catch(error) {
         logError('Failed to create or add AirPlay button', error);
      }

      // Add Chromecast button
      try {
         const chromecastButton = new ChromecastButton(this._player, { addChromecastLabelToButton: false });

         logInfo('Chromecast button created successfully');
         this._insertButtonInControlBar(controlBar, chromecastButton);
         logInfo('Chromecast button added to control bar');
      } catch(error) {
         logError('Failed to create or add Chromecast button', error);
      }
   }

   private _insertButtonInControlBar(controlBar: unknown, button: AirPlayButton | ChromecastButton): void {
      const fullscreenToggle = (controlBar as { getChild: (name: string) => unknown }).getChild(COMPONENT_NAMES.FULLSCREEN_TOGGLE);

      if (fullscreenToggle) {
         const children = (controlBar as { children: () => unknown[] }).children();

         const insertIndex = children.indexOf(fullscreenToggle);

         (controlBar as { addChild: (component: unknown, options?: Record<string, unknown>, index?: number) => void })
            .addChild(button, {}, insertIndex);
      } else {
         (controlBar as { addChild: (component: unknown) => void }).addChild(button);
      }
   }

   private async _checkAvailability(): Promise<void> {
      try {
         const airPlayAvailable = await this._airPlayManager.isAvailable();

         const chromecastAvailable = await this._chromecastManager.isAvailable();

         if (airPlayAvailable || chromecastAvailable) {
            this._player.trigger(EVENTS.REMOTE_PLAYBACK.AVAILABLE);
         } else {
            this._player.trigger(EVENTS.REMOTE_PLAYBACK.UNAVAILABLE);
         }
      } catch(error) {
         logError('Error checking remote playback availability', error);
      }
   }
}

export { RemotePlaybackPlugin };
