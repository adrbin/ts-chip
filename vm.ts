import { BitArray } from './bit-array';
import {
  BYTE_LENGTH,
  BYTE_SIZE,
  DISPLAY_HEIGHT,
  DISPLAY_SIZE,
  DISPLAY_WIDTH,
  FLAG_REGISTER,
  FONT_DATA,
  MEMORY_SIZE,
  PROGRAM_START,
  REGISTER_COUNT,
} from './constants';
import {
  getBcd,
  getHigherNibble,
  getLowerNibble,
  getNthBit,
  getRandomInt,
  joinNibbles,
  mod,
  toHex,
} from './utils';

type InstructionArray = [number, number, number, number];

interface InstructionCondition {
  condition: (instruction: InstructionArray) => boolean;
  operation: (instruction: InstructionArray) => Promise<void> | void;
}

export type InputCallback = () => Set<number>;
export type WaitInputCallback = () => Promise<number>;

export interface Input {
  getInput: InputCallback;
  waitInput: WaitInputCallback;
}

export interface VmParams {
  program: Buffer;
  input: Input;
  logger?: Console;
}

export class Vm {
  memory = new Uint8Array(MEMORY_SIZE);
  display = new BitArray(DISPLAY_SIZE);
  registers = new Uint8Array(REGISTER_COUNT);
  registerI = 0;
  delayTimer = 0;
  soundTimer = 0;
  pc = PROGRAM_START;
  sp = -1;
  stack: number[] = [];
  logger?: Console;
  input: Input;

  operations: InstructionCondition[] = [
    {
      condition: instruction => toHex(instruction) === '00e0',
      operation: this.clear,
    },
    {
      condition: instruction => toHex(instruction) === '00ee',
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
      condition: instruction =>
        instruction[0] === 0xe &&
        instruction[2] === 9 &&
        instruction[3] === 0xe,
      operation: this.skipPressed,
    },
    {
      condition: instruction =>
        instruction[0] === 0xe &&
        instruction[2] === 0xa &&
        instruction[3] === 1,
      operation: this.skipNotPressed,
    },
    {
      condition: instruction =>
        instruction[0] === 0xf && instruction[2] === 0 && instruction[3] === 7,
      operation: this.loadDelayTimer,
    },
    {
      condition: instruction =>
        instruction[0] === 0xf &&
        instruction[2] === 0 &&
        instruction[3] === 0xa,
      operation: this.waitPressed,
    },
    {
      condition: instruction =>
        instruction[0] === 0xf && instruction[2] === 1 && instruction[3] === 5,
      operation: this.setDelayTimer,
    },
    {
      condition: instruction =>
        instruction[0] === 0xf && instruction[2] === 1 && instruction[3] === 8,
      operation: this.setSoundTimer,
    },
    {
      condition: instruction =>
        instruction[0] === 0xf &&
        instruction[2] === 1 &&
        instruction[3] === 0xe,
      operation: this.addI,
    },
    {
      condition: instruction =>
        instruction[0] === 0xf && instruction[2] === 2 && instruction[3] === 9,
      operation: this.loadISprite,
    },
    {
      condition: instruction =>
        instruction[0] === 0xf && instruction[2] === 3 && instruction[3] === 3,
      operation: this.loadIBcd,
    },
    {
      condition: instruction =>
        instruction[0] === 0xf && instruction[2] === 5 && instruction[3] === 5,
      operation: this.loadIRegisters,
    },
    {
      condition: instruction =>
        instruction[0] === 0xf && instruction[2] === 6 && instruction[3] === 5,
      operation: this.loadRegistersI,
    },
  ];

  constructor({ program, input, logger }: VmParams) {
    for (let i = 0; i < FONT_DATA.length; i++) {
      this.memory[i] = FONT_DATA[i];
    }

    for (let i = 0; i < program.length; i++) {
      this.memory[PROGRAM_START + i] = program.readUint8(i);
    }

    this.input = input;
    this.logger = logger;
  }

