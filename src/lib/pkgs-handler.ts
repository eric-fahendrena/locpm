import fs from "fs";
import * as pkgHelper from "../helpers/pkg.helper.js";
import type { InstallationOptions } from "../types.js";
import path from "path";
import { homedir } from "os";
import { APP_NAME } from "../constants.js";

/**
 * Saves all the package from the project. 
 */
export function savePackages() {
  pkgHelper.saveNodeModules();
}

/**
 * Add dependencies to the project. 
 * If no package specified, this installs all the dependecies in the project.
 * 
 * @param pkgNames 
 * @param options 
 * @returns 
 */
export function installPackages(pkgNames: string[] = [], options: InstallationOptions = {}) {
  if (pkgNames.length <= 0) {
    pkgHelper.autoInstall(options);
    return;
  }
  
  // pkgNames is not empty
  for (let pkgName of pkgNames) {
    let startsWithAtSign = false;
    if (pkgName[0] === '@') {
      startsWithAtSign = true;
      pkgName = pkgName.replace(/^@/, '');
    }
    let name: string;
    let version = 'latest';
    const splitedName = pkgName.split('@'); // ['pkgname', '1.0.0']
    
    name = splitedName[0] ?? pkgName;
    if (startsWithAtSign) 
      name = '@' + name;

    if (splitedName[1]) {
      version = splitedName[1];
    }
    pkgHelper.install(name, version, options);
  }
}

/**
 * Removes packages from the project.
 * 
 * @param parentDir 
 * @param pkgNames 
 */
export function uninstallPackages(pkgNames: string) {
  pkgHelper.uninstall(pkgNames);
}

/**
 * Delete ./node_modules and ./package-lock.json
 * 
 * @param parentDir 
 */
export function deleteModules() {
  pkgHelper.deleteNodeModules();
}

/**
 * Clear all the data stocked in the cache.
 */
export function clearCache() {
  fs.rmSync(path.join(homedir(), `.${APP_NAME}`), { recursive: true, force: true });
}
