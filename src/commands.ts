import { Command } from "commander";
import * as pkgsHandler from "./lib/pkgs-handler.js";
import * as pkgHelper from "./helpers/pkg.helper.js";
import chalk from "chalk";
import { cyan } from "./utils/logs.js";
import { APP_NAME } from "./constants.js";

export function init() {
  // create data directories if doesn't exist.
  pkgHelper.createDataDir();
  
  const VERSION = '1.0.0';
  const program = new Command();
  const COMPLETE_PROC_MESSAGE = cyan('\nThe process is complete.');
  
  program
    .name(APP_NAME)
    .description('This program allows you to reuse already installed node.js packages from other projects. This helps you to start project even if you are offline.')
    .version(VERSION)
    .option('-D, --save-dev', 'the packages will appear in devDependencies')
    .option('-f, --force', 'force the execution without confirmation')
    .option('-i, --ignore-version', 'install the latest available version')
    .action(() => {
      program.help();
    })
  
  program
    .command('save')
    .description('save all the packages from current project')
    .action(() => {
      pkgsHandler.savePackages();
      console.log(COMPLETE_PROC_MESSAGE);
    });
  
  program
    .command('install')
    .description('install all the dependencies in your project');
  
  program
    .command('install [pkgs...]')
    .description('add dependencies to your project')
    .action((pkgs) => {
      const { saveDev, ignoreVersion } = program;
      
      pkgsHandler.installPackages(pkgs, { saveDev, ignoreVersion, saveToConfig: true });
  
      console.log(COMPLETE_PROC_MESSAGE);
    });
  
  program
    .command('uninstall <pkgs...>')
    .description('remove packages from your project')
    .action((pkgs) => {
      pkgHelper.uninstall(pkgs);
      console.log(COMPLETE_PROC_MESSAGE);
    });
  
  program
    .command('delete-modules')
    .description('remove ./node_modules and ./package-lock.json')
    .action(() => {
      if (program.force) {
        console.log(cyan('Deleting all modules...\n'));
        pkgsHandler.deleteModules();
  
        console.log(COMPLETE_PROC_MESSAGE);
        return;
      }
  
      console.log(`This command will delete ${chalk.bold('./node_modules')} and ${chalk.bold('./package-lock.json')}.`);
      console.log('Please use the -f or --force option to confirm.');
      console.log(COMPLETE_PROC_MESSAGE);
    });
  
  program
    .command('clear-cache')
    .description('dangerously clear all saved data in the cache.')
    .action(() => {
      if (program.force) {
        console.log(cyan('Clearing cache...\n'));
        pkgsHandler.clearCache();
  
        console.log('Cache is now empty.');
  
        console.log(COMPLETE_PROC_MESSAGE);
        return;
      }
  
      console.log(`This command will clear all saved data in the cache.`);
      console.log('Please use the -f or --force option to confirm.');
      console.log(COMPLETE_PROC_MESSAGE);
    });
  
  program.on('command:error', (err) => {
    console.error(err);
    program.help();
    process.exit(1);
  });
  
  program.parse(process.argv);
}
