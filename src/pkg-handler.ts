import * as pkgHelper from "./pkg-helper.js";
import type { PackageInfo } from "./types.js";

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

export function uninstallPackages(parentDir: string, pkgNames: string) {
  pkgHelper.uninstall(parentDir, pkgNames);
}
