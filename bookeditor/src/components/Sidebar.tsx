import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  BookOpen,
  FileText,
  BookMarked,
  GripVertical,
  Pencil,
  Check,
  ImagePlus,
  X,
} from 'lucide-react';
import { useBookStore } from '../store/bookStore';
import type { Section, SectionType } from '../types';
import { FRONT_MATTER_PRESETS, BACK_MATTER_PRESETS, COVER_SECTION_ID } from '../types';

interface SectionItemProps {
  section: Section;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

function SectionItem({ section, isActive, onSelect, onDelete, onRename }: SectionItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setEditTitle(section.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    if (editTitle.trim()) onRename(editTitle.trim());
    setEditing(false);
  };

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer rounded-md mx-1 transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-stone-300 hover:bg-stone-700 hover:text-white'
      }`}
    >
      <GripVertical size={13} className="opacity-30 flex-shrink-0" />
      <FileText size={13} className="flex-shrink-0 opacity-70" />
      {editing ? (
        <input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditing(false);
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent border-b border-white/50 outline-none text-sm py-0"
        />
      ) : (
        <span className="flex-1 min-w-0 text-sm truncate">{section.title}</span>
      )}
      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {editing ? (
          <button
            onClick={(e) => { e.stopPropagation(); commitEdit(); }}
            className="p-0.5 hover:bg-white/20 rounded"
          >
            <Check size={12} />
          </button>
        ) : (
          <button
            onClick={startEdit}
            className="p-0.5 hover:bg-white/20 rounded"
          >
            <Pencil size={12} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 hover:bg-red-500/60 rounded"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

interface GroupProps {
  label: string;
  icon: React.ReactNode;
  type: SectionType;
  sections: Section[];
  activeSectionId: string | null;
  defaultOpen?: boolean;
}

function SectionGroup({ label, icon, type, sections, activeSectionId, defaultOpen = true }: GroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { setActiveSection, addSection, removeSection, renameSection } = useBookStore();

  const presets =
    type === 'frontmatter'
      ? FRONT_MATTER_PRESETS
      : type === 'backmatter'
      ? BACK_MATTER_PRESETS
      : null;

  const handleAdd = (title?: string) => {
    addSection(type, title);
    setShowAddMenu(false);
    setOpen(true);
  };

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className="ml-auto text-stone-500">({sections.length})</span>
      </button>

      {open && (
        <div className="pb-1">
          {sections.map((sec) => (
            <SectionItem
              key={sec.id}
              section={sec}
              isActive={activeSectionId === sec.id}
              onSelect={() => setActiveSection(sec.id)}
              onDelete={() => removeSection(sec.id)}
              onRename={(t) => renameSection(sec.id, t)}
            />
          ))}

          {/* Add button */}
          <div className="relative mx-1 mt-1">
            <button
              onClick={() => presets ? setShowAddMenu(!showAddMenu) : handleAdd()}
              className="w-full flex items-center gap-1.5 px-3 py-1 text-xs text-stone-500 hover:text-indigo-400 hover:bg-stone-700/50 rounded-md transition-colors"
            >
              <Plus size={12} />
              Add {type === 'chapter' ? 'Chapter' : type === 'frontmatter' ? 'Front Matter' : 'Back Matter'}
            </button>

            {showAddMenu && presets && (
              <div className="absolute left-0 top-full mt-1 z-50 bg-stone-800 border border-stone-600 rounded-lg shadow-xl py-1 min-w-48">
                {presets.map((p) => (
                  <button
                    key={p.title}
                    onClick={() => handleAdd(p.title)}
                    className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
                  >
                    {p.title}
                  </button>
                ))}
                <div className="border-t border-stone-600 mt-1 pt-1">
                  <button
                    onClick={() => handleAdd()}
                    className="w-full text-left px-3 py-1.5 text-xs text-stone-400 hover:bg-stone-700 hover:text-white transition-colors"
                  >
                    Custom...
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CoverSection() {
  const { book, activeSectionId, setActiveSection, setCoverImage } = useBookStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const isActive = activeSectionId === COVER_SECTION_ID;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCoverImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="px-3 pb-3">
      <div
        className={`relative group rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
          isActive ? 'border-indigo-500' : 'border-stone-700 hover:border-stone-500'
        }`}
        style={{ aspectRatio: '2/3' }}
        onClick={() => setActiveSection(COVER_SECTION_ID)}
      >
        {book.coverImage ? (
          <img src={book.coverImage} className="w-full h-full object-cover" alt="Book cover" />
        ) : (
          <div className="w-full h-full bg-stone-800 flex flex-col items-center justify-center gap-1.5">
            <ImagePlus size={22} className="text-stone-500" />
            <span className="text-xs text-stone-500">Add Cover</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            {book.coverImage ? 'Change Cover' : 'Upload Cover'}
          </button>
          {book.coverImage && (
            <button
              onClick={(e) => { e.stopPropagation(); setCoverImage(null); }}
              className="text-xs text-white/70 hover:text-white flex items-center gap-1"
            >
              <X size={11} /> Remove
            </button>
          )}
        </div>

        {isActive && (
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400" />
        )}
      </div>
      <p className="text-center text-xs text-stone-500 mt-1.5">Cover</p>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}

export default function Sidebar() {
  const { book, activeSectionId, setBookTitle, setBookAuthor } = useBookStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(book.title);

  const frontMatter = book.sections.filter((s) => s.type === 'frontmatter');
  const chapters = book.sections.filter((s) => s.type === 'chapter');
  const backMatter = book.sections.filter((s) => s.type === 'backmatter');

  return (
    <aside className="w-64 flex-shrink-0 bg-stone-900 border-r border-stone-700/50 flex flex-col h-screen overflow-hidden">
      {/* Book header */}
      <div className="px-4 py-5 border-b border-stone-700/50">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-indigo-400 flex-shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Manuscript</span>
        </div>

        {editingTitle ? (
          <input
            autoFocus
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={() => { setBookTitle(titleVal || 'Untitled Book'); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { setBookTitle(titleVal || 'Untitled Book'); setEditingTitle(false); } }}
            className="w-full bg-stone-800 text-white text-sm font-semibold rounded px-2 py-1 border border-stone-600 outline-none focus:border-indigo-500"
          />
        ) : (
          <button
            onClick={() => { setTitleVal(book.title); setEditingTitle(true); }}
            className="w-full text-left text-sm font-semibold text-white hover:text-indigo-300 transition-colors truncate"
            title={book.title}
          >
            {book.title}
          </button>
        )}

        <input
          value={book.author}
          onChange={(e) => setBookAuthor(e.target.value)}
          placeholder="Author name"
          className="mt-1 w-full bg-transparent text-xs text-stone-400 placeholder-stone-600 border-b border-transparent focus:border-stone-600 outline-none py-0.5 transition-colors"
        />
      </div>

      {/* Structure */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        <CoverSection />

        <div className="border-t border-stone-700/30 mb-2" />

        <SectionGroup
          label="Front Matter"
          icon={<BookMarked size={12} />}
          type="frontmatter"
          sections={frontMatter}
          activeSectionId={activeSectionId}
          defaultOpen={frontMatter.length > 0}
        />

        <div className="border-t border-stone-700/30 my-1" />

        <SectionGroup
          label="Chapters"
          icon={<FileText size={12} />}
          type="chapter"
          sections={chapters}
          activeSectionId={activeSectionId}
          defaultOpen={true}
        />

        <div className="border-t border-stone-700/30 my-1" />

        <SectionGroup
          label="Back Matter"
          icon={<BookMarked size={12} />}
          type="backmatter"
          sections={backMatter}
          activeSectionId={activeSectionId}
          defaultOpen={backMatter.length > 0}
        />
      </div>

      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-stone-700/50 text-xs text-stone-500">
        <div className="flex justify-between">
          <span>{book.sections.length} sections</span>
          <span>Last saved {formatRelativeTime(book.updatedAt)}</span>
        </div>
      </div>
    </aside>
  );
}

function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
