import remotePlayback from './registerPlugin';
import type { VideoJs } from './types';
import { logInfo } from './utils';
import { LOG_MESSAGES } from './constants';
import '../styles/airplay.scss';

export default function initializePlugin(videojs: VideoJs): void {
   logInfo(LOG_MESSAGES.PLUGIN_INIT);
   remotePlayback(videojs);
}
