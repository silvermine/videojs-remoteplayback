import { isChromeBrowser } from './isChromeBrowser';

export function hasChromecastSupport(): boolean {
   return typeof window !== 'undefined' &&
          'HTMLVideoElement' in window &&
          'remote' in HTMLVideoElement.prototype &&
          isChromeBrowser();
}
