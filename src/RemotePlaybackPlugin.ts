import type { VideoJsPlayer, RemotePlaybackState } from './types';
import { AirPlayManager, AirPlayButton } from './airplay/AirPlayManager';
import { logInfo, logError } from './utils';
import { COMPONENT_NAMES, EVENTS, LOG_MESSAGES } from './constants';

class RemotePlaybackPlugin {
   private readonly _player: VideoJsPlayer;
   private readonly _airPlayManager: AirPlayManager;

   public constructor(player: VideoJsPlayer) {
      this._player = player;
      this._airPlayManager = new AirPlayManager(player);

      this._player.airPlay = this._airPlayManager;

      this._initialize();
   }

   public getState(): RemotePlaybackState | null {
      return this._airPlayManager.getState();
   }

   public isConnected(): boolean {
      return this._airPlayManager.isConnected();
   }

   private _initialize(): void {
      this._addAirPlayButton();
      this._checkAvailability();
   }

   private _addAirPlayButton(): void {
      logInfo('Initializing AirPlay button...');

      this._player.ready(() => {
         logInfo(LOG_MESSAGES.PLAYER_READY);
         this._addButtonToControlBar();
      });
   }

   private _addButtonToControlBar(): void {
      const controlBar = this._player.getChild(COMPONENT_NAMES.CONTROL_BAR);

      if (!controlBar) {
         logError(LOG_MESSAGES.CONTROL_BAR_NOT_FOUND);
         return;
      }

      try {
         const airPlayButton = new AirPlayButton(this._player, { addAirPlayLabelToButton: true });

         logInfo(LOG_MESSAGES.BUTTON_CREATED);

         this._insertButtonInControlBar(controlBar, airPlayButton);
         logInfo(LOG_MESSAGES.BUTTON_ADDED);
      } catch(error) {
         logError('Failed to create or add AirPlay button', error);
      }
   }

   private _insertButtonInControlBar(controlBar: unknown, airPlayButton: AirPlayButton): void {
      const fullscreenToggle = (controlBar as { getChild: (name: string) => unknown }).getChild(COMPONENT_NAMES.FULLSCREEN_TOGGLE);

      if (fullscreenToggle) {
         const children = (controlBar as { children: () => unknown[] }).children();

         const insertIndex = children.indexOf(fullscreenToggle);

         (controlBar as { addChild: (component: unknown, options?: Record<string, unknown>, index?: number) => void })
            .addChild(airPlayButton, {}, insertIndex);
      } else {
         (controlBar as { addChild: (component: unknown) => void }).addChild(airPlayButton);
      }
   }

   private async _checkAvailability(): Promise<void> {
      try {
         const available = await this._airPlayManager.isAvailable();

         if (available) {
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
