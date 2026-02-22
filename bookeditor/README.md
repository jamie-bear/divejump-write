# bookeditor — Development Guide

This directory contains the DiveJump Write application source. See the [root README](../README.md) for the full project overview, feature list, and security notes.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server at `http://localhost:5173` |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the whole source tree |

## Project layout

```
src/
├── components/       UI components (see below)
├── store/
│   └── bookStore.ts  Zustand store — all state, actions, localStorage persistence
├── types/
│   └── index.ts      Shared TypeScript interfaces (Book, Section, Note, …)
├── utils/export/
│   ├── epub.ts       ePUB 3 builder — hand-rolled ZIP, pure browser
│   ├── pdf.ts        PDF via window.print()
│   └── json.ts       .djbook / .djlib import (with validation) and export
├── styles/
│   └── editor.css    Tiptap prose styles + template theming
├── App.tsx
└── main.tsx
```

## Adding a new template

1. Add the template name to the `Template` union in `src/types/index.ts`.
2. Add a CSS class block in `src/styles/editor.css` (`.template-<name>`).
3. Add the font/size/line-height entries to the `buildBookCSS` record in `src/utils/export/epub.ts` so the ePUB export matches the editor.
4. Add a label and preview to `TemplateModal.tsx`.

## Store versioning

The Zustand persist store is at `version: 3`. If you add a new field to `Book`, increment the version and add a migration branch in the `migrate` callback in `bookStore.ts`:

```ts
if (version < 4 && s.book) {
  s.book.myNewField = s.book.myNewField ?? defaultValue;
}
```

## Special section rendering

Certain front-matter sections are rendered by dedicated components rather than the standard Tiptap editor:

| Condition | Component |
|---|---|
| `section.type === 'frontmatter' && title === 'Epigraph'` (case-insensitive) | `EpigraphEditor` |
| `section.type === 'frontmatter' && title === 'Title Page'` (case-insensitive) | `TitlePageView` |
| `activeSectionId === COVER_SECTION_ID` | `CoverPane` |

To add another special section, follow the same pattern in `Editor.tsx` — add an `isFooSection()` guard and a dedicated component.
