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
  { name: 'filter: blur(4px)',              type: 'syntax', desc: 'Gaussian blur. Applied to the element and its contents.' },
  { name: 'filter: brightness(1.4)',        type: 'syntax', desc: '0=black, 1=original, >1=brighter. Also accepts percentage.' },
  { name: 'filter: contrast(1.5)',          type: 'syntax', desc: '0=grey, 1=original, >1=more contrast.' },
  { name: 'filter: grayscale(1)',           type: 'syntax', desc: '0=colour, 1=fully greyscale. Values 0–1 or 0%–100%.' },
  { name: 'filter: hue-rotate(90deg)',      type: 'syntax', desc: 'Rotates the hue wheel. 0deg=original, 180deg=complementary.' },
  { name: 'filter: saturate(2)',            type: 'syntax', desc: '0=greyscale, 1=original, >1=more saturated.' },
  { name: 'filter: sepia(1)',               type: 'syntax', desc: '0=original, 1=fully sepia-toned.' },
  { name: 'filter: drop-shadow(x y blur color)', type: 'syntax', desc: 'Shadow that follows the element\'s shape (including transparency). Unlike box-shadow.' },
  { name: 'filter: invert(1)',              type: 'syntax', desc: '0=original, 1=fully inverted colours.' },
  { name: 'backdrop-filter: blur(12px)',    type: 'syntax', desc: 'Applies filter to the area BEHIND the element (frosted glass). Requires background with some transparency.' },
  { name: 'mix-blend-mode',                type: 'keyword', desc: 'How element blends with what is behind it. multiply, screen, overlay, color-dodge, etc.' },
  { name: 'isolation: isolate',            type: 'keyword', desc: 'Creates a new stacking context to contain mix-blend-mode effects within a group.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'filter vs backdrop-filter',
    points: [
      'filter applies graphical effects (blur, brightness, contrast, etc.) to the element itself and all its contents — text, images, child elements.',
      'backdrop-filter applies the same effects to the area behind the element (the rendered content underneath it). It requires the element to have some transparency (background: rgba or background: transparent) so the blurred backdrop shows through.',
      'filter: drop-shadow() follows the element\'s actual shape including transparent areas (useful for PNGs, SVGs). box-shadow follows the rectangular border-box and ignores transparency.',
      'Multiple filters are chained in the filter property: filter: blur(2px) brightness(1.2) contrast(1.1). They apply in order, left to right.',
      'Filters create a new stacking context on the element — a side effect to be aware of when combining with z-index.',
    ],
  },
  {
    heading: 'mix-blend-mode and isolation',
    points: [
      'mix-blend-mode controls how an element\'s pixels blend with the pixels of elements behind it. Common values: multiply (dark × dark = darker), screen (inverse of multiply — lightens), overlay (combines multiply and screen), color-dodge, color (change hue but keep luminosity).',
      'Without isolation, mix-blend-mode blends with everything beneath the element in the stacking context — including the page background. To contain blending within a group, wrap the elements in a container with isolation: isolate.',
      'background-blend-mode is similar but blends multiple background layers (background-image and background-color) on a single element rather than blending with elements behind it.',
      'Use cases: duotone photo effects, text that blends with background images, dark/light mode colour inversions, image hover colour overlays.',
    ],
  },
  {
    heading: 'Performance and GPU Compositing',
    points: [
      'filter and backdrop-filter are GPU-accelerated in all modern browsers — they run on the compositor thread like transform and opacity.',
      'Animating filter (e.g. blur on hover) is safe for performance. Avoid animating filter on large areas or complex filter chains that force a rasterization pass.',
      'backdrop-filter is the most expensive filter — applying it to many overlapping elements can cause frame drops. Use sparingly and on small areas.',
      'Like transform, filter creates a new stacking context. A filtered parent clips the z-index of its children.',
      'will-change: filter can pre-promote an element to its own GPU layer before a filter animation starts, reducing the late-promotion jank.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'filter functions',
    language: 'css',
    code: `/* All filter functions — chain multiple on one element */
img {
  /* Blur */
  filter: blur(4px);

  /* Brightness: 0=black, 1=original, 2=double */
  filter: brightness(1.3);

  /* Contrast */
  filter: contrast(1.5);

  /* Grayscale */
  filter: grayscale(1);        /* fully grey */
  filter: grayscale(0.5);      /* 50% grey */

  /* Hue rotate */
  filter: hue-rotate(90deg);

  /* Saturate */
  filter: saturate(2);         /* double saturation */

  /* Sepia */
  filter: sepia(0.8);

  /* Invert */
  filter: invert(1);           /* like a negative */

  /* Drop shadow — follows element shape (not box shape) */
  filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.4));

  /* Chained filters — applied left to right */
  filter: grayscale(1) brightness(0.8) contrast(1.2);
}

/* Hover: colour image on hover */
.photo {
  filter: grayscale(1) brightness(0.85);
  transition: filter .3s ease;
}
.photo:hover {
  filter: grayscale(0) brightness(1);
}`,
  },
  {
    label: 'backdrop-filter (frosted glass)',
    language: 'css',
    code: `/* Frosted glass card — classic backdrop-filter pattern */
.glass-card {
  background: rgba(255, 255, 255, 0.15); /* MUST have some transparency */
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5); /* Safari */

  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  color: white;
}

/* Dark mode glass */
:host-context(body.dark) .glass-card {
  background: rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.1);
}

/* ── Frosted navigation bar ── */
.sticky-nav {
  position: sticky;
  top: 0;
  z-index: 100;

  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: .75rem 1.5rem;
}

/* ── Modal overlay with blurred background ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}`,
  },
  {
    label: 'mix-blend-mode',
    language: 'css',
    code: `/* Duotone photo effect — two colour overlay */
.duotone-wrapper {
  position: relative;
  isolation: isolate;  /* contain blending to this group */
}

.duotone-wrapper img {
  display: block;
  width: 100%;
  filter: grayscale(1);   /* first: greyscale the photo */
}

/* Colour overlay that blends with the greyscale image */
.duotone-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #264de4 0%, #9333ea 100%);
  mix-blend-mode: color;  /* replace hue/saturation, keep luminosity */
  pointer-events: none;
}

/* ── Text that blends with background image ── */
.hero-text {
  mix-blend-mode: overlay;
  color: white;
  font-size: 4rem;
  font-weight: 900;
}

/* ── Common blend modes ── */
.multiply  { mix-blend-mode: multiply;    } /* dark areas overlap — removes white */
.screen    { mix-blend-mode: screen;      } /* inverse multiply — removes black    */
.overlay   { mix-blend-mode: overlay;     } /* contrast boost                      */
.color     { mix-blend-mode: color;       } /* hue+saturation from top layer       */
.luminosity{ mix-blend-mode: luminosity;  } /* brightness from top, hue from below */`,
  },
  {
    label: 'Animated filter effects',
    language: 'css',
    code: `/* Image reveal: greyscale → colour on hover */
.portfolio-item img {
  filter: grayscale(1) brightness(0.8) contrast(1.1);
  transition: filter .4s ease;
  transform: scale(1);
  transition: filter .4s ease, transform .3s ease;
}
.portfolio-item:hover img {
  filter: grayscale(0) brightness(1) contrast(1);
  transform: scale(1.03);
}

/* Glow pulse animation */
@keyframes glow-pulse {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(38,77,228,.4)); }
  50%       { filter: drop-shadow(0 0 20px rgba(38,77,228,.9)); }
}

.cta-button {
  animation: glow-pulse 2s ease-in-out infinite;
}

/* Frosted glass dark mode toggle */
.toggle-pill {
  background: rgba(38, 77, 228, 0.15);
  backdrop-filter: blur(8px);
  transition: background .2s, backdrop-filter .2s;
}
.toggle-pill.active {
  background: rgba(38, 77, 228, 0.4);
  backdrop-filter: blur(16px) brightness(1.1);
}

/* drop-shadow vs box-shadow on PNG */
.logo-png {
  /* box-shadow — rectangular, ignores transparency */
  box-shadow: 4px 4px 12px rgba(0,0,0,.3);

  /* drop-shadow — follows the actual shape */
  filter: drop-shadow(4px 4px 12px rgba(0,0,0,.3));
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'backdrop-filter not working because background is fully opaque',
    wrong: `/* backdrop-filter has no visible effect — background hides it */
.glass-card {
  background: white;            /* fully opaque — backdrop is invisible */
  backdrop-filter: blur(12px);
}`,
    right: `/* Background must be partially transparent for backdrop to show through */
.glass-card {
  background: rgba(255, 255, 255, 0.15);  /* semi-transparent */
  backdrop-filter: blur(12px);
}`,
    explanation: 'backdrop-filter blurs the content behind the element and shows it through the element\'s background. If the background is fully opaque (background: white, or background: #fff), the backdrop is completely hidden and the filter has no visual effect. The element must have some transparency.',
  },
  {
    title: 'Using box-shadow expecting it to follow PNG/SVG shape',
    wrong: `/* box-shadow creates a rectangular shadow — ignores the transparent PNG areas */
.logo-transparent-png {
  box-shadow: 4px 4px 12px rgba(0,0,0,.4);
  /* Result: shadow appears around the rectangular img bounding box */
}`,
    right: `/* filter: drop-shadow follows the actual visible pixels */
.logo-transparent-png {
  filter: drop-shadow(4px 4px 12px rgba(0,0,0,.4));
  /* Result: shadow follows the logo shape, not the rectangle */
}`,
    explanation: 'box-shadow is always rectangular (it follows the border-box). filter: drop-shadow() is a compositing shadow that follows the actual visible pixel shape of the element — ideal for logos, icons, and PNGs with transparency. Note: drop-shadow does not support spread radius (the 4th value of box-shadow).',
  },
  {
    title: 'mix-blend-mode bleeding into the page background',
    wrong: `/* Blend mode affects everything behind the element, including page background */
.text-overlay {
  mix-blend-mode: multiply;
  /* If the page has a white background, multiply makes dark text look normal */
  /* but if you scroll and the background image ends, text may disappear */
}`,
    right: `/* Use isolation: isolate on the container to contain blending */
.card-with-blend {
  isolation: isolate;  /* blending is contained within this element */
}
.card-with-blend .text-overlay {
  mix-blend-mode: multiply;
  /* Now only blends with siblings inside .card-with-blend */
}`,
    explanation: 'By default, mix-blend-mode blends with everything behind the element in the stacking context — including the page body background. isolation: isolate on a parent creates a new stacking context and limits blend-mode effects to that group, preventing unintended blending with the page background or other unrelated elements.',
  },
  {
    title: 'Forgetting -webkit-backdrop-filter for Safari',
    wrong: `/* Safari 15 and older need the -webkit- prefix */
.glass {
  backdrop-filter: blur(12px);
}`,
    right: `.glass {
  -webkit-backdrop-filter: blur(12px);  /* Safari */
  backdrop-filter: blur(12px);          /* Standard */
}`,
    explanation: 'backdrop-filter requires the -webkit- vendor prefix for Safari (all versions use it — even Safari 17). All other modern browsers support the unprefixed version. Always add both when using backdrop-filter.',
  },
];

const challenge: Challenge = {
  title: 'Build a Frosted Glass Profile Card',
  language: 'html',
  description: 'Build a profile card with frosted glass effect. Requirements: (1) A full-bleed background image or gradient behind the card. (2) The card uses backdrop-filter: blur() for the frosted glass look with a semi-transparent background. (3) A profile avatar with filter: drop-shadow() (not box-shadow). (4) An image overlay on hover using mix-blend-mode. (5) Dark mode: deeper tint on the glass card. Use only CSS.',
  hints: [
    'Wrap the card in a full-viewport container with the background image. The card must be positioned over the background for backdrop-filter to work.',
    'Card background: rgba(255,255,255,0.15), backdrop-filter: blur(16px), border: 1px solid rgba(255,255,255,0.3).',
    'Avatar: use filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)) — works with circular img even with object-fit: cover.',
    'For the mix-blend-mode overlay: add a ::before pseudo-element on the avatar container with mix-blend-mode: color and a gradient background.',
  ],
  starterCode: `<style>
  .scene {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #264de4, #9333ea, #ec4899);
  }

  .glass-card {
    /* frosted glass here */
    width: 300px;
    padding: 2rem;
    border-radius: 24px;
    text-align: center;
    color: white;
  }

  .avatar {
    width: 80px; height: 80px;
    border-radius: 50%;
    /* drop-shadow here */
  }
</style>

<div class="scene">
  <div class="glass-card">
    <img class="avatar" src="https://i.pravatar.cc/80" alt="Profile">
    <h2>Alex Kim</h2>
    <p>CSS Engineer</p>
  </div>
</div>`,
  solution: `<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }

  .scene {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #264de4 0%, #9333ea 50%, #ec4899 100%);
    padding: 2rem;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(20px) saturate(1.6);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    width: 300px;
    text-align: center;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  }

  .avatar-wrap {
    position: relative;
    display: inline-block;
    margin-bottom: 1.25rem;
    isolation: isolate;
  }

  .avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    filter: drop-shadow(0 4px 16px rgba(0,0,0,0.35));
    transition: filter .3s ease;
  }

  /* mix-blend-mode colour overlay on hover */
  .avatar-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, #264de4, #9333ea);
    mix-blend-mode: color;
    opacity: 0;
    transition: opacity .3s ease;
  }

  .avatar-wrap:hover::after { opacity: 1; }

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: .25rem;
  }

  p {
    font-size: .9rem;
    opacity: .8;
    margin-bottom: 1.5rem;
  }

  .tag {
    display: inline-block;
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 9999px;
    padding: .25rem .75rem;
    font-size: .8rem;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
</style>

<div class="scene">
  <div class="glass-card">
    <div class="avatar-wrap">
      <img class="avatar" src="https://i.pravatar.cc/88" alt="Profile">
    </div>
    <h2>Alex Kim</h2>
    <p>CSS Engineer</p>
    <span class="tag">Hover the avatar ✦</span>
  </div>
</div>`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key difference between filter: drop-shadow() and box-shadow?',
    options: [
      'drop-shadow supports spread radius; box-shadow does not',
      'drop-shadow follows the element\'s actual pixel shape; box-shadow is always rectangular',
      'drop-shadow is animated on the CPU; box-shadow uses the GPU',
      'drop-shadow only works on img elements; box-shadow works on any element',
    ],
    answer: 1,
    explanation: 'box-shadow always follows the rectangular border-box of the element, ignoring transparency. filter: drop-shadow() is a compositing filter that follows the actual visible pixels — it respects PNG/SVG transparency. The trade-off: drop-shadow does not support the spread radius (4th value) that box-shadow has.',
  },
  {
    q: 'Why does backdrop-filter have no visible effect when background: white is set?',
    options: [
      'backdrop-filter is not supported when background-color is set',
      'The opaque background completely hides the backdrop — it must be partially transparent',
      'backdrop-filter only works on elements with position: fixed or absolute',
      'background: white conflicts with the blur algorithm',
    ],
    answer: 1,
    explanation: 'backdrop-filter blurs the content behind the element and shows it through the element\'s own background. If the background is fully opaque (background: white), the blurred backdrop is completely covered and invisible. The background must have some transparency (rgba, or no background at all) for the filter to be visible.',
  },
  {
    q: 'What does isolation: isolate do in the context of mix-blend-mode?',
    options: [
      'Prevents the element from inheriting mix-blend-mode from its parent',
      'Confines blend-mode effects to the element\'s subtree by creating a new stacking context',
      'Applies mix-blend-mode: normal to all children',
      'Isolates the element\'s GPU layer from other compositing layers',
    ],
    answer: 1,
    explanation: 'By default, mix-blend-mode blends with everything behind the element in the current stacking context — including the page body. isolation: isolate creates a new stacking context on the container, so children with mix-blend-mode only blend with other elements inside that container, not with the page background or external elements.',
  },
  {
    q: 'Which filter function rotates colours across the spectrum without changing brightness?',
    options: [
      'filter: invert()',
      'filter: saturate()',
      'filter: hue-rotate()',
      'filter: contrast()',
    ],
    answer: 2,
    explanation: 'filter: hue-rotate(deg) rotates all colours in the element around the HSL colour wheel by the specified angle. 0deg = original, 90deg = colours shifted 90deg around the wheel, 180deg = complementary colours. Brightness and saturation are unchanged — only hues shift.',
  },
  {
    q: 'Which Safari-specific issue must you handle when using backdrop-filter?',
    options: [
      'Safari requires backdrop-filter to be on a position: fixed element',
      'Safari requires the -webkit-backdrop-filter vendor prefix',
      'Safari\'s backdrop-filter only supports blur, not saturate or brightness',
      'Safari applies backdrop-filter to children instead of the element itself',
    ],
    answer: 1,
    explanation: 'All versions of Safari (even Safari 17) require the -webkit-backdrop-filter vendor prefix. Always include both: -webkit-backdrop-filter: blur(12px); and backdrop-filter: blur(12px). Without the prefix, the frosted glass effect is absent on all Apple devices.',
  },
  {
    q: 'What does mix-blend-mode: multiply do?',
    options: [
      'Multiplies the element\'s opacity with the element below it',
      'Multiplies the element\'s RGB values with those behind it — dark areas overlap, white disappears',
      'Creates a double exposure by layering two copies of the element',
      'Applies a brightness multiplication equal to the element\'s alpha channel',
    ],
    answer: 1,
    explanation: 'multiply blends colours by multiplying the source and backdrop RGB values (each 0–1). White (1,1,1) × anything = anything (white disappears). Black (0,0,0) × anything = black. Overlapping dark areas become darker. It is commonly used to remove white backgrounds from images and to darken overlapping coloured shapes.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Can I animate filter properties smoothly?',
    a: 'Yes — filter is GPU-accelerated and can be transitioned smoothly. transition: filter .3s ease works for all filter functions. However, animating multiple complex filters simultaneously (large blur radii, many chained functions) can cause frame drops on lower-end hardware. For the smoothest animation, prefer single simple filters (blur or brightness) and avoid animating filter on large background elements. Using will-change: filter before animation can help by pre-promoting to a GPU layer.',
  },
  {
    q: 'How do I create a duotone (two-colour) effect on an image?',
    a: 'Two approaches: (1) CSS layers: make the image greyscale with filter: grayscale(1), then overlay a gradient pseudo-element with mix-blend-mode: color (replaces hue/saturation from the overlay while keeping the image\'s luminosity). (2) SVG feColorMatrix: more precise but requires inline SVG. The CSS approach is simpler and widely supported. Wrap the image in a container with isolation: isolate to prevent the blend from affecting elements outside.',
  },
  {
    q: 'What is the performance cost of backdrop-filter?',
    a: 'backdrop-filter is the most expensive of the CSS visual filters. It requires the browser to composite the content behind the element, apply the filter, then composit the result — this involves extra render passes. Applying backdrop-filter to many overlapping elements or on very large areas can cause frame drops. Best practices: use it on small UI elements (cards, navbars, modals), avoid animating backdrop-filter values (especially blur radius changes), and test on lower-end mobile devices.',
  },
  {
    q: 'Does filter affect child elements?',
    a: 'Yes — filter applied to an element affects the entire element including all its children, text, and descendants. There is no way to exclude a child from a filter on the parent. If you want to filter only the background (not the text), use backdrop-filter on a pseudo-element or a separate overlay layer instead of filter on the parent. For example: a hero section with a blurred background image uses the image as a background-image on a ::before pseudo-element with filter: blur(), while the text sits in a sibling element.',
  },
  {
    q: 'What is the difference between mix-blend-mode and background-blend-mode?',
    a: 'mix-blend-mode determines how an element blends with the content behind it (other elements in the stacking context). background-blend-mode determines how multiple background layers on a single element blend with each other — typically background-image blending with background-color. For example: background: url(texture.png) #264de4; background-blend-mode: multiply; multiplies the texture image with the blue colour to produce a tinted texture effect, all within one element\'s own background.',
  },
  {
    q: 'How do I invert colours for a dark mode image without CSS variables?',
    a: 'Use filter: invert(1) hue-rotate(180deg). invert(1) alone inverts all colours (making a photo look like a film negative). Adding hue-rotate(180deg) rotates the inverted hues back to their approximate original positions — resulting in mostly dark-mode-compatible images where the overall colour tone is preserved but the value (light/dark) is inverted. This is a common trick for inverting icons/logos: img.dark-mode { filter: invert(1); } inverts a black-on-white icon to white-on-dark.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'filter applies effects to an element; backdrop-filter to the area behind it; mix-blend-mode controls layer compositing — all GPU-accelerated.',
  mustKnow: [
    'filter: applies to the element and all its content. Chains multiple functions left-to-right.',
    'backdrop-filter: blurs/adjusts what is BEHIND the element. Background must be partially transparent.',
    'drop-shadow() follows the element\'s actual shape; box-shadow is always rectangular.',
    'Always include -webkit-backdrop-filter for Safari support.',
    'mix-blend-mode blends with everything behind it by default — use isolation: isolate on a container to confine the effect.',
    'filter and backdrop-filter create new stacking contexts — watch for z-index side effects.',
  ],
  interviewFocus: [
    'What is the difference between filter: drop-shadow() and box-shadow?',
    'Why does backdrop-filter require a transparent background?',
    'How does isolation: isolate work with mix-blend-mode?',
    'How would you create a duotone image effect with CSS?',
  ],
};

@Component({
  selector: 'app-css-filters',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './css-filters.html',
  styleUrl: './css-filters.scss',
})
export class CssCssFilters {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
