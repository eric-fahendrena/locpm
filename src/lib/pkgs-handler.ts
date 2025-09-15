import * as pkgHelper from "../helpers/pkg.helper.js";
import type { PackageInfo } from "../types.js";

/**
 * Saves all the package from the project.
 * 
 * @param parentDir 
 */
export function savePackages(parentDir: string) {
  const pkgInfos: Record<string, PackageInfo> = pkgHelper.getPkgs(parentDir);
  const pkgPaths: string[] = pkgHelper.getPkgPaths(pkgInfos);
  
  const currPkgList: string[] = pkgHelper.getSavedPkgList();
  const currPkgInfos: object|any = pkgHelper.getSavedPkgInfos();
  
  const updatedPkgInfos = {...pkgInfos, ...currPkgInfos};
  const updatedPkgList = [...new Set(currPkgList.concat(pkgPaths))];
  
  pkgHelper.updatePkgInfosFile(updatedPkgInfos);
  pkgHelper.updatePkgListFile([...new Set(updatedPkgList)]);
  
  pkgHelper.saveNodeModules(parentDir, pkgPaths);
}

/**
 * Add dependencies to the project. 
 * If no package specified, this installs all the dependecies in the project.
 * 
 * @param parentDir 
 * @param pkgNames 
 * @param saveDev 
 * @returns 
 */
export function installPackages(parentDir: string, pkgNames: string|string[]|null = null, saveDev = false) {
  if (pkgNames === null) {
    pkgHelper.install(parentDir, '*', saveDev);
    return;
  }
  if (Array.isArray(pkgNames)) {
    for (let pkgName of pkgNames) {
      pkgHelper.install(parentDir, pkgName, saveDev);
    }
    return;
  }
  pkgHelper.install(parentDir, pkgNames, saveDev);
}

/**
 * Removes packages from the project.
 * 
 * @param parentDir 
 * @param pkgNames 
 */
export function uninstallPackages(parentDir: string, pkgNames: string) {
  pkgHelper.uninstall(parentDir, pkgNames);
}

/**
 * Delete ./node_modules and ./package-lock.json
 * 
 * @param parentDir 
 */
export function deleteModules(parentDir: string) {
  pkgHelper.deleteNodeModules(parentDir);
}
