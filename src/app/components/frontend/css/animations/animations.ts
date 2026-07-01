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
  { name: '@keyframes',                    type: 'syntax',   desc: 'Define animation states: from/to or percentage stops (0%, 50%, 100%).' },
  { name: 'animation-name',               type: 'keyword',  desc: 'References the @keyframes rule by name.' },
  { name: 'animation-duration',           type: 'keyword',  desc: 'How long one cycle takes: 0.3s, 1s, 400ms.' },
  { name: 'animation-timing-function',    type: 'keyword',  desc: 'Easing: ease, ease-in-out, linear, cubic-bezier(), steps().' },
  { name: 'animation-delay',              type: 'keyword',  desc: 'Wait before starting. Negative delay starts mid-animation.' },
  { name: 'animation-iteration-count',    type: 'keyword',  desc: 'Repeat count: 1, 3, infinite.' },
  { name: 'animation-fill-mode',          type: 'keyword',  desc: 'forwards: keep last frame after animation ends. backwards: apply first frame during delay.' },
  { name: 'animation-direction',          type: 'keyword',  desc: 'normal, reverse, alternate, alternate-reverse.' },
  { name: 'animation-play-state',         type: 'keyword',  desc: 'running or paused — toggle with JS or :hover.' },
  { name: 'will-change: transform',       type: 'keyword',  desc: 'Hints browser to promote element to GPU layer — use sparingly.' },
];

