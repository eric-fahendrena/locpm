import { homedir } from "os";
import path from "path";

export const DATA_DIR = path.join(homedir(), '.opm'); // .opm
export const PKG_LIST_FILENAME = '@pkg-keys.json';
export const PKG_INFOS_FILENAME = '@pkg-infos.json';
export const PKG_BIN_FILENAME = '@pkg-bin.json'
export const NODE_MODULES_DIRNAME = '@node_modules';
export const BIN_DIRNAME = '.@bin';
export const LOGS_SEPARATOR = '';
export const VERSION_PFX = '_#'; // prefix for version... well, it's more of a separator
