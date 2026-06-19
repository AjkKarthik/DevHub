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
  { name: 'translate(x, y)',         type: 'syntax', desc: 'Move element. translate(20px, 10px) or translateX/Y/Z. Uses GPU — no layout reflow.' },
  { name: 'rotate(deg)',             type: 'syntax', desc: 'Rotate around Z axis. rotate(45deg). rotateX/Y for 3D rotation.' },
  { name: 'scale(x, y)',             type: 'syntax', desc: 'Scale element. scale(1.5) = 150% both axes. scaleX/Y for one axis.' },
  { name: 'skew(x-deg, y-deg)',      type: 'syntax', desc: 'Shear/slant element along X and Y axes. skewX(20deg).' },
  { name: 'matrix(a,b,c,d,e,f)',     type: 'syntax', desc: '2D matrix transform — combines translate/rotate/scale/skew in one declaration.' },
  { name: 'perspective(n)',          type: 'syntax', desc: 'As a function in transform: sets the Z-distance for 3D effect on THIS element. 500–1200px is typical.' },
  { name: 'perspective (property)',  type: 'keyword', desc: 'As a CSS property on a PARENT: applies perspective to all 3D-transformed children.' },
  { name: 'transform-origin',        type: 'keyword', desc: 'Sets pivot point for rotation/scale. Default: 50% 50% (center). top left = 0 0.' },
  { name: 'transform-style: preserve-3d', type: 'keyword', desc: 'Required on a parent so children are rendered in 3D space (not flattened).' },
  { name: 'backface-visibility: hidden',  type: 'keyword', desc: 'Hides element when rotated past 90deg — key for card-flip effects.' },
  { name: 'translate / rotate / scale (individual)', type: 'keyword', desc: 'CSS individual transform properties (CSS4) — composable independently without overwriting each other.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'How CSS Transforms Work',
    points: [
      'Transforms change an element\'s position, size, or shape visually without affecting the document flow. The element\'s original space is preserved — neighbours don\'t shift.',
      'Transforms are applied in the order listed: transform: rotate(45deg) translateX(100px) is NOT the same as translateX(100px) rotate(45deg) — the local coordinate system rotates first.',
      'All 2D transform functions (translate, rotate, scale, skew) and their 3D equivalents run on the GPU compositor thread — no layout or paint is triggered. This makes transforms the preferred way to animate position.',
      'transform-origin sets the anchor point. For a card flip: transform-origin: center; for a hinge effect: transform-origin: left center.',
      'CSS4 individual transform properties (translate, rotate, scale as standalone properties) avoid the composition-order problem and can each be transitioned independently.',
    ],
  },
  {
    heading: '3D Transforms and Perspective',
    points: [
      'perspective() as a transform function applies perspective to a single element\'s 3D transforms. perspective as a CSS property applies to all 3D-transformed children of the element.',
      'Transform-style: preserve-3d on a parent causes children to exist in the same 3D space. Without it, 3D children are projected flat (transform-style: flat, the default).',
      'rotateX() tilts forward/backward (around the X axis), rotateY() flips left/right, rotateZ() = rotate().',
      'Card flip pattern: two child elements (front/back), parent has transform-style: preserve-3d, back has rotateY(180deg). Flipping the parent with rotateY(180deg) reveals the back.',
      'backface-visibility: hidden hides the element when its backface (the back of a 3D-rotated element) faces the viewer — prevents seeing the mirrored reverse of the front face through the flipped back.',
    ],
  },
  {
    heading: 'Performance and Compositing',
    points: [
      'transform and opacity are the two GPU-composited properties. Changing them never triggers layout or paint — the compositor handles them entirely, producing 60fps even under heavy JS load.',
      'will-change: transform tells the browser to promote the element to its own compositing layer before animation starts, avoiding the visual glitch of a late promotion. Use sparingly — each layer uses GPU memory.',
      'Compositing pitfall: transform creates a new stacking context. A transformed element with z-index may behave differently from a non-transformed one — check stacking order when mixing transforms and z-index.',
      'Avoid animating top/left/margin/width — these cause layout recalculation on every frame. Use translate() instead of top/left; scale() instead of width/height changes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: '2D Transforms',
    language: 'css',
    code: `/* All 2D transform functions */
.box {
  /* Move */
  transform: translate(50px, 20px);
  transform: translateX(50px);
  transform: translateY(20px);

  /* Rotate */
  transform: rotate(45deg);

  /* Scale */
  transform: scale(1.5);       /* both axes */
  transform: scaleX(2);        /* horizontal only */

  /* Skew */
  transform: skew(20deg, 10deg);

  /* Chained — applied RIGHT to LEFT (inner coordinate system) */
  transform: rotate(45deg) translateX(100px);
  /* ↑ translates 100px in the ROTATED x-direction, not the original x */
}

/* Individual transform properties (CSS4) — compose cleanly */
.card {
  translate: 50px 20px;  /* independent of rotate/scale */
  rotate: 45deg;
  scale: 1.1;

  /* Each can have its own transition */
  transition: translate .3s, rotate .5s, scale .2s;
}

/* Transform origin examples */
.rotate-from-corner { transform-origin: top left; }
.rotate-from-bottom { transform-origin: center bottom; }
.hinge              { transform-origin: left center; }`,
  },
  {
    label: '3D Transforms',
    language: 'css',
    code: `/* 3D perspective setup — perspective on the PARENT applies to all children */
.scene {
  perspective: 800px;           /* Z-distance to viewer — smaller = more dramatic */
  perspective-origin: 50% 50%;  /* vanishing point */
}

/* 3D rotate */
.cube-face {
  transform: rotateX(90deg);   /* tilt */
  transform: rotateY(45deg);   /* swing left/right */
  transform: rotateZ(30deg);   /* spin (= rotate()) */
}

/* ── Card Flip Pattern ── */
.flip-container {
  perspective: 1000px;
}

.flip-card {
  position: relative;
  width: 240px; height: 160px;
  transform-style: preserve-3d;  /* children exist in 3D space */
  transition: transform .6s ease;
}

.flip-card.flipped {
  transform: rotateY(180deg);
}

.flip-front,
.flip-back {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  backface-visibility: hidden;  /* hide back-face when rotated away */
}

.flip-front {
  background: #264de4;
  color: white;
}

.flip-back {
  background: #142b9c;
  color: white;
  transform: rotateY(180deg);  /* pre-rotate 180deg — visible after flip */
}`,
  },
  {
    label: 'Hover Animations',
    language: 'css',
    code: `/* GPU-composited hover effects using transform */

/* Lift / float card */
.card {
  transition: transform .25s ease, box-shadow .25s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0,0,0,0.14);
}

/* Rotate icon on hover */
.arrow-icon {
  display: inline-block;
  transition: transform .2s ease;
}
a:hover .arrow-icon {
  transform: translateX(4px);
}

/* Spin badge on hover */
.badge {
  display: inline-flex;
  transition: transform .4s cubic-bezier(.175,.885,.32,1.275);
}
.badge:hover {
  transform: rotate(360deg) scale(1.15);
}

/* Wiggle — shake effect with @keyframes */
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  15%       { transform: rotate(-6deg); }
  30%       { transform: rotate(6deg); }
  45%       { transform: rotate(-4deg); }
  60%       { transform: rotate(4deg); }
  75%       { transform: rotate(-2deg); }
}

.notification-bell:hover {
  animation: wiggle .5s ease;
}

/* will-change: pre-promote to GPU layer */
.animated-element {
  will-change: transform;  /* only add when animation is imminent */
}`,
  },
  {
    label: 'CSS4 Individual Properties',
    language: 'css',
    code: `/* CSS Individual Transform Properties — avoid order-dependency problems */

/* OLD — chained, order matters, hard to override one part */
.old-approach {
  transform: translateY(-8px) scale(1.05) rotate(3deg);
}

/* NEW — individual properties, each independently composable */
.new-approach {
  translate: 0 -8px;
  scale: 1.05;
  rotate: 3deg;
}

/* Real benefit: override one without rewriting the whole chain */
.btn {
  translate: 0 0;
  scale: 1;
  transition: translate .2s, scale .2s;
}
.btn:hover {
  translate: 0 -3px;  /* only translate changes */
  /* scale stays at 1 — no need to repeat it */
}

/* Animating into existence from a keyframe */
@keyframes pop-in {
  from {
    scale: 0;
    opacity: 0;
  }
  to {
    scale: 1;
    opacity: 1;
  }
}

.toast {
  animation: pop-in .3s cubic-bezier(.175,.885,.32,1.275) both;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Transform function order changing the result unexpectedly',
    wrong: `/* Intend to move right then rotate — but rotates the coordinate system first */
transform: rotate(90deg) translateX(100px);
/* Result: moves DOWN 100px (the rotated X axis points down) */`,
    right: `/* Translate first in the original coordinate system, then rotate */
transform: translateX(100px) rotate(90deg);

/* Or use individual properties — order-independent */
translate: 100px 0;
rotate: 90deg;`,
    explanation: 'CSS transforms are applied right-to-left (or equivalently, each transform changes the local coordinate system for subsequent ones). rotate(90deg) translateX(100px) first rotates the coordinate system by 90deg, so translateX(100px) moves down in the screen. Use individual properties (translate, rotate, scale) to avoid this.',
  },
  {
    title: 'Using top/left instead of translate for animation',
    wrong: `/* Layout-triggering — forces reflow on every frame, causes jank */
@keyframes slide-in {
  from { left: -100%; }
  to   { left: 0; }
}`,
    right: `/* Compositor-only — no layout, 60fps */
@keyframes slide-in {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}`,
    explanation: 'Animating top/left/margin triggers layout recalculation on every frame — the browser must recalculate positions for potentially the entire document. transform: translateX/Y runs entirely on the GPU compositor without touching layout or paint, producing smooth 60fps animations regardless of page complexity.',
  },
  {
    title: 'Forgetting transform-style: preserve-3d for nested 3D',
    wrong: `/* Parent clips 3D — children appear flat */
.card-container {
  perspective: 800px;
  /* Missing transform-style: preserve-3d */
}
.card {
  transform-style: preserve-3d;  /* has no effect — parent already flattened */
}`,
    right: `/* Each ancestor that needs children in 3D space must declare it */
.card-container {
  perspective: 800px;
  transform-style: preserve-3d;  /* children rendered in 3D */
}
.card {
  transform-style: preserve-3d;  /* grandchildren also in 3D */
}`,
    explanation: 'transform-style: preserve-3d must be set on every intermediate element in the 3D hierarchy. The default transform-style: flat causes an element to flatten all its 3D-transformed descendants onto its own plane, making depth effects invisible. For a card flip: the container AND the card must both have preserve-3d.',
  },
  {
    title: 'Overusing will-change: transform',
    wrong: `/* Adding will-change to every animated element */
* { will-change: transform; }
/* or: */
.card { will-change: transform; }  /* on 50 cards in a grid */`,
    right: `/* Add will-change just before animation is about to start */
.card:hover { will-change: transform; }
/* or via JS just before starting an animation, remove it after */`,
    explanation: 'will-change: transform tells the browser to promote the element to its own GPU compositing layer. This uses GPU memory. Applying it to every element (or statically to many elements) exhausts GPU memory and can actually decrease performance. Use it only on elements that are about to animate, and remove it when the animation is complete.',
  },
];

const challenge: Challenge = {
  title: 'Build an Interactive 3D Card Flip',
  language: 'html',
  description: 'Build a card flip component using CSS 3D transforms. Requirements: (1) A card with a front face (shows a CSS icon and title) and a back face (shows a description and a link). (2) Clicking the card flips it 180deg around the Y axis with a smooth 0.6s transition. (3) The back face must be invisible while the front is showing (backface-visibility: hidden). (4) Add a subtle hover lift effect (translateY + box-shadow) on the card container. No JavaScript state — use a checkbox hack or :focus-within to toggle the flip class.',
  hints: [
    'Structure: .flip-scene > .flip-card > .flip-front + .flip-back. The scene holds perspective, the card transforms, the faces have backface-visibility: hidden.',
    'The back face needs transform: rotateY(180deg) as its initial state — it starts pre-rotated so it is hidden.',
    'When the card is flipped: .flip-card.flipped { transform: rotateY(180deg); } — the back rotates to 0deg from the viewer\'s perspective.',
    'Use a hidden <input type="checkbox"> + label to toggle the .flipped class without JS, or use :has(input:checked) on the parent.',
  ],
  starterCode: `<style>
  .flip-scene {
    /* perspective here */
    width: 280px; height: 180px;
    cursor: pointer;
  }
  .flip-card {
    /* transition, transform-style */
    position: relative;
    width: 100%; height: 100%;
  }
  .flip-front, .flip-back {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    /* backface-visibility */
  }
  .flip-back {
    /* pre-rotate */
  }
  /* Toggle with :has() */
  .flip-scene:has(input:checked) .flip-card {
    /* flip transform */
  }
</style>

<div class="flip-scene">
  <input type="checkbox" id="flip" style="display:none">
  <label for="flip" style="position:absolute;inset:0;cursor:pointer;z-index:1"></label>
  <div class="flip-card">
    <div class="flip-front">Front</div>
    <div class="flip-back">Back</div>
  </div>
</div>`,
  solution: `<style>
  .flip-scene {
    perspective: 1000px;
    width: 280px;
    height: 180px;
    cursor: pointer;
    transition: transform .2s ease;
  }
  .flip-scene:hover {
    transform: translateY(-4px);
  }

  .flip-card {
    position: relative;
    width: 100%; height: 100%;
    transform-style: preserve-3d;
    transition: transform .6s cubic-bezier(.4, 0, .2, 1);
  }

  .flip-front, .flip-back {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .75rem;
    backface-visibility: hidden;
    font-family: system-ui, sans-serif;
  }

  .flip-front {
    background: linear-gradient(135deg, #264de4, #142b9c);
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    box-shadow: 0 8px 24px rgba(38,77,228,.3);
  }

  .flip-back {
    background: white;
    color: #1e293b;
    border: 2px solid #e2e8f0;
    transform: rotateY(180deg);
    padding: 1rem;
    text-align: center;
    font-size: .9rem;
    line-height: 1.5;
    box-shadow: 0 8px 24px rgba(0,0,0,.12);
  }

  /* Toggle with :has() + hidden checkbox */
  .flip-scene:has(input:checked) .flip-card {
    transform: rotateY(180deg);
  }
</style>

<div class="flip-scene">
  <input type="checkbox" id="flip" style="display:none">
  <label for="flip" style="position:absolute;inset:0;cursor:pointer;z-index:1;border-radius:16px;"></label>
  <div class="flip-card">
    <div class="flip-front">
      <span style="font-size:2.5rem">CSS</span>
      <span>Click to flip</span>
    </div>
    <div class="flip-back">
      <strong>CSS Transforms</strong>
      <p>translate, rotate, scale, perspective — GPU-composited for 60fps animations.</p>
    </div>
  </div>
</div>`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the result of transform: rotate(90deg) translateX(100px)?',
    options: [
      'Moves 100px right, then rotates 90deg',
      'Rotates 90deg (changing the local X axis to point down), then moves 100px downward',
      'Both operations happen simultaneously at the element\'s centre',
      'Rotates 90deg around the X axis, then moves 100px horizontally',
    ],
    answer: 1,
    explanation: 'Transforms are applied right-to-left. rotate(90deg) changes the local coordinate system (X axis now points down). translateX(100px) then moves 100px in that rotated X direction — which is downward on screen. To move right THEN rotate, write: translateX(100px) rotate(90deg).',
  },
  {
    q: 'Why is transform: translateX() preferred over left: for animation?',
    options: [
      'translateX() supports decimal values while left: only accepts integers',
      'translateX() runs on the GPU compositor — no layout or paint, 60fps',
      'left: cannot be used with transitions in modern browsers',
      'translateX() is hardware-accelerated only in Chrome, while left: works everywhere',
    ],
    answer: 1,
    explanation: 'Animating left/top/margin triggers layout recalculation (reflow) on every frame — expensive for the browser. transform: translateX() is a compositor-only operation; it runs on the GPU without touching layout or paint, producing 60fps animations even on complex pages.',
  },
  {
    q: 'What does transform-style: preserve-3d do?',
    options: [
      'Prevents transforms from affecting child elements',
      'Causes the element\'s children to exist in the same 3D space as the parent',
      'Locks the transform-origin to the centre of the 3D scene',
      'Applies hardware acceleration to all transforms on the element',
    ],
    answer: 1,
    explanation: 'transform-style: preserve-3d tells the browser to render the element\'s children in 3D space rather than flattening them. Without it (default: flat), 3D-transformed children are projected flat onto the parent plane — a rotateY(180deg) on a child would appear flat. Required for card flips and 3D scenes.',
  },
  {
    q: 'What is the purpose of backface-visibility: hidden?',
    options: [
      'Prevents the element from being seen from behind in 2D perspective',
      'Hides the element when its back face (after > 90deg rotation) faces the viewer',
      'Removes the element from the stacking context when rotated',
      'Applies a black background to the back of a 3D card',
    ],
    answer: 1,
    explanation: 'When an element is rotated more than 90deg, its "back face" faces the viewer. Without backface-visibility: hidden, you would see a mirrored reverse of the front face through a flipped element. hidden hides the element when its backface is toward the viewer — the card flip pattern requires this on both front and back faces.',
  },
  {
    q: 'What is the advantage of CSS individual transform properties (translate, rotate, scale) over the transform shorthand?',
    options: [
      'Individual properties have better browser support than the transform shorthand',
      'Individual properties can be transitioned independently and compose without order-dependency',
      'Individual properties apply transforms to children as well as the element',
      'Individual properties run on a separate thread from the transform shorthand',
    ],
    answer: 1,
    explanation: 'The transform shorthand applies functions in declared order (which changes the coordinate system). Individual properties (translate, rotate, scale) are always applied in a fixed order (translate → rotate → scale) and can each have independent transitions. You can write: transition: translate .2s, rotate .5s, scale .3s — each with different durations.',
  },
  {
    q: 'When should you add will-change: transform to an element?',
    options: [
      'To every element that uses transform to maximise GPU performance',
      'Sparingly, only on elements that are about to animate — it consumes GPU memory',
      'Only when the transform animation is longer than 1 second',
      'Always add it in the :hover selector together with transform',
    ],
    answer: 1,
    explanation: 'will-change: transform promotes the element to its own GPU compositing layer before animation starts. This uses GPU memory. Applying it to many elements or statically can exhaust GPU memory and degrade performance. Use it only on elements about to animate, and ideally remove it after animation completes.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Does transform affect document layout (does it push other elements)?',
    a: 'No. Transforms are purely visual — the element retains its original space in the document flow. Other elements do not shift when a transform moves or resizes an element visually. This is why transform: translateX(-50%) is used to centre elements (without flex/grid): the element\'s layout position stays at left: 50%, but it is visually moved left by 50% of its own width.',
  },
  {
    q: 'How do I centre an absolutely-positioned element with transform?',
    a: 'The classic pattern: position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%). top: 50% / left: 50% places the element\'s top-left corner at the parent\'s centre. transform: translate(-50%, -50%) shifts it left and up by half its own width/height, centering it. This works without knowing the element\'s dimensions (unlike margin-based centering).',
  },
  {
    q: 'What is the difference between perspective() as a function and as a CSS property?',
    a: 'perspective() as a transform function (transform: perspective(800px) rotateY(45deg)) applies perspective to that single element. perspective as a CSS property on a parent (perspective: 800px) applies the same viewpoint to ALL 3D-transformed children, making them share a coherent 3D space. For a 3D card flip, put perspective: 800px on the scene container — all children then rotate in the same 3D world.',
  },
  {
    q: 'How do I make a rotating cube with CSS transforms?',
    a: 'A CSS cube uses six absolutely-positioned faces inside a transform-style: preserve-3d container. Each face is positioned with translateZ(half-size) for front/back, rotateY(90deg) translateZ() for sides, rotateX(90deg) translateZ() for top/bottom. Rotate the container with animation: spin 4s linear infinite to spin the entire cube. The key is perspective on the scene ancestor and transform-style: preserve-3d on the cube container.',
  },
  {
    q: 'Does adding transform create a new stacking context?',
    a: 'Yes. Any element with transform (other than transform: none) creates a new stacking context, similar to position + z-index. This means: (1) the element and all its descendants are rendered as a group relative to other stacking contexts; (2) z-index values only compare within the same stacking context; (3) a transformed element with z-index:-1 will NOT appear behind its non-transformed parent. This is a common source of z-index bugs.',
  },
  {
    q: 'How do I apply a 3D rotation without the element appearing to change size?',
    a: 'Use a parent container with perspective and the child with the 3D rotation. The "size change" on a rotateY() is an expected 3D perspective effect — as the element turns away, it appears narrower. If you want a flat rotation without the foreshortening, use rotate() (2D) instead of rotateY(). For a subtle 3D tilt without extreme size change, use a larger perspective value (1000px+ feels subtle; 200px is dramatic).',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS transforms move/rotate/scale elements visually without affecting layout — they run on the GPU compositor for 60fps, making them the correct tool for any animation.',
  mustKnow: [
    'Transforms are applied right-to-left — order matters. Individual properties (translate, rotate, scale) avoid this by using a fixed composition order.',
    'transform: translate/opacity run on the GPU compositor — no layout/paint. Animate these, not top/left/width.',
    'perspective on a parent applies to all 3D children; perspective() in transform applies only to that element.',
    'transform-style: preserve-3d must be on every ancestor that needs children in 3D space.',
    'backface-visibility: hidden hides an element when its back face is toward the viewer — required for card flips.',
    'will-change: transform promotes to a GPU layer — use sparingly, only when an animation is about to start.',
  ],
  interviewFocus: [
    'Why is transform: translateX() better than left: for animation?',
    'What is the order of application for transform: rotate(45deg) translateX(100px)?',
    'How does a CSS card flip work — which properties are required?',
    'Does transform affect document flow?',
  ],
};

@Component({
  selector: 'app-css-transforms',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './css-transforms.html',
  styleUrl: './css-transforms.scss',
})
export class CssCssTransforms {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
