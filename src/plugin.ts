import type { VideoJs } from './types';

/**
 * Main plugin function to initialize remote playback
 *
 * @param videojs - Video.js constructor
 * @return void
 */
export default function remotePlayback(videojs: VideoJs): void {
   videojs.registerPlugin('remotePlayback', function() {
      videojs.log('RemotePlaybackPlugin registered');
   });
}
