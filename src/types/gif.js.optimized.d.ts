declare module 'gif.js.optimized' {
    export default class GIF {
      constructor(options?: {
        workers?: number;
        quality?: number;
      });
      addFrame(image: HTMLImageElement | HTMLCanvasElement, options?: { delay?: number }): void;
      render(callback?: () => void): void;
    }
  }
  