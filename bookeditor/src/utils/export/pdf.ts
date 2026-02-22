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

/** Parse a CSS margin shorthand string (using `in` units) into pixel values. */
function parseMarginsPx(margins: string): { top: number; right: number; bottom: number; left: number } {
  const parts = margins.trim().split(/\s+/);
  const toPx = (s: string) => parseFloat(s) * 96; // 1in = 96px
  if (parts.length === 1) {
    const v = toPx(parts[0]);
    return { top: v, right: v, bottom: v, left: v };
  }
  const tb = toPx(parts[0]);
  const lr = toPx(parts[1]);
  return { top: tb, right: lr, bottom: tb, left: lr };
}

function parseHeightPx(height: string): number {
  return parseFloat(height) * 96; // "9in" → 864
}

function isEpigraphSec(sec: { type: string; title: string; content: string }): boolean {
  if (sec.type === 'frontmatter' && sec.title.trim().toLowerCase() === 'epigraph') return true;
  try { return JSON.parse(sec.content)?.__type === 'epigraph'; } catch { return false; }
}

function isTocSection(sec: { type: string; title: string }): boolean {
  return sec.type === 'frontmatter' && sec.title.trim().toLowerCase() === 'table of contents';
}

// Front matter titles that should NOT appear in the generated ToC
const TOC_EXCLUDED = new Set([
  'half title page', 'title page', 'copyright', 'dedication', 'epigraph', 'table of contents',
]);

