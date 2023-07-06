/** @type {import('ts-jest').JestConfigWithTsJest} */
// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "<rootDir>/src/tests/setupTests.ts",
  globalTeardown: "<rootDir>/src/tests/teardownTests.ts",
};
