import videojs from '@silvermine/video.js';
import type { VideoJsPlayer } from './types';

export function getMediaElement(player: VideoJsPlayer): HTMLVideoElement | HTMLAudioElement | null {
   const playerEl = player.el();

   return playerEl.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement | null;
}

export function logError(message: string, error?: unknown): void {
   videojs.log(`ERROR: ${message}`, error);
}

export function logInfo(message: string): void {
   videojs.log(message);
}

export function safelyExecute<T>(
   operation: () => T,
   errorMessage: string,
   fallbackValue?: T
): T | undefined {
   try {
      return operation();
   } catch(error) {
      logError(errorMessage, error);
      return fallbackValue;
   }
}

export async function safelyExecuteAsync<T>(
   operation: () => Promise<T>,
   errorMessage: string,
   fallbackValue?: T
): Promise<T | undefined> {
   try {
      return await operation();
   } catch(error) {
      logError(errorMessage, error);
      return fallbackValue;
   }
}
