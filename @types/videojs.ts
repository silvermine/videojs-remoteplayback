import videojs from '@silvermine/video.js';
import type { VideoJsPlayer as VjsPlayer } from 'video.js';
import type { AirPlayManager } from '../src/js/airplay/interfaces/Airplay.interfaces';
import type { RemotePlaybackPlugin } from '../src/RemotePlaybackPlugin';
import type { ChromecastManager } from '../src/js/chromecast/ChromecastManager';

export type VideoJs = typeof videojs;

export interface VideoJsPlayer extends VjsPlayer {
   airPlay?: AirPlayManager;
   remotePlayback?: RemotePlaybackPlugin;
   chromecast?: ChromecastManager;
}

/**
 * Video.js Button component interface
 */
export interface VideoJsButton {
   el(): Element;
   show(): void;
   hide(): void;
   addClass(className: string): void;
   removeClass(className: string): void;
   controlText(text?: string): string | void;
   localize(text: string): string;
   on(event: string, callback: () => void): void;
   buildCSSClass(): string;
}

/**
 * Video.js Button constructor interface
 */
export interface VideoJsButtonConstructor {
   new (player: VideoJsPlayer, options?: Record<string, unknown>): VideoJsButton;
}
