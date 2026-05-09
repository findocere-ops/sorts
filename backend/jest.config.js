/** Jest config for @sorts/backend.
 *  Uses ts-jest with the existing tsconfig — no path aliases. Tests live under
 *  backend/src/__tests__/*.test.ts and run against in-memory SQLite + mocked
 *  network calls (no real RPC, no real Privy). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@sorts/shared$': '<rootDir>/../../../packages/shared/src',
    '^@sorts/shared/(.*)$': '<rootDir>/../../../packages/shared/src/$1',
    // Cross-tree alias used by the encoding round-trip test only — lets the
    // backend jest runner import the frontend's `instructions.ts` (which
    // resolves its own internal imports through Next.js's `@/` path alias).
    // Adding this here is safe because no backend source uses the `@/` shape.
    '^@/(.*)$': '<rootDir>/../../frontend/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json', isolatedModules: true }],
  },
  testTimeout: 10_000,
  // Suppress experimental warnings from ts-jest's interop layer.
  silent: false,
};
