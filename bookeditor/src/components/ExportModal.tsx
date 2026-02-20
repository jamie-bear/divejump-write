import { useState } from 'react';
import { X, Download, BookOpen, FileText, Loader2, FileJson } from 'lucide-react';
import { useBookStore } from '../store/bookStore';
import { exportEPUB } from '../utils/export/epub';
import { exportPDF } from '../utils/export/pdf';
import { exportBookJSON } from '../utils/export/json';

export default function ExportModal() {
  const { book, closeExportModal } = useBookStore();
  const [exporting, setExporting] = useState<'epub' | 'pdf' | 'json' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const templateLabels: Record<string, string> = {
    reedsy: 'Standard',
    classic: 'Classic',
    romance: 'Romance',
  };

  const handleEPUB = async () => {
    setExporting('epub');
    setError(null);
    try {
      await exportEPUB(book);
    } catch (e) {
      setError('Export failed. Please try again.');
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handlePDF = () => {
    setExporting('pdf');
    setError(null);
    try {
      exportPDF(book);
    } catch (e) {
      setError('Export failed. Please try again.');
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handleJSON = () => {
    setExporting('json');
    setError(null);
    try {
      exportBookJSON(book);
    } catch (e) {
      setError('Export failed. Please try again.');
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={closeExportModal}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-dj-prussian" />
            <h2 className="text-base font-semibold text-stone-800">Export Book</h2>
          </div>
          <button onClick={closeExportModal} className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
            <X size={16} className="text-stone-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-stone-50 rounded-xl p-4 text-sm">
            <div className="font-medium text-stone-600 mb-1">{book.title}</div>
            <div className="text-stone-400 text-xs space-y-0.5">
              {book.author && <div>by {book.author}</div>}
              <div>{book.sections.length} sections · Template: {templateLabels[book.template]}</div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleEPUB}
              disabled={exporting !== null}
              className="flex flex-col items-center gap-3 p-4 border-2 border-stone-200 rounded-xl hover:border-dj-prussian hover:bg-dj-prussian/5 transition-all disabled:opacity-60 group"
            >
              {exporting === 'epub' ? (
                <Loader2 size={28} className="text-dj-prussian animate-spin" />
              ) : (
                <BookOpen size={28} className="text-dj-prussian group-hover:scale-110 transition-transform" />
              )}
              <div className="text-center">
                <div className="font-semibold text-stone-800 text-sm">ePUB</div>
                <div className="text-xs text-stone-400 mt-0.5">For e-readers</div>
              </div>
            </button>

            <button
              onClick={handlePDF}
              disabled={exporting !== null}
              className="flex flex-col items-center gap-3 p-4 border-2 border-stone-200 rounded-xl hover:border-dj-red hover:bg-dj-red/5 transition-all disabled:opacity-60 group"
            >
              {exporting === 'pdf' ? (
                <Loader2 size={28} className="text-dj-red animate-spin" />
              ) : (
                <FileText size={28} className="text-dj-red group-hover:scale-110 transition-transform" />
              )}
              <div className="text-center">
                <div className="font-semibold text-stone-800 text-sm">PDF</div>
                <div className="text-xs text-stone-400 mt-0.5">Print-ready</div>
              </div>
            </button>

            <button
              onClick={handleJSON}
              disabled={exporting !== null}
              className="flex flex-col items-center gap-3 p-4 border-2 border-stone-200 rounded-xl hover:border-dj-teal hover:bg-dj-teal/5 transition-all disabled:opacity-60 group"
            >
              {exporting === 'json' ? (
                <Loader2 size={28} className="text-dj-teal animate-spin" />
              ) : (
                <FileJson size={28} className="text-dj-teal group-hover:scale-110 transition-transform" />
              )}
              <div className="text-center">
                <div className="font-semibold text-stone-800 text-sm">.djbook</div>
                <div className="text-xs text-stone-400 mt-0.5">Project file</div>
              </div>
            </button>
          </div>

          <p className="text-xs text-stone-400 text-center">
            PDF opens a print dialog. .djbook saves the full project for reimport.
          </p>
        </div>
      </div>
    </div>
  );
}