function shouldIncludeInToc(sec: Book['sections'][number]): boolean {
  if (isEpigraphSec(sec)) return false;
  return !TOC_EXCLUDED.has(sec.title.trim().toLowerCase());
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sectionToHTML(
  sec: Book['sections'][number],
  displayChapterNum: number | undefined,
  tocChapterNum: number | undefined,
): string {
  // Table of Contents — render a placeholder; JS fills in entries
  if (isTocSection(sec)) {
    return `<section class="chapter toc-section" id="toc-section">
      <h1>${esc(sec.title)}</h1>
      <div id="toc-entries"></div>
    </section>`;
  }

  // Epigraph
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

  // Regular section — attach toc data attributes when it should appear in the ToC
  const tocAttrs = shouldIncludeInToc(sec)
    ? ` data-toc-title="${esc(sec.title)}"${tocChapterNum != null ? ` data-toc-chapter="${tocChapterNum}"` : ''}`
    : '';

  const numHtml = displayChapterNum != null ? `<p class="chapter-number">${displayChapterNum}</p>` : '';
  return `<section class="chapter"${tocAttrs}>${numHtml}${jsonToHTML(sec.content, sec.title)}</section>`;
}

export function exportPDF(book: Book): void {
  const { width, height } = templatePageSize(book.template);
  const margins = templateMargins(book.template);
  const css = buildBookCSS(book.template, book.paragraphIndent ?? true);

  const marginsPx = parseMarginsPx(margins);
  const pageHeightPx = parseHeightPx(height);
  const contentHeightPx = pageHeightPx - marginsPx.top - marginsPx.bottom;

  const hasToc = book.sections.some(isTocSection);
  const hasCover = !!book.coverImage;

  const coverHTML = hasCover
    ? `<div class="cover-page"><img src="${book.coverImage}" class="cover-img" alt="Cover"/></div>`
    : '';

  let chapterCount = 0;
  const sectionsHTML = book.sections.map((sec) => {
    if (sec.type === 'chapter') chapterCount++;
    const displayNum = (book.chapterNumbers ?? false) && sec.type === 'chapter' ? chapterCount : undefined;
    const tocNum = sec.type === 'chapter' ? chapterCount : undefined;
    return sectionToHTML(sec, displayNum, tocNum);
  }).join('\n');

  // -----------------------------------------------------------------------
  // Embedded JS — runs in the popup window to compute ToC page numbers.
  //
  // Strategy: every `section.chapter` plus the `.cover-page` div maps to
  // one or more print pages. We measure each element's offsetHeight in
  // the screen layout (which uses the same margins/column-width as print)
  // and divide by the print content-area height to get the page count.
  // Cumulative page counts give us the starting page of each section.
  //
  // We run three passes so that the ToC's own growing height (as entries
  // are injected) is accounted for in the page numbers of later sections.
  // After three passes the numbers converge in virtually all cases.
  // -----------------------------------------------------------------------
  const tocScript = hasToc ? `<script>
(async function () {
  await document.fonts.ready;

  var tocEntries = document.getElementById('toc-entries');
  if (!tocEntries) { window.print(); return; }

  var CONTENT_H = ${contentHeightPx};

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function computeEntries() {
    var nodes = Array.from(document.querySelectorAll('.cover-page, section.chapter'));
    var tocSec = document.getElementById('toc-section');
    var page = 1;
    var entries = [];

    for (var i = 0; i < nodes.length; i++) {
      var sec = nodes[i];
      var isCover = sec.classList.contains('cover-page');
      var isToc   = sec === tocSec;

      // Cover is always exactly 1 print page; other sections are measured.
      var pagesUsed = isCover ? 1 : Math.max(1, Math.ceil(sec.offsetHeight / CONTENT_H));

      if (!isCover && !isToc) {
        var title   = sec.getAttribute('data-toc-title');
        var chapter = sec.getAttribute('data-toc-chapter');
        if (title) {
          entries.push({ title: title, chapter: chapter, page: page });
        }
      }

      page += pagesUsed;
    }

    return entries;
  }

  function renderEntries(entries) {
    if (!entries.length) return '';
    return entries.map(function (e) {
      var chapterLabel = e.chapter
        ? '<span class="toc-chapter-label">Chapter ' + e.chapter + '</span>'
        : '';
      return (
        '<div class="toc-entry">' +
          '<div class="toc-title-block">' +
            chapterLabel +
            '<span class="toc-title">' + escHtml(e.title) + '</span>' +
          '</div>' +
          '<span class="toc-dots"></span>' +
          '<span class="toc-page">' + e.page + '</span>' +
        '</div>'
      );
    }).join('');
  }

  // Three passes — enough for stable convergence even when the ToC spans
  // multiple pages and shifts the page numbers of subsequent sections.
  for (var pass = 0; pass < 3; pass++) {
    tocEntries.innerHTML = renderEntries(computeEntries());
    // Wait two animation frames so the browser recalculates layout.
    await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
  }

  setTimeout(function () { window.print(); }, 400);
}());
</script>` : `<script>setTimeout(function () { window.print(); }, 800);</script>`;

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
    @page :first { margin: 0; @top-center { content: none; } @bottom-center { content: none; } }
    * { box-sizing: border-box; }
    ${css}
    body { margin: 0; padding: 0; }

    /* Cover */
    .cover-page { page-break-after: always; width: 100%; height: 100vh; overflow: hidden; }
    .cover-img { display: block; width: 100%; height: 100%; object-fit: cover; }

    /* Sections */
    .chapter { page-break-before: always; }
    .cover-page + .chapter, .chapter:first-child { page-break-before: avoid; }

    /* Epigraph */
    .epigraph-section { display: flex; flex-direction: column; justify-content: center; min-height: 70vh; }
    .epigraph-block { margin-left: 22%; max-width: 62%; }
    .epigraph-quote { font-style: italic; text-indent: 0 !important; margin-bottom: 0.65em; }
    .epigraph-attribution { text-align: right; font-style: normal; font-size: 0.88em; color: #57534e; text-indent: 0 !important; }

    /* Table of Contents */
    .toc-section h1 { margin-bottom: 1.5em; }
    .toc-entry {
      display: flex;
      align-items: baseline;
      margin-bottom: 0.75em;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .toc-title-block {
      flex: 0 0 auto;
      max-width: 74%;
    }
    .toc-chapter-label {
      display: block;
      font-size: 0.72em;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      color: #9ca3af;
      margin-bottom: 0.1em;
    }
    .toc-title {
      display: block;
    }
    .toc-dots {
      flex: 1 1 auto;
      border-bottom: 1px dotted #aaa;
      margin: 0 0.55em 0.3em;
      min-width: 0.5em;
    }
    .toc-page {
      flex: 0 0 auto;
      font-variant-numeric: tabular-nums;
    }

    @media print {
      body { font-size: 11pt; }
      .chapter { page-break-before: always; }
      h1 { page-break-after: avoid; }
      .toc-entry { page-break-inside: avoid; break-inside: avoid; }
    }
    @media screen {
      /* Use print margins so text reflows identically — essential for
         accurate page-number measurement in the ToC script. */
      body {
        width: ${width};
        margin: 0 auto;
        padding: ${margins};
        background: white;
        box-shadow: 0 2px 20px rgba(0,0,0,0.15);
        min-height: ${height};
        box-sizing: border-box;
      }
      .cover-page { height: ${height}; }
    }
  </style>
</head>
<body>
${coverHTML}
${sectionsHTML}
${tocScript}
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) { alert('Please allow popups to export as PDF.'); return; }
  printWindow.document.write(fullHTML);
  printWindow.document.close();
  printWindow.focus();
}
