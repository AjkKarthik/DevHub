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
  { name: 'font-display: swap',   type: 'keyword',  desc: 'Show fallback font immediately; swap to web font when loaded — prevents invisible text.' },
  { name: 'clamp(min, val, max)', type: 'function', desc: 'Fluid value between min and max. clamp(1rem, 2.5vw, 1.5rem) for fluid type.' },
  { name: 'line-height',          type: 'keyword',  desc: 'Unitless value recommended: line-height: 1.5 (scales with font-size).' },
  { name: 'font-size-adjust',     type: 'keyword',  desc: 'Normalizes x-height across fallback and web fonts to reduce layout shift.' },
  { name: 'text-wrap: balance',   type: 'keyword',  desc: 'Balances line lengths in headings — prevents single-word last lines.' },
  { name: 'font-variant-numeric', type: 'keyword',  desc: 'Controls number rendering: tabular-nums aligns numbers in tables.' },
  { name: '@font-face',           type: 'syntax',   desc: 'Loads a custom web font with src, format, and font-display control.' },
  { name: 'variable fonts',       type: 'keyword',  desc: 'Single font file with axes (weight, width, slant) — replaces multiple files.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Font Loading and Performance',
    points: [
      '@font-face with font-display: swap shows a fallback font immediately, swapping when the web font loads — prevents FOIT (Flash of Invisible Text).',
      'Preload the most critical web font with <link rel="preload" as="font" crossorigin>.',
      'Variable fonts (WOFF2) replace multiple weight/style files — one file covers the entire type family.',
      'System font stack (-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif) renders instantly with no network request.',
      'Use font-size-adjust to preserve x-height across fallback and loaded fonts, reducing Cumulative Layout Shift.',
    ],
  },
  {
    heading: 'Fluid Typography with clamp()',
    points: [
      'clamp(min, preferred, max) sets a value that scales with viewport but stays within bounds.',
      'font-size: clamp(1rem, 2.5vw, 1.5rem) — 1rem on small screens, grows with viewport, caps at 1.5rem.',
      'The preferred value is typically a vw expression: font-size: clamp(1rem, 1rem + 1vw, 1.25rem).',
      'Fluid type eliminates most font-size media queries — one rule works across all screen sizes.',
      'Use a type scale (Major Third: ×1.25, Perfect Fourth: ×1.333) for consistent visual hierarchy.',
    ],
  },
  {
    heading: 'Line Height, Spacing, and Readability',
    points: [
      'Use unitless line-height (1.5) not fixed values (24px) — it scales automatically with font-size.',
      'Body text: line-height 1.5–1.6. Headings: 1.1–1.3 (tighter is more impactful at large sizes).',
      'Optimal line length is 60–75 characters. Use max-width: 65ch on text containers.',
      'letter-spacing: slight positive tracking on all-caps, slight negative on large headings.',
      'text-wrap: balance prevents orphaned single words on the last line of headings.',
    ],
  },
  {
    heading: 'Variable Fonts and OpenType Features',
    points: [
      'Variable fonts expose axes: wght (weight), wdth (width), ital (italic), slnt (slant), opsz (optical size).',
      'font-variation-settings: "wght" 650 sets a continuous weight, not just the 100-step increments.',
      'font-optical-sizing: auto activates optical size axis if available — improves legibility at small sizes.',
      'font-variant-numeric: tabular-nums ensures numbers align in price lists and data tables.',
      'font-variant-ligatures: common-ligatures enables fi, fl, ff ligatures for refined typography.',
    ],
  },
  {
    heading: 'Fluid Typography with clamp()',
    points: [
      'clamp(min, preferred, max) lets font-size scale fluidly between a minimum and maximum based on viewport width, eliminating the need for multiple discrete media-query-based font-size overrides at each breakpoint — the text size smoothly interpolates rather than jumping abruptly at fixed breakpoints.',
      'The "preferred" middle value in clamp() is typically expressed using viewport units (like 4vw) so it scales proportionally with viewport width, while the min and max values (often in rem) cap the range so text never becomes unreadably small or excessively large at extreme viewport sizes.',
      'Fluid typography with clamp() should still respect user font-size preferences and browser zoom — combining rem-based min/max bounds (which scale with the user\'s base font size setting) with vw-based scaling in the middle preserves accessibility while still achieving fluid responsive behavior.',
      'Testing fluid typography across the full range of realistic viewport widths (not just a couple of common breakpoints) catches awkward intermediate sizes that discrete breakpoint-based font sizing would never reveal, since clamp() produces a continuous range of possible sizes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Font Loading',
    language: 'css',
    code: `/* @font-face with performance settings */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;       /* variable font weight range */
  font-style: normal;
  font-display: swap;         /* show fallback, swap when loaded */
  font-size-adjust: 0.52;     /* match x-height of fallback font */
}

/* System font stack — zero network cost */
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI',
               Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'Fira Code', 'Cascadia Code', Consolas,
               'Courier New', monospace;
}

body {
  font-family: 'Inter', var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
}`,
  },
  {
    label: 'Fluid Type Scale',
    language: 'css',
    code: `:root {
  /* Fluid type scale using clamp() */
  --text-xs:   clamp(0.75rem,  0.7rem + 0.25vw, 0.875rem);
  --text-sm:   clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem,     0.9rem + 0.5vw,   1.125rem);
  --text-lg:   clamp(1.125rem, 1rem + 0.625vw,   1.25rem);
  --text-xl:   clamp(1.25rem,  1.1rem + 0.75vw,  1.5rem);
  --text-2xl:  clamp(1.5rem,   1.3rem + 1vw,     2rem);
  --text-3xl:  clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem);
  --text-4xl:  clamp(2.25rem,  1.75rem + 2.5vw,  3.5rem);
}

h1 { font-size: var(--text-4xl); line-height: 1.1; }
h2 { font-size: var(--text-3xl); line-height: 1.2; }
h3 { font-size: var(--text-2xl); line-height: 1.3; }
p  { font-size: var(--text-base); line-height: 1.6; }`,
  },
  {
    label: 'Readability Rules',
    language: 'css',
    code: `/* Optimal reading width */
.prose {
  max-width: 65ch;           /* ~65 characters per line */
  margin: 0 auto;
}

/* Heading improvements */
h1, h2, h3 {
  text-wrap: balance;        /* prevent single-word last lines */
  font-optical-sizing: auto; /* use optical size axis if available */
  letter-spacing: -0.025em;  /* tighten tracking at large sizes */
}

/* Paragraph spacing */
.prose p + p { margin-top: 1.25em; }

/* Numeric alignment in tables */
.data-table td { font-variant-numeric: tabular-nums; }

/* Prevent orphans */
p { orphans: 3; widows: 3; }

/* Drop cap on first paragraph */
.prose > p:first-of-type::first-letter {
  font-size: 3.5em;
  line-height: 1;
  float: left;
  margin-right: 0.1em;
  font-weight: 700;
}`,
  },
  {
    label: 'Variable Font Axes',
    language: 'css',
    code: `/* Variable font — continuous weight axis */
@font-face {
  font-family: 'InterVar';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

/* Use standard font-weight — browser maps to axis */
.regular { font-weight: 400; }
.medium  { font-weight: 500; }
.bold    { font-weight: 700; }

/* Or use font-variation-settings for precise control */
.display {
  font-variation-settings: 'wght' 800, 'opsz' 32;
}

/* Animated weight on hover (with @property or transition) */
.logo {
  font-variation-settings: 'wght' 400;
  transition: font-variation-settings 0.3s ease;
}

.logo:hover {
  font-variation-settings: 'wght' 800;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using px for line-height',
    wrong: `p { font-size: 16px; line-height: 24px; }
h2 { font-size: 32px; line-height: 24px; }  /* too tight! */`,
    right: `p  { font-size: 16px; line-height: 1.6; }
h2 { font-size: 32px; line-height: 1.2; }  /* scales with font-size */`,
    explanation: 'Unitless line-height multiplies the element\'s font-size. Fixed px values don\'t scale — headings end up with too-tight or too-loose line spacing.',
  },
  {
    title: 'Not setting font-display on @font-face',
    wrong: `@font-face {
  font-family: 'MyFont';
  src: url('/fonts/my-font.woff2') format('woff2');
}`,
    right: `@font-face {
  font-family: 'MyFont';
  src: url('/fonts/my-font.woff2') format('woff2');
  font-display: swap;
}`,
    explanation: 'Without font-display, browsers block text rendering until the font loads (FOIT). font-display: swap shows the fallback immediately, improving CLS and LCP metrics.',
  },
  {
    title: 'Using em for font-size on nested elements',
    wrong: `.parent { font-size: 1.25em; }
.child  { font-size: 1.25em; }  /* 1.25 × 1.25 = 1.5625rem — compounding! */`,
    right: `.parent { font-size: 1.25rem; }
.child  { font-size: 1rem; }    /* rem = relative to root, never compounds */`,
    explanation: 'em compounds in nested elements — each level multiplies the parent\'s size. Use rem for font-size to always be relative to the root font size.',
  },
  {
    title: 'Skipping crossorigin on font preloads',
    wrong: `<link rel="preload" href="/fonts/inter.woff2" as="font">`,
    right: `<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>`,
    explanation: 'Font requests use CORS even for same-origin fonts. Without crossorigin on the preload, the browser downloads the font twice — once for the preload, once when @font-face requests it.',
  },
];

const challenge: Challenge = {
  title: 'Fluid Typography System',
  language: 'html',
  description: 'Build a typography system for an article page. Requirements: (1) A fluid type scale using clamp() for h1–h3 and body text. (2) A readable prose container with optimal line length. (3) A drop cap on the first paragraph. (4) Balanced headings using text-wrap. All font sizes must scale smoothly between mobile and desktop with zero media queries.',
  hints: [
    'Use clamp(min, preferred, max) for each text level — preferred is a vw expression.',
    'Set max-width: 65ch on the prose container for readable line length.',
    'Use ::first-letter pseudo-element for the drop cap with float: left.',
    'Add text-wrap: balance to headings to prevent orphaned words.',
  ],
  starterCode: `<article class="prose">
  <h1>The Art of Web Typography</h1>
  <h2>Why Typography Matters</h2>
  <p>Good typography is invisible. The reader absorbs your content without noticing the craft behind it. Poor typography creates friction — lines too long, text too small, heading hierarchy unclear.</p>
  <h3>Getting the Basics Right</h3>
  <p>Start with a clear type scale, comfortable line height, and an optimal measure (line length). Everything else follows from these three decisions.</p>
</article>`,
  solution: `:root {
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg:   clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-xl:   clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);
  --text-2xl:  clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
}

.prose {
  max-width: 65ch;
  margin: 2rem auto;
  padding: 0 1rem;
  font-size: var(--text-base);
  line-height: 1.6;
  font-family: system-ui, sans-serif;
  color: #1e293b;
}

h1 {
  font-size: var(--text-2xl);
  line-height: 1.1;
  text-wrap: balance;
  letter-spacing: -0.03em;
  margin-bottom: 0.5em;
}

h2 {
  font-size: var(--text-xl);
  line-height: 1.2;
  text-wrap: balance;
  margin-top: 1.5em;
}

h3 {
  font-size: var(--text-lg);
  line-height: 1.3;
  text-wrap: balance;
  margin-top: 1.25em;
}

p { margin-bottom: 1.25em; }

/* Drop cap on first paragraph */
.prose > p:first-of-type::first-letter {
  font-size: 3.5em;
  line-height: 1;
  float: left;
  margin-right: 0.08em;
  font-weight: 700;
  color: #264de4;
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does font-display: swap do?',
    options: [
      'Swaps all fonts to system fonts permanently',
      'Shows a fallback font immediately and swaps to the web font when loaded',
      'Downloads multiple font weights simultaneously',
      'Prevents font loading until the page is interactive',
    ],
    answer: 1,
    explanation: 'font-display: swap tells the browser to render text with a fallback font immediately (no invisible text) and replace it with the web font once it finishes loading.',
  },
  {
    q: 'What does clamp(1rem, 2.5vw, 1.5rem) mean for font-size?',
    options: [
      'Font is always 2.5vw wide',
      'Font scales with viewport width but is never smaller than 1rem or larger than 1.5rem',
      'Font is 1rem on mobile and 1.5rem on desktop with no smooth scaling',
      'The middle value is ignored — only min and max matter',
    ],
    answer: 1,
    explanation: 'clamp() sets a fluid value: minimum 1rem (floors at small viewports), preferred 2.5vw (scales with viewport), maximum 1.5rem (caps at large viewports).',
  },
  {
    q: 'Why is unitless line-height preferred over px values?',
    options: [
      'Unitless values render faster in the browser',
      'px values are deprecated in CSS',
      'Unitless values scale automatically with the element\'s font-size',
      'Unitless values only work with variable fonts',
    ],
    answer: 2,
    explanation: 'Unitless line-height (e.g. 1.5) multiplies the element\'s own font-size. A fixed px value creates tight or loose spacing when font-size changes — headings need tighter line-height than body text.',
  },
  {
    q: 'What is a variable font?',
    options: [
      'A font that uses CSS variables for color',
      'A single font file with continuous axes (weight, width, slant) replacing multiple files',
      'A font that varies in size based on the viewport',
      'A font loaded conditionally based on browser support',
    ],
    answer: 1,
    explanation: 'Variable fonts embed multiple design variants (weight, width, italic, optical size) into one file with continuous axes. One file replaces a traditional font family of 6–12 separate files.',
  },
  {
    q: 'What does text-wrap: balance do?',
    options: [
      'Makes all paragraphs the same width',
      'Centers all text horizontally',
      'Distributes text across lines to avoid orphaned short last lines in headings',
      'Prevents text from overflowing its container',
    ],
    answer: 2,
    explanation: 'text-wrap: balance adjusts line breaks in headings and short text blocks to produce roughly equal line lengths, preventing a single word hanging alone on the last line.',
  },
  {
    q: 'Why should font preload links include the crossorigin attribute?',
    options: [
      'To allow third-party sites to use the font',
      'Fonts use CORS even for same-origin requests — without crossorigin the browser downloads twice',
      'crossorigin is required to enable font-display: swap',
      'To prevent the browser from caching the font file',
    ],
    answer: 1,
    explanation: 'Font requests are CORS requests even for same-origin fonts. If the preload link lacks crossorigin, the browser treats the preload and the @font-face request as different fetches and downloads the font twice.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is FOIT and how do I prevent it?',
    a: 'FOIT (Flash of Invisible Text) happens when a web font hasn\'t loaded yet and the browser hides text until it arrives. Prevent it with font-display: swap in your @font-face rule — this shows a fallback font immediately and swaps when the web font loads. font-display: optional never swaps at all (no CLS, may not show the web font on slow connections).',
  },
  {
    q: 'What is the difference between em and rem for font sizes?',
    a: 'rem (root em) is always relative to the root element\'s font-size (usually 16px). em is relative to the element\'s own font-size — and compounds in nested elements. Use rem for font-size to avoid compounding. Use em for spacing (padding, margin) when you want it to scale with the element\'s text size.',
  },
  {
    q: 'What is an optimal line length and how do I set it?',
    a: 'Research suggests 60–75 characters per line for comfortable reading. Set max-width: 65ch on the text container — ch is the width of the "0" character in the current font, so 65ch approximates 65 characters. This is font-size-aware and adapts as the font changes.',
  },
  {
    q: 'How do I use Google Fonts without hurting performance?',
    a: 'Preconnect to Google\'s font CDN early: <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>. Use display=swap in the URL query string. Better yet, self-host WOFF2 files — download from fonts.google.com, serve from your domain, and add font-display: swap in @font-face. Self-hosting avoids a third-party DNS lookup on every page load.',
  },
  {
    q: 'When should I use a variable font?',
    a: 'Use a variable font whenever you need more than two or three weights/styles from the same typeface. One variable font file (WOFF2) with all axes is almost always smaller than loading four separate static font files. Google Fonts offers variable versions of most popular fonts — check the "Variable" filter on fonts.google.com.',
  },
  {
    q: 'How do I make typography accessible?',
    a: 'Minimum body font-size of 16px (1rem). Never set font-size smaller than 12px. Line-height at least 1.5 for body text. Sufficient color contrast (4.5:1 for normal text, 3:1 for large text — WCAG AA). Don\'t use font-weight: 100 for body text — too thin to read at small sizes. Avoid all-caps for long text passages.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSS typography covers font loading, fluid sizing with clamp(), readability rules, and variable fonts — all working together for performance and beauty.',
  mustKnow: [
    'font-display: swap prevents FOIT — always set it in @font-face.',
    'clamp(min, preferred, max) creates fluid type that scales with viewport.',
    'Unitless line-height (1.5) scales with font-size; px values don\'t.',
    'max-width: 65ch on prose containers gives optimal reading line length.',
    'Variable fonts = one file with all weights/styles — replaces multiple files.',
    'text-wrap: balance prevents orphaned single-word lines in headings.',
  ],
  interviewFocus: [
    'What is FOIT and how do you prevent it?',
    'How does clamp() work for fluid typography?',
    'Why is unitless line-height better than px?',
    'What are variable fonts and when should you use them?',
  ],
};

@Component({
  selector: 'app-css-typography',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './typography.html',
  styleUrl: './typography.scss',
})
export class CssTypography {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
