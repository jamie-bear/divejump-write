import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Book, Section, SectionType, Note, Template, DailyGoal } from '../types';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function createDefaultBook(): Book {
  const now = new Date().toISOString();
  const chapterId = generateId();
  return {
    id: generateId(),
    title: 'Untitled Book',
    author: '',
    template: 'reedsy',
    sections: [
      {
        id: generateId(),
        type: 'frontmatter',
        title: 'Title Page',
        content: '',
        order: 0,
        notes: [],
      },
      {
        id: chapterId,
        type: 'chapter',
        title: 'Chapter One',
        content: '',
        order: 1,
        notes: [],
      },
    ],
    dailyGoal: 1000,
    goalHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface BookStore {
  book: Book;
  activeSectionId: string | null;
  showNotesPanel: boolean;
  showGoalPanel: boolean;
  showExportModal: boolean;
  showTemplateModal: boolean;

  // Book metadata
  setBookTitle: (title: string) => void;
  setBookAuthor: (author: string) => void;
  setTemplate: (template: Template) => void;

  // Section management
  setActiveSection: (id: string) => void;
  addSection: (type: SectionType, title?: string) => void;
  removeSection: (id: string) => void;
  renameSection: (id: string, title: string) => void;
  reorderSections: (sections: Section[]) => void;
  updateSectionContent: (id: string, content: string) => void;

  // Notes
  addNote: (sectionId: string, content: string, color?: Note['color']) => void;
  updateNote: (sectionId: string, noteId: string, content: string) => void;
  deleteNote: (sectionId: string, noteId: string) => void;
  toggleNotePin: (sectionId: string, noteId: string) => void;

  // Goals
  setDailyGoal: (words: number) => void;
  updateDailyProgress: (words: number) => void;
  getTodayGoal: () => DailyGoal;
  getTotalWordCount: () => number;

  // UI state
  toggleNotesPanel: () => void;
  toggleGoalPanel: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  openTemplateModal: () => void;
  closeTemplateModal: () => void;

  // Book management
  newBook: () => void;
  importBook: (book: Book) => void;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      book: createDefaultBook(),
      activeSectionId: null,
      showNotesPanel: false,
      showGoalPanel: false,
      showExportModal: false,
      showTemplateModal: false,

      setBookTitle: (title) =>
        set((s) => ({
          book: { ...s.book, title, updatedAt: new Date().toISOString() },
        })),

      setBookAuthor: (author) =>
        set((s) => ({
          book: { ...s.book, author, updatedAt: new Date().toISOString() },
        })),

      setTemplate: (template) =>
        set((s) => ({
          book: { ...s.book, template, updatedAt: new Date().toISOString() },
        })),

      setActiveSection: (id) => set({ activeSectionId: id }),

      addSection: (type, title) => {
        const { book } = get();
        const sectionsOfType = book.sections.filter((s) => s.type === type);
        let newTitle = title;
        if (!newTitle) {
          if (type === 'chapter') {
            newTitle = `Chapter ${sectionsOfType.length + 1}`;
          } else if (type === 'frontmatter') {
            newTitle = 'Front Matter';
          } else {
            newTitle = 'Back Matter';
          }
        }
        const newSection: Section = {
          id: generateId(),
          type,
          title: newTitle,
          content: '',
          order: book.sections.length,
          notes: [],
        };
        set((s) => ({
          book: {
            ...s.book,
            sections: [...s.book.sections, newSection],
            updatedAt: new Date().toISOString(),
          },
          activeSectionId: newSection.id,
        }));
      },

      removeSection: (id) => {
        const { book, activeSectionId } = get();
        if (book.sections.length <= 1) return;
        const filtered = book.sections.filter((s) => s.id !== id);
        set((s) => ({
          book: {
            ...s.book,
            sections: filtered,
            updatedAt: new Date().toISOString(),
          },
          activeSectionId: activeSectionId === id ? (filtered[0]?.id ?? null) : activeSectionId,
        }));
      },

      renameSection: (id, title) =>
        set((s) => ({
          book: {
            ...s.book,
            sections: s.book.sections.map((sec) =>
              sec.id === id ? { ...sec, title } : sec
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      reorderSections: (sections) =>
        set((s) => ({
          book: { ...s.book, sections, updatedAt: new Date().toISOString() },
        })),

      updateSectionContent: (id, content) =>
        set((s) => ({
          book: {
            ...s.book,
            sections: s.book.sections.map((sec) =>
              sec.id === id ? { ...sec, content } : sec
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      addNote: (sectionId, content, color = 'yellow') => {
        const newNote: Note = {
          id: generateId(),
          content,
          pinned: false,
          color,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          book: {
            ...s.book,
            sections: s.book.sections.map((sec) =>
              sec.id === sectionId
                ? { ...sec, notes: [...sec.notes, newNote] }
                : sec
            ),
          },
        }));
      },

      updateNote: (sectionId, noteId, content) =>
        set((s) => ({
          book: {
            ...s.book,
            sections: s.book.sections.map((sec) =>
              sec.id === sectionId
                ? {
                    ...sec,
                    notes: sec.notes.map((n) =>
                      n.id === noteId ? { ...n, content } : n
                    ),
                  }
                : sec
            ),
          },
        })),

      deleteNote: (sectionId, noteId) =>
        set((s) => ({
          book: {
            ...s.book,
            sections: s.book.sections.map((sec) =>
              sec.id === sectionId
                ? { ...sec, notes: sec.notes.filter((n) => n.id !== noteId) }
                : sec
            ),
          },
        })),

      toggleNotePin: (sectionId, noteId) =>
        set((s) => ({
          book: {
            ...s.book,
            sections: s.book.sections.map((sec) =>
              sec.id === sectionId
                ? {
                    ...sec,
                    notes: sec.notes.map((n) =>
                      n.id === noteId ? { ...n, pinned: !n.pinned } : n
                    ),
                  }
                : sec
            ),
          },
        })),

      setDailyGoal: (words) =>
        set((s) => ({
          book: { ...s.book, dailyGoal: words },
        })),

      updateDailyProgress: (words) => {
        const { book } = get();
        const todayStr = today();
        const existingIdx = book.goalHistory.findIndex((g) => g.date === todayStr);
        let newHistory: DailyGoal[];
        if (existingIdx >= 0) {
          newHistory = book.goalHistory.map((g, i) =>
            i === existingIdx ? { ...g, wordsWritten: words } : g
          );
        } else {
          newHistory = [
            ...book.goalHistory,
            { date: todayStr, target: book.dailyGoal, wordsWritten: words },
          ];
        }
        set((s) => ({
          book: { ...s.book, goalHistory: newHistory },
        }));
      },

      getTodayGoal: () => {
        const { book } = get();
        const todayStr = today();
        return (
          book.goalHistory.find((g) => g.date === todayStr) ?? {
            date: todayStr,
            target: book.dailyGoal,
            wordsWritten: 0,
          }
        );
      },

      getTotalWordCount: () => {
        const { book } = get();
        return book.sections.reduce((total, sec) => {
          if (!sec.content) return total;
          try {
            const parsed = JSON.parse(sec.content);
            const text = extractText(parsed);
            return total + countWords(text);
          } catch {
            return total + countWords(sec.content);
          }
        }, 0);
      },

      toggleNotesPanel: () => set((s) => ({ showNotesPanel: !s.showNotesPanel })),
      toggleGoalPanel: () => set((s) => ({ showGoalPanel: !s.showGoalPanel })),
      openExportModal: () => set({ showExportModal: true }),
      closeExportModal: () => set({ showExportModal: false }),
      openTemplateModal: () => set({ showTemplateModal: true }),
      closeTemplateModal: () => set({ showTemplateModal: false }),

      newBook: () => {
        const book = createDefaultBook();
        set({
          book,
          activeSectionId: book.sections[0]?.id ?? null,
        });
      },

      importBook: (book) => set({ book, activeSectionId: book.sections[0]?.id ?? null }),
    }),
    {
      name: 'book-editor-storage',
      version: 1,
    }
  )
);

function extractText(node: Record<string, unknown>): string {
  if (node.type === 'text' && typeof node.text === 'string') return node.text;
  if (Array.isArray(node.content)) {
    return (node.content as Record<string, unknown>[]).map(extractText).join(' ');
  }
  return '';
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function extractTextFromJSON(jsonStr: string): string {
  if (!jsonStr) return '';
  try {
    const parsed = JSON.parse(jsonStr);
    return extractText(parsed);
  } catch {
    return jsonStr;
  }
}
