import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-malformed-json-ld-renders-fine-but-fails-to-parse',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './malformed-json-ld-renders-fine-but-fails-to-parse.html',
  styleUrl: './malformed-json-ld-renders-fine-but-fails-to-parse.scss'
})
export class MalformedJsonLdRendersFineButFailsToParseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A <script type="application/ld+json"> block is never executed as JavaScript',
      points: [
        'The main page groups "JSON-LD errors: wrong @type" among its Common Mistakes and recommends "Validate structured data using Google\'s Rich Results Test before deployment" — a specific, deliberate warning that structured data needs its OWN validation step, separate from normal page testing.',
        'The reason a broken JSON-LD block never shows up during ordinary QA is architectural: <code>type="application/ld+json"</code> is a non-executable script type. The browser parses it as an opaque text blob for consumers like search engine crawlers to read later — it is never run, never syntax-checked, and never allowed to break page rendering, no matter how malformed its content is.',
      ]
    },
    {
      heading: 'This is directly, reliably testable with the exact same JSON.parse() a real crawler-side consumer would use',
      points: [
        'Any JavaScript consuming this data (or a real crawler internally) has to call <code>JSON.parse()</code> on the script\'s <code>.textContent</code> to actually use it — this is the exact point where invalid JSON (a trailing comma, an unquoted key, a stray unescaped character) throws a real, catchable <code>SyntaxError</code>.',
        'This means you can directly, programmatically verify a page\'s structured data is even parseable — completely independent of, and invisible to, whatever visual QA process confirmed the page "looks right."',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>malformed JSON-LD renders fine</title></head>
  <body>
    <h1>This page looks completely normal.</h1>
    <p>Its structured data, however, is silently broken.</p>

    <script type="application/ld+json" id="validLd">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "A Correctly Formed Article"
    }
    </script>

    <script type="application/ld+json" id="brokenLd">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "A Subtly Broken Article",
    }
    </script>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

function tryParse(id: string, label: string): string {
  const script = document.getElementById(id)!;
  try {
    const data = JSON.parse(script.textContent!);
    return \`\${label}: PARSED SUCCESSFULLY\\n  headline = "\${data.headline}"\`;
  } catch (e) {
    return \`\${label}: FAILED TO PARSE\\n  \${(e as Error).message}\`;
  }
}

output.textContent =
  'The page above rendered with NO visible errors, NO console warnings, and NO\\n' +
  'difference in appearance between the valid and broken JSON-LD blocks.\\n\\n' +
  tryParse('validLd', 'validLd') + '\\n\\n' +
  tryParse('brokenLd', 'brokenLd (has a trailing comma after the last property)') + '\\n\\n' +
  'A real structured-data consumer parsing brokenLd\\'s content would get nothing\\n' +
  'usable from it — while a human reviewing the rendered page sees a perfectly\\n' +
  'normal-looking article with no indication anything is wrong.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The "brokenLd" script has a trailing comma after its last property — invalid per the JSON spec. Predict: does the page fail to render, does the browser log a console error, or does nothing visible happen at all?',
    hint: '<code>&lt;script type="application/ld+json"&gt;</code> is a non-executable script type — the browser only treats its content as opaque text, never as code it needs to parse or run.',
    solution: `Nothing visible happens at all — no render failure, no console error, no warning of any kind.
Because application/ld+json is a non-executable script type, the browser's HTML/JS engine has zero
reason to ever look inside it for syntax validity; it is simply stored as text content, exactly like
a comment would be. The invalidity is only exposed the moment SOMETHING actually tries to
JSON.parse() that text — which is precisely what a search engine's structured-data extractor does
internally, just never visibly, during your own manual testing of the page.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a JSON-LD block has a syntax error, the browser will show a console error the same way it would for broken regular JavaScript.',
      reality: 'application/ld+json is never executed as JavaScript at all — the browser treats it purely as inert text content, so there is no parsing step for the browser to fail at, and therefore no console error of any kind.'
    },
    {
      thought: 'A page "looking correct" during a manual QA pass is reasonable evidence that its structured data is also correct.',
      reality: 'The two are completely independent — rendered appearance depends only on the visible HTML/CSS, while structured data validity depends entirely on whether the JSON-LD text happens to be syntactically valid JSON, something visual inspection can never catch.'
    },
    {
      thought: 'The only way to check whether a page\'s structured data is valid is to submit it to an external tool like Google\'s Rich Results Test.',
      reality: 'A plain JSON.parse() call on the script\'s textContent — completely offline, no external service required — immediately reveals whether the JSON itself is even syntactically well-formed, before ever getting to Schema.org-specific validation concerns.'
    },
  ];
}
