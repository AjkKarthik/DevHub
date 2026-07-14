import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-a-stray-br-end-tag-inserts-a-second-line-break',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './a-stray-br-end-tag-inserts-a-second-line-break.html',
  styleUrl: './a-stray-br-end-tag-inserts-a-second-line-break.scss'
})
export class AStrayBrEndTagInsertsASecondLineBreakSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"Adding </br> is an error" — but the parser doesn\'t just ignore the error',
      points: [
        'The main page\'s Q&amp;A states the rule: void elements "must not have a closing tag... Adding <code>&lt;/br&gt;</code> is an error." That much is true — but the HTML parsing spec has a specific, deliberate recovery rule for exactly this error, for web-compatibility reasons, and it is more surprising than simply discarding the stray tag.',
        'The WHATWG parsing algorithm explicitly special-cases an end tag whose name is <code>br</code>: it is treated as a parse error, and then the parser reacts by acting AS IF a real <code>&lt;br&gt;</code> START tag had appeared instead — inserting a genuine, second line-break element into the DOM.',
      ]
    },
    {
      heading: 'This means <br></br> genuinely produces TWO line breaks, not one',
      points: [
        'This is directly countable: parse a document containing <code>&lt;br&gt;&lt;/br&gt;</code> and check <code>document.querySelectorAll(\'br\').length</code> — it reports <code>2</code>, not <code>1</code>, confirming the stray end tag was silently converted into a second, real <code>&lt;br&gt;</code> element rather than being dropped.',
        'This is a genuine, spec-mandated parser recovery behavior (not a bug in any particular browser) — it exists specifically because enough real-world web content historically wrote <code>&lt;br/&gt;</code>-style self-closing syntax inconsistently, and browsers standardized on this exact compatibility behavior for <code>br</code> end tags specifically.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>stray br end tag inserts a second br</title></head>
  <body>
    <p>Line one<br></br>Line two (written as &lt;br&gt;&lt;/br&gt;)</p>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const brCount = document.querySelectorAll('br').length;

output.textContent =
  \`Source HTML: <p>Line one<br></br>Line two</p>\\n\\n\` +
  \`document.querySelectorAll('br').length = \${brCount}\\n\\n\` +
  (brCount === 2
    ? 'Confirmed: the </br> end tag was NOT silently dropped as a plain parse error.\\n' +
      'The parser specifically reacted to it by inserting a SECOND, genuine <br>\\n' +
      'element — <br></br> really does produce two line breaks in the rendered page,\\n' +
      'not one.'
    : \`Got \${brCount} — result may vary by parser environment, but the WHATWG spec\\nmandates exactly this "treat as a br start tag" recovery rule for browsers.\`);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page says <code>&lt;/br&gt;</code> "is an error." Predict: does the browser\'s error-recovery behavior DISCARD the stray end tag (net effect: one line break), or does it do something that actually adds a SECOND line break?',
    hint: 'The WHATWG HTML parsing spec has a named, specific recovery rule just for a br end tag — it does not fall into the generic "ignore this unexpected end tag" bucket that most other unexpected end tags get.',
    solution: `It adds a second line break — querySelectorAll('br').length reports 2, not 1. The parser's
specific recovery rule for a br end tag token is to act as if a br START tag token had appeared in
its place, which means "insert a real, genuine <br> element" — the exact same action a normal
<br> start tag would trigger. This is a deliberately unusual case in the spec: most malformed end
tags for elements that shouldn't have them are simply ignored, but </br> specifically gets promoted
into inserting new content instead of being discarded.`
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>&lt;/br&gt;</code> being "an error" means the browser silently ignores and discards it, with no net effect on the rendered page.',
      reality: 'The parser specifically converts it into inserting a genuine second <code>&lt;br&gt;</code> element — the exact opposite of being discarded. <code>&lt;br&gt;&lt;/br&gt;</code> renders as two line breaks, not one.'
    },
    {
      thought: 'This parsing quirk is a bug or inconsistency specific to certain browsers, not standardized behavior.',
      reality: 'It is an explicit, named rule in the WHATWG HTML parsing specification itself — every spec-compliant browser is required to handle a br end tag this exact way, for historical web-compatibility reasons.'
    },
    {
      thought: 'Since void elements "cannot have a closing tag," writing one for any void element (not just br) produces the same "extra element inserted" behavior.',
      reality: 'The "treat the end tag as a start tag" recovery rule is specifically called out for br in the parsing spec — other void elements\' stray end tags are typically just ignored as ordinary unexpected-end-tag parse errors, without inserting anything extra.'
    },
  ];
}
