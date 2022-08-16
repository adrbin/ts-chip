import { Renderer } from '../chip-ts.js';
import {
  DISPLAY_HEIGHT,
  DISPLAY_WIDTH,
  FRAME_TIME_IN_MS,
} from '../constants.js';
import { delay, mod } from '../utils.js';
import { WriteStream } from 'tty';
import { promisify } from 'util';
import { createDisplay, Display } from '../display.js';
import { BitArray } from '../bit-array.js';

export interface TerminalRendererParams {
  output: WriteStream;
  scaleFactor?: number;
  shouldLimitFrame?: boolean;
}

export class TerminalRenderer implements Renderer {
  output: WriteStream;
  scaleFactor: number;
  shouldLimitFrame: boolean;
  cursorTo: (x: number, y?: number) => Promise<void>;
  clearScreenDown: () => Promise<void>;
  write: (text: string) => Promise<void>;
  rl: any;
  previousDisplay = createDisplay(DISPLAY_WIDTH, DISPLAY_HEIGHT);
  previousTimestamp = Date.now();

  constructor({
    output,
    scaleFactor = 2,
    shouldLimitFrame = true,
  }: TerminalRendererParams) {
    this.output = output;
    this.scaleFactor = scaleFactor;
    this.shouldLimitFrame = shouldLimitFrame;
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

    const diff = display.display.diff(this.previousDisplay.display);
    if (diff.length === 0) {
      return;
    }

    await this.limitFrame();

    await this.drawToScreen(display, diff);

    this.previousDisplay = {
      ...display,
      display: BitArray.copy(display.display),
    };
  }

  private async checkDisplaySize(display: Display) {
    if (
      display.width !== this.previousDisplay.width ||
      display.height !== this.previousDisplay.height
    ) {
      this.previousDisplay = createDisplay(display.width, display.height);
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

  private async drawToScreen(display: Display, diff: number[]) {
    const toWrite = ' '.repeat(this.scaleFactor);

    let previousIndex = NaN;
    for (const index of diff) {
      const value = display.display.get(index);

      if (index !== previousIndex + 1) {
        const x = mod(index, display.width) * this.scaleFactor;
        const y = Math.floor(index / display.width);
        await this.cursorTo(x, y);
      } else if (display.display.get(previousIndex) === value) {
        await this.write(toWrite);
        continue;
      }

      if (display.display.get(index) === 1) {
        await this.write(`\u001b[107m${toWrite}`);
      } else {
        await this.write(`\u001b[49m${toWrite}`);
      }
      previousIndex = index;
    }
  }
}
