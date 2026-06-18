import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';

interface RefItem { name: string; desc: string; category: string; }

const ITEMS: RefItem[] = [
  // Document structure
  { name: '<!DOCTYPE html>', desc: 'Triggers HTML5 standards mode — must be the very first line', category: 'Document' },
  { name: '<html lang="en">', desc: 'Root element; lang attribute required for accessibility and SEO', category: 'Document' },
  { name: '<head>', desc: 'Container for metadata, title, links, scripts — nothing visible', category: 'Document' },
  { name: '<meta charset="UTF-8">', desc: 'Character encoding — must appear within the first 1024 bytes of <head>', category: 'Document' },
  { name: '<meta name="viewport">', desc: 'content="width=device-width, initial-scale=1" for responsive layout', category: 'Document' },
  { name: '<title>', desc: 'Primary SEO signal; shown in browser tab and search results (50-60 chars)', category: 'Document' },
  { name: '<link rel="stylesheet">', desc: 'External CSS — render-blocking by default; add media="print" to defer', category: 'Document' },
  { name: '<script defer>', desc: 'Downloads async, executes after HTML parsing in source order', category: 'Document' },
  { name: '<script async>', desc: 'Downloads async, executes immediately — breaks script ordering', category: 'Document' },
  // Text & Media
  { name: '<h1>–<h6>', desc: 'Heading hierarchy — one h1 per page; never skip levels for style', category: 'Text' },
  { name: '<p>', desc: 'Paragraph — block element; do not nest block elements inside', category: 'Text' },
  { name: '<strong>', desc: 'Strong importance (semantic bold) — screen readers may stress it', category: 'Text' },
  { name: '<em>', desc: 'Stress emphasis (semantic italic)', category: 'Text' },
  { name: '<a href>', desc: 'Anchor; add rel="noopener noreferrer" when target="_blank"', category: 'Text' },
  { name: '<img alt>', desc: 'Image; alt="" for decorative, descriptive text for meaningful images', category: 'Text' },
  { name: '<picture>', desc: 'Art direction — wraps <source> + <img> for responsive/format switching', category: 'Text' },
  { name: 'loading="lazy"', desc: 'Native lazy load on <img>/<iframe> — defer until near viewport', category: 'Text' },
  { name: 'fetchpriority="high"', desc: 'Boost priority of LCP image so browser fetches it early', category: 'Text' },
  { name: '<video controls>', desc: 'Native video player; add <source> elements for codec fallback', category: 'Text' },
  { name: '<audio controls>', desc: 'Native audio player; fallback text inside element for old browsers', category: 'Text' },
  // Tables
  { name: '<table>', desc: 'For tabular data only — never for layout', category: 'Tables' },
  { name: '<caption>', desc: 'Table title — accessible summary read by screen readers', category: 'Tables' },
  { name: '<thead>/<tbody>/<tfoot>', desc: 'Semantic table sections; thead/tfoot repeat on print', category: 'Tables' },
  { name: '<th scope="col">', desc: 'Header cell; scope links it to a column or row for screen readers', category: 'Tables' },
  { name: 'colspan / rowspan', desc: 'Span multiple columns/rows — use sparingly to avoid confusion', category: 'Tables' },
  // Forms
  { name: '<form action method>', desc: 'action=URL, method=GET|POST — method=POST for sensitive data', category: 'Forms' },
  { name: '<label for>', desc: 'Must match input id= — always associate labels explicitly', category: 'Forms' },
  { name: '<input type="text">', desc: 'Single-line text; use specific types (email/tel/url) for better UX', category: 'Forms' },
  { name: '<input type="email">', desc: 'Built-in pattern validation + correct mobile keyboard', category: 'Forms' },
  { name: '<input required>', desc: 'Native validation; combine with pattern, min, max for constraints', category: 'Forms' },
  { name: '<fieldset>/<legend>', desc: 'Groups related controls; legend is the accessible group label', category: 'Forms' },
  { name: '<select>/<option>', desc: 'Dropdown list; add <optgroup> to group related options', category: 'Forms' },
  { name: '<textarea>', desc: 'Multi-line text; use rows/cols or CSS for sizing — not both', category: 'Forms' },
  { name: '<button type="submit">', desc: 'Default type inside a form is "submit" — always set type explicitly', category: 'Forms' },
  // Semantic
  { name: '<header>', desc: 'Introductory content for a page or section — multiple per page OK', category: 'Semantic' },
  { name: '<nav>', desc: 'Primary navigation links; add aria-label when multiple nav elements exist', category: 'Semantic' },
  { name: '<main>', desc: 'Primary page content — one per page, no nested main elements', category: 'Semantic' },
  { name: '<article>', desc: 'Self-contained content that makes sense in isolation (blog post, card)', category: 'Semantic' },
  { name: '<section>', desc: 'Thematically grouped content — requires a heading (h2–h6)', category: 'Semantic' },
  { name: '<aside>', desc: 'Tangentially related content — sidebars, callouts, related links', category: 'Semantic' },
  { name: '<footer>', desc: 'Closing content for page or section; often contains copyright, links', category: 'Semantic' },
  { name: '<figure>/<figcaption>', desc: 'Self-contained media with an optional caption below', category: 'Semantic' },
  { name: '<time datetime>', desc: 'Machine-readable date/time; datetime="2024-06-18T09:00" for precision', category: 'Semantic' },
  // Accessibility
  { name: 'tabindex="0"', desc: 'Makes a non-interactive element focusable in natural tab order', category: 'A11y' },
  { name: 'tabindex="-1"', desc: 'Focusable via JS (focus()) but not in tab order', category: 'A11y' },
  { name: 'aria-label', desc: 'Overrides accessible name — for icon buttons without visible text', category: 'A11y' },
  { name: 'aria-labelledby', desc: 'Points to another element whose text becomes the accessible name', category: 'A11y' },
  { name: 'aria-describedby', desc: 'Points to additional descriptive text for an element', category: 'A11y' },
  { name: 'aria-hidden="true"', desc: 'Hides decorative elements from assistive tech — never on focusable elements', category: 'A11y' },
  { name: 'aria-live="polite"', desc: 'Announces dynamic content changes to screen readers without interrupting', category: 'A11y' },
  { name: 'role="button"', desc: 'Last resort when a native <button> is impossible — also add keyboard handlers', category: 'A11y' },
  // Global attributes
  { name: 'id', desc: 'Unique per page — used for fragment links, labels, ARIA references', category: 'Global' },
  { name: 'class', desc: 'CSS/JS hook — multiple classes space-separated; not unique', category: 'Global' },
  { name: 'data-*', desc: 'Custom data attributes — read via element.dataset.myKey in JavaScript', category: 'Global' },
  { name: 'hidden', desc: 'Boolean attribute; removes element from layout and accessibility tree', category: 'Global' },
  { name: 'contenteditable', desc: 'Makes element editable — use with care; add role and keyboard handling', category: 'Global' },
  { name: 'draggable="true"', desc: 'Makes element draggable — must handle dragstart to set transfer data', category: 'Global' },
];

