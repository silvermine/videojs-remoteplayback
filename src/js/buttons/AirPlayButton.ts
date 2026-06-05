import type { RemotePlaybackStrategy } from '../RemotePlaybackPlugin';
import { BaseButton, BaseButtonOptions } from './BaseButton';

// DEFAULTS

export const defaultAirPlayButtonOptions: BaseButtonOptions = {
   addLabelToButton: true,
   label: 'AirPlay',
};

export class AirPlayButton extends BaseButton {

   public constructor(manager: RemotePlaybackStrategy, options: Partial<BaseButtonOptions> = {}) {
      super(manager, Object.assign({}, defaultAirPlayButtonOptions, options));
   }

   public buildCSSClass(): string {
      return `airplay ${super.buildCSSClass()}`;
   }

}
