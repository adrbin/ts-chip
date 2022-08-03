"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vm = void 0;
const bit_array_1 = require("./bit-array");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
class Vm {
    constructor({ program, input, logger }) {
        this.memory = new Uint8Array(constants_1.MEMORY_SIZE);
        this.display = new bit_array_1.BitArray(constants_1.DISPLAY_SIZE);
        this.registers = new Uint8Array(constants_1.REGISTER_COUNT);
        this.registerI = 0;
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.pc = constants_1.PROGRAM_START;
        this.sp = -1;
        this.stack = [];
        this.operations = [
            {
                condition: instruction => (0, utils_1.toHex)(instruction) === '00e0',
                operation: this.clear,
            },
            {
                condition: instruction => (0, utils_1.toHex)(instruction) === '00ee',
                operation: this.return,
            },
            {
                condition: instruction => instruction[0] === 1,
                operation: this.jumpAddress,
            },
            {
                condition: instruction => instruction[0] === 2,
                operation: this.call,
            },
            {
                condition: instruction => instruction[0] === 3,
                operation: this.skipEqualValue,
            },
            {
                condition: instruction => instruction[0] === 4,
                operation: this.skipNotEqualValue,
            },
            {
                condition: instruction => instruction[0] === 5,
                operation: this.skipEqualRegister,
            },
            {
                condition: instruction => instruction[0] === 6,
                operation: this.loadValue,
            },
            {
                condition: instruction => instruction[0] === 7,
                operation: this.add,
            },
            {
                condition: instruction => instruction[0] === 8 && instruction[3] === 0,
                operation: this.loadRegister,
            },
            {
                condition: instruction => instruction[0] === 8 && instruction[3] === 1,
                operation: this.or,
            },
            {
                condition: instruction => instruction[0] === 8 && instruction[3] === 2,
                operation: this.and,
            },
            {
                condition: instruction => instruction[0] === 8 && instruction[3] === 3,
                operation: this.xor,
            },
            {
                condition: instruction => instruction[0] === 8 && instruction[3] === 4,
                operation: this.addCarry,
            },
            {
                condition: instruction => instruction[0] === 8 && instruction[3] === 5,
                operation: this.sub,
            },
            {
                condition: instruction => instruction[0] === 8 && instruction[3] === 6,
                operation: this.shiftRight,
            },
            {
                condition: instruction => instruction[0] === 8 && instruction[3] === 7,
                operation: this.subNegative,
            },
            {
                condition: instruction => instruction[0] === 8 && instruction[3] === 0xe,
                operation: this.shiftLeft,
            },
            {
                condition: instruction => instruction[0] === 9,
                operation: this.skipNotEqualRegister,
            },
            {
                condition: instruction => instruction[0] === 0xa,
                operation: this.loadI,
            },
            {
                condition: instruction => instruction[0] === 0xb,
                operation: this.jumpRelativeAddress,
            },
            {
                condition: instruction => instruction[0] === 0xc,
                operation: this.random,
            },
            {
                condition: instruction => instruction[0] === 0xd,
                operation: this.draw,
            },
            {
                condition: instruction => instruction[0] === 0xe &&
                    instruction[2] === 9 &&
                    instruction[3] === 0xe,
                operation: this.skipPressed,
            },
            {
                condition: instruction => instruction[0] === 0xe &&
                    instruction[2] === 0xa &&
                    instruction[3] === 1,
                operation: this.skipNotPressed,
            },
            {
                condition: instruction => instruction[0] === 0xf && instruction[2] === 0 && instruction[3] === 7,
                operation: this.loadDelayTimer,
            },
            {
                condition: instruction => instruction[0] === 0xf &&
                    instruction[2] === 0 &&
                    instruction[3] === 0xa,
                operation: this.waitPressed,
            },
            {
                condition: instruction => instruction[0] === 0xf && instruction[2] === 1 && instruction[3] === 5,
                operation: this.setDelayTimer,
            },
            {
                condition: instruction => instruction[0] === 0xf && instruction[2] === 1 && instruction[3] === 8,
                operation: this.setSoundTimer,
            },
            {
                condition: instruction => instruction[0] === 0xf &&
                    instruction[2] === 1 &&
                    instruction[3] === 0xe,
                operation: this.addI,
            },
            {
                condition: instruction => instruction[0] === 0xf && instruction[2] === 2 && instruction[3] === 9,
                operation: this.loadISprite,
            },
            {
                condition: instruction => instruction[0] === 0xf && instruction[2] === 3 && instruction[3] === 3,
                operation: this.loadIBcd,
            },
            {
                condition: instruction => instruction[0] === 0xf && instruction[2] === 5 && instruction[3] === 5,
                operation: this.loadIRegisters,
            },
            {
                condition: instruction => instruction[0] === 0xf && instruction[2] === 6 && instruction[3] === 5,
                operation: this.loadRegistersI,
            },
        ];
        for (let i = 0; i < constants_1.FONT_DATA.length; i++) {
            this.memory[i] = constants_1.FONT_DATA[i];
        }
        for (let i = 0; i < program.length; i++) {
            this.memory[constants_1.PROGRAM_START + i] = program.readUint8(i);
        }
        this.input = input;
        this.logger = logger;
    }
    async executeInstruction() {
        const instruction = this.fetchInstruction();
        const operation = this.operations.find(({ condition }) => condition(instruction))?.operation;
        if (!operation) {
            this.logger?.warn('Unknown instruction: ', (0, utils_1.toHex)(instruction));
            return;
        }
        await operation.bind(this)(instruction);
    }
    fetchInstruction() {
        if (this.pc >= constants_1.MEMORY_SIZE) {
            throw new Error('Program counter has reached the end of the memory.');
        }
        const byte1 = this.memory[this.pc++];
        const byte2 = this.memory[this.pc++];
        return [
            (0, utils_1.getHigherNibble)(byte1),
            (0, utils_1.getLowerNibble)(byte1),
            (0, utils_1.getHigherNibble)(byte2),
            (0, utils_1.getLowerNibble)(byte2),
        ];
    }
    clear() {
        this.display = new bit_array_1.BitArray(constants_1.DISPLAY_WIDTH * constants_1.DISPLAY_HEIGHT);
    }
    return() {
        if (this.sp < 0) {
            throw new Error('The stack is empty. Cannot return.');
        }
        const address = this.stack[this.sp--];
        this.pc = address;
    }
    jumpAddress(instruction) {
        const address = (0, utils_1.joinNibbles)(instruction.slice(1));
        this.pc = address;
    }
    call(instruction) {
        const address = (0, utils_1.joinNibbles)(instruction.slice(1));
        this.stack[++this.sp] = this.pc;
        this.pc = address;
    }
    skipEqualValue(instruction) {
        const register = instruction[1];
        const value = (0, utils_1.joinNibbles)(instruction.slice(2));
        if (this.registers[register] === value) {
            this.pc += 2;
        }
    }
    skipNotEqualValue(instruction) {
        const register = instruction[1];
        const value = (0, utils_1.joinNibbles)(instruction.slice(2));
        if (this.registers[register] !== value) {
            this.pc += 2;
        }
    }
    skipEqualRegister(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        if (this.registers[register1] === this.registers[register2]) {
            this.pc += 2;
        }
    }
    loadValue(instruction) {
        const register = instruction[1];
        const value = (0, utils_1.joinNibbles)(instruction.slice(2));
        this.registers[register] = value;
    }
    add(instruction) {
        const register = instruction[1];
        const value = (0, utils_1.joinNibbles)(instruction.slice(2));
        const sum = this.registers[register] + value;
        this.registers[register] = (0, utils_1.mod)(sum, constants_1.BYTE_SIZE);
    }
    loadRegister(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        this.registers[register1] = this.registers[register2];
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
    addCarry(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const sum = this.registers[register1] + this.registers[register2];
        this.registers[constants_1.FLAG_REGISTER] = sum >= constants_1.BYTE_SIZE ? 1 : 0;
        this.registers[register1] = (0, utils_1.mod)(sum, constants_1.BYTE_SIZE);
    }
    sub(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const difference = this.registers[register1] - this.registers[register2];
        this.registers[constants_1.FLAG_REGISTER] = difference > 0 ? 1 : 0;
        this.registers[register1] = (0, utils_1.mod)(difference, constants_1.BYTE_SIZE);
    }
    shiftRight(instruction) {
        const register = instruction[1];
        this.registers[constants_1.FLAG_REGISTER] = this.registers[register] & 1;
        this.registers[register] >>= 1;
    }
    subNegative(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const difference = this.registers[register2] - this.registers[register1];
        this.registers[constants_1.FLAG_REGISTER] = difference > 0 ? 1 : 0;
        this.registers[register1] = (0, utils_1.mod)(difference, constants_1.BYTE_SIZE);
    }
    shiftLeft(instruction) {
        const register = instruction[1];
        this.registers[constants_1.FLAG_REGISTER] = (0, utils_1.getNthBit)(this.registers[register], 0);
        this.registers[register] = (this.registers[register] << 1) & 0xff;
    }
    skipNotEqualRegister(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        if (this.registers[register1] !== this.registers[register2]) {
            this.pc += 2;
        }
    }
    loadI(instruction) {
        const value = (0, utils_1.joinNibbles)(instruction.slice(1));
        this.registerI = value;
    }
    jumpRelativeAddress(instruction) {
        const address = (0, utils_1.joinNibbles)(instruction.slice(1));
        this.pc = (0, utils_1.mod)(this.registers[0] + address, constants_1.MEMORY_SIZE);
    }
    random(instruction) {
        const register = instruction[1];
        const value = (0, utils_1.joinNibbles)(instruction.slice(2));
        this.registers[register] = (0, utils_1.getRandomInt)(constants_1.BYTE_SIZE) & value;
    }
    draw(instruction) {
        const originX = (0, utils_1.mod)(this.registers[instruction[1]], constants_1.DISPLAY_WIDTH);
        const originY = (0, utils_1.mod)(this.registers[instruction[2]], constants_1.DISPLAY_HEIGHT);
        const height = instruction[3];
        let isCollision = false;
        for (let dy = 0; dy < height; dy++) {
            const spriteByte = this.memory[this.registerI + dy];
            for (let dx = 0; dx < constants_1.BYTE_LENGTH; dx++) {
                const x = originX + dx;
                const y = originY + dy;
                if (x >= constants_1.DISPLAY_WIDTH || y >= constants_1.DISPLAY_HEIGHT) {
                    continue;
                }
                const spriteValue = (0, utils_1.getNthBit)(spriteByte, dx);
                const currentCollision = this.display.xor(y * constants_1.DISPLAY_WIDTH + x, spriteValue);
                isCollision ||= currentCollision;
            }
        }
        this.registers[constants_1.FLAG_REGISTER] = isCollision ? 1 : 0;
    }
    skipPressed(instruction) {
        const registerValue = this.registers[instruction[1]];
        const pressedKeys = this.input.getInput();
        if (pressedKeys.has(registerValue)) {
            this.pc += 2;
        }
    }
    skipNotPressed(instruction) {
        const registerValue = this.registers[instruction[1]];
        const pressedKeys = this.input.getInput();
        if (!pressedKeys.has(registerValue)) {
            this.pc += 2;
        }
    }
    loadDelayTimer(instruction) {
        const register = instruction[1];
        this.registers[register] = this.delayTimer;
    }
    async waitPressed(instruction) {
        const register = instruction[1];
        const pressedKey = await this.input.waitInput();
        this.registers[register] = pressedKey;
    }
    setDelayTimer(instruction) {
        const register = instruction[1];
        this.delayTimer = this.registers[register];
    }
    setSoundTimer(instruction) {
        const register = instruction[1];
        this.soundTimer = this.registers[register];
    }
    addI(instruction) {
        const register = instruction[1];
        this.registerI = (0, utils_1.mod)(this.registerI + this.registers[register], constants_1.MEMORY_SIZE);
    }
    loadISprite(instruction) {
        const register = instruction[1];
        this.registerI = this.registers[register] * 5;
    }
    loadIBcd(instruction) {
        let registerValue = this.registers[instruction[1]];
        const bcd = (0, utils_1.getBcd)(registerValue, 3);
        this.memory[this.registerI] = bcd[0];
        this.memory[this.registerI + 1] = bcd[1];
        this.memory[this.registerI + 2] = bcd[2];
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
exports.Vm = Vm;
//# sourceMappingURL=vm.js.map