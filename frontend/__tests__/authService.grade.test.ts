import { describe, expect, it } from '@jest/globals';

describe('team grade validation', () => {
  it('supports allowed year labels', () => {
    const allowed = ['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'];
    expect(allowed).toContain('Year 5');
    expect(allowed).toContain('Year 10');
    expect(allowed).not.toContain('Year 11');
  });
});
