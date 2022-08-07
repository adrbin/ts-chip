import { Console } from 'console';
import { createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { stdin, stdout } from 'process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { run } from '../chip-ts';
import { Chip8Vm } from '../chip8-vm';
import { SuperChip48Vm } from '../super-chip48-vm';
import { FileStorage } from './file-storage';
import { TerminalInput } from './terminal-input';
import { TerminalRenderer } from './terminal-renderer';
import { TerminalSound } from './terminal-sound';

async function main() {
  const argv = await getArgv();

  const renderer = new TerminalRenderer({
    output: stdout,
    shouldLimitFrame: argv.mode === 'chip-8',
  });
  const sound = new TerminalSound(stdout);
  const input = new TerminalInput(stdin);
  const consoleStream = createWriteStream(`${argv.load}.log`);
  const logger = new Console(consoleStream, consoleStream);
  const storage = new FileStorage(`${argv.load}.state`);

  const program = await readFile(argv.load);

  const vmClass = argv.mode === 'chip-8' ? Chip8Vm : SuperChip48Vm;
  const vm = new vmClass({ program, input, logger, storage });

  await run({ vm, renderer, sound });
}

function getArgv() {
  return yargs(hideBin(process.argv))
    .options({
      load: {
        alias: 'l',
        type: 'string',
        description: 'Load a rom',
        default: 'roms/chip8-test-suite.ch8',
      },
      mode: {
        alias: 'm',
        type: 'string',
        description:
          'Choose a compatibility mode to run: chip-8 (default) or schip',
        default: 'chip-8',
      },
    })
    .usage(
      'Chip-ts\nA Chip-8 and Super Chip-48 interpreter written in TypeScript',
    ).argv;
}

main();
