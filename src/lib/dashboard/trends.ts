/** One thing the AI engine found in the postings read together that the user couldn't see by counting: not true of
    most design jobs, about this user, and leading to a decision. */
export interface Insight {
  /** A few words, read first. */
  title: string;
  /** One or two sentences. */
  text: string;
  /** The postings it is about, by title (and company when the posting names one). */
  postings: string[];
}

/** The last reading, as the dashboard shows it. */
export interface TrendsReading {
  /** None when nothing passed the tests. */
  insights: Insight[];
  /** ISO date-time. */
  readAt: string;
  engine: string;
  /** How many postings it read. */
  postings: number;
  /** The postings or About you changed since. */
  outdated: boolean;
}
