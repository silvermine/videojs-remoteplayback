import type { VideoJs } from '../../@types/videojs';
import { RemotePlaybackPlugin } from './RemotePlaybackPlugin';
import '../styles/airplay.scss';
import '../styles/chromecast.scss';

// Receives a video.js instance and registers the plugin
export default function initializePlugin(videojs: VideoJs): void {
   videojs.registerPlugin('remotePlayback', RemotePlaybackPlugin);
   videojs.log('Remote Playback plugin initialized');
}

export * from './RemotePlaybackPlugin';
export * from './airplay/AirPlayButton';
export * from './airplay/AirPlayManager';
export * from './chromecast/ChromecastButton';
export * from './chromecast/ChromecastManager';
export type { RemotePlaybackPluginOptions } from '../../@types/remote-playback';
