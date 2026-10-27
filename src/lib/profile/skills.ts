/** The skills offered as the user types (UX: research, design, writing, the tools), each with the other ways a
    posting may say it. A skill the user types that isn't here is kept too, and found by its own name. */
export interface KnownSkill {
  name: string;
  /** Other wordings to find it by in a posting; the name itself always counts. */
  aliases?: string[];
  /** A tool (Figma, Miro…), listed under Tools in About you; everything else is a skill. */
  tool?: true;
}

export const SKILLS: KnownSkill[] = [
  // Research
  { name: 'User research', aliases: ['UX research', 'design research'] },
  { name: 'User interviews', aliases: ['user interview', 'interviewing users', 'customer interviews'] },
  { name: 'Usability testing', aliases: ['usability test', 'usability tests', 'user testing'] },
  { name: 'Surveys', aliases: ['survey'] },
  { name: 'Card sorting', aliases: ['card sort'] },
  { name: 'Tree testing', aliases: ['tree test'] },
  { name: 'Contextual inquiry' },
  { name: 'Diary studies', aliases: ['diary study'] },
  { name: 'A/B testing', aliases: ['A/B test', 'A/B tests', 'split testing', 'experimentation'] },
  { name: 'Competitive analysis', aliases: ['competitor analysis'] },
  { name: 'Heuristic evaluation', aliases: ['heuristic review', 'UX audit'] },
  { name: 'Personas', aliases: ['persona'] },
  { name: 'Journey mapping', aliases: ['journey map', 'journey maps', 'customer journey'] },
  { name: 'Service blueprints', aliases: ['service blueprint'] },
  { name: 'Jobs to be done', aliases: ['JTBD'] },
  { name: 'Affinity mapping', aliases: ['affinity diagram'] },
  { name: 'Research synthesis', aliases: ['synthesis'] },
  { name: 'Qualitative research', aliases: ['qualitative'] },
  { name: 'Quantitative research', aliases: ['quantitative'] },
  { name: 'Analytics', aliases: ['product analytics', 'data-informed', 'data-driven'] },
  // Design
  { name: 'Product design' },
  { name: 'Interaction design', aliases: ['IxD'] },
  { name: 'UI design', aliases: ['user interface design', 'interface design'] },
  { name: 'Visual design' },
  { name: 'Information architecture' },
  { name: 'Wireframing', aliases: ['wireframe', 'wireframes'] },
  { name: 'Prototyping', aliases: ['prototype', 'prototypes'] },
  { name: 'User flows', aliases: ['user flow', 'task flows'] },
  { name: 'Design systems', aliases: ['design system', 'component library'] },
  { name: 'Design tokens', aliases: ['design token'] },
  { name: 'Typography' },
  { name: 'Motion design', aliases: ['animation', 'micro-interactions', 'microinteractions'] },
  { name: 'Responsive design', aliases: ['responsive'] },
  { name: 'Mobile design', aliases: ['mobile app', 'mobile apps', 'iOS', 'Android'] },
  { name: 'Web design' },
  { name: 'Dashboard design', aliases: ['dashboards'] },
  { name: 'Data visualization', aliases: ['data visualisation', 'dataviz'] },
  { name: 'Iconography', aliases: ['icons'] },
  { name: 'Illustration' },
  { name: 'Branding', aliases: ['brand identity', 'brand design'] },
  { name: 'Accessibility', aliases: ['WCAG', 'a11y', 'accessible design'] },
  { name: 'Inclusive design' },
  { name: 'Service design' },
  { name: 'Conversation design', aliases: ['conversational design', 'chatbot'] },
  { name: 'Voice interfaces', aliases: ['voice UI', 'VUI'] },
  { name: 'AI products', aliases: ['AI features', 'LLM', 'generative AI'] },
  { name: 'Design QA', aliases: ['design review of builds'] },
  { name: 'Developer handoff', aliases: ['handoff', 'hand-off'] },
  // Writing and content
  { name: 'UX writing', aliases: ['UX copy', 'product copy'] },
  { name: 'Content design', aliases: ['content designer'] },
  { name: 'Content strategy' },
  { name: 'Microcopy' },
  { name: 'Localization', aliases: ['localisation', 'internationalization', 'i18n'] },
  // Ways of working
  { name: 'Design thinking' },
  { name: 'Workshop facilitation', aliases: ['facilitation', 'facilitating workshops', 'workshops'] },
  { name: 'Design sprints', aliases: ['design sprint'] },
  { name: 'Lean UX' },
  { name: 'Agile', aliases: ['Scrum', 'Kanban'] },
  { name: 'Stakeholder management', aliases: ['stakeholders'] },
  { name: 'Product strategy' },
  { name: 'Storytelling', aliases: ['presenting', 'presentation skills'] },
  { name: 'Design leadership', aliases: ['leading designers', 'design lead'] },
  { name: 'Mentoring', aliases: ['mentor', 'coaching'] },
  { name: 'DesignOps', aliases: ['design operations', 'design ops'] },
  // Fields
  { name: 'B2B', aliases: ['enterprise software'] },
  { name: 'SaaS' },
  { name: 'E-commerce', aliases: ['ecommerce'] },
  { name: 'Fintech', aliases: ['banking', 'payments'] },
  { name: 'Healthcare', aliases: ['health tech', 'healthtech'] },
  { name: 'Edtech', aliases: ['education technology'] },
  // Tools
  { name: 'Figma', tool: true },
  { name: 'FigJam', tool: true },
  { name: 'Sketch', tool: true },
  { name: 'Adobe XD', tool: true },
  { name: 'Photoshop', tool: true },
  { name: 'Illustrator', tool: true },
  { name: 'After Effects', tool: true },
  { name: 'InVision', tool: true },
  { name: 'Framer', tool: true },
  { name: 'Webflow', tool: true },
  { name: 'ProtoPie', tool: true },
  { name: 'Axure', tool: true },
  { name: 'Balsamiq', tool: true },
  { name: 'Miro', tool: true },
  { name: 'Mural', tool: true },
  { name: 'Maze', tool: true },
  { name: 'UserTesting', aliases: ['UserTesting.com'], tool: true },
  { name: 'Lookback', tool: true },
  { name: 'Hotjar', tool: true },
  { name: 'Optimal Workshop', tool: true },
  { name: 'Dovetail', tool: true },
  { name: 'Google Analytics', aliases: ['GA4'], tool: true },
  { name: 'Mixpanel', tool: true },
  { name: 'Amplitude', tool: true },
  { name: 'Jira', tool: true },
  { name: 'Confluence', tool: true },
  { name: 'Notion', tool: true },
  { name: 'Storybook', tool: true },
  { name: 'Zeplin', tool: true },
  { name: 'Lottie', tool: true },
  { name: 'Spline', tool: true },
  // Code
  { name: 'HTML' },
  { name: 'CSS', aliases: ['Sass', 'SCSS'] },
  { name: 'JavaScript', aliases: ['TypeScript'] },
  { name: 'React', aliases: ['React.js', 'ReactJS'] },
  { name: 'SwiftUI' },
  { name: 'Git', aliases: ['GitHub', 'GitLab'] }
];

