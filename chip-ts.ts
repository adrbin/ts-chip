import { FRAME_TIME_IN_MS } from './constants';
import { delay } from './utils';
import { Chip8Vm } from './chip8-vm';
import { Display } from './display';
import { SuperChip48Vm } from './super-chip48-vm';

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

  // const svm = vm as SuperChip48Vm;
  // await svm.loadFlags([0, 5, 0, 0]);
  // svm.loadISpriteHighResolution([0, 0, 0, 0]);
  // svm.highResolution();
  // svm.drawHighResolution([0, 1, 2, 10]);
  await renderer.draw(vm.display);

  while (!vm.isHalted) {
    await vm.executeInstruction();
    await renderer.draw(vm.display);

    await delay();
  }
}
