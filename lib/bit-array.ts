import { BYTE_LENGTH } from './constants.js';
import { getNthBit, mod } from './utils.js';

export class BitArray {
  array: Uint8Array;

  constructor(length: number) {
    this.array = new Uint8Array(Math.ceil(length));
  }

  copy() {
    const newBitArray = new BitArray(this.array.length);
    newBitArray.array = new Uint8Array(this.array);

    return newBitArray;
  }

  get(index: number) {
    const [index1, index2] = this.getIndexes(index);
    return getNthBit(this.array[index1], index2);
  }

  set(index: number, value: number) {
    const [index1, index2] = this.getIndexes(index);
    const oldValue = this.array[index1];
    const newValue = this.getValueWithSetBit(oldValue, index2, value);
    this.array[index1] = newValue;
  }

  xor(index: number, value: number) {
    const [index1, index2] = this.getIndexes(index);
    const oldValue = this.array[index1];
    const indexedBit = getNthBit(oldValue, index2);
    const xoredBit = indexedBit ^ value;
    const newValue = this.getValueWithSetBit(oldValue, index2, xoredBit);
    this.array[index1] = newValue;

    return indexedBit === 1 && value === 1;
  }

  diff(otherArray: BitArray) {
    const differences: number[] = [];
    for (let i = 0; i < otherArray.array.length; i++) {
      if (this.array[i] === otherArray.array[i]) {
        continue;
      }
      for (let j = 0; j < BYTE_LENGTH; j++) {
        const index = i * BYTE_LENGTH + j;
        if (this.get(index) !== otherArray.get(index)) {
          differences.push(index);
        }
      }
    }

    return differences;
  }

  private getIndexes(index: number) {
    return [Math.floor(index / 8), mod(index, 8)];
  }

  private getValueWithSetBit(value: number, index: number, bit: number) {
    return bit === 1 ? value | (0x80 >> index) : value & ~(0x80 >> index);
  }
}
