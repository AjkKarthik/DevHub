import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Text & Media': 'text', 'Forms': 'forms',
  'Semantic': 'semantic', 'Accessibility': 'a11y', 'HTML5 APIs': 'apis', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Text & Media', 'Forms', 'Semantic', 'Accessibility', 'HTML5 APIs', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'HTML Fundamentals',          route: '/html', badge: 'Foundations', available: false,
    description: 'Elements, attributes, the DOM, and how browsers parse HTML. Doctype, character encoding, and document structure.',
    keyPoints: ['<!DOCTYPE html> triggers standards mode', 'Opening tag + content + closing tag = element; void elements have no closing tag', 'Attributes provide extra info: id, class, data-*, aria-*'] },
  { title: 'Document Structure',         route: '/html/document-structure', badge: 'Foundations', available: true,
    description: 'Head vs body, viewport meta tag, charset, title, link, script loading strategies — defer vs async.',
    keyPoints: ['<meta charset="UTF-8"> must be within first 1024 bytes', 'defer: executes after DOM parsed; async: executes as soon as downloaded', 'Viewport meta: width=device-width, initial-scale=1 for responsive layout'] },
  { title: 'Headings & Paragraphs',      route: '/html', badge: 'Text & Media', available: false,
    description: 'h1–h6 hierarchy, paragraph, line breaks, text formatting, and inline vs block elements.',
    keyPoints: ['One h1 per page for SEO and accessibility', 'Avoid <br> for spacing — use CSS margin instead', 'Strong vs b: <strong> has semantic weight; <b> is purely presentational'] },
  { title: 'Links & Navigation',         route: '/html/links-navigation', badge: 'Text & Media', available: true,
    description: 'Anchor element, absolute vs relative URLs, target, rel=noopener, download attribute, and fragment links.',
    keyPoints: ['rel="noopener noreferrer" for target="_blank" links prevents tab-napping', 'Fragment links: href="#section-id" jump to same-page anchors', 'Meaningful link text: "Click here" fails accessibility; "Download report PDF" passes'] },
  { title: 'Images & Media',             route: '/html/media', badge: 'Text & Media', available: true,
    description: '<img>, <picture>, srcset, sizes, lazy loading, <video>, <audio>, and modern image formats.',
    keyPoints: ['Alt text: describe the image content for screen readers; empty alt="" for decorative images', 'loading="lazy" defers off-screen images — free performance win', '<picture> + WebP with JPEG fallback: smaller size, wide compatibility'] },
  { title: 'Tables',                     route: '/html/tables', badge: 'Text & Media', available: true,
    description: 'Table structure, thead/tbody/tfoot, th scope, caption, colspan/rowspan — and when NOT to use tables.',
    keyPoints: ['Use tables for tabular data, not layout', 'scope="col" on <th> links header to column for screen readers', '<caption> provides a summary accessible to all users'] },
  { title: 'HTML Forms',                 route: '/html/forms', badge: 'Forms', available: true,
    description: 'Form element, action, method, all input types, label association, fieldset/legend, and form validation.',
    keyPoints: ['Label for= must match input id= — always associate labels', 'required, pattern, min, max attributes enable native validation', 'novalidate on form + JS validation for custom error messages'] },
  { title: 'Input Types & Attributes',   route: '/html', badge: 'Forms', available: false,
    description: 'The full set of HTML5 input types: email, tel, url, number, date, range, color, search — and their benefits.',
    keyPoints: ['type="email" gives keyboard shortcut on mobile and native validation', 'type="date" provides native date picker across all modern browsers', 'autocomplete attribute: helps password managers and improves UX'] },
  { title: 'Semantic HTML',              route: '/html/semantic-elements', badge: 'Semantic', available: true,
    description: 'Why semantic HTML matters, landmark elements, article vs section, and the semantics of heading hierarchy.',
    keyPoints: ['Semantic elements communicate meaning to browsers, screen readers, and search engines', 'header, nav, main, aside, footer — use one main per page', 'article: self-contained; section: thematically grouped — requires heading'] },
  { title: 'Landmark Elements',          route: '/html', badge: 'Semantic', available: false,
    description: 'All eight ARIA landmark roles, their HTML equivalents, and how screen reader users navigate with them.',
    keyPoints: ['<nav> = role="navigation"; <main> = role="main"; <aside> = role="complementary"', 'Multiple <nav> elements need aria-label to distinguish them', 'Screen reader users jump between landmarks — structure them deliberately'] },
  { title: 'Microdata & Schema.org',     route: '/html', badge: 'Semantic', available: false,
    description: 'Structured data with Schema.org, JSON-LD vs microdata, rich results in search engines.',
    keyPoints: ['JSON-LD: preferred by Google; embedded in <script type="application/ld+json">', 'Schema types: Article, Product, Recipe, FAQ, BreadcrumbList', 'Google Search Console shows which rich results your markup triggers'] },
  { title: 'Accessibility & ARIA',       route: '/html/accessibility', badge: 'Accessibility', available: true,
    description: 'ARIA roles, aria-label, aria-live regions, focus management, landmark roles, and WCAG 2.1 checklist.',
    keyPoints: ['Rule 1 of ARIA: use native HTML first — button beats div[role=button]', 'aria-hidden on focusable elements creates invisible keyboard traps', 'Live regions must pre-exist in the DOM before content is injected'] },
  { title: 'ARIA Roles & Attributes',    route: '/html', badge: 'Accessibility', available: false,
    description: 'When and how to use ARIA roles, states, and properties — and the first rule of ARIA.',
    keyPoints: ['First rule of ARIA: don\'t use ARIA if a native element works', 'aria-label vs aria-labelledby vs aria-describedby', 'aria-live regions: polite for updates, assertive for urgent alerts'] },
  { title: 'Focus Management',           route: '/html', badge: 'Accessibility', available: false,
    description: 'Keyboard traps, focus indicators, focus() in dynamic UIs, and skip navigation links.',
    keyPoints: ['Never remove :focus outline without providing a visible replacement', 'Skip link: first focusable element on page, jumps to main content', 'Modal dialogs: trap focus inside, return to trigger on close'] },
  { title: 'HTML5 Storage APIs',         route: '/html', badge: 'HTML5 APIs', available: false,
    description: 'localStorage vs sessionStorage vs IndexedDB vs cookies — capacity, scope, and security.',
    keyPoints: ['localStorage: persistent, 5MB, same-origin; sessionStorage: tab-scoped', 'IndexedDB: async, indexed, large structured data', 'Cookies: server-readable; set HttpOnly + Secure + SameSite=Lax'] },
  { title: 'Canvas & SVG',               route: '/html', badge: 'HTML5 APIs', available: false,
    description: 'Canvas 2D API for dynamic graphics, SVG for scalable vector graphics — differences and use cases.',
    keyPoints: ['Canvas: pixel-based, fast animation, no DOM overhead', 'SVG: vector, scalable, accessible, CSS-styleable, DOM-queryable', 'Canvas for games/charts; SVG for icons, logos, data vis'] },
  { title: 'Web Components',             route: '/html/custom-elements', badge: 'HTML5 APIs', available: true,
    description: 'Custom elements, Shadow DOM, HTML templates — building reusable components with native browser APIs.',
    keyPoints: ['customElements.define() registers a custom element — name must contain a hyphen', 'Shadow DOM: encapsulated styles and markup; CSS does not leak in/out', 'super() must be first in constructor; side effects belong in connectedCallback'] },
  { title: 'iFrames & Embeds',           route: '/html/iframes-embeds', badge: 'HTML5 APIs', available: true,
    description: 'iframe sandbox, Permissions Policy, clickjacking prevention with CSP frame-ancestors, embed vs object vs inline SVG.',
    keyPoints: ['sandbox="" (empty) = deny-all; add tokens to re-enable: allow-scripts, allow-forms, allow-popups', 'CSP frame-ancestors supersedes X-Frame-Options and supports multiple origins', 'Never combine allow-scripts + allow-same-origin — a script can remove its own sandbox'] },
  { title: 'Drag & Drop API',            route: '/html', badge: 'HTML5 APIs', available: false,
    description: 'Native HTML5 drag-and-drop events — draggable, dragstart, dragover, drop — with data transfer.',
    keyPoints: ['draggable="true" makes any element draggable', 'event.dataTransfer.setData/getData transfer payload between drag and drop', 'Pointer Events API is a more accessible alternative for complex DnD'] },
  { title: 'PWA & Service Workers',       route: '/html', badge: 'HTML5 APIs', available: false,
    description: 'Turn a web app into an installable PWA — Web App Manifest, service worker lifecycle, and offline caching.',
    keyPoints: ['manifest.json: name, icons, theme_color, start_url — enables "Add to Home Screen"', 'Service worker: intercepts fetch requests; cache-first or network-first strategies', 'Cache API: caches.open(), cache.put(), cache.match() for offline assets', 'Background Sync: defer failed requests until connectivity returns', 'Push API + Notifications API: re-engagement without a native app'] },
  { title: 'Head & Metadata',            route: '/html/head-metadata', badge: 'Semantic', available: true,
    description: 'charset, viewport, SEO meta tags, Open Graph, Twitter Cards, canonical, resource hints, and favicon setup.',
    keyPoints: ['charset must be the first tag in <head> — within the first 1024 bytes', 'og:image needs to be at least 1200×630 px for a full-size social preview card', 'Font preloads require both as="font" and crossorigin to avoid a double fetch'] },
  { title: 'HTML Cheat Sheet',           route: '/html', badge: 'Reference', available: false,
    description: 'All HTML5 elements grouped by category, global attributes, input types, and event attributes.',
    keyPoints: ['Void elements: area, base, br, col, embed, hr, img, input, link, meta, param, source, track, wbr', 'Global attributes: id, class, style, hidden, tabindex, data-*, aria-*', 'Character entities: &amp; &lt; &gt; &nbsp; &copy; — when and why'] },
  { title: 'HTML Interview Prep',        route: '/html', badge: 'Reference', available: false,
    description: '25+ HTML interview questions — semantic HTML, accessibility, forms, performance, and browser behaviour.',
    keyPoints: ['Explain the difference between <section> and <div>', 'What is the purpose of alt text on images?', 'How does the browser render an HTML document? (parse → DOM → CSSOM → render tree)'] },
];

@Component({
  selector: 'app-html-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class HtmlHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