const CATEGORIES = ['All', 'Document', 'Text', 'Tables', 'Forms', 'Semantic', 'A11y', 'Global'];

const CODE_TABS: CodeTab[] = [
  {
    label: 'Document Shell',
    language: 'html',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title — Site Name</title>
  <meta name="description" content="150-160 char page summary for SERPs.">
  <link rel="canonical" href="https://example.com/page">

  <!-- Preload critical assets -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://api.example.com">

  <!-- Styles: non-critical loaded async -->
  <link rel="stylesheet" href="/css/critical.css">
  <link rel="stylesheet" href="/css/app.css" media="print" onload="this.media='all'">

  <!-- Scripts: defer preserves order and doesn't block parsing -->
  <script defer src="/js/app.js"></script>
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>
  <header>...</header>
  <main id="main">...</main>
  <footer>...</footer>
</body>
</html>`
  },
  {
    label: 'Accessible Form',
    language: 'html',
    code: `<form action="/submit" method="POST" novalidate>
  <fieldset>
    <legend>Contact Details</legend>

    <div class="field">
      <label for="name">Full name <span aria-hidden="true">*</span></label>
      <input id="name" name="name" type="text"
             autocomplete="name" required
             aria-required="true"
             aria-describedby="name-hint">
      <span id="name-hint" class="hint">Enter your first and last name</span>
    </div>

    <div class="field">
      <label for="email">Email address</label>
      <input id="email" name="email" type="email"
             autocomplete="email" required
             aria-required="true">
    </div>

    <div class="field">
      <label for="message">Message</label>
      <textarea id="message" name="message" rows="4" required></textarea>
    </div>
  </fieldset>

  <button type="submit">Send message</button>
</form>`
  },
  {
    label: 'Semantic Layout',
    language: 'html',
    code: `<body>
  <!-- Skip link: first focusable element on page -->
  <a class="skip-link" href="#main">Skip to main content</a>

  <header>
    <a href="/" aria-label="Home — My Site">
      <img src="/logo.svg" alt="My Site" width="120" height="40">
    </a>
    <nav aria-label="Primary">
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/blog" aria-current="page">Blog</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main id="main">
    <article>
      <h1>Article Title</h1>
      <p>Published <time datetime="2024-06-18">18 June 2024</time></p>
      <p>Article content…</p>
    </article>

    <aside aria-label="Related posts">
      <h2>You might also like</h2>
      <ul>…</ul>
    </aside>
  </main>

  <footer>
    <p><small>&copy; 2024 My Site. All rights reserved.</small></p>
  </footer>
</body>`
  },
];

@Component({
  selector: 'app-html-cheatsheet',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, CodeBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class HtmlCheatsheet {
  activeCategory = signal('All');
  search = signal('');
  categories = CATEGORIES;
  codeTabs = CODE_TABS;

  items = computed(() => {
    const cat = this.activeCategory();
    const q = this.search().toLowerCase();
    return ITEMS.filter(i =>
      (cat === 'All' || i.category === cat) &&
      (!q || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    );
  });

  setCategory(c: string) { this.activeCategory.set(c); }
  onSearch(e: Event) { this.search.set((e.target as HTMLInputElement).value); }
}
