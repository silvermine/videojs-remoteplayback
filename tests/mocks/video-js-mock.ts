import { vi } from 'vitest';
import type { VideoJs } from '../../@types/videojs';

export class MockButton {
   // These properties are used by the tests to verify that the button
   // is configured and disposed correctly.
   public _controlText = '';
   public _superDisposed = false;
   private _el: HTMLButtonElement;

   public constructor() {
      this._el = document.createElement('button');
   }

   public el(): HTMLButtonElement {
      return this._el;
   }

   public addClass(className: string): void {
      this._el.classList.add(className);
   }

   public removeClass(className: string): void {
      this._el.classList.remove(className);
   }

   public show(): void {
      this._el.classList.remove('vjs-hidden');
   }

   public hide(): void {
      this._el.classList.add('vjs-hidden');
   }

   public controlText(text: string): void {
      this._controlText = text;
   }

   public buildCSSClass(): string {
      return 'vjs-control';
   }

   public dispose(): void {
      this._superDisposed = true;
   }
}

vi.mock('@silvermine/video.js', () => {
   class MockPlugin {
      public readonly log: ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> };

      public constructor() {
         this.log = vi.fn() as MockPlugin['log'];
         this.log.error = vi.fn();
      }
   }

   const getComponent = vi.fn((name: string) => {
      if (name === 'Button') {
         return MockButton;
      }

      return undefined;
   });

   const getPlugin = vi.fn((name: string) => {
      if (name === 'plugin') {
         return MockPlugin;
      }

      return undefined;
   });

   return {
      default: {
         VERSION: 'test-videojs-version',
         log: vi.fn(),
         registerPlugin: vi.fn(),
         getPlugin,
         getComponent,
      } as unknown as VideoJs,
   };
});
