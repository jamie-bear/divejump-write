---
name: book-editor-typesetting
description: >
  Professional book typesetting logic for building rich text editors inspired by Reedsy Studio's approach.
  Use this skill whenever a developer asks to build, replicate, or improve a book writing or editing interface,
  implement paragraph indentation logic for fiction/nonfiction, add scene break or chapter break behavior to an
  editor, or achieve a "typeset book look" (vs. blog/web style) in a browser-based editor. Trigger on phrases
  like "book editor", "writing app", "typeset", "Reedsy-style", "manuscript editor", "indentation logic",
  "scene break", "drop caps", or "print-ready formatting". Also trigger when the user wants to write a novel
  or format a manuscript in a web app — even if they don't mention typesetting explicitly.
---

# Book Editor Typesetting Skill

A reference for building polished, professional book editors in the browser — inspired by the approach used
by tools like Reedsy Studio, but focused on giving developers a solid, reusable implementation foundation.

---

## Philosophy: Book Typesetting vs. Web Formatting

Web editors (blogs, CMS tools) typically use **block paragraph** style: paragraphs separated by visible
`margin-bottom` gaps, no indentation. This looks normal on screen but wrong in a printed book.

Professional book typesetting uses **indented paragraph** style, as defined by the Chicago Manual of Style:

- **No vertical space** between paragraphs (zero `margin-top`/`margin-bottom`)
- **No indent** on the first paragraph of a section (chapter start, scene break, after a heading)
- **First-line indent** on every subsequent paragraph (typically 1.2em–1.5em / 0.3"–0.5" in print)
- **Justified text** in exports; left-aligned is acceptable in the writing UI for readability

This is what Reedsy Studio does automatically, and what this skill helps you implement.

---

## 1. Core Indentation Logic

### The Rule
> The first paragraph of any section is **never** indented. Every subsequent paragraph **is**.

A "section" begins at: chapter start, a heading, a scene break, or a block-level element like a blockquote.

### HTML Structure

```html
<div class="chapter-body">
  <p>First paragraph — no indent.</p>
  <p>Second paragraph — indented.</p>
  <p>Third paragraph — indented.</p>
  <hr class="scene-break">
  <p>First paragraph after scene break — no indent.</p>
  <p>Next paragraph — indented again.</p>
</div>
```

### CSS Logic

```css
/* Base paragraph reset — no gaps, no indent */
.chapter-body p {
  margin: 0;
  padding: 0;
  text-indent: 0;
  line-height: 1.6;
  font-size: 1rem;
}

/* Indent every paragraph that directly follows another paragraph */
.chapter-body p + p {
  text-indent: 1.5em;
}

/* Reset indent after scene breaks */
.scene-break + p {
  text-indent: 0;
}

/* Reset indent after headings */
.chapter-body h1 + p,
.chapter-body h2 + p,
.chapter-body h3 + p {
  text-indent: 0;
}

/* Reset indent after blockquotes */
.chapter-body blockquote + p {
  text-indent: 0;
}
```

**Accuracy note:** Reedsy's own documentation confirms that paragraphs following a "double line break"
(i.e., a new paragraph/`</p><p>`) start outdented, and subsequent paragraphs indent. This CSS approach
mirrors that behavior correctly.

---

## 2. Line Break Types

Two distinct break types produce different typesetting behavior:

| User Action | HTML Output | Typesetting Result |
|---|---|---|
| `Enter` (Hard Break) | `</p><p>` | New paragraph. Triggers the `p + p` indent rule. |
| `Shift+Enter` (Soft Break) | `<br>` | Line break within the same `<p>`. No indent on new line. Useful for poetry, addresses, verse. |

### Key distinction
A soft break (`<br>`) keeps the reader inside the same paragraph block. The next "line" visually wraps,
but typographically it is still part of the same paragraph — no indentation is applied.

Reedsy documentation explicitly states: *"To remove indentation, you can use soft breaks (Shift + Enter)."*
This is the correct behavior for things like song lyrics, postal addresses, or verse in prose.

