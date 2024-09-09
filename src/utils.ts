import { readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from 'url';

const packageDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

let _package: any;
export function getPackage() {
    if (_package === undefined) {
        _package = JSON.parse(readFileSync(`${packageDir}/package.json`, 'utf8'));
    }
    return _package;
}
export function getVersion() {
    return getPackage().version;
}