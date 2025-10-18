import path from "path";
import { BIN_DIRNAME, DATA_DIR } from "../constants.js";
import fs from "fs";

export function getBinFromData(pkgName: string): string|false {
  const datBinPath = path.join(DATA_DIR, BIN_DIRNAME, pkgName);
  if (!fs.existsSync(datBinPath)) {
    return false;
  }
  return datBinPath;
}

export function saveBin() {
  const binPath = './node_modules/.bin';
  if (!fs.existsSync(binPath)) {
    // bin not found
    return;
  }
  // copying bin
  fs.cpSync(binPath, path.join(DATA_DIR, BIN_DIRNAME), { recursive: true, force: true });
}

export function installBin(pkgName: string) {
  pkgName = pkgName.replace('@', '');

  const datBinPath = getBinFromData(pkgName);
  const parentBinPath = './node_modules/.bin/' + pkgName;
  if (!datBinPath) {
    // bin not found
    return;
  }
  if (fs.existsSync(parentBinPath)) {
    // bin already installed
    return;
  }
  // install bin
  fs.cpSync(datBinPath, parentBinPath);
}
