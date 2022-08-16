import { readFile, writeFile } from 'fs/promises';
export class FileStorage {
    filename;
    constructor(filename) {
        this.filename = filename;
    }
    async save(data) {
        const json = JSON.stringify(data);
        await writeFile(this.filename, json);
    }
    async load() {
        const file = await readFile(this.filename, 'utf8');
        return JSON.parse(file);
    }
}
//# sourceMappingURL=file-storage.js.map