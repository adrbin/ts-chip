import { BitArray } from './bit-array.js';
export function createDisplay(width, height) {
    return {
        width,
        height,
        display: new BitArray(width * height),
    };
}
//# sourceMappingURL=display.js.map