---

## 3. Scene Break Logic

Scene breaks signal a shift in time, location, or perspective within a chapter. They are rendered as a
divider (typically `* * *`, `#`, or a decorative ornament) and **reset** the indentation context.

### HTML

```html
<p>End of scene one.</p>
<hr class="scene-break" aria-label="Scene break">
<p>Start of scene two — no indent.</p>
```

### CSS

```css
.scene-break {
  border: none;
  text-align: center;
  margin: 1.5em 0;
  color: #555;
}

/* Render as asterisks or ornament via pseudo-element */
.scene-break::before {
  content: "* * *";
  letter-spacing: 0.5em;
}

/* Critical: reset indent on the paragraph immediately after */
.scene-break + p {
  text-indent: 0;
}
```

---

## 4. Spacing and Justification

### Vertical spacing
- All `<p>` elements: `margin: 0; padding: 0;`
- No `margin-bottom` between paragraphs — this is the single biggest visual difference from blog-style editors
- Section breaks (`<hr class="scene-break">`) use `margin: 1.5em 0` to breathe

### Line height
- `1.5` to `1.6` for body text in the editor UI (comfortable reading)
- Exports may use slightly tighter values (1.4–1.5) to match print norms

### Text alignment
- **Writing UI:** `text-align: left` — easier to read on screen, especially with variable font rendering
- **PDF/EPUB export:** `text-align: justify` with `hyphens: auto` — matches professional print standards

```css
/* Writing UI */
.chapter-body {
  text-align: left;
}

/* Export / print preview */
.chapter-body.export-preview {
  text-align: justify;
  hyphens: auto;
}
```

---

## 5. Decision Tree for Indentation Logic

Use this when building a rendering engine or a `contenteditable` handler:

```
Is this the first child `<p>` in the container?
  → text-indent: 0

Is the previous sibling a scene break, heading (h1/h2/h3), or blockquote?
  → text-indent: 0

Is the previous sibling another `<p>`?
  → text-indent: 1.5em

Is there a `<br>` inside the paragraph?
  → break the line, maintain the current paragraph's indent context
```

---

## 6. Drop Caps

A common request for fiction exports. Apply via CSS `::first-letter` pseudo-element on the first paragraph
of each chapter. **Do not apply to paragraphs mid-chapter.**

```css
/* Target only the first paragraph of the chapter body */
.chapter-body > p:first-child::first-letter {
  font-size: 3.5em;
  float: left;
  line-height: 0.85;
  margin-right: 0.06em;
  font-weight: bold;
  font-family: Georgia, serif;
}
```

For contenteditable editors, apply a `.has-dropcap` class to the first `<p>` of body matter dynamically:

```css
.has-dropcap::first-letter { /* same as above */ }
```

**Important:** Drop caps interact with `text-indent`. Ensure the first paragraph's `text-indent: 0` rule
takes precedence over any drop-cap logic.

---

## 7. Front Matter Structure

Following the Chicago Manual of Style (which Reedsy adheres to), front matter elements have a **fixed order**:

1. Half-title page
2. Copyright page
3. Table of Contents (auto-generated)
4. Dedication *(centered, italic — no running headers)*
5. Epigraph
6. Foreword
7. Preface
8. Acknowledgements

**Implementation note:** Each front-matter section should be a separate document node with its own CSS
context, not a continuation of body matter. Dedications and epigraphs remove page headers/footers and
center their text.

```css
.front-matter-dedication {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
  font-style: italic;
}
```

---

## 8. Print-on-Demand Margin Considerations

Thicker books need larger gutter (inner) margins because the binding prevents the book from opening flat.
A good rule of thumb for POD PDFs:

| Page Count | Gutter Margin |
|---|---|
| < 150 pages | 0.75 in (19mm) |
| 150–400 pages | 0.875 in (22mm) |
| 400–600 pages | 1.0 in (25mm) |
| > 600 pages | 1.125 in (28mm) |

