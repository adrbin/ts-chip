import { Audio } from '../lib/ts-chip.js';

export class WebAudio implements Audio {
  oscillator: OscillatorNode;

  constructor() {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();
    this.oscillator = audioCtx.createOscillator();
    this.oscillator.type = 'square';
    this.oscillator.frequency.value = 440;
    this.oscillator.connect(audioCtx.destination);
  }

  play() {
    this.oscillator.start();
  }

  stop() {
    this.oscillator.stop();
  }
}
