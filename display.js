"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDisplay = void 0;
const bit_array_1 = require("./bit-array");
function createDisplay(width, height) {
    return {
        width,
        height,
        display: new bit_array_1.BitArray(width * height),
    };
}
exports.createDisplay = createDisplay;
//# sourceMappingURL=display.js.map