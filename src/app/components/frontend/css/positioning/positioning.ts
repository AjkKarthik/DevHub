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
  { name: 'position: static',   type: 'keyword', desc: 'Default. Element in normal flow; top/left/z-index have no effect.' },
  { name: 'position: relative', type: 'keyword', desc: 'Offset from its normal position; still occupies original space.' },
  { name: 'position: absolute', type: 'keyword', desc: 'Removed from flow; positioned relative to nearest non-static ancestor.' },
  { name: 'position: fixed',    type: 'keyword', desc: 'Removed from flow; positioned relative to viewport — stays on scroll.' },
  { name: 'position: sticky',   type: 'keyword', desc: 'Normal flow until threshold, then fixed within its scroll container.' },
  { name: 'z-index',            type: 'keyword', desc: 'Controls stacking order. Only works on positioned elements (non-static).' },
  { name: 'inset',              type: 'keyword', desc: 'Shorthand for top + right + bottom + left. inset: 0 = all four sides.' },
  { name: 'Stacking context',   type: 'syntax',  desc: 'Isolation layer created by transform, opacity<1, z-index on positioned element.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Five Position Values',
    points: [
      'static (default): element is in normal document flow. top/left/z-index are ignored.',
      'relative: offset from its normal position using top/right/bottom/left. Original space is preserved.',
      'absolute: lifted out of normal flow. Positioned relative to the nearest ancestor with position ≠ static.',
      'fixed: positioned relative to the viewport — stays put when the page scrolls.',
      'sticky: behaves like relative until it crosses a scroll threshold, then acts like fixed within its containing block.',
    ],
  },
  {
    heading: 'Absolute Positioning and the Containing Block',
    points: [
      'An absolute element searches up the DOM for its containing block — the nearest positioned ancestor (position ≠ static).',
      'If no positioned ancestor is found, the containing block is the initial containing block (viewport).',
      'The common pattern: position: relative on the parent + position: absolute on the child.',
      'top: 50%; left: 50%; transform: translate(-50%, -50%) centers an absolute element within its container.',
      'inset: 0 + margin: auto is another centering technique that works when width/height are set.',
    ],
  },
  {
    heading: 'Stacking Contexts and z-index',
    points: [
      'z-index only works on positioned elements (position ≠ static).',
      'A stacking context is an isolated layer — elements inside compete only with siblings inside the same context.',
      'Stacking contexts are created by: transform, opacity < 1, filter, will-change, isolation: isolate, and z-index on a positioned element.',
      'A child can never appear above a sibling stacking context with higher z-index, no matter how high its own z-index is.',
      'isolation: isolate creates a stacking context without side effects — useful for containing z-index battles.',
    ],
  },
  {
    heading: 'Sticky Positioning Gotchas',
    points: [
      'sticky requires a scroll container — the sticky element\'s ancestor must have overflow set to scroll, auto, or hidden.',
      'sticky requires at least one offset (top, left, etc.) to work — it won\'t stick without them.',
      'The sticky element stops scrolling when it reaches the edge of its parent container.',
      'overflow: hidden on a parent disables sticky — the parent becomes the scroll container and may be too short.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Position Reference',
    language: 'css',
    code: `/* Static — default, no offset properties apply */
.static-el { position: static; }

/* Relative — shifts from normal position, space preserved */
.badge {
  position: relative;
  top: -2px;           /* moves up 2px from where it would be */
}

/* Absolute — out of flow, anchored to positioned parent */
.parent { position: relative; }
.tooltip {
  position: absolute;
  top: calc(100% + 8px);  /* just below the parent */
  left: 50%;
  transform: translateX(-50%);  /* center horizontally */
}

/* Fixed — viewport-anchored, survives scroll */
.nav-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
}

/* Sticky — scroll until threshold, then pins */
.section-header {
  position: sticky;
  top: 60px;           /* sticks 60px from top of viewport */
  z-index: 10;
}`,
  },
  {
    label: 'Centering with Absolute',
    language: 'css',
    code: `/* Classic: transform centering */
.overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Modern: inset + margin auto */
.modal {
  position: absolute;
  inset: 0;            /* top:0 right:0 bottom:0 left:0 */
  width: 400px;
  height: 300px;
  margin: auto;        /* distributes remaining space equally */
}

/* Cover parent completely */
.overlay-full {
  position: absolute;
  inset: 0;            /* stretches to all edges */
}`,
  },
  {
    label: 'Stacking Contexts',
    language: 'css',
    code: `/* Problem: inner z-index can't escape parent stacking context */
.card-a {
  position: relative;
  z-index: 1;          /* creates stacking context */
}
.card-a .tooltip {
  position: absolute;
  z-index: 9999;       /* still below .card-b if card-b z-index > 1 */
}

.card-b {
  position: relative;
  z-index: 2;          /* card-b wins over card-a entirely */
}

/* Solution: isolate a component from z-index wars */
.modal-container {
  isolation: isolate;  /* creates stacking context without side effects */
}`,
  },
  {
    label: 'Sticky Nav + Cards',
    language: 'css',
    code: `/* Sticky table header */
.table-wrap {
  overflow-y: auto;
  max-height: 400px;
}

th {
  position: sticky;
  top: 0;
  background: #1e293b;
  color: #fff;
  z-index: 1;          /* needs z-index to appear above tbody */
}

/* Sticky sidebar that stops at section end */
.layout { display: flex; gap: 2rem; }

.sidebar {
  position: sticky;
  top: 1rem;
  align-self: flex-start;  /* critical: prevents sidebar stretching to full height */
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'z-index on a non-positioned element',
    wrong: `.hero-text { z-index: 10; }  /* no effect — position is static */`,
    right: `.hero-text { position: relative; z-index: 10; }`,
    explanation: 'z-index only works on positioned elements (position ≠ static). Add position: relative if you only need z-index without offsetting.',
  },
  {
    title: 'Absolute child with no positioned parent',
    wrong: `/* .wrapper has no position — absolute child uses viewport */
.wrapper { width: 200px; }
.badge { position: absolute; top: 0; right: 0; }`,
    right: `.wrapper { position: relative; width: 200px; }
.badge { position: absolute; top: 0; right: 0; }`,
    explanation: 'An absolute element climbs the DOM for a positioned ancestor. Without one it anchors to the viewport. Always set position: relative on the intended parent.',
  },
  {
    title: 'overflow: hidden breaks sticky',
    wrong: `.scroll-container { overflow: hidden; }
.sticky-header { position: sticky; top: 0; }  /* never sticks */`,
    right: `.scroll-container { overflow-y: auto; }
.sticky-header { position: sticky; top: 0; }`,
    explanation: 'overflow: hidden makes the parent the scroll container — if it doesn\'t scroll, sticky has nothing to pin to. Use overflow-y: auto or remove overflow: hidden.',
  },
  {
    title: 'Sticky without a top/bottom offset',
    wrong: `.sidebar { position: sticky; }  /* no offset — never sticks */`,
    right: `.sidebar { position: sticky; top: 1rem; }`,
    explanation: 'sticky requires at least one offset property (top, bottom, left, or right) to know when to start pinning.',
  },
  {
    title: 'Forgetting align-self: flex-start on a sticky sidebar',
    wrong: `.sidebar { position: sticky; top: 1rem; }
/* sidebar in a flex row stretches to full height — sticky scrolls the whole height */`,
    right: `.sidebar { position: sticky; top: 1rem; align-self: flex-start; }`,
    explanation: 'In a flex container, items stretch to full height by default. A full-height sidebar means there\'s no room to scroll inside it — align-self: flex-start lets it be its natural height so sticky works.',
  },
];

const challenge: Challenge = {
  title: 'Notification Badge + Modal Overlay',
  language: 'html',
  description: 'Build two positioning patterns: (1) A button with an absolute-positioned notification badge in the top-right corner. (2) A full-screen modal overlay with a centered dialog using CSS positioning only (no Flexbox/Grid on the overlay itself).',
  hints: [
    'For the badge: set position: relative on the button, position: absolute on the badge.',
    'Use top: -8px; right: -8px on the badge to place it in the corner.',
    'For the modal overlay: position: fixed; inset: 0; background: rgba(0,0,0,.5).',
    'Center the dialog with position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%).',
  ],
  starterCode: `<!-- Notification badge -->
<button class="icon-btn">
  🔔
  <span class="badge">3</span>
</button>

<!-- Modal overlay -->
<div class="overlay">
  <div class="dialog">
    <h2>Confirm Action</h2>
    <p>Are you sure you want to continue?</p>
    <button>Cancel</button>
    <button>Confirm</button>
  </div>
</div>`,
  solution: `/* Notification badge */
.icon-btn {
  position: relative;
  padding: 0.75rem 1rem;
  font-size: 1.5rem;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which position value keeps the element in normal flow but allows z-index to work?',
    options: ['static', 'relative', 'absolute', 'fixed'],
    answer: 1,
    explanation: 'position: relative keeps the element in its normal flow position but activates z-index and allows top/left offsets from that position.',
  },
  {
    q: 'An absolute element with no positioned ancestor is positioned relative to:',
    options: [
      'Its nearest parent element',
      'The document body',
      'The initial containing block (viewport)',
      'The nearest block-level ancestor',
    ],
    answer: 2,
    explanation: 'If no positioned (non-static) ancestor exists, the absolute element uses the initial containing block, which corresponds to the viewport.',
  },
  {
    q: 'What creates a new stacking context?',
    options: [
      'display: block on any element',
      'z-index: 1 on a positioned element',
      'margin: auto on a flex item',
      'overflow: visible on any element',
    ],
    answer: 1,
    explanation: 'Setting z-index to any value other than auto on a positioned element (position ≠ static) creates a stacking context. transform, opacity<1, and filter also create them.',
  },
  {
    q: 'Why might position: sticky stop working?',
    options: [
      'The element has no background-color',
      'The parent has overflow: hidden or the element has no offset set',
      'The element is inside a flex container',
      'The element\'s z-index is not set',
    ],
    answer: 1,
    explanation: 'sticky breaks when the scroll container has overflow: hidden (no scrolling surface), or when no offset (top/bottom) is specified.',
  },
  {
    q: 'What does inset: 0 mean?',
    options: [
      'Sets padding to 0 on all sides',
      'Sets top: 0; right: 0; bottom: 0; left: 0',
      'Removes the element from the stacking context',
      'Sets margin: 0 and padding: 0',
    ],
    answer: 1,
    explanation: 'inset is a shorthand for top, right, bottom, and left. inset: 0 sets all four to 0, stretching an absolute/fixed element to cover its containing block.',
  },
  {
    q: 'What is the purpose of isolation: isolate?',
    options: [
      'Prevents the element from inheriting CSS variables',
      'Creates a stacking context without any visual side effects',
      'Isolates the element from the CSS cascade',
      'Prevents child elements from being positioned',
    ],
    answer: 1,
    explanation: 'isolation: isolate creates a stacking context without requiring z-index, opacity, or transform. It\'s the cleanest way to contain z-index battles inside a component.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between fixed and absolute?',
    a: 'Both are removed from normal flow, but they differ in their containing block. absolute is positioned relative to the nearest positioned ancestor (or viewport if none exists). fixed is always positioned relative to the viewport — it doesn\'t scroll with the page. This makes fixed ideal for navbars and modals.',
  },
  {
    q: 'Why does my absolutely-positioned element appear in the wrong place?',
    a: 'The containing block is wrong. Check that the intended parent has position: relative (or any value other than static). Use browser DevTools to inspect the element and look for which ancestor is its offset parent — that tells you what it\'s positioned relative to.',
  },
  {
    q: 'What is a stacking context and why does it matter?',
    a: 'A stacking context is an isolated layer in the CSS rendering model. Elements inside a stacking context compete for z-index position only against other elements in the same context. A child with z-index: 9999 inside a parent stacking context with z-index: 1 will still appear below a sibling stacking context with z-index: 2.',
  },
  {
    q: 'How do I prevent a sticky element from scrolling through its parent?',
    a: 'Sticky elements stop at the edge of their scrolling container. If you need the element to stick beyond the parent, make a higher ancestor the scroll container instead. The sticky element pins within — it can\'t escape — its containing block.',
  },
  {
    q: 'Can I use z-index without setting position?',
    a: 'No. z-index has no effect on elements with position: static (the default). Set position: relative if you only need z-index stacking without any visual offset.',
  },
  {
    q: 'How do I center a modal with CSS positioning?',
    a: 'Two approaches: (1) position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) — works without knowing the element\'s size. (2) position: absolute; inset: 0; width: X; height: Y; margin: auto — cleaner but requires explicit dimensions.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS positioning controls how elements are placed in the flow and how they stack — master the five values and stacking contexts.',
  mustKnow: [
    'static: in flow, z-index ignored. relative: in flow, z-index works, offset from normal position.',
    'absolute: out of flow, relative to nearest non-static ancestor.',
    'fixed: out of flow, relative to viewport — survives scrolling.',
    'sticky: in flow until threshold, then fixed within scroll container. Needs top/bottom offset.',
    'z-index only works on positioned (non-static) elements.',
    'Stacking contexts: children can never escape their parent context\'s z-index level.',
  ],
  interviewFocus: [
    'Explain the difference between absolute and fixed positioning.',
    'What creates a stacking context, and why does it matter for z-index?',
    'Why does sticky positioning sometimes not work?',
    'How would you center a modal with only CSS positioning?',
  ],
};

@Component({
  selector: 'app-css-positioning',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './positioning.html',
  styleUrl: './positioning.scss',
})
export class CssPositioning {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