This is the same adaptive approach described in the Reedsy V2 documentation (PDF, page 4).

For web-to-PDF exports, apply this margin dynamically based on a page-count estimate:

```js
function getGutterMargin(estimatedPageCount) {
  if (estimatedPageCount < 150) return "0.75in";
  if (estimatedPageCount < 400) return "0.875in";
  if (estimatedPageCount < 600) return "1.0in";
  return "1.125in";
}
```

---

## 9. Recommended Typography Defaults

These mirror the Reedsy Studio templates and industry standards:

| Property | Fiction (Classic) | Non-fiction (Modern) | Romance |
|---|---|---|---|
| Body font | Crimson Text (serif) | Merriweather or Lato | Crimson Text |
| Font size | 11–12pt (print) | 11–12pt (print) | 11–12pt (print) |
| Line height | 1.5 | 1.6 | 1.5 |
| Chapter ornament | Numeral | Numeral + title | Decorative ornament |
| Indentation | 0.35in | 0.35in | 0.35in |

For web UI, use rem units (1rem body, 1.5em indent) and switch to pt/in only for print stylesheets.

---

## 10. Common Pitfalls

**❌ Don't use `margin-bottom` between paragraphs** — this creates the web-blog look, not the book look.

**❌ Don't indent the first paragraph** — even Word and Google Docs get this wrong by default. The first
paragraph of a chapter, scene, or section never has a first-line indent.

**❌ Don't justify text in the writing UI** — justified text in a variable-width browser window creates
rivers of whitespace. Save justification for fixed-width export previews.

**❌ Don't forget `hyphens: auto`** — justified text without hyphenation produces ugly spacing in EPUBs.

**✅ Do use CSS adjacent sibling combinators** — `p + p` is the most robust selector for this pattern.

**✅ Do handle blockquotes and lists** — they break the `p + p` chain. The paragraph after a blockquote
or list should have `text-indent: 0`.

**✅ Do test with long manuscripts** — indentation edge cases (chapter boundaries, import from DOCX,
paste events) only show up at scale.

---

## 11. Minimal Working Example (Vanilla JS)

```html
<style>
  .chapter-body {
    max-width: 600px;
    margin: 0 auto;
    font-family: 'Crimson Text', Georgia, serif;
    font-size: 1.1rem;
    line-height: 1.6;
  }
  .chapter-body p { margin: 0; text-indent: 0; }
  .chapter-body p + p { text-indent: 1.5em; }
  .scene-break { border: none; text-align: center; margin: 1.5em 0; }
  .scene-break::before { content: "* * *"; letter-spacing: 0.5em; }
  .scene-break + p { text-indent: 0; }
  .chapter-body h2 + p { text-indent: 0; }
</style>

<div class="chapter-body" contenteditable="true">
  <h2>Chapter One</h2>
  <p>First paragraph, no indent.</p>
  <p>Second paragraph, indented.</p>
  <hr class="scene-break">
  <p>After scene break, no indent.</p>
  <p>Subsequent paragraph, indented again.</p>
</div>

<script>
  // Handle Enter vs Shift+Enter in contenteditable
  document.querySelector('.chapter-body').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Soft break: insert <br> within the current paragraph
        e.preventDefault();
        document.execCommand('insertLineBreak');
      }
      // Hard break: browser default creates a new <p> (or <div>)
      // Normalize div to p after insertion if needed
    }
  });
</script>
```

For production use, consider **Quill.js**, **TipTap**, or **ProseMirror** as the editor foundation.
Reedsy itself uses a custom fork of Quill with an open-sourced multi-cursor module
(`quill-cursors` on npm / github.com/reedsy/quill-cursors).

---

## References

- Reedsy Studio FAQ on formatting: https://reedsy.com/faq/studio-app/common-questions/formatting-options
- Reedsy V2 proposal documentation (attached PDF) — Proposal #734046, April 2017
- Chicago Manual of Style, 17th edition — the gold standard for US book typesetting
- `quill-cursors` npm package: https://www.npmjs.com/package/quill-cursors
