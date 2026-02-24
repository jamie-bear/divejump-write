import type { Book } from '../../types';
import { buildExportBaseName, exportTimestamp } from './filename';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

/** Export a single book as a .djbook file (JSON with embedded base64 cover). */
export function exportBookJSON(book: Book): void {
  const json = JSON.stringify(book, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${buildExportBaseName(book.title)}.djbook`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export the entire library as a .djlib file. */
export function exportLibraryJSON(books: Book[]): void {
  const data = { version: 1, books };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DiveJump-Library_${exportTimestamp()}.djlib`;
  a.click();
  URL.revokeObjectURL(url);
}

const VALID_SECTION_TYPES = new Set(['frontmatter', 'chapter', 'backmatter']);

function validateSection(raw: unknown, idx: number): import('../../types').Section {
  if (!raw || typeof raw !== 'object') throw new Error(`Section ${idx} is not an object`);
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== 'string' || !s.id) throw new Error(`Section ${idx} is missing a valid id`);
  if (typeof s.title !== 'string') throw new Error(`Section ${idx} ("${s.id}") is missing a title`);
  if (!VALID_SECTION_TYPES.has(s.type as string)) {
    throw new Error(`Section ${idx} ("${s.id}") has invalid type: "${s.type}"`);
  }
  // Coerce notes: keep only well-shaped notes, drop the rest silently
  const rawNotes = Array.isArray(s.notes) ? s.notes : [];
  const notes = rawNotes.filter(
    (n): n is import('../../types').Note =>
      !!n &&
      typeof n === 'object' &&
      typeof (n as Record<string, unknown>).id === 'string' &&
      typeof (n as Record<string, unknown>).content === 'string'
  );
  return {
    id: s.id,
    type: s.type as import('../../types').SectionType,
    title: s.title,
    subtitle: typeof s.subtitle === 'string' ? s.subtitle : undefined,
    content: typeof s.content === 'string' ? s.content : '',
    order: typeof s.order === 'number' ? s.order : idx,
    notes,
  };
}

/**
 * Import from a .djbook or .djlib file.
 * Returns a single Book for .djbook, or Book[] for .djlib.
 */
export async function importFromFile(file: File): Promise<Book | Book[]> {
  const text = await file.text();
  const data = JSON.parse(text) as Record<string, unknown>;

  // Library file: { version: number, books: Book[] }
  if (typeof data.version === 'number' && Array.isArray(data.books)) {
    return data.books.map((b, i) => {
      // Basic check on each book in the library
      if (!b || typeof b !== 'object') throw new Error(`Library entry ${i} is not a valid book`);
      const raw = b as Record<string, unknown>;
      if (typeof raw.title !== 'string') throw new Error(`Library entry ${i} is missing a title`);
      if (!Array.isArray(raw.sections)) throw new Error(`Library entry ${i} is missing sections`);
      const now = new Date().toISOString();
      return {
        id: typeof raw.id === 'string' ? raw.id : generateId(),
        title: raw.title,
        author: typeof raw.author === 'string' ? raw.author : '',
        template: (['reedsy', 'classic', 'romance'].includes(raw.template as string) ? raw.template : 'reedsy') as Book['template'],
        sections: (raw.sections as unknown[]).map((s, si) => validateSection(s, si)),
        coverImage: typeof raw.coverImage === 'string' ? raw.coverImage : null,
        paragraphIndent: typeof raw.paragraphIndent === 'boolean' ? raw.paragraphIndent : true,
        chapterNumbers: typeof raw.chapterNumbers === 'boolean' ? raw.chapterNumbers : false,
        dailyGoal: typeof raw.dailyGoal === 'number' ? raw.dailyGoal : 1000,
        wordCountGoal: typeof raw.wordCountGoal === 'number' ? raw.wordCountGoal : 80000,
        goalHistory: Array.isArray(raw.goalHistory) ? raw.goalHistory : [],
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
        updatedAt: now,
      } satisfies Book;
    });
  }

  // Single book file
  const book = data as Partial<Book>;
  if (typeof book.title !== 'string') throw new Error('Invalid file: missing title');
  if (!Array.isArray(book.sections)) throw new Error('Invalid file: missing sections');

  const now = new Date().toISOString();
  return {
    id: book.id ?? generateId(),
    title: book.title,
    author: book.author ?? '',
    template: (['reedsy', 'classic', 'romance'].includes(book.template as string) ? book.template : 'reedsy') as Book['template'],
    sections: (book.sections as unknown[]).map((s, i) => validateSection(s, i)),
    coverImage: book.coverImage ?? null,
    paragraphIndent: book.paragraphIndent ?? true,
    chapterNumbers: book.chapterNumbers ?? false,
    dailyGoal: book.dailyGoal ?? 1000,
    wordCountGoal: book.wordCountGoal ?? 80000,
    goalHistory: book.goalHistory ?? [],
    createdAt: book.createdAt ?? now,
    updatedAt: now,
  };
}

/** @deprecated Use importFromFile instead */
export async function importBookFromJSON(file: File): Promise<Book> {
  const result = await importFromFile(file);
  if (Array.isArray(result)) throw new Error('File is a library (.djlib), not a single book');
  return result;
}

