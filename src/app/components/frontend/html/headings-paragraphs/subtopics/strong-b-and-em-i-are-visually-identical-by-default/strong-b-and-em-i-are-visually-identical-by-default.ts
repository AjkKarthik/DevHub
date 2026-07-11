import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-strong-b-and-em-i-are-visually-identical-by-default',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './strong-b-and-em-i-are-visually-identical-by-default.html',
  styleUrl: './strong-b-and-em-i-are-visually-identical-by-default.scss'
})
export class StrongBAndEmIAreVisuallyIdenticalByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two completely different semantic meanings, zero default visual difference',
      points: [
        'The main page is direct about the split: "<code>strong</code> emphasizes text semantically. <code>b</code> is used for styling purposes only," and the identical rule for <code>em</code> vs <code>i</code>. This is entirely a SEMANTIC distinction — it says nothing about how the two actually render.',
        'The browser\'s default (user-agent) stylesheet renders <code>&lt;strong&gt;</code> and <code>&lt;b&gt;</code> with the EXACT same default <code>font-weight: bold</code>, and <code>&lt;em&gt;</code> and <code>&lt;i&gt;</code> with the exact same default <code>font-style: italic</code> — there is no built-in visual cue distinguishing the semantic pair from the presentational one.',
      ]
    },
    {
      heading: 'This makes the mistake genuinely invisible to sighted, mouse-driven QA',
      points: [
        'Reading <code>getComputedStyle(el).fontWeight</code> for a <code>&lt;strong&gt;</code> element and a <code>&lt;b&gt;</code> element side by side reports the identical value — usually <code>"700"</code> or <code>"bold"</code> — confirming there is no default rendering difference to spot by eye.',
        'This is precisely why choosing the wrong one (using <code>&lt;b&gt;</code> where semantic importance is genuinely intended, or vice versa) survives visual review completely undetected — the bug only matters to screen readers and other non-visual consumers of the accessibility tree, which read the ELEMENT TYPE, not its computed CSS.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>strong/b and em/i default styles</title></head>
  <body>
    <p><strong id="strongEl">strong text</strong> vs <b id="bEl">b text</b></p>
    <p><em id="emEl">em text</em> vs <i id="iEl">i text</i></p>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const strongEl = document.getElementById('strongEl')!;
const bEl = document.getElementById('bEl')!;
const emEl = document.getElementById('emEl')!;
const iEl = document.getElementById('iEl')!;

const strongWeight = getComputedStyle(strongEl).fontWeight;
const bWeight = getComputedStyle(bEl).fontWeight;
const emStyle = getComputedStyle(emEl).fontStyle;
const iStyle = getComputedStyle(iEl).fontStyle;

output.textContent =
  \`<strong> computed font-weight: "\${strongWeight}"\\n\` +
  \`<b>      computed font-weight: "\${bWeight}"\\n\` +
  \`  identical? \${strongWeight === bWeight}\\n\\n\` +
  \`<em>     computed font-style: "\${emStyle}"\\n\` +
  \`<i>      computed font-style: "\${iStyle}"\\n\` +
  \`  identical? \${emStyle === iStyle}\\n\\n\` +
  'Both pairs report identical default computed styles — despite being\\n' +
  'semantically completely different, there is nothing visually distinguishing\\n' +
  'them out of the box.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Neither <code>&lt;strong&gt;</code>/<code>&lt;b&gt;</code> nor <code>&lt;em&gt;</code>/<code>&lt;i&gt;</code> has any custom CSS applied in the demo. Predict: will <code>getComputedStyle(strongEl).fontWeight</code> and <code>getComputedStyle(bEl).fontWeight</code> report different values, or the exact same value?',
    hint: 'The browser\'s built-in user-agent stylesheet applies default styling based on the TAG, and both tags happen to be assigned the identical default bold weight — the semantic distinction lives entirely outside of CSS.',
    solution: `They report the exact same value — typically "700" (bold) for both <strong> and <b>, and
"italic" for both <em> and <i>. The user-agent stylesheet's default rules for these tag pairs
apply identical visual styling; the meaningful difference between them is purely in the
ACCESSIBILITY TREE — what role and semantic weight gets announced to a screen reader — which
getComputedStyle() cannot see at all, since it only reports CSS, not accessibility semantics.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If <code>&lt;strong&gt;</code> and <code>&lt;b&gt;</code> render identically, the "semantic vs presentational" distinction the main page describes must be largely theoretical with no real, checkable difference.',
      reality: 'The difference is completely real, just invisible to CSS-based inspection — it lives in the accessibility tree and the element\'s semantic role, which screen readers read directly from the tag itself, independent of any computed visual style.'
    },
    {
      thought: 'A visual QA pass (checking that the page "looks right") is sufficient to catch a wrong choice between the semantic and presentational tag in a pair.',
      reality: 'It is specifically NOT sufficient — both tags in each pair render identically by default, so a wrong choice survives any purely visual review undetected. Catching it requires checking the actual tag name used, not the rendered appearance.'
    },
    {
      thought: 'Since strong/b render identically, you could freely swap one for the other anywhere in existing markup with zero consequences.',
      reality: 'Swapping them changes nothing about the RENDERED page but genuinely changes what a screen reader announces — from "no special emphasis" to "strong importance" or vice versa — a real, consequential difference for non-visual users even though sighted users would never notice.'
    },
  ];
}
