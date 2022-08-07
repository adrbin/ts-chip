"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chip8Vm = void 0;
const constants_1 = require("./constants");
const display_1 = require("./display");
const utils_1 = require("./utils");
class Chip8Vm {
    constructor({ program, input, logger, storage }) {
        this.memory = new Uint8Array(constants_1.MEMORY_SIZE);
        this.display = (0, display_1.createDisplay)(constants_1.DISPLAY_WIDTH, constants_1.DISPLAY_HEIGHT);
        this.registers = new Uint8Array(constants_1.REGISTER_COUNT);
        this.registerI = 0;
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.pc = constants_1.PROGRAM_START;
        this.sp = -1;
        this.stack = [];
        this.isHalted = false;
        this.operations = [
            [instruction => (0, utils_1.matchInstruction)(instruction, '00e0'), this.clear],
            [instruction => (0, utils_1.matchInstruction)(instruction, '00EE'), this.return],
            [instruction => (0, utils_1.matchInstruction)(instruction, '1xxx'), this.jumpAddress],
            [instruction => (0, utils_1.matchInstruction)(instruction, '2xxx'), this.call],
            [instruction => (0, utils_1.matchInstruction)(instruction, '3xxx'), this.skipEqualValue],
            [
                instruction => (0, utils_1.matchInstruction)(instruction, '4xxx'),
                this.skipNotEqualValue,
            ],
            [
                instruction => (0, utils_1.matchInstruction)(instruction, '5xxx'),
                this.skipEqualRegister,
            ],
            [instruction => (0, utils_1.matchInstruction)(instruction, '6xxx'), this.loadValue],
            [instruction => (0, utils_1.matchInstruction)(instruction, '7xxx'), this.add],
            [instruction => (0, utils_1.matchInstruction)(instruction, '8xx0'), this.loadRegister],
            [instruction => (0, utils_1.matchInstruction)(instruction, '8xx1'), this.or],
            [instruction => (0, utils_1.matchInstruction)(instruction, '8xx2'), this.and],
            [instruction => (0, utils_1.matchInstruction)(instruction, '8xx3'), this.xor],
            [instruction => (0, utils_1.matchInstruction)(instruction, '8xx4'), this.addCarry],
            [instruction => (0, utils_1.matchInstruction)(instruction, '8xx5'), this.sub],
            [instruction => (0, utils_1.matchInstruction)(instruction, '8xx6'), this.shiftRight],
            [instruction => (0, utils_1.matchInstruction)(instruction, '8xx7'), this.subNegative],
            [instruction => (0, utils_1.matchInstruction)(instruction, '8xxE'), this.shiftLeft],
            [
                instruction => (0, utils_1.matchInstruction)(instruction, '9xxx'),
                this.skipNotEqualRegister,
            ],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Axxx'), this.loadI],
            [
                instruction => (0, utils_1.matchInstruction)(instruction, 'Bxxx'),
                this.jumpRelativeAddress,
            ],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Cxxx'), this.random],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Dxxx'), this.draw],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Ex9E'), this.skipPressed],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'ExA1'), this.skipNotPressed],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx07'), this.loadDelayTimer],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx0A'), this.waitPressed],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx15'), this.setDelayTimer],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx18'), this.setSoundTimer],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx1E'), this.addI],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx29'), this.loadISprite],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx33'), this.loadIBcd],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx55'), this.loadIRegisters],
            [instruction => (0, utils_1.matchInstruction)(instruction, 'Fx65'), this.loadRegistersI],
        ];
        for (let i = 0; i < constants_1.FONT_DATA.length; i++) {
            this.memory[i] = constants_1.FONT_DATA[i];
        }
        for (let i = 0; i < program.length; i++) {
            this.memory[constants_1.PROGRAM_START + i] = program.readUint8(i);
        }
        this.input = input;
        this.logger = logger;
        this.storage = storage;
    }
    async executeInstruction() {
        const instruction = this.fetchInstruction();
        const [_, operation] = this.operations.find(([condition]) => condition(instruction)) ?? [];
        if (!operation) {
            this.logger?.warn('Unknown instruction: ', (0, utils_1.toHex)(instruction));
            return;
        }
        await operation.bind(this)(instruction);
    }
    fetchInstruction() {
        if (this.isHalted) {
            throw new Error('The program is halted.');
        }
        if (this.pc >= constants_1.MEMORY_SIZE - 1) {
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
        this.display = (0, display_1.createDisplay)(this.display.width, this.display.height);
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
        this.registers[constants_1.FLAG_REGISTER] = 0;
    }
    and(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        this.registers[register1] &= this.registers[register2];
        this.registers[constants_1.FLAG_REGISTER] = 0;
    }
    xor(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        this.registers[register1] ^= this.registers[register2];
        this.registers[constants_1.FLAG_REGISTER] = 0;
    }
    addCarry(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const sum = this.registers[register1] + this.registers[register2];
        this.registers[register1] = (0, utils_1.mod)(sum, constants_1.BYTE_SIZE);
        this.registers[constants_1.FLAG_REGISTER] = sum >= constants_1.BYTE_SIZE ? 1 : 0;
    }
    sub(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const difference = this.registers[register1] - this.registers[register2];
        this.registers[register1] = (0, utils_1.mod)(difference, constants_1.BYTE_SIZE);
        this.registers[constants_1.FLAG_REGISTER] = difference > 0 ? 1 : 0;
    }
    shiftRight(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const flag = this.registers[register2] & 1;
        this.registers[register1] = this.registers[register2] >> 1;
        this.registers[constants_1.FLAG_REGISTER] = flag;
    }
    subNegative(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const difference = this.registers[register2] - this.registers[register1];
        this.registers[register1] = (0, utils_1.mod)(difference, constants_1.BYTE_SIZE);
        this.registers[constants_1.FLAG_REGISTER] = difference > 0 ? 1 : 0;
    }
    shiftLeft(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const flag = (0, utils_1.getNthBit)(this.registers[register2], 0);
        this.registers[register1] = (this.registers[register2] << 1) & 0xff;
        this.registers[constants_1.FLAG_REGISTER] = flag;
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
        const originX = (0, utils_1.mod)(this.registers[instruction[1]], this.display.width);
        const originY = (0, utils_1.mod)(this.registers[instruction[2]], this.display.height);
        const height = instruction[3];
        let isCollision = false;
        for (let dy = 0; dy < height; dy++) {
            const spriteByte = this.memory[this.registerI + dy];
            for (let dx = 0; dx < constants_1.BYTE_LENGTH; dx++) {
                const x = originX + dx;
                const y = originY + dy;
                if (x >= this.display.width || y >= this.display.height) {
                    continue;
                }
                const spriteValue = (0, utils_1.getNthBit)(spriteByte, dx);
                const isCurrentCollision = this.display.display.xor(y * this.display.width + x, spriteValue);
                isCollision ||= isCurrentCollision;
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
        this.registerI = constants_1.FONT_DATA_START + this.registers[register] * 5;
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
            this.memory[this.registerI++] = this.registers[i];
        }
    }
    loadRegistersI(instruction) {
        let maxRegister = instruction[1];
        for (let i = 0; i <= maxRegister; i++) {
            this.registers[i] = this.memory[this.registerI++];
        }
    }
}
exports.Chip8Vm = Chip8Vm;
//# sourceMappingURL=chip8-vm.js.map