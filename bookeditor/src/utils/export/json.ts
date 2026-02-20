import type { Book } from '../../types';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

/** Export a book as a .djbook file (JSON format with embedded cover image). */
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

/** Import a book from a .djbook file. Throws if the file is not a valid book. */
export async function importBookFromJSON(file: File): Promise<Book> {
  const text = await file.text();
  const data = JSON.parse(text) as Partial<Book>;

  if (typeof data.title !== 'string') throw new Error('Invalid .djbook file: missing title');
  if (!Array.isArray(data.sections)) throw new Error('Invalid .djbook file: missing sections');

  const now = new Date().toISOString();
  return {
    id: data.id ?? generateId(),
    title: data.title,
    author: data.author ?? '',
    template: data.template ?? 'reedsy',
    sections: data.sections,
    coverImage: data.coverImage ?? null,
    paragraphIndent: data.paragraphIndent ?? true,
    dailyGoal: data.dailyGoal ?? 1000,
    wordCountGoal: data.wordCountGoal ?? 80000,
    goalHistory: data.goalHistory ?? [],
    createdAt: data.createdAt ?? now,
    updatedAt: now,
  };
}
