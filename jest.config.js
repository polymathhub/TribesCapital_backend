module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
  },
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
};
