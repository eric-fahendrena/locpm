import { jest } from '@jest/globals';

const pkgHelperMock = {
  install: jest.fn(),
};

await jest.unstable_mockModule('../helpers/pkg.helper.js', () => pkgHelperMock);

const { installPackages } = await import('../lib/pkgs-handler.js');
const pkgHelper = await import('../helpers/pkg.helper.js');

test('installPackages installs all when no package specified', () => {
  installPackages('./mydir', null);
  expect(pkgHelper.install).toHaveBeenCalledWith('./mydir', '*', false);
});
