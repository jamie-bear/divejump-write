import type { Book } from '../../types';
import { jsonToHTML, buildBookCSS } from './epub';
import { parseEpigraph } from '../../components/EpigraphEditor';

function templatePageSize(template: Book['template']): { width: string; height: string } {
  if (template === 'classic') return { width: '8.5in', height: '11in' };
  return { width: '6in', height: '9in' };
}

function templateMargins(template: Book['template']): string {
  if (template === 'classic') return '1in';
  if (template === 'romance') return '0.85in 1in';
  return '0.9in 1.1in';
}

function isEpigraphSec(sec: { type: string; title: string; content: string }): boolean {
  if (sec.type === 'frontmatter' && sec.title.trim().toLowerCase() === 'epigraph') return true;
  try { return JSON.parse(sec.content)?.__type === 'epigraph'; } catch { return false; }
}

function sectionToHTML(sec: Book['sections'][number]): string {
  if (isEpigraphSec(sec)) {
    const data = parseEpigraph(sec.content);
    return `
      <section class="chapter epigraph-section">
        <div class="epigraph-block">
          <p class="epigraph-quote">${esc(data.quote)}</p>
          <p class="epigraph-attribution">${data.attribution ? `\u2014\u2009${esc(data.attribution)}` : ''}</p>
        </div>
      </section>`;
  }
  return `<section class="chapter">${jsonToHTML(sec.content, sec.title)}</section>`;
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function exportPDF(book: Book): void {
  const { width, height } = templatePageSize(book.template);
  const margins = templateMargins(book.template);
  const css = buildBookCSS(book.template, book.paragraphIndent ?? true);

  const coverHTML = book.coverImage
    ? `<div class="cover-page"><img src="${book.coverImage}" class="cover-img" alt="Cover"/></div>`
    : '';

  const sectionsHTML = book.sections.map(sectionToHTML).join('\n');

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(book.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Lato:wght@400;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"/>
  <style>
    @page {
      size: ${width} ${height};
      margin: ${margins};
      @top-center { content: "${esc(book.title)}"; font-style: italic; font-size: 0.75em; color: #666; }
      @bottom-center { content: counter(page); font-size: 0.8em; color: #555; }
    }
    @page :first { @top-center { content: none; } @bottom-center { content: none; } }
    * { box-sizing: border-box; }
    ${css}
    body { margin: 0; padding: 0; }

    /* Cover */
    .cover-page { page-break-after: always; width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; }
    .cover-img { max-width: 100%; max-height: 100%; object-fit: contain; }

    /* Sections */
    .chapter { page-break-before: always; }
    .cover-page + .chapter, .chapter:first-child { page-break-before: avoid; }

    /* Epigraph */
    .epigraph-section { display: flex; flex-direction: column; justify-content: center; min-height: 70vh; }
    .epigraph-block { margin-left: 22%; max-width: 62%; }
    .epigraph-quote { font-style: italic; text-indent: 0 !important; margin-bottom: 0.65em; }
    .epigraph-attribution { text-align: right; font-style: normal; font-size: 0.88em; color: #57534e; text-indent: 0 !important; }

    @media print {
      body { font-size: 11pt; }
      .chapter { page-break-before: always; }
      h1 { page-break-after: avoid; }
    }
    @media screen {
      body { max-width: ${width}; margin: 0 auto; padding: 1in; background: white;
             box-shadow: 0 2px 20px rgba(0,0,0,0.15); min-height: ${height}; }
    }
  </style>
</head>
<body>
${coverHTML}
${sectionsHTML}
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) { alert('Please allow popups to export as PDF.'); return; }
  printWindow.document.write(fullHTML);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 800);
}
