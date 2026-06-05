import type { VideoJs } from '../../@types/videojs';
import { RemotePlaybackPlugin } from './RemotePlaybackPlugin';
import '../styles/index.scss';

// Receives a video.js instance and registers the plugin
export default function initializePlugin(videojs: VideoJs): void {
   videojs.registerPlugin('remotePlayback', RemotePlaybackPlugin);
   videojs.log(`Remote Playback plugin registered with video.js version ${videojs.VERSION}.`);
}

export * from './RemotePlaybackPlugin';
export * from './strategies/AirPlayManager';
export * from './strategies/RemotePlaybackManager';
