import { WriteStream } from 'tty';
import { Audio } from '../lib/vm-runner.js';

const alertCharacter = String.fromCharCode(7);

export class TerminalAudio implements Audio {
  output: WriteStream;

  constructor(output: WriteStream) {
    this.output = output;
  }

  play() {
    this.output.write(alertCharacter);
  }

  stop() {}
}
