import { hasRemotePlaybackSupport } from '../../../lib/hasRemotePlaybackSupport';
import { hasGoogleCastSupport } from './hasGoogleCastSupport';

export function isChromecastAvailable(): boolean {
   return hasRemotePlaybackSupport() || hasGoogleCastSupport();
}
