import { jest } from '@jest/globals';

const pkgHelperMock = {
  install: jest.fn(),
  autoInstall: jest.fn(),
};

await jest.unstable_mockModule('../helpers/pkg.helper.js', () => pkgHelperMock);

const { installPackages } = await import('../lib/pkgs-handler.js');
const pkgHelper = await import('../helpers/pkg.helper.js');

test('installPackage install the specified package or all the packages in the project.', () => {
  installPackages(['pkgname'], { saveDev: true });
  expect(pkgHelper.install).toHaveBeenCalledWith('pkgname', 'latest', { saveDev: true });
  
  installPackages();
  expect(pkgHelper.autoInstall).toHaveBeenCalledWith({});
  
  installPackages(['pkgname@1.2.3', 'pkgname2@latest']);
  expect(pkgHelper.install).toHaveBeenCalledWith('pkgname', '1.2.3', {});
  expect(pkgHelper.install).toHaveBeenCalledWith('pkgname2', 'latest', {});
});
