/**
 * Checks if the current client supports Remote Playback API.
 */
export function checkClientSupport(): boolean {
   return typeof window !== 'undefined' &&
      'HTMLVideoElement' in window &&
      'remote' in HTMLVideoElement.prototype;
}

/**
 * Checks if the current client supports AirPlay functionality.
 */
export function checkClientSupportWithAirPlay(): boolean {
   return typeof window !== 'undefined' &&
      'HTMLVideoElement' in window &&
      'WebKitPlaybackTargetAvailabilityEvent' in window;
}
