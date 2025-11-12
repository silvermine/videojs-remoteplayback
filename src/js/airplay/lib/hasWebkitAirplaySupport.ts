export function hasWebKitAirPlaySupport(): boolean {
   return typeof window !== 'undefined' &&
          'WebKitPlaybackTargetAvailabilityEvent' in window;
}
