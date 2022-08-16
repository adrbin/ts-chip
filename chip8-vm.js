import { BYTE_LENGTH, BYTE_SIZE, DISPLAY_HEIGHT, DISPLAY_WIDTH, FLAG_REGISTER, FONT_DATA, FONT_DATA_START, MEMORY_SIZE, PROGRAM_START, REGISTER_COUNT, } from './constants.js';
import { createDisplay } from './display.js';
import { getBcd, getHigherNibble, getLowerNibble, getNthBit, getRandomInt, joinNibbles, matchInstruction, mod, toHex, } from './utils.js';
export class Chip8Vm {
    memory = new Uint8Array(MEMORY_SIZE);
    display = createDisplay(DISPLAY_WIDTH, DISPLAY_HEIGHT);
    registers = new Uint8Array(REGISTER_COUNT);
    registerI = 0;
    delayTimer = 0;
    soundTimer = 0;
    pc = PROGRAM_START;
    sp = -1;
    stack = [];
    isHalted = false;
    input;
    logger;
    storage;
    operations = [
        [instruction => matchInstruction(instruction, '00e0'), this.clear],
        [instruction => matchInstruction(instruction, '00EE'), this.return],
        [instruction => matchInstruction(instruction, '1xxx'), this.jumpAddress],
        [instruction => matchInstruction(instruction, '2xxx'), this.call],
        [instruction => matchInstruction(instruction, '3xxx'), this.skipEqualValue],
        [
            instruction => matchInstruction(instruction, '4xxx'),
            this.skipNotEqualValue,
        ],
        [
            instruction => matchInstruction(instruction, '5xxx'),
            this.skipEqualRegister,
        ],
        [instruction => matchInstruction(instruction, '6xxx'), this.loadValue],
        [instruction => matchInstruction(instruction, '7xxx'), this.add],
        [instruction => matchInstruction(instruction, '8xx0'), this.loadRegister],
        [instruction => matchInstruction(instruction, '8xx1'), this.or],
        [instruction => matchInstruction(instruction, '8xx2'), this.and],
        [instruction => matchInstruction(instruction, '8xx3'), this.xor],
        [instruction => matchInstruction(instruction, '8xx4'), this.addCarry],
        [instruction => matchInstruction(instruction, '8xx5'), this.sub],
        [instruction => matchInstruction(instruction, '8xx6'), this.shiftRight],
        [instruction => matchInstruction(instruction, '8xx7'), this.subNegative],
        [instruction => matchInstruction(instruction, '8xxE'), this.shiftLeft],
        [
            instruction => matchInstruction(instruction, '9xxx'),
            this.skipNotEqualRegister,
        ],
        [instruction => matchInstruction(instruction, 'Axxx'), this.loadI],
        [
            instruction => matchInstruction(instruction, 'Bxxx'),
            this.jumpRelativeAddress,
        ],
        [instruction => matchInstruction(instruction, 'Cxxx'), this.random],
        [instruction => matchInstruction(instruction, 'Dxxx'), this.draw],
        [instruction => matchInstruction(instruction, 'Ex9E'), this.skipPressed],
        [instruction => matchInstruction(instruction, 'ExA1'), this.skipNotPressed],
        [instruction => matchInstruction(instruction, 'Fx07'), this.loadDelayTimer],
        [instruction => matchInstruction(instruction, 'Fx0A'), this.waitPressed],
        [instruction => matchInstruction(instruction, 'Fx15'), this.setDelayTimer],
        [instruction => matchInstruction(instruction, 'Fx18'), this.setSoundTimer],
        [instruction => matchInstruction(instruction, 'Fx1E'), this.addI],
        [instruction => matchInstruction(instruction, 'Fx29'), this.loadISprite],
        [instruction => matchInstruction(instruction, 'Fx33'), this.loadIBcd],
        [instruction => matchInstruction(instruction, 'Fx55'), this.loadIRegisters],
        [instruction => matchInstruction(instruction, 'Fx65'), this.loadRegistersI],
    ];
    constructor({ program, input, logger, storage }) {
        for (let i = 0; i < FONT_DATA.length; i++) {
            this.memory[i] = FONT_DATA[i];
        }
        for (let i = 0; i < program.length; i++) {
            this.memory[PROGRAM_START + i] = program.readUint8(i);
        }
        this.input = input;
        this.logger = logger;
        this.storage = storage;
    }
    async executeInstruction() {
        const instruction = this.fetchInstruction();
        const [_, operation] = this.operations.find(([condition]) => condition(instruction)) ?? [];
        if (!operation) {
            this.logger?.warn('Unknown instruction: ', toHex(instruction));
            return;
        }
        await operation.bind(this)(instruction);
    }
    fetchInstruction() {
        if (this.isHalted) {
            throw new Error('The program is halted.');
        }
        if (this.pc >= MEMORY_SIZE - 1) {
            throw new Error('Program counter has reached the end of the memory.');
        }
        const byte1 = this.memory[this.pc++];
        const byte2 = this.memory[this.pc++];
        return [
            getHigherNibble(byte1),
            getLowerNibble(byte1),
            getHigherNibble(byte2),
            getLowerNibble(byte2),
        ];
    }
    clear() {
        this.display = createDisplay(this.display.width, this.display.height);
    }
    return() {
        if (this.sp < 0) {
            throw new Error('The stack is empty. Cannot return.');
        }
        const address = this.stack[this.sp--];
        this.pc = address;
    }
    jumpAddress(instruction) {
        const address = joinNibbles(instruction.slice(1));
        this.pc = address;
    }
    call(instruction) {
        const address = joinNibbles(instruction.slice(1));
        this.stack[++this.sp] = this.pc;
        this.pc = address;
    }
    skipEqualValue(instruction) {
        const register = instruction[1];
        const value = joinNibbles(instruction.slice(2));
        if (this.registers[register] === value) {
            this.pc += 2;
        }
    }
    skipNotEqualValue(instruction) {
        const register = instruction[1];
        const value = joinNibbles(instruction.slice(2));
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
        const value = joinNibbles(instruction.slice(2));
        this.registers[register] = value;
    }
    add(instruction) {
        const register = instruction[1];
        const value = joinNibbles(instruction.slice(2));
        const sum = this.registers[register] + value;
        this.registers[register] = mod(sum, BYTE_SIZE);
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
        this.registers[FLAG_REGISTER] = 0;
    }
    and(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        this.registers[register1] &= this.registers[register2];
        this.registers[FLAG_REGISTER] = 0;
    }
    xor(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        this.registers[register1] ^= this.registers[register2];
        this.registers[FLAG_REGISTER] = 0;
    }
    addCarry(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const sum = this.registers[register1] + this.registers[register2];
        this.registers[register1] = mod(sum, BYTE_SIZE);
        this.registers[FLAG_REGISTER] = sum >= BYTE_SIZE ? 1 : 0;
    }
    sub(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const difference = this.registers[register1] - this.registers[register2];
        this.registers[register1] = mod(difference, BYTE_SIZE);
        this.registers[FLAG_REGISTER] = difference > 0 ? 1 : 0;
    }
    shiftRight(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const flag = this.registers[register2] & 1;
        this.registers[register1] = this.registers[register2] >> 1;
        this.registers[FLAG_REGISTER] = flag;
    }
    subNegative(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const difference = this.registers[register2] - this.registers[register1];
        this.registers[register1] = mod(difference, BYTE_SIZE);
        this.registers[FLAG_REGISTER] = difference > 0 ? 1 : 0;
    }
    shiftLeft(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        const flag = getNthBit(this.registers[register2], 0);
        this.registers[register1] = (this.registers[register2] << 1) & 0xff;
        this.registers[FLAG_REGISTER] = flag;
    }
    skipNotEqualRegister(instruction) {
        const register1 = instruction[1];
        const register2 = instruction[2];
        if (this.registers[register1] !== this.registers[register2]) {
            this.pc += 2;
        }
    }
    loadI(instruction) {
        const value = joinNibbles(instruction.slice(1));
        this.registerI = value;
    }
    jumpRelativeAddress(instruction) {
        const address = joinNibbles(instruction.slice(1));
        this.pc = mod(this.registers[0] + address, MEMORY_SIZE);
    }
    random(instruction) {
        const register = instruction[1];
        const value = joinNibbles(instruction.slice(2));
        this.registers[register] = getRandomInt(BYTE_SIZE) & value;
    }
    draw(instruction) {
        const originX = mod(this.registers[instruction[1]], this.display.width);
        const originY = mod(this.registers[instruction[2]], this.display.height);
        const height = instruction[3];
        let isCollision = false;
        for (let dy = 0; dy < height; dy++) {
            const spriteByte = this.memory[this.registerI + dy];
            for (let dx = 0; dx < BYTE_LENGTH; dx++) {
                const x = originX + dx;
                const y = originY + dy;
                if (x >= this.display.width || y >= this.display.height) {
                    continue;
                }
                const spriteValue = getNthBit(spriteByte, dx);
                const isCurrentCollision = this.display.display.xor(y * this.display.width + x, spriteValue);
                isCollision ||= isCurrentCollision;
            }
        }
        this.registers[FLAG_REGISTER] = isCollision ? 1 : 0;
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
        this.registerI = mod(this.registerI + this.registers[register], MEMORY_SIZE);
    }
    loadISprite(instruction) {
        const register = instruction[1];
        this.registerI = FONT_DATA_START + this.registers[register] * 5;
    }
    loadIBcd(instruction) {
        let registerValue = this.registers[instruction[1]];
        const bcd = getBcd(registerValue, 3);
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
//# sourceMappingURL=chip8-vm.js.map