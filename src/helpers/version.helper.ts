import chalk from "chalk";
import type { PkgInfo, PkgVersionInfo } from "../types.js";
import { VERSION_PFX } from "../constants.js";

/**
 * Gets package infos with versioned keys (ex: keyname_#1.0.0).
 * 
 * @param pkgInfos 
 * @returns 
 */
export function getVersionedKeyPkgInfos(pkgInfos: Record<string, PkgInfo>): Record<string, PkgInfo> {
  // versioned key package infos
  // ex: keyname_#1.0.0 => <package_info>
  let vkPkgInfos: Record<string, PkgInfo> = {};
  const pkgEntries = Object.entries(pkgInfos);
  for (let entry of pkgEntries) {
    let pkgKey = entry[0];
    let pkgInfo = entry[1];
    // ex: node_modules/pkgname_#1.0.0: pkgInfo
    vkPkgInfos[`${pkgKey}${VERSION_PFX}${pkgInfo.version}`] = pkgInfo;
  }

  return vkPkgInfos;
}

/**
 * Converts versioned package key to VersionInfo type.
 * 
 * @param vPkgKey 
 * @returns 
 */
export function convertToVersionInfo(vPkgKey: string): PkgVersionInfo|null {
  const [key, version] = vPkgKey.split(VERSION_PFX);
  if (!key || !version)
    return null;
  return { key, version };
}

/**
 * Gets versioned key string.
 * 
 * @param pkgKey 
 * @param pkgVersion 
 * @returns 
 */
export function getVersionedKeyString(pkgKey: string, pkgVersion: string): string {
  return pkgKey + VERSION_PFX + pkgVersion.replace('^', '');
}

/**
 * Gets the latest available version for a package. Using non versioned package key.
 * 
 * @param pkgKey 
 * @param pkgKeys 
 * @returns 
 */
export function getLatestVersion(pkgKey: string, pkgKeys: string[]): string|null {
  const filtPkgs = pkgKeys.filter(pkg => pkg.match(new RegExp(`^${pkgKey}${VERSION_PFX}`)));
  const latestPkgVersion = filtPkgs[filtPkgs.length-1];
  if (filtPkgs.length <= 0 || !latestPkgVersion) {
    return null;
  }
  return latestPkgVersion;
}

/**
 * Compares versions.
 * For now, this cannot treat version format that includes letter like `alpha`, `beta`...
 * 
 * @param rVersion 
 * @param cVersion 
 * @returns 
 */
export function compareVersions(rVersion: string, cVersion: string): boolean {
  // This algorithm is a little wonky, but I think it will do the trick.
  // If you have time to create another a more secure one, feel free to do so ;-).
  
  let symbol: string;
  
  if (rVersion === '*') 
    return true; // accept all version

  if (rVersion.split('||').length > 1 || rVersion.match(/^>=[.0-9]+ <[.0-9]+/)) {
    const result = compareComplexVersions(rVersion, cVersion);
    return result;
  }

  symbol = '';

  if (rVersion.match(/^\^/)) {
    symbol = '^';
  } else if (rVersion.match(/^~/)) {
    symbol = '~';
  } else if (rVersion.match(/^>=/)) {
    symbol = '>=';
  }

  rVersion = rVersion.replace(/[~^]|>=/, '');
  cVersion = cVersion.replace(/[~^]|>=/, '');
  
  let [rvMajor, rvMinor, rvPatch] = rVersion.split('.');
  let [cvMajor, cvMinor, cvPatch] = cVersion.split('.');

  if (!rvMajor) { // rvMajor is required
    console.log(chalk.red('Error comparing version: Invalid format.'));
    return false;
  }

  if (!rvMinor && !rvPatch) symbol = '^'; // for the format unique ex: version=1
  if (!rvPatch) symbol = '~'; // ex: version=1.2

  rvMinor = !rvMinor ? '0' : rvMinor;
  rvPatch = !rvPatch ? '0' : rvPatch;

  if (!cvMajor || !cvMinor || !cvPatch) {
    console.log(chalk.red('Error comparing version: Invalid format.'));
    return false;
  }
  
  if (symbol === '^') {
    if (parseInt(rvMajor) !== parseInt(cvMajor)) {
      return false;
    } else {
      if (parseInt(rvMinor) > parseInt(cvMinor)) {
        return false;
      } else {
        return true;
      }
    }
  }

  if (symbol === '>=') {
    if (parseInt(rvMajor) < parseInt(cvMajor)) {
      return true;
    } else {
      if (parseInt(rvMinor) < parseInt(cvMinor)) {
        return true;
      } else {
        if (parseInt(rvPatch) <= parseInt(cvPatch)) return true;
        return false;
      }
    }
  }

  if (symbol === '~') {
    if (parseInt(rvMajor) !== parseInt(cvMajor)) {
      return false;
    } else {
      if (parseInt(rvMinor) !== parseInt(cvMinor)) {
        return false;
      } else {
        if (parseInt(rvPatch) > parseInt(cvPatch)) return false;
        return true;
      }
    }
  }

  // no symbol / exact version
  if (parseInt(rvMajor) !== parseInt(cvMajor)) return false;
  if (parseInt(rvMinor) !== parseInt(cvMinor)) return false;
  if (parseInt(rvPatch) !== parseInt(cvPatch)) return false;
  
  return true;
}

/**
 * Compares more complex versions format like ex: ^1.0.0 || ^2.0.0 or >=0.2.0 <2.3.3.
 * 
 * @param rVersion 
 * @param cVersion 
 * @returns 
 */
function compareComplexVersions(rVersion: string, cVersion: string): boolean {
  let rVersions: string[] = [];
  
  if (rVersion.split('||').length > 1) {
    rVersions = rVersion.split('||');
    for (let rv of rVersions) {
      const result = compareVersions(rv.trim(), cVersion);
      if (!result)
        continue;
      return true;
    }
    
    return false;
  }

  if (rVersion.match(/^>=[.0-9]+ <[.0-9]+/)) {
    rVersion = rVersion.replace('>=', '');
    rVersion = rVersion.replace('<', '');
    
    let [min, max] = rVersion.split(' ');
    if (!min || !max) return false;
    
    const result = compareVersions('>='+min, cVersion);
    if (!result)
      return false;

    const rvMajor = max.split('.')[0];
    const cvMajor = cVersion.split('.')[0];

    if (!rvMajor || !cvMajor) return false;
    
    if (parseInt(rvMajor) <= parseInt(cvMajor)) {
      return false;
    }
    
    return true;
  }

  return false;
}
