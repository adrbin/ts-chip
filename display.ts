import { BitArray } from './bit-array.js';

export interface Display {
  width: number;
  height: number;
  display: BitArray;
}

export function createDisplay(width: number, height: number): Display {
  return {
    width,
    height,
    display: new BitArray(width * height),
  };
}
