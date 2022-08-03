import { BitArray } from './bit-array';
import { FRAME_TIME_IN_MS } from './constants';
import { delay } from './utils';
import { Input, Vm } from './vm';

export interface Renderer {
  init: () => Promise<void>;
  draw: (bitArray: BitArray) => Promise<void>;
}

export interface Sound {
  play: () => void;
  stop: () => void;
}

export interface ChipTsParams {
  program: Buffer;
  renderer: Renderer;
  input: Input;
  sound: Sound;
  logger?: Console;
}

export async function run({
  program,
  renderer,
  input,
  sound,
  logger,
}: ChipTsParams) {
  const vm = new Vm({ program, input, logger });
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

  while (true) {
    await vm.executeInstruction();
    // vm.registers[0] = 1;
    // vm.loadISprite([0xf, 0, 2, 9]);
    // vm.registers[5] = 5;
    // vm.draw([0xd, 5, 5, 5]);
    await renderer.draw(vm.display);

    await delay();
  }
}
