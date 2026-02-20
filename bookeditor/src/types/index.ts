export type SectionType = 'frontmatter' | 'chapter' | 'backmatter';

export type Template = 'reedsy' | 'classic' | 'romance';

export interface Note {
  id: string;
  content: string;
  pinned: boolean;
  color: 'yellow' | 'blue' | 'green' | 'pink';
  createdAt: string;
}

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  // Tiptap JSON string OR epigraph JSON: { __type: 'epigraph', quote: string, attribution: string }
  content: string;
  order: number;
  notes: Note[];
}

export interface DailyGoal {
  date: string; // ISO date string YYYY-MM-DD
  target: number;
  wordsWritten: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  template: Template;
  sections: Section[];
  coverImage: string | null;    // base64 data URL
  paragraphIndent: boolean;     // true = first-line indent, false = spaced
  chapterNumbers?: boolean;     // show chapter number above chapter titles
  dailyGoal: number;
  wordCountGoal: number;        // total manuscript target, e.g. 80000
  goalHistory: DailyGoal[];
  createdAt: string;
  updatedAt: string;
}

// Special pseudo-section ID used to display the cover editor
export const COVER_SECTION_ID = '__cover__';

export const FRONT_MATTER_PRESETS: { title: string; subtitle?: string }[] = [
  { title: 'Half Title Page' },
  { title: 'Title Page' },
  { title: 'Copyright' },
  { title: 'Dedication' },
  { title: 'Epigraph' },
  { title: 'Table of Contents' },
  { title: 'Foreword' },
  { title: 'Preface' },
];

export const BACK_MATTER_PRESETS: { title: string }[] = [
  { title: 'Epilogue' },
  { title: 'Afterword' },
  { title: 'Acknowledgments' },
  { title: 'About the Author' },
  { title: 'Bibliography' },
  { title: 'Glossary' },
  { title: 'Index' },
];
