export type RemotePlaybackState = 'connecting' | 'connected' | 'disconnected';

export interface RemotePlaybackAvailabilityEvent extends Event {
   availability: 'available' | 'not-available';
}

export interface RemotePlaybackPluginOptions {
   addLabelToButton?: boolean;
}

export interface WebKitPlaybackTargetAvailabilityEvent extends Event {
   availability: 'available' | 'not-available';
}

export interface HTMLVideoElementWithAirPlay extends HTMLVideoElement {
   webkitCurrentPlaybackTargetIsWireless: boolean;
   webkitShowPlaybackTargetPicker(): void;
}
