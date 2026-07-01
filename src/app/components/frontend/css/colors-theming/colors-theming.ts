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
  { name: 'oklch(L C H)',             type: 'function', desc: 'Perceptually uniform color space — equal lightness values look equally bright.' },
  { name: 'hsl(H S% L%)',             type: 'function', desc: 'Older color space — lightness is not perceptually uniform across hues.' },
  { name: 'color-mix(in oklch, …)',   type: 'function', desc: 'Mix two colors in a given color space — CSS-native tinting and shading.' },
  { name: 'prefers-color-scheme',     type: 'keyword',  desc: 'Media feature: dark | light — detects the OS-level dark/light preference.' },
  { name: 'color-scheme: dark light', type: 'keyword',  desc: 'Tells the browser which modes the page supports — affects form controls and scrollbars.' },
  { name: 'forced-colors: active',    type: 'keyword',  desc: 'Media feature — fires when the OS is in high-contrast/forced-colors mode.' },
  { name: 'var(--token)',             type: 'keyword',  desc: 'Reads a CSS custom property (design token) — core of any theming system.' },
  { name: 'contrast-color()',         type: 'function', desc: 'Upcoming CSS function that auto-picks black or white for readable contrast.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Modern Color Spaces',
    points: [
      'RGB and HEX are display-centric — they don\'t match how humans perceive color differences.',
      'HSL is more intuitive but has a uniformity problem: a yellow at 50% lightness looks far brighter than a blue at 50%.',
      'oklch (Oklab LCH) is perceptually uniform — changing lightness by 10 always looks like the same visual step, regardless of hue.',
      'color-mix(in oklch, red 50%, blue) produces a natural purple — mixing in sRGB produces a muddy brown.',
      'Use oklch for design tokens and gradients; hex/rgb is fine for fixed values that won\'t be manipulated.',
    ],
  },
  {
    heading: 'Dark Mode Strategies',
    points: [
      'Strategy 1 — OS preference only: @media (prefers-color-scheme: dark) overrides :root tokens. Zero JavaScript.',
      'Strategy 2 — Class toggle: body.dark overrides :root tokens. Allows user to override the OS preference.',
      'DevHub uses Strategy 2 (:host-context(body.dark)) — a class on body gives the user control and avoids the media query rendering bug.',
      'Design tokens: define --bg, --surface, --text, --border, --accent on :root; override in dark context. Never hardcode colors.',
      'color-scheme: dark light on :root tells the browser to style native form controls, scrollbars, and select menus in the correct mode.',
    ],
  },
  {
    heading: 'Accessible Color',
    points: [
      'WCAG AA requires 4.5:1 contrast ratio for normal text (under 18px/14px bold), 3:1 for large text and UI components.',
      'WCAG AAA requires 7:1 for normal text — aim for this on body text in production.',
      'Never use color alone to convey information — pair color with icons, labels, borders, or patterns.',
      'Test with forced-colors: active (Windows High Contrast Mode) — borders and outlines must work without relying on background fills.',
      'Use a tool like Colour Contrast Analyser or browser DevTools to check contrast before shipping.',
    ],
  },
  {
    heading: 'Modern CSS Color Functions Beyond Hex and RGB',
    points: [
      'oklch() and lch() define colors in a perceptually uniform color space, meaning equal numeric changes in lightness or chroma produce visually equal-feeling changes — unlike HSL, where adjusting lightness by the same amount can look very different depending on the base hue.',
      'color-mix() lets you blend two colors directly in CSS (color-mix(in oklch, blue 50%, white)) without needing a preprocessor function or manually calculating the resulting hex value — enabling dynamic color derivations (lighter/darker variants) directly from a base theme color.',
      'Wide-gamut color spaces (display-p3) allow specifying colors outside the traditional sRGB gamut, taking advantage of modern displays capable of showing a wider, more vivid range of colors — falling back gracefully to the closest representable sRGB color on displays that do not support the wider gamut.',
      'Relative color syntax (color-mix combined with functions like oklch(from var(--base) l c h / 0.5)) enables deriving new colors from an existing custom property at specific opacity or lightness levels without maintaining separate manually-calculated color variables for every variant.',
    ],
  },
  {
    heading: 'Dark Mode Theming Architecture',
    points: [
      'Theming via CSS custom properties (defining --bg-color, --text-color, etc. at the :root level and overriding them inside a .dark class or [data-theme="dark"] attribute selector) is the standard modern approach — component styles reference the variables once and automatically adapt when the theme changes.',
      'Class-based theme toggling (adding/removing a class on the body or html element, as opposed to relying solely on the prefers-color-scheme media query) gives explicit user control over the theme — essential for supporting a manual light/dark toggle rather than only following system preference.',
      'color-scheme: dark (or light) as a CSS property/meta tag hints to the browser to render native form controls, scrollbars, and other browser UI elements in the matching theme automatically, avoiding a jarring mismatch where custom content is dark-themed but native browser widgets remain light.',
      'Testing dark mode requires verifying sufficient contrast ratios in BOTH themes independently — a color combination that passes WCAG contrast requirements in light mode does not automatically pass in dark mode, since the actual rendered colors and their relationship change entirely.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'oklch & Color Spaces',
    language: 'css',
    code: `/* oklch(lightness chroma hue) */
:root {
  --blue:   oklch(0.55 0.20 264);   /* vivid blue */
  --tint:   oklch(0.97 0.03 264);   /* very light blue */
  --dark-blue: oklch(0.45 0.20 264);
}

/* color-mix: tinting and shading */
.btn-hover {
  background: color-mix(in oklch, var(--blue) 85%, black);
}

.badge {
  background: color-mix(in oklch, var(--blue) 15%, white);
  color: var(--blue);
}

/* Gradient in oklch — no muddy midpoints */
.hero {
  background: linear-gradient(
    to right,
    oklch(0.65 0.20 264),
    oklch(0.65 0.20 320)
  );
}`,
  },
  {
    label: 'Design Tokens',
    language: 'css',
    code: `/* Light theme — base tokens */
:root {
  --bg:       oklch(0.99 0 0);
  --surface:  oklch(0.96 0 0);
  --border:   oklch(0.88 0 0);
  --text:     oklch(0.20 0 0);
  --muted:    oklch(0.55 0 0);
  --accent:   oklch(0.55 0.20 264);
  --accent-tint: oklch(0.97 0.03 264);

  color-scheme: light dark;
}

/* Usage */
body {
  background: var(--bg);
  color: var(--text);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}

.label {
  background: var(--accent-tint);
  color: var(--accent);
}`,
  },
  {
    label: 'Dark Mode Patterns',
    language: 'css',
    code: `/* Strategy 1: OS preference (zero JS) */
@media (prefers-color-scheme: dark) {
  :root {
    --bg:      oklch(0.12 0 0);
    --surface: oklch(0.17 0 0);
    --border:  oklch(0.25 0 0);
    --text:    oklch(0.95 0 0);
    --muted:   oklch(0.65 0 0);
    --accent:  oklch(0.75 0.15 264);
  }
}

/* Strategy 2: Class toggle (DevHub pattern) */
body.dark {
  --bg:      oklch(0.12 0 0);
  --surface: oklch(0.17 0 0);
  --border:  oklch(0.25 0 0);
  --text:    oklch(0.95 0 0);
  --muted:   oklch(0.65 0 0);
  --accent:  oklch(0.75 0.15 264);
}

/* Transition tokens for smooth mode switch */
body {
  transition: background 0.2s ease, color 0.2s ease;
}`,
  },
  {
    label: 'Forced Colors & Contrast',
    language: 'css',
    code: `/* High contrast / forced-colors mode */
@media (forced-colors: active) {
  .btn {
    border: 2px solid ButtonText;  /* system keyword */
    forced-color-adjust: none;     /* opt out of recoloring for specific elements */
  }

  .badge {
    background: Highlight;
    color: HighlightText;
  }
}

/* Checking contrast with DevTools */
/* Target: 4.5:1 for body text (WCAG AA) */
/* These pass: */
/* oklch(0.20 0 0) on oklch(0.99 0 0) ≈ 16:1 */
/* oklch(0.55 0.20 264) on white ≈ 4.7:1 ✓ */

/* Accessible focus ring — visible in both modes */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Hardcoding colors instead of design tokens',
    wrong: `.card { background: #f8fafc; color: #1e293b; }
.dark .card { background: #1e293b; color: #f8fafc; }`,
    right: `.card { background: var(--surface); color: var(--text); }
/* tokens switch automatically in dark mode — no per-component overrides */`,
    explanation: 'Hardcoding colors in every component means updating dark mode requires hunting down every color in every file. Design tokens centralise the change to a single :root override.',
  },
  {
    title: 'Using HSL for gradients (muddy midpoints)',
    wrong: `background: linear-gradient(to right, hsl(220, 80%, 50%), hsl(280, 80%, 50%));`,
    right: `background: linear-gradient(to right, oklch(0.55 0.20 220), oklch(0.55 0.20 280));`,
    explanation: 'HSL gradients through certain hue ranges produce desaturated muddy midpoints. oklch gradients maintain consistent chroma throughout — the colour stays vivid across the range.',
  },
  {
    title: 'Relying only on color to convey meaning',
    wrong: `/* Error state shown only by red text */
.field-error { color: red; }`,
    right: `/* Error state has color + icon + border */
.field-error { color: var(--error); border-color: var(--error); }
.field-error::before { content: '⚠ '; }`,
    explanation: 'WCAG 1.4.1 requires that information conveyed by color is also conveyed by another means (text, icon, border). Color-blind users cannot distinguish red from green.',
  },
  {
    title: 'Insufficient contrast ratio',
    wrong: `/* Muted gray text on white — fails WCAG AA */
.hint { color: #aaa; background: #fff; } /* ~2.3:1 */`,
    right: `/* Minimum 4.5:1 for body text */
.hint { color: #767676; background: #fff; } /* 4.5:1 exactly */`,
    explanation: 'WCAG AA requires 4.5:1 contrast for text under 18px (or 14px bold). #aaa on white is ~2.3:1 — many users with low vision will struggle to read it.',
  },
  {
    title: 'Not handling forced-colors mode',
    wrong: `.badge { background: var(--accent); color: #fff; }
/* looks invisible in Windows High Contrast Mode */`,
    right: `.badge { background: var(--accent); color: #fff; }
@media (forced-colors: active) {
  .badge { border: 1px solid ButtonText; }
}`,
    explanation: 'In forced-colors mode, the OS overrides all background and foreground colors. Borders and outlines are preserved — use them to ensure interactive elements remain visible.',
  },
];

const challenge: Challenge = {
  title: 'Themed Card Component',
  language: 'html',
  description: 'Build a card component that: (1) Defines all colors as design tokens on :root. (2) Switches automatically to dark mode using @media (prefers-color-scheme: dark) OR a body.dark class. (3) Uses oklch for all token values. (4) Has a primary button with accessible 4.5:1 contrast in both modes. (5) The card border and surface are distinct from the page background in both modes.',
  hints: [
    'Start by defining 5 tokens: --bg, --surface, --border, --text, --accent on :root.',
    'For dark mode, override the same tokens inside @media (prefers-color-scheme: dark) — no need to touch the .card rules.',
    'Use oklch(0.55 0.20 264) for a vivid blue accent — increase lightness to ~0.75 for dark mode where bright colors feel too harsh.',
    'Test your contrast: oklch(0.20 0 0) text on oklch(0.99 0 0) bg should be well above 4.5:1.',
  ],
  starterCode: `<div class="card">
  <h3 class="card-title">Feature Card</h3>
  <p class="card-body">A short description of this feature that adapts to light and dark mode automatically.</p>
  <button class="btn-primary">Learn More</button>
</div>`,
  solution: `:root {
  --bg:      oklch(0.99 0 0);
  --surface: oklch(0.96 0 0);
  --border:  oklch(0.88 0 0);
  --text:    oklch(0.20 0 0);
  --muted:   oklch(0.50 0 0);
  --accent:  oklch(0.55 0.20 264);
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:      oklch(0.12 0 0);
    --surface: oklch(0.18 0 0);
    --border:  oklch(0.28 0 0);
    --text:    oklch(0.95 0 0);
    --muted:   oklch(0.65 0 0);
    --accent:  oklch(0.72 0.15 264);
  }
}

body { background: var(--bg); color: var(--text); font-family: system-ui; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 360px;
}

.card-title { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem; }
.card-body  { color: var(--muted); margin: 0 0 1.25rem; line-height: 1.6; }

.btn-primary {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-primary:hover { opacity: 0.85; }
.btn-primary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why is oklch preferred over HSL for design systems?',
    options: [
      'oklch has wider browser support than HSL',
      'oklch is perceptually uniform — equal lightness changes look equally bright across all hues',
      'oklch produces smaller file sizes than HSL values',
      'oklch is required by WCAG 2.2',
    ],
    answer: 1,
    explanation: 'HSL lightness is not perceptually uniform — yellow at 50% lightness looks much brighter than blue at 50%. oklch keeps perceived brightness consistent, making design tokens predictable.',
  },
  {
    q: 'What is the minimum contrast ratio required by WCAG AA for normal body text?',
    options: [
      '2:1',
      '3:1',
      '4.5:1',
      '7:1',
    ],
    answer: 2,
    explanation: 'WCAG AA requires 4.5:1 for normal text (under 18px / 14px bold) and 3:1 for large text and UI components. WCAG AAA requires 7:1 for normal text.',
  },
  {
    q: 'What does "color-scheme: light dark" on :root do?',
    options: [
      'Forces the page into dark mode',
      'Tells the browser which modes the page supports so it can style native controls correctly',
      'Enables the color-mix() function',
      'Overrides prefers-color-scheme media queries',
    ],
    answer: 1,
    explanation: 'color-scheme tells the browser that the page supports both light and dark modes. The browser then styles native form controls, scrollbars, and system UI in the appropriate mode.',
  },
  {
    q: 'Which color-mix() call produces a natural purple (no muddy midpoint)?',
    options: [
      'color-mix(in srgb, red 50%, blue 50%)',
      'color-mix(in hsl, red 50%, blue 50%)',
      'color-mix(in oklch, red 50%, blue 50%)',
      'color-mix(in rgb, red 50%, blue 50%)',
    ],
    answer: 2,
    explanation: 'Mixing red and blue in oklch produces a vivid purple. Mixing in sRGB or HSL produces a muddy brownish-grey because those spaces don\'t preserve chroma through the midpoint.',
  },
  {
    q: 'How should you convey an error state accessibly?',
    options: [
      'Use red text only — it is universally understood',
      'Use a red background with white text for high contrast',
      'Combine color with an icon, border, or text label so it is not color-only',
      'Use animation to draw attention to the error',
    ],
    answer: 2,
    explanation: 'WCAG 1.4.1 (Use of Color) requires that information is not conveyed by color alone. Pair color with an icon, text indicator, or border so color-blind users receive the same information.',
  },
  {
    q: 'What CSS media feature fires when Windows High Contrast Mode is active?',
    options: [
      'prefers-contrast: more',
      'forced-colors: active',
      'prefers-color-scheme: high-contrast',
      'color-mode: forced',
    ],
    answer: 1,
    explanation: 'forced-colors: active fires when the operating system is in High Contrast or forced-colors mode. In this mode, the OS overrides most colors — borders and outlines are preserved.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between prefers-color-scheme and a body.dark class?',
    a: 'prefers-color-scheme reads the OS-level preference automatically — zero JavaScript. A body.dark class requires JavaScript to set/remove the class but lets the user override their OS preference within your app. Most production apps implement both: default to the OS preference, then allow user override via a toggle that persists to localStorage.',
  },
  {
    q: 'When should I use color-mix() vs opacity for tinting?',
    a: 'color-mix() produces an opaque result in a specified color space — the tinted color has no transparency, so it works on any background. opacity (or rgba/hsla alpha) makes the color transparent — it blends with whatever is behind it. Use color-mix() for solid tint badges and buttons, rgba for overlays and shadows.',
  },
  {
    q: 'How do I generate a full color palette from one oklch base color?',
    a: 'Fix the chroma (C) and hue (H) and vary the lightness (L). oklch(0.95 0.05 264) is very light tint, oklch(0.55 0.20 264) is the base, oklch(0.25 0.15 264) is a dark shade. Because oklch is perceptually uniform, each step looks like the same visual jump. Tools like Radix Palette or oklch.com generate full scales this way.',
  },
  {
    q: 'Should I use :root or body for design token overrides in dark mode?',
    a: 'Either works, but :root (the html element) has slightly higher specificity than body and is the conventional choice. If you use a body.dark class toggle (like DevHub), override on body — specificity is fine because the class increases it. Avoid overriding on both :root and body as it creates specificity confusion.',
  },
  {
    q: 'How do I test color contrast without a dedicated tool?',
    a: 'Chrome DevTools: hover over a color value in the Styles panel → click the swatch → the picker shows the contrast ratio against the current background and a WCAG pass/fail badge. Firefox DevTools has a similar feature. For automated testing, the Axe or Lighthouse accessibility audits check contrast on the rendered page.',
  },
  {
    q: 'What is the difference between WCAG AA and AAA contrast?',
    a: 'AA is the legal minimum in most jurisdictions: 4.5:1 for normal text, 3:1 for large text and UI components. AAA is the enhanced standard: 7:1 for normal text, 4.5:1 for large text. Aim for AA as the baseline. AAA on body text is ideal but difficult to achieve while maintaining a distinctive brand palette. Prioritise AAA for critical content like error messages.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Use oklch design tokens for predictable color systems, @media (prefers-color-scheme) for auto dark mode, and always verify 4.5:1 contrast for WCAG AA compliance.',
  mustKnow: [
    'oklch is perceptually uniform — equal lightness steps look equally bright across all hues, unlike HSL.',
    'Design tokens on :root: --bg, --surface, --border, --text, --accent — override in dark mode context.',
    'color-mix(in oklch, ...) for tinting and shading without alpha transparency.',
    'WCAG AA: 4.5:1 for body text, 3:1 for large text/UI. Never use color alone to convey meaning.',
    'forced-colors: active (High Contrast Mode) — borders/outlines are preserved; backgrounds are overridden.',
    'color-scheme: light dark tells the browser to style native controls in the correct mode.',
  ],
  interviewFocus: [
    'Why is oklch preferred over HSL for design systems?',
    'How would you implement dark mode — prefers-color-scheme vs class toggle?',
    'What does WCAG AA require for text contrast, and how do you verify it?',
    'How does color-mix() differ from using rgba for tinting?',
  ],
};

@Component({
  selector: 'app-css-colors-theming',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './colors-theming.html',
  styleUrl: './colors-theming.scss',
})
export class CssColorsTheming {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
