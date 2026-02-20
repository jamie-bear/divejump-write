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
  content: string; // Tiptap JSON string
  order: number;
  notes: Note[];
  wordCountOverride?: number;
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
  dailyGoal: number; // words per day target
  goalHistory: DailyGoal[];
  createdAt: string;
  updatedAt: string;
}

export interface BookState {
  book: Book;
  activeSectionId: string | null;
  showNotesPanel: boolean;
  showGoalPanel: boolean;
  showExportModal: boolean;
  showTemplateModal: boolean;
  isDirty: boolean;
}

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
