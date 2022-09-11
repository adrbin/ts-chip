import { Input } from '../lib/chip8-vm.js';
import { KEY_MAPPING } from '../lib/constants.js';

export class WebKeyboardInput implements Input {
  pressedKeys = new Set<number>();

  constructor() {
    window.addEventListener('keydown', event => {
      const pressedKey = KEY_MAPPING[event.key];
      if (pressedKey === undefined) {
        return;
      }

      this.pressedKeys.add(pressedKey);
    });

    window.addEventListener('keyup', event => {
      const pressedKey = KEY_MAPPING[event.key];
      if (pressedKey === undefined) {
        return;
      }

      this.pressedKeys.delete(pressedKey);
    });
  }

  getInput() {
    return this.pressedKeys;
  }

  waitInput() {
    return new Promise<number>(resolve => {
      const listener = (event: KeyboardEvent) => {
        const pressedKey = KEY_MAPPING[event.key];
        if (pressedKey === undefined) {
          return;
        }

        window.removeEventListener('keypress', listener);
        resolve(pressedKey);
      };

      window.addEventListener('keypress', listener);
    });
  }
}
