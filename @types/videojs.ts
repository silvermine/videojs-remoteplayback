import videojs from '@silvermine/video.js';
import type { RemotePlaybackPlugin } from '../src/js/RemotePlaybackPlugin';
import { RemotePlaybackPluginOptions } from './remote-playback';

export type VideoJs = typeof videojs;

export interface VideoJsPlayer extends videojs.Player {
   remotePlayback(options?: Partial<RemotePlaybackPluginOptions>): RemotePlaybackPlugin;
}
