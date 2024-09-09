import { Command } from 'commander';
import { Package } from "./Package.js";
import { bumpVersions, updateDependencies } from "./bump.js";
import { getVersion } from "./utils.js";


const program = new Command();
program.version(getVersion());
program.command("bump [version]")
    .description("Bump the version of all selected projects")
    .option('-x, --exclude [projectsPattern}]', 'A glob or project path to exclude')
    .action((version: string | undefined, options: Record<string, any>) => {
        const root = Package.findClosest().loadRoot().excludeProjects(options.exclude);
        bumpVersions(root, version);
    });
program.command("dep <name> <version>")
    .description("Update the named dependency version. Example `dep @my/package ^123`")
    .option('-x, --exclude [projectsPattern}]', 'A glob or project path to exclude')
    .action((name: string, version: string, options: Record<string, any>) => {
        const root = Package.findClosest().loadRoot().excludeProjects(options.exclude);
        console.log(`Updating dependency ${name} to version ${version}`);
        updateDependencies(root, { [name]: version });
    });


program.parse();
