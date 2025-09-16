import type { PackageInfo, PkgVersionInfo } from "../types.js";

const VERSION_PFX = '_#';

/**
 * Get package infos with versioned keys (ex: keyname_#1.0.0)
 * 
 * @param pkgInfos 
 * @returns 
 */
export function getVersionedKeyPkgInfos(pkgInfos: Record<string, PackageInfo>): Record<string, PackageInfo> {
  // versioned key package infos
  let vkPkgInfos: Record<string, PackageInfo> = {};
  const pkgEntries = Object.entries(pkgInfos);
  for (let entry of pkgEntries) {
    let pkgKey = entry[0];
    let pkgInfo = entry[1];
    // ex: node_modules/pkgname_#1.0.0: pkgInfo
    vkPkgInfos[`${pkgKey}${VERSION_PFX}${pkgInfo.version}`] = pkgInfo;
  }

  return vkPkgInfos;
}

export function convertToVersionInfo(vPkgKey: string): PkgVersionInfo|null {
  const [key, version] = vPkgKey.split(VERSION_PFX);
  if (!key || !version)
    return null;
  return { key, version };
}

export function getVersionedKeyString(pkgKey: string, pkgVersion: string): string {
  return pkgKey + VERSION_PFX + pkgVersion.replace('^', '');
}

export function getLatestVersion(pkgKey: string, pkgKeys: string[]): string|null {
  const filtPkgs = pkgKeys.filter(pkg => pkg.match(new RegExp(`^${pkgKey}${VERSION_PFX}`)));
  const latestPkgVersion = filtPkgs[filtPkgs.length-1];
  if (filtPkgs.length <= 0 || !latestPkgVersion) {
    return null;
  }
  return latestPkgVersion;
}
