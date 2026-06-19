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
  { name: 'background-size: cover',      type: 'keyword',  desc: 'Scales image to fill container — may crop. contain fits without cropping.' },
  { name: 'background-position',         type: 'keyword',  desc: 'Sets image start point: center, top left, 50% 20%, etc.' },
  { name: 'linear-gradient()',           type: 'function', desc: 'Creates a directional color gradient: linear-gradient(to right, red, blue).' },
  { name: 'radial-gradient()',           type: 'function', desc: 'Creates a circular gradient: radial-gradient(circle, red, blue).' },
  { name: 'border-radius',              type: 'keyword',  desc: '50% = circle. 8px = rounded card. Supports per-corner shorthand.' },
  { name: 'box-shadow',                 type: 'keyword',  desc: 'offset-x offset-y blur spread color. Add inset for inner shadow. Comma-separate for multiple.' },
  { name: 'object-fit: cover',          type: 'keyword',  desc: 'Scales img/video to fill container preserving aspect ratio — may crop.' },
  { name: 'aspect-ratio',              type: 'keyword',  desc: 'aspect-ratio: 16/9 — maintains proportional size as container resizes.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Backgrounds and Gradients',
    points: [
      'background is a shorthand: color image position/size repeat attachment origin clip.',
      'Multiple backgrounds: comma-separate — first layer is on top. Combine gradients and images.',
      'background-size: cover fills the container (may crop); contain fits entirely inside (may leave gaps).',
      'Gradients are images in CSS — they work anywhere an image URL works, including border-image and mask.',
      'Use CSS gradients over image files for geometric patterns — no HTTP request, resolution-independent, and animatable.',
    ],
  },
  {
    heading: 'Borders, Shadows, and Outlines',
    points: [
      'box-shadow: x y blur spread color — negative spread shrinks the shadow; inset keyword moves it inside.',
      'Multiple box-shadows stack — first in the list is on top. Use 3-4 layered shadows for soft, realistic depth.',
      'border-radius accepts 1–4 values (corners TL TR BR BL) plus a slash for elliptical radii.',
      'outline differs from border: it does not affect layout, renders outside the border-box, and is ideal for focus rings.',
      'outline-offset: 3px adds space between element edge and outline — keeps the focus ring visible on dark backgrounds.',
    ],
  },
  {
    heading: 'Images, object-fit, and aspect-ratio',
    points: [
      'object-fit works on replaced elements (img, video, iframe) — the container must have defined width and height.',
      'object-fit: cover fills container and crops; contain shows all content with letterboxing; fill stretches (distorts).',
      'object-position: top right — shifts the visible crop area, like background-position for images.',
      'aspect-ratio: 16/9 on a container maintains the ratio as width changes — eliminates the old padding-top % hack.',
      'Use aspect-ratio on image wrappers to prevent Cumulative Layout Shift (CLS) while images load.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Gradients',
    language: 'css',
    code: `/* Linear gradient */
.hero {
  background: linear-gradient(135deg, #264de4 0%, #00c6ff 100%);
}

/* Multi-stop with transparency */
.overlay {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.7) 100%
  );
}

/* Radial gradient */
.spotlight {
  background: radial-gradient(circle at 30% 40%, #fff5 0%, transparent 60%);
}

/* Conic gradient (pie chart) */
.pie {
  background: conic-gradient(#264de4 0% 40%, #00c6ff 40% 70%, #e0e0e0 70% 100%);
  border-radius: 50%;
}

/* CSS pattern: diagonal stripes */
.stripes {
  background: repeating-linear-gradient(
    -45deg,
    #264de4,
    #264de4 10px,
    #eff6ff 10px,
    #eff6ff 20px
  );
}`,
  },
  {
    label: 'Multiple Backgrounds',
    language: 'css',
    code: `/* Gradient overlay on top of image */
.card-hero {
  background-image:
    linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.75) 100%),
    url('/hero.jpg');
  background-size: cover;
  background-position: center;
}

/* Stacked patterns */
.texture {
  background-image:
    radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px),
    linear-gradient(135deg, #264de4, #142b9c);
  background-size: 20px 20px, cover;
}

/* Per-layer control */
.multi {
  background-image:    url('/icon.svg'),     linear-gradient(#fff, #f0f4ff);
  background-repeat:   no-repeat,            no-repeat;
  background-position: right 1rem center,   center;
  background-size:     24px 24px,           cover;
}`,
  },
  {
    label: 'Borders & Shadows',
    language: 'css',
    code: `/* Rounded corners — per-corner */
.card  { border-radius: 12px; }
.badge { border-radius: 999px; }      /* pill */
.avatar { border-radius: 50%; }       /* circle */
.blob   { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }

/* Layered box-shadow for soft, realistic depth */
.card {
  box-shadow:
    0 1px 2px rgba(0,0,0,0.06),
    0 4px 8px rgba(0,0,0,0.08),
    0 12px 24px rgba(0,0,0,0.06);
}

/* Inset shadow (inner glow / pressed state) */
.input:focus {
  box-shadow: inset 0 0 0 2px #264de4, 0 0 0 4px rgba(38,77,228,0.15);
}

/* Outline for focus — does not affect layout */
.btn:focus-visible {
  outline: 2px solid #264de4;
  outline-offset: 3px;
}

/* border-image for gradient borders */
.gradient-border {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, #264de4, #00c6ff) 1;
}`,
  },
  {
    label: 'object-fit & aspect-ratio',
    language: 'css',
    code: `/* Prevent CLS — reserve space before image loads */
.img-wrap {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 8px;
}

.img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;  /* show top of image when cropped */
}

/* Square avatar */
.avatar {
  width: 48px;
  height: 48px;       /* or: aspect-ratio: 1 */
  border-radius: 50%;
  object-fit: cover;
}

/* Video responsive embed (no wrapper needed) */
video {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

/* Card image that always fills its column */
.card-img {
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  width: 100%;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'background shorthand overwriting background-size',
    wrong: `background-size: cover;
background: url('hero.jpg') center no-repeat;  /* resets size to auto */`,
    right: `background: url('hero.jpg') center / cover no-repeat;
/* or set size separately AFTER the shorthand */`,
    explanation: 'The background shorthand resets all sub-properties not included in it. Always use slash notation (position / size) inside the shorthand, or set sub-properties after the shorthand.',
  },
  {
    title: 'object-fit without defined container dimensions',
    wrong: `img { object-fit: cover; }  /* no width or height — has no effect */`,
    right: `img { width: 100%; height: 200px; object-fit: cover; }
/* or wrap in a sized container */`,
    explanation: 'object-fit only affects how the content fills its box. Without an explicit width and height on the element itself, the box matches the image\'s intrinsic size and there is nothing to fit into.',
  },
  {
    title: 'Using the padding-top % hack instead of aspect-ratio',
    wrong: `.video-wrap { position: relative; padding-top: 56.25%; }
.video-wrap iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }`,
    right: `.video-wrap { aspect-ratio: 16 / 9; }
.video-wrap iframe { width: 100%; height: 100%; }`,
    explanation: 'aspect-ratio is now supported in all modern browsers and is far more readable. The padding-top hack was a workaround for the lack of this property.',
  },
  {
    title: 'Using border for focus instead of outline',
    wrong: `.btn:focus { border: 2px solid blue; }  /* shifts layout — moves surrounding elements */`,
    right: `.btn:focus-visible { outline: 2px solid #264de4; outline-offset: 3px; }`,
    explanation: 'border participates in the box model — adding it on focus shifts layout. outline sits outside the box model and does not affect surrounding elements. Use outline for focus styles.',
  },
  {
    title: 'Single heavy shadow instead of layered shadows',
    wrong: `.card { box-shadow: 0 20px 60px rgba(0,0,0,0.5); }  /* harsh, unrealistic */`,
    right: `.card {
  box-shadow:
    0 1px 2px rgba(0,0,0,0.06),
    0 4px 8px rgba(0,0,0,0.08),
    0 12px 24px rgba(0,0,0,0.06);
}`,
    explanation: 'A single large shadow looks artificial. Layering 2–4 shadows with increasing blur and decreasing opacity mimics how real-world shadows spread and creates a much more natural depth effect.',
  },
];

