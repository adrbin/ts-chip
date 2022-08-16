import { FRAME_TIME_IN_MS } from './constants.js';
import { delay } from './utils.js';
export async function run({ vm, renderer, sound }) {
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
    }, FRAME_TIME_IN_MS);
    // const svm = vm as SuperChip48Vm;
    // await svm.loadFlags([0, 5, 0, 0]);
    // svm.loadISpriteHighResolution([0, 0, 0, 0]);
    // svm.highResolution();
    // svm.drawHighResolution([0, 1, 2, 10]);
    await renderer.draw(vm.display);
    while (!vm.isHalted) {
        await vm.executeInstruction();
        await renderer.draw(vm.display);
        await delay();
    }
}
//# sourceMappingURL=chip-ts.js.map