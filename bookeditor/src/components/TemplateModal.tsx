import { X, Check } from 'lucide-react';
import { useBookStore } from '../store/bookStore';
import type { Template } from '../types';

const templates: {
  id: Template;
  name: string;
  description: string;
  font: string;
  specs: string[];
  preview: string;
}[] = [
  {
    id: 'reedsy',
    name: 'Reedsy',
    description: 'Clean and professional. The standard for modern indie publishing.',
    font: 'Palatino Linotype, serif',
    specs: ['Palatino 11pt', '1.6 line height', '6×9 trim size', 'Generous margins'],
    preview: 'Chapter One\n\nThe morning light filtered through the curtains, casting long shadows across the hardwood floor. She reached for the notebook on her nightstand and began to write.',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional formatting. Double-spaced, letter-size. Great for manuscripts.',
    font: 'Times New Roman, serif',
    specs: ['Times New Roman 12pt', '2.0 line height', '8.5×11 trim size', '1-inch margins'],
    preview: 'Chapter One\n\nThe morning light filtered through the curtains, casting long shadows across the hardwood floor. She reached for the notebook on her nightstand and began to write.',
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Elegant Garamond type. Warm spacing for an intimate reading experience.',
    font: 'Garamond, EB Garamond, serif',
    specs: ['Garamond 11pt', '1.55 line height', '6×9 trim size', 'Stylized chapter heads'],
    preview: 'Chapter One\n\nThe morning light filtered through the curtains, casting long shadows across the hardwood floor. She reached for the notebook on her nightstand and began to write.',
  },
];

export default function TemplateModal() {
  const { book, setTemplate, closeTemplateModal } = useBookStore();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={closeTemplateModal}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="text-base font-semibold text-stone-800">Choose Template</h2>
          <button onClick={closeTemplateModal} className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
            <X size={16} className="text-stone-500" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-3 gap-4">
          {templates.map((tmpl) => {
            const isActive = book.template === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => { setTemplate(tmpl.id); closeTemplateModal(); }}
                className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
                  isActive
                    ? 'border-indigo-500 shadow-md'
                    : 'border-stone-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                {/* Preview area */}
                <div className="bg-stone-50 p-4 h-36 overflow-hidden relative">
                  <div
                    className="text-stone-700 leading-relaxed"
                    style={{ fontFamily: tmpl.font, fontSize: '10px' }}
                  >
                    <div className="font-bold text-sm mb-1.5" style={{ fontFamily: tmpl.font }}>
                      {tmpl.preview.split('\n')[0]}
                    </div>
                    <div style={{ lineHeight: tmpl.id === 'classic' ? '1.8' : '1.5' }}>
                      {tmpl.preview.split('\n').slice(2).join(' ')}
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-stone-50 to-transparent" />
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-0.5">
                      <Check size={11} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 border-t border-stone-100">
                  <div className="font-semibold text-stone-800 text-sm">{tmpl.name}</div>
                  <div className="text-xs text-stone-500 mt-0.5 leading-snug">{tmpl.description}</div>
                  <ul className="mt-2 space-y-0.5">
                    {tmpl.specs.map((s) => (
                      <li key={s} className="text-xs text-stone-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-stone-300 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
