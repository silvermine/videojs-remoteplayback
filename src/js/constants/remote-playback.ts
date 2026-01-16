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

export const AVAILABILITY_STATES = {
   AVAILABLE: 'available',
   NOT_AVAILABLE: 'not-available',
} as const;
