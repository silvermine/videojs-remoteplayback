export function hasGoogleCastSupport(): boolean {
   return typeof window !== 'undefined' &&
          'chrome' in window &&
          'cast' in (window as any).chrome;
}
