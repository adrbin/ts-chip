import { BYTE_LENGTH } from './constants.js';
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function getHigherNibble(byte) {
    return (byte >> 4) & 0xf;
}
export function getLowerNibble(byte) {
    return byte & 0xf;
}
export function toHex(nibbles) {
    return `0x${nibbles
        .map(nibble => nibble.toString(16).toUpperCase())
        .join('')}`;
}
export function joinNibbles(nibbles) {
    return nibbles.reduce((acc, cur, i) => acc + (cur << ((nibbles.length - i - 1) * 4)), 0);
}
export function mod(n, m) {
    return ((n % m) + m) % m;
}
export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
export function getNthBit(byte, index) {
    return (byte >> (BYTE_LENGTH - index - 1)) & 1;
}
export function getBcd(n, digits) {
    const stack = [];
    for (let i = 0; i < digits; i++) {
        stack.push(n % 10);
        n /= 10;
    }
    return stack.reverse();
}
export function createByte(bits) {
    return parseInt(bits.join(''), 2);
}
export function doubleByte(byte) {
    let bits = [];
    for (let i = 0; i < BYTE_LENGTH; i++) {
        const bit = getNthBit(byte, i);
        bits.push(bit, bit);
    }
    return [
        createByte(bits.slice(0, BYTE_LENGTH)),
        createByte(bits.slice(BYTE_LENGTH)),
    ];
}
export function matchInstruction(nibbles, pattern) {
    for (let i = 0; i < pattern.length; i++) {
        if (pattern[i].toLowerCase() === 'x' ||
            nibbles[i].toString(16) === pattern[i].toLowerCase()) {
            continue;
        }
        return false;
    }
    return true;
}
//# sourceMappingURL=utils.js.map