import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import { useBookStore, countWords, extractTextFromJSON } from '../store/bookStore';
import type { Template } from '../types';
import Toolbar from './Toolbar';

const AUTOSAVE_DELAY = 1000;

const templateClasses: Record<Template, string> = {
  reedsy: 'font-reedsy',
  classic: 'font-classic',
  romance: 'font-romance',
};

interface ImageModalProps {
  onInsert: (url: string, alt: string) => void;
  onClose: () => void;
}

function ImageModal({ onInsert, onClose }: ImageModalProps) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-stone-800 mb-4">Insert Image</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">From file</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="w-full text-sm text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs file:font-medium hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">Or from URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-stone-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">Alt text</label>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Image description"
              className="w-full border border-stone-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={() => { if (url) { onInsert(url, alt); onClose(); } }}
            disabled={!url}
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditorPane() {
  const {
    book,
    activeSectionId,
    updateSectionContent,
    updateDailyProgress,
    getTodayGoal,
  } = useBookStore();

  const [showImageModal, setShowImageModal] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSection = book.sections.find((s) => s.id === activeSectionId) ?? book.sections[0];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ horizontalRule: { HTMLAttributes: { class: 'scene-break' } } }),
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: 'Begin writing your story…' }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Typography,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeSection) return;
      const json = JSON.stringify(editor.getJSON());

      // Debounced autosave
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        updateSectionContent(activeSection.id, json);
        // Update daily word count (total across all sections)
        const totalWords = computeTotalWords(book.sections, activeSection.id, json);
        updateDailyProgress(totalWords);
      }, AUTOSAVE_DELAY);
    },
  });

  // Load section content when active section changes
  useEffect(() => {
    if (!editor || !activeSection) return;
    const content = activeSection.content;
    try {
      const parsed = JSON.parse(content);
      editor.commands.setContent(parsed);
    } catch {
      editor.commands.setContent(content || '');
    }
    // Scroll to top
    editor.commands.focus('start');
  }, [activeSection?.id, editor]);

  const handleInsertImage = useCallback(
    (url: string, alt: string) => {
      editor?.chain().focus().setImage({ src: url, alt }).run();
    },
    [editor]
  );

  const handleSceneBreak = useCallback(() => {
    editor?.chain().focus().setHorizontalRule().run();
  }, [editor]);

  const wordCount = activeSection
    ? countWords(extractTextFromJSON(activeSection.content))
    : 0;

  const todayGoal = getTodayGoal();
  const goalPct = book.dailyGoal > 0
    ? Math.min(100, Math.round((todayGoal.wordsWritten / book.dailyGoal) * 100))
    : 0;

  if (!activeSection) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400">
        Select a section to start writing
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-w-0 bg-stone-100 ${templateClasses[book.template]}`}>
      <Toolbar
        editor={editor}
        onInsertImage={() => setShowImageModal(true)}
        onSceneBreak={handleSceneBreak}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto my-8 px-8">
          {/* Section title */}
          <div className={`mb-8 text-center editor-section-header template-${book.template}`}>
            <div className="text-xs uppercase tracking-widest text-stone-400 mb-2">
              {activeSection.type === 'chapter' ? 'Chapter' : activeSection.type === 'frontmatter' ? 'Front Matter' : 'Back Matter'}
            </div>
            <h1 className="section-chapter-title">{activeSection.title}</h1>
          </div>

          {/* Paper */}
          <div className={`bg-white shadow-md rounded-sm px-12 py-10 min-h-96 editor-paper template-${book.template}`}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-white border-t border-stone-200 text-xs text-stone-400">
        <div className="flex items-center gap-4">
          <span>{wordCount.toLocaleString()} words this section</span>
          {activeSection.type === 'chapter' && (
            <span className="text-stone-300">|</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {book.dailyGoal > 0 && (
            <div className="flex items-center gap-2">
              <span>Today: {todayGoal.wordsWritten.toLocaleString()} / {book.dailyGoal.toLocaleString()}</span>
              <div className="w-24 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${goalPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <span className={goalPct >= 100 ? 'text-emerald-600 font-medium' : ''}>{goalPct}%</span>
            </div>
          )}
        </div>
      </div>

      {showImageModal && (
        <ImageModal
          onInsert={handleInsertImage}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
}

function computeTotalWords(
  sections: { id: string; content: string }[],
  updatedId: string,
  updatedContent: string
): number {
  return sections.reduce((total, sec) => {
    const content = sec.id === updatedId ? updatedContent : sec.content;
    return total + countWords(extractTextFromJSON(content));
  }, 0);
}
