import { useEffect } from 'react';
import {
  StickyNote,
  Target,
  Upload,
  Palette,
  LayoutGrid,
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import EditorPane from './components/Editor';
import NotesPanel from './components/NotesPanel';
import GoalPanel from './components/GoalPanel';
import ExportModal from './components/ExportModal';
import TemplateModal from './components/TemplateModal';
import LibraryModal from './components/LibraryModal';
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
    openLibrary,
    getTotalWordCount,
  } = useBookStore();

  const totalWords = getTotalWordCount();
  const templateLabel: Record<string, string> = {
    reedsy: 'Standard',
    classic: 'Classic',
    romance: 'Romance',
  };

  return (
    <header className="flex items-center gap-2 px-4 py-2 bg-white border-b border-stone-200 z-10 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <img src="/app-icon.svg" alt="DiveJump" className="h-6 w-6" />
        <span className="font-bold text-stone-800 tracking-tight text-base">DiveJump</span>
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
          className="text-xs text-stone-500 hover:text-dj-prussian transition-colors flex items-center gap-1"
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
          onClick={openLibrary}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          title="My Books"
        >
          <LayoutGrid size={14} />
          Library
        </button>

        <button
          onClick={toggleNotesPanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
            showNotesPanel
              ? 'bg-dj-red/20 text-dj-red'
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
              ? 'bg-dj-prussian/15 text-dj-prussian'
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-dj-prussian text-white rounded-lg hover:bg-dj-teal transition-colors shadow-sm"
          title="Export Book"
        >
          <Upload size={14} />
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
    showLibrary,
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
      {showLibrary && <LibraryModal />}
    </div>
  );
}
