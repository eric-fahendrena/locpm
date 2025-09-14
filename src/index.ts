#!/usr/bin/env node
import { Command } from "commander";
import * as pkgHandler from "./pkg-handler.js";
import * as pkgHelper from "./pkg-helper.js";

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
  .action(() => {
    program.help();
  })

program
  .command('save')
  .description('save all the packages from current project')
  .action(() => {
    pkgHandler.savePackages(PARENT_DIR);
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
      pkgHandler.installPackages(PARENT_DIR);
    } else {
      pkgHandler.installPackages(PARENT_DIR, pkgs, program.saveDev);
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

program.on('command:error', (err) => {
  console.error(err);
  program.help();
  process.exit(1);
});

program.parse(process.argv);
