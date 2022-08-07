"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const console_1 = require("console");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const process_1 = require("process");
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const chip_ts_1 = require("../chip-ts");
const chip8_vm_1 = require("../chip8-vm");
const super_chip48_vm_1 = require("../super-chip48-vm");
const file_storage_1 = require("./file-storage");
const terminal_input_1 = require("./terminal-input");
const terminal_renderer_1 = require("./terminal-renderer");
const terminal_sound_1 = require("./terminal-sound");
async function main() {
    const argv = await getArgv();
    const renderer = new terminal_renderer_1.TerminalRenderer({
        output: process_1.stdout,
        shouldLimitFrame: argv.mode === 'chip-8',
    });
    const sound = new terminal_sound_1.TerminalSound(process_1.stdout);
    const input = new terminal_input_1.TerminalInput(process_1.stdin);
    const consoleStream = (0, fs_1.createWriteStream)(`${argv.load}.log`);
    const logger = new console_1.Console(consoleStream, consoleStream);
    const storage = new file_storage_1.FileStorage(`${argv.load}.state`);
    const program = await (0, promises_1.readFile)(argv.load);
    const vmClass = argv.mode === 'chip-8' ? chip8_vm_1.Chip8Vm : super_chip48_vm_1.SuperChip48Vm;
    const vm = new vmClass({ program, input, logger, storage });
    await (0, chip_ts_1.run)({ vm, renderer, sound });
}
function getArgv() {
    return (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
        .options({
        load: {
            alias: 'l',
            type: 'string',
            description: 'Load a rom',
            default: 'roms/chip8-test-suite.ch8',
        },
        mode: {
            alias: 'm',
            type: 'string',
            description: 'Choose a compatibility mode to run: chip-8 (default) or schip',
            default: 'chip-8',
        },
    })
        .usage('Chip-ts\nA Chip-8 and Super Chip-48 interpreter written in TypeScript').argv;
}
main();
//# sourceMappingURL=chip-ts-terminal.js.map