"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalRenderer = void 0;
const bit_array_1 = require("../bit-array");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const util_1 = require("util");
class TerminalRenderer {
    constructor(output) {
        this.previousArray = new bit_array_1.BitArray(constants_1.DISPLAY_SIZE);
        this.previousTimestamp = Date.now();
        this.output = output;
        this.cursorTo = (0, util_1.promisify)(output.cursorTo).bind(output);
        this.clearScreenDown = (0, util_1.promisify)(output.clearScreenDown).bind(output);
        this.write = (0, util_1.promisify)(output.write).bind(output);
    }
    async init() {
        await this.cursorTo(0, 0);
        await this.clearScreenDown();
    }
    async draw(bitArray) {
        const diff = this.previousArray.diff(bitArray);
        if (diff.length === 0) {
            return;
        }
        const timeDifference = Date.now() - this.previousTimestamp;
        if (timeDifference < constants_1.FRAME_TIME_IN_MS) {
            await (0, utils_1.delay)(constants_1.FRAME_TIME_IN_MS - timeDifference);
        }
        this.previousTimestamp = Date.now();
        let previousIndex = NaN;
        for (const index of diff) {
            if (index !== previousIndex + 1) {
                const x = (0, utils_1.mod)(index, constants_1.DISPLAY_WIDTH) * 2;
                const y = Math.floor(index / constants_1.DISPLAY_WIDTH);
                await this.cursorTo(x, y);
            }
            if (bitArray.get(index) === 1) {
                await this.write('\u001b[107m  ');
            }
            else {
                await this.write('\u001b[49m  ');
            }
            previousIndex = index;
        }
        this.previousArray = new bit_array_1.BitArray(constants_1.DISPLAY_SIZE);
        this.previousArray.array = new Uint8Array(bitArray.array);
    }
}
exports.TerminalRenderer = TerminalRenderer;
//# sourceMappingURL=terminal-renderer.js.map