const theory: TheoryPoint[] = [
  {
    heading: '@keyframes and the Animation Shorthand',
    points: [
      '@keyframes defines the intermediate states of an animation using percentage stops or from/to.',
      'The animation shorthand order: name duration timing-function delay iteration-count direction fill-mode play-state.',
      'animation: slidein 0.4s ease-out both — name, duration, easing, fill-mode.',
      'Multiple animations on one element: separate with commas — animation: fadeIn 0.3s, slideUp 0.5s 0.1s.',
      'Keyframe offsets can be non-linear — 0%, 70%, 100% creates a fast movement that slows near the end.',
    ],
  },
  {
    heading: 'Performance: Compositor-Only Properties',
    points: [
      'Only two properties animate on the GPU compositor thread without triggering layout or paint: transform and opacity.',
      'Animating width, height, top, left, margin, or padding triggers layout (reflow) on every frame — expensive at 60fps.',
      'Use transform: translateX() instead of left, transform: scaleX() instead of width, opacity instead of display.',
      'will-change: transform promotes the element to its own GPU layer before the animation starts — reduces jank on first frame.',
      'Overusing will-change increases memory consumption — apply only to elements that actively animate.',
    ],
  },
  {
    heading: 'Timing Functions and Easing',
    points: [
      'linear: constant speed — good for spinners and progress bars, looks robotic for UI transitions.',
      'ease (default): starts fast, ends slow — natural for most UI movements.',
      'ease-in: slow start, fast end — feels like something being pulled into the screen.',
      'ease-out: fast start, slow end — feels natural when elements enter the viewport.',
      'cubic-bezier(x1,y1,x2,y2): custom easing curve. Use cubic-bezier.com to visualise.',
      'steps(n, start|end): discrete steps — good for sprite sheet animations and typewriter effects.',
    ],
  },
  {
    heading: 'Animation Fill Mode and Direction',
    points: [
      'animation-fill-mode: none (default) — element returns to its original state after animation.',
      'forwards: element retains the values from the last keyframe after animation completes.',
      'backwards: element applies the first keyframe values during the delay period.',
      'both: combines forwards and backwards — usually the most useful setting.',
      'animation-direction: alternate — plays forward then reverse on each cycle, creating a ping-pong effect.',
      'Negative animation-delay: -0.5s starts the animation 0.5s into its cycle — useful for staggered starts.',
    ],
  },
  {
    heading: 'Animating Performantly: Compositor-Only Properties',
    points: [
      'Animating transform and opacity can run entirely on the GPU compositor thread, without triggering layout recalculation or repaint on the main thread — this is why these two properties are the standard recommendation for smooth, jank-free CSS animations.',
      'Animating layout-affecting properties (width, height, top, left, margin) forces the browser to recalculate layout for the animated element and everything affected by it on every single frame — noticeably more expensive and prone to dropped frames, especially on lower-powered devices.',
      'Use will-change sparingly and only immediately before an animation starts — it hints to the browser to prepare a separate compositor layer in advance, but overusing it on many elements simultaneously consumes excessive GPU memory and can paradoxically hurt performance.',
      'The Chrome DevTools Performance panel and the "Paint flashing" / "Layout Shift Regions" overlays are the definitive way to verify whether an animation is actually running on the compositor or triggering expensive main-thread layout/paint work.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: '@keyframes Fundamentals',
    language: 'css',
    code: `/* Basic fade-in and slide-up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeInUp 0.4s ease-out both;
}

/* Multi-stop keyframes */
@keyframes bounce {
  0%, 100% { transform: translateY(0);    animation-timing-function: ease-out; }
  40%       { transform: translateY(-30px); animation-timing-function: ease-in;  }
  70%       { transform: translateY(-15px); animation-timing-function: ease-out; }
}

.icon { animation: bounce 1.2s infinite; }

/* Staggered list items */
.list-item:nth-child(1) { animation: fadeInUp 0.4s ease-out 0.0s both; }
.list-item:nth-child(2) { animation: fadeInUp 0.4s ease-out 0.1s both; }
.list-item:nth-child(3) { animation: fadeInUp 0.4s ease-out 0.2s both; }`,
  },
  {
    label: 'Performant Animations',
    language: 'css',
    code: `/* Always animate transform + opacity — never position properties */

/* BAD — triggers layout on every frame */
.bad-slide {
  position: relative;
  animation: badSlide 0.4s ease-out;
}
@keyframes badSlide {
  from { left: -100px; }
  to   { left: 0; }
}

/* GOOD — GPU compositor only */
.good-slide {
  animation: goodSlide 0.4s ease-out;
}
@keyframes goodSlide {
  from { transform: translateX(-100px); opacity: 0; }
  to   { transform: translateX(0);      opacity: 1; }
}

/* Pre-promote animated element to GPU layer */
.spinner {
  will-change: transform;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Reset will-change after animation ends */
.spinner.stopped { will-change: auto; }`,
  },
  {
    label: 'Custom Easing & Timing',
    language: 'css',
    code: `/* cubic-bezier for spring-like motion */
.spring-in {
  animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes slideIn {
  from { transform: scale(0.8) translateY(10px); opacity: 0; }
  to   { transform: scale(1)   translateY(0);    opacity: 1; }
}

/* steps() for typewriter effect */
.typewriter {
  width: 20ch;
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid;
  animation:
    typing 2s steps(20, end) both,
    blink 0.75s step-end infinite;
}
@keyframes typing {
  from { width: 0; }
  to   { width: 20ch; }
}
@keyframes blink {
  from, to { border-color: transparent; }
  50%       { border-color: currentColor; }
}

/* Pausing with play-state */
.card:hover .icon {
  animation-play-state: paused;
}`,
  },
  {
    label: 'Reduced Motion',
    language: 'css',
    code: `/* Always wrap animations in a prefers-reduced-motion check */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Default: full animation */
.hero { animation: fadeInUp 0.6s ease-out both; }

/* Reduced: instant opacity fade — no movement */
@media (prefers-reduced-motion: reduce) {
  .hero {
    animation: fadeIn 0.2s ease-out both;
  }
  /* Or disable entirely */
  .spinner { animation: none; }
}

/* Alternative: define animations only when motion is ok */
@media (prefers-reduced-motion: no-preference) {
  .card { animation: fadeInUp 0.4s ease-out both; }
  .nav  { transition: transform 0.3s ease; }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Animating layout properties (left/top/width)',
    wrong: `@keyframes slide { from { left: -200px; } to { left: 0; } }
.panel { position: relative; animation: slide 0.3s; }`,
    right: `@keyframes slide { from { transform: translateX(-200px); } to { transform: none; } }
.panel { animation: slide 0.3s; }`,
    explanation: 'Animating left/top/width/height triggers layout recalculation on every frame. transform and opacity run on the GPU compositor thread — no layout, no paint, smooth 60fps.',
  },
  {
    title: 'Forgetting animation-fill-mode: both',
    wrong: `/* Card jumps back to invisible after animation */
.card { animation: fadeInUp 0.4s ease-out; }`,
    right: `/* Card stays visible and starts from invisible state during any delay */
.card { animation: fadeInUp 0.4s ease-out both; }`,
    explanation: 'Without fill-mode, the element returns to its pre-animation state when the animation ends. "both" means: apply first keyframe during delay + retain last keyframe after completion.',
  },
  {
    title: 'Overusing will-change',
    wrong: `/* Applied to everything "for performance" */
* { will-change: transform; }`,
    right: `/* Only on elements that are actively animating */
.animated-card { will-change: transform; }
.animated-card.animation-done { will-change: auto; }`,
    explanation: 'will-change creates a new GPU layer for each element, consuming significant memory. Apply only to the specific elements about to animate, and remove it after the animation ends.',
  },
  {
    title: 'No reduced-motion fallback',
    wrong: `/* Plays for everyone including users who get motion sick */
.hero { animation: panLeft 3s ease infinite; }`,
    right: `@media (prefers-reduced-motion: no-preference) {
  .hero { animation: panLeft 3s ease infinite; }
}`,
    explanation: 'Users with vestibular disorders, epilepsy, or motion sensitivity rely on the prefers-reduced-motion setting. Wrapping animations in no-preference is the safest pattern — opt-in to motion rather than opting out.',
  },
  {
    title: 'Using display or visibility in keyframes',
    wrong: `@keyframes show { from { display: none; } to { display: block; } }`,
    right: `@keyframes show { from { opacity: 0; } to { opacity: 1; } }`,
    explanation: 'display and visibility cannot be animated by CSS — they are discrete properties that jump between states. Use opacity (for visual fade) and combine with pointer-events: none if interaction needs to be disabled.',
  },
];

const challenge: Challenge = {
  title: 'Notification Toast Animation',
  language: 'html',
  description: 'Build a notification toast that: (1) Slides in from the right using only transform and opacity. (2) Stays visible for a moment, then auto-dismisses by sliding back out. (3) Has a progress bar that shrinks over the display duration. (4) Respects prefers-reduced-motion (fade only, no slide).',
  hints: [
    'Use animation-fill-mode: both so the toast starts off-screen before sliding in.',
    'Chain animations with comma syntax: slideIn 0.3s ease-out, slideOut 0.3s ease-in 3s both.',
    'The progress bar shrink can use a simple width: 100% to 0% keyframe (exception: ok for a progress bar since layout is only recalculated once).',
    'Wrap the slide transforms in @media (prefers-reduced-motion: no-preference).',
  ],
  starterCode: `.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #1e293b;
  color: #fff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  min-width: 250px;
}

.toast-progress {
  height: 3px;
  background: #6366f1;
  margin-top: 0.5rem;
  border-radius: 2px;
}`,
  solution: `@keyframes slideInRight {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes slideOutRight {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(110%); opacity: 0; }
}
@keyframes shrink {
  from { width: 100%; }
  to   { width: 0%; }
}
@keyframes fadeOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #1e293b;
  color: #fff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  min-width: 250px;
  animation:
    slideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both,
    slideOutRight 0.35s ease-in 3s both;
}

.toast-progress {
  height: 3px;
  background: #6366f1;
  margin-top: 0.5rem;
  border-radius: 2px;
  animation: shrink 3s linear 0.35s both;
}

/* Reduced motion: fade only */
@media (prefers-reduced-motion: reduce) {
  .toast {
    animation:
      none,
      fadeOut 0.3s ease 3s both;
  }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which two CSS properties can be animated without triggering layout or paint?',
    options: [
      'width and height',
      'top and left',
      'transform and opacity',
      'margin and padding',
    ],
    answer: 2,
    explanation: 'Only transform and opacity can be animated on the GPU compositor thread, bypassing layout and paint. Animating any other property triggers expensive recalculations on every frame.',
  },
  {
    q: 'What does animation-fill-mode: both do?',
    options: [
      'Plays the animation both forwards and backwards simultaneously',
      'Applies the first keyframe during any delay and retains the last keyframe after completion',
      'Runs two animations at the same time',
      'Sets animation-direction to alternate',
    ],
    answer: 1,
    explanation: '"both" combines backwards (first keyframe during delay) and forwards (last keyframe persists after animation). This is usually what you want for enter/exit animations.',
  },
  {
    q: 'What is the purpose of will-change: transform?',
    options: [
      'It starts the transform animation automatically',
      'It tells the browser to promote the element to its own GPU compositor layer before animation starts',
      'It forces the element to use hardware acceleration for all CSS properties',
      'It makes the transform property animatable',
    ],
    answer: 1,
    explanation: 'will-change hints the browser to create a GPU layer ahead of time, preventing the jank that happens on the first animation frame when the browser creates the layer mid-animation.',
  },
  {
    q: 'Which timing function creates discrete, stepped animation (like a sprite sheet)?',
    options: [
      'cubic-bezier()',
      'ease-steps()',
      'steps()',
      'linear-steps()',
    ],
    answer: 2,
    explanation: 'steps(n, start|end) divides the animation into n equal discrete jumps. Perfect for sprite sheet animations, typewriter text effects, and any animation that needs to snap between states.',
  },
  {
    q: 'What is the correct way to handle CSS animations for users who prefer reduced motion?',
    options: [
      'Remove all animations completely using JavaScript',
      'Use @media (prefers-reduced-motion: reduce) to disable or simplify animations',
      'Use @media (prefers-color-scheme: reduce) to detect the setting',
      'Add animation: none !important to all elements',
    ],
    answer: 1,
    explanation: 'prefers-reduced-motion: reduce fires when the user has enabled "Reduce Motion" in their OS settings. Wrap animations in no-preference (opt-in) or remove/simplify them in reduce to respect this preference.',
  },
  {
    q: 'A negative animation-delay of -0.5s on a 2s animation will:',
    options: [
      'Play the animation backwards for 0.5s before going forward',
      'Start the animation 0.5 seconds into its cycle, skipping the first 0.5s',
      'Delay the animation start by 0.5 seconds',
      'Throw a CSS syntax error',
    ],
    answer: 1,
    explanation: 'A negative delay starts the animation mid-cycle. -0.5s on a 2s animation means the animation begins at the 0.5s point of the keyframes. Useful for staggered list animations to avoid all items waiting the same delay.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use CSS animations vs CSS transitions?',
    a: 'Transitions: simple A→B state changes triggered by events (hover, focus, class toggled by JS) — one-off with no keyframe control needed. Animations: multi-step sequences, looping, auto-playing on load, or anything requiring more than two states. If you need to define intermediate steps or play without a trigger, use @keyframes.',
  },
  {
    q: 'What causes animation jank and how do I fix it?',
    a: 'Jank (dropped frames) usually comes from: (1) Animating non-compositor properties like width, height, top, left — fix by using transform equivalents. (2) Animating too many elements simultaneously — reduce count or stagger. (3) JavaScript running on the main thread during the animation — move to Web Worker or reduce work. (4) First-frame jank on complex GPU promotions — add will-change before the animation starts.',
  },
  {
    q: 'How do I chain animations in sequence?',
    a: 'Use animation-delay equal to the duration of the previous animation. Two 0.4s animations in sequence: animation: firstAnim 0.4s both, secondAnim 0.4s 0.4s both. The second delay of 0.4s waits for the first to complete. For complex sequences, the Web Animations API (element.animate()) or a CSS animation library like Motion One gives better control.',
  },
  {
    q: 'What is the Web Animations API and when should I use it?',
    a: 'The Web Animations API (WAAPI) lets you control CSS animations from JavaScript: play, pause, reverse, seek, and respond to finish/cancel events. element.animate([{transform: "translateX(0)"}, {transform: "translateX(100px)"}], {duration: 300}) creates an animation programmatically. Use it when you need JS control over animation playback, dynamic values at runtime, or animation finished callbacks.',
  },
  {
    q: 'Why does my animation "flash" at the start or end?',
    a: 'This is typically a fill-mode issue. Without animation-fill-mode: both, the element resets to its original CSS values before the first keyframe (visible flash at start if there\'s a delay) and after the last keyframe (element jumps back). Set fill-mode: both for enter animations that fade in, or forwards for exit animations that should stay hidden.',
  },
  {
    q: 'How do I create a loading spinner with CSS?',
    a: 'Rotate the element with transform: rotate(360deg) in a keyframe on a circle with a gap. Use animation-timing-function: linear (not ease) to keep constant speed. Add will-change: transform for GPU promotion. Always add aria-label="Loading" and role="status" on the spinner element for accessibility, and include a visually-hidden "Loading..." text.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS animations use @keyframes for multi-step sequences — only animate transform and opacity for 60fps performance, always provide a prefers-reduced-motion fallback.',
  mustKnow: [
    'Only transform and opacity animate on the GPU compositor — everything else triggers layout or paint.',
    '@keyframes define animation states; the animation shorthand wires them to elements.',
    'animation-fill-mode: both is usually what you want — applies first frame during delay, retains last frame after.',
    'will-change: transform promotes to GPU layer before animation — use sparingly, remove after.',
    'Negative animation-delay starts mid-cycle — useful for staggering lists without long wait times.',
    'prefers-reduced-motion: reduce must disable or simplify significant animations for accessibility.',
  ],
  interviewFocus: [
    'Which CSS properties can be animated without triggering layout? Why?',
    'Explain animation-fill-mode: both and when you need it.',
    'How do you handle accessibility for CSS animations?',
    'What is the difference between CSS transitions and CSS animations?',
  ],
};

@Component({
  selector: 'app-css-animations',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './animations.html',
  styleUrl: './animations.scss',
})
export class CssAnimations {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
