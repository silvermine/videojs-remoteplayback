export function hasRemotePlaybackSupport(): boolean {
   return typeof window !== 'undefined' &&
          'HTMLVideoElement' in window &&
          'remote' in HTMLVideoElement.prototype;
}

export function hasAirPlaySupport(): boolean {
   return typeof window !== 'undefined' &&
          'HTMLVideoElement' in window &&
          'webkitShowPlaybackTargetPicker' in HTMLVideoElement.prototype;
}

export function hasWebKitAirPlaySupport(): boolean {
   return typeof window !== 'undefined' &&
          'WebKitPlaybackTargetAvailabilityEvent' in window;
}
