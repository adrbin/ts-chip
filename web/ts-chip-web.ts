import { run } from '../lib/ts-chip.js';
import { Chip8Vm } from '../lib/chip8-vm.js';
import { WebAudio } from './web-audio.js';
import { WebKeyboardInput } from './web-input.js';
import { WebRenderer } from './web-renderer.js';
import { WebStorage } from './web-storage.js';

async function main() {
  const game = 'roms/chip-8/chip8-test-suite.ch8';
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('There is no canvas to render the game');
  }
  const renderer = new WebRenderer({
    canvas,
  });

  const audio = new WebAudio();
  const input = new WebKeyboardInput();
  const storage = new WebStorage(`${game}.state`);

  const programResponse = await fetch(game);
  const programBuffer = await programResponse.arrayBuffer();
  const program = new Uint8Array(programBuffer);

  const vmClass = Chip8Vm;
  const vm = new vmClass({ program, input, logger: console, storage });

  await run({ vm, renderer, audio });
}

main();
