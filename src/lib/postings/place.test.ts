import { describe, expect, it } from 'vitest';
import { parsePlace, placeOf } from './place.js';

describe('parsePlace', () => {
  it('reads back a place kept for Undo', () => {
    const place = { application: null, archived: true, keptAnyway: false };
    expect(parsePlace(JSON.parse(JSON.stringify(place)))).toEqual(place);
  });

  it('keeps only the place from a whole posting', () => {
    expect(placeOf({ application: null, archived: false, keptAnyway: true })).toEqual({ application: null, archived: false, keptAnyway: true });
  });

  it('refuses anything malformed', () => {
    expect(parsePlace(null)).toBeNull();
    expect(parsePlace({ application: null, archived: 'yes', keptAnyway: false })).toBeNull();
    expect(parsePlace({ application: { stage: 'bogus' }, archived: false, keptAnyway: false })).toBeNull();
  });
});
