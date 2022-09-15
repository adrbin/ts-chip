import { DELAY_FACTOR, FRAME_TIME_IN_MS } from './constants.js';
import { delay } from './utils.js';
import { Chip8Vm } from './chip8-vm.js';
import { Display } from './display.js';

export interface Renderer {
  init: () => Promise<void> | void;
  draw: (display: Display) => Promise<void> | void;
}

export interface Audio {
  play: () => void;
  stop: () => void;
}

export interface ChipTsParams {
  vm: Chip8Vm;
  renderer: Renderer;
  audio: Audio;
}

export class VmRunner {
  vm: Chip8Vm;
  renderer: Renderer;
  audio: Audio;
  isStopped = false;

  constructor({ vm, renderer, audio }: ChipTsParams) {
    this.vm = vm;
    this.renderer = renderer;
    this.audio = audio;
  }

  async run() {
    this.isStopped = false;
    await this.renderer.init();

    const intervalId = setInterval(() => {
      if (this.vm.soundTimer === 1) {
        this.audio.stop();
      } else if (this.vm.soundTimer > 0) {
        this.audio.play();
      }

      if (this.vm.soundTimer > 0) {
        this.vm.soundTimer--;
      }

      if (this.vm.delayTimer > 0) {
        this.vm.delayTimer--;
      }
    }, FRAME_TIME_IN_MS);

    let i = 0;

    while (!this.vm.isHalted && !this.isStopped) {
      await this.vm.executeInstruction();

      if (this.vm.didDraw) {
        await this.renderer.draw(this.vm.display);
      }

      if (i === 0) {
        await delay();
      }

      i = (i + 1) % DELAY_FACTOR;
    }

    clearInterval(intervalId);
  }

  async stop() {
    this.isStopped = true;
    await delay();
  }
}
