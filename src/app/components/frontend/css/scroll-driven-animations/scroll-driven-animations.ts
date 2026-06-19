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
  { name: 'animation-timeline: scroll()',    type: 'syntax', desc: 'Links animation progress to the scroll position of a scroll container.' },
  { name: 'animation-timeline: view()',      type: 'syntax', desc: 'Links animation progress to the element\'s position within its scroll container (enter/exit).' },
  { name: 'scroll-timeline-name',            type: 'keyword', desc: 'Names a custom scroll timeline on a scroll container for use by descendant elements.' },
  { name: 'view-timeline-name',              type: 'keyword', desc: 'Names a custom view timeline on an element, usable by other elements.' },
  { name: 'animation-range: entry 0% exit 100%', type: 'syntax', desc: 'Sets start/end of the animation within the timeline. entry/exit/cover/contain phases.' },
  { name: 'scroll(root block)',              type: 'syntax', desc: 'scroll(scroller axis) — scroller: nearest|root|self; axis: block|inline|x|y.' },
  { name: 'view() inset',                   type: 'syntax', desc: 'view(axis inset) — inset shrinks the intersection area (like intersection observer rootMargin).' },
  { name: '@keyframes (unchanged)',          type: 'keyword', desc: 'Standard @keyframes — progress through them is driven by scroll/view instead of time.' },
  { name: 'animation-timeline: --my-tl',    type: 'syntax', desc: 'Reference a named scroll or view timeline defined elsewhere in the tree.' },
  { name: 'timeline-scope',                 type: 'keyword', desc: 'Expands the scope of a named timeline to ancestor elements (allows cross-subtree timelines).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Scroll-Driven Animations — What and Why',
    points: [
      'CSS scroll-driven animations link @keyframes animation progress to a scroll position rather than to time. No JavaScript, no IntersectionObserver, no scroll event listeners.',
      'Two timeline types: scroll() links to the scroll container\'s position (progress bar pattern); view() links to the element\'s visibility within the scroller (reveal-on-scroll pattern).',
      'The browser composes scroll-driven animations entirely on the compositor thread — no main-thread layout, no jank, even under heavy JS load.',
      'Browser support: Chrome 115+, Firefox 110+, Safari 18+ (2024). Use @supports (animation-timeline: scroll()) for progressive enhancement.',
      'Scroll-driven animations replace the common pattern of: addEventListener("scroll"), IntersectionObserver, GSAP ScrollTrigger, anime.js scroll helpers — for many common effects, pure CSS is now sufficient.',
    ],
  },
  {
    heading: 'scroll() Timeline — Scroll Progress',
    points: [
      'animation-timeline: scroll() ties the animation to the nearest scrollable ancestor\'s position. 0% = top of scroll range, 100% = bottom.',
      'scroll(root block) uses the document scroll on the block axis — ideal for a top-of-page reading progress bar.',
      'Combine with animation-fill-mode: both so the start keyframe applies before scrolling and the end keyframe persists after.',
      'No animation-duration needed when using a scroll timeline (or set it to auto). Duration becomes meaningless — progress is positional.',
      'The reading progress bar: position:fixed element, width driven by scaleX(0) → scaleX(1), animation-timeline: scroll(root).',
    ],
  },
  {
    heading: 'view() Timeline — Element Visibility',
    points: [
      'animation-timeline: view() ties the animation to the element\'s own position inside the scroll container. The "timeline" runs as the element enters and exits the viewport.',
      'animation-range controls which phase triggers: entry (entering view), exit (leaving view), cover (fully in view), contain (element smaller than scroller covers it), or entry 0% exit 100%.',
      'For reveal-on-scroll: animation-range: entry 0% entry 100% — animate during the entry phase only.',
      'Named view timelines (view-timeline-name) allow other elements (e.g. a sticky header) to respond to a sibling\'s scroll position.',
      'Inset on view() reduces the active zone: view(block 20%) means 20% of the scroller height is excluded from each end.',
    ],
  },
  {
    heading: 'Named Timelines and timeline-scope',
    points: [
      'scroll-timeline-name: --hero and view-timeline-name: --card create named timelines that descendant elements can reference by animation-timeline: --hero.',
      'Problem: by default, a child can only access timelines from ancestors. Siblings cannot share timelines.',
      'timeline-scope: --hero on a common ancestor promotes the timeline to that ancestor\'s scope, making it available to any descendant in that subtree.',
      'Use case: a sticky nav that changes style when a specific section enters the view — the nav references a named view timeline on the section, with timeline-scope on a shared ancestor.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reading Progress Bar',
    language: 'css',
    code: `/* Reading progress bar — classic scroll() use case */
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  width: 100%;
  background: #264de4;
  transform-origin: left;
  transform: scaleX(0);

  /* Link animation to page scroll progress */
  animation: progress-grow linear;
  animation-timeline: scroll(root block);
  animation-fill-mode: both;

  /* No duration needed — time-based duration is ignored for scroll timelines */
}

@keyframes progress-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

/* The minimal HTML needed */
/* <div class="progress-bar"></div> — fixed, no JS required */`,
  },
  {
    label: 'Reveal on Scroll',
    language: 'css',
    code: `/* Reveal-on-scroll cards using view() timeline */
.reveal-card {
  opacity: 0;
  transform: translateY(40px);

  animation: reveal-card-in linear both;
  animation-timeline: view();
  /* Start animating as the element enters view, finish when fully entered */
  animation-range: entry 0% entry 80%;
}

@keyframes reveal-card-in {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Staggered — use nth-child animation-delay */
.reveal-card:nth-child(2) { animation-delay: 50ms;  }
.reveal-card:nth-child(3) { animation-delay: 100ms; }

/* Progressive enhancement: skip animation if not supported */
@supports not (animation-timeline: view()) {
  .reveal-card {
    opacity: 1;
    transform: none;
  }
}`,
  },
  {
    label: 'Parallax & Sticky Effects',
    language: 'css',
    code: `/* Parallax hero image — moves slower than the page */
.parallax-hero {
  /* Element scrolls at its normal rate */
}

.parallax-hero img {
  animation: parallax-scroll linear both;
  animation-timeline: view();
  animation-range: entry 0% exit 100%;
}

@keyframes parallax-scroll {
  /* Image moves only half as fast as the page */
  from { transform: translateY(-20%); }
  to   { transform: translateY(20%); }
}

/* ——————————————————————————————————————— */

/* Sticky element that changes when a section is in view */
/* HTML: <div id="page"><header>…</header><section id="hero">…</section></div> */

/* Named view timeline on the hero section */
#hero {
  view-timeline-name: --hero-tl;
}

/* Promote the timeline to the common ancestor */
#page {
  timeline-scope: --hero-tl;
}

/* Header responds to the hero section's position */
header {
  animation: header-dark linear both;
  animation-timeline: --hero-tl;
  animation-range: contain 0% contain 100%;
}

@keyframes header-dark {
  from { background: transparent; color: white; }
  to   { background: white; color: #111; }
}`,
  },
  {
    label: 'animation-range Phases',
    language: 'css',
    code: `/* animation-range controls WHEN within the timeline the animation runs */

/*
  For view() timeline phases (element vs scroll container):
  ┌─────────────────────────────────────────┐
  │           SCROLL CONTAINER              │
  │  ───────────────────────────────────── ← exit 100%
  │                                         │
  │  ─────────────── ← contain 100% / cover 50%
  │                                         │
  │  ███████████████  ← element fully in viewport
  │                                         │
  │  ─────────────── ← contain 0% / cover 50%
  │                                         │
  │  ───────────────────────────────────── ← entry 0%
  │                                         │
  └─────────────────────────────────────────┘
*/

/* entry: element entering the scroll container */
.fade-in {
  animation: fade linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

/* exit: element leaving */
.fade-out {
  animation: fade-reverse linear both;
  animation-timeline: view();
  animation-range: exit 0% exit 100%;
}

/* cover: run animation while element is covering the viewport */
.parallax {
  animation: parallax-effect linear both;
  animation-timeline: view();
  animation-range: cover 0% cover 100%;
}

@keyframes fade          { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-reverse  { from { opacity: 1; } to { opacity: 0; } }
@keyframes parallax-effect { from { transform: scale(1.1); } to { transform: scale(1); } }`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Setting animation-duration for scroll-driven animations',
    wrong: `/* Duration is meaningless and confusing here */
.progress {
  animation: grow 2s linear;
  animation-timeline: scroll(root);
}`,
    right: `/* Omit duration or set auto — progress is positional, not time-based */
.progress {
  animation: grow linear;
  animation-timeline: scroll(root);
}`,
    explanation: 'When animation-timeline is a scroll or view timeline, the animation-duration in seconds is irrelevant — the animation progress is driven by scroll position, not elapsed time. Leaving it on causes confusion; omit it or set it to "auto".',
  },
  {
    title: 'Using scroll-driven animations without progressive enhancement',
    wrong: `/* No fallback — invisible content on unsupported browsers */
.card {
  opacity: 0;
  transform: translateY(40px);
  animation: reveal linear both;
  animation-timeline: view();
}`,
    right: `/* Ensure content is visible without scroll-driven animation support */
.card {
  opacity: 0;
  transform: translateY(40px);
  animation: reveal linear both;
  animation-timeline: view();
}

@supports not (animation-timeline: view()) {
  .card { opacity: 1; transform: none; }
}`,
    explanation: 'CSS scroll-driven animations are supported in Chrome 115+ / Firefox 110+ / Safari 18+. In older browsers, opacity: 0 or transform: translateY(40px) persists permanently with no scroll — content becomes invisible. Always add a @supports not() fallback that restores visibility.',
  },
  {
    title: 'Animating layout-triggering properties on the scroll timeline',
    wrong: `/* width/height cause layout — defeats compositor optimization */
@keyframes bad-scroll {
  from { height: 100px; }
  to   { height: 300px; }
}`,
    right: `/* Transform and opacity run on the compositor thread */
@keyframes good-scroll {
  from { transform: scaleY(0.3); opacity: 0; }
  to   { transform: scaleY(1);   opacity: 1; }
}`,
    explanation: 'The main benefit of scroll-driven animations is compositor-thread execution — no main-thread jank. Animating layout properties (width, height, top, padding) forces the main thread back in, losing this advantage. Stick to transform and opacity, just like regular GPU-composited animations.',
  },
  {
    title: 'Expecting siblings to share timelines without timeline-scope',
    wrong: `/* Sibling elements cannot see each other's view timelines */
.section { view-timeline-name: --my-tl; }
.sidebar  { animation-timeline: --my-tl; }  /* --my-tl is not in .sidebar's ancestor chain */`,
    right: `/* Promote the timeline to the common ancestor */
.page     { timeline-scope: --my-tl; }      /* now all descendants can reference it */
.section  { view-timeline-name: --my-tl; }
.sidebar  { animation-timeline: --my-tl; }  /* works — both are descendants of .page */`,
    explanation: 'Named timelines (scroll-timeline-name / view-timeline-name) are only visible to descendant elements by default. To share a timeline between siblings or across subtrees, declare timeline-scope on their lowest common ancestor. This expands the timeline\'s visibility to that ancestor\'s entire subtree.',
  },
];

