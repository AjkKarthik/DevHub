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
  { name: 'display: flex',      type: 'keyword', desc: 'Creates a flex container; direct children become flex items.' },
  { name: 'flex-direction',     type: 'keyword', desc: 'Sets main axis: row (default), column, row-reverse, column-reverse.' },
  { name: 'justify-content',    type: 'keyword', desc: 'Aligns items along the main axis: flex-start, center, space-between, space-around, space-evenly.' },
  { name: 'align-items',        type: 'keyword', desc: 'Aligns items along the cross axis: stretch (default), center, flex-start, flex-end, baseline.' },
  { name: 'flex-wrap',          type: 'keyword', desc: 'nowrap (default) keeps items in one line; wrap allows items to flow to next line.' },
  { name: 'gap',                type: 'keyword', desc: 'Sets gutter between flex items. Shorthand for row-gap + column-gap.' },
  { name: 'flex',               type: 'keyword', desc: 'Shorthand for flex-grow flex-shrink flex-basis. flex: 1 = 1 1 0%.' },
  { name: 'order',              type: 'keyword', desc: 'Controls visual order of an item (default 0). Lower value = rendered first.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Flex Container vs Flex Items',
    points: [
      'The parent with display: flex is the flex container; all direct children become flex items.',
      'Container properties (justify-content, align-items, gap) control how items are distributed.',
      'Item properties (flex-grow, flex-shrink, flex-basis, align-self, order) control individual items.',
      'Flexbox is one-dimensional — it lays items out in a row OR a column, not both simultaneously (use Grid for 2D).',
    ],
  },
  {
    heading: 'Main Axis and Cross Axis',
    points: [
      'Main axis: direction flex items flow, determined by flex-direction (default: row = left → right).',
      'Cross axis: perpendicular to main axis. If main is row, cross is column (top → bottom).',
      'justify-content controls alignment on the main axis.',
      'align-items controls alignment on the cross axis.',
      'align-self on an individual item overrides align-items for that item only.',
    ],
  },
  {
    heading: 'The flex Shorthand',
    points: [
      'flex: <grow> <shrink> <basis> — e.g. flex: 1 1 200px.',
      'flex: 1 means flex-grow:1, flex-shrink:1, flex-basis:0% — items share space equally.',
      'flex: auto means 1 1 auto — items grow/shrink based on their natural size.',
      'flex: none means 0 0 auto — item neither grows nor shrinks (rigid size).',
      'flex-basis sets the starting size before free space is distributed; 0 vs auto matters for equal sizing.',
    ],
  },
  {
    heading: 'Wrapping and Alignment',
    points: [
      'flex-wrap: wrap lets items flow onto new lines when they exceed the container width.',
      'align-content controls spacing between rows when items wrap (similar to justify-content but for cross axis rows).',
      'gap replaces margin hacks — no need for margin-right on last item or negative margins.',
      'place-content is a shorthand for align-content + justify-content.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Flex Container Basics',
    language: 'css',
    code: `.container {
  display: flex;
  flex-direction: row;       /* default: left → right */
  justify-content: space-between; /* main axis */
  align-items: center;       /* cross axis */
  gap: 1rem;                 /* gutter between items */
}

/* Items stretch to fill cross axis by default */
.item {
  flex: 1;                   /* equal share of available space */
  padding: 1rem;
  background: #eff6ff;
  border-radius: 8px;
}`,
  },
  {
    label: 'flex Shorthand',
    language: 'css',
    code: `/* flex: grow shrink basis */
.sidebar  { flex: 0 0 260px; }  /* fixed 260px, never grows/shrinks */
.main     { flex: 1 1 0;     }  /* takes remaining space */
.footer   { flex: none;       }  /* shorthand for 0 0 auto */

/* Equal columns regardless of content */
.col      { flex: 1; }          /* all cols share space equally */

/* Min-width guard — won't shrink below 200px */
.card {
  flex: 1 1 200px;
  min-width: 0;               /* prevents overflow in narrow containers */
}`,
  },
  {
    label: 'Holy Grail Layout',
    language: 'css',
    code: `.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header, footer {
  flex: none;                /* fixed height sections */
  padding: 1rem 2rem;
  background: #1e293b;
  color: #fff;
}

.body {
  display: flex;
  flex: 1;                   /* takes remaining vertical space */
}

.sidebar {
  flex: 0 0 240px;           /* fixed width sidebar */
  background: #f8fafc;
  padding: 1rem;
}

main {
  flex: 1;                   /* expands to fill remaining width */
  padding: 2rem;
  min-width: 0;              /* prevents flex blowout */
}`,
  },
  {
    label: 'Responsive Card Grid',
    language: 'css',
    code: `.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.card {
  flex: 1 1 280px;           /* at least 280px, grows to fill */
  max-width: 380px;          /* cap growth */
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
}

/* Center last row items if they don't fill the row */
.card-grid.centered {
  justify-content: center;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using margin for gaps',
    wrong: `.item { margin-right: 1rem; }
.item:last-child { margin-right: 0; }`,
    right: `.container { display: flex; gap: 1rem; }`,
    explanation: 'gap is cleaner — no need to remove the last margin and it works correctly when items wrap.',
  },
  {
    title: 'Forgetting min-width: 0 causes overflow',
    wrong: `.container { display: flex; }
.item { flex: 1; }  /* can overflow with long text */`,
    right: `.container { display: flex; }
.item { flex: 1; min-width: 0; }  /* allows shrinking below content size */`,
    explanation: 'Flex items default to min-width: auto, meaning they won\'t shrink below their content size. Add min-width: 0 to allow proper shrinking.',
  },
  {
    title: 'Confusing justify-content and align-items axes',
    wrong: `/* Trying to center horizontally */
.container { display: flex; align-items: center; }`,
    right: `/* justify-content = main axis (row = horizontal) */
.container { display: flex; justify-content: center; align-items: center; }`,
    explanation: 'In a row flex container, justify-content is horizontal and align-items is vertical. They swap when flex-direction is column.',
  },
  {
    title: 'Using width instead of flex-basis',
    wrong: `.item { flex: 1; width: 200px; }  /* width and flex fight each other */`,
    right: `.item { flex: 1 1 200px; }  /* flex-basis sets the starting size */`,
    explanation: 'Use flex-basis as the third value in the flex shorthand. Width can conflict with flex calculations.',
  },
  {
    title: 'Setting display: flex on inline elements',
    wrong: `span { display: flex; justify-content: center; }`,
    right: `span { display: inline-flex; justify-content: center; }`,
    explanation: 'display: flex makes the element block-level. Use inline-flex to keep the element inline while enabling flex layout for its children.',
  },
];

const challenge: Challenge = {
  title: 'Navigation Bar with Flex',
  language: 'html',
  description: 'Build a responsive navigation bar using Flexbox. The nav should have a logo on the left and links on the right. On mobile (< 600px), switch to a column layout with centered items.',
  hints: [
    'Use display: flex with justify-content: space-between on the nav for logo + links layout.',
    'Wrap the links in a <ul> with display: flex and gap for spacing.',
    'Use a media query to switch to column direction on small screens.',
    'Remove list-style from the ul and default link decorations.',
  ],
  starterCode: `<nav class="navbar">
  <a href="/" class="logo">DevHub</a>
  <ul class="nav-links">
    <li><a href="/css">CSS</a></li>
    <li><a href="/js">JS</a></li>
    <li><a href="/react">React</a></li>
  </ul>
</nav>`,
  solution: `.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #1e293b;
}

.logo {
  color: #fff;
  font-weight: 700;
  font-size: 1.25rem;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.nav-links a:hover { color: #fff; }

@media (max-width: 600px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which property controls alignment along the main axis in a flex container?',
    options: ['align-items', 'align-content', 'justify-content', 'flex-direction'],
    answer: 2,
    explanation: 'justify-content distributes items along the main axis. align-items handles the cross axis.',
  },
  {
    q: 'What does flex: 1 expand to?',
    options: [
      'flex-grow: 1; flex-shrink: 1; flex-basis: auto',
      'flex-grow: 1; flex-shrink: 0; flex-basis: 0%',
      'flex-grow: 1; flex-shrink: 1; flex-basis: 0%',
      'flex-grow: auto; flex-shrink: 1; flex-basis: 1px',
    ],
    answer: 2,
    explanation: 'flex: 1 is shorthand for flex-grow: 1; flex-shrink: 1; flex-basis: 0%. The 0% basis means items start from zero and share available space equally.',
  },
  {
    q: 'Which value of flex-direction makes items stack vertically?',
    options: ['row', 'column', 'vertical', 'stack'],
    answer: 1,
    explanation: 'flex-direction: column changes the main axis to vertical, making items stack top to bottom.',
  },
  {
    q: 'What does align-self do?',
    options: [
      'Aligns the entire flex container',
      'Overrides align-items for a single flex item',
      'Centers all items on the main axis',
      'Sets the order of flex items',
    ],
    answer: 1,
    explanation: 'align-self on a flex item overrides the container\'s align-items for that specific item.',
  },
  {
    q: 'Which property allows flex items to wrap onto multiple lines?',
    options: ['flex-wrap: wrap', 'overflow: wrap', 'flex-flow: multi', 'flex-basis: auto'],
    answer: 0,
    explanation: 'flex-wrap: wrap allows items to overflow onto new lines when they exceed the container width.',
  },
  {
    q: 'What is the default value of align-items in a flex container?',
    options: ['flex-start', 'center', 'stretch', 'baseline'],
    answer: 2,
    explanation: 'align-items defaults to stretch, which makes flex items stretch to fill the container\'s cross-axis height.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use Flexbox vs CSS Grid?',
    a: 'Use Flexbox for one-dimensional layouts — a single row of nav items, a row of cards, or a column of stacked elements. Use Grid for two-dimensional layouts where you need to control both rows and columns simultaneously, like a full page layout or a card grid with strict alignment across rows.',
  },
  {
    q: 'Why do my flex items not shrink below their content width?',
    a: 'By default, flex items have min-width: auto, which prevents them from shrinking below their minimum content size. Add min-width: 0 to the item to allow it to shrink below its content size.',
  },
  {
    q: 'What is the difference between align-items and align-content?',
    a: 'align-items controls individual item alignment on the cross axis within a single row. align-content controls spacing between multiple rows when items wrap — it only applies when flex-wrap: wrap is set and there are multiple lines.',
  },
  {
    q: 'How do I vertically and horizontally center an element with Flexbox?',
    a: 'Set display: flex; justify-content: center; align-items: center on the parent. This is the most straightforward centering technique in CSS.',
  },
  {
    q: 'What does order: -1 do?',
    a: 'The order property controls visual rendering order. Items default to order: 0. Setting order: -1 renders that item before all order: 0 items without changing the DOM, which helps accessibility (DOM order = reading/tab order, visual order can differ).',
  },
  {
    q: 'Does gap work in all browsers?',
    a: 'Yes — gap in flex containers has been supported in all major browsers since 2021 (Chrome 84+, Firefox 63+, Safari 14.1+). It replaced the margin-based spacing hack.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Flexbox is a one-dimensional CSS layout model for distributing space and aligning items in a row or column.',
  mustKnow: [
    'justify-content = main axis alignment; align-items = cross axis alignment',
    'flex: 1 = flex-grow:1, flex-shrink:1, flex-basis:0% — equal space sharing',
    'flex-wrap: wrap allows items to flow onto new lines',
    'gap replaces margin hacks for gutters between items',
    'min-width: 0 on flex items prevents overflow with long content',
    'align-self overrides align-items for an individual item',
  ],
  interviewFocus: [
    'Explain the difference between justify-content and align-items',
    'When would you use Flexbox vs Grid?',
    'What does flex: 1 mean and how does it distribute space?',
    'How do you prevent flex items from shrinking below their content size?',
  ],
};

@Component({
  selector: 'app-css-flexbox',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './flexbox.html',
  styleUrl: './flexbox.scss',
})
export class CssFlexbox {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
