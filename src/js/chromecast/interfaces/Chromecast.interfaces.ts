export interface ControlBarChild {
   name(): string;
   addChild(component: unknown, options?: Record<string, unknown>, index?: number): void;
   getChild(name: string): unknown;
   children(): unknown[];
}

export interface ChromecastManager {
   isAvailable(): Promise<boolean>;
   getState(): RemotePlaybackState | null;
   isConnected(): boolean;
   prompt(): Promise<void>;
}

export interface ChromecastButtonOptions extends Record<string, unknown> {
   addChromecastLabelToButton?: boolean;
}

export type RemotePlaybackState = 'connecting' | 'connected' | 'disconnected';
