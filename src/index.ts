import remotePlayback from './plugin';
import { VideoJs } from './types';

export default function initializePlugin(videojs: VideoJs): void {
   videojs.log('init remote playback plugin');
   remotePlayback(videojs);
}
