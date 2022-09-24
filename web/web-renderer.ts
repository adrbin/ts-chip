import { Renderer } from '../lib/vm-runner.js';
import {
  DISPLAY_HEIGHT,
  DISPLAY_WIDTH,
  FRAME_TIME_IN_MS,
  ONE_SECOND_IN_MS,
} from '../lib/constants.js';
import { Display } from '../lib/display.js';
import { delay } from '../lib/utils.js';

export interface WebRendererParams {
  canvas: HTMLCanvasElement;
  shouldLimitFrame?: boolean;
  shouldDrawFps?: boolean;
  fpsText?: HTMLElement;
}

export class WebRenderer implements Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  shouldLimitFrame: boolean;
  shouldDrawFps: boolean;
  fpsText?: HTMLElement;
  previousDisplay = new Display(DISPLAY_WIDTH, DISPLAY_HEIGHT);
  previousTimestamp = Date.now();
  fpsTimestamp = Date.now();
  fpsCounter = 0;
  shouldRedraw = false;

  constructor({
    canvas,
    shouldLimitFrame = false,
    shouldDrawFps = false,
    fpsText = undefined,
  }: WebRendererParams) {
    window.addEventListener('resize', () => (this.shouldRedraw = true));
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas is uninitialized.');
    }
    this.ctx = ctx;

    this.shouldLimitFrame = shouldLimitFrame;
    this.shouldDrawFps = shouldDrawFps;
    if (shouldDrawFps && !fpsText) {
      throw new Error(
        'shouldDrawFps has been set to true so fpsText also needs to be provided.',
      );
    }
    this.fpsText = fpsText;
  }

  init() {
    this.shouldRedraw = true;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async draw(display: Display) {
    await this.limitFrame();
    this.checkDisplaySize(display);
    this.drawDisplay(display);
    this.drawFps();

    this.previousDisplay = display.copy();
  }

  private async limitFrame() {
    if (!this.shouldLimitFrame) {
      return;
    }

    const timeDifference = Date.now() - this.previousTimestamp;
    if (timeDifference < FRAME_TIME_IN_MS) {
      await delay(FRAME_TIME_IN_MS - timeDifference);
    }
    this.previousTimestamp = Date.now();
  }

  private checkDisplaySize(display: Display) {
    if (
      this.shouldRedraw ||
      display.width !== this.previousDisplay.width ||
      display.height !== this.previousDisplay.height
    ) {
      this.previousDisplay = new Display(display.width, display.height);
      this.init();
      this.shouldRedraw = false;
    }
  }

  private drawDisplay(display: Display) {
    const diff = display.display.diff(this.previousDisplay.display);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const dx = Math.floor(width / display.width);
    const dy = Math.floor(height / display.height);

    for (const index of diff) {
      const x = display.getX(index);
      const y = display.getY(index);

      this.ctx.fillStyle = display.display.get(index) === 1 ? 'black' : 'white';

      this.ctx.fillRect(x * dx, y * dy, dx, dy);
    }
  }

  private drawFps() {
    if (!this.shouldDrawFps) {
      return;
    }

    this.fpsCounter++;

    const now = Date.now();
    const timeDifference = now - this.fpsTimestamp;

    if (timeDifference < ONE_SECOND_IN_MS) {
      return;
    }

    this.fpsText!.textContent = this.formattedFpsCounter;

    this.fpsTimestamp = now;
    this.fpsCounter = 0;
  }

  private get formattedFpsCounter() {
    return this.fpsCounter.toString().padStart(3, '0');
  }
}
