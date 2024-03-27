export class Version {
    mod: string;
    major: number;
    minor: number;
    patch: number;
    preRelease?: string;

    constructor(semver: string) {
        const m = /([^0-9]*)([0-9]+)\.([0-9]+)\.([0-9]+)([^0-9]*)/.exec(semver.trim());
        if (!m) {
            throw new Error('Invalid semver');
        }
        this.mod = m[1] || '';
        this.major = parseInt(m[2]);
        this.minor = parseInt(m[3]);
        this.patch = parseInt(m[4]);
        this.preRelease = m[5] || '';
    }

    incrPatch() {
        this.patch++;
        this.preRelease = '';
    }

    incrMinor() {
        this.minor++;
        this.patch = 0;
        this.preRelease = '';
    }

    incrMajor() {
        this.major++;
        this.minor = 0;
        this.patch = 0;
        this.preRelease = '';
    }

    get versionNumber() {
        return `${this.major}.${this.minor}.${this.patch}${this.preRelease}`;
    }

    toString() {
        return `${this.mod}${this.major}.${this.minor}.${this.patch}${this.preRelease}`;
    }
}
