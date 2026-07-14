import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-nesting-strong-doesnt-compound-weight-or-emphasis',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './nesting-strong-doesnt-compound-weight-or-emphasis.html',
  styleUrl: './nesting-strong-doesnt-compound-weight-or-emphasis.scss'
})
export class NestingStrongDoesntCompoundWeightOrEmphasisSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Semantic importance is a binary flag, not an intensity scale',
      points: [
        'The main page\'s Q&amp;A addresses this directly: an author nesting <code>&lt;strong&gt;&lt;strong&gt;Danger&lt;/strong&gt;&lt;/strong&gt;</code> expecting EXTRA emphasis is a common misunderstanding. "Nesting <code>&lt;strong&gt;</code> or <code>&lt;em&gt;</code> tags does not compound or intensify how assistive technology announces the text; screen readers treat the semantic role as binary (this text has strong importance / this text does not), not as a scale that stacks with repetition."',
        'This is explicitly contrasted with how CSS <code>font-weight</code> COULD, in principle, stack visually (imagining "more bold" from nested styling) — semantic HTML elements convey a CATEGORY of meaning, never an intensity value, which is a genuinely different mental model than CSS.',
      ]
    },
    {
      heading: 'The non-compounding is directly observable at the CSS layer too',
      points: [
        'While the accessibility-tree announcement itself isn\'t directly queryable from plain JavaScript, the exact same "no compounding" principle is independently checkable through the visual rendering layer: a doubly-nested <code>&lt;strong&gt;&lt;strong&gt;text&lt;/strong&gt;&lt;/strong&gt;</code> and a single <code>&lt;strong&gt;text&lt;/strong&gt;</code> report the IDENTICAL <code>getComputedStyle().fontWeight</code> value.',
        'This mirrors the semantic point precisely: just as the accessibility role doesn\'t stack with repetition, the browser\'s own default styling for the tag doesn\'t escalate either — there is no built-in mechanism anywhere in the platform, visual or semantic, for repeated identical emphasis tags to intensify each other.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>nesting strong does not compound</title></head>
  <body>
    <p>Single: <strong id="single">Danger</strong></p>
    <p>Doubly nested: <strong><strong id="nested">Danger</strong></strong></p>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const single = document.getElementById('single')!;
const nested = document.getElementById('nested')!;

const singleWeight = getComputedStyle(single).fontWeight;
const nestedWeight = getComputedStyle(nested).fontWeight;

output.textContent =
  \`Single <strong>Danger</strong>:\\n  computed font-weight = "\${singleWeight}"\\n\\n\` +
  \`Doubly-nested <strong><strong>Danger</strong></strong>:\\n  computed font-weight = "\${nestedWeight}"\\n\\n\` +
  \`Identical? \${singleWeight === nestedWeight}\\n\\n\` +
  (singleWeight === nestedWeight
    ? 'Confirmed: nesting produced NO additional visual weight whatsoever — mirroring\\nthe same "no compounding" rule that applies to how screen readers announce\\nnested semantic importance.'
    : 'Unexpected divergence in this sandbox — the underlying rule (no CSS mechanism\\nfor stacking identical nested emphasis tags) still applies generally.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The author nested <code>&lt;strong&gt;&lt;strong&gt;Danger&lt;/strong&gt;&lt;/strong&gt;</code> specifically hoping for MORE emphasis than a single <code>&lt;strong&gt;</code>. Predict: does <code>getComputedStyle()</code> report a heavier font-weight for the doubly-nested version, or the exact same weight as a single <code>&lt;strong&gt;</code>?',
    hint: 'CSS font-weight is a fixed numeric value the user-agent stylesheet assigns per element based on its tag — nesting the same tag twice doesn\'t give the browser any instruction to add the values together.',
    solution: `It reports the exact same font-weight — there is no compounding at the CSS layer either. Each
<strong> element independently gets assigned the same fixed font-weight value by the browser's
default stylesheet; nesting doesn't create some kind of additive or multiplicative stacking effect.
This mirrors — and helps make concrete — the same non-compounding rule that governs how assistive
technology announces nested semantic importance: both the visual and the semantic layers treat
strong/em as a flag you either have or don't, never a value that grows with repetition.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Nesting <code>&lt;strong&gt;</code> or <code>&lt;em&gt;</code> tags around the same text increases how strongly assistive technology announces its importance, similar to how repeating an exclamation mark adds emphasis in writing.',
      reality: 'Screen readers treat the semantic role as binary — text either has strong importance or it does not. There is no stacking or intensity scale that responds to how many times the same tag is nested around the same content.'
    },
    {
      thought: 'Even if the SEMANTIC announcement doesn\'t compound, the VISUAL rendering (font-weight) must still get heavier with each additional nested <code>&lt;strong&gt;</code>, the way stacking multiple CSS font-weight declarations sometimes can.',
      reality: 'It does not — getComputedStyle().fontWeight reports the identical value whether the tag is nested once or many times. Neither the semantic nor the visual layer has any built-in mechanism for identical nested emphasis tags to intensify each other.'
    },
    {
      thought: 'If genuinely greater urgency needs to be communicated to assistive technology, nesting more semantic tags around the content is a reasonable way to achieve it.',
      reality: 'The main page\'s guidance is explicit that this requires different content wording or an ARIA live region with assertive politeness — not repeated nesting of the same semantic tag, which has no effect beyond what a single instance already provides.'
    },
  ];
}
