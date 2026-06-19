import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickRefComponent, QuickRefItem }         from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint }       from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab }             from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake }  from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge }      from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion }        from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem }              from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary }  from '../../../shared/revision-card/revision-card';
import { PageMetaComponent }                       from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent }                   from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-perf-font-performance',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './font-performance.html',
  styleUrl: './font-performance.scss',
})
export class PerfFontPerformance {

  quickRef: QuickRefItem[] = [
    { name: 'font-display: swap',      type: 'keyword', desc: 'Show fallback text immediately; swap to webfont when ready — FOUT risk, fastest text render' },
    { name: 'font-display: optional',  type: 'keyword', desc: 'Give font 100ms; if not ready use fallback forever — zero FOUT/CLS, may not load on slow connections' },
    { name: 'font-display: block',     type: 'keyword', desc: 'Hide text for ~3s (FOIT) then show webfont — bad for UX; only use for icon fonts' },
    { name: 'FOUT',                    type: 'keyword', desc: 'Flash of Unstyled Text — fallback font shows, then swaps to webfont; can cause CLS if metrics differ' },
    { name: 'FOIT',                    type: 'keyword', desc: 'Flash of Invisible Text — text hidden until webfont loads; default browser behaviour without font-display' },
    { name: 'size-adjust',             type: 'syntax',  desc: '@font-face descriptor: scales fallback font to match webfont metrics — reduces CLS on swap' },
    { name: 'Unicode-range',           type: 'syntax',  desc: '@font-face subsetting: only download the font for specified Unicode ranges (Latin, Cyrillic, etc.)' },
    { name: 'Variable font',           type: 'keyword', desc: 'Single font file with multiple axes (weight, width, slant) — replaces 4-6 static weight files' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'font-display — the most impactful font setting',
      points: [
        'Without font-display, browsers use FOIT (invisible text for ~3s, then webfont) — hurts LCP and readability.',
        'font-display: swap — render fallback immediately, swap when webfont ready. Best for body text; risk: CLS if metrics differ.',
        'font-display: fallback — 100ms block window, 3s swap window; if font not ready in 3s, stays on fallback forever.',
        'font-display: optional — 100ms only; after that, uses fallback permanently for this page load. Zero FOUT/CLS but font may never appear on slow connections.',
        'font-display: block — 3s invisible text window; only justified for icon fonts where fallback characters are meaningless.',
      ],
    },
    {
      heading: 'Font subsetting — dramatic file size reduction',
      points: [
        'Full Inter font family: ~1.2 MB. Latin subset only: ~50 KB. 96% size reduction.',
        'Google Fonts adds &subset=latin to its CSS automatically — a major reason to use it for Latin-only sites.',
        'Self-hosting: use glyphhanger or fonttools to generate subsets of only the characters you actually use.',
        'unicode-range in @font-face: browser only downloads the font file if the page contains characters in that range.',
        'Critical path: subset + woff2 + preload = fastest possible font loading for self-hosted fonts.',
      ],
    },
    {
      heading: 'woff2 — the only font format you need',
      points: [
        'woff2 uses Brotli compression internally — 30% smaller than woff1, 60% smaller than TTF.',
        'Supported by every browser released since 2016 — no need for eot, svg, or ttf fallbacks.',
        'Single @font-face src: url(font.woff2) format(\'woff2\') is sufficient for all modern browsers.',
        'Convert TTF/OTF to woff2 with fonttools (pyftsubset) or the online font squirrel generator.',
        'Self-host woff2 files for maximum cache control and to avoid third-party DNS lookup overhead.',
      ],
    },
    {
      heading: 'Preloading fonts — eliminate late discovery',
      points: [
        'Without preload, font requests are not discovered until the browser downloads the CSS and computes which font to use.',
        '<link rel="preload" as="font" type="font/woff2" href="..." crossorigin> triggers the font request as soon as HTML is parsed.',
        'crossorigin is REQUIRED on font preloads — fonts always use CORS mode regardless of origin.',
        'The preload href must EXACTLY match the @font-face src URL — mismatch causes a double-fetch.',
        'Preload only the 1–2 most critical fonts (body text weight); load other weights on demand.',
      ],
    },
    {
      heading: 'Variable fonts — one file instead of six',
      points: [
        'A variable font encodes multiple weight/width/slant variations in a single file using interpolation axes.',
        'Inter Variable: one 300 KB file replaces six static files (100, 200, 300, 400, 500, 600 weights) totalling ~600 KB.',
        'Use font-weight: 100 900 in @font-face to declare the full range supported by the variable font.',
        'CSS font-variation-settings: "wght" 450 gives fine-grained control beyond the 100-step weight scale.',
        'Supported in all modern browsers; always provide a static woff2 fallback for IE11 (if required).',
      ],
    },
    {
      heading: 'Matching fallback metrics to reduce CLS',
      points: [
        'FOUT causes CLS when the fallback font (e.g. Arial) has different cap-height or line metrics than the webfont.',
        'size-adjust: scales the fallback font to match the webfont\'s apparent size — reduces reflow on swap.',
        'ascent-override, descent-override, line-gap-override: fine-tune vertical metrics of the fallback.',
        'Font Matcher tool (screenspan.com/font-matcher) calculates the right values for popular webfonts.',
        'With precise overrides, CLS from font swap can be reduced to near-zero even with font-display: swap.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Self-hosted font setup',
      language: 'html',
      code: `<head>
  <!-- Step 1: preconnect (for external sources) or just preload for self-hosted -->

  <!-- Step 2: preload the most critical font weight -->
  <link rel="preload" as="font" type="font/woff2"
        href="/fonts/inter-400.woff2" crossorigin />

  <!-- Step 3: preload variable font (replaces multiple weight preloads) -->
  <!-- <link rel="preload" as="font" type="font/woff2"
        href="/fonts/inter-variable.woff2" crossorigin /> -->

  <!-- Step 4: CSS with @font-face declarations -->
  <style>
    /* Fallback with matching metrics to minimise CLS on swap */
    @font-face {
      font-family: 'Inter Fallback';
      src: local('Arial');
      size-adjust: 100.06%;
      ascent-override: 90%;
      descent-override: 22%;
      line-gap-override: 0%;
    }

    /* Webfont — swap shows fallback immediately */
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter-400.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter-700.woff2') format('woff2');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    body {
      /* Fallback first, webfont after swap */
      font-family: 'Inter', 'Inter Fallback', Arial, sans-serif;
    }
  </style>
</head>`,
    },
    {
      label: 'Variable font',
      language: 'css',
      code: `/* Variable font — one file covers all weights */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-variable.woff2') format('woff2 supports variations'),
       url('/fonts/inter-variable.woff2') format('woff2');
  font-weight: 100 900;   /* full range: 100 (thin) to 900 (black) */
  font-style:  normal;
  font-display: swap;
}

/* Optional: italic axis if font supports it */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-variable-italic.woff2') format('woff2');
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}

body       { font-family: 'Inter', sans-serif; font-weight: 400; }
h1, h2, h3 { font-weight: 700; }
.caption   { font-weight: 300; }

/* Fine-grained control beyond 100-step scale */
.emphasis {
  font-variation-settings: 'wght' 450, 'GRAD' 150;
}

/* Animate font weight smoothly (only possible with variable font) */
.animated {
  font-variation-settings: 'wght' 400;
  transition: font-variation-settings 0.3s ease;
}
.animated:hover {
  font-variation-settings: 'wght' 700;
}`,
    },
    {
      label: 'Unicode-range subsetting',
      language: 'css',
      code: `/* Only download the Greek weight file if Greek characters are used */
@font-face {
  font-family: 'Noto Sans';
  src: url('/fonts/noto-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC,
                 U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074,
                 U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
                 U+FEFF, U+FFFD;  /* Latin */
}

@font-face {
  font-family: 'Noto Sans';
  src: url('/fonts/noto-greek.woff2') format('woff2');
  unicode-range: U+0370-03FF;   /* Greek and Coptic */
}

@font-face {
  font-family: 'Noto Sans';
  src: url('/fonts/noto-cyrillic.woff2') format('woff2');
  unicode-range: U+0400-04FF;   /* Cyrillic */
}

/* Browser only fetches greek.woff2 if the page contains Greek text */
body { font-family: 'Noto Sans', sans-serif; }

/* Generate Unicode-range subsets with glyphhanger:
   npx glyphhanger https://yoursite.com --subset=*.woff2 --formats=woff2 */`,
    },
    {
      label: 'Font loading with Font Loading API',
      language: 'typescript',
      code: `// Manually control font loading — useful for critical above-fold fonts

async function loadCriticalFont() {
  // Check if font is already loaded (from cache)
  if (document.fonts.check('400 1em Inter')) {
    console.log('Inter already in FontFaceSet cache');
    return;
  }

  // Load the font and wait for it
  try {
    await document.fonts.load('400 1em Inter');
    console.log('Inter loaded and ready');
    // Add class to body to enable webfont-dependent styles
    document.documentElement.classList.add('fonts-loaded');
  } catch {
    console.log('Inter failed to load — using fallback');
  }
}

// Alternative: FontFace API for programmatic @font-face
const interFont = new FontFace('Inter', 'url(/fonts/inter-400.woff2)', {
  weight: '400',
  display: 'swap',
});

interFont.load().then(font => {
  document.fonts.add(font);
  document.body.style.fontFamily = '"Inter", sans-serif';
});

// Listen for all fonts to be ready
document.fonts.ready.then(() => {
  console.log('All fonts ready:', document.fonts.size, 'loaded');
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using font-display: block for body text',
      wrong: `@font-face {
  font-family: 'MyFont';
  src: url('myfont.woff2') format('woff2');
  font-display: block;   /* invisible text for up to 3 seconds */
}`,
      right: `@font-face {
  font-family: 'MyFont';
  src: url('myfont.woff2') format('woff2');
  font-display: swap;   /* fallback shown immediately; webfont swaps when ready */
}`,
      explanation: 'font-display: block hides text for up to 3 seconds while waiting for the webfont. Users see a blank page with no readable content. Use swap for body text — FOUT (fallback flash) is always preferable to FOIT (invisible text).',
    },
    {
      title: 'Preloading fonts without crossorigin',
      wrong: `<!-- Missing crossorigin — browser fetches the font TWICE -->
<link rel="preload" as="font" href="/fonts/inter.woff2" />`,
      right: `<link rel="preload" as="font" type="font/woff2"
      href="/fonts/inter.woff2" crossorigin />`,
      explanation: 'Font requests always use CORS mode. A preload without crossorigin uses a non-CORS request that cannot be matched to the CORS @font-face request — causing a double-fetch and wasting bandwidth.',
    },
    {
      title: 'Loading multiple static weight files when a variable font exists',
      wrong: `/* Six separate files — larger total download, more requests */
@font-face { src: url('inter-300.woff2'); font-weight: 300; }
@font-face { src: url('inter-400.woff2'); font-weight: 400; }
@font-face { src: url('inter-500.woff2'); font-weight: 500; }
@font-face { src: url('inter-600.woff2'); font-weight: 600; }
@font-face { src: url('inter-700.woff2'); font-weight: 700; }
@font-face { src: url('inter-800.woff2'); font-weight: 800; }`,
      right: `/* One variable font file covers all weights — typically 30-50% smaller total */
@font-face {
  src: url('inter-variable.woff2') format('woff2');
  font-weight: 100 900;
}`,
      explanation: 'A variable font encodes all weight variations in one file using interpolation. For Inter, the variable font is ~300 KB vs ~600 KB for six static files — smaller download and a single network request.',
    },
    {
      title: 'Not subsetting fonts for Latin-only sites',
      wrong: `/* Loading full Noto Sans — includes 6000+ glyphs, ~2 MB */
@font-face { src: url('noto-sans-full.woff2'); }`,
      right: `/* Latin subset only — ~50 KB vs 2 MB */
@font-face {
  src: url('noto-sans-latin.woff2');
  unicode-range: U+0000-00FF, U+0131, ...;   /* Latin characters only */
}`,
      explanation: 'Full font files include glyphs for thousands of languages. A Latin-only site uses < 5% of them. Generating a Latin subset reduces file size by 90%+ — from 2 MB to 50 KB in common cases.',
    },
    {
      title: 'Using font-display: swap without metric overrides',
      wrong: `@font-face {
  font-family: 'Roboto';
  src: url('roboto.woff2') format('woff2');
  font-display: swap;   /* CLS if Roboto metrics differ from fallback */
}`,
      right: `@font-face {
  font-family: 'Roboto';
  src: url('roboto.woff2') format('woff2');
  font-display: swap;
  /* Tune these to match your fallback (Arial) metrics */
  size-adjust: 100.3%;
  ascent-override: 92.7%;
  descent-override: 24.4%;
  line-gap-override: 0%;
}`,
      explanation: 'font-display: swap prevents FOIT but causes CLS if the webfont and fallback have different letter sizes or line heights — visible as text jumping when the swap occurs. size-adjust and metric overrides minimise the reflow.',
    },
    {
      title: 'Requesting Google Fonts without display=swap',
      wrong: `<!-- Default Google Fonts — FOIT on slow connections -->
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />`,
      right: `<!-- Add display=swap to opt in to font-display: swap -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
      rel="stylesheet" />`,
      explanation: 'Without &display=swap, Google Fonts uses the browser\'s default font loading behaviour (FOIT on most browsers). The display parameter maps directly to font-display in the generated @font-face rule.',
    },
  ];

  challenge: Challenge = {
    title: 'Optimise a slow font loading setup',
    language: 'scss',
    description: `The CSS below has four font performance issues. Find and fix all of them:

1. font-display is missing — browser will use FOIT
2. Multiple static weight files used instead of a variable font
3. Full font file loaded with no unicode-range subsetting
4. No size-adjust to prevent CLS on font swap

Rewrite the @font-face declarations with all four fixes applied.`,
    hints: [
      'Add font-display: swap to all @font-face rules',
      'Replace the 3 static files with one variable font using font-weight: 300 700',
      'Add unicode-range: U+0000-00FF (Latin) to limit download to Latin characters only',
      'Add size-adjust: 105% and ascent-override: 90% to match the Arial fallback',
    ],
    starterCode: `/* Problematic font setup */
@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-400.woff2') format('woff2');
  font-weight: 400;
  /* Issue 1: no font-display */
}

@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-500.woff2') format('woff2');
  font-weight: 500;
  /* Issue 2: separate static file per weight */
}

@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-700.woff2') format('woff2');
  font-weight: 700;
  /* Issue 3: full glyph set, no subsetting */
  /* Issue 4: no metric overrides for CLS prevention */
}

body { font-family: 'Playfair Display', Georgia, serif; }`,
    solution: `/* Fix 1+2: variable font + font-display: swap */
@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-variable.woff2') format('woff2 supports variations'),
       url('/fonts/playfair-variable.woff2') format('woff2');
  font-weight: 300 700;   /* covers all weights in one file */
  font-style: normal;
  font-display: swap;                         /* Fix 1: no FOIT */
  unicode-range: U+0000-00FF, U+0131, U+0152-0153,
                 U+02BB-02BC, U+02C6, U+02DA, U+02DC,
                 U+2000-206F, U+20AC, U+2122, U+FEFF, U+FFFD; /* Fix 3: Latin only */
  /* Fix 4: match Georgia fallback metrics to minimise CLS */
  size-adjust: 105%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

/* Fallback @font-face with matching metrics */
@font-face {
  font-family: 'Playfair Fallback';
  src: local('Georgia');
  size-adjust: 105%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body { font-family: 'Playfair Display', 'Playfair Fallback', Georgia, serif; }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is FOIT and why is it bad for performance?',
      options: [
        'Font Over Internet Transfer — describes how fonts are downloaded',
        'Flash of Invisible Text — text is hidden until the webfont loads, hiding content from users',
        'First Observed Interaction Time — a performance metric',
        'Font Object Initialisation Token — part of the Font Loading API',
      ],
      answer: 1,
      explanation: 'FOIT (Flash of Invisible Text) is the default browser behaviour when a webfont is loading — text is invisible for up to 3 seconds. Users see content-less pages. font-display: swap eliminates FOIT by showing fallback text immediately.',
    },
    {
      q: 'Which font-display value gives the browser exactly 100ms before using the fallback permanently?',
      options: ['swap', 'fallback', 'optional', 'block'],
      answer: 2,
      explanation: 'font-display: optional gives the browser a 100ms window. If the font is not ready in 100ms, the fallback is used permanently for that page load — no swap ever happens. This eliminates FOUT and CLS but means slow-connection users may never see the webfont.',
    },
    {
      q: 'What is the main advantage of a variable font over multiple static weight files?',
      options: [
        'Variable fonts load faster due to HTTP/2 multiplexing',
        'One file encodes all weight/width variations — smaller total size and one network request',
        'Variable fonts bypass the browser\'s font cache',
        'Variable fonts are supported in IE11 without fallback',
      ],
      answer: 1,
      explanation: 'A variable font uses interpolation to encode unlimited weights in a single file. For a family like Inter, one ~300 KB variable file replaces 6 static files totalling ~600 KB — saving 50% and halving the number of network requests.',
    },
    {
      q: 'What does the unicode-range descriptor in @font-face do?',
      options: [
        'Specifies which browsers can use the font',
        'Sets the character encoding for the font file',
        'Tells the browser to only download the font file if the page contains characters in the specified range',
        'Limits font weight to the specified Unicode version',
      ],
      answer: 2,
      explanation: 'unicode-range causes lazy loading of font files per range. If a page only contains Latin characters, the Cyrillic and Greek font files are never downloaded — this is how Google Fonts serves compact per-script files efficiently.',
    },
    {
      q: 'Why must crossorigin be on a font preload even for same-origin fonts?',
      options: [
        'Same-origin fonts still need CORS headers to be served',
        'Fonts always use CORS mode — without crossorigin the preload creates a mismatched request and the font is fetched twice',
        'crossorigin enables HTTP/2 multiplexing for fonts',
        'It is only required in Chrome, not Firefox or Safari',
      ],
      answer: 1,
      explanation: 'The browser always fetches fonts in CORS mode regardless of origin. A preload without crossorigin creates a non-CORS request that cannot be matched to the CORS font-face request — causing a double fetch. Always include crossorigin on font preloads.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I self-host Google Fonts or use the Google CDN?',
      a: 'Self-hosting is generally better for performance: you control caching headers (set max-age=31536000,immutable), avoid a third-party DNS lookup, and the "shared CDN cache" benefit of Google Fonts no longer exists (browsers partition caches by site since 2020). Self-host with the google-webfonts-helper tool to download the exact subsets you need.',
    },
    {
      q: 'How do I calculate the right size-adjust value for my webfont?',
      a: 'Use the Font Matcher at screenspan.com/font-matcher: select your webfont and fallback, and it calculates size-adjust, ascent-override, descent-override, and line-gap-override values. Alternatively, Next.js\'s built-in @next/font automatically generates these overrides for any Google Font.',
    },
    {
      q: 'How many fonts should I preload?',
      a: 'Preload only the 1–2 fonts most critical to the above-fold content — typically the regular weight of the primary body font. Each additional preload competes for bandwidth. Other weights and variants can load via the normal @font-face discovery path (CSS → font request) since they\'re rarely needed for the first paint.',
    },
    {
      q: 'Does font-display: swap cause CLS?',
      a: 'It can — but only if the fallback font has significantly different metrics (cap height, x-height, line height) than the webfont. The text reflows when the swap occurs. Using size-adjust, ascent-override, and descent-override on your @font-face to match the fallback metrics eliminates most of the reflow, bringing CLS close to zero even with font-display: swap.',
    },
    {
      q: 'What is the Font Loading API (document.fonts) useful for?',
      a: 'It lets you programmatically check if a font is loaded (document.fonts.check(\'400 1em Inter\')), wait for a specific font (document.fonts.load(\'400 1em Inter\')), or know when all fonts are ready (document.fonts.ready). Use it to trigger a CSS class switch (e.g. .fonts-loaded) that enables font-dependent layout, avoiding layout glitches before the font arrives.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Prevent FOIT with font-display: swap, minimise CLS with metric overrides, serve woff2 subsets, and preload the most critical font weight with crossorigin.',
    mustKnow: [
      'font-display: swap → FOUT (text visible immediately); block → FOIT (hidden for 3s)',
      'font-display: optional — fastest for CLS; 100ms window then fallback permanently',
      'Variable fonts: one file for all weights (font-weight: 100 900)',
      'Preload fonts with as="font" type="font/woff2" crossorigin — all three required',
      'size-adjust + ascent/descent overrides reduce CLS caused by font swap',
      'unicode-range: download only the glyph ranges the page actually uses',
    ],
    interviewFocus: [
      'What is FOUT vs FOIT? Which font-display values produce each?',
      'Why must a font preload include crossorigin even for same-origin fonts?',
      'How does a variable font reduce page weight compared to static weight files?',
      'How does size-adjust prevent CLS when using font-display: swap?',
    ],
  };
}
