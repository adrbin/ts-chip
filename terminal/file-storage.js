"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorage = void 0;
const promises_1 = require("fs/promises");
class FileStorage {
    constructor(filename) {
        this.filename = filename;
    }
    async save(data) {
        const json = JSON.stringify(data);
        await (0, promises_1.writeFile)(this.filename, json);
    }
    async load() {
        const file = await (0, promises_1.readFile)(this.filename, 'utf8');
        return JSON.parse(file);
    }
}
exports.FileStorage = FileStorage;
//# sourceMappingURL=file-storage.js.map