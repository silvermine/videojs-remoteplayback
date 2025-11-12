import remotePlayback from './registerPlugin';
import type { VideoJs } from '../@types/videojs';
import { logInfo } from './lib/logging';
import { LOG_MESSAGES } from './constants/log-messages';
import '../styles/airplay.scss';
import '../styles/chromecast.scss';

export default function initializePlugin(videojs: VideoJs): void {
   logInfo(LOG_MESSAGES.PLUGIN_INIT);
   remotePlayback(videojs);
}
