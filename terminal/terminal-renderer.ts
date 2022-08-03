import { BitArray } from '../bit-array';
import { Renderer } from '../chip-ts';
import { DISPLAY_SIZE, DISPLAY_WIDTH, FRAME_TIME_IN_MS } from '../constants';
import { delay, mod } from '../utils';
import { WriteStream } from 'tty';
import { promisify } from 'util';

export class TerminalRenderer implements Renderer {
  output: WriteStream;
  cursorTo: (x: number, y?: number) => Promise<void>;
  clearScreenDown: () => Promise<void>;
  write: (text: string) => Promise<void>;
  rl: any;
  previousArray = new BitArray(DISPLAY_SIZE);
  previousTimestamp = Date.now();

  constructor(output: WriteStream) {
    this.output = output;
    this.cursorTo = promisify(output.cursorTo).bind(output);
    this.clearScreenDown = promisify(output.clearScreenDown).bind(output);
    this.write = promisify(output.write).bind(output);
  }

  async init() {
    await this.cursorTo(0, 0);
    await this.clearScreenDown();
  }

  async draw(bitArray: BitArray) {
    const diff = this.previousArray.diff(bitArray);
    if (diff.length === 0) {
      return;
    }

    const timeDifference = Date.now() - this.previousTimestamp;
    if (timeDifference < FRAME_TIME_IN_MS) {
      await delay(FRAME_TIME_IN_MS - timeDifference);
    }
    this.previousTimestamp = Date.now();

    let previousIndex = NaN;
    for (const index of diff) {
      if (index !== previousIndex + 1) {
        const x = mod(index, DISPLAY_WIDTH) * 2;
        const y = Math.floor(index / DISPLAY_WIDTH);
        await this.cursorTo(x, y);
      }

      if (bitArray.get(index) === 1) {
        await this.write('\u001b[107m  ');
      } else {
        await this.write('\u001b[49m  ');
      }
      previousIndex = index;
    }
    this.previousArray = new BitArray(DISPLAY_SIZE);
    this.previousArray.array = new Uint8Array(bitArray.array);
  }
}
