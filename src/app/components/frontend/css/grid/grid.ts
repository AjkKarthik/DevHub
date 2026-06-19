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
  { name: 'grid-template-columns', type: 'syntax',   desc: 'Defines column track sizes: repeat(3, 1fr), 200px 1fr auto.' },
  { name: 'grid-template-rows',    type: 'syntax',   desc: 'Defines row track sizes. Auto-sized rows expand to fit content.' },
  { name: 'fr unit',               type: 'token',    desc: 'Fraction of remaining space. 1fr 2fr 1fr = 25% / 50% / 25%.' },
  { name: 'repeat()',              type: 'function', desc: 'Shorthand for repeating track sizes: repeat(auto-fill, minmax(200px, 1fr)).' },
  { name: 'minmax()',              type: 'function', desc: 'Track size range: never smaller than min, never larger than max.' },
  { name: 'grid-template-areas',  type: 'syntax',   desc: 'ASCII-art layout map for named regions: "header header" "main sidebar".' },
  { name: 'grid-area',            type: 'syntax',   desc: 'Assigns item to a named area OR sets row-start / col-start / row-end / col-end.' },
  { name: 'gap',                   type: 'keyword',  desc: 'Sets gutters between rows and columns. Shorthand for row-gap + column-gap.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Grid Container and Tracks',
    points: [
      'display: grid turns an element into a grid container; its direct children become grid items.',
      'Tracks are the rows and columns of the grid, defined by grid-template-columns and grid-template-rows.',
      'The fr unit represents a fraction of the leftover space after fixed-size tracks are placed.',
      'repeat(3, 1fr) creates 3 equal columns — same as writing 1fr 1fr 1fr.',
      'Implicit tracks are created automatically when items are placed outside the defined grid.',
    ],
  },
  {
    heading: 'Responsive Grids with auto-fill and auto-fit',
    points: [
      'repeat(auto-fill, minmax(200px, 1fr)) creates as many columns as fit, each at least 200px wide.',
      'auto-fill keeps empty tracks; auto-fit collapses them so filled tracks grow to fill available space.',
      'This pattern creates fully responsive grids with zero media queries.',
      'minmax(200px, 1fr) means: at least 200px, but grow up to share available space equally.',
    ],
  },
  {
    heading: 'Named Areas and Explicit Placement',
    points: [
      'grid-template-areas defines a visual map of the layout using quoted strings.',
      'Each row is a quoted string; each cell name corresponds to a grid-area on a child.',
      'A . in the template means an empty cell.',
      'grid-area can also be shorthand: grid-area: row-start / col-start / row-end / col-end.',
      'grid-column: 1 / -1 spans an item from the first to the last grid line (full width).',
    ],
  },
  {
    heading: 'Implicit Grid and Subgrid',
    points: [
      'grid-auto-rows: minmax(100px, auto) controls the size of implicitly-created rows.',
      'grid-auto-flow: column changes the auto-placement algorithm to fill columns first.',
      'dense packing (grid-auto-flow: row dense) fills holes left by items with specific spans.',
      'subgrid: grid-template-columns: subgrid lets nested grids align to the parent grid lines.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Grid Basics',
    language: 'css',
    code: `.container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;  /* 3 columns: 25% / 50% / 25% */
  grid-template-rows: auto 1fr auto;   /* header auto, main flexible, footer auto */
  gap: 1rem;
  min-height: 100vh;
}

/* Item spanning multiple columns */
.hero {
  grid-column: 1 / -1;  /* span from line 1 to last line (full width) */
}

/* Explicit placement */
.sidebar {
  grid-column: 3;
  grid-row: 2 / 4;       /* span rows 2 and 3 */
}`,
  },
  {
    label: 'Responsive Auto Grid',
    language: 'css',
    code: `/* Cards: min 250px wide, grow to fill row */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

/* auto-fill vs auto-fit */
/* auto-fill: columns collapse to 0 width when empty — keeps phantom columns */
/* auto-fit: empty columns collapse completely — filled columns grow to fill */

/* Minimum content size guard */
.card {
  min-width: 0;  /* allows card to shrink below content size */
}`,
  },
  {
    label: 'Named Template Areas',
    language: 'css',
    code: `.page {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 60px 1fr 50px;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  min-height: 100vh;
  gap: 0;
}

header  { grid-area: header;  background: #1e293b; color: #fff; }
.sidebar{ grid-area: sidebar; background: #f8fafc; border-right: 1px solid #e2e8f0; }
main    { grid-area: main;    padding: 2rem; }
footer  { grid-area: footer;  background: #f1f5f9; }`,
  },
  {
    label: 'Implicit Grid + Dense',
    language: 'css',
    code: `/* Masonry-like layout with dense auto-placement */
.gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 150px;
  gap: 0.5rem;
  grid-auto-flow: row dense;  /* fill gaps created by variable-span items */
}

.wide  { grid-column: span 2; }
.tall  { grid-row: span 2;    }
.large { grid-column: span 2; grid-row: span 2; }

/* Responsive control */
@media (max-width: 600px) {
  .gallery { grid-template-columns: repeat(2, 1fr); }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Forgetting display: grid on the container',
    wrong: `.grid { grid-template-columns: 1fr 1fr 1fr; }
/* children still in normal flow */`,
    right: `.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}`,
    explanation: 'grid-template-* has no effect without display: grid on the parent. Always set display: grid first.',
  },
  {
    title: 'Using auto-fill when you want auto-fit',
    wrong: `/* Last row has phantom empty columns taking up space */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));`,
    right: `/* Items in last row expand to fill — no phantom columns */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));`,
    explanation: 'auto-fill creates empty tracks; auto-fit collapses them so real items can grow. Use auto-fit for card grids.',
  },
  {
    title: 'Mixing up grid line numbers and track counts',
    wrong: `/* 3 columns = lines 1, 2, 3 — wrong! */
