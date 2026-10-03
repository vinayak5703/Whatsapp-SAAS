module.exports = {
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(@whiskeysockets/baileys)/)'],
  testEnvironment: 'node',
};