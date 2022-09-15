import { BYTE_LENGTH } from './constants.js';

export function delay(ms?: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function getHigherNibble(byte: number) {
  return (byte >> 4) & 0xf;
}

export function getLowerNibble(byte: number) {
  return byte & 0xf;
}

export function nibblesToHex(nibbles: number[]) {
  return `0x${nibbles
    .map(nibble => nibble.toString(16).toUpperCase())
    .join('')}`;
}

export function toHex(value: number) {
  return value.toString(16).toUpperCase();
}

export function joinNibbles(nibbles: number[]) {
  return nibbles.reduce(
    (acc, cur, i) => acc + (cur << ((nibbles.length - i - 1) * 4)),
    0,
  );
}

export function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function getNthBit(byte: number, index: number) {
  return (byte >> (BYTE_LENGTH - index - 1)) & 1;
}

export function getBcd(n: number, digits: number) {
  const stack: number[] = [];
  for (let i = 0; i < digits; i++) {
    stack.push(n % 10);
    n /= 10;
  }

  return stack.reverse();
}

export function createByte(bits: number[]) {
  return parseInt(bits.join(''), 2);
}

export function doubleByte(byte: number) {
  let bits: number[] = [];
  for (let i = 0; i < BYTE_LENGTH; i++) {
    const bit = getNthBit(byte, i);
    bits.push(bit, bit);
  }

  return [
    createByte(bits.slice(0, BYTE_LENGTH)),
    createByte(bits.slice(BYTE_LENGTH)),
  ];
}

export function matchInstruction(nibbles: number[], pattern: string) {
  for (let i = 0; i < pattern.length; i++) {
    if (
      pattern[i].toLowerCase() === 'x' ||
      nibbles[i].toString(16) === pattern[i].toLowerCase()
    ) {
      continue;
    }
    return false;
  }

  return true;
}