.item { grid-column: 1 / 3; }  /* only spans 2 columns */`,
    right: `/* 3 columns = lines 1, 2, 3, 4 — span all 3 columns */
.item { grid-column: 1 / 4; }  /* or use 1 / -1 for full width */`,
    explanation: 'A 3-column grid has 4 grid lines (1-4). To span all 3 columns, go from line 1 to line 4. Use 1 / -1 to always span all columns.',
  },
  {
    title: 'Using gap on grid items instead of the container',
    wrong: `.item { margin: 1rem; }  /* outer items leak outside container */`,
    right: `.container { display: grid; gap: 1rem; }  /* contained gutters */`,
    explanation: 'gap is a container property. It creates gutters between tracks without adding margin to the outer edges.',
  },
  {
    title: 'Placing items in areas without defining the template',
    wrong: `.header { grid-area: header; }  /* nothing happens — no template */`,
    right: `.page {
  display: grid;
  grid-template-areas: "header header";
}
.header { grid-area: header; }`,
    explanation: 'grid-area only works when grid-template-areas is defined on the container with a matching area name.',
  },
];

const challenge: Challenge = {
  title: 'Magazine Layout with Named Areas',
  language: 'html',
  description: 'Build a magazine-style page layout using CSS Grid named areas. The page should have: a full-width header, a wide main article area, a narrower sidebar, and a full-width footer. Make it responsive — on mobile, stack everything in a single column.',
  hints: [
    'Use grid-template-areas with a visual ASCII map of the layout.',
    'Define grid-template-columns: 1fr 300px for a 2-column layout.',
    'Use grid-column: 1 / -1 or a named area spanning both columns for header and footer.',
    'Add a media query to switch to a single-column layout on small screens.',
  ],
  starterCode: `<div class="magazine">
  <header>📰 The Daily Grid</header>
  <main>
    <h2>Breaking News</h2>
    <p>CSS Grid changed how we build layouts forever...</p>
  </main>
  <aside>
    <h3>Related Stories</h3>
    <ul><li>Flexbox vs Grid</li><li>Subgrid arrives</li></ul>
  </aside>
  <footer>© 2025 The Daily Grid</footer>
</div>`,
  solution: `.magazine {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header  header"
    "main    sidebar"
    "footer  footer";
  gap: 1rem;
  min-height: 100vh;
  padding: 1rem;
  max-width: 1100px;
  margin: 0 auto;
}

