self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('sw-cache').then(function (cache) {
      return cache.addAll([
        'index.html',
        'pwa.png',
        'web/ts-chip-web.js',
        'web/web-audio.js',
        'web/web-button-input.js',
        'web/web-keyboard-input.js',
        'web/web-renderer.js',
        'web/web-storage.js',
        'lib/bit-array.js',
        'lib/chip8-vm.js',
        'lib/combined-input.js',
        'lib/constants.js',
        'lib/display.js',
        'lib/super-chip48-vm.js',
        'lib/utils.js',
        'lib/vm-runner.js',
        'roms/chip-8/1dcell.ch8',
        'roms/chip-8/chip8-test-suite.ch8',
        'roms/chip-8/flightrunner.ch8',
        'roms/chip-8/pumpkindressup.ch8',
        'roms/chip-8/RPS.ch8',
        'roms/chip-8/snake.ch8',
        'roms/schip/blackrainbow.ch8',
        'roms/schip/dodge.ch8',
        'roms/schip/eaty.ch8',
        'roms/schip/mondrian.ch8',
        'roms/schip/octogon.ch8',
        'roms/schip/rockto.ch8',
        'roms/schip/sens8tion.ch8',
        'roms/schip/sub8.ch8',
      ]);
    }),
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    }),
  );
});
