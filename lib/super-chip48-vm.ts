import {
  Chip8Vm,
  InstructionArray,
  InstructionCondition,
  VmParams,
} from './chip8-vm.js';
import {
  BYTE_LENGTH,
  DISPLAY_HEIGHT,
  DISPLAY_WIDTH,
  FLAG_REGISTER,
  FONT_DATA,
  HIGH_RES_DISPLAY_HEIGHT,
  HIGH_RES_DISPLAY_WIDTH,
  LARGE_FONT_DATA_START,
  MEMORY_SIZE,
} from './constants.js';
import { createDisplay } from './display.js';
import {
  doubleByte,
  getHigherNibble,
  getLowerNibble,
  getNthBit,
  joinNibbles,
  matchInstruction,
  mod,
} from './utils.js';

export class SuperChip48Vm extends Chip8Vm {
  newOperations: InstructionCondition[] = [
    [instruction => matchInstruction(instruction, '00Cx'), this.scrollDown],
    [instruction => matchInstruction(instruction, '00FB'), this.scrollRight],
    [instruction => matchInstruction(instruction, '00FC'), this.scrollLeft],
    [instruction => matchInstruction(instruction, '00FD'), this.exit],
    [instruction => matchInstruction(instruction, '00FE'), this.lowResolution],
    [instruction => matchInstruction(instruction, '00FF'), this.highResolution],
    [
      instruction => matchInstruction(instruction, 'Dxx0'),
      this.drawHighResolution,
    ],
    [
      instruction => matchInstruction(instruction, 'Fx30'),
      this.loadISpriteHighResolution,
    ],
    [instruction => matchInstruction(instruction, 'Fx75'), this.saveFlags],
    [instruction => matchInstruction(instruction, 'Fx85'), this.loadFlags],
  ];

  constructor(vmParams: VmParams) {
    super(vmParams);

    for (let i = 0; i < FONT_DATA.length; i++) {
      const [byte1] = doubleByte(FONT_DATA[i]);
      this.memory[LARGE_FONT_DATA_START + i * 2] = byte1;
      this.memory[LARGE_FONT_DATA_START + i * 2 + 1] = byte1;
    }

    this.operations = [...this.newOperations, ...this.operations];
  }

  scrollDown(instruction: InstructionArray) {
    const height = instruction[3];
    const difference = (height * this.display.width) / BYTE_LENGTH;
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
      for (let x = this.display.width / BYTE_LENGTH - 1; x > 0; x--) {
        const index = (y * this.display.width) / BYTE_LENGTH + x;
        const previousLowerNibble = getLowerNibble(
          this.display.display.array[index - 1],
        );
        const higherNibble = getHigherNibble(this.display.display.array[index]);
        const newByte = (previousLowerNibble << 4) + higherNibble;
        this.display.display.array[index] = newByte;
      }

      const index = (y * this.display.width) / BYTE_LENGTH;
      this.display.display.array[index] = getHigherNibble(
        this.display.display.array[index],
      );
    }
  }

  scrollLeft() {
    for (let y = 0; y < this.display.height; y++) {
      for (let x = 0; x < this.display.width / BYTE_LENGTH - 1; x++) {
        const index = (y * this.display.width) / BYTE_LENGTH + x;
        const nextHigherNibble = getHigherNibble(
          this.display.display.array[index + 1],
        );
        const lowerNibble = getLowerNibble(this.display.display.array[index]);
        const newByte = (lowerNibble << 4) + nextHigherNibble;
        this.display.display.array[index] = newByte;
      }

      const index = ((y + 1) * this.display.width) / BYTE_LENGTH - 1;
      this.display.display.array[index] =
        getLowerNibble(this.display.display.array[index]) << 4;
    }
  }

  drawHighResolution(instruction: InstructionArray) {
    const originX = mod(this.registers[instruction[1]], this.display.width);
    const originY = mod(this.registers[instruction[2]], this.display.height);
    const height = 16;

    let isCollision = false;

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < BYTE_LENGTH * 2; dx++) {
        const spriteByte =
          this.memory[this.registerI + dy * 2 + Math.floor(dx / BYTE_LENGTH)];
        const x = originX + dx;
        const y = originY + dy;
        if (x >= this.display.width || y >= this.display.height) {
          continue;
        }
        const spriteValue = getNthBit(spriteByte, mod(dx, BYTE_LENGTH));
        const isCurrentCollision = this.display.display.xor(
          y * this.display.width + x,
          spriteValue,
        );
        isCollision ||= isCurrentCollision;
      }
    }

    this.registers[FLAG_REGISTER] = isCollision ? 1 : 0;
  }

  loadISpriteHighResolution(instruction: InstructionArray) {
    const register = instruction[1];
    this.registerI = LARGE_FONT_DATA_START + this.registers[register] * 10;
  }

  async saveFlags(instruction: InstructionArray) {
    const maxRegister = instruction[1];
    const registers = [...this.registers.slice(0, maxRegister + 1)];
    await this.storage?.save(registers);
  }

  async loadFlags(instruction: InstructionArray) {
    const registers: number[] = (await this.storage?.load()) ?? [];
    const maxRegister = Math.min(instruction[1], registers.length - 1);
    for (let i = 0; i <= maxRegister; i++) {
      this.registers[i] = registers[i];
    }
  }

  exit() {
    this.isHalted = true;
  }

  lowResolution() {
    this.display = createDisplay(DISPLAY_WIDTH, DISPLAY_HEIGHT);
  }

  highResolution() {
    this.display = createDisplay(
      HIGH_RES_DISPLAY_WIDTH,
      HIGH_RES_DISPLAY_HEIGHT,
    );
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

  shiftRight(instruction: InstructionArray) {
    const register = instruction[1];
    const flag = this.registers[register] & 1;
    this.registers[register] >>= 1;
    this.registers[FLAG_REGISTER] = flag;
  }

  shiftLeft(instruction: InstructionArray) {
    const register = instruction[1];
    const flag = getNthBit(this.registers[register], 0);
    this.registers[register] = (this.registers[register] << 1) & 0xff;
    this.registers[FLAG_REGISTER] = flag;
  }

  jumpRelativeAddress(instruction: InstructionArray) {
    const register = instruction[1];
    const address =
      joinNibbles(instruction.slice(1)) + this.registers[register];
    this.pc = mod(address, MEMORY_SIZE);
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
