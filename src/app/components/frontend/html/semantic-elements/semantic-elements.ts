import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';

@Component({
  selector: 'app-html-semantic-elements',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    PageMetaComponent, PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent
  ],
  templateUrl: './semantic-elements.html',
  styleUrl: './semantic-elements.scss'
})
export class HtmlSemanticElements {

  quickRef: QuickRefItem[] = [
    { name: '<header>', type: 'keyword', desc: 'Introductory content or navigation — can appear in body or article/section' },
    { name: '<nav>', type: 'keyword', desc: 'Major navigation links — typically skip-to-main targets' },
    { name: '<main>', type: 'keyword', desc: 'Central content unique to the page — exactly one per document' },
    { name: '<article>', type: 'keyword', desc: 'Self-contained, independently distributable content' },
    { name: '<section>', type: 'keyword', desc: 'Thematic grouping with a heading — not a div replacement' },
    { name: '<aside>', type: 'keyword', desc: 'Tangentially related content: sidebars, pull quotes, ads' },
    { name: '<footer>', type: 'keyword', desc: 'Closing content — copyright, author info, related links' },
    { name: '<figure>', type: 'keyword', desc: 'Self-contained media with optional figcaption' },
    { name: '<time>', type: 'keyword', desc: 'Machine-readable date/time via datetime attribute' },
    { name: '<address>', type: 'keyword', desc: 'Contact information for nearest article or body ancestor' },
    { name: '<mark>', type: 'keyword', desc: 'Highlighted/relevant text — search result emphasis' },
    { name: '<details>/<summary>', type: 'keyword', desc: 'Native disclosure widget — no JS required' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why semantics matter',
      points: [
        'Before HTML5 developers used <code>&lt;div class="header"&gt;</code> — meaningful in code but invisible to browsers and assistive tech. Semantic elements communicate intent.',
        '<strong>Accessibility:</strong> screen readers announce "navigation landmark" for <code>&lt;nav&gt;</code> and "main content" for <code>&lt;main&gt;</code>, letting users jump between regions.',
        '<strong>SEO:</strong> search engines weight content in <code>&lt;article&gt;</code> and <code>&lt;main&gt;</code> more highly than generic <code>&lt;div&gt;</code>s.',
        '<strong>Maintainability:</strong> <code>&lt;section&gt;</code> vs <code>&lt;article&gt;</code> tells your team what the content relationship is without reading a word of CSS.',
      ]
    },
    {
      heading: 'Document-level landmarks',
      points: [
        '<code>&lt;header&gt;</code> — site logo, site nav, search bar. Can also appear inside <code>&lt;article&gt;</code> as a per-article header.',
        '<code>&lt;nav&gt;</code> — primary navigation. A page can have multiple nav elements; use <code>aria-label</code> to distinguish them.',
        '<code>&lt;main&gt;</code> — there must be exactly one per page. Skip-to-main links target this. Never nest <code>&lt;main&gt;</code>.',
        '<code>&lt;footer&gt;</code> — site-wide or per-article footer. Copyright notices, legal links, contact info.',
        'If you would add a skip link for it or it maps to an ARIA landmark role (banner, navigation, main, contentinfo), use the semantic element.',
      ]
    },
    {
      heading: 'article vs section vs div',
      points: [
        '<code>&lt;article&gt;</code> — content that makes sense standalone: a blog post, a news story, a comment, a product card. Ask: "Would I RSS-syndicate this?" If yes → article.',
        '<code>&lt;section&gt;</code> — a thematic chunk of a page that needs a heading. Chapters, tabbed panels, step groups. Only use it if you would put an <code>&lt;h2&gt;</code>–<code>&lt;h6&gt;</code> inside it.',
        '<code>&lt;div&gt;</code> — no semantic meaning. Pure styling/scripting hook. Correct when content has no inherent relationship.',
        'Wrong: <code>&lt;section class="products-list"&gt;</code> wrapping cards without a heading. Right: <code>&lt;section&gt;</code> with <code>&lt;h2&gt;Products&lt;/h2&gt;</code> inside, each card in its own <code>&lt;article&gt;</code>.',
      ]
    },
    {
      heading: 'Inline semantics: time, mark, abbr, cite',
      points: [
        '<code>&lt;time datetime="2025-03-15"&gt;15 March 2025&lt;/time&gt;</code> — the datetime attribute gives machines a parseable value. Always include datetime when the visible text is ambiguous.',
        '<code>&lt;mark&gt;</code> — highlights text relevant to the user\'s search query or context. Screen readers may announce the highlight.',
        '<code>&lt;abbr title="HyperText Markup Language"&gt;HTML&lt;/abbr&gt;</code> — exposes the full expansion to assistive tech and tooltips.',
        '<code>&lt;cite&gt;</code> — the title of a work (book, film, song). Not for academic citations — that\'s the content inside <code>&lt;blockquote cite="..."&gt;</code>.',
        '<code>&lt;address&gt;</code> — contact info for the nearest article or document. Not for postal addresses in general.',
      ]
    },
    {
      heading: 'figure, figcaption, and details',
      points: [
        '<code>&lt;figure&gt;</code> wraps self-contained media — an image, a code snippet, a chart, a quote. Its caption goes in <code>&lt;figcaption&gt;</code>.',
        'The figure can be moved in the document flow without breaking meaning. Caption position (before or after the media) is flexible.',
        '<code>&lt;details&gt;</code>/<code>&lt;summary&gt;</code> gives a free collapsible disclosure widget. The summary is always visible; clicking it expands the rest. No JS, no ARIA, browser-native.',
        'Use details/summary for FAQs, advanced options, and changelog entries where progressive disclosure reduces cognitive load.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Page skeleton',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Blog</title>
</head>
<body>

  <header>
    <a href="/">My Blog</a>
    <nav aria-label="Site navigation">
      <ul>
        <li><a href="/posts">Posts</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <header>
        <h1>Semantic HTML in Practice</h1>
        <p>By <address>Jane Smith</address> on
           <time datetime="2025-03-15">March 15, 2025</time></p>
      </header>

      <section>
        <h2>Why it matters</h2>
        <p>Screen readers announce landmarks automatically.</p>
        <figure>
          <img src="landmark-map.png" alt="Visual map of ARIA landmarks">
          <figcaption>Fig 1 — ARIA landmark regions on a typical page.</figcaption>
        </figure>
      </section>

      <footer>
        <p>Filed under <a href="/tag/html">HTML</a></p>
      </footer>
    </article>

    <aside>
      <h2>Related articles</h2>
      <ul>
        <li><a href="/posts/aria">ARIA roles</a></li>
      </ul>
    </aside>
  </main>

  <footer>
    <p>&copy; 2025 My Blog</p>
  </footer>

</body>
</html>`
    },
    {
      label: 'article vs section',
      language: 'html',
      code: `<!-- CORRECT: article for standalone content -->
<article>
  <h2>Product: Wireless Headphones</h2>
  <p>Premium noise-cancellation with 30-hour battery.</p>
  <footer>
    <a href="/products/headphones">View details</a>
  </footer>
</article>

<!-- CORRECT: section for grouped content with a heading -->
<section>
  <h2>Customer Reviews</h2>
  <article>
    <p>"Best headphones I've owned." — Sarah K.</p>
    <time datetime="2025-02-10">Feb 10, 2025</time>
  </article>
</section>

<!-- WRONG: section without a heading -->
<section class="wrapper">  <!-- use div here -->
  <p>Some generic content...</p>
</section>

<!-- details/summary — zero JS required -->
<details>
  <summary>Advanced configuration options</summary>
  <form>
    <label>Cache duration (seconds):
      <input type="number" value="3600">
    </label>
  </form>
</details>`
    },
    {
      label: 'time & inline',
      language: 'html',
      code: `<!-- time with machine-readable datetime -->
<p>Published: <time datetime="2025-03-15T09:00:00Z">15 March 2025</time></p>
<p>Event starts: <time datetime="2025-04-01T18:30">6:30 PM on April 1st</time></p>

<!-- mark for search result highlighting -->
<p>Results for "semantic":
  Use <mark>semantic</mark> HTML for better accessibility.
</p>

<!-- abbr for abbreviations -->
<p>The <abbr title="Document Object Model">DOM</abbr>
   is a tree representation of the page.</p>

<!-- cite for work titles -->
<p>As described in <cite>HTML Living Standard</cite>,
   every page needs exactly one main element.</p>

<!-- figure with image caption -->
<figure>
  <img src="chart.png" alt="Bar chart showing monthly revenue for Q1 2025.">
  <figcaption>Fig 1 — Q1 2025 revenue. March spike driven by product launch.</figcaption>
</figure>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using <section> as a generic wrapper',
      wrong: `<section class="container">
  <p>Just some content without a heading.</p>
</section>`,
      right: `<div class="container">
  <p>Just some content without a heading.</p>
</div>`,
      explanation: '<section> must have a heading (h2-h6) and represent a thematic grouping. Without a heading, use <div>.'
    },
    {
      title: 'Multiple <main> elements on one page',
      wrong: `<main>Homepage content</main>
<main>Secondary section</main>`,
      right: `<main>
  <section><h2>Homepage content</h2>...</section>
  <section><h2>Secondary section</h2>...</section>
</main>`,
      explanation: 'A page must have exactly one <main>. Use <section> or <article> for sub-regions within it.'
    },
    {
      title: 'Using <article> for layout containers',
      wrong: `<article class="sidebar">
  <ul><li><a href="/about">About</a></li></ul>
</article>`,
      right: `<aside>
  <nav aria-label="Secondary navigation">
    <ul><li><a href="/about">About</a></li></ul>
  </nav>
</aside>`,
      explanation: '<article> is for self-contained, distributable content. Navigation belongs in <aside> or <nav>.'
    },
    {
      title: 'Omitting datetime on <time>',
      wrong: `<time>March 15, 2025</time>`,
      right: `<time datetime="2025-03-15">March 15, 2025</time>`,
      explanation: 'Without datetime, machines cannot parse the date. Always include a machine-readable datetime attribute.'
    },
    {
      title: 'Multiple <nav> without aria-label',
      wrong: `<nav><!-- site nav --></nav>
<nav><!-- breadcrumb --></nav>`,
      right: `<nav aria-label="Primary navigation"><!-- site nav --></nav>
<nav aria-label="Breadcrumb"><!-- breadcrumb --></nav>`,
      explanation: 'Multiple nav elements on the same page need aria-label to distinguish them for screen reader users who browse by landmark.'
    },
  ];

  challenge: Challenge = {
    title: 'Rebuild a div-soup layout with semantics',
    language: 'html',
    description: `The following HTML uses only <div> elements. Rewrite it using appropriate semantic HTML5 elements:

\`\`\`html
<div id="header">
  <div class="logo">DevHub</div>
  <div class="nav"><a href="/courses">Courses</a></div>
</div>
<div id="main">
  <div class="post">
    <div class="post-header">
      <h1>Intro to HTML</h1>
      <div class="byline">By Alex on <span>March 1, 2025</span></div>
    </div>
    <div class="post-body">
      <div class="image-block">
        <img src="html.png" alt="HTML logo">
        <div class="caption">The HTML5 logo.</div>
      </div>
    </div>
  </div>
  <div class="sidebar">
    <h2>Related</h2>
    <a href="/css">CSS Basics</a>
  </div>
</div>
<div id="footer"><div class="copyright">&copy; 2025 DevHub</div></div>
\`\`\``,
    hints: [
      'The outer wrappers map to header, main, footer',
      'The post is a standalone piece — which element is that?',
      'The image + caption belongs in a specific pairing element',
      'The byline date should include a datetime attribute',
      'The sidebar with related links is tangential content'
    ],
    starterCode: `<!-- Rewrite using semantic elements -->

`,
    solution: `<header>
  <a href="/">DevHub</a>
  <nav aria-label="Primary navigation">
    <a href="/courses">Courses</a>
  </nav>
</header>

<main>
  <article>
    <header>
      <h1>Intro to HTML</h1>
      <p>By <address>Alex</address> on
         <time datetime="2025-03-01">March 1, 2025</time></p>
    </header>
    <figure>
      <img src="html.png" alt="HTML logo">
      <figcaption>The HTML5 logo.</figcaption>
    </figure>
  </article>

  <aside>
    <section>
      <h2>Related</h2>
      <a href="/css">CSS Basics</a>
    </section>
  </aside>
</main>

<footer>
  <p>&copy; 2025 DevHub</p>
</footer>`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'How many <main> elements can a valid HTML document have?',
      options: ['None — it is optional', 'Exactly one', 'Up to two', 'As many as needed'],
      answer: 1,
      explanation: 'A document must have exactly one visible <main> element. Multiple mains are invalid and confuse assistive technology.'
    },
    {
      q: 'Each blog post preview on an index page has a title, excerpt, and author. Which element wraps each preview?',
      options: ['<section>', '<div>', '<article>', '<aside>'],
      answer: 2,
      explanation: '<article> is correct — each blog preview is self-contained and independently distributable (e.g. via RSS).'
    },
    {
      q: 'What is required inside every <section> element?',
      options: ['An id attribute', 'A heading element (h2–h6)', 'An aria-label', 'A <p> element'],
      answer: 1,
      explanation: '<section> represents a thematic grouping that needs a heading. Without one, use <div> instead.'
    },
    {
      q: 'Which element represents content tangentially related to the main content?',
      options: ['<section>', '<aside>', '<nav>', '<footer>'],
      answer: 1,
      explanation: '<aside> is for content tangentially related to its surrounding content — sidebars, pull quotes, and related links.'
    },
    {
      q: 'What attribute makes <time> machine-readable?',
      options: ['value', 'data-date', 'datetime', 'format'],
      answer: 2,
      explanation: 'The datetime attribute holds a machine-parseable date/time string (ISO 8601 format). Without it, <time> provides no extra value over a <span>.'
    },
    {
      q: 'What is the difference between <figure> and <picture>?',
      options: ['They are identical', '<figure> is a semantic grouping for self-contained content with a caption; <picture> is for responsive image sources', '<picture> has captions; <figure> is for responsive images', '<figure> only wraps images; <picture> works with any media'],
      answer: 1,
      explanation: '<figure> wraps any self-contained content (image, code, chart, quote) with an optional <figcaption>. <picture> specifically provides multiple <source> elements for responsive images — different formats (WebP/AVIF vs JPEG) or different crops for different screen sizes. An image inside <picture> can also be inside a <figure>.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can <header> and <footer> appear inside <article>?',
      a: 'Yes. <header> and <footer> are not restricted to the body level — they scope to their nearest sectioning ancestor. An <article> commonly has its own <header> (title, author, date) and <footer> (tags, share links).'
    },
    {
      q: 'When should I use <nav> vs a plain <ul> of links?',
      a: '<nav> should wrap major navigation blocks — primary site nav, breadcrumbs, pagination. Not every list of links needs <nav>; footer link groups or related-post lists are often just <ul> inside <section> or <aside>. Too many <nav> elements clutter the landmark list in screen readers.'
    },
    {
      q: 'Does using semantic HTML actually improve SEO?',
      a: 'Yes, though the effect varies. Google and Bing use semantic structure to understand content hierarchy — <main>, <article>, h1-h6 all signal importance. The practical gains are clearer page structure for crawlers and richer rich-snippet eligibility.'
    },
    {
      q: 'Is <address> for any mailing address?',
      a: 'No. <address> is for contact information related to the nearest <article> or <body>. It is not a generic postal address element — for street addresses inside content (e.g. a store locator), use plain text or <p>.'
    },
    {
      q: 'What is the <details> and <summary> combination used for?',
      a: '<code>&lt;details&gt;</code> is a disclosure widget — its content is hidden by default and shown when the user clicks <code>&lt;summary&gt;</code>. It provides native accordion/FAQ functionality with no JavaScript required. The open attribute controls the expanded state. Style with CSS; the browser handles toggle behaviour and keyboard access. The open attribute can also be toggled via JS (element.open = true) for programmatic control.',
    },
    {
      q: 'What is the semantic meaning of <mark>?',
      a: '<code>&lt;mark&gt;</code> highlights text that is relevant to a search query or context — not for general emphasis. Example: in search results, wrapping the matched term in <mark> tells screen readers "this text is highlighted because it matched your query." Default styling is yellow background; override with CSS. Do not use it for decorative highlighting — use CSS ::selection or a <span> with a class for that.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Semantic HTML5 elements communicate document structure and meaning to browsers, assistive tech, and search engines.',
    mustKnow: [
      '<main> is unique per page; <header>, <footer>, <nav> can repeat per section',
      '<article> = standalone/syndicatable; <section> = thematic group + needs heading; <div> = no semantics',
      '<aside> holds tangentially related content (sidebars, pull quotes)',
      '<time datetime="ISO-8601"> makes dates machine-readable',
      '<figure>/<figcaption> pairs media with captions; <details>/<summary> gives a free disclosure widget',
      'Multiple <nav> elements need aria-label to distinguish them',
    ],
    interviewFocus: [
      'article vs section vs div — when to use each and why',
      'Why <main> must be unique and how skip-to-main links rely on it',
      'How semantic elements map to ARIA landmark roles and improve screen reader navigation',
      'The datetime attribute and why omitting it makes <time> no better than <span>',
    ]
  };
}