import { argv } from "process";
import { Package } from "./Package.js";
import { bumpVersions, updateDependencies } from "./bump.js";


export function main() {
    const args = argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: pkgmod <command> [args]');
        process.exit(1);
    }

    const root = Package.findClosest().loadRoot();

    const cmd = args[0];
    switch (cmd) {
        case 'bump': {
            bumpVersions(root, args[1]);
            break;
        }
        case 'dep': {
            const dep = args[1];
            if (!dep) {
                console.log('Expecting adependency name in the form of <name>@<version>');
                process.exit(1);
            }
            const i = dep.lastIndexOf('@');
            if (i < 1) {
                console.log('Expecting adependency name in the form of <name>@<version>');
                process.exit(1);
            }
            const name = dep.substring(0, i);
            const version = dep.substring(i + 1);
            console.log(`Updating dependency ${name} to version ${version}`);
            updateDependencies(root, { [name]: version });
            break;
        }
        // case 'sync': {
        //     set(args.slice(1));
        //     break;
        // }
        default:
            console.error(`Unknown command: ${cmd}.\nAvailable commands: "bump verrsion-spec" and "dep <name>@<version>"`);
            process.exit(1);
    }
}