import { useState } from 'react';
import { StickyNote, Pin, PinOff, Trash2, Plus, X } from 'lucide-react';
import { useBookStore } from '../store/bookStore';
import type { Note } from '../types';

const colorConfig: Record<Note['color'], { bg: string; border: string; pin: string }> = {
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', pin: 'text-yellow-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', pin: 'text-blue-600' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', pin: 'text-emerald-600' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', pin: 'text-pink-600' },
};

const colorOptions: Note['color'][] = ['yellow', 'blue', 'green', 'pink'];

interface NoteCardProps {
  note: Note;
  sectionId: string;
}

function NoteCard({ note, sectionId }: NoteCardProps) {
  const { updateNote, deleteNote, toggleNotePin } = useBookStore();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const cfg = colorConfig[note.color];

  const handleSave = () => {
    updateNote(sectionId, note.id, content);
    setEditing(false);
  };

  return (
    <div className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border} shadow-sm`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <button
          onClick={() => toggleNotePin(sectionId, note.id)}
          title={note.pinned ? 'Unpin' : 'Pin note'}
          className={`p-0.5 rounded transition-colors ${note.pinned ? cfg.pin : 'text-stone-400 hover:text-stone-600'}`}
        >
          {note.pinned ? <Pin size={14} /> : <PinOff size={14} />}
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => deleteNote(sectionId, note.id)}
            className="p-0.5 text-stone-400 hover:text-red-500 rounded transition-colors"
            title="Delete note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {editing ? (
        <div>
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) handleSave();
              if (e.key === 'Escape') { setContent(note.content); setEditing(false); }
            }}
            className="w-full text-xs bg-transparent resize-none border-none outline-none text-stone-700 min-h-12"
            rows={3}
          />
          <div className="flex gap-1.5 mt-1">
            <button
              onClick={handleSave}
              className="text-xs px-2 py-0.5 bg-stone-700 text-white rounded hover:bg-stone-800 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setContent(note.content); setEditing(false); }}
              className="text-xs px-2 py-0.5 text-stone-500 hover:bg-stone-200 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left text-xs text-stone-700 leading-relaxed whitespace-pre-wrap min-h-6"
        >
          {note.content || <span className="text-stone-400 italic">Click to edit…</span>}
        </button>
      )}

      <div className="mt-2 text-xs text-stone-400">
        {new Date(note.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

export default function NotesPanel() {
  const { book, activeSectionId, addNote, toggleNotesPanel } = useBookStore();
  const [selectedColor, setSelectedColor] = useState<Note['color']>('yellow');

  const activeSection = book.sections.find((s) => s.id === activeSectionId);
  if (!activeSection) return null;

  const pinnedNotes = activeSection.notes.filter((n) => n.pinned);
  const unpinnedNotes = activeSection.notes.filter((n) => !n.pinned);
  const allNotes = [...pinnedNotes, ...unpinnedNotes];

  const handleAddNote = () => {
    addNote(activeSection.id, '', selectedColor);
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-stone-50 border-l border-stone-200 flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <StickyNote size={15} className="text-amber-500" />
          <span className="text-sm font-semibold text-stone-700">Notes</span>
          <span className="text-xs bg-stone-200 text-stone-600 rounded-full px-1.5 py-0.5">
            {activeSection.notes.length}
          </span>
        </div>
        <button
          onClick={toggleNotesPanel}
          className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-stone-200 flex items-center gap-2">
        <div className="flex gap-1">
          {colorOptions.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                selectedColor === c ? 'scale-125 border-stone-500' : 'border-transparent'
              } ${colorConfig[c].bg} ${colorConfig[c].border}`}
              title={`${c} note`}
            />
          ))}
        </div>
        <button
          onClick={handleAddNote}
          className="ml-auto flex items-center gap-1 text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
        >
          <Plus size={12} />
          Add Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {allNotes.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <StickyNote size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">No notes yet.</p>
            <p className="text-xs mt-1">Click "Add Note" to create one.</p>
          </div>
        ) : (
          allNotes.map((note) => (
            <NoteCard key={note.id} note={note} sectionId={activeSection.id} />
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-stone-200 text-xs text-stone-400">
        Notes for: <span className="text-stone-600 font-medium">{activeSection.title}</span>
      </div>
    </aside>
  );
}
