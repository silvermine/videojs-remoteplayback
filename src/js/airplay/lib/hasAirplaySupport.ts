export function hasAirPlaySupport(): boolean {
   return typeof window !== 'undefined' &&
          'HTMLVideoElement' in window &&
          'webkitShowPlaybackTargetPicker' in HTMLVideoElement.prototype;
}
