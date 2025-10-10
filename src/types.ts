import videojs from '@silvermine/video.js';
import type { VideoJsPlayer as VjsPlayer } from 'video.js';
import { AirPlayManager } from './airplay/Airplay.interfaces';

export type VideoJs = typeof videojs;

export type RemotePlaybackState = 'connecting' | 'connected' | 'disconnected';

export interface VideoJsPlayer extends VjsPlayer {
   airPlay?: AirPlayManager;
   remotePlayback?: RemotePlaybackPlugin;
}

export interface RemotePlaybackAvailabilityEvent extends Event {
   availability: 'available' | 'not-available';
}

export interface RemotePlaybackPlugin {
   getState(): RemotePlaybackState | null;
   isConnected(): boolean;
}

export interface WebKitPlaybackTargetAvailabilityEvent extends Event {
   availability: 'available' | 'not-available';
}

export interface HTMLVideoElementWithAirPlay extends HTMLVideoElement {
   webkitCurrentPlaybackTargetIsWireless: boolean;
   webkitShowPlaybackTargetPicker(): void;
}
