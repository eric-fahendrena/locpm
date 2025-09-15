import { jest } from '@jest/globals';

const pkgHelperMock = {
  install: jest.fn(),
  getPkgs: jest.fn(),
  getPkgPaths: jest.fn(),
  getSavedPkgList: jest.fn(),
  getSavedPkgInfos: jest.fn(),
  updatePkgInfosFile: jest.fn(),
  updatePkgListFile: jest.fn(),
};

await jest.unstable_mockModule('../helpers/pkg.helper.js', () => pkgHelperMock);

const { installPackages, savePackages } = await import('../lib/pkgs-handler.js');
const pkgHelper = await import('../helpers/pkg.helper.js');

test('installPackages installs all when no package specified', () => {
  installPackages(null);
  expect(pkgHelper.install).toHaveBeenCalledWith('*', false);
});
