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
        id: generateId(),
        type: 'chapter',
        title: 'Chapter One',
        content: '',
        order: 1,
        notes: [],
      },
    ],
    coverImage: null,
    paragraphIndent: true,
    dailyGoal: 1000,
    wordCountGoal: 80000,
    goalHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

function applyBookMutation(
  s: { book: Book; allBooks: Book[] },
  updater: (b: Book) => Book
): { book: Book; allBooks: Book[] } {
  const updated = updater(s.book);
  return {
    book: updated,
    allBooks: s.allBooks.map((b) => (b.id === updated.id ? updated : b)),
  };
}

interface BookStore {
  book: Book;
  allBooks: Book[];
  currentBookId: string;
  activeSectionId: string | null;
  showNotesPanel: boolean;
  showGoalPanel: boolean;
  showExportModal: boolean;
  showTemplateModal: boolean;
  showLibrary: boolean;

  // Book metadata
  setBookTitle: (title: string) => void;
  setBookAuthor: (author: string) => void;
  setTemplate: (template: Template) => void;
  setCoverImage: (image: string | null) => void;
  setParagraphIndent: (indent: boolean) => void;

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
  setWordCountGoal: (words: number) => void;
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
  openLibrary: () => void;
  closeLibrary: () => void;

  // Library / book management
  openBook: (id: string) => void;
  createBook: () => void;
  deleteBook: (id: string) => void;
  newBook: () => void;
  importBook: (book: Book) => void;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => {
      const defaultBook = createDefaultBook();
      return {
        book: defaultBook,
        allBooks: [defaultBook],
        currentBookId: defaultBook.id,
        activeSectionId: null,
        showNotesPanel: false,
        showGoalPanel: false,
        showExportModal: false,
        showTemplateModal: false,
        showLibrary: false,

        setBookTitle: (title) =>
          set((s) => applyBookMutation(s, (b) => ({ ...b, title, updatedAt: new Date().toISOString() }))),

        setBookAuthor: (author) =>
          set((s) => applyBookMutation(s, (b) => ({ ...b, author, updatedAt: new Date().toISOString() }))),

        setTemplate: (template) =>
          set((s) => applyBookMutation(s, (b) => ({ ...b, template, updatedAt: new Date().toISOString() }))),

        setCoverImage: (image) =>
          set((s) =>
            applyBookMutation(s, (b) => ({ ...b, coverImage: image, updatedAt: new Date().toISOString() }))
          ),

        setParagraphIndent: (indent) =>
          set((s) =>
            applyBookMutation(s, (b) => ({ ...b, paragraphIndent: indent, updatedAt: new Date().toISOString() }))
          ),

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
            ...applyBookMutation(s, (b) => ({
              ...b,
              sections: [...b.sections, newSection],
              updatedAt: new Date().toISOString(),
            })),
            activeSectionId: newSection.id,
          }));
        },

        removeSection: (id) => {
          const { book, activeSectionId } = get();
          if (book.sections.length <= 1) return;
          const filtered = book.sections.filter((s) => s.id !== id);
          set((s) => ({
            ...applyBookMutation(s, (b) => ({
              ...b,
              sections: filtered,
              updatedAt: new Date().toISOString(),
            })),
            activeSectionId: activeSectionId === id ? (filtered[0]?.id ?? null) : activeSectionId,
          }));
        },

        renameSection: (id, title) =>
          set((s) =>
            applyBookMutation(s, (b) => ({
              ...b,
              sections: b.sections.map((sec) => (sec.id === id ? { ...sec, title } : sec)),
              updatedAt: new Date().toISOString(),
            }))
          ),

        reorderSections: (sections) =>
          set((s) =>
            applyBookMutation(s, (b) => ({ ...b, sections, updatedAt: new Date().toISOString() }))
          ),

        updateSectionContent: (id, content) =>
          set((s) =>
            applyBookMutation(s, (b) => ({
              ...b,
              sections: b.sections.map((sec) => (sec.id === id ? { ...sec, content } : sec)),
              updatedAt: new Date().toISOString(),
            }))
          ),

        addNote: (sectionId, content, color = 'yellow') => {
          const newNote: Note = {
            id: generateId(),
            content,
            pinned: false,
            color,
            createdAt: new Date().toISOString(),
          };
          set((s) =>
            applyBookMutation(s, (b) => ({
              ...b,
              sections: b.sections.map((sec) =>
                sec.id === sectionId ? { ...sec, notes: [...sec.notes, newNote] } : sec
              ),
            }))
          );
        },

        updateNote: (sectionId, noteId, content) =>
          set((s) =>
            applyBookMutation(s, (b) => ({
              ...b,
              sections: b.sections.map((sec) =>
                sec.id === sectionId
                  ? { ...sec, notes: sec.notes.map((n) => (n.id === noteId ? { ...n, content } : n)) }
                  : sec
              ),
            }))
          ),

        deleteNote: (sectionId, noteId) =>
          set((s) =>
            applyBookMutation(s, (b) => ({
              ...b,
              sections: b.sections.map((sec) =>
                sec.id === sectionId
                  ? { ...sec, notes: sec.notes.filter((n) => n.id !== noteId) }
                  : sec
              ),
            }))
          ),

        toggleNotePin: (sectionId, noteId) =>
          set((s) =>
            applyBookMutation(s, (b) => ({
              ...b,
              sections: b.sections.map((sec) =>
                sec.id === sectionId
                  ? {
                      ...sec,
                      notes: sec.notes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n)),
                    }
                  : sec
              ),
            }))
          ),

        setDailyGoal: (words) =>
          set((s) => applyBookMutation(s, (b) => ({ ...b, dailyGoal: words }))),

        setWordCountGoal: (words) =>
          set((s) => applyBookMutation(s, (b) => ({ ...b, wordCountGoal: words }))),

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
          set((s) => applyBookMutation(s, (b) => ({ ...b, goalHistory: newHistory })));
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
        openLibrary: () => set({ showLibrary: true }),
        closeLibrary: () => set({ showLibrary: false }),

        openBook: (id) => {
          const { allBooks } = get();
          const found = allBooks.find((b) => b.id === id);
          if (!found) return;
          set({
            book: found,
            currentBookId: id,
            activeSectionId: found.sections[0]?.id ?? null,
            showLibrary: false,
          });
        },

        createBook: () => {
          const nb = createDefaultBook();
          set((s) => ({
            book: nb,
            currentBookId: nb.id,
            allBooks: [...s.allBooks, nb],
            activeSectionId: nb.sections[0]?.id ?? null,
            showLibrary: false,
          }));
        },

        deleteBook: (id) => {
          const { allBooks, currentBookId } = get();
          const filtered = allBooks.filter((b) => b.id !== id);
          if (filtered.length === 0) {
            const nb = createDefaultBook();
            set({ allBooks: [nb], book: nb, currentBookId: nb.id, activeSectionId: nb.sections[0]?.id ?? null });
            return;
          }
          if (id === currentBookId) {
            const next = filtered[0];
            set({
              allBooks: filtered,
              book: next,
              currentBookId: next.id,
              activeSectionId: next.sections[0]?.id ?? null,
            });
          } else {
            set({ allBooks: filtered });
          }
        },

        newBook: () => set({ showLibrary: true }),

        importBook: (book) => {
          set((s) => ({
            book,
            currentBookId: book.id,
            allBooks: s.allBooks.some((b) => b.id === book.id)
              ? s.allBooks.map((b) => (b.id === book.id ? book : b))
              : [...s.allBooks, book],
            activeSectionId: book.sections[0]?.id ?? null,
          }));
        },
      };
    },
    {
      name: 'book-editor-storage',
      version: 3,
      migrate: (persisted, version) => {
        const s = persisted as {
          book?: Partial<Book> & { id?: string };
          allBooks?: Book[];
          currentBookId?: string;
        };
        if (version < 2 && s.book) {
          s.book.coverImage = s.book.coverImage ?? null;
          s.book.paragraphIndent = s.book.paragraphIndent ?? true;
          s.book.wordCountGoal = s.book.wordCountGoal ?? 80000;
        }
        if (version < 3 && s.book) {
          if (!s.book.id) s.book.id = generateId();
          const book = s.book as Book;
          s.allBooks = s.allBooks ?? [book];
          s.currentBookId = s.currentBookId ?? book.id;
        }
        return persisted as BookStore;
      },
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
