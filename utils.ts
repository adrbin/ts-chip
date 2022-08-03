import { BYTE_LENGTH } from './constants';

export function delay(ms?: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function getHigherNibble(byte: number) {
  return (byte >> 4) & 0xf;
}

export function getLowerNibble(byte: number) {
  return byte & 0xf;
}

export function toHex(nibbles: number[]) {
  return nibbles.map(nibble => nibble.toString(16)).join('');
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
