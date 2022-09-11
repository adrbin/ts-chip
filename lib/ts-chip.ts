import { FRAME_TIME_IN_MS } from './constants.js';
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

export async function run({ vm, renderer, audio }: ChipTsParams) {
  await renderer.init();

  setInterval(() => {
    if (vm.delayTimer > 0) {
      vm.delayTimer--;
    }

    if (vm.soundTimer === 1) {
      audio.stop();
    }

    if (vm.soundTimer > 0) {
      audio.play();
      vm.soundTimer--;
    }
  }, FRAME_TIME_IN_MS);

  while (!vm.isHalted) {
    await vm.executeInstruction();

    if (vm.didDraw) {
      await renderer.draw(vm.display);
    }

    await delay();
  }
}
