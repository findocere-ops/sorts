/**
 * t8 — env startup contract.
 *
 *  Asserts:
 *    - Missing PORT (rendered non-numeric) fails loadEnv via zod.
 *    - Invalid FRONTEND_URL fails loadEnv.
 *    - A fully-valid env passes.
 */

import { loadEnv } from '../config/env';

describe('loadEnv (t8)', () => {
  let snap: NodeJS.ProcessEnv;
  beforeEach(() => { snap = { ...process.env }; });
  afterEach(() => { process.env = { ...snap }; });

  it('throws when PORT is non-numeric', () => {
    process.env.PORT = 'abc';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    expect(() => loadEnv()).toThrow();
  });

  it('throws when FRONTEND_URL is not a URL', () => {
    process.env.PORT = '3001';
    process.env.FRONTEND_URL = 'not-a-url';
    expect(() => loadEnv()).toThrow();
  });

  it('passes with a valid env', () => {
    process.env.PORT = '3001';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    const env = loadEnv();
    expect(env.PORT).toBe(3001);
    expect(env.FRONTEND_URL).toBe('http://localhost:3000');
  });
});
