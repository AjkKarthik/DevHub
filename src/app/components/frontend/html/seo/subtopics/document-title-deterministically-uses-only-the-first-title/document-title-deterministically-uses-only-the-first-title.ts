import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-document-title-deterministically-uses-only-the-first-title',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './document-title-deterministically-uses-only-the-first-title.html',
  styleUrl: './document-title-deterministically-uses-only-the-first-title.scss'
})
export class DocumentTitleDeterministicallyUsesOnlyTheFirstTitleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A second <title> tag isn\'t rejected by the parser — it just becomes inert',
      points: [
        'The main page\'s Common Mistake warns: "Having multiple title tags confuses search engines. Only one <title> tag should exist per page." What actually happens in the BROWSER itself, though, is fully deterministic rather than "confused" — HTML\'s lenient parser happily creates a second <code>&lt;title&gt;</code> DOM node if you write one, it just never becomes the one thing that matters.',
        'The <code>document.title</code> IDL property\'s own algorithm specifically looks for the FIRST title element in tree order — a second one exists as a real, findable DOM node (via <code>querySelectorAll(\'title\')</code>) but is completely ignored by <code>document.title</code> and by what the browser tab actually displays.',
      ]
    },
    {
      heading: 'Browser certainty vs. crawler ambiguity are two separate problems',
      points: [
        'This is exactly why the main page frames the mistake in terms of confusing SEARCH ENGINES specifically, not browsers — a browser has one unambiguous, spec-defined rule (first wins), but different search engine crawlers and other consumers of the raw HTML are not bound by that same DOM-construction algorithm, and may parse or weight duplicate title content differently or inconsistently.',
        'This makes duplicate <code>&lt;title&gt;</code> tags a genuinely invisible bug from the browser\'s perspective (the tab title looks completely correct) while still being a real, documented SEO risk at the crawler level — two different consumers of the same markup, two different outcomes.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>First Title — This One Wins</title>
    <title>Second Title — Silently Ignored by document.title</title>
  </head>
  <body>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const allTitleElements = document.querySelectorAll('title');

output.textContent =
  \`Number of <title> elements actually in the DOM: \${allTitleElements.length}\\n\\n\` +
  Array.from(allTitleElements).map((t, i) => \`  [\${i}] "\${t.textContent}"\`).join('\\n') +
  \`\\n\\ndocument.title (what the browser tab actually shows):\\n  "\${document.title}"\\n\\n\` +
  (document.title === allTitleElements[0].textContent
    ? 'Confirmed: document.title matches the FIRST <title> element exactly — the\\nsecond one is a real DOM node (found by querySelectorAll) but has zero effect\\non what the browser reports or displays.'
    : 'Unexpected result in this sandbox — but the underlying rule (first title wins)\\nis a fixed part of the HTML spec\\'s document.title algorithm.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The HTML above has two <code>&lt;title&gt;</code> elements, both valid children of <code>&lt;head&gt;</code>. Predict: does <code>document.title</code> throw an error, concatenate both titles together, or silently pick just one?',
    hint: 'document.title has a single, fixed algorithm: find the first title element in tree order and use its text. There is no error path and no concatenation behavior defined for a duplicate.',
    solution: `It silently picks just the FIRST one — "First Title — This One Wins" — with no error and no
concatenation. The second <title> element still genuinely exists as a DOM node (querySelectorAll
finds both), but document.title's own well-defined algorithm only ever looks at the first title
element in document order, so the second one has zero effect on anything the browser itself does
with the page's title.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A second <title> tag is invalid HTML that the browser will refuse to parse, causing a visible error or warning.',
      reality: 'The lenient HTML parser happily creates a real DOM node for it — there is no parse error, no console warning, and no visible sign anything is wrong when looking at the rendered page or browser tab.'
    },
    {
      thought: 'Since duplicate title tags "confuse search engines," they must also confuse the browser\'s own document.title value in some unpredictable way.',
      reality: 'The browser\'s behavior is completely deterministic — document.title always uses the first title element, every time, with no ambiguity. The "confusion" the main page describes is specifically about how DIFFERENT crawlers/consumers of the raw markup might behave, not about browser behavior.'
    },
    {
      thought: 'Checking document.title in the browser console is sufficient to confirm a page has no duplicate-title SEO problem.',
      reality: 'document.title will always look completely correct (showing the first title) even when a genuine duplicate-title bug exists in the markup — you have to check querySelectorAll(\'title\').length or view the raw HTML source to actually catch this.'
    },
  ];
}
