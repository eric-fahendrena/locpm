/**
 * Type for package info.
 */
export type PkgInfo = {
  version: string;
  revolved: string;
  integrity: string;
  license: string;
  engines: Record<string, string>;
  dependencies: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

/**
 * Type for package config (for ./package.json).
 */
export type PkgConfig = {
  name: string;
  version: string;
  description: string;
  main: string;
  scripts: Record<string, string>;
  keywords: string[];
  author: string;
  license: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  type: string;
};

/**
 * type for lockfile (./package-lock.json).
 */
export type PkgLockConfig = {
  name: string;
  version: string;
  lockfileVersion: number;
  requires: boolean;
  packages: Record<string, PkgInfo>;
}

/**
 * Type for package version info.
 */
export type PkgVersionInfo = {
  key: string;
  version: string;
}

/**
 * Options for installation.
 */
export type InstallationOptions = {
  saveDev?: boolean;
  ignoreVersion?: boolean;
  saveToConfig?: boolean;
}

