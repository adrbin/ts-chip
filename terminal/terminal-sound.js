const alertCharacter = String.fromCharCode(7);
export class TerminalSound {
    output;
    constructor(output) {
        this.output = output;
    }
    play() {
        this.output.write(alertCharacter);
    }
    stop() { }
}
//# sourceMappingURL=terminal-sound.js.map