import { describe, expect, it } from 'vitest';
import { cleanSkill, kindOf, parseSkills, skillMentioned, skillsFit, skillsInDemand, skillsShare, splitByKind } from './skills.js';

describe('skillMentioned', () => {
  it('finds a skill by its name or another wording, whatever the case', () => {
    expect(skillMentioned('Strong FIGMA skills', 'Figma')).toBe(true);
    expect(skillMentioned('You run usability tests every sprint', 'Usability testing')).toBe(true);
    expect(skillMentioned('Experience with WCAG 2.2', 'Accessibility')).toBe(true);
  });

  it('only finds whole words', () => {
    expect(skillMentioned('An accessible office', 'CSS')).toBe(false);
    expect(skillMentioned('Knowledge of HTML/CSS', 'CSS')).toBe(true);
  });

  it('finds a skill the user typed by its own name', () => {
    expect(skillMentioned('Experience with Penpot is a plus', 'Penpot')).toBe(true);
  });
});

describe('skillsFit', () => {
  it('splits what the posting names into skills you have and skills you haven’t added', () => {
    const fit = skillsFit('We use Figma and Miro, and you will run user interviews.', ['Figma', 'Prototyping']);
    expect(fit.have).toEqual(['Figma']);
    expect(fit.notListed).toEqual(['User interviews', 'Miro']);
  });
});

describe('skillsShare', () => {
  it('counts what the posting names, and is null when it names nothing', () => {
    expect(skillsShare({ have: ['Figma'], notListed: ['Miro', 'Jira'] })).toEqual({ have: 1, asked: 3 });
    expect(skillsShare({ have: [], notListed: [] })).toBeNull();
  });
});

describe('skillsInDemand', () => {
  const texts = ['Figma and user interviews', 'Figma, WCAG', 'We use Figma and Penpot', 'Accessibility first, Penpot'];

  it('counts the postings naming each skill, most asked first, and leaves out one named only once', () => {
    expect(skillsInDemand(texts, ['Penpot'], 'skill')).toEqual([
      { name: 'Accessibility', count: 2, have: false },
      { name: 'Penpot', count: 2, have: true }
    ]);
  });

  it('counts the tools apart from the skills', () => {
    expect(skillsInDemand(texts, ['Figma'], 'tool')).toEqual([{ name: 'Figma', count: 3, have: true }]);
  });
});

describe('kinds', () => {
  it('knows a tool from a skill; one the user typed is a skill', () => {
    expect(kindOf('figma')).toBe('tool');
    expect(kindOf('Prototyping')).toBe('skill');
    expect(kindOf('Penpot')).toBe('skill');
  });

  it('splits an old single list into skills and tools, keeping their order', () => {
    expect(splitByKind(['HTML', 'Dovetail', 'Figma', 'B2B'])).toEqual({ skills: ['HTML', 'B2B'], tools: ['Dovetail', 'Figma'] });
  });
});

describe('parseSkills', () => {
  it('cleans, keeps the list’s spelling and drops repeats', () => {
    expect(parseSkills(['  figma ', 'Figma', 'My   own skill', 3, ''])).toEqual(['Figma', 'My own skill']);
  });

  it('keeps a known skill’s spelling', () => {
    expect(cleanSkill('ux writing')).toBe('UX writing');
  });
});
