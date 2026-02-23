import type { Book, Section } from '../../types';
import { parseEpigraph } from '../../components/EpigraphEditor';

// Minimal ePUB 3 builder — pure browser, no server needed.
// ePUB is a ZIP with a specific structure. We build it using
// the JSZip-compatible approach but without JSZip (using Blob/ArrayBuffer directly).

function isTitlePageSection(sec: { type: string; title: string }): boolean {
  return sec.type === 'frontmatter' && sec.title.trim().toLowerCase() === 'title page';
}

function buildTitlePageHTML(book: Pick<Book, 'title' | 'author'>): string {
  const author = book.author.trim();
  return `<section class="title-page-auto">
    ${author ? `<p class="title-page-author">${escHtml(author)}</p>` : ''}
    <h1 class="title-page-book-title">${escHtml(book.title)}</h1>
  </section>`;
}

function jsonToHTML(
  jsonStr: string,
  title: string,
  options?: { includeHeading?: boolean }
): string {
  const includeHeading = options?.includeHeading ?? true;
  const heading = includeHeading ? `<h1>${escHtml(title)}</h1>` : '';
  if (!jsonStr) return `${heading}<p class="blank-paragraph">&nbsp;</p>`;
  try {
    const doc = JSON.parse(jsonStr);
    return `${heading}${renderNodes(doc.content || [])}`;
  } catch {
    return `${heading}<p>${escHtml(jsonStr)}</p>`;
  }
}

function renderNodes(nodes: Record<string, unknown>[]): string {
  return nodes.map(renderNode).join('');
}

