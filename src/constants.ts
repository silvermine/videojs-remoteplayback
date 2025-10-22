export const PLUGIN_NAME = 'remotePlayback';


export const EVENTS = {
   REMOTE_PLAYBACK: {
      AVAILABLE: 'remoteplayback:available',
      UNAVAILABLE: 'remoteplayback:unavailable',
   },
   AIRPLAY: {
      AVAILABILITY_CHANGE: 'airplay:availabilitychange',
      CONNECTING: 'airplay:connecting',
      CONNECTED: 'airplay:connected',
      DISCONNECTED: 'airplay:disconnected',
   },
} as const;

export const ARIA_ATTRIBUTES = {
   HIDDEN: 'aria-hidden',
   LIVE: 'aria-live',
} as const;

export const AVAILABILITY_STATES = {
   AVAILABLE: 'available',
   NOT_AVAILABLE: 'not-available',
} as const;

export const LOG_MESSAGES = {
   PLUGIN_INIT: 'Remote playback plugin initialized',
   BUTTON_CREATED: 'AirPlay button created successfully',
   BUTTON_ADDED: 'AirPlay button added to control bar',
   PLAYER_READY: 'Player ready, adding AirPlay button',
   API_NOT_SUPPORTED: 'Remote Playback API not supported',
   AIRPLAY_NOT_SUPPORTED: 'AirPlay not supported on this device',
   AIRPLAY_SUPPORTED: 'AirPlay support detected',
   WEBKIT_AIRPLAY_SUPPORTED: 'WebKit AirPlay API supported - full device compatibility',
   WEBKIT_AIRPLAY_PREFERRED: 'Using WebKit AirPlay API for full device list',
   CONTROL_BAR_NOT_FOUND: 'Control bar not found',
   PICKER_OPENED: 'Remote playback picker opened successfully',
} as const;
