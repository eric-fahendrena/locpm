import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type { PkgConfig, InstallationOptions, PackageInfo, PkgVersionInfo, PkgLockConfig } from '../types.js';
import { 
  DATA_DIR, 
  PKG_INFOS_FILENAME, 
  PKG_LIST_FILENAME, 
  NODE_MODULES_DIRNAME,
} from '../constants.js';
import { installBin, saveBin } from './bin.helper.js';
import { getLatestVersion, getVersionedKeyPkgInfos, getVersionedKeyString, convertToVersionInfo, compareVersions } from './version.helper.js';

function createFile(pathname: string, content: string) {
  fs.writeFileSync(pathname, content);
}

function sleep(ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findPackage(pkgKey: string, version: string): string|undefined {
  const vPkgKey = getVersionedKeyString(pkgKey, version);
  const savedKeys = getSavedPkgKeys();
  const foundPkg = savedKeys.find(item => {
    if (item === vPkgKey) {
      return true;
    }
    const itemVInfo = convertToVersionInfo(item);
    if (!itemVInfo) 
      return false;
    if (pkgKey !== itemVInfo.key) 
      return false;

    const result = compareVersions(version, itemVInfo.version);
    return result;
  });

  return foundPkg;
}

export function createDataDir() {
  if (!fs.existsSync(DATA_DIR)) 
    fs.mkdirSync(DATA_DIR);
}

/**
 * Gets package from package-lock.json.
 * 
 * @returns 
 */
export function getPkgInfos(): Record<string, PackageInfo> {
  const lockFilePath = './package-lock.json';
  const lockFile = fs.readFileSync(lockFilePath, 'utf-8');
  const lockfContent = lockFile.toString();
  const lockfJson = JSON.parse(lockfContent);
  const pkgInfos = lockfJson.packages;

  const vkPkgInfos = getVersionedKeyPkgInfos(pkgInfos);
  return vkPkgInfos;
}

/**
 * Gets packages path list from package-lock.json.
 * 
 * @param pkgs 
 * @returns 
 */
export function getPkgKeys(pkgs: Record<string, PackageInfo>): string[] {
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
export function updatePkgKeysFile(pkgList: string[]): void {
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
export function getSavedPkgKeys(): string[] {
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
 * @param pkgList 
 */
export function saveNodeModules() {
  if (!fs.existsSync(path.join(DATA_DIR, NODE_MODULES_DIRNAME))) 
    fs.mkdirSync(path.join(DATA_DIR, NODE_MODULES_DIRNAME));

  console.log(chalk.cyan('Saving packages...'));

  saveBin();

  const pkgInfos = getPkgInfos();
  const vPkgKeys = getPkgKeys(pkgInfos);
  const savedInfos = getSavedPkgInfos();
  const savedKeys = getSavedPkgKeys();

  let counter: number = 0;
  for (let vPkgKey of vPkgKeys) {
    const pkgVersionInfo = convertToVersionInfo(vPkgKey);
    if (!pkgVersionInfo) {
      // Package version not found !
      continue;
    }
    const src = './' + pkgVersionInfo.key;
    const dest = path.join(DATA_DIR, `@${vPkgKey}`);
    if (!fs.existsSync(src)) {
      console.log(chalk.yellow('WARN'), 'No such file or direcory:', chalk.gray(src)); 
      continue;
    }
    if (pkgInfos[vPkgKey]) {
      savedInfos[vPkgKey] = pkgInfos[vPkgKey];
      savedKeys.push(vPkgKey);

      updatePkgInfosFile(savedInfos);
      updatePkgKeysFile(savedKeys);
    }
    fs.cpSync(src, dest, { recursive: true });
    counter++;
  }

  console.log(`\nSaved packages: ${chalk.yellow(counter)}, Ignored packages: ${chalk.yellow((vPkgKeys.length) - counter)}.`); // -1 removes the package with empty name ""
}

/**
 * Installs package in the project.
 * 
 * @param pkgName 
 * @param version 
 * @param options 
 * @returns 
 */
export function install(pkgName: string, version: string='latest', options: InstallationOptions={}, optional=false): boolean {
  verifyDepsConfig();

  let pkgKey = 'node_modules/' + pkgName;
  let vPkgKey: string|null;
  let savedPkgKeys: string[];
  let versionInfo: PkgVersionInfo|null;
  let savedPkgInfos: Record<string, PackageInfo>;
  let pkgInfo: PackageInfo|undefined;
  let depsEntries: [string, string][];
  let optDepsEntries: [string, string][];

  savedPkgKeys = getSavedPkgKeys();
  version = !options.ignoreVersion ? version : 'latest'; // force version to be latest

  if (version === 'latest') {
    vPkgKey = getLatestVersion(pkgKey, savedPkgKeys);
    if (!vPkgKey) {
      if (optional) {
        console.log(chalk.yellow(`No package version found for the optional dependency ${chalk.bold(pkgName)}.`));
        return false;
      }
      console.log(chalk.red(`No package version found for ${chalk.bold(pkgName)}.`));
      return false;
    }
  } else {
    const foundPkg = findPackage(pkgKey, version);
    if (!foundPkg) {
      if (optional) {
        console.log(chalk.yellow(`Optional package ${chalk.bold(pkgName)} (version=${version}) not found.`));
        return false;
      }
      console.log(chalk.red(`Package ${chalk.bold(pkgName)} (version=${version}) not found.`));
      return false;
    }
    vPkgKey = foundPkg;
  }
  
  versionInfo = convertToVersionInfo(vPkgKey);
  if (!versionInfo) {
    console.log(chalk.red(`Cannot find package version info.`));
    return false;
  }

  savedPkgInfos = getSavedPkgInfos();
  pkgInfo = savedPkgInfos[vPkgKey];
  if (!pkgInfo) {
    console.log(chalk.red('Package info not found.'));
    return false;
  }

  // copy to node_modules first
  fs.cpSync(path.join(DATA_DIR, `@${vPkgKey}`), pkgKey, { recursive: true });

  // install all the dependencies
  if (pkgInfo.dependencies) {
    depsEntries = Object.entries(pkgInfo.dependencies);
    for (let entry of depsEntries) {
      if (fs.existsSync('./node_modules/' + entry[0])) {
        continue; // avoid to run in an infinite loop
      }
      const version = !options.ignoreVersion ? entry[1] : 'latest';
      install(entry[0], version, { 
        ignoreVersion: !!options.ignoreVersion,
        saveToConfig: false,
      });
    }
  }
  // install all optional dependencies
  if (pkgInfo.optionalDependencies) {
    optDepsEntries = Object.entries(pkgInfo.optionalDependencies);
    for (let entry of optDepsEntries) {
      const version = !options.ignoreVersion ? entry[1] : 'latest';
      if (fs.existsSync('./node_modules/' + entry[0]))
        continue; // avoid to run in an infinite loop
      install(entry[0], version, { 
        ignoreVersion: !!options.ignoreVersion,
        saveToConfig: false,
      }, true); // true for optional
    }
  }

  installBin(pkgName);
  saveToLockFile(vPkgKey);
  if (options.saveToConfig)
    saveDepToConfig(pkgName, pkgInfo.version, options.saveDev);

  if (options.saveToConfig)
    console.log(chalk.green(`${chalk.bold(pkgName)} (${pkgInfo.version}) successfully installed.`));

  return true;
}

/**
 * Auto-installs all dependencies in package.json
 * @param options 
 */
export function autoInstall(options: InstallationOptions={}) {
  let pkgConfig: PkgConfig;
  let deps: Record<string, string>|undefined;
  let depsEntries: [string, string][];
  let devDeps: Record<string, string>|undefined;
  let devDepsEntries: [string, string][];

  pkgConfig = getPkgConfig();
  
  deps = pkgConfig.dependencies;
  if (deps) {
    depsEntries = Object.entries(deps);
    for (let entry of depsEntries) {
      const pkgName = entry[0];
      const version = entry[1];
      install(pkgName, version, { ignoreVersion: !!options.ignoreVersion });
    }
  }
  devDeps = pkgConfig.devDependencies;
  if (devDeps) {
    devDepsEntries = Object.entries(devDeps);
    for (let entry of devDepsEntries) {
      const pkgName = entry[0];
      const version = entry[1];
      install(pkgName, version, { ignoreVersion: !!options.ignoreVersion });
    }
  }
}

/**
 * Uninstalls a package. It removes the specified pkg from package.json.
 * This doesn't delete module from node_modules.
 * 
 * @param parentDir 
 * @param pkgName 
 */
export function uninstall(pkgNames: string|string[]) {
  const depsConfig = getPkgConfig();
  
  console.log(chalk.cyan('Removing packages...'));
  if (!Array.isArray(pkgNames)) {
    let pkgFound = true;
    if (depsConfig.dependencies) {
      pkgFound = depsConfig.dependencies[pkgNames] ? true : false;
      delete depsConfig.dependencies[pkgNames];
    }
    if (depsConfig.devDependencies) {
      pkgFound = depsConfig.devDependencies[pkgNames] ? true : false;
      delete depsConfig.devDependencies[pkgNames];
    }

    console.log(pkgFound);
    if (!pkgFound)
      console.log(chalk.yellow(`Package ${chalk.bold(pkgNames)} not found.`));
  } else {
    // pkgNames is an array
    for (let pkgName of pkgNames) {
      let foundPkg;
      if (depsConfig.dependencies) {
        let pkg = depsConfig.dependencies[pkgName];
        if (pkg) foundPkg = pkg;
        delete depsConfig.dependencies[pkgName];
      }
      if (depsConfig.devDependencies) {
        let pkg = depsConfig.devDependencies[pkgName];
        if (pkg) foundPkg = pkg;
        delete depsConfig.devDependencies[pkgName];
      }

      if (!foundPkg)
        console.log(chalk.yellow(`Package ${chalk.bold(pkgName)} not found.`));
    }
  }

  createFile('./package.json', JSON.stringify(depsConfig, null, 4));
}

export function verifyDepsConfig(): boolean {
  const depsConfigPath: string = './package.json';
  if (!fs.existsSync(depsConfigPath)) {
    console.log(chalk.redBright('ERR'), 'package.json file not found.');
    
    process.exit();
  }
  return true;
}

/**
 * Gets package.json content.
 * 
 * @returns 
 */
export function getPkgConfig(): PkgConfig {
  verifyDepsConfig();

  const dcBuffer = fs.readFileSync('./package.json');
  const dcString = dcBuffer.toString();

  return JSON.parse(dcString);
}

/**
 * Saves dependencies to package.json.
 * 
 * @param pkgName 
 * @param version 
 * @param saveDev 
 * @returns 
 */
export function saveDepToConfig(pkgName: string, version: string, saveDev = false): PkgConfig {
  const depsConfig: PkgConfig = getPkgConfig();
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
  createFile('./package.json', JSON.stringify(newConfig, null, 4));
  
  return depsConfig; 
}

/**
 * Gets dependencies config lock (./package-lock.json).
 * 
 * @returns 
 */
export function getPkgLockConfig(): PkgLockConfig {
  verifyDepsConfig();
  
  const pkgLockPath = './package-lock.json';
  if (!fs.existsSync(pkgLockPath)) {
    console.log(chalk.cyan('Creating package-lock.json...'));
    const pkgConfig = getPkgConfig();
    const pkgConfigLock: PkgLockConfig = {
      name: pkgConfig.name,
      version: pkgConfig.version,
      lockfileVersion: 3,
      requires: true,
      packages: {},
    }
    createFile(pkgLockPath, JSON.stringify(pkgConfigLock, null, 4));
  }
  const dcLockBuffer = fs.readFileSync(pkgLockPath);
  const dcLockString = dcLockBuffer.toString();

  return JSON.parse(dcLockString);
}

/**
 * Saves package to ./package-lock.json.
 *  
 * @param vPkgKey
 */
export function saveToLockFile(vPkgKey: string): PkgLockConfig {
  verifyDepsConfig();
  
  let pkgLockConfig: PkgLockConfig;
  const pkgInfo = getSavedPkgInfos()[vPkgKey];
  const lockFilePath = './package-lock.json';
  const pkgKey = convertToVersionInfo(vPkgKey)?.key;
  
  pkgLockConfig = getPkgLockConfig();
  if (pkgKey && pkgInfo)
    pkgLockConfig.packages[pkgKey] = pkgInfo;

  createFile(lockFilePath, JSON.stringify(pkgLockConfig, null, 4));
  
  return pkgLockConfig;
}

export function deleteNodeModules() {
  const modulesPath = './node_modules';
  const lockFilePath = './package-lock.json';
  if (fs.existsSync(modulesPath)) {
    fs.rmSync(modulesPath, { recursive: true, force: true });
  }
  if (fs.existsSync(lockFilePath)) {
    fs.rmSync(lockFilePath);
  }
}
