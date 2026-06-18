import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-html-interview-prep',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuizBlockComponent, QnaBlockComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class HtmlInterviewPrep {
  activeFilter = signal('All');
  filters = ['All', 'Foundations', 'Semantic', 'Forms', 'Accessibility', 'Performance', 'APIs'];

  quiz: QuizQuestion[] = [
    { q: 'What does DOCTYPE html do?', options: ['Loads the HTML5 spec', 'Triggers browser standards mode', 'Enables CSS3 features', 'Sets the document charset'], answer: 1, explanation: '<!DOCTYPE html> switches the browser from quirks mode (IE compatibility) to standards mode, ensuring consistent CSS and JS behaviour.' },
    { q: 'Which attribute value makes a <script> execute after HTML is fully parsed, in source order?', options: ['async', 'defer', 'module', 'type="text/javascript"'], answer: 1, explanation: 'defer downloads the script in parallel but executes it only after DOMContentLoaded, preserving source order. async executes as soon as downloaded — unordered.' },
    { q: 'What is the first rule of ARIA?', options: ['Always add ARIA roles', 'Use native HTML elements first', 'ARIA overrides native semantics', 'Add aria-label to every element'], answer: 1, explanation: 'If a native HTML element already has the correct semantics and behaviour, use it. Only reach for ARIA when no native element works.' },
    { q: 'Which input type provides built-in email validation AND a tailored mobile keyboard?', options: ['type="text" with pattern', 'type="email"', 'type="url"', 'type="search"'], answer: 1, explanation: 'type="email" enables both native validation (format check) and a mobile keyboard with @ and .com shortcuts — zero-cost UX improvement.' },
    { q: 'What does loading="lazy" do on an <img>?', options: ['Reduces image file size', 'Defers download until image is near the viewport', 'Blurs the image until clicked', 'Loads image after all scripts'], answer: 1, explanation: 'Native lazy loading defers the network request until the image enters (or approaches) the viewport, reducing initial page weight.' },
    { q: 'Why should you add rel="noopener noreferrer" to target="_blank" links?', options: ['For SEO juice', 'To open in an incognito tab', 'To prevent the opened page from accessing the opener via window.opener', 'To block cookies'], answer: 2, explanation: 'Without noopener, a malicious page opened in a new tab can access the opener window and redirect it — a tab-napping attack.' },
    { q: 'What is the difference between <article> and <section>?', options: ['article is block, section is inline', 'article is self-contained; section is thematically grouped and requires a heading', 'They are identical', 'section replaces article in HTML5.2'], answer: 1, explanation: '<article> is self-contained (a blog post, a comment). <section> groups related content thematically and typically needs an h2–h6 heading.' },
    { q: 'Which element should wrap a form\'s radio button group?', options: ['<div role="group">', '<fieldset> with <legend>', '<section>', '<label>'], answer: 1, explanation: '<fieldset> groups related controls; <legend> provides the accessible label for the group — required for screen reader users to understand the context.' },
    { q: 'What does the canonical link element do?', options: ['Redirects users', 'Sets the page language', 'Tells crawlers which URL is the preferred version of duplicate content', 'Prevents indexing'], answer: 2, explanation: 'rel="canonical" consolidates link equity from multiple duplicate URLs (e.g. with/without trailing slash) to the preferred canonical URL.' },
    { q: 'What makes a PWA installable?', options: ['A service worker alone', 'HTTPS + a Web App Manifest with name, icons, and start_url', 'An app store listing', 'A native wrapper'], answer: 1, explanation: 'Browsers show the "Add to Home Screen" prompt when the site is on HTTPS, has a registered service worker, and has a valid manifest with at minimum name/short_name, icons (192 and 512 px), and start_url.' },
    { q: 'What is the correct way to associate a <label> with an <input>?', options: ['Wrap the input inside the label', 'Use label for= matching input id=', 'Both A and B are correct', 'Use aria-label on the input'], answer: 2, explanation: 'Both work: explicit association (for=/id) and implicit association (input nested inside label). aria-label is a fallback when neither is possible.' },
    { q: 'Which Cache API strategy serves a cached response immediately then updates the cache in the background?', options: ['Cache-first', 'Network-first', 'Stale-while-revalidate', 'Cache-only'], answer: 2, explanation: 'Stale-while-revalidate gives instant responses from cache while a background network request updates the cache for next time — best balance of speed and freshness.' },
  ];

  qna: QnaItem[] = [
    { q: 'Explain the Critical Rendering Path and how to optimise it.', a: 'The CRP is the sequence the browser follows to display content: parse HTML → build DOM, parse CSS → build CSSOM, combine into Render Tree → Layout → Paint. Render-blocking resources (CSS in <head>, synchronous JS in <head>) stall this pipeline. Optimise by: inlining critical CSS, using defer/async on scripts, preloading key assets with rel="preload", and eliminating unused CSS.' },
    { q: 'What is the difference between defer and async on a script tag?', a: 'Both download the script without blocking HTML parsing. defer executes the script after DOMContentLoaded, in source order — safe for scripts that depend on each other. async executes as soon as downloaded, in any order — suitable for independent scripts (analytics, ads). Inside a <script type="module">, defer behaviour is the default.' },
    { q: 'How does aria-live work and when would you use it?', a: 'aria-live creates a "live region" — when its content changes, screen readers announce the change. polite waits for the user to finish their current action; assertive interrupts immediately. Use for dynamic status messages (form errors, loading states, chat messages) that appear without a page reload. The live region must exist in the DOM before content is injected — adding it dynamically defeats it.' },
    { q: 'What is the difference between id and class?', a: 'id must be unique per page — it is used for fragment navigation (#section), label association (for=/id), and ARIA references. class is reusable across any number of elements and is the primary CSS/JS hook. Both are global attributes. Never use the same id twice; it breaks fragment links and ARIA associations.' },
    { q: 'How does the service worker lifecycle work?', a: 'Registration: navigator.serviceWorker.register() downloads the SW script. Install: the SW fires the install event — ideal for pre-caching the app shell. Activate: fires after install when no other SW controls the page — delete old caches here, call clients.claim() to take control immediately. Fetch: intercepts every network request — apply cache strategy (cache-first, network-first, stale-while-revalidate).' },
    { q: 'What is the Shadow DOM and why is it useful?', a: 'Shadow DOM is a scoped subtree attached to a Custom Element via element.attachShadow({mode:"open"}). CSS inside the Shadow DOM cannot leak out; external CSS cannot penetrate in. This makes Web Components truly encapsulated — a button\'s internal layout does not bleed into the page. Slots (<slot>) allow the host page to inject content into predefined positions.' },
    { q: 'Explain the difference between preload, prefetch, and preconnect.', a: 'preload (rel="preload"): fetch this resource NOW for the current page with high priority — use for LCP images, critical fonts, above-the-fold JS. prefetch (rel="prefetch"): fetch during idle time for a future navigation — use for the next page\'s resources. preconnect (rel="preconnect"): establish TCP+TLS early for a third-party origin without fetching a resource — use for font CDNs, API hosts.' },
    { q: 'What is Cumulative Layout Shift (CLS) and how do you prevent it in HTML?', a: 'CLS measures how much visible content unexpectedly shifts during page load. Caused by: images without width/height attributes, late-injected ads, web fonts causing FOUT. Fix in HTML: always set explicit width and height on <img> and <video> so the browser reserves space. Use font-display: swap or preload fonts. Reserve ad slot space with CSS min-height.' },
    { q: 'When would you use tabindex="-1" vs tabindex="0"?', a: 'tabindex="0" makes a non-interactive element (div, span) focusable and adds it to the natural tab order — use when you must make a div into a custom interactive widget. tabindex="-1" makes an element focusable via JavaScript (element.focus()) but excludes it from the tab order — use for modal dialogs or skip-link targets that should receive programmatic focus without being in the normal keyboard flow.' },
    { q: 'What is JSON-LD and how does it improve search results?', a: 'JSON-LD (JavaScript Object Notation for Linked Data) is a <script type="application/ld+json"> block containing Schema.org markup. It tells search engines what the content means — Article, Product, FAQ, BreadcrumbList, Recipe. Google uses this to generate rich results: star ratings, FAQs, event dates in SERPs. JSON-LD is preferred over microdata because it does not require weaving attributes into HTML.' },
  ];

  filteredQna = computed(() => {
    const f = this.activeFilter();
    const map: Record<string, number[]> = {
      'Foundations': [0,1,3], 'Semantic': [6], 'Forms': [7,10],
      'Accessibility': [2,8], 'Performance': [0,1,6,7], 'APIs': [4,5,9],
    };
    if (f === 'All') return this.qna;
    return (map[f] ?? []).map(i => this.qna[i]).filter(Boolean);
  });

  setFilter(f: string) { this.activeFilter.set(f); }
}
