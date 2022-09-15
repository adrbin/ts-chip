import { Audio } from '../lib/vm-runner.js';

export class WebAudio implements Audio {
  oscillator: OscillatorNode | undefined;

  play() {
    if (this.oscillator) return;

    this.oscillator = createOscillator();
    this.oscillator.start();
  }

  stop() {
    this.oscillator?.stop();
    this.oscillator = undefined;
  }
}

function createOscillator() {
  const AudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContext();
  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'square';
  oscillator.frequency.value = 440;
  oscillator.connect(audioCtx.destination);

  return oscillator;
}
