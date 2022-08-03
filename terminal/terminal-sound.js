"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalSound = void 0;
const alertCharacter = String.fromCharCode(7);
class TerminalSound {
    constructor(output) {
        this.output = output;
    }
    play() {
        this.output.write(alertCharacter);
    }
    stop() { }
}
exports.TerminalSound = TerminalSound;
//# sourceMappingURL=terminal-sound.js.map