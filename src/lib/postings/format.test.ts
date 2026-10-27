import { describe, expect, it } from 'vitest';
import { displayTitle, titleNamesCompany } from './format.js';

describe('displayTitle', () => {
  it('joins the role and the company', () => {
    expect(displayTitle({ title: 'Senior Designer', company: 'Northwind Studio', titleEdited: false })).toBe(
      'Senior Designer at Northwind Studio'
    );
  });

  it("keeps the user's own title exactly as they wrote it", () => {
    const edited = { title: 'Sen Product Designer at Adobe', company: 'Adobe', titleEdited: true };
    expect(displayTitle(edited)).toBe('Sen Product Designer at Adobe');
    expect(titleNamesCompany(edited)).toBe(true);
  });

  it('shows the title alone with no company, or one that only repeats it', () => {
    expect(displayTitle({ title: 'UX Researcher', company: '', titleEdited: false })).toBe('UX Researcher');
    expect(displayTitle({ title: 'Adobe', company: 'adobe', titleEdited: false })).toBe('Adobe');
  });

  it("says when a user's title leaves the company out, so the line under it can name it", () => {
    expect(titleNamesCompany({ title: 'Product Designer', company: 'Adobe', titleEdited: true })).toBe(false);
  });
});
