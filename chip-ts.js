"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const vm_1 = require("./vm");
async function run({ program, renderer, input, sound, logger, }) {
    const vm = new vm_1.Vm({ program, input, logger });
    await renderer.init();
    setInterval(() => {
        if (vm.delayTimer > 0) {
            vm.delayTimer--;
        }
        if (vm.soundTimer === 1) {
            sound.stop();
        }
        if (vm.soundTimer > 0) {
            sound.play();
            vm.soundTimer--;
        }
    }, constants_1.FRAME_TIME_IN_MS);
    while (true) {
        await vm.executeInstruction();
        // vm.registers[0] = 1;
        // vm.loadISprite([0xf, 0, 2, 9]);
        // vm.registers[5] = 5;
        // vm.draw([0xd, 5, 5, 5]);
        await renderer.draw(vm.display);
        await (0, utils_1.delay)();
    }
}
exports.run = run;
//# sourceMappingURL=chip-ts.js.map