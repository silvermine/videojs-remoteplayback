import videojs from '@silvermine/video.js';
import initializePlugin from '../src/js/index';
import { isPlayerWithRemotePlaybackPlugin } from '../src/js/RemotePlaybackPlugin';
import '@silvermine/video.js/dist/video-js.css';

initializePlugin(videojs);


const player = videojs('remoteplayback-test-player');

if (isPlayerWithRemotePlaybackPlugin(player)) {
   player.remotePlayback();
} else {
   videojs.log.error('Failed to startup Remote Playback plugin.');
}
