import { useState } from 'react';
import { X, Download, BookOpen, FileText, Loader2 } from 'lucide-react';
import { useBookStore } from '../store/bookStore';
import { exportEPUB } from '../utils/export/epub';
import { exportPDF } from '../utils/export/pdf';

export default function ExportModal() {
  const { book, closeExportModal } = useBookStore();
  const [exporting, setExporting] = useState<'epub' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const templateLabels: Record<string, string> = {
    reedsy: 'Reedsy',
    classic: 'Classic',
    romance: 'Romance',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={closeExportModal}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-stone-800">Export Book</h2>
          </div>
          <button onClick={closeExportModal} className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
            <X size={16} className="text-stone-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-stone-50 rounded-xl p-4 text-sm">
            <div className="flex justify-between text-stone-600 mb-1">
              <span className="font-medium">{book.title}</span>
            </div>
            <div className="text-stone-400 text-xs space-y-0.5">
              {book.author && <div>by {book.author}</div>}
              <div>{book.sections.length} sections · Template: {templateLabels[book.template]}</div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleEPUB}
              disabled={exporting !== null}
              className="flex flex-col items-center gap-3 p-4 border-2 border-stone-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all disabled:opacity-60 group"
            >
              {exporting === 'epub' ? (
                <Loader2 size={28} className="text-indigo-500 animate-spin" />
              ) : (
                <BookOpen size={28} className="text-indigo-500 group-hover:scale-110 transition-transform" />
              )}
              <div className="text-center">
                <div className="font-semibold text-stone-800 text-sm">ePUB</div>
                <div className="text-xs text-stone-400 mt-0.5">For e-readers</div>
              </div>
            </button>

            <button
              onClick={handlePDF}
              disabled={exporting !== null}
              className="flex flex-col items-center gap-3 p-4 border-2 border-stone-200 rounded-xl hover:border-rose-400 hover:bg-rose-50 transition-all disabled:opacity-60 group"
            >
              {exporting === 'pdf' ? (
                <Loader2 size={28} className="text-rose-500 animate-spin" />
              ) : (
                <FileText size={28} className="text-rose-500 group-hover:scale-110 transition-transform" />
              )}
              <div className="text-center">
                <div className="font-semibold text-stone-800 text-sm">PDF</div>
                <div className="text-xs text-stone-400 mt-0.5">Print-ready</div>
              </div>
            </button>
          </div>

          <p className="text-xs text-stone-400 text-center">
            PDF will open a print dialog. Save as PDF from there.
          </p>
        </div>
      </div>
    </div>
  );
}
