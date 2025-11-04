import type { VideoJsPlayer } from '../../@types/videojs';

export function getMediaElement(player: VideoJsPlayer): HTMLVideoElement | HTMLAudioElement | null {
   const playerEl = player.el();

   return playerEl.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement | null;
}
