module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: ['services/**/*.ts', 'components/**/*.tsx'],
  // Backend tests import from ../backend; babel-injected @babel/runtime must resolve via frontend/node_modules
  moduleNameMapper: {
    '^@babel/runtime/(.*)$': '<rootDir>/node_modules/@babel/runtime/$1',
  },
};
