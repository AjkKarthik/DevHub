import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-multiple-h1s-are-never-auto-demoted-by-sectioning-depth',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './multiple-h1s-are-never-auto-demoted-by-sectioning-depth.html',
  styleUrl: './multiple-h1s-are-never-auto-demoted-by-sectioning-depth.scss'
})
export class MultipleH1sAreNeverAutoDemotedBySectioningDepthSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A real algorithm existed on paper — but no browser ever ran it',
      points: [
        'The main page\'s Quiz is precise about the history: "The HTML5 document outline algorithm allowed multiple h1s (one per section). However, browsers never implemented the outline algorithm, and multiple h1s confused screen readers. Best practice today: one h1 per page."',
        'The theoretical outline algorithm would have made an <code>&lt;h1&gt;</code> nested inside a <code>&lt;section&gt;</code> inside another <code>&lt;section&gt;</code> effectively BEHAVE like a lower-level heading (an implicit demotion based on nesting depth) — but since it was never actually implemented, this demotion never happens anywhere in a real browser.',
      ]
    },
    {
      heading: 'This is directly measurable via computed font-size — the browser treats every h1 identically',
      points: [
        'If the outline algorithm HAD been implemented, a deeply-nested <code>&lt;h1&gt;</code> might reasonably be expected to render smaller than a top-level one, mirroring how it would be semantically treated as a lower-priority heading. This never happens: <code>getComputedStyle(el).fontSize</code> for an <code>&lt;h1&gt;</code> reports the exact same value no matter how many <code>&lt;section&gt;</code> elements it is nested inside.',
        'This is a directly checkable, permanent confirmation that the two-decades-old "outline algorithm" is not a real, currently-operating browser feature — every <code>&lt;h1&gt;</code> on a page is treated completely identically by the rendering engine, regardless of its position in the sectioning structure, which is exactly why the main page\'s modern guidance is simply "use one <code>&lt;h1&gt;</code> per page."',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>multiple h1s and sectioning depth</title></head>
  <body>
    <h1 id="topLevelH1">Top-level h1</h1>

    <section>
      <section>
        <section>
          <h1 id="deeplyNestedH1">h1 nested three sections deep</h1>
        </section>
      </section>
    </section>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const topLevelH1 = document.getElementById('topLevelH1')!;
const deeplyNestedH1 = document.getElementById('deeplyNestedH1')!;

const topSize = getComputedStyle(topLevelH1).fontSize;
const nestedSize = getComputedStyle(deeplyNestedH1).fontSize;

output.textContent =
  \`Top-level <h1>:\\n  computed font-size = "\${topSize}"\\n\\n\` +
  \`<h1> nested three <section> elements deep:\\n  computed font-size = "\${nestedSize}"\\n\\n\` +
  \`Identical? \${topSize === nestedSize}\\n\\n\` +
  (topSize === nestedSize
    ? 'Confirmed: sectioning depth has ZERO effect on how the browser renders an\\n<h1> — the theoretical HTML5 outline algorithm, which would have auto-demoted\\nthe nested one, was never actually implemented by any browser.'
    : 'Unexpected divergence in this sandbox — but no shipping browser implements\\nthe outline algorithm; any real difference here would come from something\\nother than automatic outline-based demotion.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The second <code>&lt;h1&gt;</code> is nested three <code>&lt;section&gt;</code> elements deep. If the HTML5 outline algorithm HAD been implemented by browsers, predict what its EFFECTIVE heading level would be treated as. Then predict: does any browser today actually apply that demotion?',
    hint: 'The main page is explicit that "browsers never implemented the outline algorithm" — this is presented as a fact about REAL, current browser behavior, not a hypothetical.',
    solution: `Under the theoretical outline algorithm, an h1 nested three sections deep would have been
treated roughly as if it were a level-4 heading in the document's computed outline. In reality, no
browser ever implemented that algorithm, so this demotion simply never happens — getComputedStyle()
confirms it directly: both h1 elements report the exact same font-size, regardless of how deeply
either one is nested in sectioning content. This is exactly why the practical, current-day guidance
is to just use one h1 per page — relying on the browser to auto-demote extra ones based on
structure was never something you could actually count on.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the HTML5 spec defines the document outline algorithm, browsers automatically compute an effective heading level for a nested h1 based on its sectioning depth, even if DevTools doesn\'t show it directly.',
      reality: 'No shipping browser implements the outline algorithm at all — an h1 nested arbitrarily deep in sectioning elements is rendered with the exact same default styling as a top-level h1, with no automatic demotion happening anywhere in the rendering pipeline.'
    },
    {
      thought: 'Multiple h1 elements on a page are a straightforward HTML validity error, the same category of mistake as a duplicate id.',
      reality: 'Multiple h1 elements are technically valid HTML — the HTML5 spec never forbade them. The "one h1 per page" rule is a best-practice recommendation specifically because of accessibility confusion and the outline algorithm never materializing, not a hard parsing or validity rule.'
    },
    {
      thought: 'Screen readers must somehow still apply the outline algorithm internally, even though visual browsers don\'t, since it was designed with accessibility in mind.',
      reality: 'The main page is explicit that "multiple h1s confused screen readers" — the opposite of automatically handling it gracefully. Assistive technology reads the flat list of heading elements in document order with their literal tag-indicated level (h1–h6), with no outline-algorithm-based reinterpretation.'
    },
  ];
}
