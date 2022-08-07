"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperChip48Vm = void 0;
const chip8_vm_1 = require("./chip8-vm");
const constants_1 = require("./constants");
const display_1 = require("./display");
const utils_1 = require("./utils");
class SuperChip48Vm extends chip8_vm_1.Chip8Vm {
    constructor(vmParams) {
        super(vmParams);
        this.newOperations = [
            [instruction => (0, utils_1.matchInstruction)(instruction, '00Cx'), this.scrollDown],
            [instruction => (0, utils_1.matchInstruction)(instruction, '00FB'), this.scrollRight],
            [instruction => (0, utils_1.matchInstruction)(instruction, '00FC'), this.scrollLeft],
            [instruction => (0, utils_1.matchInstruction)(instruction, '00FD'), this.exit],
            [instruction => (0, utils_1.matchInstruction)(instruction, '00FE'), this.lowResolution],
            [instruction => (0, utils_1.matchInstruction)(instruction, '00FF'), this.highResolution],
            [
                instruction => (0, utils_1.matchInstruction)(instruction, 'Dxx0'),
                this.drawHighResolution,
            ],
            [
                instruction => (0, utils_1.matchInstruction)(instruction, 'Fx30'),
                this.loadISpriteHighResolution,
            ],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx75'), this.saveFlags],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx85'), this.loadFlags],
        ];
        for (let i = 0; i < constants_1.FONT_DATA.length; i++) {
            const [byte1] = (0, utils_1.doubleByte)(constants_1.FONT_DATA[i]);
            this.memory[constants_1.LARGE_FONT_DATA_START + i * 2] = byte1;
            this.memory[constants_1.LARGE_FONT_DATA_START + i * 2 + 1] = byte1;
        }
        this.operations = [...this.newOperations, ...this.operations];
    }
    scrollDown(instruction) {
        const height = instruction[3];
        const difference = (height * this.display.width) / constants_1.BYTE_LENGTH;
        for (let i = this.display.display.array.length - 1; i >= difference; i--) {
            this.display.display.array[i] =
                this.display.display.array[i - difference];
        }
        for (let i = 0; i < difference; i++) {
            this.display.display.array[i] = 0;
        }
    }
    scrollRight() {
        for (let y = 0; y < this.display.height; y++) {
            for (let x = this.display.width / constants_1.BYTE_LENGTH - 1; x > 0; x--) {
                const index = (y * this.display.width) / constants_1.BYTE_LENGTH + x;
                const previousLowerNibble = (0, utils_1.getLowerNibble)(this.display.display.array[index - 1]);
                const higherNibble = (0, utils_1.getHigherNibble)(this.display.display.array[index]);
                const newByte = (previousLowerNibble << 4) + higherNibble;
                this.display.display.array[index] = newByte;
            }
            const index = (y * this.display.width) / constants_1.BYTE_LENGTH;
            this.display.display.array[index] = (0, utils_1.getHigherNibble)(this.display.display.array[index]);
        }
    }
    scrollLeft() {
        for (let y = 0; y < this.display.height; y++) {
            for (let x = 0; x < this.display.width / constants_1.BYTE_LENGTH - 1; x++) {
                const index = (y * this.display.width) / constants_1.BYTE_LENGTH + x;
                const nextHigherNibble = (0, utils_1.getHigherNibble)(this.display.display.array[index + 1]);
                const lowerNibble = (0, utils_1.getLowerNibble)(this.display.display.array[index]);
                const newByte = (lowerNibble << 4) + nextHigherNibble;
                this.display.display.array[index] = newByte;
            }
            const index = ((y + 1) * this.display.width) / constants_1.BYTE_LENGTH - 1;
            this.display.display.array[index] =
                (0, utils_1.getLowerNibble)(this.display.display.array[index]) << 4;
        }
    }
    drawHighResolution(instruction) {
        const originX = (0, utils_1.mod)(this.registers[instruction[1]], this.display.width);
        const originY = (0, utils_1.mod)(this.registers[instruction[2]], this.display.height);
        const height = 16;
        let isCollision = false;
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < constants_1.BYTE_LENGTH * 2; dx++) {
                const spriteByte = this.memory[this.registerI + dy * 2 + Math.floor(dx / constants_1.BYTE_LENGTH)];
                const x = originX + dx;
                const y = originY + dy;
                if (x >= this.display.width || y >= this.display.height) {
                    continue;
                }
                const spriteValue = (0, utils_1.getNthBit)(spriteByte, (0, utils_1.mod)(dx, constants_1.BYTE_LENGTH));
                const isCurrentCollision = this.display.display.xor(y * this.display.width + x, spriteValue);
                isCollision ||= isCurrentCollision;
            }
        }
        this.registers[constants_1.FLAG_REGISTER] = isCollision ? 1 : 0;
    }
    loadISpriteHighResolution(instruction) {
        const register = instruction[1];
        this.registerI = constants_1.LARGE_FONT_DATA_START + this.registers[register] * 10;
    }
    async saveFlags(instruction) {
        const maxRegister = instruction[1];
        const registers = [...this.registers.slice(0, maxRegister + 1)];
        await this.storage?.save(registers);
    }
    async loadFlags(instruction) {
        const registers = (await this.storage?.load()) ?? [];
        const maxRegister = Math.min(instruction[1], registers.length - 1);
        for (let i = 0; i <= maxRegister; i++) {
            this.registers[i] = registers[i];
        }
    }
    exit() {
        this.isHalted = true;
    }
    lowResolution() {
        this.display = (0, display_1.createDisplay)(constants_1.DISPLAY_WIDTH, constants_1.DISPLAY_HEIGHT);
    }
    highResolution() {
        this.display = (0, display_1.createDisplay)(constants_1.HIGH_RES_DISPLAY_WIDTH, constants_1.HIGH_RES_DISPLAY_HEIGHT);
    }
    or(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        this.registers[register1] |= this.registers[register2];
    }
    and(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        this.registers[register1] &= this.registers[register2];
    }
    xor(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        this.registers[register1] ^= this.registers[register2];
    }
    shiftRight(instruction) {
        const register = instruction[1];
        const flag = this.registers[register] & 1;
        this.registers[register] >>= 1;
        this.registers[constants_1.FLAG_REGISTER] = flag;
    }
    shiftLeft(instruction) {
        const register = instruction[1];
        const flag = (0, utils_1.getNthBit)(this.registers[register], 0);
        this.registers[register] = (this.registers[register] << 1) & 0xff;
        this.registers[constants_1.FLAG_REGISTER] = flag;
    }
    jumpRelativeAddress(instruction) {
        const register = instruction[1];
        const address = (0, utils_1.joinNibbles)(instruction.slice(1)) + this.registers[register];
        this.pc = (0, utils_1.mod)(address, constants_1.MEMORY_SIZE);
    }
    loadIRegisters(instruction) {
        let maxRegister = instruction[1];
        for (let i = 0; i <= maxRegister; i++) {
            this.memory[this.registerI + i] = this.registers[i];
        }
    }
    loadRegistersI(instruction) {
        let maxRegister = instruction[1];
        for (let i = 0; i <= maxRegister; i++) {
            this.registers[i] = this.memory[this.registerI + i];
        }
    }
}
exports.SuperChip48Vm = SuperChip48Vm;
//# sourceMappingURL=super-chip48-vm.js.map