import videojs from '@silvermine/video.js';

export function logError(message: string, error?: unknown): void {
   videojs.log(`ERROR: ${message}`, error);
}

export function logInfo(message: string): void {
   videojs.log(message);
}
