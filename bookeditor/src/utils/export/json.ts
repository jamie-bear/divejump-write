import type { Book } from '../../types';

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
  a.download = `${book.title.replace(/[^a-z0-9]/gi, '_') || 'book'}.djbook`;
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
  a.download = 'DiveJump-Library.djlib';
  a.click();
  URL.revokeObjectURL(url);
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
    return data.books as Book[];
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
    template: book.template ?? 'reedsy',
    sections: book.sections,
    coverImage: book.coverImage ?? null,
    paragraphIndent: book.paragraphIndent ?? true,
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

