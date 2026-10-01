/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  maxWorkers: 1,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          verbatimModuleSyntax: false,
          types: ['node', 'jest']
        }
      }
    ]
  },
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
    '^@src/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 30000
};
