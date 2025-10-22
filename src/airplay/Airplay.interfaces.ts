export interface ControlBarChild {
   name(): string;
   addChild(component: unknown, options?: Record<string, unknown>, index?: number): void;
   getChild(name: string): unknown;
   children(): unknown[];
}

export interface AirPlayManager {
   isAvailable(): Promise<boolean>;
   getState(): RemotePlaybackState | null;
   isConnected(): boolean;
   prompt(): Promise<void>;
}

export interface AirPlayButtonOptions extends Record<string, unknown> {
   addAirPlayLabelToButton?: boolean;
}