function renderNode(node: Record<string, unknown>): string {
  const content = Array.isArray(node.content)
    ? renderNodes(node.content as Record<string, unknown>[])
    : '';
  const text = typeof node.text === 'string' ? escHtml(node.text) : '';
  const attrs = (node.attrs as Record<string, unknown> | undefined) ?? {};
  const marks = Array.isArray(node.marks) ? node.marks as Record<string, unknown>[] : [];
  let result = text;
  for (const mark of marks) {
    if (mark.type === 'bold') result = `<strong>${result}</strong>`;
    else if (mark.type === 'italic') result = `<em>${result}</em>`;
    else if (mark.type === 'underline') result = `<u>${result}</u>`;
  }
  const textAlign = typeof attrs.textAlign === 'string' ? attrs.textAlign : '';
  const alignStyle = textAlign ? ` style="text-align: ${escHtml(textAlign)};"` : '';
  switch (node.type) {
    case 'paragraph': {
      const paragraph = content || result;
      if (!paragraph) return `<p class="blank-paragraph"${alignStyle}>&nbsp;</p>`;
      return `<p${alignStyle}>${paragraph}</p>`;
    }
    case 'heading': {
      const lvl = (attrs as Record<string, number>)?.level ?? 2;
      return `<h${lvl}${alignStyle}>${content}</h${lvl}>`;
    }
    case 'bulletList': return `<ul>${content}</ul>`;
    case 'orderedList': return `<ol>${content}</ol>`;
    case 'listItem': return `<li>${content}</li>`;
    case 'blockquote': return `<blockquote>${content}</blockquote>`;
    case 'horizontalRule': return `<hr class="scene-break"/>`;
    case 'hardBreak': return '<br/>';
    case 'text': return result;
    case 'image': {
      const src = (node.attrs as Record<string, string>)?.src ?? '';
      const alt = (node.attrs as Record<string, string>)?.alt ?? '';
      return `<img src="${escHtml(src)}" alt="${escHtml(alt)}"/>`;
    }
    default: return content || result;
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sectionId(sec: Section): string {
  return `section-${sec.id}`;
}

function sectionFilename(sec: Section): string {
  return `${sectionId(sec)}.xhtml`;
}

function isEpigraphSec(sec: Section): boolean {
  if (sec.type === 'frontmatter' && sec.title.trim().toLowerCase() === 'epigraph') return true;
  try { return JSON.parse(sec.content)?.__type === 'epigraph'; } catch { return false; }
}

function buildEpigraphXHTML(sec: Section): string {
  const data = parseEpigraph(sec.content);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Epigraph</title>
  <link rel="stylesheet" type="text/css" href="../styles/book.css"/>
</head>
<body epub:type="frontmatter">
  <section epub:type="epigraph" class="epigraph-section" id="${sectionId(sec)}">
    <div class="epigraph-block">
      <p class="epigraph-quote">${escHtml(data.quote)}</p>
      <p class="epigraph-attribution">${data.attribution ? `\u2014\u2009${escHtml(data.attribution)}` : ''}</p>
    </div>
  </section>
</body>
</html>`;
}

function coverMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? 'image/jpeg';
}

function coverExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

function buildCoverXHTML(coverExt: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Cover</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
    img.cover { width: 100%; height: 100%; object-fit: cover; display: block; }
  </style>
</head>
<body epub:type="cover">
  <section epub:type="cover">
    <img class="cover" src="../Images/cover.${coverExt}" alt="Cover"/>
  </section>
</body>
</html>`;
}

/** Extract raw bytes from a base64 data URL */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function buildChapterXHTML(sec: Section, _book: Book, chapterNum?: number): string {
  const numHtml = chapterNum != null ? `<p class="chapter-number">${chapterNum}</p>\n    ` : '';
  const body = isTitlePageSection(sec)
    ? buildTitlePageHTML(_book)
    : jsonToHTML(sec.content, sec.title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escHtml(sec.title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles/book.css"/>
</head>
<body epub:type="${sec.type === 'frontmatter' ? 'frontmatter' : sec.type === 'backmatter' ? 'backmatter' : 'bodymatter'}">
  <section epub:type="${sec.type === 'chapter' ? 'chapter' : sec.type}" id="${sectionId(sec)}">
    ${numHtml}${body}
  </section>
</body>
</html>`;
}

function buildBookCSS(template: Book['template'], paragraphIndent = true): string {
  const bodyFonts: Record<Book['template'], string> = {
    reedsy: 'Merriweather, Georgia, serif',
    classic: 'Times New Roman, Times, serif',
    romance: 'Garamond, "EB Garamond", Georgia, serif',
  };
  // Title font matches editor.css .section-chapter-title per template
  const titleFonts: Record<Book['template'], string> = {
    reedsy: 'Lato, Arial, sans-serif',
    classic: 'Times New Roman, Times, serif',
    romance: 'Garamond, "EB Garamond", Georgia, serif',
  };
  const titleExtra: Record<Book['template'], string> = {
    reedsy: 'text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;',
    classic: 'text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;',
    romance: 'font-style: italic; font-weight: 400; letter-spacing: 0.02em;',
  };
  const titleSizes: Record<Book['template'], string> = {
    reedsy: '1.9em',
    classic: '1.8em',
    romance: '2.1em',
  };
  const sizes: Record<Book['template'], string> = {
    reedsy: '1.1em',
    classic: '1.2em',
    romance: '1.05em',
  };
  const lineHeights: Record<Book['template'], string> = {
    reedsy: '1.7',
    classic: '2.0',
    romance: '1.6',
  };
  const pStyle = paragraphIndent
    ? `p { text-indent: 0; margin: 0; }
p + p { text-indent: 1.5em; }
h1 + p, h2 + p, h3 + p, hr + p, hr.scene-break + p, blockquote + p, ul + p, ol + p { text-indent: 0; }`
    : `p { text-indent: 0; margin-bottom: 0.8em; }`;

  return `
body { font-family: ${bodyFonts[template]}; font-size: ${sizes[template]}; line-height: ${lineHeights[template]}; margin: 1.5em 2em; color: #1a1a1a; text-align: justify; hyphens: auto; }
h1 { font-family: ${titleFonts[template]}; font-size: ${titleSizes[template]}; text-align: center; margin: 2em auto 1em; ${titleExtra[template]} }
h2 { font-size: 1.4em; margin: 1.5em 0 0.5em; }
${pStyle}
p.blank-paragraph { text-indent: 0 !important; margin: 0; }
blockquote { margin: 1em 2em; font-style: italic; }
hr.scene-break { border: none; text-align: center; margin: 2em auto; }
hr.scene-break::after { content: "* * *"; font-style: normal; }
img { max-width: 100%; height: auto; display: block; margin: 1em auto; }

/* Chapter number */
.chapter-number { text-align: center; font-size: 0.85em; color: #9ca3af; letter-spacing: 0.12em; margin: 2em 0 0.2em 0; text-indent: 0 !important; }

/* Title page */
.title-page-auto { min-height: 75vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
.title-page-author { margin: 0 0 1.5em 0; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.9em; color: #57534e; text-indent: 0 !important; }
.title-page-book-title { margin: 0; }

/* Epigraph */
.epigraph-section { display: flex; flex-direction: column; justify-content: center; min-height: 80vh; padding: 10% 0; }
.epigraph-block { margin-left: 22%; max-width: 62%; }
.epigraph-quote { font-style: italic; text-indent: 0 !important; margin: 0 0 0.65em 0; }
.epigraph-attribution { text-align: right; font-style: normal; font-size: 0.88em; color: #57534e; text-indent: 0 !important; margin: 0; }
`;
}

function buildContainerXML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

function buildOPF(book: Book, coverExt = 'jpg', coverMime = 'image/jpeg'): string {
  const { sections } = book;
  const hasCover = !!book.coverImage;

  const coverManifest = hasCover ? `
    <item id="cover-image" href="Images/cover.${coverExt}" media-type="${coverMime}" properties="cover-image"/>
    <item id="cover-page" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>` : '';

  const coverMeta = hasCover ? `\n    <meta name="cover" content="cover-image"/>` : '';

  const manifestItems = sections
    .map((sec) => `    <item id="${sectionId(sec)}" href="Text/${sectionFilename(sec)}" media-type="application/xhtml+xml"/>`)
    .join('\n');

  const coverSpine = hasCover ? `    <itemref idref="cover-page"/>` : '';
  const spineItems = sections.map((sec) => `    <itemref idref="${sectionId(sec)}"/>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escHtml(book.title)}</dc:title>
    <dc:creator>${escHtml(book.author || 'Unknown Author')}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="bookid">urn:uuid:${book.id}</dc:identifier>
    <meta property="dcterms:modified">${book.updatedAt.slice(0, 19).replace(' ', 'T')}Z</meta>${coverMeta}
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles/book.css" media-type="text/css"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${coverManifest}
${manifestItems}
  </manifest>
  <spine toc="ncx">
${coverSpine}
${spineItems}
  </spine>
</package>`;
}

function buildNCX(book: Book): string {
  const navPoints = book.sections
    .map(
      (sec, i) => `
  <navPoint id="${sectionId(sec)}" playOrder="${i + 1}">
    <navLabel><text>${escHtml(sec.title)}</text></navLabel>
    <content src="Text/${sectionFilename(sec)}"/>
  </navPoint>`
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${book.id}"/>
  </head>
  <docTitle><text>${escHtml(book.title)}</text></docTitle>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
}

function buildNavXHTML(book: Book): string {
  const items = book.sections
    .map(
      (sec) =>
        `      <li><a href="Text/${sectionFilename(sec)}">${escHtml(sec.title)}</a></li>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
${items}
    </ol>
  </nav>
</body>
</html>`;
}

async function buildEPUB(book: Book): Promise<Blob> {
  const files: { name: string; content: string | Uint8Array }[] = [];

  // mimetype MUST be first and uncompressed
  files.push({ name: 'mimetype', content: 'application/epub+zip' });
  files.push({ name: 'META-INF/container.xml', content: buildContainerXML() });
  const coverMime = book.coverImage ? coverMimeType(book.coverImage) : 'image/jpeg';
  const coverExt = coverExtension(coverMime);

  files.push({ name: 'OEBPS/content.opf', content: buildOPF(book, coverExt, coverMime) });
  files.push({ name: 'OEBPS/toc.ncx', content: buildNCX(book) });
  files.push({ name: 'OEBPS/nav.xhtml', content: buildNavXHTML(book) });
  files.push({ name: 'OEBPS/styles/book.css', content: buildBookCSS(book.template, book.paragraphIndent ?? true) });

  // Cover
  if (book.coverImage) {
    files.push({ name: 'OEBPS/Text/cover.xhtml', content: buildCoverXHTML(coverExt) });
    files.push({ name: `OEBPS/Images/cover.${coverExt}`, content: dataUrlToBytes(book.coverImage) });
  }

  // Sections
  let chapterCount = 0;
  for (const sec of book.sections) {
    if (sec.type === 'chapter') chapterCount++;
    const num = (book.chapterNumbers ?? false) && sec.type === 'chapter' ? chapterCount : undefined;
    const content = isEpigraphSec(sec)
      ? buildEpigraphXHTML(sec)
      : buildChapterXHTML(sec, book, num);
    files.push({ name: `OEBPS/Text/${sectionFilename(sec)}`, content });
  }

  return buildZip(files);
}

// Minimal ZIP builder (no compression, stored mode)
function buildZip(files: { name: string; content: string | Uint8Array }[]): Blob {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const dataBytes =
      typeof file.content === 'string' ? enc.encode(file.content) : file.content;
    const crc = crc32(dataBytes);

    // Local file header
    const localHeader = new DataView(new ArrayBuffer(30 + nameBytes.length));
    localHeader.setUint32(0, 0x04034b50, true); // signature
    localHeader.setUint16(4, 20, true); // version needed
    localHeader.setUint16(6, 0, true); // flags
    localHeader.setUint16(8, 0, true); // compression: stored
    localHeader.setUint16(10, 0, true); // mod time
    localHeader.setUint16(12, 0, true); // mod date
    localHeader.setUint32(14, crc, true); // crc-32
    localHeader.setUint32(18, dataBytes.length, true); // compressed size
    localHeader.setUint32(22, dataBytes.length, true); // uncompressed size
    localHeader.setUint16(26, nameBytes.length, true); // filename length
    localHeader.setUint16(28, 0, true); // extra length
    const lhBytes = new Uint8Array(localHeader.buffer);
    nameBytes.forEach((b, i) => { lhBytes[30 + i] = b; });

    parts.push(lhBytes);
    parts.push(dataBytes);

    // Central directory entry
    const cdEntry = new DataView(new ArrayBuffer(46 + nameBytes.length));
    cdEntry.setUint32(0, 0x02014b50, true); // signature
    cdEntry.setUint16(4, 20, true); // version made by
    cdEntry.setUint16(6, 20, true); // version needed
    cdEntry.setUint16(8, 0, true); // flags
    cdEntry.setUint16(10, 0, true); // compression
    cdEntry.setUint16(12, 0, true); // mod time
    cdEntry.setUint16(14, 0, true); // mod date
    cdEntry.setUint32(16, crc, true); // crc-32
    cdEntry.setUint32(20, dataBytes.length, true); // compressed size
    cdEntry.setUint32(24, dataBytes.length, true); // uncompressed size
    cdEntry.setUint16(28, nameBytes.length, true); // filename length
    cdEntry.setUint16(30, 0, true); // extra length
    cdEntry.setUint16(32, 0, true); // comment length
    cdEntry.setUint16(34, 0, true); // disk start
    cdEntry.setUint16(36, 0, true); // internal attrs
    cdEntry.setUint32(38, 0, true); // external attrs
    cdEntry.setUint32(42, offset, true); // local header offset
    const cdBytes = new Uint8Array(cdEntry.buffer);
    nameBytes.forEach((b, i) => { cdBytes[46 + i] = b; });

    centralDir.push(cdBytes);
    offset += lhBytes.length + dataBytes.length;
  }

  const cdStart = offset;
  const cdSize = centralDir.reduce((s, b) => s + b.length, 0);

  // End of central directory
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, cdStart, true);
  eocd.setUint16(20, 0, true);

  const allParts: ArrayBuffer[] = [
    ...parts.map((u) => u.buffer as ArrayBuffer),
    ...centralDir.map((u) => u.buffer as ArrayBuffer),
    eocd.buffer as ArrayBuffer,
  ];
  return new Blob(allParts, { type: 'application/epub+zip' });
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export async function exportEPUB(book: Book): Promise<void> {
  const blob = await buildEPUB(book);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${book.title.replace(/[^a-z0-9]/gi, '_') || 'book'}.epub`;
  a.click();
  URL.revokeObjectURL(url);
}

export { jsonToHTML, buildBookCSS };
