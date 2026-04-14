module.exports = {
  testEnvironment: 'node',
  rootDir: './src',
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};