  async executeInstruction() {
    const instruction = this.fetchInstruction();
    const operation = this.operations.find(({ condition }) =>
      condition(instruction),
    )?.operation;

    if (!operation) {
      this.logger?.warn('Unknown instruction: ', toHex(instruction));
      return;
    }

    await operation.bind(this)(instruction);
  }

  fetchInstruction(): InstructionArray {
    if (this.pc >= MEMORY_SIZE) {
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
    this.display = new BitArray(DISPLAY_WIDTH * DISPLAY_HEIGHT);
  }

  return() {
    if (this.sp < 0) {
      throw new Error('The stack is empty. Cannot return.');
    }
    const address = this.stack[this.sp--];

    this.pc = address;
  }

  jumpAddress(instruction: InstructionArray) {
    const address = joinNibbles(instruction.slice(1));
    this.pc = address;
  }

  call(instruction: InstructionArray) {
    const address = joinNibbles(instruction.slice(1));
    this.stack[++this.sp] = this.pc;
    this.pc = address;
  }

  skipEqualValue(instruction: InstructionArray) {
    const register = instruction[1];
    const value = joinNibbles(instruction.slice(2));
    if (this.registers[register] === value) {
      this.pc += 2;
    }
  }

  skipNotEqualValue(instruction: InstructionArray) {
    const register = instruction[1];
    const value = joinNibbles(instruction.slice(2));
    if (this.registers[register] !== value) {
      this.pc += 2;
    }
  }

  skipEqualRegister(instruction: InstructionArray) {
    const register1 = instruction[1];
    const register2 = instruction[2];
    if (this.registers[register1] === this.registers[register2]) {
      this.pc += 2;
    }
  }

  loadValue(instruction: InstructionArray) {
    const register = instruction[1];
    const value = joinNibbles(instruction.slice(2));
    this.registers[register] = value;
  }

  add(instruction: InstructionArray) {
    const register = instruction[1];
    const value = joinNibbles(instruction.slice(2));
    const sum = this.registers[register] + value;
    this.registers[register] = mod(sum, BYTE_SIZE);
  }

  loadRegister(instruction: InstructionArray) {
    const register1 = instruction[1];
    const register2 = instruction[2];
    this.registers[register1] = this.registers[register2];
  }

  or(instruction: InstructionArray) {
    const register1 = instruction[1];
    const register2 = instruction[2];
    this.registers[register1] |= this.registers[register2];
  }

  and(instruction: InstructionArray) {
    const register1 = instruction[1];
    const register2 = instruction[2];
    this.registers[register1] &= this.registers[register2];
  }

  xor(instruction: InstructionArray) {
    const register1 = instruction[1];
    const register2 = instruction[2];
    this.registers[register1] ^= this.registers[register2];
  }

  addCarry(instruction: InstructionArray) {
    const register1 = instruction[1];
    const register2 = instruction[2];
    const sum = this.registers[register1] + this.registers[register2];
    this.registers[FLAG_REGISTER] = sum >= BYTE_SIZE ? 1 : 0;
    this.registers[register1] = mod(sum, BYTE_SIZE);
  }

  sub(instruction: InstructionArray) {
    const register1 = instruction[1];
    const register2 = instruction[2];
    const difference = this.registers[register1] - this.registers[register2];
    this.registers[FLAG_REGISTER] = difference > 0 ? 1 : 0;
    this.registers[register1] = mod(difference, BYTE_SIZE);
  }

  shiftRight(instruction: InstructionArray) {
    const register = instruction[1];
    this.registers[FLAG_REGISTER] = this.registers[register] & 1;
    this.registers[register] >>= 1;
  }

  subNegative(instruction: InstructionArray) {
    const register1 = instruction[1];
    const register2 = instruction[2];
    const difference = this.registers[register2] - this.registers[register1];
    this.registers[FLAG_REGISTER] = difference > 0 ? 1 : 0;
    this.registers[register1] = mod(difference, BYTE_SIZE);
  }

  shiftLeft(instruction: InstructionArray) {
    const register = instruction[1];
    this.registers[FLAG_REGISTER] = getNthBit(this.registers[register], 0);
    this.registers[register] = (this.registers[register] << 1) & 0xff;
  }

  skipNotEqualRegister(instruction: InstructionArray) {
    const register1 = instruction[1];
    const register2 = instruction[2];
    if (this.registers[register1] !== this.registers[register2]) {
      this.pc += 2;
    }
  }

  loadI(instruction: InstructionArray) {
    const value = joinNibbles(instruction.slice(1));
    this.registerI = value;
  }

  jumpRelativeAddress(instruction: InstructionArray) {
    const address = joinNibbles(instruction.slice(1));
    this.pc = mod(this.registers[0] + address, MEMORY_SIZE);
  }

  random(instruction: InstructionArray) {
    const register = instruction[1];
    const value = joinNibbles(instruction.slice(2));
    this.registers[register] = getRandomInt(BYTE_SIZE) & value;
  }

  draw(instruction: InstructionArray) {
    const originX = mod(this.registers[instruction[1]], DISPLAY_WIDTH);
    const originY = mod(this.registers[instruction[2]], DISPLAY_HEIGHT);
    const height = instruction[3];

    let isCollision = false;

    for (let dy = 0; dy < height; dy++) {
      const spriteByte = this.memory[this.registerI + dy];
      for (let dx = 0; dx < BYTE_LENGTH; dx++) {
        const x = originX + dx;
        const y = originY + dy;
        if (x >= DISPLAY_WIDTH || y >= DISPLAY_HEIGHT) {
          continue;
        }
        const spriteValue = getNthBit(spriteByte, dx);
        const currentCollision = this.display.xor(
          y * DISPLAY_WIDTH + x,
          spriteValue,
        );
        isCollision ||= currentCollision;
      }
    }

    this.registers[FLAG_REGISTER] = isCollision ? 1 : 0;
  }

  skipPressed(instruction: InstructionArray) {
    const registerValue = this.registers[instruction[1]];
    const pressedKeys = this.input.getInput();
    if (pressedKeys.has(registerValue)) {
      this.pc += 2;
    }
  }

  skipNotPressed(instruction: InstructionArray) {
    const registerValue = this.registers[instruction[1]];
    const pressedKeys = this.input.getInput();
    if (!pressedKeys.has(registerValue)) {
      this.pc += 2;
    }
  }

  loadDelayTimer(instruction: InstructionArray) {
    const register = instruction[1];
    this.registers[register] = this.delayTimer;
  }

  async waitPressed(instruction: InstructionArray) {
    const register = instruction[1];
    const pressedKey = await this.input.waitInput();
    this.registers[register] = pressedKey;
  }

  setDelayTimer(instruction: InstructionArray) {
    const register = instruction[1];
    this.delayTimer = this.registers[register];
  }

  setSoundTimer(instruction: InstructionArray) {
    const register = instruction[1];
    this.soundTimer = this.registers[register];
  }

  addI(instruction: InstructionArray) {
    const register = instruction[1];
    this.registerI = mod(
      this.registerI + this.registers[register],
      MEMORY_SIZE,
    );
  }

  loadISprite(instruction: InstructionArray) {
    const register = instruction[1];
    this.registerI = this.registers[register] * 5;
  }

  loadIBcd(instruction: InstructionArray) {
    let registerValue = this.registers[instruction[1]];
    const bcd = getBcd(registerValue, 3);

    this.memory[this.registerI] = bcd[0];
    this.memory[this.registerI + 1] = bcd[1];
    this.memory[this.registerI + 2] = bcd[2];
  }

  loadIRegisters(instruction: InstructionArray) {
    let maxRegister = instruction[1];

    for (let i = 0; i <= maxRegister; i++) {
      this.memory[this.registerI + i] = this.registers[i];
    }
  }

  loadRegistersI(instruction: InstructionArray) {
    let maxRegister = instruction[1];

    for (let i = 0; i <= maxRegister; i++) {
      this.registers[i] = this.memory[this.registerI + i];
    }
  }
}
