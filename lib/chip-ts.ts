import { FRAME_TIME_IN_MS } from './constants.js';
import { delay } from './utils.js';
import { Chip8Vm } from './chip8-vm.js';
import { Display } from './display.js';

export interface Renderer {
  init: () => Promise<void>;
  draw: (display: Display) => Promise<void>;
}

export interface Sound {
  play: () => void;
  stop: () => void;
}

export interface ChipTsParams {
  vm: Chip8Vm;
  renderer: Renderer;
  sound: Sound;
}

export async function run({ vm, renderer, sound }: ChipTsParams) {
  await renderer.init();

  setInterval(() => {
    if (vm.delayTimer > 0) {
      vm.delayTimer--;
    }

    if (vm.soundTimer === 1) {
      sound.stop();
    }

    if (vm.soundTimer > 0) {
      sound.play();
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
