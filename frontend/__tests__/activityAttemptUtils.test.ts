import {
  buildSyntheticAttemptId,
  getNextAttemptNumber,
  normalizeActivityAttempts,
  normalizeRawResultEntry,
  parseLegacyReflection,
  truncateReflection,
  validateAttemptSubmission,
} from '@/services/activityAttemptUtils';

describe('activityAttemptUtils', () => {
  it('parses legacy reflection format', () => {
    expect(parseLegacyReflection('Self-rating: 4/5 | Good teamwork')).toEqual({
      selfRating: 4,
      reflectionText: 'Good teamwork',
    });
  });

  it('returns null rating for non-legacy reflection', () => {
    expect(parseLegacyReflection('We improved our design')).toEqual({
      selfRating: null,
      reflectionText: 'We improved our design',
    });
  });

  it('builds stable synthetic attempt ids', () => {
    const id = buildSyntheticAttemptId('hand-fan', '2026-01-01T00:00:00.000Z');
    expect(id.startsWith('legacy-')).toBe(true);
    expect(buildSyntheticAttemptId('hand-fan', '2026-01-01T00:00:00.000Z')).toBe(id);
  });

  it('normalizes and sorts attempts newest first', () => {
    const attempts = normalizeActivityAttempts(
      [
        {
          activityId: 'hand-fan',
          completedAt: '2026-01-01T10:00:00.000Z',
          data: { designs: [] },
        },
        {
          activityId: 'hand-fan',
          completedAt: '2026-01-02T10:00:00.000Z',
          data: { designs: [] },
          attemptNumber: 2,
          selfRating: 5,
          reflection: 'Second try',
        },
      ],
      'hand-fan',
    );

    expect(attempts).toHaveLength(2);
    expect(attempts[0].attemptNumber).toBe(2);
    expect(attempts[0].selfRating).toBe(5);
  });

  it('assigns attempt numbers chronologically for legacy records', () => {
    const entry = normalizeRawResultEntry(
      {
        activityId: 'sound-pollution',
        completedAt: '2026-01-01T10:00:00.000Z',
        data: {},
        reflection: 'Self-rating: 3/5 | Loud hallway',
      },
      1,
    );

    expect(entry?.selfRating).toBe(3);
    expect(entry?.reflection).toBe('Loud hallway');
  });

  it('computes next attempt number', () => {
    expect(getNextAttemptNumber([])).toBe(1);
    expect(getNextAttemptNumber([{ attemptNumber: 2 } as never, { attemptNumber: 5 } as never])).toBe(6);
  });

  it('validates submission input', () => {
    expect(validateAttemptSubmission(4, 'Reflection text').ok).toBe(true);
    expect(validateAttemptSubmission(0, 'Reflection text').ok).toBe(false);
    expect(validateAttemptSubmission(3, '   ').ok).toBe(false);
  });

  it('truncates long reflection previews', () => {
    const longText = 'a'.repeat(150);
    expect(truncateReflection(longText, 120).endsWith('…')).toBe(true);
  });
});
