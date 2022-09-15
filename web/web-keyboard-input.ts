import { Input } from '../lib/chip8-vm.js';
import { INPUT_DELAY, KEY_MAPPING } from '../lib/constants.js';
import { delay } from '../lib/utils.js';

export class WebKeyboardInput implements Input {
  pressedKeys = new Set<number>();
  waitListener?: (event: KeyboardEvent) => void;

  constructor() {
    window.addEventListener('keydown', event => {
      const pressedKey = KEY_MAPPING[event.key];
      if (pressedKey === undefined) {
        return;
      }

      this.pressedKeys.add(pressedKey);
    });

    window.addEventListener('keyup', async event => {
      const pressedKey = KEY_MAPPING[event.key];
      if (pressedKey === undefined) {
        return;
      }

      await delay(INPUT_DELAY);

      this.pressedKeys.delete(pressedKey);
    });
  }

  getInput() {
    return this.pressedKeys;
  }

  waitInput() {
    return new Promise<number>(resolve => {
      this.waitListener = (event: KeyboardEvent) => {
        const pressedKey = KEY_MAPPING[event.key];
        if (pressedKey === undefined) {
          return;
        }

        this.cancelWait();
        resolve(pressedKey);
      };

      window.addEventListener('keypress', this.waitListener);
    });
  }

  cancelWait() {
    if (this.waitListener) {
      window.removeEventListener('keypress', this.waitListener);
    }

    this.waitListener = undefined;
  }
}
