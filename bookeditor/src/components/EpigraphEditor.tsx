import { useState, useEffect } from 'react';
import { useBookStore } from '../store/bookStore';
import type { Section } from '../types';

export interface EpigraphData {
  __type: 'epigraph';
  quote: string;
  attribution: string;
}

export function parseEpigraph(content: string): EpigraphData {
  try {
    const parsed = JSON.parse(content);
    if (parsed.__type === 'epigraph') return parsed as EpigraphData;
  } catch {
    // fall through
  }
  return { __type: 'epigraph', quote: '', attribution: '' };
}

export function hasEpigraphContent(content: string): boolean {
  if (!content) return false;
  try {
    const parsed = JSON.parse(content);
    return parsed.__type === 'epigraph';
  } catch {
    return false;
  }
}

export function isEpigraphSection(section: Section): boolean {
  // Check both: title-based detection (new/empty epigraphs) and content-based
  // detection (epigraphs moved via DnD that still have epigraph-format content)
  return (
    (section.type === 'frontmatter' &&
      section.title.trim().toLowerCase() === 'epigraph') ||
    hasEpigraphContent(section.content)
  );
}

interface Props {
  section: Section;
  template: string;
}

export default function EpigraphEditor({ section, template }: Props) {
  const { updateSectionContent } = useBookStore();
  const [data, setData] = useState<EpigraphData>(() => parseEpigraph(section.content));
  const [editingQuote, setEditingQuote] = useState(false);
  const [editingAttrib, setEditingAttrib] = useState(false);

  // Sync if section changes externally
  useEffect(() => {
    setData(parseEpigraph(section.content));
  }, [section.id]);

  const save = (next: EpigraphData) => {
    updateSectionContent(section.id, JSON.stringify(next));
  };

  const commitQuote = (quote: string) => {
    const next = { ...data, quote };
    setData(next);
    save(next);
    setEditingQuote(false);
  };

  const commitAttrib = (attribution: string) => {
    const next = { ...data, attribution };
    setData(next);
    save(next);
    setEditingAttrib(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-100">
      <div className="max-w-2xl mx-auto my-8 px-8">
        {/* Label */}
        <div className="mb-8 text-center">
          <div className="text-xs uppercase tracking-widest text-stone-400 mb-2">
            {section.type === 'chapter' ? 'Chapter' : section.type === 'frontmatter' ? 'Front Matter' : 'Back Matter'}
          </div>
          <h1 className={`section-chapter-title template-${template}`} style={{ fontFamily: 'inherit' }}>
            {section.title}
          </h1>
        </div>

        {/* Paper — styled to show epigraph layout */}
        <div className={`bg-white shadow-md rounded-sm editor-paper template-${template} epigraph-paper`}>
          <div className="epigraph-block">
            {/* Quote */}
            {editingQuote ? (
              <textarea
                autoFocus
                value={data.quote}
                rows={4}
                onChange={(e) => setData({ ...data, quote: e.target.value })}
                onBlur={(e) => commitQuote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') commitQuote(data.quote);
                }}
                className="epigraph-quote epigraph-textarea"
                placeholder="Enter the epigraph quote…"
              />
            ) : (
              <p
                className={`epigraph-quote epigraph-clickable ${!data.quote ? 'epigraph-placeholder' : ''}`}
                onClick={() => setEditingQuote(true)}
                title="Click to edit quote"
              >
                {data.quote || 'Click to enter the epigraph quote…'}
              </p>
            )}

            {/* Attribution */}
            {editingAttrib ? (
              <input
                autoFocus
                type="text"
                value={data.attribution}
                onChange={(e) => setData({ ...data, attribution: e.target.value })}
                onBlur={(e) => commitAttrib(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') commitAttrib(data.attribution);
                }}
                className="epigraph-attribution epigraph-input"
                placeholder="— Attribution"
              />
            ) : (
              <p
                className={`epigraph-attribution epigraph-clickable ${!data.attribution ? 'epigraph-placeholder' : ''}`}
                onClick={() => setEditingAttrib(true)}
                title="Click to edit attribution"
              >
                {data.attribution ? `\u2014\u2009${data.attribution}` : '\u2014 Click to add attribution'}
              </p>
            )}
          </div>

          {/* Hint */}
          <p className="epigraph-hint">
            Click the quote or attribution to edit them.
          </p>
        </div>
      </div>
    </div>
  );
}
