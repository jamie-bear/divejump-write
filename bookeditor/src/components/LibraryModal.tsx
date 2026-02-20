import { useState } from 'react';
import { X, Plus, Trash2, BookOpen, Clock, Hash } from 'lucide-react';
import { useBookStore, countWords, extractTextFromJSON } from '../store/bookStore';
import type { Book } from '../types';

function bookWordCount(book: Book): number {
  return book.sections.reduce((total, sec) => {
    if (!sec.content) return total;
    return total + countWords(extractTextFromJSON(sec.content));
  }, 0);
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const TEMPLATE_LABEL: Record<string, string> = {
  reedsy: 'Reedsy',
  classic: 'Classic',
  romance: 'Romance',
};

interface BookCardProps {
  book: Book;
  isCurrent: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function BookCard({ book, isCurrent, onOpen, onDelete }: BookCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const words = bookWordCount(book);

  return (
    <div
      className={`group relative bg-white rounded-xl border-2 transition-all cursor-pointer flex flex-col ${
        isCurrent
          ? 'border-indigo-500 shadow-lg'
          : 'border-stone-200 hover:border-stone-300 hover:shadow-md'
      }`}
      onClick={onOpen}
    >
      {/* Cover thumbnail */}
      <div className="rounded-t-xl overflow-hidden bg-stone-100 flex-shrink-0" style={{ aspectRatio: '2/3', maxHeight: 180 }}>
        {book.coverImage ? (
          <img src={book.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-stone-200">
            <BookOpen size={32} className="text-indigo-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-stone-800 truncate">{book.title}</h3>
        {book.author && (
          <p className="text-xs text-stone-500 truncate mt-0.5">{book.author}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
          <span className="flex items-center gap-0.5">
            <Hash size={10} />
            {words.toLocaleString()}
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Clock size={10} />
            {formatRelative(book.updatedAt)}
          </span>
        </div>
        <span className="mt-2 self-start text-xs bg-stone-100 text-stone-500 rounded px-1.5 py-0.5">
          {TEMPLATE_LABEL[book.template] ?? book.template}
        </span>
      </div>

      {/* Delete control */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="px-2 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 shadow"
            >
              Delete
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
              className="px-2 py-1 bg-white text-stone-600 text-xs rounded-lg hover:bg-stone-100 shadow border border-stone-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="p-1.5 bg-white/90 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm border border-stone-100"
            title="Delete book"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Current badge */}
      {isCurrent && (
        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          Open
        </div>
      )}
    </div>
  );
}

export default function LibraryModal() {
  const { allBooks, currentBookId, openBook, createBook, deleteBook, closeLibrary } = useBookStore();

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={closeLibrary}
    >
      <div
        className="bg-stone-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-stone-800">My Books</h2>
            <span className="text-xs bg-stone-100 text-stone-500 rounded-full px-2 py-0.5 font-medium">
              {allBooks.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={createBook}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={13} />
              New Book
            </button>
            <button
              onClick={closeLibrary}
              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Book grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {allBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <BookOpen size={40} className="mb-3 opacity-40" />
              <p className="text-sm">No books yet. Create your first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isCurrent={book.id === currentBookId}
                  onOpen={() => openBook(book.id)}
                  onDelete={() => deleteBook(book.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
