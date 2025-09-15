#!/usr/bin/env node
import { Command } from "commander";
import * as pkgsHandler from "./lib/pkgs-handler.js";
import * as pkgHelper from "./helpers/pkg.helper.js";
import chalk from "chalk";

// create data directories if doesn't exist.
pkgHelper.createDataDir();

const VERSION = '1.0.0';
const PARENT_DIR = './';
const program = new Command();
const COMPLETE_PROC_MESSAGE = '\nThe process is complete.';

program
  .name('opm')
  .description('This program allows you to reuse already installed node.js packages from other projects. This helps you to start project even if you are offline.')
  .version(VERSION)
  .option('-D, --save-dev', 'the packages will appear in devDependencies')
  .option('-f, --force', 'force the execution without confirmation')
  .action(() => {
    program.help();
  })

program
  .command('save')
  .description('save all the packages from current project')
  .action(() => {
    pkgsHandler.savePackages(PARENT_DIR);
    console.log(COMPLETE_PROC_MESSAGE);
  });

program
  .command('install')
  .description('install all the dependencies in your project');

program
  .command('install [pkgs...]')
  .description('add dependencies to your project')
  .action((pkgs) => {
    if (pkgs.length <= 0) {
      pkgsHandler.installPackages(PARENT_DIR);
    } else {
      pkgsHandler.installPackages(PARENT_DIR, pkgs, program.saveDev);
    }
    console.log(COMPLETE_PROC_MESSAGE);
  });

program
  .command('uninstall <pkgs...>')
  .description('remove packages from your project')
  .action((pkgs) => {
    pkgHelper.uninstall(PARENT_DIR, pkgs);
    console.log(COMPLETE_PROC_MESSAGE);
  });

program
  .command('delete-all')
  .description('remove ./node_modules and ./package-lock.json')
  .action(() => {
    if (program.force) {
      console.log(chalk.cyan('Deleting all modules...'));
      pkgsHandler.deleteModules(PARENT_DIR);

      console.log(COMPLETE_PROC_MESSAGE);
      return;
    }

    console.log(chalk.yellow(`This command will delete ${chalk.bold('./node_modules')} and ${chalk.bold('./package-lock.json')}.`));
    console.log('Please use the -f or --force option to force.');
    console.log(COMPLETE_PROC_MESSAGE);
  });

program.on('command:error', (err) => {
  console.error(err);
  program.help();
  process.exit(1);
});

program.parse(process.argv);
