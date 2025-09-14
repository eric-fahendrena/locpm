import fs from 'fs';
import { homedir } from 'os';
import path from 'path';
import chalk from 'chalk';
import type { DepsConfig, DepsConfigLock, PackageInfo } from './types.js';

const DATA_DIR = path.join(homedir(), '.opm'); // .opm
const PKG_LIST_FILENAME = '@pkg-list.json';
const PKG_INFOS_FILENAME = '@pkg-infos.json';
const NODE_MODULES_DIRNAME = '@node_modules';
const LOGS_SEPARATOR = '';

function createFile(pathname: string, content: string) {
  fs.writeFileSync(pathname, content);
}

function sleep(ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createDataDir() {
  if (!fs.existsSync(DATA_DIR)) 
    fs.mkdirSync(DATA_DIR);
}

/**
 * Gets package from package-lock.json.
 * 
 * @param parentDir 
 * @returns 
 */
export function getPkgs(parentDir: string = './'): Record<string, PackageInfo> {
  const lockFilePath = path.join(parentDir, 'package-lock.json');
  const lockFile = fs.readFileSync(lockFilePath, 'utf-8');
  const lockfContent = lockFile.toString();
  const lockfJson = JSON.parse(lockfContent);
  const pkgs = lockfJson.packages;

  return pkgs;
}

/**
 * Gets packages path list from package-lock.json.
 * 
 * @param pkgs 
 * @returns 
 */
export function getPkgPaths(pkgs: Record<string, PackageInfo>): string[] {
  const pkgEntries = Object.entries(pkgs);
  let pkgPaths: string[] = [];
  
  for (let entry of pkgEntries) {
    pkgPaths.push(entry[0]);
  }

  return pkgPaths;
}

/**
 * Updates ~/.opm/@pkg-list.json.
 * @param pkgList 
 */
export function updatePkgListFile(pkgList: string[]): void {
  const pkgListStr = JSON.stringify(pkgList, null, 4);
  if (!fs.existsSync(DATA_DIR)) 
    fs.mkdirSync(DATA_DIR);

  createFile(path.join(DATA_DIR, PKG_LIST_FILENAME), pkgListStr);
}

/**
 * Updates ~/.opm/@pkg-infos.json
 * @param pkgInfos 
 */
export function updatePkgInfosFile(pkgInfos: Record<string, PackageInfo>): void {
  const pkgInfosStr = JSON.stringify(pkgInfos, null, 4);
  if (!fs.existsSync(DATA_DIR)) 
    fs.mkdirSync(DATA_DIR);

  createFile(path.join(DATA_DIR, PKG_INFOS_FILENAME), pkgInfosStr);
}

/**
 * Gets data from ~/.opm/pkg-list.json
 * @returns package list
 */
export function getSavedPkgList(): string[] {
  if (!fs.existsSync(DATA_DIR)) 
    fs.mkdirSync(DATA_DIR);

  if (!fs.existsSync(path.join(DATA_DIR, PKG_LIST_FILENAME)))
    return [];

  const fBuffer = fs.readFileSync(path.join(DATA_DIR, PKG_LIST_FILENAME));
  const fString = fBuffer.toString();
  
  return JSON.parse(fString);
}

/**
 * Gets data from ~/.opm/pkg-infos.json
 * @returns packages info
 */
export function getSavedPkgInfos(): Record<string, PackageInfo> {
  if (!fs.existsSync(DATA_DIR)) 
    fs.mkdirSync(DATA_DIR);

  if (!fs.existsSync(path.join(DATA_DIR, PKG_INFOS_FILENAME)))
    return {};

  const fBuffer = fs.readFileSync(path.join(DATA_DIR, PKG_INFOS_FILENAME));
  const fString = fBuffer.toString();

  return JSON.parse(fString);
}

/**
 * Saves node_modules to ~/.opm/@node_modules.
 * 
 * @param parentDir 
 * @param pkgList 
 */
export function saveNodeModules(parentDir: string, pkgList: string[]) {
  if (!fs.existsSync(path.join(DATA_DIR, NODE_MODULES_DIRNAME))) 
    fs.mkdirSync(path.join(DATA_DIR, NODE_MODULES_DIRNAME));

  console.log(chalk.cyan('Saving packages...'));
  let counter: number = 0;
  for (let pkg of pkgList) {
    if (pkg === '') {
      continue;
    }
    const src = path.join(parentDir, pkg);
    const dest = path.join(DATA_DIR, `@${pkg}`);
    if (!fs.existsSync(src)) {
      console.log(chalk.yellow('WARN'), 'No such file or direcory:', chalk.gray(src));
      continue;
    }
    fs.cpSync(src, dest, { recursive: true });
    counter++;
  }

  console.log(`\nSaved packages: ${chalk.yellow(counter)}, Ignored packages: ${chalk.yellow((pkgList.length) - counter)}.`); // -1 removes the package with empty name ""
}

/**
 * 
 * @param parentDir 
 * @param pkgName 
 * @param saveDev 
 * @param inMainDeps if the package should be saved in package.json
 * @returns 
 */
export async function install(parentDir: string, pkgName: string = '*', saveDev: boolean = false, inMainDeps = true) {
  if (pkgName !== '*') {
    verifyDepsConfig(parentDir);

    if (!fs.existsSync(path.join(DATA_DIR, NODE_MODULES_DIRNAME))) 
      fs.mkdirSync(path.join(DATA_DIR, NODE_MODULES_DIRNAME));
    
    const srcPkgPath = path.join(DATA_DIR, NODE_MODULES_DIRNAME, pkgName);
    const destPkgPath = path.join(parentDir, 'node_modules', pkgName);
    if (inMainDeps)
      console.log(`${chalk.cyan(`Installing ${chalk.bold(pkgName)}...`)}`)
    if (!fs.existsSync(srcPkgPath)) {
      console.log(chalk.red(`Package ${chalk.bold(pkgName)} not found.`));
      console.log(`${chalk.gray('Tips:')} Go to another project that uses ${chalk.bold(pkgName)}, and run: ${chalk.cyan('opm save')}`);
      if (inMainDeps) {
        console.log(LOGS_SEPARATOR);
      }
      return;
    }

    fs.cpSync(srcPkgPath, destPkgPath, { recursive: true });

    const pkgKey = 'node_modules/' + pkgName;
    const savedPkgInfos = getSavedPkgInfos();
    const depsConfigLock = getDepsConfigLock(parentDir);

    const pkgInfo = savedPkgInfos[pkgKey];
    const pkgVersion = pkgInfo?.version;
    const pkgDeps = pkgInfo?.dependencies;
    const pkgDepsEntries = pkgDeps ? Object.entries(pkgDeps) : [];
    
    let counter: number = 1;
    for (let entry of pkgDepsEntries) {
      if (depsConfigLock.packages[pkgKey]) {
        // package already in package-lock.json
        return;
      }
      counter++;
      install(parentDir, entry[0], false, false);
    }
    
    if (!pkgVersion) {
      console.log(chalk.red('Package version not specified.'));
      return;
    }
    
    // saving to package-lock.json
    if (pkgInfo)
      savePkgToConfigLock(parentDir, pkgName);

    // saving to depsConfig
    if (inMainDeps) {
      saveDepToConfig(parentDir, pkgName, pkgVersion, saveDev);
      console.log(`Package ${chalk.bold(pkgName)} (${chalk.gray(`v${pkgVersion}`)}) installed!`);
      console.log(`${chalk.yellow(counter)} packages added.`);
      console.log(LOGS_SEPARATOR);
    }

    return;
  }

  // pkgName === '*'
  // Install every dependence in package.json
  const depsConfig = getDepsConfig(parentDir);
  
  const depsEntries = Object.entries({
    ...depsConfig.dependencies, 
    ...depsConfig.devDependencies
  });
  console.log(chalk.cyan(`Installing ${chalk.bold(depsEntries.length)} packages...`));

  let counter: number = 0;
  for (let entry of depsEntries) {
    install(parentDir, entry[0], false, false); // no, don't save it to package.json
    counter++;
  }

  console.log(`\nInstalled packages: ${chalk.yellow(counter)}. Ignored packages: ${chalk.yellow((depsEntries.length) - counter)}.`);
}

/**
 * Uninstalls a package. It removes the specified pkg from package.json.
 * This doesn't delete module from node_modules.
 * 
 * @param parentDir 
 * @param pkgName 
 */
export function uninstall(parentDir: string, pkgNames: string|string[]) {
  const depsConfig = getDepsConfig(parentDir);
  
  console.log(chalk.cyan('Removing packages...'));
  if (!Array.isArray(pkgNames)) {
    let pkgFound = true;
    if (depsConfig.dependencies) {
      pkgFound = !!depsConfig.dependencies[pkgNames];
      delete depsConfig.dependencies[pkgNames];
    }
    if (depsConfig.devDependencies) {
      pkgFound = !!depsConfig.devDependencies[pkgNames];
      delete depsConfig.devDependencies[pkgNames];
    }

    if (!pkgFound)
      console.log(chalk.yellow(`Package ${chalk.bold(pkgNames)} not found.`));
  } else {
    // pkgNames is an array
    for (let pkgName of pkgNames) {
      let pkgFound = true;
      if (depsConfig.dependencies) {
        pkgFound = !!depsConfig.dependencies[pkgName];
        delete depsConfig.dependencies[pkgName];
      }
      if (depsConfig.devDependencies) {
        pkgFound = !!depsConfig.devDependencies[pkgName];
        delete depsConfig.devDependencies[pkgName];
      }

      if (!pkgFound)
        console.log(chalk.yellow(`Package ${chalk.bold(pkgName)} not found.`));
    }
  }

  createFile(path.join(parentDir, 'package.json'), JSON.stringify(depsConfig, null, 4));
}

export function verifyDepsConfig(parentDir: string): boolean {
  const depsConfigPath: string = path.join(parentDir, 'package.json');
  if (!fs.existsSync(depsConfigPath)) {
    console.log(chalk.redBright('ERR'), 'package.json file not found.');
    
    process.exit();
  }
  return true;
}

/**
 * Gets package.json content.
 * 
 * @param parentDir 
 * @returns 
 */
export function getDepsConfig(parentDir: string): DepsConfig {
  verifyDepsConfig(parentDir);

  const dcBuffer = fs.readFileSync(path.join(parentDir, 'package.json'));
  const dcString = dcBuffer.toString();

  return JSON.parse(dcString);
}

/**
 * Saves dependencies to package.json.
 * 
 * @param parentDir 
 * @param pkgName 
 * @param version 
 * @param saveDev 
 * @returns 
 */
export function saveDepToConfig(parentDir: string, pkgName: string, version: string, saveDev = false): DepsConfig {
  const depsConfig: DepsConfig = getDepsConfig(parentDir);
  const newConfig = depsConfig;
  let shouldUpdate = true;
  if (saveDev) {
    if (!newConfig.devDependencies)
      newConfig.devDependencies = {};
    if (newConfig.devDependencies[pkgName])
      shouldUpdate = false;

    newConfig.devDependencies[pkgName] = `^${version}`;
  } else {
    if (!newConfig.dependencies)
      newConfig.dependencies = {};
    if (newConfig.dependencies[pkgName])
      shouldUpdate = false;

    newConfig.dependencies[pkgName] = `^${version}`;
  }

  if (!shouldUpdate)
    return depsConfig;
  createFile(path.join(parentDir, 'package.json'), JSON.stringify(newConfig, null, 4));
  
  return depsConfig; 
}

/**
 * Gets dependencies config lock (./package-lock.json).
 * 
 * @param parentDir 
 * @returns 
 */
export function getDepsConfigLock(parentDir: string): DepsConfigLock {
  verifyDepsConfig(parentDir);
  
  const pkgLockPath = path.join(parentDir, 'package-lock.json');
  if (!fs.existsSync(pkgLockPath)) {
    console.log(chalk.cyan('Creating package-lock.json...'));
    const depsConfig = getDepsConfig(parentDir);
    const depsConfigLock: DepsConfigLock = {
      name: depsConfig.name,
      version: depsConfig.version,
      lockfileVersion: 3,
      requires: true,
      packages: {},
    }
    createFile(pkgLockPath, JSON.stringify(depsConfigLock, null, 4));
  }
  const dcLockBuffer = fs.readFileSync(pkgLockPath);
  const dcLockString = dcLockBuffer.toString();

  return JSON.parse(dcLockString);
}

/**
 * Saves package to ./package-lock.json.
 * 
 * @param parentDir 
 * @param pkgInfos 
 */
export function savePkgToConfigLock(parentDir: string, pkgName: string) {
  verifyDepsConfig(parentDir);
  
  const pkgLockPath = path.join(parentDir, 'package-lock.json');
  const depsConfig = getDepsConfig(parentDir);
  const oldDepsConfigLock = getDepsConfigLock(parentDir);
  const oldPkgs = oldDepsConfigLock.packages;
  
  const pkgKey = 'node_modules/' + pkgName;
  const savedPkgInfos = getSavedPkgInfos();
  const pkgInfo = savedPkgInfos[pkgKey];

  const depsConfigLock: DepsConfigLock = {
    name: depsConfig.name,
    version: depsConfig.version,
    lockfileVersion: 3,
    requires: true,
    packages: {
      ...oldPkgs,
    },
  };
  if (pkgInfo)
    depsConfigLock.packages[pkgKey] = pkgInfo;
  
  createFile(pkgLockPath, JSON.stringify(depsConfigLock, null, 4));
}