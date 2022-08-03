"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalInput = void 0;
const keyMapping = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 0xc,
    q: 4,
    w: 5,
    e: 6,
    r: 0xd,
    a: 7,
    s: 8,
    d: 9,
    f: 0xe,
    z: 0xa,
    x: 0,
    c: 0xb,
    v: 0xf,
};
class TerminalInput {
    constructor(input) {
        this.pressedKeys = new Map();
        this.input = input;
        this.input.setRawMode(true);
        this.input.on('data', data => {
            const charCode = data.readUint8();
            if (charCode === 27) {
                process.exit();
            }
            const pressedKey = keyMapping[String.fromCharCode(charCode)];
            const count = this.pressedKeys.get(pressedKey) ?? 0;
            this.pressedKeys.set(pressedKey, count + 1);
            setTimeout(() => {
                const count = this.pressedKeys.get(pressedKey) ?? 0;
                this.pressedKeys.set(pressedKey, count > 0 ? count - 1 : 0);
            }, 500);
        });
    }
    getInput() {
        return new Set([...this.pressedKeys.entries()]
            .filter(([_, count]) => count > 0)
            .map(([key]) => key));
    }
    waitInput() {
        return new Promise(resolve => {
            const listener = (data) => {
                const charCode = data.readUint8();
                const pressedKey = keyMapping[String.fromCharCode(charCode)];
                this.input.removeListener('data', listener);
                this.pressedKeys = new Map();
                resolve(pressedKey);
            };
            this.input.on('data', listener);
        });
    }
}
exports.TerminalInput = TerminalInput;
//# sourceMappingURL=terminal-input.js.map