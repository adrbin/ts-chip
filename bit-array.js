"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitArray = void 0;
const constants_1 = require("./constants");
const utils_1 = require("./utils");
class BitArray {
    constructor(length) {
        this.array = new Uint8Array(Math.ceil(length));
    }
    get(index) {
        const [index1, index2] = this.getIndexes(index);
        return (0, utils_1.getNthBit)(this.array[index1], index2);
    }
    set(index, value) {
        const [index1, index2] = this.getIndexes(index);
        const oldValue = this.array[index1];
        const newValue = this.getValueWithSetBit(oldValue, index2, value);
        this.array[index1] = newValue;
    }
    xor(index, value) {
        const [index1, index2] = this.getIndexes(index);
        const oldValue = this.array[index1];
        const indexedBit = (0, utils_1.getNthBit)(oldValue, index2);
        const xoredBit = indexedBit ^ value;
        const newValue = this.getValueWithSetBit(oldValue, index2, xoredBit);
        this.array[index1] = newValue;
        return indexedBit === 1 && value === 1;
    }
    diff(otherArray) {
        const differences = [];
        for (let i = 0; i < otherArray.array.length; i++) {
            if (this.array[i] === otherArray.array[i]) {
                continue;
            }
            for (let j = 0; j < constants_1.BYTE_LENGTH; j++) {
                const index = i * constants_1.BYTE_LENGTH + j;
                if (this.get(index) !== otherArray.get(index)) {
                    differences.push(index);
                }
            }
        }
        return differences;
    }
    getIndexes(index) {
        return [Math.floor(index / 8), (0, utils_1.mod)(index, 8)];
    }
    getValueWithSetBit(value, index, bit) {
        return bit === 1 ? value | (0x80 >> index) : value & ~(0x80 >> index);
    }
}
exports.BitArray = BitArray;
//# sourceMappingURL=bit-array.js.map