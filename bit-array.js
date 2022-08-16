import { BYTE_LENGTH } from './constants.js';
import { getNthBit, mod } from './utils.js';
export class BitArray {
    array;
    constructor(length) {
        this.array = new Uint8Array(Math.ceil(length));
    }
    static copy(bitArray) {
        const newBitArray = new BitArray(bitArray.array.length);
        newBitArray.array = new Uint8Array(bitArray.array);
        return newBitArray;
    }
    get(index) {
        const [index1, index2] = this.getIndexes(index);
        return getNthBit(this.array[index1], index2);
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
        const indexedBit = getNthBit(oldValue, index2);
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
            for (let j = 0; j < BYTE_LENGTH; j++) {
                const index = i * BYTE_LENGTH + j;
                if (this.get(index) !== otherArray.get(index)) {
                    differences.push(index);
                }
            }
        }
        return differences;
    }
    getIndexes(index) {
        return [Math.floor(index / 8), mod(index, 8)];
    }
    getValueWithSetBit(value, index, bit) {
        return bit === 1 ? value | (0x80 >> index) : value & ~(0x80 >> index);
    }
}
//# sourceMappingURL=bit-array.js.map