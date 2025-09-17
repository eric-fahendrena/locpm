#!/usr/bin/env node
import { Command } from "commander";
import * as pkgsHandler from "./lib/pkgs-handler.js";
import * as pkgHelper from "./helpers/pkg.helper.js";
import chalk from "chalk";

// create data directories if doesn't exist.
pkgHelper.createDataDir();

const VERSION = '1.0.0';
const program = new Command();
const COMPLETE_PROC_MESSAGE = '\nThe process is complete.';

program
  .name('opm')
  .description('This program allows you to reuse already installed node.js packages from other projects. This helps you to start project even if you are offline.')
  .version(VERSION)
  .option('-D, --save-dev', 'the packages will appear in devDependencies')
  .option('-f, --force', 'force the execution without confirmation')
  .option('-i, --ignore-version', 'install the latest available version')
  .action(() => {
    program.help();
  })

program
  .command('save-pkgs')
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
      console.log(chalk.cyan('Deleting all modules...'));
      pkgsHandler.deleteModules();

      console.log(COMPLETE_PROC_MESSAGE);
      return;
    }

    console.log(chalk.yellow(`This command will delete ${chalk.bold('./node_modules')} and ${chalk.bold('./package-lock.json')}.`));
    console.log('Please use the -f or --force option to confirm.');
    console.log(COMPLETE_PROC_MESSAGE);
  });

program.on('command:error', (err) => {
  console.error(err);
  program.help();
  process.exit(1);
});

program.parse(process.argv);