const challenge: Challenge = {
  title: 'Profile Card with Gradient Header',
  language: 'html',
  description: 'Build a profile card that: (1) Has a gradient header background. (2) Has a circular avatar image positioned overlapping the header/content boundary using object-fit: cover. (3) Has a layered box-shadow on the card. (4) Uses aspect-ratio on the header to keep it proportional. (5) Switches shadow color slightly in dark mode.',
  hints: [
    'Use aspect-ratio: 3/1 on .card-header to keep the gradient banner proportional.',
    'Position the avatar with position: absolute and translate(-50%, -50%) at the boundary between header and content.',
    'Layer 3 box-shadows on .card with small, medium, and large blur radii for realistic depth.',
    'The avatar needs width, height, border-radius: 50%, object-fit: cover, and a white border to pop against the gradient.',
  ],
  starterCode: `<div class="card">
  <div class="card-header">
    <img class="avatar" src="https://i.pravatar.cc/100" alt="Avatar">
  </div>
  <div class="card-content">
    <h2>Jane Smith</h2>
    <p class="role">CSS Architect</p>
    <p class="bio">Passionate about design systems, accessible interfaces, and fluid layouts.</p>
  </div>
</div>`,
  solution: `.card {
  width: 320px;
  border-radius: 16px;
  overflow: visible;
  box-shadow:
    0 1px 3px rgba(0,0,0,0.07),
    0 6px 12px rgba(0,0,0,0.08),
    0 20px 40px rgba(0,0,0,0.06);
  background: #fff;
}

.card-header {
  aspect-ratio: 3 / 1;
  background: linear-gradient(135deg, #264de4 0%, #00c6ff 100%);
  border-radius: 16px 16px 0 0;
  position: relative;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.card-content {
  padding: 3rem 1.5rem 1.5rem;
  text-align: center;
}

.card-content h2 { margin: 0 0 0.25rem; font-size: 1.25rem; }
.role  { color: #264de4; font-weight: 600; margin: 0 0 0.75rem; }
.bio   { color: #6b7280; line-height: 1.6; margin: 0; font-size: 0.9rem; }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does background-size: cover do?',
    options: [
      'Scales the image to fit entirely inside the container without cropping',
      'Tiles the image to fill the container',
      'Scales the image to fill the container — may crop to avoid empty space',
      'Stretches the image to match container dimensions exactly',
    ],
    answer: 2,
    explanation: 'cover scales the image up (or down) until it fills the container in both dimensions — the image may be cropped. contain is the opposite: the whole image fits, potentially leaving empty space.',
  },
  {
    q: 'In a background shorthand with multiple backgrounds, which layer renders on top?',
    options: [
      'The last layer listed',
      'The first layer listed',
      'The layer with the highest z-index',
      'The layer with background-size: cover',
    ],
    answer: 1,
    explanation: 'In background-image, the first value is the topmost layer. list gradient overlays before image URLs so the gradient sits on top of the image.',
  },
  {
    q: 'What is the correct CSS to add an inner (inset) shadow?',
    options: [
      'inner-shadow: 0 0 10px rgba(0,0,0,0.3)',
      'box-shadow: inner 0 0 10px rgba(0,0,0,0.3)',
      'box-shadow: inset 0 0 10px rgba(0,0,0,0.3)',
      'shadow-mode: inset 0 0 10px rgba(0,0,0,0.3)',
    ],
    answer: 2,
    explanation: 'The inset keyword at the start of a box-shadow value moves the shadow inside the element. "inner" and "inner-shadow" are not valid CSS.',
  },
  {
    q: 'Why use outline instead of border for focus rings?',
    options: [
      'outline supports more colors than border',
      'outline does not affect layout — it renders outside the box model without shifting content',
      'outline has better browser support than border',
      'outline automatically picks the correct contrast color',
    ],
    answer: 1,
    explanation: 'border participates in the box model — adding it on focus moves surrounding content. outline renders outside the border-box and does not affect layout at all, making it ideal for focus indicators.',
  },
  {
    q: 'Which property eliminates the old padding-top: 56.25% hack for responsive video embeds?',
    options: [
      'background-size: cover',
      'object-fit: cover',
      'aspect-ratio: 16/9',
      'width: 100%; height: auto',
    ],
    answer: 2,
    explanation: 'aspect-ratio: 16/9 directly sets the width-to-height proportion of an element. The padding-top % trick was a workaround for the absence of this property in older browsers.',
  },
  {
    q: 'When does object-fit have no visual effect?',
    options: [
      'When the image is a JPEG',
      'When the img element has no explicit width and height set',
      'When the img is inside a flex container',
      'When the image has transparency',
    ],
    answer: 1,
    explanation: 'object-fit controls how content fills its box. If the img element has no explicit dimensions, its box matches the intrinsic image size — there is no "box" to fit into, so object-fit does nothing.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How do I add a gradient border to an element?',
    a: 'Use border: Npx solid transparent combined with background-clip: padding-box and a pseudo-element for the gradient. The modern approach is border-image: linear-gradient(...) 1 — but border-image does not support border-radius. For gradient + rounded corners, use a ::before pseudo-element with the gradient background set behind the element.',
  },
  {
    q: 'What is the difference between object-fit and background-size?',
    a: 'background-size controls a CSS background image on any element. object-fit controls how a replaced element (img, video, iframe) fills its own box. Use background-size for decorative images, object-fit for meaningful content images where the img tag is semantically required.',
  },
  {
    q: 'How do I create the old padding-top aspect-ratio trick vs the modern approach?',
    a: 'Old: .wrap { position: relative; padding-top: 56.25%; } .wrap > * { position: absolute; inset: 0; }. Modern: .wrap { aspect-ratio: 16 / 9; } — much simpler. aspect-ratio is supported in all browsers released after 2021. Use the old trick only if you must support IE or very old Safari.',
  },
  {
    q: 'Why do layered box-shadows look more realistic than a single shadow?',
    a: 'Real-world shadows are not uniform — they have a very sharp dark shadow close to the object and a wide, diffuse light shadow further away. Layering shadows (e.g., 0 1px 2px opacity 0.06, 0 8px 16px opacity 0.08, 0 24px 48px opacity 0.05) mimics this gradient of darkness, producing a depth that a single shadow cannot replicate.',
  },
  {
    q: 'Can I animate background gradients with CSS transitions?',
    a: 'Not directly — CSS cannot interpolate between gradient definitions with transition. Workarounds: (1) Animate background-position on a larger gradient. (2) Use opacity on two stacked gradient pseudo-elements. (3) Use @property to register a custom property with syntax: "<color>" and transition that color within the gradient string.',
  },
  {
    q: 'What is the difference between border-radius: 8px and border-radius: 50%?',
    a: 'px values create a fixed-radius corner regardless of element size — good for cards and buttons. 50% creates an ellipse based on the element\'s own dimensions — on a square element this produces a perfect circle. For non-square elements, 50% creates an ellipse. Use border-radius: 9999px for a pill shape that always produces fully rounded ends regardless of size.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS backgrounds stack first-on-top; use object-fit and aspect-ratio for images; layer box-shadows for depth; always use outline (not border) for focus rings.',
  mustKnow: [
    'background-size: cover fills container (may crop), contain fits inside (may leave gaps).',
    'Multiple backgrounds: comma-separated, first listed = topmost layer.',
    'box-shadow: inset keyword for inner shadows; layer 3+ shadows for realistic depth.',
    'outline does not affect layout — use it for focus rings; border shifts content.',
    'object-fit requires explicit dimensions on the img/video element to have any effect.',
    'aspect-ratio replaces the padding-top % hack for responsive proportional containers.',
  ],
  interviewFocus: [
    'How does background layering order work — which layer is on top?',
    'Why use outline instead of border for focus indicators?',
    'Explain object-fit: cover vs contain and when you would use each.',
    'How do you create realistic-looking shadows in CSS?',
  ],
};

@Component({
  selector: 'app-css-backgrounds-borders',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './backgrounds-borders.html',
  styleUrl: './backgrounds-borders.scss',
})
export class CssBackgroundsBorders {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
