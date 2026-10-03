module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts', '**/src/**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/uploads/'],
  testPathIgnorePatterns: ['/node_modules/', '/uploads/'],
  testTimeout: 60000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
