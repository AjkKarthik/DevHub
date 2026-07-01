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
  { name: 'transition',                   type: 'keyword',  desc: 'Shorthand: property duration timing-function delay — e.g. "background 0.3s ease".' },
  { name: 'transition-duration',          type: 'keyword',  desc: 'How long the change takes: 0.3s, 200ms, 0.5s.' },
  { name: 'transition-timing-function',   type: 'keyword',  desc: 'Speed curve: ease, ease-in, ease-out, ease-in-out, linear, cubic-bezier().' },
  { name: 'transition-delay',             type: 'keyword',  desc: 'Wait before starting: 0s default. Negative delay starts mid-transition.' },
  { name: 'transition: all',              type: 'keyword',  desc: 'Applies to all animatable properties — a performance anti-pattern; be specific.' },
  { name: 'transform',                    type: 'function', desc: 'Transition translate/scale/rotate on the GPU compositor — no layout cost.' },
  { name: 'opacity',                      type: 'keyword',  desc: 'GPU-compositor property — fade elements in/out without triggering paint.' },
  { name: 'cubic-bezier(x1,y1,x2,y2)',   type: 'function', desc: 'Custom easing curve for organic motion. Use cubic-bezier.com to visualise.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Transition Shorthand and Syntax',
    points: [
      'Syntax: transition: <property> <duration> <timing-function> <delay> — all but property are optional.',
      'Multiple transitions: comma-separate — transition: background 0.3s ease, transform 0.4s ease-out.',
      'transition: all 0.3s is a performance anti-pattern — it watches every property, bloating style recalculation.',
      'Always define transition on the base state (not just :hover) so the transition plays both ways — in and out.',
      'Delay is rarely needed but useful for staggered reveal: nth-child stagger with increasing delay values.',
    ],
  },
  {
    heading: 'Transitionable vs Non-transitionable Properties',
    points: [
      'GPU compositor only (no layout/paint): transform (translate, scale, rotate, skew) and opacity.',
      'Paints but no layout: color, background-color, border-color, box-shadow, filter.',
      'Triggers layout (avoid animating): width, height, top, left, margin, padding, font-size.',
      'Not transitionable at all: display, visibility (snap between states — use opacity instead).',
      'border-radius and clip-path are paintable and transition well for shape morphing effects.',
    ],
  },
  {
    heading: 'Accessibility and Best Practices',
    points: [
      'Always apply the same transition to :focus-visible as :hover — keyboard users need the same visual feedback.',
      'Respect prefers-reduced-motion: reduce — wrap significant transitions in @media (prefers-reduced-motion: no-preference).',
      'Duration sweet spot: 150ms–300ms for UI responses, 300ms–500ms for larger layout shifts.',
      'Short duration (100ms–200ms) feels snappy for button presses. Long duration (500ms+) feels sluggish on micro-interactions.',
      'Use transition-play-state via JavaScript to pause transitions for users or debugging.',
    ],
  },
  {
    heading: 'Timing Functions and Perceived Motion Quality',
    points: [
      'The transition-timing-function controls the RATE of change over the transition duration, not just the start/end values — ease-in-out (slow start, fast middle, slow end) feels more natural for most UI motion than linear (constant speed), which can feel mechanical and less polished.',
      'Custom cubic-bezier() timing functions let you fine-tune exactly how a transition accelerates and decelerates beyond the handful of predefined keywords (ease, ease-in, ease-out) — useful for matching a specific design system\'s motion language or achieving a particular feel like a slight overshoot.',
      'Transitioning multiple properties with different timing functions and durations (comma-separated in the transition shorthand) allows more sophisticated, layered motion — a color change might use a quick linear transition while an accompanying transform uses a slower, eased curve.',
      'Respecting prefers-reduced-motion by disabling or significantly simplifying transitions for users who have indicated a preference for reduced motion (via the media query) is both an accessibility best practice and, in some contexts, a legal accessibility requirement — never assume all users want elaborate animated transitions.',
    ],
  },
  {
    heading: 'Transitions vs Animations: Choosing the Right Tool',
    points: [
      'CSS transitions animate between two states (a starting value and an ending value) triggered by a state change (hover, class toggle, focus) — appropriate for simple, discrete state-to-state motion like a button color change or a menu sliding open.',
      'CSS animations (@keyframes) support multiple intermediate steps, looping, and can run automatically on page load without requiring a triggering state change — appropriate for more complex, multi-stage motion sequences like a loading spinner or an attention-grabbing pulse effect.',
      'Transitions are generally simpler to reason about and debug for straightforward interactive feedback, since they only ever describe a single before/after state pair, while animations require thinking through the full timeline of keyframe percentages.',
      'A common practical distinction: use transitions for anything directly tied to user interaction state changes (hover, active, focus, a toggled class), and reserve @keyframes animations for motion that is not simply "state A to state B" but involves a genuine sequence or repetition.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Basic Transitions',
    language: 'css',
    code: `/* Define transition on the base state */
.btn {
  background: #264de4;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.btn:hover,
.btn:focus-visible {
  background: #142b9c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(38, 77, 228, 0.4);
}

.btn:active {
  transform: translateY(0);
  box-shadow: none;
}`,
  },
  {
    label: 'Hover Card Pattern',
    language: 'css',
    code: `/* GPU-only transition: transform + opacity */
.card {
  transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

/* Reveal overlay on hover */
.card-overlay {
  opacity: 0;
  transition: opacity 0.25s ease;
}

.card:hover .card-overlay {
  opacity: 1;
}

/* Image zoom inside fixed container (no layout shift) */
.card-img {
  overflow: hidden;
}

.card-img img {
  transition: transform 0.4s ease;
}

.card:hover .card-img img {
  transform: scale(1.06);
}`,
  },
  {
    label: 'Multiple Transitions',
    language: 'css',
    code: `/* Comma-separate for independent timing per property */
.nav-link {
  color: #374151;
  text-decoration: none;
  position: relative;
  transition:
    color      0.2s ease,
    transform  0.2s ease-out;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 0;
  height: 2px;
  background: #264de4;
  transition: width 0.25s ease-out;
}

.nav-link:hover,
.nav-link:focus-visible {
  color: #264de4;
  transform: translateX(2px);
}

.nav-link:hover::after,
.nav-link:focus-visible::after {
  width: 100%;
}`,
  },
  {
    label: 'Accessible Transitions',
    language: 'css',
    code: `/* Default: transitions enabled */
.animated {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Reduced motion: remove movement, keep opacity change */
@media (prefers-reduced-motion: reduce) {
  .animated {
    transition: opacity 0.15s ease;
  }
}

/* Focus visible for keyboard users */
.interactive:focus-visible {
  outline: 2px solid #264de4;
  outline-offset: 3px;
  transition: outline-offset 0.1s ease;
}

/* Smooth open/close sidebar without display:none jump */
.sidebar {
  transform: translateX(-100%);
  transition: transform 0.3s ease-out;
}

.sidebar.open {
  transform: translateX(0);
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using transition: all (performance anti-pattern)',
    wrong: `button { transition: all 0.3s ease; }`,
    right: `button { transition: background 0.2s ease, transform 0.2s ease; }`,
    explanation: '"all" makes the browser watch every property for changes on every frame. Specify only the properties you are actually transitioning to avoid wasted style recalculations.',
  },
  {
    title: 'Animating layout-triggering properties',
    wrong: `.drawer { transition: width 0.3s ease; }
.drawer.open { width: 300px; }`,
    right: `.drawer { transition: transform 0.3s ease; transform: translateX(-100%); }
.drawer.open { transform: translateX(0); }`,
    explanation: 'Transitioning width or height forces layout recalculation on every frame. Use transform: translateX/Y/scale instead — they run on the GPU compositor with no layout cost.',
  },
  {
    title: 'Defining transition only on :hover (one-way animation)',
    wrong: `button { background: blue; }
button:hover { background: purple; transition: background 0.3s; }`,
    right: `button { background: blue; transition: background 0.3s; }
button:hover { background: purple; }`,
    explanation: 'Putting transition on :hover means it only plays when hovering in — when the mouse leaves, the change snaps instantly. Define transition on the base state to animate both directions.',
  },
  {
    title: 'Forgetting :focus-visible alongside :hover',
    wrong: `.btn:hover { background: #142b9c; }`,
    right: `.btn:hover,
.btn:focus-visible { background: #142b9c; }`,
    explanation: 'Keyboard and assistive technology users navigate with Tab — they cannot trigger :hover. Every interactive element must have matching :focus-visible styles for accessibility.',
  },
  {
    title: 'Ignoring prefers-reduced-motion for transitions',
    wrong: `.hero { transition: transform 0.8s ease; }`,
    right: `@media (prefers-reduced-motion: no-preference) {
  .hero { transition: transform 0.8s ease; }
}`,
    explanation: 'Motion sensitivity and vestibular disorders affect many users. Wrapping significant transitions in prefers-reduced-motion: no-preference is the safest opt-in pattern.',
  },
];

const challenge: Challenge = {
  title: 'Interactive Navigation Menu',
  language: 'html',
  description: 'Build a horizontal navigation bar where: (1) Links have an animated underline that expands on hover/focus using transform. (2) The active link has a persistent underline. (3) A dropdown opens smoothly using opacity + transform (not display toggle). (4) All transitions respect prefers-reduced-motion.',
  hints: [
    'Use ::after pseudo-element on nav links, start at width: 0 and scale to width: 100% via transform: scaleX().',
    'Set transform-origin: left on the ::after element so the underline expands from the left.',
    'For the dropdown, start with opacity: 0 and transform: translateY(-8px), transition to opacity: 1 and translateY(0).',
    'Wrap movement transitions in @media (prefers-reduced-motion: no-preference) — keep opacity transitions always.',
  ],
  starterCode: `<nav class="main-nav">
  <a href="#" class="nav-link">Home</a>
  <a href="#" class="nav-link active">About</a>
  <div class="nav-dropdown-wrap">
    <a href="#" class="nav-link">Services</a>
    <div class="dropdown">
      <a href="#">Web Design</a>
      <a href="#">Development</a>
    </div>
  </div>
  <a href="#" class="nav-link">Contact</a>
</nav>`,
  solution: `.main-nav {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 2rem;
  background: #1e293b;
}

.nav-link {
  color: #cbd5e1;
  text-decoration: none;
  position: relative;
  padding-bottom: 4px;
  transition: color 0.2s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: #264de4;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease-out;
}

.nav-link:hover,
.nav-link:focus-visible {
  color: #fff;
}

.nav-link:hover::after,
.nav-link:focus-visible::after,
.nav-link.active::after {
  transform: scaleX(1);
}

.nav-dropdown-wrap { position: relative; }

.dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  background: #fff;
  border-radius: 8px;
  padding: 0.5rem;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-8px);
  transition: opacity 0.2s ease, transform 0.2s ease-out;
}

.nav-dropdown-wrap:hover .dropdown {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown { transition: opacity 0.15s ease; transform: none; }
  .nav-link::after { transition: none; }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why is "transition: all 0.3s" considered a performance anti-pattern?',
    options: [
      'It only works in Chrome, not Firefox',
      'It makes the browser watch every property for changes, wasting style recalculations',
      'It cannot animate transform or opacity',
      'It applies an incorrect easing function',
    ],
    answer: 1,
    explanation: '"all" causes the browser to check every property for changes on every frame. Specifying exact properties (e.g., "background 0.3s, transform 0.3s") limits the work to only what changes.',
  },
  {
    q: 'Where should you define the transition property for a two-way animation?',
    options: [
      'Only on the :hover pseudo-class',
      'On the :hover and :active pseudo-classes',
      'On the base element (not the :hover rule)',
      'In a @keyframes rule',
    ],
    answer: 2,
    explanation: 'Defining transition on the base state means it runs both when entering the new state (hover in) and when returning to the base state (hover out). On :hover only = one-way snap on exit.',
  },
  {
    q: 'Which two properties should you prefer for transitions to avoid layout cost?',
    options: [
      'width and height',
      'top and left',
      'transform and opacity',
      'margin and padding',
    ],
    answer: 2,
    explanation: 'transform and opacity are handled by the GPU compositor layer — no layout recalculation or repaint needed. All other properties trigger at least paint, and many trigger full layout.',
  },
  {
    q: 'What does transition-delay: -0.2s do?',
    options: [
      'Causes a CSS syntax error',
      'Prevents the transition from playing',
      'Starts the transition 0.2s into its cycle, skipping the first 0.2s',
      'Speeds up the transition by 0.2 seconds',
    ],
    answer: 2,
    explanation: 'A negative delay starts the transition mid-cycle. On a 0.5s transition with -0.2s delay, the animation begins at the 0.2s point. Useful for staggered lists.',
  },
  {
    q: 'A drawer component uses "transition: width 0.3s ease". What is the problem?',
    options: [
      'width cannot be transitioned',
      'Transitioning width triggers expensive layout recalculations on every frame',
      'The timing function ease does not work with width',
      'There is no problem — this is the recommended approach',
    ],
    answer: 1,
    explanation: 'width (and height) trigger layout reflow on every animation frame, which is expensive at 60fps. Use transform: translateX(-100%) to scaleX(1) instead — same visual effect, GPU compositor only.',
  },
  {
    q: 'Which CSS rule ensures keyboard users see the same transition feedback as mouse users?',
    options: [
      ':hover alone',
      ':focus with display:none',
      ':hover, :focus-visible with the same rules',
      ':active with pointer-events: none',
    ],
    answer: 2,
    explanation: 'Keyboard users trigger :focus-visible (not :hover). Combining both selectors with the same visual rules ensures everyone sees the animated state change, regardless of input device.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between a CSS transition and a CSS animation?',
    a: 'Transitions respond to state changes (like :hover or a class toggle) — they animate from A to B with one timing definition. Animations use @keyframes to define multiple intermediate steps, can play automatically without a trigger, loop infinitely, and give you fine-grained control over each keyframe.',
  },
  {
    q: 'Can I transition display: none to display: block?',
    a: 'Not directly — display is a discrete property that snaps between states. Use opacity: 0 (visually hidden) combined with pointer-events: none (interaction disabled) instead. For true remove from flow, combine with a max-height or height transition, or use the View Transitions API for more complex scenarios.',
  },
  {
    q: 'When should I use cubic-bezier() instead of the keyword easings?',
    a: 'When you need custom motion character — a spring overshoot (cubic-bezier(0.34, 1.56, 0.64, 1)), a very slow start, or precise control over the acceleration curve. The four keyword values (ease, ease-in, ease-out, ease-in-out) cover most UI needs; cubic-bezier() is for branded or highly crafted motion.',
  },
  {
    q: 'How do I stagger transitions for a list of items?',
    a: 'Apply increasing transition-delay values using :nth-child: .item:nth-child(1) { transition-delay: 0s } .item:nth-child(2) { transition-delay: 0.05s } etc. For dynamic lists, set the delay via a CSS custom property set in JavaScript: el.style.setProperty("--delay", i * 50 + "ms").',
  },
  {
    q: 'Why does my box-shadow transition look laggy compared to transform?',
    a: 'box-shadow triggers paint on every frame — the browser redraws the element at each step. For smoother shadow transitions, create the shadow as a pseudo-element (::after) and transition its opacity instead, which is GPU-compositor only. Alternatively, use filter: drop-shadow() which also paints but performs better in some browsers.',
  },
  {
    q: 'Is there a way to detect when a CSS transition finishes in JavaScript?',
    a: 'Yes — listen for the transitionend event on the element. It fires once per transitioned property, so if you are transitioning both transform and opacity, you get two events. Check event.propertyName to act on a specific one. The transitioncancel event fires if the transition is interrupted before completing.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS transitions animate property changes between states — define them on the base element, use transform/opacity for GPU performance, and always cover :focus-visible alongside :hover.',
  mustKnow: [
    'transition shorthand: property duration timing-function delay — defined on the BASE state for two-way animation.',
    'Only transform and opacity run on the GPU compositor — avoid transitioning width/height/top/left.',
    'transition: all is a performance anti-pattern — always list specific properties.',
    'Every :hover transition must have a matching :focus-visible rule for keyboard accessibility.',
    'Respect prefers-reduced-motion by wrapping motion transitions in @media (prefers-reduced-motion: no-preference).',
    'Negative transition-delay starts the transition mid-cycle — useful for staggered lists.',
  ],
  interviewFocus: [
    'Why is "transition: all" bad for performance?',
    'Which CSS properties are GPU-compositor-only and why does it matter?',
    'How do you ensure CSS transitions are accessible for keyboard and reduced-motion users?',
    'What is the difference between a CSS transition and a CSS animation (@keyframes)?',
  ],
};

@Component({
  selector: 'app-css-transitions',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './transitions.html',
  styleUrl: './transitions.scss',
})
export class CssTransitions {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
