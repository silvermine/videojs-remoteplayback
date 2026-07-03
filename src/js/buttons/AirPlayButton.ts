import type { VideoJsPlayer } from '../../../@types/videojs';
import { BaseButton, BaseButtonOptions } from './BaseButton';

// DEFAULTS

export const defaultAirPlayButtonOptions: BaseButtonOptions = {
   addLabelToButton: true,
   label: 'AirPlay',
};

export class AirPlayButton extends BaseButton {

   public constructor(player: VideoJsPlayer, options: Partial<BaseButtonOptions> = {}) {
      super(player, Object.assign({}, defaultAirPlayButtonOptions, options));
   }

   public buildCSSClass(): string {
      return `airplay ${super.buildCSSClass()}`;
   }

}
