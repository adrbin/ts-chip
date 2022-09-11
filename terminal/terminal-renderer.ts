import { Renderer } from '../lib/ts-chip.js';
import {
  DISPLAY_HEIGHT,
  DISPLAY_WIDTH,
  FRAME_TIME_IN_MS,
  ONE_SECOND_IN_MS,
} from '../lib/constants.js';
import { delay, mod } from '../lib/utils.js';
import { WriteStream } from 'tty';
import { promisify } from 'util';
import { Display } from '../lib/display.js';

export interface TerminalRendererParams {
  output: WriteStream;
  scaleFactor?: number;
  shouldLimitFrame?: boolean;
  shouldDrawFps?: boolean;
}

export class TerminalRenderer implements Renderer {
  output: WriteStream;
  scaleFactor: number;
  shouldLimitFrame: boolean;
  shouldDrawFps: boolean;
  cursorTo: (x: number, y?: number) => Promise<void>;
  clearScreenDown: () => Promise<void>;
  write: (text: string) => Promise<void>;
  rl: any;
  previousDisplay = new Display(DISPLAY_WIDTH, DISPLAY_HEIGHT);
  previousTimestamp = Date.now();
  fpsTimestamp = Date.now();
  fpsCounter = 0;

  constructor({
    output,
    scaleFactor = 2,
    shouldLimitFrame = false,
    shouldDrawFps = false,
  }: TerminalRendererParams) {
    this.output = output;
    this.scaleFactor = scaleFactor;
    this.shouldLimitFrame = shouldLimitFrame;
    this.shouldDrawFps = shouldDrawFps;

    this.cursorTo = promisify(output.cursorTo).bind(output);
    this.clearScreenDown = promisify(output.clearScreenDown).bind(output);
    this.write = promisify(output.write).bind(output);
  }

  async init() {
    await this.cursorTo(0, 0);
    await this.write(`\u001b[49m`);
    await this.clearScreenDown();
  }

  async draw(display: Display) {
    await this.checkDisplaySize(display);
    await this.limitFrame();
    await this.drawDisplay(display);
    await this.drawFps();

    this.previousDisplay = display.copy();
  }

  private async checkDisplaySize(display: Display) {
    if (
      display.width !== this.previousDisplay.width ||
      display.height !== this.previousDisplay.height
    ) {
      this.previousDisplay = new Display(display.width, display.height);
      await this.init();
    }
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

  private async drawDisplay(display: Display) {
    const toWrite = ' '.repeat(this.scaleFactor);

    const diff = display.display.diff(this.previousDisplay.display);

    for (const index of diff) {
      const x = display.getX(index) * this.scaleFactor;
      const y = display.getY(index);
      await this.cursorTo(x, y);

      if (display.display.get(index) === 1) {
        await this.write(`\u001b[107m${toWrite}`);
      } else {
        await this.write(`\u001b[49m${toWrite}`);
      }
    }
  }

  private async drawFps() {
    if (!this.shouldDrawFps) {
      return;
    }

    this.fpsCounter++;

    const now = Date.now();
    const timeDifference = now - this.fpsTimestamp;

    if (timeDifference < ONE_SECOND_IN_MS) {
      return;
    }

    await this.cursorTo(0, 0);
    await this.write(`\u001b[107m${this.formattedFpsCounter}FPS`);
    this.fpsTimestamp = now;
    this.fpsCounter = 0;
  }

  private get formattedFpsCounter() {
    return this.fpsCounter.toString().padStart(3, ' ');
  }
}
