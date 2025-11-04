export function hasRemotePlaybackSupport(): boolean {
   return typeof window !== 'undefined' &&
          'HTMLVideoElement' in window &&
          'remote' in HTMLVideoElement.prototype;
}
