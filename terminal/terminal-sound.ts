import { WriteStream } from 'tty';
import { Sound } from '../chip-ts.js';

const alertCharacter = String.fromCharCode(7);

export class TerminalSound implements Sound {
  output: WriteStream;

  constructor(output: WriteStream) {
    this.output = output;
  }

  play() {
    this.output.write(alertCharacter);
  }

  stop() {}
}