const challenge: Challenge = {
  title: 'Build a Scroll-Driven Reveal Gallery',
  language: 'html',
  description: 'Build a vertically scrolling image gallery where: (1) A fixed reading progress bar at the top of the page fills from left to right as you scroll. (2) Each gallery card fades in and slides up as it enters the viewport. (3) Add a @supports not() fallback so cards are visible without scroll-driven animation support. Use only CSS — no JavaScript.',
  hints: [
    'Progress bar: position:fixed, height:4px, transform-origin:left, @keyframes from scaleX(0) to scaleX(1), animation-timeline: scroll(root block).',
    'Cards: animation-timeline: view(), animation-range: entry 0% entry 80% — fades in during the entry phase.',
    'Start with opacity:0 transform:translateY(32px) on cards, animate to opacity:1 transform:translateY(0).',
    'The @supports not (animation-timeline: view()) block should set opacity:1 and transform:none on the cards.',
  ],
  starterCode: `<style>
  /* Progress bar */
  .progress { }

  /* Gallery cards */
  .card {
    opacity: 0;
    transform: translateY(32px);
  }

  @keyframes reveal { }

  /* Fallback */
  @supports not (animation-timeline: view()) { }
</style>

<div class="progress"></div>

<div class="gallery">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
  <div class="card">Card 4</div>
  <div class="card">Card 5</div>
</div>`,
  solution: `<style>
  body { margin: 0; font-family: system-ui, sans-serif; }

  /* Reading progress bar */
  .progress {
    position: fixed;
    top: 0; left: 0;
    height: 4px;
    width: 100%;
    background: #264de4;
    transform-origin: left;
    transform: scaleX(0);
    z-index: 100;
    animation: progress-fill linear both;
    animation-timeline: scroll(root block);
  }
  @keyframes progress-fill {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  /* Gallery layout */
  .gallery {
    display: grid;
    gap: 2rem;
    padding: 3rem 1rem 6rem;
    max-width: 600px;
    margin: 0 auto;
  }

  /* Cards — start hidden */
  .card {
    height: 200px;
    background: linear-gradient(135deg, #264de4, #142b9c);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;

    opacity: 0;
    transform: translateY(32px);

    animation: reveal-card linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 80%;
  }

  @keyframes reveal-card {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Progressive enhancement fallback */
  @supports not (animation-timeline: view()) {
    .card {
      opacity: 1;
      transform: none;
    }
  }
</style>

<div class="progress"></div>

<div class="gallery">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
  <div class="card">Card 4</div>
  <div class="card">Card 5</div>
</div>`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does animation-timeline: scroll(root block) do?',
    options: [
      'Scrolls the root element to the bottom on animation completion',
      'Links the animation progress to the document\'s vertical scroll position',
      'Creates a named scroll timeline called "root"',
      'Triggers the animation when the root element is in the block formatting context',
    ],
    answer: 1,
    explanation: 'scroll(root block) links the animation progress to the root scroll container\'s block axis scroll position. 0% = scroll start, 100% = scroll end. "root" means the document scroller; "block" means the vertical axis.',
  },
  {
    q: 'What is the animation-range property used for in scroll-driven animations?',
    options: [
      'Sets the minimum and maximum scroll speed',
      'Defines which portion of the timeline the animation plays across',
      'Controls how many times the animation repeats during scrolling',
      'Specifies the scroll offset in pixels where the animation starts',
    ],
    answer: 1,
    explanation: 'animation-range sets when the animation starts and ends within its timeline. For view() timelines: entry 0% entry 100% plays during the entry phase; cover 0% cover 100% plays while the element covers the viewport. It accepts named phases (entry, exit, cover, contain) with percentage offsets.',
  },
  {
    q: 'Why should you add @supports not (animation-timeline: view()) when using scroll-driven reveals?',
    options: [
      'To improve performance on supported browsers',
      'Because elements start with opacity:0 and would be invisible on unsupported browsers',
      'To prevent the animation from running in forced-colors mode',
      'Because view() is deprecated in favor of scroll()',
    ],
    answer: 1,
    explanation: 'Reveal animations typically start with opacity:0 or a hidden transform. On browsers that don\'t support scroll-driven animations, those properties persist permanently — content is invisible forever. The @supports not() block restores visibility (opacity:1, transform:none) as a fallback.',
  },
  {
    q: 'What does animation-duration mean when animation-timeline is a scroll() timeline?',
    options: [
      'The number of seconds before the animation starts responding to scroll',
      'The scroll distance in pixels over which the animation plays',
      'It is irrelevant — progress is driven by scroll position, not time',
      'The timeout after which the animation resets if scrolling stops',
    ],
    answer: 2,
    explanation: 'When using a scroll timeline, animation progress is determined by scroll position, not elapsed time. The animation-duration value in seconds is ignored. You can omit it or set it to "auto". Only the @keyframes and animation-range determine how properties change.',
  },
  {
    q: 'What problem does timeline-scope solve?',
    options: [
      'It prevents named timelines from leaking into global scope',
      'It allows sibling elements to share a named timeline by promoting it to a common ancestor',
      'It limits the scroll distance a timeline can respond to',
      'It sets the default animation-range for all children',
    ],
    answer: 1,
    explanation: 'Named timelines (from scroll-timeline-name or view-timeline-name) are only accessible to descendants. Siblings cannot share them by default. timeline-scope declared on a common ancestor promotes the timeline to that ancestor\'s scope, allowing any descendant — including siblings of the timeline source — to reference it.',
  },
  {
    q: 'Which CSS properties should you prefer for scroll-driven animations for best performance?',
    options: [
      'width and height — the browser caches layout calculations for scroll events',
      'margin and padding — these are handled on the compositor thread',
      'transform and opacity — they run on the compositor thread without layout',
      'Any property — scroll-driven animations always run off the main thread',
    ],
    answer: 2,
    explanation: 'Like regular animations, scroll-driven animations perform best when animating transform and opacity. These run on the compositor thread without triggering layout or paint. Animating layout properties (width, height, top, padding) forces the main thread to recalculate, negating the performance advantage of scroll-driven animations.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How do scroll-driven animations compare to IntersectionObserver?',
    a: 'IntersectionObserver runs on the main thread in JavaScript — it fires an async callback when an element enters/exits the viewport. Scroll-driven animations are pure CSS, run on the compositor thread, and are synchronised with the scroll position. CSS is simpler for straightforward reveal-on-scroll and parallax effects. Use IntersectionObserver when you need JavaScript logic on intersection (lazy loading images, analytics events, complex conditional behaviour). For purely visual effects, CSS scroll-driven animations are faster and simpler.',
  },
  {
    q: 'What is the difference between scroll() and view() timelines?',
    a: 'scroll() ties animation progress to a scroll container\'s scroll position — 0% at the top, 100% at the bottom. It is for effects that track overall page scroll (reading progress bar, background colour shifts). view() ties animation progress to an individual element\'s visibility inside the scroll container — the timeline runs as the element enters and exits the viewport. It is for per-element effects (reveal cards, parallax on a specific image). The main difference: scroll() tracks the container; view() tracks the element.',
  },
  {
    q: 'Can I combine scroll-driven animations with existing CSS transitions?',
    a: 'Yes, with care. CSS transitions respond to state changes (hover, focus, class toggle) and are time-based. Scroll-driven animations are position-based. You can have both on the same element — they don\'t conflict. However, if the same property is being animated by both, the animation takes precedence over the transition. A common combination: use a scroll-driven animation to reveal an element (opacity/transform), then use a CSS transition for hover interactions on the same element.',
  },
  {
    q: 'How do I make a sticky header change style when a specific section scrolls past?',
    a: 'Use a named view timeline + timeline-scope: (1) Add view-timeline-name: --section-tl to the section. (2) Add timeline-scope: --section-tl to their common ancestor (e.g. body or the page wrapper). (3) Give the header animation-timeline: --section-tl with animation-range: contain 0% contain 100%. Now the header animation responds to the section\'s position in the viewport — when the section is fully in view, the animation runs. The key is timeline-scope making the timeline visible to the header (a sibling of the section).',
  },
  {
    q: 'What is the animation-range shorthand format?',
    a: 'animation-range accepts one or two values: animation-range: <start> <end>. Each value is a named phase keyword optionally followed by a percentage: entry, exit, cover, contain, or normal. Examples: entry 0% entry 100% (play during the entry phase), entry 0% exit 100% (play from first entry to last exit — the full journey through the viewport), cover 0% cover 50% (play only during the first half of the cover phase). Percentages offset within the named phase, not the full timeline.',
  },
  {
    q: 'Will scroll-driven animations work inside an Angular component?',
    a: 'Yes — scroll-driven animations are pure CSS and work in Angular component SCSS files like any other CSS. Add the animation properties in the component\'s styleUrl (.scss) file. No Angular-specific wiring is needed. Remember: the scroll container must be a real scrollable element (overflow: auto/scroll) or the document scroll. If your page uses a custom scroll container (e.g. a div with overflow-y: auto instead of the body), pass it to scroll() explicitly: animation-timeline: scroll(nearest block).',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Scroll-driven animations link @keyframes to scroll position (scroll()) or element visibility (view()) — compositor-threaded, no JS, no IntersectionObserver.',
  mustKnow: [
    'scroll() timeline: tied to scroll container position (0%=top, 100%=bottom). Use for reading progress bars.',
    'view() timeline: tied to element\'s position in the scroll container. Use for reveal-on-scroll effects.',
    'animation-range controls when the animation plays: entry, exit, cover, contain phases with percentage offsets.',
    'animation-duration is ignored on scroll timelines — progress is positional, not time-based.',
    'Always add @supports not (animation-timeline: view()) fallback when starting with opacity:0 or hidden transforms.',
    'Named timelines + timeline-scope allow siblings to share a timeline via their common ancestor.',
  ],
  interviewFocus: [
    'How does a scroll-driven animation differ from adding a scroll event listener in JavaScript?',
    'When would you use scroll() vs view() as the animation timeline?',
    'Why do scroll-driven animations running transform/opacity perform better than layout-property animations?',
    'How do you share a named timeline between sibling elements?',
  ],
};

@Component({
  selector: 'app-css-scroll-driven-animations',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './scroll-driven-animations.html',
  styleUrl: './scroll-driven-animations.scss',
})
export class CssScrollDrivenAnimations {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
