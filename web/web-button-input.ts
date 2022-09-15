import { Input } from '../lib/chip8-vm.js';
import { INPUT_DELAY, KEY_MAPPING } from '../lib/constants.js';
import { delay } from '../lib/utils.js';

export class WebButtonInput implements Input {
  buttons: Record<string, HTMLButtonElement>;
  pressedKeys = new Set<number>();
  waitListeners: Record<string, () => void> = {};

  constructor(buttons: Record<string, HTMLButtonElement>) {
    this.buttons = buttons;

    for (const key of Object.keys(buttons)) {
      const button = buttons[key];
      const onStart = () => {
        const pressedKey = parseInt(key, 16);
        if (!isValidKey(pressedKey)) {
          return;
        }

        this.pressedKeys.add(pressedKey);
      };

      const onEnd = async () => {
        const pressedKey = parseInt(key, 16);
        if (!isValidKey(pressedKey)) {
          return;
        }

        await delay(INPUT_DELAY);

        this.pressedKeys.delete(pressedKey);
      };

      button.addEventListener('touchstart', onStart);
      button.addEventListener('touchmove', onStart);
      button.addEventListener('mousedown', onStart);
      button.addEventListener('touchend', onEnd);
      button.addEventListener('touchcancel', onEnd);
      button.addEventListener('mouseup', onEnd);
      button.addEventListener('mouseout', onEnd);
    }
  }

  getInput() {
    return this.pressedKeys;
  }

  waitInput() {
    return new Promise<number>(resolve => {
      this.waitListeners = {};
      for (const key of Object.keys(this.buttons)) {
        const button = this.buttons[key];
        const listener = () => {
          const pressedKey = parseInt(key, 16);
          if (!isValidKey(pressedKey)) {
            return;
          }

          this.cancelWait();
          resolve(pressedKey);
        };
        this.waitListeners[key] = listener;
        button.addEventListener('touchstart', listener);
        button.addEventListener('mousedown', listener);
      }
    });
  }

  cancelWait() {
    for (const key of Object.keys(this.waitListeners)) {
      const button = this.buttons[key];
      const listener = this.waitListeners[key];
      button.removeEventListener('touchstart', listener);
      button.removeEventListener('mousedown', listener);
    }

    this.waitListeners = {};
  }
}

function isValidKey(pressedKey: number) {
  return Object.values(KEY_MAPPING).includes(pressedKey);
}
