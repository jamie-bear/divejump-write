import type { Book } from '../../types';
import { jsonToHTML, buildBookCSS } from './epub';

function templatePageSize(template: Book['template']): { width: string; height: string } {
  // Standard trade paperback: 6x9 for reedsy/romance, letter for classic
  if (template === 'classic') return { width: '8.5in', height: '11in' };
  return { width: '6in', height: '9in' };
}

function templateMargins(template: Book['template']): string {
  if (template === 'classic') return '1in';
  if (template === 'romance') return '0.85in 1in';
  return '0.9in 1.1in'; // reedsy
}

export function exportPDF(book: Book): void {
  const { width, height } = templatePageSize(book.template);
  const margins = templateMargins(book.template);
  const css = buildBookCSS(book.template);

  const chaptersHTML = book.sections
    .map((sec) => {
      const html = jsonToHTML(sec.content, sec.title);
      return `<section class="chapter">${html}</section>`;
    })
    .join('\n<div class="page-break"></div>\n');

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${book.title}</title>
  <style>
    @page {
      size: ${width} ${height};
      margin: ${margins};
      @top-center { content: "${book.title}"; font-style: italic; font-size: 0.75em; color: #666; }
      @bottom-center { content: counter(page); font-size: 0.8em; color: #555; }
    }
    * { box-sizing: border-box; }
    ${css}
    body { margin: 0; padding: 0; }
    .chapter { page-break-before: always; }
    .chapter:first-child { page-break-before: avoid; }
    .page-break { page-break-after: always; display: none; }

    @media print {
      body { font-size: 11pt; }
      .chapter { page-break-before: always; }
      h1 { page-break-after: avoid; }
    }

    /* Screen preview */
    @media screen {
      body { max-width: ${width}; margin: 0 auto; padding: 1in; background: white;
             box-shadow: 0 2px 20px rgba(0,0,0,0.15); min-height: ${height}; }
    }
  </style>
</head>
<body>
${chaptersHTML}
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups to export as PDF.');
    return;
  }
  printWindow.document.write(fullHTML);
  printWindow.document.close();
  printWindow.focus();
  // Give the browser a moment to render before printing
  setTimeout(() => {
    printWindow.print();
  }, 600);
}
