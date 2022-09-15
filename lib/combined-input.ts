import { Input } from './chip8-vm.js';

export class CombinedInput implements Input {
  inputs: Input[];

  constructor(...inputs: Input[]) {
    this.inputs = inputs;
  }

  getInput() {
    const result = new Set<number>();
    for (const input of this.inputs) {
      const inputResult = input.getInput();
      for (const key of inputResult) {
        result.add(key);
      }
    }

    return result;
  }

  async waitInput() {
    const promises = this.inputs.map(input => input.waitInput());
    const result = await Promise.any(promises);
    for (const input of this.inputs) {
      input.cancelWait();
    }

    return result;
  }

  cancelWait() {
    for (const input of this.inputs) {
      input.cancelWait();
    }
  }
}
