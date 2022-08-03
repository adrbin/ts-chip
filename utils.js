"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBcd = exports.getNthBit = exports.getRandomInt = exports.mod = exports.joinNibbles = exports.toHex = exports.getLowerNibble = exports.getHigherNibble = exports.delay = void 0;
const constants_1 = require("./constants");
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.delay = delay;
function getHigherNibble(byte) {
    return (byte >> 4) & 0xf;
}
exports.getHigherNibble = getHigherNibble;
function getLowerNibble(byte) {
    return byte & 0xf;
}
exports.getLowerNibble = getLowerNibble;
function toHex(nibbles) {
    return nibbles.map(nibble => nibble.toString(16)).join('');
}
exports.toHex = toHex;
function joinNibbles(nibbles) {
    return nibbles.reduce((acc, cur, i) => acc + (cur << ((nibbles.length - i - 1) * 4)), 0);
}
exports.joinNibbles = joinNibbles;
function mod(n, m) {
    return ((n % m) + m) % m;
}
exports.mod = mod;
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
exports.getRandomInt = getRandomInt;
function getNthBit(byte, index) {
    return (byte >> (constants_1.BYTE_LENGTH - index - 1)) & 1;
}
exports.getNthBit = getNthBit;
function getBcd(n, digits) {
    const stack = [];
    for (let i = 0; i < digits; i++) {
        stack.push(n % 10);
        n /= 10;
    }
    return stack.reverse();
}
exports.getBcd = getBcd;
//# sourceMappingURL=utils.js.map