header { grid-area: header; background: #1e293b; color: #fff; padding: 1.5rem 2rem; border-radius: 8px; }
main   { grid-area: main;   background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
aside  { grid-area: sidebar; background: #f8fafc; padding: 1.5rem; border-radius: 8px; }
footer { grid-area: footer; background: #f1f5f9; padding: 1rem 2rem; border-radius: 8px; text-align: center; color: #64748b; }

@media (max-width: 700px) {
  .magazine {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "footer";
  }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does repeat(auto-fit, minmax(200px, 1fr)) do?',
    options: [
      'Creates exactly 3 columns of 200px each',
      'Creates as many columns as fit, each at least 200px, expanding to fill space',
      'Creates columns that are always exactly 200px wide',
      'Creates rows automatically based on content height',
    ],
    answer: 1,
    explanation: 'auto-fit creates as many columns as can fit at the minimum size, then allows them to grow (1fr) to fill remaining space.',
  },
  {
    q: 'What is the difference between auto-fill and auto-fit?',
    options: [
      'auto-fill allows items to grow; auto-fit keeps them at minimum size',
      'auto-fill creates empty phantom tracks; auto-fit collapses them so items grow',
      'They are identical — just different syntax',
      'auto-fill is for rows; auto-fit is for columns',
    ],
    answer: 1,
    explanation: 'auto-fill keeps empty column tracks (items don\'t grow to fill); auto-fit collapses empty tracks so filled items expand.',
  },
  {
    q: 'In a 4-column grid, what does grid-column: 1 / -1 mean?',
    options: [
      'The item is placed in column 1 with -1 as an error fallback',
      'The item spans from column 1 to column -1 (one from the end)',
      'The item spans all 4 columns from line 1 to line 5',
      'Negative values are invalid in grid-column',
    ],
    answer: 2,
    explanation: '-1 refers to the last grid line. In a 4-column grid, that is line 5, so 1 / -1 spans all 4 columns.',
  },
  {
    q: 'What does grid-auto-flow: row dense do?',
    options: [
      'Makes all rows the same height',
      'Forces items to fill holes left by larger items in previous rows',
      'Creates dense shadows on grid items',
      'Prevents items from wrapping to new rows',
    ],
    answer: 1,
    explanation: 'dense packing fills in holes — smaller items are moved earlier in the layout to fill gaps, which can change visual order.',
  },
  {
    q: 'Which property controls the size of implicitly created rows?',
    options: ['grid-template-rows', 'grid-auto-rows', 'grid-implicit-rows', 'row-size'],
    answer: 1,
    explanation: 'grid-auto-rows controls the size of rows created by the implicit grid (when items are placed outside the defined template).',
  },
  {
    q: 'What is the fr unit in CSS Grid?',
    options: [
      'A fixed pixel value equivalent to 1rem',
      'A fractional share of the remaining space after fixed tracks are placed',
      'A percentage relative to the viewport width',
      'A minimum track size equivalent to auto',
    ],
    answer: 1,
    explanation: 'fr is a flexible length unit that distributes remaining space proportionally. 1fr 2fr 1fr means 25%, 50%, 25% of leftover space.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use Grid vs Flexbox?',
    a: 'Use Grid for two-dimensional layouts where you need to control both rows and columns (page layout, card grids with strict alignment). Use Flexbox for one-dimensional content (nav bars, rows of buttons, stacked items). They complement each other — Grid for the macro layout, Flexbox for micro-components within grid cells.',
  },
  {
    q: 'What is subgrid and when do I need it?',
    a: 'Subgrid (grid-template-columns: subgrid) lets a nested grid align its children to the parent grid\'s tracks. Without it, nested items can\'t align to the outer grid lines. It\'s useful for card components where headings or footers inside each card need to align across all cards.',
  },
  {
    q: 'How do I center an item in a grid cell?',
    a: 'The easiest way: on the grid container, set place-items: center (shorthand for align-items: center + justify-items: center). Or on a specific item, use place-self: center. Both work without adding any inner wrapper.',
  },
  {
    q: 'Can grid items overlap?',
    a: 'Yes — placing two items in the same grid area or overlapping ranges causes them to overlap. Use z-index to control stacking order. This is intentional for UI patterns like image overlays, badges, and hero text over images.',
  },
  {
    q: 'What happens to grid items that don\'t fit the defined template?',
    a: 'They are placed in the implicit grid — rows (or columns if grid-auto-flow: column) created automatically by the browser. Their size is controlled by grid-auto-rows (or grid-auto-columns). By default, implicit rows are sized to auto (content height).',
  },
  {
    q: 'Why do my grid items overflow their cells?',
    a: 'Grid items default to min-width: auto (same as flex items), which means they won\'t shrink below their content size. Add min-width: 0 (and/or overflow: hidden) to allow them to shrink properly within the grid cell.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS Grid is a two-dimensional layout system — define tracks, place items explicitly or let auto-placement handle it.',
  mustKnow: [
    'grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) — responsive grid with zero media queries',
    'fr unit = fraction of remaining space after fixed tracks are placed',
    'grid-template-areas gives named regions; assign with grid-area on items',
    'grid-column: 1 / -1 spans full width; -1 = last grid line',
    'auto-fit collapses empty tracks; auto-fill keeps them',
    'grid-auto-rows controls implicit row sizes',
  ],
  interviewFocus: [
    'Explain the difference between auto-fill and auto-fit',
    'How does the fr unit calculate its size?',
    'When would you use Grid over Flexbox?',
    'What is subgrid and what problem does it solve?',
  ],
};

@Component({
  selector: 'app-css-grid',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
})
export class CssGrid {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
