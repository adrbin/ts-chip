"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const constants_1 = require("./constants");
const utils_1 = require("./utils");
async function run({ vm, renderer, sound }) {
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
    // const svm = vm as SuperChip48Vm;
    // await svm.loadFlags([0, 5, 0, 0]);
    // svm.loadISpriteHighResolution([0, 0, 0, 0]);
    // svm.highResolution();
    // svm.drawHighResolution([0, 1, 2, 10]);
    await renderer.draw(vm.display);
    while (!vm.isHalted) {
        await vm.executeInstruction();
        await renderer.draw(vm.display);
        await (0, utils_1.delay)();
    }
}
exports.run = run;
//# sourceMappingURL=chip-ts.js.map