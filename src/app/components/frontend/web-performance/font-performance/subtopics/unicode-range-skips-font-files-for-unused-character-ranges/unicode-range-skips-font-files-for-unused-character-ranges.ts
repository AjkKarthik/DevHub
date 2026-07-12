import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './unicode-range-skips-font-files-for-unused-character-ranges.html',
  styleUrl: './unicode-range-skips-font-files-for-unused-character-ranges.scss'
})
export class UnicodeRangeSkipsFontFilesForUnusedCharacterRangesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'unicode-range is not metadata — it is a real, enforced condition on whether the browser fetches the file at all',
      points: [
        'When a page declares two <code>@font-face</code> rules for the same font-family, each with a different <code>unicode-range</code>, the browser scans the ACTUAL RENDERED TEXT for characters in each range before deciding whether to download that specific file.',
        'A range with NO matching characters anywhere in the rendered page is simply never fetched — not deferred, not cached for later, genuinely never requested.',
      ]
    },
    {
      heading: 'This is directly measurable — a Latin-only page never downloads the Cyrillic file, even when both are declared',
      points: [
        'Confirmed directly: declaring a Latin (<code>U+0000-00FF</code>) and a Cyrillic (<code>U+0400-04FF</code>) <code>@font-face</code> for the same font-family, then rendering the plain-Latin text "Hello world", produces a real network request for the Latin file and ZERO requests for the Cyrillic one — verified via <code>PerformanceResourceTiming</code>.',
        'This is exactly how Google Fonts serves compact per-script files under one CSS response — the visible CSS lists a dozen or more <code>@font-face</code> blocks (Latin, Latin Extended, Cyrillic, Greek, Vietnamese...), but a typical Latin-only page only ever downloads the one or two that actually match its content.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>unicode-range skips font files for unused character ranges</title>
    <style>
      @font-face {
        font-family: 'DemoFont';
        src: url('/index.html?range=latin') format('woff2');
        unicode-range: U+0000-00FF; /* Latin */
      }
      @font-face {
        font-family: 'DemoFont';
        src: url('/index.html?range=cyrillic') format('woff2');
        unicode-range: U+0400-04FF; /* Cyrillic */
      }
      #latinText { font-family: 'DemoFont', sans-serif; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <p id="latinText">Hello world — plain Latin text only, no Cyrillic characters.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `setTimeout(() => {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const latinFetched = entries.some((e) => e.name.includes('range=latin'));
  const cyrillicFetched = entries.some((e) => e.name.includes('range=cyrillic'));

  console.log('two @font-face rules declared for the SAME font-family, different unicode-range each.');
  console.log('page text is plain Latin only ("Hello world").');
  console.log('Latin file (unicode-range matches the text) fetched?', latinFetched);
  console.log('Cyrillic file (unicode-range matches NOTHING on the page) fetched?', cyrillicFetched);
}, 600);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A multi-language site uses a single Google Fonts CSS link covering Latin, Cyrillic, Greek, and Vietnamese character sets, worried this means every visitor downloads all four font files regardless of which language they are actually reading. Should the team split this into four separate, manually-conditional CSS links to avoid wasting bandwidth?',
    hint: 'Ask what actually triggers a font FILE download when unicode-range is used — is it the CSS being present, or the page\'s own text content?',
    solution: 'No manual splitting is needed — this is exactly what unicode-range already does automatically. The CSS response lists all four @font-face blocks, but each has its own unicode-range, and the browser only fetches the file whose range matches characters actually present in the rendered page. Confirmed directly in this subtopic\'s demo: a Cyrillic-range font-face with zero matching characters on the page never produces a network request at all, even though it is fully declared in the CSS. A Latin-only visitor genuinely never downloads the Cyrillic, Greek, or Vietnamese files.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'unicode-range is a hint the browser MAY use to optimise loading, similar to loading="lazy" — but it could still download everything just to be safe.',
      reality: 'It is a hard, enforced condition — this subtopic\'s demo shows a font-face with a genuinely non-matching unicode-range producing ZERO network requests, not a deferred or "maybe" request.'
    },
    {
      thought: 'Since all the @font-face rules share the same font-family name, the browser must download all of them to know which one actually contains the needed glyphs.',
      reality: 'The browser determines this from the DECLARED unicode-range values alone, without downloading anything first — it scans the page\'s text content, matches characters against each range\'s declared boundaries, and only fetches files for ranges with at least one match.'
    },
    {
      thought: 'unicode-range subsetting only matters for genuinely multi-language sites — a purely English/Latin site gets no benefit from it since it would only ever need the Latin file anyway.',
      reality: 'A Latin-only site still benefits enormously if using a font service (like Google Fonts) that serves a combined multi-script CSS response by default — without unicode-range, the site would either need manual subset selection or risk fetching every script\'s file; with it, the correct single file is selected automatically with zero extra effort.'
    }
  ];
}
