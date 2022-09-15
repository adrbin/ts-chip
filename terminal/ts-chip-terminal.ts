import { Console } from 'console';
import { createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { stdin, stdout } from 'process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { VmRunner } from '../lib/vm-runner.js';
import { Chip8Vm } from '../lib/chip8-vm.js';
import { SuperChip48Vm } from '../lib/super-chip48-vm.js';
import { FileStorage } from './file-storage.js';
import { TerminalInput } from './terminal-input.js';
import { TerminalRenderer } from './terminal-renderer.js';
import { TerminalAudio } from './terminal-audio.js';

async function main() {
  const argv = await getArgv();

  const renderer = new TerminalRenderer({
    output: stdout,
    shouldLimitFrame: argv.mode === 'chip-8',
    shouldDrawFps: argv.shouldDrawFps,
  });
  const audio = new TerminalAudio(stdout);
  const input = new TerminalInput(stdin);
  const consoleStream = createWriteStream(`${argv.load}.log`);
  const logger = new Console(consoleStream, consoleStream);
  const storage = new FileStorage(`${argv.load}.state`);

  const program = await readFile(argv.load);

  const vmClass = argv.mode === 'chip-8' ? Chip8Vm : SuperChip48Vm;
  const vm = new vmClass({ program, input, logger, storage });

  const vmRunner = new VmRunner({ vm, renderer, audio });
  await vmRunner.run();
}

function getArgv() {
  return yargs(hideBin(process.argv))
    .options({
      load: {
        alias: 'l',
        type: 'string',
        description: 'Load a rom',
        default: 'roms/chip-8/chip8-test-suite.ch8',
      },
      mode: {
        alias: 'm',
        type: 'string',
        description:
          'Choose a compatibility mode to run: chip-8 (default) or schip',
        default: 'chip-8',
      },
      shouldDrawFps: {
        alias: 'f',
        type: 'boolean',
        description: 'Should draw FPS',
        default: false,
      },
    })
    .usage(
      'ts-chip\nA Chip-8 and Super Chip-48 interpreter written in TypeScript',
    ).argv;
}

main();
