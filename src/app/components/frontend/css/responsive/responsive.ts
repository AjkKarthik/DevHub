import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: '@media (min-width)',      type: 'syntax',   desc: 'Mobile-first breakpoint — add styles as screen grows.' },
  { name: '@container',              type: 'syntax',   desc: 'Container query — responds to parent element width, not viewport.' },
  { name: 'container-type: inline-size', type: 'keyword', desc: 'Makes element a container query context for its children.' },
  { name: 'clamp(min, val, max)',    type: 'function', desc: 'Fluid value — eliminates most width/font breakpoints.' },
  { name: 'min() / max()',           type: 'function', desc: 'min(100%, 600px) = at most 600px. max(200px, 50%) = at least 200px.' },
  { name: 'aspect-ratio',           type: 'keyword',  desc: 'Maintains proportional sizing: aspect-ratio: 16/9 on images and embeds.' },
  { name: 'srcset / sizes',         type: 'keyword',  desc: 'Responsive images — browser picks best resolution for the device.' },
  { name: 'prefers-color-scheme',   type: 'syntax',   desc: 'Media feature for system dark/light mode preference.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Mobile-First Approach',
    points: [
      'Mobile-first: write base styles for the smallest screen, then add complexity with min-width queries.',
      'Desktop-first (max-width) means overriding styles downward — more repetition and specificity issues.',
      'Common breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px — but use content-based breakpoints when possible.',
      'The viewport meta tag is essential: <meta name="viewport" content="width=device-width, initial-scale=1">.',
      'Without viewport meta, mobile browsers render at 980px and zoom out — layouts break completely.',
    ],
  },
  {
    heading: 'Container Queries',
    points: [
      '@container queries respond to a parent element\'s size, not the viewport — enabling truly reusable components.',
      'Add container-type: inline-size on the parent to create a container context.',
      '@container (min-width: 400px) on child elements then responds to that parent\'s width.',
      'Container query units: cqw, cqh, cqi, cqb — percentage of the container dimensions.',
      'A sidebar card can switch from 1-column to 2-column layout based on its own container, not the viewport.',
    ],
  },
  {
    heading: 'Fluid Layouts Without Media Queries',
    points: [
      'repeat(auto-fit, minmax(250px, 1fr)) creates a responsive card grid with zero breakpoints.',
      'clamp(1rem, 5vw, 3rem) for spacing/sizing adapts fluidly across all screen sizes.',
      'min(100%, 600px) = "full width but never more than 600px" — replaces max-width + width: 100%.',
      'Intrinsic web design: combine Grid, Flexbox, and clamp() to build layouts that don\'t need breakpoints.',
      'Use ch, vw, svh (small viewport height), dvh (dynamic viewport height) units for fluid sizing.',
    ],
  },
  {
    heading: 'Responsive Images and Media',
    points: [
      'img { max-width: 100%; height: auto } prevents images from overflowing their container.',
      'srcset provides multiple resolutions; the browser picks the best for the device pixel ratio.',
      'sizes tells the browser how wide the image will be rendered: sizes="(min-width: 768px) 50vw, 100vw".',
      '<picture> with <source media="..."> serves different image crops for different layouts (art direction).',
      'aspect-ratio: 16/9 on a container prevents Cumulative Layout Shift while images load.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Mobile-First Media Queries',
    language: 'css',
    code: `/* Base styles — mobile first */
.nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hero {
  padding: 2rem 1rem;
  font-size: 1.5rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .nav {
    flex-direction: row;
    justify-content: space-between;
  }

  .hero {
    padding: 4rem 2rem;
    font-size: 2.5rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .hero { font-size: 3.5rem; }
}`,
  },
  {
    label: 'Container Queries',
    language: 'css',
    code: `/* Make the card wrapper a query container */
.card-wrapper {
  container-type: inline-size;
  container-name: card;  /* optional name for nested queries */
}

/* Default: stacked layout */
.card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.card img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 8px;
}

/* When container >= 400px: side-by-side layout */
@container (min-width: 400px) {
  .card {
    grid-template-columns: 140px 1fr;
    align-items: center;
  }

  .card img {
    aspect-ratio: 1;
  }
}

/* Container query units */
@container (min-width: 600px) {
  .card-title { font-size: clamp(1rem, 3cqw, 1.5rem); }
}`,
  },
  {
    label: 'Fluid Layout Patterns',
    language: 'css',
    code: `/* Fluid card grid — no media queries */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}

/* Fluid spacing scale */
.section {
  padding: clamp(2rem, 8vw, 6rem) clamp(1rem, 5vw, 3rem);
}

/* min() replaces max-width + width: 100% */
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}

/* Fluid sidebar layout */
.sidebar-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.sidebar {
  flex: 1 1 300px;    /* min 300px; grows to fill */
  min-width: 0;
}

.main-content {
  flex: 3 1 400px;    /* 3x wider than sidebar when both fit */
  min-width: 0;
}`,
  },
  {
    label: 'User Preference Queries',
    language: 'css',
    code: `/* System dark mode preference */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --text: #f1f5f9;
  }
}

/* Reduced motion — always respect */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* High contrast mode */
@media (forced-colors: active) {
  .btn { border: 2px solid ButtonText; }
}

/* Print styles */
@media print {
  .nav, .sidebar, .ads { display: none; }
  body { font-size: 12pt; color: #000; }
  a[href]::after { content: " (" attr(href) ")"; }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Desktop-first media queries (max-width)',
    wrong: `/* Overriding styles downward creates complexity */
.nav { display: flex; flex-direction: row; }
@media (max-width: 768px) {
  .nav { flex-direction: column; }
}`,
    right: `/* Mobile-first: add complexity upward */
.nav { display: flex; flex-direction: column; }
@media (min-width: 768px) {
  .nav { flex-direction: row; }
}`,
    explanation: 'Mobile-first means base styles are for the smallest screen. You add features as the screen grows — fewer overrides, less specificity fighting.',
  },
  {
    title: 'Forgetting the viewport meta tag',
    wrong: `<!-- No viewport meta — mobile browsers render at 980px width -->
<head><title>My Site</title></head>`,
    right: `<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>`,
    explanation: 'Without the viewport meta tag, mobile browsers use a virtual 980px layout viewport and zoom out to fit. Your media queries and responsive layouts will not work as expected.',
  },
  {
    title: 'Using px breakpoints instead of em/rem',
    wrong: `@media (min-width: 768px) { }  /* breaks when user zooms */`,
    right: `@media (min-width: 48em) { }   /* 768/16 = 48em — respects user font size */`,
    explanation: 'em-based media queries respect the user\'s browser font size and zoom settings. px-based breakpoints don\'t scale when users increase their default font size.',
  },
  {
    title: 'Not handling images responsively',
    wrong: `img { width: 600px; }  /* overflows on mobile */`,
    right: `img { max-width: 100%; height: auto; display: block; }`,
    explanation: 'max-width: 100% prevents images from overflowing their container. height: auto maintains the aspect ratio. display: block removes the inline bottom gap.',
  },
  {
    title: 'Ignoring prefers-reduced-motion',
    wrong: `.hero { animation: fadeIn 2s ease infinite; }  /* plays regardless */`,
    right: `.hero { animation: fadeIn 2s ease; }
@media (prefers-reduced-motion: reduce) {
  .hero { animation: none; }
}`,
    explanation: 'Users who have enabled reduced motion in their OS settings (vestibular disorders, epilepsy) rely on prefers-reduced-motion. Always provide a no-motion fallback for significant animations.',
  },
];

const challenge: Challenge = {
  title: 'Responsive Dashboard Layout',
  language: 'html',
  description: 'Build a responsive dashboard using mobile-first media queries and container queries. Requirements: (1) Mobile: single-column stacked layout. (2) Tablet (768px+): 2-column grid. (3) Desktop (1024px+): sidebar + main content area. (4) Each card should use container queries to switch between compact and expanded display when its container is wide enough.',
  hints: [
    'Start with mobile styles, add @media (min-width: 768px) and (min-width: 1024px) progressively.',
    'Use CSS Grid for the overall layout — grid-template-areas works well for named regions.',
    'Add container-type: inline-size on each card wrapper for container queries.',
    'Use @container (min-width: 350px) to switch card layout from stacked to horizontal.',
  ],
  starterCode: `<div class="dashboard">
  <header class="dash-header">Dashboard</header>
  <nav class="dash-nav">Navigation</nav>
  <main class="dash-main">
    <div class="card-grid">
      <div class="card-wrap"><div class="card"><img src="img.jpg" /><div class="card-body"><h3>Title</h3><p>Description text goes here.</p></div></div></div>
      <div class="card-wrap"><div class="card"><img src="img.jpg" /><div class="card-body"><h3>Title</h3><p>Description text goes here.</p></div></div></div>
      <div class="card-wrap"><div class="card"><img src="img.jpg" /><div class="card-body"><h3>Title</h3><p>Description text goes here.</p></div></div></div>
    </div>
  </main>
</div>`,
  solution: `/* Mobile base */
.dashboard {
  display: grid;
  grid-template-areas:
    "header"
    "nav"
    "main";
  min-height: 100vh;
}

.dash-header { grid-area: header; padding: 1rem; background: #1e293b; color: #fff; }
.dash-nav    { grid-area: nav;    padding: 1rem; background: #f8fafc; }
.dash-main   { grid-area: main;   padding: 1rem; }

/* Tablet */
@media (min-width: 768px) {
  .dashboard {
    grid-template-areas:
      "header header"
      "nav    main";
    grid-template-columns: 200px 1fr;
    grid-template-rows: auto 1fr;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .dashboard { grid-template-columns: 240px 1fr; }
}

/* Container queries on cards */
.card-wrap {
  container-type: inline-size;
}

.card {
  display: grid;
  grid-template-columns: 1fr;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.card img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.card-body { padding: 1rem; }

@container (min-width: 360px) {
  .card {
    grid-template-columns: 120px 1fr;
    align-items: center;
  }
  .card img { aspect-ratio: 1; height: 100%; }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does mobile-first mean in CSS?',
    options: [
      'Only building mobile apps, not desktop',
      'Writing base styles for small screens and adding complexity with min-width queries',
      'Using max-width queries to override desktop styles on mobile',
      'Loading separate CSS files for mobile and desktop',
    ],
    answer: 1,
    explanation: 'Mobile-first means your default styles target the smallest screen, and you progressively enhance with min-width media queries for larger screens. This avoids overriding styles downward.',
  },
  {
    q: 'How does a container query differ from a media query?',
    options: [
      'Container queries respond to element width; media queries respond to viewport width',
      'Container queries use pixels; media queries use em units',
      'Container queries are only for images; media queries are for all elements',
      'They are identical — just different syntax',
    ],
    answer: 0,
    explanation: 'Media queries respond to the viewport (browser window) dimensions. Container queries respond to the size of a containing element, enabling truly portable, context-aware components.',
  },
  {
    q: 'What does min(100%, 600px) do?',
    options: [
      'Sets minimum width to 100% or 600px whichever is larger',
      'Sets width to whichever is smaller: 100% of the parent or 600px',
      'Sets maximum width to 600px only on small screens',
      'Creates a fluid value between 100% and 600px',
    ],
    answer: 1,
    explanation: 'min() returns the smallest of its arguments. min(100%, 600px) means: be 100% wide (fills parent), but never wider than 600px. It replaces the common max-width + width: 100% pattern.',
  },
  {
    q: 'What is required on a parent element to use @container queries on its children?',
    options: [
      'display: container',
      'container-type: inline-size (or size)',
      'overflow: hidden',
      'position: relative',
    ],
    answer: 1,
    explanation: 'container-type: inline-size establishes a containment context for width-based container queries. The children can then use @container (min-width: ...) to respond to that parent\'s size.',
  },
  {
    q: 'Why should media query breakpoints use em units instead of px?',
    options: [
      'em values are smaller numbers, easier to remember',
      'em-based breakpoints respect user zoom and font size preferences',
      'px breakpoints don\'t work in modern browsers',
      'em units load faster than px values',
    ],
    answer: 1,
    explanation: 'When users increase their browser\'s default font size, em-based media queries scale with it — breakpoints trigger at the right visual point. px breakpoints are absolute and don\'t respond to zoom.',
  },
  {
    q: 'Which CSS feature creates a responsive grid with no media queries?',
    options: [
      'flexbox with flex-grow: 1',
      'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))',
      '@container (min-width: 400px)',
      'width: clamp(200px, 50%, 400px)',
    ],
    answer: 1,
    explanation: 'repeat(auto-fit, minmax(250px, 1fr)) creates as many columns as fit at the minimum size, automatically adapting to the container width with zero media queries.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use container queries vs media queries?',
    a: 'Use media queries for layout-level changes that depend on the viewport — navigation collapse, sidebar showing/hiding, full page layout changes. Use container queries for component-level changes that depend on the component\'s context — a card that should look different when narrow vs wide, regardless of where it\'s placed on the page.',
  },
  {
    q: 'What is the difference between vw, svh, and dvh?',
    a: 'vw is viewport width. vh is viewport height — but on mobile, the browser chrome (address bar) affects the available height. svh (small viewport height) = height with browser chrome fully shown. dvh (dynamic viewport height) = actual current available height, updating as chrome shows/hides. Use dvh for full-screen mobile layouts to avoid content hidden behind the address bar.',
  },
  {
    q: 'Do I still need media queries with modern CSS?',
    a: 'Fewer, but not zero. Grid with auto-fit/minmax, clamp(), and container queries eliminate many breakpoints. But media queries are still needed for: navigation patterns (hamburger menu), layout region visibility (hiding sidebar on mobile), print styles, and user preference queries (prefers-reduced-motion, prefers-color-scheme).',
  },
  {
    q: 'How do I handle responsive images without JavaScript?',
    a: 'Use srcset and sizes attributes: srcset="img-400.jpg 400w, img-800.jpg 800w, img-1200.jpg 1200w" sizes="(min-width: 768px) 50vw, 100vw". The browser picks the best file for the device\'s resolution and display size. For art direction (different crops), use <picture> with <source media="...">.  Always add max-width: 100%; height: auto in CSS.',
  },
  {
    q: 'What is the ideal number of breakpoints?',
    a: 'As few as possible — ideally 2–3 major breakpoints. The best approach is content-driven breakpoints: add a breakpoint where the content actually breaks, not at arbitrary device sizes. With auto-fit grids, clamp(), and container queries, many layouts require zero breakpoints. Start with mobile base and add breakpoints only when layout needs it.',
  },
  {
    q: 'How does prefers-reduced-motion affect CSS animations?',
    a: 'Some users (vestibular disorders, epilepsy, motion sensitivity) set "reduce motion" in their OS settings. prefers-reduced-motion: reduce media query fires for these users. You must disable or simplify animations: either remove them entirely, or switch to instant opacity fades instead of movement. The WCAG 2.1 Success Criterion 2.3.3 requires this for AAA conformance.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Responsive CSS = mobile-first media queries + container queries for components + fluid layouts with clamp() and auto-fit grids.',
  mustKnow: [
    'Mobile-first: min-width queries add complexity upward from smallest screen.',
    'Container queries (container-type: inline-size + @container) respond to parent width, not viewport.',
    'repeat(auto-fit, minmax(250px, 1fr)) = responsive grid with zero breakpoints.',
    'min(100%, 600px) replaces max-width: 600px; width: 100%.',
    'Always add the viewport meta tag — without it mobile layouts break completely.',
    'prefers-reduced-motion must be respected — disable significant animations for affected users.',
  ],
  interviewFocus: [
    'What is the difference between media queries and container queries?',
    'Explain mobile-first CSS and why it is preferred.',
    'How do you create a responsive grid without media queries?',
    'What CSS units are used for fluid layouts and when would you use each?',
  ],
};

@Component({
  selector: 'app-css-responsive',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './responsive.html',
  styleUrl: './responsive.scss',
})
export class CssResponsive {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
