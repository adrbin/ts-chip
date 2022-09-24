import { Chip8Vm } from '../lib/chip8-vm.js';
import { WebAudio } from './web-audio.js';
import { WebKeyboardInput } from './web-keyboard-input.js';
import { WebRenderer } from './web-renderer.js';
import { WebStorage } from './web-storage.js';
import { SuperChip48Vm } from '../lib/super-chip48-vm.js';
import { WebButtonInput } from './web-button-input.js';
import { CombinedInput } from '../lib/combined-input.js';
import { KEY_MAPPING, ROMS } from '../lib/constants.js';
import { toHex } from '../lib/utils.js';
import { VmRunner } from '../lib/vm-runner.js';

const PAUSE_TEXT = 'Pause';
const RESUME_TEXT = 'Resume';

let vmRunner: VmRunner;
let canvas: HTMLCanvasElement;
const buttons: Record<string, HTMLButtonElement> = {};
let romSelect: HTMLSelectElement;
const romCache: Record<string, Uint8Array> = {};
let romFileInput: HTMLInputElement;
let modeSelect: HTMLSelectElement;
let fpsCheckbox: HTMLInputElement;
let fpsText: HTMLElement;
let pauseButton: HTMLButtonElement;

async function main() {
  if (vmRunner) {
    await vmRunner.stop();
  }

  const rom = (romSelect[romSelect.selectedIndex] as HTMLOptionElement).value;

  const isChip8mode =
    (modeSelect[modeSelect.selectedIndex] as HTMLOptionElement).text ===
    'Chip-8';

  const renderer = new WebRenderer({
    canvas,
    shouldLimitFrame: isChip8mode,
    shouldDrawFps: fpsCheckbox.checked,
    fpsText,
  });

  const keyboardInput = new WebKeyboardInput();
  const buttonInput = new WebButtonInput(buttons);
  const combinedInput = new CombinedInput(keyboardInput, buttonInput);
  const audio = new WebAudio();
  const storage = new WebStorage(`${rom}.state`);

  const program = await getRomFromCache(rom);

  const vmClass = isChip8mode ? Chip8Vm : SuperChip48Vm;
  const vm = new vmClass({
    program,
    input: combinedInput,
    logger: console,
    storage,
  });

  vmRunner = new VmRunner({ vm, renderer, audio });

  await vmRunner.run();
}

function initUi() {
  canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('There is no canvas to render the game');
  }

  for (const keyNumber of Object.values(KEY_MAPPING)) {
    const key = toHex(keyNumber);
    const button = document.getElementById(
      `button-${key}`,
    ) as HTMLButtonElement;
    if (!button) {
      throw new Error(`Input button '${key}' has not been found`);
    }

    buttons[key] = button;
  }

  const startButton = document.getElementById('start-button');
  if (!startButton) {
    throw new Error(`Start button has not been found`);
  }

  romSelect = document.getElementById('rom-select') as HTMLSelectElement;
  if (!romSelect) {
    throw new Error(`Rom select has not been found`);
  }

  for (const rom of ROMS) {
    const option = document.createElement('option');
    option.value = rom;
    option.text = getRomName(rom);
    romSelect.appendChild(option);
  }

  startButton.addEventListener('click', main);

  romFileInput = document.getElementById('rom-file-input') as HTMLInputElement;
  if (!romFileInput) {
    throw new Error(`File input for a rom has not been found`);
  }

  romFileInput.addEventListener('change', loadRom);

  modeSelect = document.getElementById('mode-select') as HTMLSelectElement;
  if (!modeSelect) {
    throw new Error(`Mode select has not been found`);
  }

  fpsCheckbox = document.getElementById('fps-checkbox') as HTMLInputElement;
  if (!fpsCheckbox) {
    throw new Error(`Show FPS checkbox has not been found`);
  }

  fpsCheckbox.addEventListener('change', drawFps);

  fpsText = document.getElementById('fps-text') as HTMLInputElement;
  if (!fpsText) {
    throw new Error(`Show FPS text has not been found`);
  }

  pauseButton = document.getElementById('pause-button') as HTMLButtonElement;
  if (!pauseButton) {
    throw new Error(`Pause button has not been found`);
  }

  pauseButton.addEventListener('click', pauseRom);
}

async function loadRom() {
  if (!romFileInput.files || !romFileInput.files[0]) {
    return;
  }
  const file = romFileInput.files[0];
  const programBuffer = await file.arrayBuffer();
  const program = new Uint8Array(programBuffer);
  const rom = file.name;
  romCache[rom] = program;

  const option = document.createElement('option');
  option.value = rom;
  option.text = getRomName(rom);
  option.selected = true;
  romSelect.appendChild(option);
}

async function pauseRom() {
  if (pauseButton.textContent === PAUSE_TEXT) {
    pauseButton.innerText = RESUME_TEXT;
    await vmRunner.stop();
  } else {
    pauseButton.innerText = PAUSE_TEXT;
    await vmRunner.run();
  }
}

function drawFps() {
  const renderer = vmRunner.renderer as WebRenderer;
  renderer.shouldDrawFps = fpsCheckbox.checked;
  renderer.shouldRedraw = true;
}

function getRomName(rom: string) {
  let start = rom.lastIndexOf('/') + 1;

  let end = rom.lastIndexOf('.');
  if (end === -1) {
    end = rom.length;
  }

  return rom.substring(start, end);
}

async function getRomFromCache(rom: string) {
  const cachedProgram = romCache[rom];
  if (cachedProgram) {
    return cachedProgram;
  }

  const programResponse = await fetch(rom);
  const programBuffer = await programResponse.arrayBuffer();
  const program = new Uint8Array(programBuffer);
  romCache[rom] = program;

  return program;
}

initUi();
main();
