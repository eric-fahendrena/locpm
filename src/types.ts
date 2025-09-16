export type PackageInfo = {
  version: string;
  revolved: string;
  integrity: string;
  license: string;
  engines: Record<string, string>;
  dependencies: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}
// type for package.json
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

export type PkgLockConfig = {
  name: string;
  version: string;
  lockfileVersion: number;
  requires: boolean;
  packages: Record<string, PackageInfo>;
}

export type PkgVersionInfo = {
  key: string;
  version: string;
}

export type InstallationOptions = {
  saveDev?: boolean;
  ignoreVersion?: boolean;
}

