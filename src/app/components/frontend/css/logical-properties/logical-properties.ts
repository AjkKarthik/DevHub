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
  { name: 'margin-inline',          type: 'keyword', desc: 'Sets start and end margins in the inline direction (left & right in LTR/horizontal). Shorthand for margin-inline-start + margin-inline-end.' },
  { name: 'margin-block',           type: 'keyword', desc: 'Sets start and end margins in the block direction (top & bottom in horizontal writing). Shorthand for margin-block-start + margin-block-end.' },
  { name: 'padding-inline',         type: 'keyword', desc: 'Logical shorthand for left+right padding. Replaces padding-left + padding-right.' },
  { name: 'padding-block',          type: 'keyword', desc: 'Logical shorthand for top+bottom padding. Replaces padding-top + padding-bottom.' },
  { name: 'inset-inline-start',     type: 'keyword', desc: 'Logical equivalent of left in LTR — becomes right in RTL automatically.' },
  { name: 'inset',                  type: 'keyword', desc: 'Shorthand for top, right, bottom, left. inset: 0 = all four sides 0.' },
  { name: 'border-block-end',       type: 'keyword', desc: 'Border on the block-end side (bottom in horizontal writing). Works for underline borders without direction hacks.' },
  { name: 'border-start-start-radius', type: 'keyword', desc: 'Logical equivalent of border-top-left-radius in LTR — flips correctly in RTL.' },
  { name: 'writing-mode',           type: 'keyword', desc: 'Sets inline/block axes: horizontal-tb (default), vertical-rl, vertical-lr.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Physical vs Logical Properties',
    points: [
      'Physical properties are tied to screen directions: margin-left, padding-top, border-right — they always mean the same absolute direction.',
      'Logical properties are relative to the writing mode and text direction: margin-inline-start, padding-block-end — they automatically flip for RTL languages and vertical writing.',
      'In a left-to-right horizontal layout (writing-mode: horizontal-tb, direction: ltr): inline = horizontal (left/right), block = vertical (top/bottom).',
      'In a right-to-left layout (direction: rtl): margin-inline-start becomes what was previously margin-right — no manual override needed.',
      'Logical properties make internationalisation automatic — one stylesheet works for Arabic, Hebrew, Japanese vertical text, and English with no direction overrides.',
    ],
  },
  {
    heading: 'Inline and Block Axes',
    points: [
      'Block axis: the direction blocks stack — top to bottom in horizontal-tb (the default writing mode).',
      'Inline axis: the direction text flows — left to right in LTR, right to left in RTL.',
      'Logical start/end: "start" is the beginning of the writing direction (left in LTR, right in RTL). "end" is the opposite.',
      'Mapping in horizontal LTR: block-start=top, block-end=bottom, inline-start=left, inline-end=right.',
      'In vertical-rl (Japanese): block-start=right, block-end=left, inline-start=top, inline-end=bottom — logical properties handle this automatically.',
    ],
  },
  {
    heading: 'Adoption Strategy and Browser Support',
    points: [
      'Logical properties are fully supported in all modern browsers (Chrome 87+, Firefox 66+, Safari 14.1+) — safe to use in production.',
      'Migration: replace left/right with inline-start/inline-end, replace top/bottom with block-start/block-end.',
      'margin: 0 auto still works for centering — but margin-inline: auto is the logical equivalent and preferred.',
      'Physical properties still work and are not deprecated — logical properties are additive. Use them where internationalisation matters.',
      'Start with layout-critical properties (padding, margin, positioning) and work inward to borders and border-radius.',
    ],
  },
  {
    heading: 'Why Logical Properties Matter for Internationalization',
    points: [
      'Physical properties (margin-left, margin-right) assume a fixed left-to-right reading direction — in a right-to-left language (Arabic, Hebrew), "left" and "right" no longer correspond to "start" and "end" of a line, requiring separate RTL-specific override stylesheets under the physical property model.',
      'Logical properties (margin-inline-start, margin-inline-end, padding-block) automatically adapt to the actual writing direction and mode set on the document or a specific element — the same CSS declaration correctly produces mirrored spacing in an RTL context without any additional RTL-specific override rules.',
      'Inline and block are the two logical axes: inline follows the direction text flows within a line (left-to-right in English, right-to-left in Arabic), while block follows the direction lines stack (top-to-bottom in most writing modes, but right-to-left in vertical Japanese text).',
      'Adopting logical properties throughout a codebase from the start (rather than physical properties with RTL overrides bolted on later) makes genuine internationalization support significantly cheaper — supporting a new writing direction becomes largely automatic rather than requiring a systematic audit and override of every physical property in the codebase.',
    ],
  },
  {
    heading: 'Logical Property Equivalents and Migration',
    points: [
      'Common physical-to-logical mappings: width → inline-size, height → block-size, top/bottom → inset-block-start/inset-block-end, left/right → inset-inline-start/inset-inline-end — most standard box-model and positioning properties have a direct logical equivalent.',
      'Border and border-radius also have logical variants (border-inline-start, border-start-start-radius) though these are less commonly needed than margin/padding/inset logical properties, since border styling is often symmetric and direction-independent in practice.',
      'Migrating an existing large codebase from physical to logical properties is generally safe to do incrementally, property by property or component by component, since logical and physical properties can coexist in the same stylesheet without conflict as long as they are not both set on the exact same box edge.',
      'Browser DevTools now generally display computed logical property values directly, making it straightforward to verify actual resolved spacing/sizing when debugging a layout that uses logical properties, without needing to manually translate inline-start back to left/right mentally.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Margin & Padding',
    language: 'css',
    code: `/* Physical → Logical equivalents */

/* Centering */
.container {
  /* Physical */
  margin-left: auto;
  margin-right: auto;
  /* Logical equivalent */
  margin-inline: auto;
}

/* Vertical rhythm */
.section {
  /* Physical */
  margin-top: 2rem;
  margin-bottom: 2rem;
  /* Logical */
  margin-block: 2rem;
}

/* Button padding */
.btn {
  /* Physical */
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  /* Logical */
  padding-block: 0.5rem;
  padding-inline: 1.25rem;
}

/* Individual sides */
.card {
  margin-inline-start: 1rem;  /* left in LTR, right in RTL */
  margin-inline-end: 0;       /* right in LTR, left in RTL */
  padding-block-start: 1.5rem; /* top in horizontal writing */
  padding-block-end: 1rem;     /* bottom */
}`,
  },
  {
    label: 'Positioning & Sizing',
    language: 'css',
    code: `/* Logical positioning — replaces top/left/right/bottom */

/* inset shorthand (logical and physical) */
.overlay {
  position: fixed;
  inset: 0;           /* top: 0; right: 0; bottom: 0; left: 0 */
}

.tooltip {
  position: absolute;
  inset-block-start: 100%;    /* top: 100% in horizontal-tb */
  inset-inline-start: 0;      /* left: 0 in LTR, right: 0 in RTL */
}

/* Logical sizing */
.card {
  /* Physical */
  width: 400px;
  height: 200px;

  /* Logical — inline-size maps to width in horizontal-tb */
  inline-size: 400px;
  block-size: 200px;

  max-inline-size: 100%;   /* max-width: 100% */
  min-block-size: 3rem;    /* min-height: 3rem */
}

/* RTL sidebar example — no dir="rtl" override needed */
.sidebar {
  position: fixed;
  inset-block: 0;             /* top: 0; bottom: 0 */
  inset-inline-start: 0;      /* left in LTR, right in RTL */
  inline-size: 240px;
}`,
  },
  {
    label: 'Borders & Border Radius',
    language: 'css',
    code: `/* Logical borders */
.card {
  /* Physical underline bottom border */
  border-bottom: 2px solid #264de4;

  /* Logical equivalent — auto-flips for vertical writing */
  border-block-end: 2px solid #264de4;
}

/* Section dividers */
.section + .section {
  border-block-start: 1px solid #e5e7eb;
  padding-block-start: 2rem;
  margin-block-start: 2rem;
}

/* Logical border-radius */
.avatar {
  /* Physical: top-left and bottom-left rounded (sidebar card in LTR) */
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;

  /* Logical: start-start and end-start (flips in RTL) */
  border-start-start-radius: 8px;
  border-end-start-radius: 8px;
}

/* Tag/badge with one rounded side */
.tag {
  /* Rounds the inline-end side only */
  border-start-end-radius: 999px;
  border-end-end-radius: 999px;
  padding-inline: 0.75rem;
  padding-block: 0.25rem;
}`,
  },
  {
    label: 'RTL & Writing Mode',
    language: 'css',
    code: `/* Logical properties automatically work in RTL */
:root { direction: ltr; }   /* or rtl — set on <html> */

.nav-icon {
  /* Physical: always on the left */
  margin-right: 0.5rem;

  /* Logical: on the end side of the icon (right in LTR, left in RTL) */
  margin-inline-end: 0.5rem;
}

/* Vertical writing mode — Japanese/Chinese */
.vertical-text {
  writing-mode: vertical-rl;
  /* Now block = right-to-left, inline = top-to-bottom */
  /* margin-block-start = right margin in this mode */
  margin-block: 1rem;
  padding-inline: 0.5rem;  /* top/bottom padding in vertical-rl */
}

/* Utility: flip icon direction in RTL without extra CSS */
[dir="rtl"] .chevron-icon {
  /* Physical — requires override */
  transform: scaleX(-1);
}

/* With logical flow-relative transform: no override needed if
   you structure your icon as text-direction-aware from the start */
.chevron-icon {
  /* Use writing-mode aware layout so the icon naturally follows direction */
  display: inline-block;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Mixing physical and logical properties for the same axis',
    wrong: `.card {
  margin-left: 1rem;       /* physical */
  margin-inline-end: 1rem; /* logical — conflicts on LTR */
}`,
    right: `.card {
  /* Use all logical OR all physical for the same side */
  margin-inline-start: 1rem;
  margin-inline-end: 1rem;
  /* or shorthand */
  margin-inline: 1rem;
}`,
    explanation: 'Mixing physical and logical properties for the same axis creates confusion and can cause specificity-order issues. Pick one system per property axis and stay consistent throughout the component.',
  },
  {
    title: 'Using width/height instead of inline-size/block-size when direction matters',
    wrong: `/* Works only in horizontal writing — breaks in vertical-rl */
.card { width: 300px; height: auto; }`,
    right: `/* Logical sizing adapts to writing-mode automatically */
.card { inline-size: 300px; block-size: auto; }`,
    explanation: 'width and height are tied to the screen axes. inline-size and block-size are tied to the writing mode — inline-size is width in horizontal-tb but height in vertical-rl. Use logical sizing when building components intended to work in multiple writing modes.',
  },
  {
    title: 'Forgetting inset-inline-start for absolutely-positioned elements in RTL layouts',
    wrong: `.dropdown {
  position: absolute;
  left: 0;   /* always on the physical left — breaks RTL */
}`,
    right: `.dropdown {
  position: absolute;
  inset-inline-start: 0;  /* left in LTR, right in RTL */
}`,
    explanation: 'left and right are physical. In an RTL layout, a dropdown aligned to left: 0 will open on the wrong side. inset-inline-start automatically maps to right: 0 when direction: rtl is set on an ancestor.',
  },
  {
    title: 'Assuming border-radius logical properties match CSS physical shorthand order',
    wrong: `/* border-radius shorthand: top-left top-right bottom-right bottom-left */
.card { border-radius: 8px 0 0 8px; }

/* Thinking border-start-start-radius = top-left = correct — but confusing */
.card {
  border-start-start-radius: 8px;   /* top-left in LTR ✓ */
  border-start-end-radius: 0;       /* top-right ✓ */
  border-end-end-radius: 0;         /* bottom-right ✓ */
  border-end-start-radius: 8px;     /* bottom-left ✓ */
}`,
    right: `/* Logical names: start-start = (block-start, inline-start) corner */
/* In LTR horizontal: start-start = top-left, end-start = bottom-left */
.card {
  border-start-start-radius: 8px;
  border-end-start-radius: 8px;
}
/* In RTL: these become top-right and bottom-right automatically */`,
    explanation: 'Logical border-radius names use two axes: (block position)-(inline position). start-start = block-start & inline-start = top-left in LTR. The key benefit is that they flip correctly in RTL without any override.',
  },
];

const challenge: Challenge = {
  title: 'RTL-Ready Card Component',
  language: 'scss',
  description: 'Build a profile card that works correctly in both LTR and RTL without any direction overrides. Requirements: (1) Avatar floated to the inline-start side with margin-inline-end spacing. (2) Card padding using padding-block and padding-inline. (3) Card border on the inline-start side only (accent stripe). (4) A "View profile" button aligned to inline-end. (5) All positioning must use logical properties — no left, right, top, or bottom.',
  hints: [
    'Use float: inline-start for the avatar (logical equivalent of float: left).',
    'border-inline-start: 4px solid #264de4 creates the left accent stripe in LTR, right stripe in RTL.',
    'margin-inline-start: auto on the button pushes it to the inline-end in a flex container.',
    'Test your card by adding direction: rtl on the parent — everything should mirror without extra CSS.',
  ],
  starterCode: `.profile-card {
  /* Add logical padding, border, and layout */
}

.profile-avatar {
  /* Float to inline-start with logical spacing */
}

.profile-info {
  /* Text content area */
}

.profile-btn {
  /* Align to inline-end */
}`,
  solution: `.profile-card {
  padding-block: 1.5rem;
  padding-inline: 1.5rem;
  border-inline-start: 4px solid #264de4;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-avatar {
  float: inline-start;
  margin-inline-end: 1rem;
  margin-block-end: 0.5rem;
  inline-size: 64px;
  block-size: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-name {
  font-size: 1.125rem;
  font-weight: 700;
  margin-block-end: 0.25rem;
}

.profile-role {
  color: #6b7280;
  font-size: 0.875rem;
  margin-block-end: 0;
}

.profile-btn {
  display: block;
  margin-inline-start: auto;
  padding-block: 0.5rem;
  padding-inline: 1.25rem;
  background: #264de4;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does margin-inline-start map to in a standard LTR horizontal layout?',
    options: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
    answer: 3,
    explanation: 'In a left-to-right horizontal writing mode (horizontal-tb, direction: ltr), the inline axis flows left to right, so inline-start = left. margin-inline-start = margin-left in LTR, and margin-right in RTL.',
  },
  {
    q: 'Which logical property is the equivalent of width in a horizontal-tb writing mode?',
    options: ['block-size', 'inline-size', 'logical-width', 'flow-size'],
    answer: 1,
    explanation: 'inline-size maps to width in horizontal writing modes (horizontal-tb) because the inline axis is horizontal. In vertical-rl, inline-size maps to height because the inline axis runs vertically.',
  },
  {
    q: 'What is the logical shorthand to set both top and bottom padding to 1rem?',
    options: ['padding-vertical: 1rem', 'padding-block: 1rem', 'padding-inline: 1rem', 'padding-block-center: 1rem'],
    answer: 1,
    explanation: 'padding-block sets padding on both the block-start (top) and block-end (bottom) sides. In horizontal-tb writing mode: padding-block: 1rem = padding-top: 1rem + padding-bottom: 1rem.',
  },
  {
    q: 'You want to add a left border accent in LTR that automatically becomes a right border in RTL. Which property should you use?',
    options: ['border-left', 'border-inline', 'border-inline-start', 'border-block-start'],
    answer: 2,
    explanation: 'border-inline-start maps to border-left in LTR and border-right in RTL — automatically correct for both directions with a single declaration. border-left is physical and always stays on the left.',
  },
  {
    q: 'What does inset: 0 equivalent to?',
    options: [
      'top: 0; left: 0',
      'margin: 0; padding: 0',
      'top: 0; right: 0; bottom: 0; left: 0',
      'inset-inline: 0; inset-block: 0',
    ],
    answer: 2,
    explanation: 'inset is a shorthand for all four sides: top, right, bottom, left. inset: 0 sets all four to 0, which is a common pattern for position: fixed/absolute overlays.',
  },
  {
    q: 'In writing-mode: vertical-rl, what does padding-block map to?',
    options: [
      'padding-top and padding-bottom (same as horizontal)',
      'padding-left and padding-right',
      'padding-top only',
      'It is invalid in vertical writing mode',
    ],
    answer: 1,
    explanation: 'In vertical-rl, the block axis runs horizontally (right to left), so padding-block maps to padding-right and padding-left. The inline axis runs vertically, so padding-inline maps to padding-top and padding-bottom. Logical properties automatically adapt.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Should I replace all my physical properties with logical ones immediately?',
    a: 'No — a gradual, targeted migration is better. Start with layout-critical properties in components that need RTL support: margin, padding, and positioning. Physical properties still work fine and are not deprecated. A good rule: use logical properties for any UI that will be internationalised, and physical properties for purely decorative effects (e.g., a specific box-shadow direction tied to a light source angle).',
  },
  {
    q: 'Do logical properties work with CSS custom properties?',
    a: 'Yes — logical properties are regular CSS properties and work with var() exactly like physical ones. You can define --spacing-inline: 1.5rem and use it as padding-inline: var(--spacing-inline). This is especially useful in design token systems where token names can also use logical naming conventions.',
  },
  {
    q: 'What is the difference between inset and inset-inline / inset-block?',
    a: 'inset is a physical shorthand that expands to top, right, bottom, left (physical properties). inset-inline and inset-block are logical shorthands: inset-inline sets inset-inline-start and inset-inline-end, inset-block sets inset-block-start and inset-block-end. For RTL-aware positioning, prefer inset-inline-start/end over inset on individual sides.',
  },
  {
    q: 'How do logical properties interact with Tailwind CSS?',
    a: 'Tailwind v3+ includes logical property utilities: ms-* (margin-inline-start), me-* (margin-inline-end), ps-* (padding-inline-start), pe-* (padding-inline-end). The start/end classes map to logical properties. Tailwind also supports ltr: and rtl: variants for direction-specific overrides when you cannot use logical properties.',
  },
  {
    q: 'Are there any CSS properties that do not have logical equivalents?',
    a: 'A few: transform (translate, rotate), background-position (though there is a proposal), box-shadow offset directions, and some SVG properties. For transforms, you can use logical flows indirectly by ensuring the element\'s layout is direction-aware. Background-position has a partial solution using rtl-aware fallbacks. For box-shadow, you typically need a direction override.',
  },
  {
    q: 'Can I use logical properties in CSS Grid and Flexbox?',
    a: 'Yes — Flexbox and Grid already use flow-relative concepts internally. flex-start and flex-end in a row direction map to the inline-start and inline-end sides. Grid\'s start and end line names are also direction-relative. margin-inline-start: auto in a flex container pushes an item to the inline-end — the logical equivalent of margin-left: auto for right-alignment in LTR.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Logical properties replace physical left/right/top/bottom with writing-mode-relative inline-start/end and block-start/end — one stylesheet that works for LTR, RTL, and vertical text.',
  mustKnow: [
    'Inline axis = text direction (left↔right in LTR). Block axis = block stacking (top↔bottom in horizontal writing).',
    'margin-inline: auto centers an element (logical equivalent of margin: 0 auto).',
    'padding-block / padding-inline replace separate top+bottom / left+right padding declarations.',
    'inset-inline-start replaces left in positioned elements — auto-flips to right in RTL.',
    'border-inline-start creates a left accent in LTR that becomes a right accent in RTL with no override.',
    'inline-size = width, block-size = height in horizontal-tb writing mode.',
  ],
  interviewFocus: [
    'What is the difference between physical and logical CSS properties?',
    'How do logical properties handle RTL layouts without direction-specific overrides?',
    'What does inline-size map to in horizontal vs vertical writing modes?',
    'When would you still prefer physical properties over logical ones?',
  ],
};

@Component({
  selector: 'app-css-logical-properties',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './logical-properties.html',
  styleUrl: './logical-properties.scss',
})
export class CssLogicalProperties {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
