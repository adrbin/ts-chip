import { readFile, writeFile } from 'fs/promises';
import { Storage } from '../lib/chip8-vm.js';

export class FileStorage implements Storage {
  filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  async save(data: any) {
    const json = JSON.stringify(data);
    await writeFile(this.filename, json);
  }

  async load() {
    const json = await readFile(this.filename, 'utf8');
    return JSON.parse(json);
  }
}
