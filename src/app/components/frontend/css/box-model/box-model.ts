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
  { name: 'box-sizing: border-box', type: 'keyword', desc: 'Width/height includes padding and border — use universally via * { box-sizing: border-box }.' },
  { name: 'margin', type: 'syntax', desc: 'Space outside the border. Shorthand: top right bottom left. Negative values pull elements together.' },
  { name: 'padding', type: 'syntax', desc: 'Space between content and border. Same shorthand as margin. Adds to element size in content-box.' },
  { name: 'border', type: 'syntax', desc: 'Shorthand: width style color. Drawn between padding and margin.' },
  { name: 'outline', type: 'syntax', desc: 'Like border but outside the margin — does NOT affect layout. Used for focus indicators.' },
  { name: 'overflow', type: 'keyword', desc: 'Controls clipping: visible (default), hidden, scroll, auto, clip.' },
  { name: 'width / height', type: 'syntax', desc: 'Set content-area size (content-box) or total size including padding+border (border-box).' },
  { name: 'min/max-width/height', type: 'syntax', desc: 'Constrain element size. min-width prevents shrinking below threshold; max-width caps growth.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Four Box Model Layers',
    points: [
      '<strong>Content</strong> — the actual text, image, or child elements. Sized by width and height.',
      '<strong>Padding</strong> — transparent space between content and border. Background color/image fills padding area.',
      '<strong>Border</strong> — drawn around the padding. Can have width, style, and color. Affects layout size in content-box.',
      '<strong>Margin</strong> — transparent space outside the border. Separates elements. Background never fills margin area.',
      'In the default <code>content-box</code> model: total width = content + left padding + right padding + left border + right border.',
    ],
  },
  {
    heading: 'box-sizing: border-box',
    points: [
      '<code>border-box</code> redefines width/height to include padding and border — content area shrinks to compensate.',
      'With <code>border-box</code>: a 300px wide element stays 300px regardless of padding or border. Predictable layouts.',
      'Universal reset: <code>*, *::before, *::after { box-sizing: border-box; }</code> — apply this in every project.',
      'Without <code>border-box</code>, adding padding to a flex/grid item causes it to overflow its container — a common bug.',
      'The CSS specification default is <code>content-box</code> for backwards compatibility — always override it.',
    ],
  },
  {
    heading: 'Margin Collapse',
    points: [
      'Adjacent block-level vertical margins collapse into one — the larger of the two wins, not their sum.',
      'A parent and its first/last child collapse margins if there is no border, padding, or overflow separating them.',
      'Margin collapse only happens vertically (top/bottom). Horizontal margins (left/right) never collapse.',
      'Flex and grid containers do NOT experience margin collapse between their children — only normal flow.',
      'Fix collapsed parent margins by adding <code>padding: 1px</code>, <code>overflow: hidden</code>, or using a flex/grid container.',
    ],
  },
  {
    heading: 'Overflow',
    points: [
      '<code>overflow: visible</code> (default) — content renders outside the element boundary without clipping.',
      '<code>overflow: hidden</code> — clips content. Also creates a new Block Formatting Context, collapsing margin fix.',
      '<code>overflow: scroll</code> — always shows scrollbars. <code>overflow: auto</code> — shows scrollbars only when needed.',
      '<code>overflow: clip</code> (modern) — clips without creating a scroll container. Better for decorative overflow.',
      '<code>overflow-x</code> and <code>overflow-y</code> set each axis independently. Setting one to <code>hidden</code> implicitly sets the other to <code>auto</code>.',
    ],
  },
  {
    heading: 'Display & the Box Type',
    points: [
      '<code>display: block</code> — full-width box, starts on a new line. Respects width/height/margin/padding on all sides.',
      '<code>display: inline</code> — only as wide as content. Top/bottom margin and height are ignored. Padding renders but does not push siblings.',
      '<code>display: inline-block</code> — inline flow but respects all box model properties. Useful for buttons and badges.',
      '<code>display: none</code> — removes element from layout entirely. No space taken. Different from <code>visibility: hidden</code>.',
      '<code>visibility: hidden</code> hides the element visually but it still occupies layout space — use for toggling without reflow.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Box Model Basics',
    language: 'scss',
    code: `// Default content-box — total width = 200 + 20 + 20 + 2 + 2 = 244px
.content-box-demo {
  box-sizing: content-box; // default
  width: 200px;
  padding: 20px;
  border: 2px solid #264de4;
  margin: 16px;
}

// border-box — total width stays 200px
.border-box-demo {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;       // content shrinks to 156px
  border: 2px solid #264de4;
  margin: 16px;        // margin is always external
}

// Universal reset — add to every project
*,
*::before,
*::after {
  box-sizing: border-box;
}`,
  },
  {
    label: 'Margin Collapse',
    language: 'scss',
    code: `// Vertical margins collapse — gap is 32px not 48px
.block-a {
  margin-bottom: 32px; // larger value wins
}
.block-b {
  margin-top: 16px;    // discarded
}

// Parent-child collapse — .wrapper top margin collapses with .child
.wrapper {
  // No border/padding separating wrapper from child
  // margin-top: 24px collapses with child's margin-top: 24px
}
.child {
  margin-top: 24px; // bleeds through to wrapper
}

// Fix: add padding or overflow to parent
.wrapper-fixed {
  overflow: hidden;  // creates BFC — no collapse
  // OR:
  padding-top: 1px;  // separates margins
}`,
  },
  {
    label: 'Overflow Patterns',
    language: 'scss',
    code: `// Clip decorative overflow without scroll container
.card {
  overflow: clip; // modern — no BFC side-effects
  border-radius: 12px;
}

// Scrollable region
.data-table-wrapper {
  overflow-x: auto;   // horizontal scroll when table overflows
  overflow-y: visible;
  max-width: 100%;
}

// Text truncation with ellipsis
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

// Multi-line clamp (modern)
.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}`,
  },
  {
    label: 'Card Component',
    language: 'scss',
    code: `// Real-world card using box model correctly
.card {
  box-sizing: border-box;
  width: 100%;
  max-width: 360px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-inline: auto; // horizontal centering

  // Box-shadow outside the border — does NOT affect layout
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  // Outline for focus (keyboard accessible)
  &:focus-within {
    outline: 2px solid #264de4;
    outline-offset: 2px; // gap between outline and border
  }

  &__header {
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 1rem; // no collapse — flex child
  }

  &__body {
    overflow: hidden; // clips any child overflow
  }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Forgetting the universal border-box reset',
    wrong: `div { width: 200px; padding: 20px; } /* total = 240px — overflows container */`,
    right: `*, *::before, *::after { box-sizing: border-box; }
div { width: 200px; padding: 20px; } /* total = 200px — predictable */`,
    explanation: 'Without the reset, adding padding to any element breaks fixed-width layouts. One line at the top of your stylesheet prevents hundreds of layout bugs.',
  },
  {
    title: 'Relying on margin collapse behaviour',
    wrong: `/* Expecting 48px gap between sections */
.section { margin-bottom: 32px; }
.next-section { margin-top: 16px; } /* gap is actually 32px */`,
    right: `/* Use a consistent single margin direction */
.section + .section { margin-top: 48px; }
/* Or use gap on a flex/grid parent */`,
    explanation: 'Margin collapse is unintuitive and disappears inside flex/grid containers. Rely on gap or single-direction margins for predictable spacing.',
  },
  {
    title: 'Using overflow: hidden to clear floats',
    wrong: `.clearfix { overflow: hidden; } /* hides box-shadow and absolutely positioned children */`,
    right: `.clearfix { display: flow-root; } /* modern BFC — no side effects */`,
    explanation: 'overflow: hidden creates a BFC which clears floats, but also clips box-shadows and overflow content. display: flow-root does the same without the clipping.',
  },
  {
    title: 'Inline elements ignoring height/margin-top/bottom',
    wrong: `span { height: 40px; margin-top: 16px; } /* has no effect */`,
    right: `span { display: inline-block; height: 40px; margin-top: 16px; } /* works */`,
    explanation: 'Inline elements only respond to horizontal spacing and line-height. Switch to inline-block or block to use height, vertical margins, and padding that pushes siblings.',
  },
];

const challenge: Challenge = {
  title: 'Debug the Overflowing Card Grid',
  language: 'html',
  description: 'Three cards in a 3-column grid are overflowing their columns. Each card has width: 100%, padding: 24px, and a 2px border. Fix the layout so cards stay within their columns without changing the padding or border values.',
  hints: [
    'Think about which box-sizing value makes width include padding and border.',
    'A single CSS rule applied to all elements can fix this globally.',
    'The issue is that content-box adds padding and border ON TOP of the 100% width.',
  ],
  starterCode: `<style>
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .card { width: 100%; padding: 24px; border: 2px solid #264de4; }
  /* Add your fix here */
</style>
<div class="grid">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>`,
  solution: `<style>
  *, *::before, *::after { box-sizing: border-box; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .card { width: 100%; padding: 24px; border: 2px solid #264de4; }
</style>
<div class="grid">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'An element has width: 200px, padding: 20px, border: 2px. What is its total rendered width with the default box-sizing?',
    options: ['200px', '222px', '240px', '244px'],
    answer: 3,
    explanation: 'Default is content-box: total = 200 + 20 + 20 + 2 + 2 = 244px. Padding and border are added on top of the declared width.',
  },
  {
    q: 'Which CSS rule correctly applies border-box to every element including pseudo-elements?',
    options: [
      'html { box-sizing: border-box; }',
      '* { box-sizing: border-box; }',
      '*, *::before, *::after { box-sizing: border-box; }',
      'body * { box-sizing: border-box; }',
    ],
    answer: 2,
    explanation: '*, *::before, *::after covers all elements and their generated content. The html-only approach misses elements that inherit differently.',
  },
  {
    q: 'Two adjacent block elements have margin-bottom: 30px and margin-top: 20px. What is the actual gap between them?',
    options: ['10px', '20px', '30px', '50px'],
    answer: 2,
    explanation: 'Vertical margins collapse — the gap is the larger of the two values (30px), not their sum (50px). This is margin collapse.',
  },
  {
    q: 'Which overflow value clips content without creating a scroll container or Block Formatting Context?',
    options: ['overflow: hidden', 'overflow: auto', 'overflow: scroll', 'overflow: clip'],
    answer: 3,
    explanation: 'overflow: clip is the modern option — it clips rendering without creating a BFC or scroll container, avoiding the side effects of overflow: hidden.',
  },
  {
    q: 'An inline element has padding-top: 20px set. What happens?',
    options: [
      'The element height increases by 20px',
      'The padding renders but does not push adjacent block elements',
      'The padding is ignored entirely',
      'The element becomes block-level',
    ],
    answer: 1,
    explanation: 'Inline elements render vertical padding visually but it does not affect the line box height or push surrounding block elements — only inline-block/block respect it fully.',
  },
  {
    q: 'What is the difference between outline and border?',
    options: [
      'outline supports border-radius; border does not',
      'outline does not affect layout; border adds to element size',
      'border is outside the margin; outline is inside the padding',
      'They are identical — just different names',
    ],
    answer: 1,
    explanation: 'outline is drawn outside the border but does NOT affect layout — no space is reserved for it. Border is part of the box model and increases element size in content-box.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Why should I always use box-sizing: border-box?',
    a: 'With <code>content-box</code> (default), adding padding or border to an element increases its total size, breaking fixed-width layouts. <code>border-box</code> keeps the declared width constant — padding and border eat into the content area instead. This makes layouts predictable, especially in flex/grid where children must fit their column width.',
  },
  {
    q: 'What causes margin collapse and how do I prevent it?',
    a: 'Margin collapse happens between adjacent block siblings (vertical margins) and between a parent and its first/last block child when no border or padding separates them. To prevent it: use <code>overflow: hidden</code> or <code>display: flow-root</code> on the parent, add <code>padding-top: 1px</code> to the parent, or use flexbox/grid (which disables collapse entirely). In modern layouts, <code>gap</code> on flex/grid containers is the cleanest spacing solution.',
  },
  {
    q: 'What is a Block Formatting Context (BFC) and when does it matter?',
    a: 'A BFC is an isolated layout region where block elements are placed according to normal flow rules, margins do not collapse with the outside, and floats are contained. Triggers: <code>overflow</code> (not visible), <code>display: flow-root</code>, <code>float</code>, <code>position: absolute/fixed</code>, <code>display: flex/grid</code>. It matters when you need to contain floats, prevent margin collapse, or stop content from wrapping around a floated element.',
  },
  {
    q: 'When would I use outline instead of border?',
    a: '<code>outline</code> is ideal for focus indicators because it does not affect layout — adding an outline to a focused button does not shift surrounding elements. Use <code>outline-offset</code> to add a gap between the element and the outline. Never remove <code>outline: none</code> on focusable elements without providing an alternative visible focus style (WCAG requirement).',
  },
  {
    q: 'How does padding behave differently on inline vs block elements?',
    a: 'On <strong>block/inline-block</strong> elements, padding adds space on all sides and pushes siblings away. On <strong>inline</strong> elements, horizontal padding works normally, but vertical padding (top/bottom) renders visually — you can see the background extend — but does NOT push block siblings up or down. The line box height is unaffected. Switch to <code>display: inline-block</code> to get full box model control.',
  },
  {
    q: 'What is the difference between visibility: hidden and display: none?',
    a: '<code>display: none</code> removes the element from the layout entirely — no space is reserved, and it is invisible to screen readers by default. <code>visibility: hidden</code> hides the element visually but it still occupies its layout space — useful when you need to toggle visibility without causing reflow. For accessible hiding (visible to screen readers, hidden visually), use the <code>.sr-only</code> pattern with clip/clip-path.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'The CSS Box Model defines how every element is rendered as a rectangular box with content, padding, border, and margin layers — controlled by box-sizing.',
  mustKnow: [
    'Total width (content-box) = content + padding-left + padding-right + border-left + border-right',
    '<code>box-sizing: border-box</code> — width/height includes padding and border; apply universally',
    'Margin collapse: adjacent vertical block margins collapse to the larger value, not their sum',
    '<code>overflow: hidden</code> creates a BFC; <code>overflow: clip</code> clips without BFC side-effects',
    'Inline elements ignore height, vertical margin, and vertical padding (for layout purposes)',
  ],
  interviewFocus: [
    'Explain content-box vs border-box and why border-box is always preferred',
    'When does margin collapse happen and how do you prevent it?',
    'What is a Block Formatting Context — what triggers one and why does it matter?',
  ],
};

@Component({
  selector: 'app-css-box-model',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent,
  ],
  templateUrl: './box-model.html',
  styleUrl: './box-model.scss',
})
export class CssBoxModel {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
