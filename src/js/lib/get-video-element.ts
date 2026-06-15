import type { VideoJsPlayer } from '../../../@types/videojs';

export interface HTMLVideoElementWithAirPlay extends HTMLVideoElement {
   webkitCurrentPlaybackTargetIsWireless: boolean;
   webkitShowPlaybackTargetPicker(): void;
}

/**
 * Type guard to check if a given element is an HTMLVideoElement that supports
 * RemotePlayback API.
 */
export function isVideoElement(el: unknown): el is HTMLVideoElement {
   return !!el &&
      el instanceof HTMLVideoElement &&
      'remote' in el;
}

/**
 * Retrieves the video element from a Video.js player, if it supports RemotePlayback API.
 */
export function getVideoElement(player: VideoJsPlayer): HTMLVideoElement | null {
   const videoEl = player.el().querySelector('video');

   if (isVideoElement(videoEl)) {
      return videoEl;
   }

   return null;
}

/**
 * Type guard to check if a given element is an HTMLVideoElement that supports AirPlay.
 */
export function isVideoElementWithAirPlay(el: unknown): el is HTMLVideoElementWithAirPlay {
   return !!el &&
      el instanceof HTMLVideoElement &&
      'webkitShowPlaybackTargetPicker' in el &&
      'webkitCurrentPlaybackTargetIsWireless' in el;
}

/**
 * Retrieves the video element from a Video.js player, if it supports AirPlay.
 */
export function getVideoElementWithAirPlay(player: VideoJsPlayer): HTMLVideoElementWithAirPlay | null {
   const videoEl = player.el().querySelector('video');

   if (isVideoElementWithAirPlay(videoEl)) {
      return videoEl;
   }

   return null;
}
