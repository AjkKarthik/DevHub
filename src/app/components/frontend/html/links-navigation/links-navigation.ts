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
  selector: 'app-html-links-navigation',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    PageMetaComponent, PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent
  ],
  templateUrl: './links-navigation.html',
  styleUrl: './links-navigation.scss'
})
export class HtmlLinksNavigation {

  quickRef: QuickRefItem[] = [
    { name: '<a href="url">', type: 'keyword', desc: 'Creates a hyperlink — the anchor element' },
    { name: 'Absolute URL', type: 'syntax', desc: 'Full URL with scheme: https://example.com/page' },
    { name: 'Root-relative URL', type: 'syntax', desc: 'Starts with /: resolves from site root regardless of current folder' },
    { name: 'Fragment #id', type: 'syntax', desc: 'Scrolls to element with that id on the same page' },
    { name: 'mailto: / tel:', type: 'syntax', desc: 'Opens mail client / phone dialler — add ?subject= for mailto' },
    { name: 'target="_blank"', type: 'keyword', desc: 'Opens in new tab — always pair with rel="noopener noreferrer"' },
    { name: 'rel="noopener noreferrer"', type: 'keyword', desc: 'Prevents tabnapping: breaks window.opener and strips Referer header' },
    { name: 'download', type: 'keyword', desc: 'Prompts file save instead of navigation; value sets suggested filename' },
    { name: '<nav aria-label>', type: 'keyword', desc: 'Navigation landmark — aria-label distinguishes multiple navs on one page' },
    { name: 'skip-to-content', type: 'keyword', desc: 'Hidden link to #main — keyboard users skip the repeated nav block' },
    { name: 'aria-current="page"', type: 'keyword', desc: 'Marks the active link in nav — screen readers announce "current page"' },
    { name: ':link :visited :hover :focus :active', type: 'syntax', desc: 'Five CSS link pseudo-classes — style in LVHFA order to avoid specificity bugs' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'href attribute — URL types',
      points: [
        '<strong>Absolute URL</strong>: <code>https://example.com/page</code> — includes full scheme and domain. Use for external links.',
        '<strong>Root-relative URL</strong>: starts with <code>/</code> — e.g. <code>/about</code>, <code>/blog/post</code>. Resolves from the site root; preferred for internal links since they work regardless of the current folder.',
        '<strong>Relative URL</strong>: no leading slash — e.g. <code>../images/logo.png</code>. Resolves from the current page URL. Fragile when pages move — prefer root-relative.',
        '<strong>Fragment</strong>: <code>#section-id</code> jumps to the element with that id. Can be combined: <code>/page#section</code>.',
        '<strong>Scheme links</strong>: <code>mailto:user@example.com?subject=Hello</code> opens the email client; <code>tel:+441234567890</code> dials on mobile.',
      ]
    },
    {
      heading: 'target="_blank" and security',
      points: [
        '<code>target="_blank"</code> opens the link in a new browsing context. The new tab gets a reference to the opener via <code>window.opener</code>.',
        'A malicious destination can call <code>window.opener.location = "phishing-site.com"</code> — redirecting your original page behind the user\'s back (tabnapping).',
        '<code>rel="noopener"</code> severs the <code>window.opener</code> reference. <code>rel="noreferrer"</code> also strips the Referer header (and implies noopener).',
        'Always use both: <code>target="_blank" rel="noopener noreferrer"</code>. Modern browsers set noopener implicitly, but older ones do not.',
        'Avoid opening links in new tabs by default — it breaks the back button and disorients users. Reserve it for contexts where leaving the current page would interrupt a workflow.',
      ]
    },
    {
      heading: 'Navigation landmarks and patterns',
      points: [
        '<code>&lt;nav&gt;</code> is an ARIA landmark. Screen reader users jump between landmarks, so major navigation blocks should use <code>&lt;nav&gt;</code>.',
        'Multiple <code>&lt;nav&gt;</code> elements on the same page need <code>aria-label</code>: <code>aria-label="Primary navigation"</code>, <code>aria-label="Breadcrumb"</code>, <code>aria-label="Pagination"</code>.',
        '<strong>Skip-to-content link</strong>: a visually hidden <code>&lt;a href="#main"&gt;Skip to main content&lt;/a&gt;</code> as the first element. On focus it becomes visible, letting keyboard users skip the repeated nav block.',
        '<strong>Breadcrumb</strong>: <code>&lt;nav aria-label="Breadcrumb"&gt;&lt;ol&gt;</code> — ordered list, last item gets <code>aria-current="page"</code>.',
        '<strong>Pagination</strong>: prev/next links use <code>rel="prev"</code> and <code>rel="next"</code>; the current page link gets <code>aria-current="page"</code>.',
      ]
    },
    {
      heading: 'Accessible link text',
      points: [
        'Link text must be meaningful out of context. Screen reader users can list all links on a page — "click here" and "read more" are useless in that list.',
        'Describe the destination or action: "Download the Q1 2025 report (PDF)", "View Angular tutorial — getting started".',
        '<code>aria-label</code> overrides the visible text for assistive tech: <code>&lt;a href="/delete/5" aria-label="Delete item: Blue Widget"&gt;Delete&lt;/a&gt;</code>.',
        '<code>aria-current="page"</code> on the active nav link tells screen readers the current page. Pair with a visual active style (not colour alone).',
        'External links should signal they open outside the site — a visible "(opens in new tab)" text or a labelled icon with <code>aria-label</code>.',
      ]
    },
    {
      heading: 'CSS link states and the download attribute',
      points: [
        'Style link states in <strong>LVHFA order</strong>: <code>:link</code>, <code>:visited</code>, <code>:hover</code>, <code>:focus</code>, <code>:active</code>. Equal specificity means later rules win — wrong order causes states to not appear.',
        '<code>:focus</code> is critical for keyboard users. Never do <code>a:focus { outline: none }</code> without providing a visible replacement focus indicator.',
        '<code>:visited</code> is restricted for privacy — only color and a few other properties are allowed; you cannot read computed styles on visited links from JS.',
        '<code>&lt;a href="file.pdf" download&gt;</code> prompts a save dialog instead of navigation. Works same-origin only unless the server sends <code>Content-Disposition: attachment</code>.',
        'The <code>download</code> value sets the suggested filename: <code>download="Q1-Report.pdf"</code>.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Link types',
      language: 'html',
      code: `<!-- Absolute URL — external site -->
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML">MDN HTML Docs</a>

<!-- Root-relative — internal links (preferred) -->
<a href="/about">About Us</a>
<a href="/html/semantic-elements">Semantic Elements</a>

<!-- Fragment — same page anchor -->
<a href="#installation">Jump to Installation</a>
<h2 id="installation">Installation</h2>

<!-- mailto with subject and body -->
<a href="mailto:hello@devhub.io?subject=Question&body=Hi%20team">Email us</a>

<!-- tel for click-to-call -->
<a href="tel:+442071234567">+44 207 123 4567</a>

<!-- Download with suggested filename -->
<a href="/reports/q1-2025.pdf" download="Q1-2025-Revenue-Report.pdf">
  Download Q1 Report (PDF)
</a>

<!-- New tab with security attributes -->
<a href="https://github.com/AjkKarthik/DevHub"
   target="_blank"
   rel="noopener noreferrer">
  View source on GitHub
  <span class="sr-only">(opens in new tab)</span>
</a>`
    },
    {
      label: 'Navigation patterns',
      language: 'html',
      code: `<!-- Skip-to-content: first element in the page -->
<a href="#main" class="skip-link">Skip to main content</a>

<header>
  <!-- Primary nav landmark -->
  <nav aria-label="Primary navigation">
    <ul>
      <li><a href="/" aria-current="page">Home</a></li>
      <li><a href="/courses">Courses</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<main id="main">
  <!-- Breadcrumb nav -->
  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/courses">Courses</a></li>
      <li><a href="/courses/html" aria-current="page">HTML</a></li>
    </ol>
  </nav>

  <!-- Pagination nav -->
  <nav aria-label="Pagination">
    <a href="?page=1" rel="prev">&larr; Previous</a>
    <a href="?page=2" aria-current="page">2</a>
    <a href="?page=3" rel="next">Next &rarr;</a>
  </nav>
</main>`
    },
    {
      label: 'Accessible link text',
      language: 'html',
      code: `<!-- WRONG: vague link text -->
<p>Learn more — <a href="/semantic">click here</a>.</p>
<a href="/post-1">Read more</a>
<a href="/post-2">Read more</a>

<!-- RIGHT: descriptive link text -->
<p><a href="/semantic">Learn about semantic HTML elements</a>.</p>
<a href="/post-1">How to optimise Core Web Vitals</a>
<a href="/post-2">A beginner guide to CSS Grid</a>

<!-- aria-label for repeated short text -->
<article>
  <h2 id="art-1">How to optimise Core Web Vitals</h2>
  <p>A practical guide to LCP, CLS, and INP...</p>
  <a href="/post-1" aria-labelledby="art-1">Read more</a>
</article>

<!-- External link with screen reader hint -->
<a href="https://w3.org"
   target="_blank"
   rel="noopener noreferrer"
   aria-label="W3C website (opens in a new tab)">
  W3C
</a>

/* Link states — must be in LVHFA order */
a:link    { color: #3178c6; }
a:visited { color: #7c3aed; }
a:hover   { text-decoration: underline; }
a:focus   { outline: 3px solid #e34c26; outline-offset: 2px; }
a:active  { color: #dd0031; }`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'target="_blank" without rel="noopener noreferrer"',
      wrong: `<a href="https://example.com" target="_blank">Visit site</a>`,
      right: `<a href="https://example.com"
   target="_blank"
   rel="noopener noreferrer">Visit site</a>`,
      explanation: 'Without noopener, the new tab can call window.opener.location to redirect your page (tabnapping). noreferrer hides your URL from the destination server and implies noopener.'
    },
    {
      title: 'Vague link text ("click here", "read more")',
      wrong: `<p>For more info <a href="/docs">click here</a>.</p>
<a href="/post">Read more</a>`,
      right: `<p><a href="/docs">View the full HTML documentation</a>.</p>
<a href="/post">Read more about semantic HTML best practices</a>`,
      explanation: 'Screen readers list all links on a page. "Click here" and "read more" are meaningless out of context. Describe the destination or use aria-label/aria-labelledby.'
    },
    {
      title: 'Removing :focus outline with no replacement',
      wrong: `a:focus { outline: none; }`,
      right: `a:focus {
  outline: 3px solid #e34c26;
  outline-offset: 2px;
}`,
      explanation: 'Keyboard and switch-control users rely on the focus indicator to track their position. Removing it with no replacement makes the site non-navigable for them — a WCAG Level A failure.'
    },
    {
      title: 'Multiple <nav> elements without aria-label',
      wrong: `<nav><!-- primary nav --></nav>
<nav><!-- breadcrumb --></nav>
<nav><!-- pagination --></nav>`,
      right: `<nav aria-label="Primary navigation"><!-- --></nav>
<nav aria-label="Breadcrumb"><!-- --></nav>
<nav aria-label="Pagination"><!-- --></nav>`,
      explanation: 'When multiple nav landmarks exist, screen reader users see duplicates labelled just "navigation" with no way to distinguish them. aria-label gives each a unique identity.'
    },
    {
      title: 'Using <a> without href for click actions',
      wrong: `<a onclick="openModal()">Open settings</a>
<a href="javascript:void(0)">Click me</a>`,
      right: `<button type="button" onclick="openModal()">Open settings</button>`,
      explanation: 'An <a> without a valid href is not focusable by keyboard and is not announced as interactive by screen readers. Use <button> for actions that do not navigate to a URL.'
    },
  ];

  challenge: Challenge = {
    title: 'Build an accessible navigation bar with skip link',
    language: 'html',
    description: `Build the top navigation for a documentation site. Requirements:

1. Skip-to-content link pointing to #main (visually hidden, visible on :focus)
2. Primary <nav aria-label="Primary navigation"> with:
   - Home (href="/") — marked as current page with aria-current="page"
   - HTML (href="/html"), CSS (href="/css"), JavaScript (href="/js")
3. External GitHub link — opens in new tab with rel="noopener noreferrer" and a .sr-only "(opens in new tab)" span
4. Breadcrumb <nav aria-label="Breadcrumb"> as an <ol>: Home > HTML > Links (last has aria-current="page")
5. Include CSS for the skip link show-on-focus effect`,
    hints: [
      'Skip link: position absolute, transform translateY(-100%), on :focus translateY(0)',
      'aria-current="page" goes on the <a> element, not the <li>',
      'The "(opens in new tab)" text needs class="sr-only" to hide it visually',
      'Breadcrumb uses <ol> — ordered list because the hierarchy order matters',
      'The last breadcrumb item is the current page'
    ],
    starterCode: `<style>
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  .skip-link { /* add show-on-focus styles */ }
</style>

<!-- skip link -->

<header>
  <!-- primary nav -->
</header>

<main id="main">
  <!-- breadcrumb -->
  <h1>Links &amp; Navigation</h1>
</main>`,
    solution: `<style>
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  .skip-link { position:absolute; top:0; left:0; padding:0.5rem 1rem; background:#e34c26; color:#fff; transform:translateY(-100%); transition:transform 0.2s; z-index:100; }
  .skip-link:focus { transform:translateY(0); }
</style>

<a href="#main" class="skip-link">Skip to main content</a>

<header>
  <nav aria-label="Primary navigation">
    <ul>
      <li><a href="/" aria-current="page">Home</a></li>
      <li><a href="/html">HTML</a></li>
      <li><a href="/css">CSS</a></li>
      <li><a href="/js">JavaScript</a></li>
      <li>
        <a href="https://github.com/AjkKarthik/DevHub"
           target="_blank" rel="noopener noreferrer">
          GitHub <span class="sr-only">(opens in new tab)</span>
        </a>
      </li>
    </ul>
  </nav>
</header>

<main id="main">
  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/html">HTML</a></li>
      <li><a href="/html/links-navigation" aria-current="page">Links &amp; Navigation</a></li>
    </ol>
  </nav>
  <h1>Links &amp; Navigation</h1>
</main>`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What security vulnerability does target="_blank" introduce?',
      options: [
        'It loads the page twice consuming double bandwidth',
        'The new tab can access window.opener and redirect the original page',
        'It disables the browser back button',
        'It prevents HTTPS connections'
      ],
      answer: 1,
      explanation: 'Without rel="noopener", the new tab gets window.opener and can call window.opener.location to silently redirect your page to a phishing site — a tabnapping attack.'
    },
    {
      q: 'Which CSS link-state order is correct?',
      options: [
        ':hover, :visited, :link, :focus, :active',
        ':link, :visited, :hover, :focus, :active',
        ':active, :focus, :hover, :visited, :link',
        ':focus, :hover, :link, :active, :visited'
      ],
      answer: 1,
      explanation: 'LVHFA order (Link, Visited, Hover, Focus, Active) is required because all pseudo-classes have equal specificity. Later rules override earlier ones — wrong order prevents states from appearing.'
    },
    {
      q: 'What is a skip-to-content link and who benefits most from it?',
      options: [
        'A link that loads only part of the page for slower connections',
        'A hidden link that jumps past navigation to main content — primarily for keyboard and screen reader users',
        'A deep-link to a specific section used in email campaigns',
        'A shortcut that caches the page for faster revisiting'
      ],
      answer: 1,
      explanation: 'The skip link is a visually hidden <a href="#main"> at the top of the page. Keyboard users press Tab once and can skip the repeated nav to reach content immediately. It is a WCAG 2.1 Level A requirement.'
    },
    {
      q: 'What does aria-current="page" communicate?',
      options: [
        'The link is disabled',
        'This link points to the currently loaded page',
        'The link opens in the current tab',
        'The page was recently updated'
      ],
      answer: 1,
      explanation: 'aria-current="page" tells assistive technology that this link represents the currently active page — announced as "current page" by screen readers navigating the nav landmark.'
    },
    {
      q: 'When should <button> be used instead of <a>?',
      options: [
        'When you want to style it to look like a button',
        'When the element navigates to a URL',
        'When the action does not navigate — e.g. opening a modal or toggling content',
        'When the link text is more than five words'
      ],
      answer: 2,
      explanation: '<a> is for navigation (href required). <button> is for actions. An <a> without a valid href is not keyboard-focusable, not announced as interactive, and not semantically correct for click-only actions.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use <a> or <button> for a "Back to top" link?',
      a: '"Back to top" navigates to the top of the page via href="#top" — <a> is semantically correct. If the scroll is JS-driven with no href fallback, use <button>. Rule of thumb: if there is a valid URL destination (even a fragment), use <a>.'
    },
    {
      q: 'How do I pre-fill subject and body in a mailto link?',
      a: 'Use URL query parameters: href="mailto:hello@example.com?subject=Hello&body=Message%20here". Spaces and special characters must be percent-encoded. The email client pre-fills the fields but the user can edit them.'
    },
    {
      q: 'Why does the download attribute not work on cross-origin links?',
      a: 'Browsers ignore the download attribute for cross-origin links — the file opens in a new tab instead of downloading. To force download from another origin, the server must send a Content-Disposition: attachment header. For same-origin files, download works and the attribute value sets the suggested filename.'
    },
    {
      q: 'Why are :visited styles so limited in CSS?',
      a: 'History sniffing: a malicious page could render visited links in a detectable colour and use getComputedStyle() to discover which sites a user has visited. Browsers restrict :visited to only a safe subset of visual-only properties (color, background-color, outline) and block JS from reading their computed values.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'HTML links connect documents via <a href>; navigation landmarks, accessible text, and focus management make them usable for everyone.',
    mustKnow: [
      'href types: absolute, root-relative (/), relative, fragment (#), mailto:, tel:',
      'target="_blank" requires rel="noopener noreferrer" — prevents tabnapping',
      'Link text must be descriptive out of context — not "click here" or "read more"',
      'Multiple <nav> elements need aria-label to distinguish them in landmark lists',
      'Skip-to-content link is one of the highest-impact a11y features: <a href="#main"> hidden, shown on focus',
      'CSS LVHFA order: :link :visited :hover :focus :active — never remove :focus without a visible replacement',
    ],
    interviewFocus: [
      'tabnapping — why target="_blank" needs rel="noopener noreferrer"',
      'Descriptive link text — why it matters for screen reader link-list browsing',
      'Skip-to-content — what it does and the CSS show-on-focus pattern',
      'aria-current="page" — purpose and where it goes',
    ]
  };
}
