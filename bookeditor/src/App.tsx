import { useEffect } from 'react';
import {
  StickyNote,
  Target,
  Download,
  Palette,
  BookOpen,
  FilePlus,
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import EditorPane from './components/Editor';
import NotesPanel from './components/NotesPanel';
import GoalPanel from './components/GoalPanel';
import ExportModal from './components/ExportModal';
import TemplateModal from './components/TemplateModal';
import { useBookStore } from './store/bookStore';
import './styles/editor.css';

function TopBar() {
  const {
    book,
    showNotesPanel,
    showGoalPanel,
    toggleNotesPanel,
    toggleGoalPanel,
    openExportModal,
    openTemplateModal,
    newBook,
    getTotalWordCount,
  } = useBookStore();

  const totalWords = getTotalWordCount();
  const templateLabel: Record<string, string> = {
    reedsy: 'Reedsy',
    classic: 'Classic',
    romance: 'Romance',
  };

  const handleNewBook = () => {
    if (window.confirm('Start a new book? Your current work is saved automatically.')) {
      newBook();
    }
  };

  return (
    <header className="flex items-center gap-2 px-4 py-2 bg-white border-b border-stone-200 z-10 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <BookOpen size={20} className="text-indigo-600" />
        <span className="font-bold text-stone-800 tracking-tight text-base">Folio</span>
        <span className="text-xs bg-indigo-100 text-indigo-700 rounded px-1.5 py-0.5 font-medium">
          Book Editor
        </span>
      </div>

      <div className="h-5 w-px bg-stone-200" />

      {/* Book info */}
      <div className="flex items-center gap-1 mr-2">
        <span className="text-xs text-stone-500">
          {totalWords.toLocaleString()} words
        </span>
        <span className="text-stone-300 mx-1">·</span>
        <button
          onClick={openTemplateModal}
          className="text-xs text-stone-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
          title="Change template"
        >
          <Palette size={12} />
          {templateLabel[book.template]}
        </button>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleNewBook}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          title="New Book"
        >
          <FilePlus size={14} />
          New
        </button>

        <button
          onClick={toggleNotesPanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
            showNotesPanel
              ? 'bg-amber-100 text-amber-700'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          title="Toggle Notes Panel"
        >
          <StickyNote size={14} />
          Notes
        </button>

        <button
          onClick={toggleGoalPanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
            showGoalPanel
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          title="Writing Goals"
        >
          <Target size={14} />
          Goals
        </button>

        <div className="w-px h-5 bg-stone-200 mx-1" />

        <button
          onClick={openExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          title="Export Book"
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const {
    book,
    activeSectionId,
    setActiveSection,
    showNotesPanel,
    showGoalPanel,
    showExportModal,
    showTemplateModal,
  } = useBookStore();

  // Select first section on first load
  useEffect(() => {
    if (!activeSectionId && book.sections.length > 0) {
      setActiveSection(book.sections[0].id);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <TopBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <EditorPane />
        {showNotesPanel && <NotesPanel />}
        {showGoalPanel && <GoalPanel />}
      </div>
      {showExportModal && <ExportModal />}
      {showTemplateModal && <TemplateModal />}
    </div>
  );
}
