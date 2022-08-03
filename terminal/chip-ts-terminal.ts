import { readFile } from 'fs/promises';
import { stdin, stdout } from 'process';
import { BitArray } from '../bit-array';
import { run } from '../chip-ts';
import { DISPLAY_SIZE } from '../constants';
import { delay } from '../utils';
import { TerminalInput } from './terminal-input';
import { TerminalRenderer } from './terminal-renderer';
import { TerminalSound } from './terminal-sound';

async function main() {
  const renderer = new TerminalRenderer(stdout);
  const input = new TerminalInput(stdin);
  const sound = new TerminalSound(stdout);

  // sound.play();
  // sound.play();
  // await delay(1000);
  // sound.play();

  // const array = new BitArray(DISPLAY_SIZE);
  // array.xor(0, 1);
  // array.xor(1, 1);
  // array.xor(2, 1);
  // array.xor(3, 1);
  // array.xor(4, 0);
  // array.xor(5, 0);
  // array.xor(6, 0);
  // array.xor(7, 0);
  // await renderer.init();
  // await renderer.draw(array);
  // array.xor(0, 1);
  // array.xor(1, 1);
  // array.xor(2, 1);
  // array.xor(3, 1);
  // array.xor(4, 0);
  // array.xor(5, 0);
  // array.xor(6, 0);
  // array.xor(7, 0);
  // await renderer.draw(array);

  const filename = process.argv[2] ?? 'chip8-test-suite.ch8';
  const program = await readFile(filename, null);

  await run({ program, renderer, input, sound });
}

main();
