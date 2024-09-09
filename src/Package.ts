import fs from 'fs';
import { globSync } from 'glob';
import yaml from "js-yaml";
import path from 'path';
import { Version } from './Version.js';

function resolveWorkspacePaths(paths: string[], baseDir: string) {
    if (!paths) {
        throw new Error('Not a root package');
    }
    if (!Array.isArray(paths)) {
        throw new Error('workspaces must be an array');
    }
    return globSync(paths, { cwd: baseDir, absolute: true, }).filter(p => {
        return fs.statSync(p).isDirectory();
    });
}

function listPnpmProjects(file: string) {
    try {
        const doc: any = yaml.load(fs.readFileSync(file, 'utf8'));
        return (doc.packages || []) as string[];
    } catch (e) {
        console.log("Failed to load pnpm workspace file", e);
        process.exit(1);
    }
}

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
    // whether or not is a workspace root. undefined if not yet known
    isRoot: boolean;
    isPnpmRoot: boolean;
    // if is workspace root contains the list of projects
    projects?: Package[];

    constructor(file: string, public content: Record<string, any>, public tab: number = 4, public nlAtEof = false) {
        this.file = path.resolve(file);
        // check if there is a pnpm workspace file
        const wdir = this.dir;
        let _isRoot = false;
        let _isPnpmRoot = false;
        if (this.content.workspaces && Array.isArray(this.content.workspaces)) {
            _isRoot = true;
            const projectPaths = resolveWorkspacePaths(this.content.workspaces, wdir);
            this.projects = this._resolveWorkspaces(projectPaths);
        } else {
            const wsPath = path.join(wdir, "pnpm-workspace.yaml");
            if (fs.existsSync(wsPath)) {
                _isRoot = true;
                _isPnpmRoot = true;
                const projectPaths = resolveWorkspacePaths(listPnpmProjects(wsPath), wdir);
                this.projects = this._resolveWorkspaces(projectPaths);
            }
        }
        this.isPnpmRoot = _isPnpmRoot;
        this.isRoot = _isRoot;
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

    excludeProjects(prefix: string | undefined) {
        if (!prefix) return this;
        prefix = path.resolve(this.dir, prefix);
        if (!this.projects) return this;
        this.projects = this.projects.filter(p => !p.file.startsWith(prefix))
        return this;
    }

    _resolveWorkspaces(projectPaths: string[]) {
        return projectPaths.map((projectPath: string) => {
            const file = path.resolve(projectPath, 'package.json');
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