export const MAX_SKILLS = 100;
export const MAX_SKILL_LENGTH = 60;

const known = new Map(SKILLS.map((skill) => [skill.name.toLocaleLowerCase(), skill]));

/** About you keeps two lists: what the user knows how to do, and the tools they use. */
export type SkillKind = 'skill' | 'tool';

/** A known tool is a tool; anything else — a skill from the list or one the user typed — is a skill. */
export function kindOf(name: string): SkillKind {
  return known.get(name.toLocaleLowerCase())?.tool ? 'tool' : 'skill';
}

/** The ones Merit offers as the user types in one of the two lists. */
export function knownOfKind(kind: SkillKind): KnownSkill[] {
  return SKILLS.filter((skill) => kindOf(skill.name) === kind);
}

/** One list from before tools had their own, split in two by what Merit knows. */
export function splitByKind(names: string[]): { skills: string[]; tools: string[] } {
  return { skills: names.filter((name) => kindOf(name) === 'skill'), tools: names.filter((name) => kindOf(name) === 'tool') };
}

function escape(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

/** A whole word or phrase, whatever its case: "CSS" in "CSS skills", not in "accessible". */
function mentions(text: string, term: string): boolean {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escape(term)}($|[^\\p{L}\\p{N}])`, 'iu').test(text);
}

/** Whether a posting names a skill: by its name, or for a known one, by any of its other wordings. */
export function skillMentioned(text: string, skill: string): boolean {
  const terms = [skill, ...(known.get(skill.toLocaleLowerCase())?.aliases ?? [])];
  return terms.some((term) => mentions(text, term));
}

export interface SkillsFit {
  /** The user's skills the posting names. */
  have: string[];
  /** Skills from the list the posting names that the user hasn't added. */
  notListed: string[];
}

/** How the user's skills meet a posting, by the names it uses; no AI, so it only finds what is spelled out. */
export function skillsFit(text: string, mine: string[]): SkillsFit {
  const ownNames = new Set(mine.map((skill) => skill.toLocaleLowerCase()));
  return {
    have: mine.filter((skill) => skillMentioned(text, skill)),
    notListed: SKILLS.filter((skill) => !ownNames.has(skill.name.toLocaleLowerCase()) && skillMentioned(text, skill.name)).map(
      (skill) => skill.name
    )
  };
}

/** Of the skills and tools a posting names, how many the user has; null when it names none. */
export function skillsShare(fit: SkillsFit): { have: number; asked: number } | null {
  const asked = fit.have.length + fit.notListed.length;
  return asked === 0 ? null : { have: fit.have.length, asked };
}

/** Fewer postings than this make no trend: the dashboard waits for them. */
export const DEMAND_MIN_POSTINGS = 5;
/** A skill named in a single posting isn't asked for "often". */
const DEMAND_MIN_MENTIONS = 2;
/** Each of the dashboard's two columns, skills and tools. */
const DEMAND_SHOWN = 5;

export interface SkillDemand {
  name: string;
  /** How many of the postings name it. */
  count: number;
  /** On the user's list in About you. */
  have: boolean;
}

/** The skills, or the tools, the postings name most often — Merit's list and the user's own list of that kind — by
    the names they use, no AI. */
export function skillsInDemand(texts: string[], mine: string[], kind: SkillKind): SkillDemand[] {
  const ownNames = new Set(mine.map((skill) => skill.toLocaleLowerCase()));
  const names = [...knownOfKind(kind).map((skill) => skill.name), ...mine.filter((skill) => !known.has(skill.toLocaleLowerCase()))];
  return names
    .map((name) => ({
      name,
      count: texts.filter((text) => skillMentioned(text, name)).length,
      have: ownNames.has(name.toLocaleLowerCase())
    }))
    .filter((skill) => skill.count >= DEMAND_MIN_MENTIONS)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, DEMAND_SHOWN);
}

/** A skill as typed: trimmed, one space between words, cut to a sane length; the list's own spelling when it is one
    of the known ones. */
export function cleanSkill(typed: string): string {
  const cleaned = typed.replace(/\s+/g, ' ').trim().slice(0, MAX_SKILL_LENGTH);
  return known.get(cleaned.toLocaleLowerCase())?.name ?? cleaned;
}

/** The skills from a file or a form: strings only, cleaned, no empty ones, no repeats (whatever their case). */
export function parseSkills(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const skill = cleanSkill(item);
    const key = skill.toLocaleLowerCase();
    if (!skill || seen.has(key)) continue;
    seen.add(key);
    skills.push(skill);
  }
  return skills.slice(0, MAX_SKILLS);
}
