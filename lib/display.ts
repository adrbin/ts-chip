import { BitArray } from './bit-array.js';
import { mod } from './utils.js';

export class Display {
  width: number;
  height: number;
  display: BitArray;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.display = new BitArray(width * height);
  }

  copy() {
    const newDisplay = new Display(this.width, this.height);
    newDisplay.display = this.display.copy();

    return newDisplay;
  }

  getPixel(x: number, y: number) {
    return this.display.get(y * this.width + x);
  }

  setPixel(x: number, y: number, value: number) {
    return this.display.set(y * this.width + x, value);
  }

  xorPixel(x: number, y: number, value: number) {
    return this.display.xor(y * this.width + x, value);
  }

  getX(index: number) {
    return mod(index, this.width);
  }

  getY(index: number) {
    return Math.floor(index / this.width);
  }

  getIndex(x: number, y: number) {
    return y * this.width + x;
  }
}
