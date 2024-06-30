import fs from 'fs';
import { globSync } from 'glob';
import path from 'path';
import { Version } from './Version.js';


export function findClosestPackage(dir: string) {
    let current = dir;
    while (current) {
        const file = `${current}/package.json`;
        if (file && fs.existsSync(file)) {
            return file;
        } else {
            const parent = path.dirname(current);
            if (parent === current) {
                break;
            }
            current = parent;
        }
    }
    return null;
}

export class Package {

    parent?: Package;
    file: string;

    constructor(file: string, public content: Record<string, any>, public tab: number = 4, public nlAtEof = false) {
        this.file = path.resolve(file);
    }

    get isRoot() {
        return this.content.workspaces;
    }

    get dir() {
        return path.dirname(this.file);
    }

    get name() {
        return this.content.name;
    }

    set name(value: string) {
        this.content.name = value;
    }

    get version() {
        return this.content.version;
    }

    set version(value: string) {
        if (value === 'major') {
            const v = new Version(this.content.version);
            v.incrMajor();
            this.content.version = v.toString();
        } else if (value === 'minor') {
            const v = new Version(this.content.version);
            v.incrMinor();
            this.content.version = v.toString();
        } else if (value === 'patch') {
            const v = new Version(this.content.version);
            v.incrPatch();
            this.content.version = v.toString();
        } else {
            this.content.version = value;
        }
    }

    resolveWorkspacePaths() {
        const ws = this.content.workspaces;
        if (!ws) {
            throw new Error('Not a root package');
        }
        if (!Array.isArray(ws)) {
            throw new Error('workspaces must be an array');
        }
        return globSync(ws, { cwd: this.dir });
    }

    resolveWorkspaces() {
        return this.resolveWorkspacePaths().map((ws: string) => {
            const file = path.resolve(this.dir, ws, 'package.json');
            const pkg = Package.load(file);
            pkg.parent = this;
            return pkg;
        });
    }

    loadParent() {
        if (!this.parent) {
            this.parent = Package.findClosest(path.dirname(this.dir));
        }
        return this.parent;
    }

    loadRoot(): Package {
        if (this.isRoot) {
            return this;
        }
        const pkg = this.loadParent();
        if (!pkg) throw new Error('No root package.json found');
        return pkg.loadRoot();
    }

    save() {
        fs.writeFileSync(this.file, JSON.stringify(this.content, null, this.tab) + (this.nlAtEof ? '\n' : ''));
    }

    static load(file: string) {
        let tab = 4;
        let content = fs.readFileSync(file, 'utf8');
        const nlAtEof = /\s*\n\s*$/.test(content);
        content = content.trim();
        const m = /^(\s+)/m.exec(content);
        if (m) {
            tab = m[1].length;
        }

        return new Package(file, JSON.parse(content), tab, nlAtEof)
    }

    static findClosest(cwd?: string) {
        if (!cwd) {
            cwd = process.cwd();
        }
        const file = findClosestPackage(cwd);
        if (!file) {
            throw new Error('No package.json found');
        }
        return Package.load(file);
    }

}
