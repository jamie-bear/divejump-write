# DiveJump Write

A free, open-source book editor, inspired by the [Reedsy Book Editor](https://github.com/reedsy/), but without any "paywalled" features.

DiveJump Write runs entirely in your browser. No account, no cloud, no subscription. Write your novel, memoir, or non-fiction manuscript with professional typesetting right in the tab.

## Features
### Writing
- **Rich text editor:** Powered by [Tiptap](https://tiptap.dev/) - bold, italic, underline, strikethrough, highlight, headings, blockquotes, bullet/numbered lists, and inline images
- **Scene breaks:** (`* * *`) Inserted with a single click
- **Three typesetting templates** That mirror real publishing house styles.
- **Paragraph style toggle:** First-line indent (Chicago Manual of Style) or spaced paragraphs (blog style)
- **Chapter numbers:** Optionally display an ordinal number above chapter titles
- **Epigraph editor:** Dedicated UI for the front-matter epigraph page (quote + attribution)
- **Title page:** - Auto-rendered from your book title and author name
### Structure
- **Front matter:** Title Page, Half Title, Copyright, Dedication, Epigraph, Table of Contents, Foreword, Preface, and custom sections
- **Chapters:** Unlimited, drag-and-drop reorderable
- **Back matter:** Epilogue, Afterword, Acknowledgments, About the Author, Bibliography, Glossary, Index, and custom sections
- **Cover art:** Full-bleed cover image upload (JPG, PNG, WebP)
- **Section notes:** Colour-coded sticky notes per section, pinnable
- **Drag-and-drop reordering:** Move sections across front matter, chapters, and back matter
### Goals & Progress
- **Daily word goal:** With a live progress bar
- **Total manuscript word count:** Goal (e.g. 80,000 words)
- Historical goal tracking per book
### Library and Book import/export
- **Multiple books:** Create and switch between books in one library
- **Export:** ePUB 3 (e-readers), PDF (print dialog), `.djbook` (project file), `.djlib` (full library backup)
- **Import:** Restore any `.djbook` or `.djlib` file
---
## Quick Start
```bash
git clone https://github.com/jamie-bear/divejump-write.git
cd divejump-write/bookeditor
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). No environment variables, no database, no backend required.
### Build for production
```bash
npm run build      # outputs to bookeditor/dist/
npm run preview    # preview the production build locally
```
The output is a fully static site. Drop the `dist/` folder onto any static host (GitHub Pages, Netlify, Cloudflare Pages, an S3 bucket, or your own server).
### Lint
```bash
npm run lint
```
---
## Tech Stack
| Layer | Library | Version |
|---|---|---|
| Framework | [React](https://react.dev/) | 19 |
| Language | TypeScript | 5.9 |
| Build tool | [Vite](https://vite.dev/) | 7 |
| Rich text editor | [Tiptap](https://tiptap.dev/) | 3.20 |
| State management | [Zustand](https://zustand-demo.pmnd.rs/) | 5 |
| Persistence | [idb-keyval](https://github.com/jakearchibald/idb-keyval) | 6 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 3.4 |
| Icons | [Lucide React](https://lucide.dev/) | 0.575 |
### Tiptap extensions used
`StarterKit` · `Image` · `Placeholder` · `CharacterCount` · `TextAlign` · `Highlight` · `Typography` · `Underline`
### Minimal runtime dependencies
The ePUB exporter is a hand-rolled ZIP builder (no JSZip). The PDF exporter uses the browser's native print dialog. There is no analytics, telemetry, or third-party SDK of any kind.
---
## Architecture
```
bookeditor/
├── src/
│   ├── components/
│   │   ├── App.tsx              # Root layout
│   │   ├── Sidebar.tsx          # Section navigator + book metadata
│   │   ├── Editor.tsx           # Main editor pane (Tiptap, cover, title page)
│   │   ├── Toolbar.tsx          # Formatting toolbar
│   │   ├── EpigraphEditor.tsx   # Dedicated epigraph UI
│   │   ├── NotesPanel.tsx       # Per-section notes
│   │   ├── GoalPanel.tsx        # Word goal UI
│   │   ├── ExportModal.tsx      # Export options
│   │   ├── TemplateModal.tsx    # Template picker
│   │   └── LibraryModal.tsx     # Book library + import
│   ├── store/
│   │   └── bookStore.ts         # Zustand store (all state + IndexedDB persistence)
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   ├── utils/export/
│   │   ├── epub.ts              # ePUB 3 builder (pure browser, no server)
│   │   ├── pdf.ts               # PDF via window.print()
│   │   └── json.ts              # .djbook / .djlib import & export
│   └── styles/
│       └── editor.css           # Tiptap prose styles + template theming
```
All application state lives in Zustand and is automatically persisted to IndexedDB (via [idb-keyval](https://github.com/jakearchibald/idb-keyval)) under the key `book-editor-storage`. The store supports schema migrations across versions so old saved data is upgraded transparently on first load. If any data is found in `localStorage` from an older version of the app, it is migrated to IndexedDB automatically on first run.
---
## Security
**DiveJump Write is a purely client-side application.** No data ever leaves your browser.
A few specifics worth knowing:
### IndexedDB storage
Book data is persisted to IndexedDB, which is not subject to the ~5 MB cap that affects `localStorage`. The practical storage limit is determined by available disk space and the browser's own quota policy (typically a percentage of free disk). The safest practice is still to:
- Keep cover images under 2 MB (the app enforces this at upload time)
- Export a `.djlib` backup regularly as a safety net
### File import validation
Imported `.djbook` and `.djlib` files are structurally validated before being written to the store. Each section is checked for required fields (`id`, `title`, `type`); malformed notes are dropped rather than stored. A clearly worded error is shown if a file fails validation. **Do not import `.djbook`/`.djlib` files from untrusted sources** — while the validator rejects obviously malformed data, it does not sanitise arbitrary text content inside sections.
### Inline images
Images pasted or uploaded into the editor body are stored as base64 data URIs inside the Tiptap JSON document (and therefore in IndexedDB). Images uploaded as the book cover are also base64 data URIs. Both are capped at **2 MB** at upload time.
### No eval, no remote code
The application does not use `eval()`, `new Function()`, `dangerouslySetInnerHTML`, or any dynamic script execution. ePUB export builds XML/HTML strings using a character-level HTML-escaping function (`escHtml`) before interpolating any user content.
### Content Security Policy
If you self-host, consider adding a strict CSP header. Because all assets are bundled by Vite and there are no CDN dependencies or external fetches at runtime, a tight policy is straightforward:
```
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none';
```
(`unsafe-inline` is required for Tiptap's ProseMirror inline styles.)
---
## Contributing
Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.
```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/divejump-write.git
cd divejump-write/bookeditor
# 2. Install
npm install
# 3. Dev server
npm run dev
# 4. Lint before pushing
npm run lint
```
The codebase is TypeScript-strict throughout. Keep components focused, avoid adding dependencies unless strictly necessary, and make sure `npm run build` passes without errors.
---
## License
MIT — do whatever you like, commercially or otherwise. Attribution appreciated but not required.
