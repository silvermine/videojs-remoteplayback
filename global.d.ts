import type { RemotePlaybackState, WebKitPlaybackTargetAvailabilityEvent } from './src/types';

interface RemotePlayback extends EventTarget {
   readonly state: RemotePlaybackState;
   watchAvailability(callback: (available: boolean) => void): Promise<number>;
   cancelWatchAvailability(id?: number): Promise<void>;
   prompt(): Promise<void>;
}

interface HTMLVideoElement {
   readonly remote?: RemotePlayback;
}

declare global {
   interface Window {
      WebKitPlaybackTargetAvailabilityEvent?: {
         prototype: WebKitPlaybackTargetAvailabilityEvent;
         new(type: string, eventInitDict?: EventInit): WebKitPlaybackTargetAvailabilityEvent;
      };
   }
}
