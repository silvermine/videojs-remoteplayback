import { vi } from 'vitest';
import { VideoJs } from '../../@types/videojs';

export const mockVideoJs: VideoJs = {
   log: vi.fn(),
   registerPlugin: vi.fn(),
   getPlugin: vi.fn(),
} as unknown as VideoJs;
