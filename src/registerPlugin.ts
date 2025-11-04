import type { VideoJs, VideoJsPlayer } from '../@types/videojs';
import { RemotePlaybackPlugin } from './RemotePlaybackPlugin';
import { PLUGIN_NAME } from './constants/plugin-name';

export default function registerPlugin(videojs: VideoJs): void {
   videojs.registerPlugin(PLUGIN_NAME, function(this: VideoJsPlayer) {
      const plugin = new RemotePlaybackPlugin(this);

      this.remotePlayback = plugin;
   });

   videojs.hook('setup', function(player: VideoJsPlayer & { remotePlayback?: () => void }) {
      player.ready(() => {
         if (typeof player.remotePlayback === 'function') {
            player.remotePlayback();
         }
      });
   });
}

export { RemotePlaybackPlugin };
