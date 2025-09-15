import * as pkgHelper from "../helpers/pkg.helper.js";
import type { PackageInfo } from "../types.js";

/**
 * Saves all the package from the project. 
 */
export function savePackages() {
  const pkgInfos: Record<string, PackageInfo> = pkgHelper.getPkgs();
  const pkgPaths: string[] = pkgHelper.getPkgPaths(pkgInfos);
  
  const currPkgList: string[] = pkgHelper.getSavedPkgList();
  const currPkgInfos: object|any = pkgHelper.getSavedPkgInfos();
  
  const updatedPkgInfos = {...pkgInfos, ...currPkgInfos};
  const updatedPkgList = [...new Set(currPkgList.concat(pkgPaths))];
  
  pkgHelper.updatePkgInfosFile(updatedPkgInfos);
  pkgHelper.updatePkgListFile([...new Set(updatedPkgList)]);
  
  pkgHelper.saveNodeModules(pkgPaths);
}

/**
 * Add dependencies to the project. 
 * If no package specified, this installs all the dependecies in the project.
 * 
 * @param pkgNames 
 * @param saveDev 
 * @returns 
 */
export function installPackages(pkgNames: string|string[]|null = null, saveDev = false) {
  if (pkgNames === null) {
    pkgHelper.install('*', saveDev);
    return;
  }
  if (Array.isArray(pkgNames)) {
    for (let pkgName of pkgNames) {
      pkgHelper.install(pkgName, saveDev);
    }
    return;
  }
  pkgHelper.install(pkgNames, saveDev);
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
