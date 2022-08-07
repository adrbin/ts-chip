"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalRenderer = void 0;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const util_1 = require("util");
const display_1 = require("../display");
const bit_array_1 = require("../bit-array");
class TerminalRenderer {
    constructor({ output, scaleFactor = 2, shouldLimitFrame = true, }) {
        this.previousDisplay = (0, display_1.createDisplay)(constants_1.DISPLAY_WIDTH, constants_1.DISPLAY_HEIGHT);
        this.previousTimestamp = Date.now();
        this.output = output;
        this.scaleFactor = scaleFactor;
        this.shouldLimitFrame = shouldLimitFrame;
        this.cursorTo = (0, util_1.promisify)(output.cursorTo).bind(output);
        this.clearScreenDown = (0, util_1.promisify)(output.clearScreenDown).bind(output);
        this.write = (0, util_1.promisify)(output.write).bind(output);
    }
    async init() {
        await this.cursorTo(0, 0);
        await this.write(`\u001b[49m`);
        await this.clearScreenDown();
    }
    async draw(display) {
        await this.checkDisplaySize(display);
        const diff = display.display.diff(this.previousDisplay.display);
        if (diff.length === 0) {
            return;
        }
        await this.limitFrame();
        await this.drawToScreen(display, diff);
        this.previousDisplay = {
            ...display,
            display: bit_array_1.BitArray.copy(display.display),
        };
    }
    async checkDisplaySize(display) {
        if (display.width !== this.previousDisplay.width ||
            display.height !== this.previousDisplay.height) {
            this.previousDisplay = (0, display_1.createDisplay)(display.width, display.height);
            await this.init();
        }
    }
    async limitFrame() {
        if (!this.shouldLimitFrame) {
            return;
        }
        const timeDifference = Date.now() - this.previousTimestamp;
        if (timeDifference < constants_1.FRAME_TIME_IN_MS) {
            await (0, utils_1.delay)(constants_1.FRAME_TIME_IN_MS - timeDifference);
        }
        this.previousTimestamp = Date.now();
    }
    async drawToScreen(display, diff) {
        const toWrite = ' '.repeat(this.scaleFactor);
        let previousIndex = NaN;
        for (const index of diff) {
            const value = display.display.get(index);
            if (index !== previousIndex + 1) {
                const x = (0, utils_1.mod)(index, display.width) * this.scaleFactor;
                const y = Math.floor(index / display.width);
                await this.cursorTo(x, y);
            }
            else if (display.display.get(previousIndex) === value) {
                await this.write(toWrite);
                continue;
            }
            if (display.display.get(index) === 1) {
                await this.write(`\u001b[107m${toWrite}`);
            }
            else {
                await this.write(`\u001b[49m${toWrite}`);
            }
            previousIndex = index;
        }
    }
}
exports.TerminalRenderer = TerminalRenderer;
//# sourceMappingURL=terminal-renderer.js.map