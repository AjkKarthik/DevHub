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
  { name: 'container-type: inline-size', type: 'keyword', desc: 'Makes element a query container for width-based @container queries (most common).' },
  { name: 'container-type: size',        type: 'keyword', desc: 'Container for both width and height queries — use inline-size unless you need height.' },
  { name: 'container-name',             type: 'keyword', desc: 'Names a container for targeted queries: @container sidebar (min-width: 300px).' },
  { name: '@container (min-width)',      type: 'syntax',  desc: 'Fires when the named/nearest container is at least that wide.' },
  { name: 'cqw',                        type: 'keyword', desc: '1cqw = 1% of the container\'s inline size. Like vw but relative to the container.' },
  { name: 'cqh',                        type: 'keyword', desc: '1cqh = 1% of the container\'s block size. Requires container-type: size.' },
  { name: 'cqi / cqb',                  type: 'keyword', desc: 'Inline and block container units — logical equivalents of cqw/cqh.' },
  { name: '@container style()',          type: 'syntax',  desc: 'Style queries: fire when a custom property on the container has a specific value.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Container Queries vs Media Queries',
    points: [
      'Media queries respond to the viewport (browser window) — they are global and cannot target individual components.',
      'Container queries respond to the nearest containing element\'s size — the component adapts based on where it is placed.',
      'A sidebar card can be 1-column when the sidebar is narrow and 2-column when the sidebar is wide — with zero media queries.',
      'This unlocks truly portable components: the same card HTML/CSS works in a sidebar, a main grid, or a full-width hero.',
      'Container queries ship in all modern browsers since 2023 — Chrome 105+, Firefox 110+, Safari 16+.',
    ],
  },
  {
    heading: 'Setting Up Containers',
    points: [
      'Step 1: Add container-type: inline-size (or size) to the parent element. This establishes the query context.',
      'Step 2: Optionally name the container with container-name: sidebar for targeted queries with @container sidebar (...).',
      'Step 3: Write @container (min-width: 400px) { ... } on child elements to apply styles when the container is wide enough.',
      'container is a shorthand: container: sidebar / inline-size sets both name and type in one declaration.',
      'A container cannot query itself — only its descendants can use @container rules against it.',
    ],
  },
  {
    heading: 'Container Query Units and Style Queries',
    points: [
      'cqw: 1% of container inline size. 50cqw = half the container width. Like vw but scoped to the nearest container.',
      'cqh: 1% of container block size. Only works when the container has container-type: size (not just inline-size).',
      'Use container units for fluid typography inside components: font-size: clamp(1rem, 3cqw, 1.5rem).',
      'Style queries: @container style(--variant: compact) { ... } — fires when the container has a specific custom property value.',
      'Style queries enable theme-aware components: set --variant on a wrapper and child components respond without JS.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Basic Container Query',
    language: 'css',
    code: `/* Step 1: Make the wrapper a container */
.card-wrapper {
  container-type: inline-size;
}

/* Step 2: Default layout (narrow) */
.card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
}

.card-img {
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 8px;
}

/* Step 3: When the container is 400px or wider */
@container (min-width: 400px) {
  .card {
    grid-template-columns: 160px 1fr;
    align-items: center;
  }

  .card-img {
    aspect-ratio: 1;
    height: 100%;
  }
}`,
  },
  {
    label: 'Named Containers',
    language: 'css',
    code: `/* Named containers let you target a specific ancestor */
.sidebar {
  container: sidebar / inline-size;  /* name / type shorthand */
}

.main-content {
  container: main / inline-size;
}

/* This only fires when inside .sidebar */
@container sidebar (min-width: 240px) {
  .widget { flex-direction: row; }
}

/* This only fires when inside .main-content */
@container main (min-width: 600px) {
  .widget { grid-template-columns: repeat(3, 1fr); }
}

/* Without name: targets nearest container ancestor */
@container (max-width: 300px) {
  .card-title { font-size: 0.9rem; }
}`,
  },
  {
    label: 'Container Query Units',
    language: 'css',
    code: `/* cqw = 1% of container inline width */
.card-wrapper {
  container-type: inline-size;
}

/* Fluid font size relative to container */
.card-title {
  font-size: clamp(1rem, 4cqw, 1.75rem);
}

/* Fluid padding */
.card-body {
  padding: clamp(0.75rem, 3cqw, 1.5rem);
}

/* Fluid icon size */
.card-icon {
  width: clamp(32px, 8cqw, 64px);
  height: clamp(32px, 8cqw, 64px);
}

/* cqh requires container-type: size (not just inline-size) */
.hero-wrapper {
  container-type: size;
  height: 400px;
}

@container (min-height: 300px) {
  .hero-subtitle { display: block; }
}`,
  },
  {
    label: 'Style Queries',
    language: 'css',
    code: `/* Style queries — respond to custom property values on the container */

/* Parent sets the variant */
.card-wrapper {
  container-type: inline-size;
  --variant: default;
}

.card-wrapper.compact {
  --variant: compact;
}

/* Child responds to the variant */
.card { padding: 1.5rem; }

@container style(--variant: compact) {
  .card {
    padding: 0.75rem;
    font-size: 0.875rem;
  }

  .card-img { display: none; }

  .card-title { font-size: 1rem; }
}

/* Combine with size queries */
@container (min-width: 400px) and style(--variant: default) {
  .card { grid-template-columns: 160px 1fr; }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Querying without declaring a container',
    wrong: `/* No container-type on parent — @container never fires */
.card { grid-template-columns: 1fr; }
@container (min-width: 400px) { .card { grid-template-columns: 1fr 1fr; } }`,
    right: `.card-wrapper { container-type: inline-size; }
.card { grid-template-columns: 1fr; }
@container (min-width: 400px) { .card { grid-template-columns: 1fr 1fr; } }`,
    explanation: '@container rules have no effect unless an ancestor element has container-type defined. The container establishes the measurement context that the query reads.',
  },
  {
    title: 'Using container-type: size when inline-size is enough',
    wrong: `.wrapper { container-type: size; }
/* size containment blocks the element from growing to fit its children */`,
    right: `.wrapper { container-type: inline-size; }
/* inline-size only measures width — no height containment side effects */`,
    explanation: 'container-type: size blocks the element from sizing to its content in both axes — it can collapse to zero height. Use inline-size for width-only queries (the common case) to avoid unexpected height containment.',
  },
  {
    title: 'Writing @container on the container itself',
    wrong: `/* Tries to query the sidebar against itself — invalid */
.sidebar {
  container-type: inline-size;
}
@container (min-width: 300px) {
  .sidebar { background: red; }
}`,
    right: `/* Query targets children of the container */
.sidebar { container-type: inline-size; }
@container (min-width: 300px) {
  .sidebar-widget { background: red; }
}`,
    explanation: 'A container cannot use @container to query itself — only its descendants can respond to container queries. The container element observes its own size; its children respond to that size.',
  },
  {
    title: 'Using cqw without container-type on an ancestor',
    wrong: `/* No container ancestor — cqw falls back to 0 or viewport */
.icon { width: 10cqw; }`,
    right: `.card-wrapper { container-type: inline-size; }
.icon { width: 10cqw; } /* 10% of card-wrapper's width */`,
    explanation: 'cqw/cqh resolve against the nearest container ancestor. Without a container-type ancestor, the value may behave unexpectedly. Always ensure there is a container-type ancestor in scope.',
  },
  {
    title: 'Replacing all media queries with container queries',
    wrong: `/* Trying to control full page layout with @container */
.page-layout { container-type: inline-size; }
@container (min-width: 1024px) {
  .sidebar { display: block; }  /* showing/hiding page regions */
}`,
    right: `/* Use media queries for page-level layout */
@media (min-width: 1024px) { .sidebar { display: block; } }
/* Use container queries for component-level adaptation */
.sidebar { container-type: inline-size; }
@container (min-width: 240px) { .widget { flex-direction: row; } }`,
    explanation: 'Container queries and media queries are complementary. Media queries handle page-level layout (show/hide nav, switch to sidebar layout). Container queries handle component-level adaptation.',
  },
];

const challenge: Challenge = {
  title: 'Portable Product Card',
  language: 'html',
  description: 'Build a product card that adapts based on its container width — not the viewport. Requirements: (1) Narrow container (<320px): image on top, details below, no price badge. (2) Medium container (320px–500px): image left, details right side by side. (3) Wide container (500px+): image left with larger size, details right with 2-column specs grid. (4) Font size uses cqw for fluid scaling.',
  hints: [
    'Add container-type: inline-size on the .card-wrapper element, not the .card itself.',
    'Start with the mobile (narrow) layout as default, then add @container (min-width: 320px) and (min-width: 500px).',
    'Use clamp(0.9rem, 3cqw, 1.1rem) on the card body text for fluid sizing.',
    'The specs grid can use grid-template-columns: 1fr 1fr inside the wide container query.',
  ],
  starterCode: `<div class="card-wrapper">
  <div class="card">
    <img class="card-img" src="https://picsum.photos/300/200" alt="Product">
    <div class="card-details">
      <h3 class="card-title">Wireless Headphones</h3>
      <p class="card-desc">Premium sound with 40h battery life.</p>
      <div class="card-specs">
        <span>Weight: 250g</span>
        <span>Driver: 40mm</span>
        <span>Freq: 20Hz–20kHz</span>
        <span>Impedance: 32Ω</span>
      </div>
      <p class="card-price">$129.99</p>
    </div>
  </div>
</div>`,
  solution: `.card-wrapper {
  container-type: inline-size;
}

/* Narrow: stacked layout */
.card {
  display: grid;
  grid-template-columns: 1fr;
}

.card-img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
}

.card-details { padding: 1rem; }

.card-title { font-size: clamp(1rem, 5cqw, 1.4rem); margin: 0 0 0.5rem; }
.card-desc  { font-size: clamp(0.85rem, 3cqw, 1rem); color: #6b7280; margin: 0 0 0.75rem; }
.card-specs { display: none; }
.card-price { font-size: clamp(1rem, 4cqw, 1.25rem); font-weight: 700; color: #264de4; margin: 0.75rem 0 0; }

/* Medium: side by side */
@container (min-width: 320px) {
  .card {
    grid-template-columns: 120px 1fr;
    align-items: start;
  }

  .card-img {
    aspect-ratio: 1;
    border-radius: 8px 0 0 8px;
    height: 100%;
  }
}

/* Wide: larger image + specs grid */
@container (min-width: 500px) {
  .card { grid-template-columns: 200px 1fr; }

  .card-specs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem 1rem;
    font-size: 0.85rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What property must be set on a parent for its children to use @container queries?',
    options: [
      'display: container',
      'container-query: true',
      'container-type: inline-size',
      'position: contain',
    ],
    answer: 2,
    explanation: 'container-type (inline-size, size, or normal) establishes the element as a query container. Without it, @container rules on children never fire.',
  },
  {
    q: 'What is the key difference between container queries and media queries?',
    options: [
      'Container queries only work on flex children',
      'Media queries respond to viewport size; container queries respond to parent element size',
      'Container queries require JavaScript to activate',
      'Media queries are deprecated in favor of container queries',
    ],
    answer: 1,
    explanation: 'Media queries are global — they read the browser viewport. Container queries are scoped — they read the size of a containing element, making components portable regardless of where they are placed.',
  },
  {
    q: 'What does 50cqw equal?',
    options: [
      '50% of the viewport width',
      '50% of the nearest container\'s inline size',
      '50% of the root element\'s width',
      '50 pixels regardless of screen size',
    ],
    answer: 1,
    explanation: 'cqw = container query width unit. 1cqw is 1% of the nearest container ancestor\'s inline size. It is analogous to vw (viewport width) but scoped to the container.',
  },
  {
    q: 'Why should you use container-type: inline-size instead of size in most cases?',
    options: [
      'inline-size has better browser support than size',
      'size does not support named containers',
      'size blocks height containment which can collapse elements; inline-size only measures width',
      'inline-size applies to all children automatically',
    ],
    answer: 2,
    explanation: 'container-type: size applies containment in both axes. Height containment prevents the element from growing to fit its children, which can cause it to collapse to zero height. inline-size only measures width — no height side effects.',
  },
  {
    q: 'Can a container use @container to query and style itself?',
    options: [
      'Yes, using the self() selector',
      'Yes, with container-self: true',
      'No — containers can only be queried by their descendants',
      'Yes, but only for custom properties',
    ],
    answer: 2,
    explanation: 'A container cannot respond to its own container query — only descendants can use @container rules against it. The container measures itself; its children respond to that measurement.',
  },
  {
    q: 'What are CSS style queries used for?',
    options: [
      'Querying the number of child elements',
      'Applying styles based on a custom property value on the container element',
      'Reading the computed font size of the container',
      'Querying the color scheme of the page',
    ],
    answer: 1,
    explanation: '@container style(--variant: compact) fires when the container has the custom property --variant set to "compact". This lets parent context drive child component appearance without JavaScript class toggling.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use container queries vs media queries?',
    a: 'Use media queries for page-level layout decisions: showing/hiding the sidebar, switching to a mobile navigation pattern, or full-page grid changes. Use container queries for component-level adaptation: a card that switches from stacked to side-by-side based on its column width, or a widget that adjusts its density based on whether it is in a sidebar or a main grid.',
  },
  {
    q: 'Do container queries work inside CSS Grid and Flexbox?',
    a: 'Yes — and this is their most powerful use case. Grid and Flex children\'s widths change as the grid adapts. Each child can be a container, and its own children respond to the available column width. A card in a 3-column grid gets a wider container than the same card in a 1-column mobile stack — container queries handle both automatically.',
  },
  {
    q: 'What is the difference between container-type: inline-size and size?',
    a: 'inline-size creates a containment context for the inline axis only (width in horizontal writing modes). size creates containment for both inline and block axes (width and height). The important side effect: size-type containment applies block-size containment, which prevents the element from growing to fit its children in the block direction. This can cause height collapse — use inline-size unless you specifically need height queries.',
  },
  {
    q: 'How do I provide a fallback for older browsers that don\'t support container queries?',
    a: 'Write the default (narrow) layout without @container — that is the base style and works everywhere. Then enhance with @container rules. Browsers without support simply ignore the @container blocks and stay in the default layout. For critical layouts, use @supports (container-type: inline-size) { ... } to gate the container-based layout. This graceful degradation is built into the cascade.',
  },
  {
    q: 'Can I nest containers inside other containers?',
    a: 'Yes — @container queries resolve against the nearest container ancestor by default. You can have a page container, a sidebar container, and a widget container, each with independent queries. Use container-name to target a specific ancestor when you need to skip the nearest container: @container page (min-width: 1200px) would look past any intermediate containers to find the one named "page".',
  },
  {
    q: 'Are style queries widely supported?',
    a: 'Style queries for custom properties (the @container style(--var: value) form) have landed in Chrome 111+, Safari 18+, and Firefox 129+. Coverage is good but not universal as of 2025. Size-based container queries (@container (min-width: ...)) have broader support — Chrome 105+, Firefox 110+, Safari 16+. Use size queries confidently in production; use style queries with a @supports check or progressive enhancement strategy.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Container queries make components self-contained — set container-type: inline-size on the parent, then use @container (min-width) on children to adapt based on available space, not the viewport.',
  mustKnow: [
    'container-type: inline-size on the parent creates the query context. Without it, @container never fires.',
    '@container queries target children of the container — a container cannot query itself.',
    'cqw = 1% of the container\'s inline width. Use clamp(min, Ncqw, max) for fluid component typography.',
    'Use inline-size not size unless you need height queries — size has height containment side effects.',
    'container-name lets you target a specific ancestor when multiple containers are nested.',
    'Container queries and media queries are complementary: media for page layout, container for component layout.',
  ],
  interviewFocus: [
    'What problem do container queries solve that media queries cannot?',
    'Explain container-type: inline-size vs size and when each is appropriate.',
    'How do cqw units differ from vw units?',
    'How do you provide a fallback for browsers without container query support?',
  ],
};

@Component({
  selector: 'app-css-container-queries',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './container-queries.html',
  styleUrl: './container-queries.scss',
})
export class CssContainerQueries {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
