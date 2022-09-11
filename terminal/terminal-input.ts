import { ReadStream } from 'tty';
import { Input } from '../lib/chip8-vm.js';
import { KEY_MAPPING } from '../lib/constants.js';

export class TerminalInput implements Input {
  input: ReadStream;
  pressedKeys = new Map<number, number>();

  constructor(input: ReadStream) {
    this.input = input;
    this.input.setRawMode(true);
    this.input.on('data', data => {
      const charCode = data.readUint8();
      if (charCode === 27) {
        process.exit();
      }
      const pressedKey = KEY_MAPPING[String.fromCharCode(charCode)];
      if (pressedKey === undefined) {
        return;
      }

      const count = this.pressedKeys.get(pressedKey) ?? 0;
      this.pressedKeys.set(pressedKey, count + 1);
      setTimeout(() => {
        const count = this.pressedKeys.get(pressedKey) ?? 0;
        this.pressedKeys.set(pressedKey, count > 0 ? count - 1 : 0);
      }, 500);
    });
  }

  getInput() {
    return new Set(
      [...this.pressedKeys.entries()]
        .filter(([_, count]) => count > 0)
        .map(([key]) => key),
    );
  }

  waitInput() {
    return new Promise<number>(resolve => {
      const listener = (data: Buffer) => {
        const charCode = data.readUint8();
        const pressedKey = KEY_MAPPING[String.fromCharCode(charCode)];
        if (pressedKey === undefined) {
          return;
        }

        this.input.removeListener('data', listener);
        this.pressedKeys = new Map<number, number>();
        resolve(pressedKey);
      };

      this.input.on('data', listener);
    });
  }
}
