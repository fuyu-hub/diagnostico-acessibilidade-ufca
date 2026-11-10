import { defineConfig } from 'vitest/config';

// Testes das regras do Firestore. Precisam do emulador, por isso ficam fora do `npm test`:
// rode com `npm run test:regras` (exige Java 21).
export default defineConfig({
  test: {
    include: ['regras/**/*.test.js'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20000,
  },
});
