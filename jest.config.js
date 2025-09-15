import { createDefaultEsmPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultEsmPreset().transform;

export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    // Autorise les imports sans extension .js après compilation
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
