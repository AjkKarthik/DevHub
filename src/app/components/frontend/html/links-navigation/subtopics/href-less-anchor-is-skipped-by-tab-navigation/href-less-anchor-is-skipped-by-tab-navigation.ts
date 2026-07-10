import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-href-less-anchor-is-skipped-by-tab-navigation',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './href-less-anchor-is-skipped-by-tab-navigation.html',
  styleUrl: './href-less-anchor-is-skipped-by-tab-navigation.scss'
})
export class HrefLessAnchorIsSkippedByTabNavigationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'href is what makes <a> a real, focusable link — not the tag itself',
      points: [
        'The main page\'s mistake entry is direct: "An <code>&lt;a&gt;</code> without a valid href is not focusable by keyboard and is not announced as interactive by screen readers." This is a real, spec-defined behavior, not a vague accessibility guideline — <code>&lt;a&gt;</code> only gains its link semantics and keyboard focusability once it has an <code>href</code> attribute.',
        'You can verify this directly and cheaply from JavaScript: an <code>&lt;a&gt;</code> with no <code>href</code> has a default <code>tabIndex</code> of <code>-1</code> (excluded from sequential Tab navigation), while an <code>&lt;a&gt;</code> WITH any <code>href</code> value has a default <code>tabIndex</code> of <code>0</code> (included) — no extra <code>tabindex</code> attribute needed either way; this is the browser\'s own default.',
      ]
    },
    {
      heading: 'href="javascript:void(0)" quietly reintroduces the problem from the other direction',
      points: [
        'The main page\'s fix recommends using <code>&lt;button&gt;</code> for actions instead of an href-less <code>&lt;a&gt;</code> — but a very common half-fix, <code>&lt;a href="javascript:void(0)"&gt;</code>, has an href attribute (a non-empty string), so it DOES stay in the tab order and DOES get link semantics, despite navigating absolutely nowhere.',
        'This means the two "broken" patterns fail in genuinely different, easy-to-confuse ways: no <code>href</code> at all removes the element from keyboard reach entirely; <code>href="javascript:void(0)"</code> keeps it reachable but makes it a real link that goes nowhere — confusing for anyone using "Open link in new tab" or checking the URL before clicking.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>href and tab order</title></head>
  <body>
    <p>Three anchors, none with an actual destination in common:</p>
    <a id="noHref">No href at all</a><br>
    <a id="jsVoidHref" href="javascript:void(0)">href="javascript:void(0)"</a><br>
    <a id="realHref" href="/somewhere">href="/somewhere" (a real link)</a>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const anchors: { id: string; label: string }[] = [
  { id: 'noHref', label: '<a> — no href attribute at all' },
  { id: 'jsVoidHref', label: '<a href="javascript:void(0)">' },
  { id: 'realHref', label: '<a href="/somewhere">' },
];

const lines = anchors.map(({ id, label }) => {
  const el = document.getElementById(id) as HTMLAnchorElement;
  const inTabOrder = el.tabIndex >= 0;
  return \`  \${label}\\n    hasAttribute('href') = \${el.hasAttribute('href')}   tabIndex = \${el.tabIndex}   in Tab order? \${inTabOrder}\\n\`;
});

output.textContent = 'Default keyboard-focusability, with NO explicit tabindex attribute set anywhere:\\n\\n' + lines.join('\\n');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'None of the three anchors above have an explicit <code>tabindex</code> attribute — every <code>tabIndex</code> value shown is the browser\'s own default. Predict: does <code>href="javascript:void(0)"</code> behave more like the href-less anchor (excluded from Tab order) or the real link (included)?',
    hint: 'The browser\'s rule for default focusability is purely "does this element have an href attribute present," not "does the href attribute\'s value lead anywhere useful."',
    solution: `It behaves like the real link — included in the Tab order with tabIndex 0, identical to
href="/somewhere". The browser's default-focusability check only asks whether an href ATTRIBUTE is
present, never whether its VALUE actually points somewhere meaningful. javascript:void(0) is a
technically valid (if unconventional) href value, so the anchor keeps full link semantics and
keyboard reachability — it just happens to navigate nowhere when activated.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Any <code>&lt;a&gt;</code> tag is automatically keyboard-focusable, the same way any <code>&lt;button&gt;</code> is.',
      reality: '<code>&lt;a&gt;</code> is only focusable by default when it has an <code>href</code> attribute. Without one, its default <code>tabIndex</code> is <code>-1</code> — completely invisible to Tab navigation, with no error or warning.'
    },
    {
      thought: 'Switching from a bare <code>&lt;a onclick="..."&gt;</code> to <code>&lt;a href="javascript:void(0)" onclick="..."&gt;</code> fixes the keyboard-accessibility problem the main page warns about.',
      reality: 'It restores keyboard focusability, but the element is still semantically wrong for a click-only action — it announces itself as a link with a destination (and shows one in "Open in new tab" / status-bar previews) when there genuinely isn\'t one. The main page\'s actual fix is switching to <code>&lt;button&gt;</code>.'
    },
    {
      thought: 'Checking whether an anchor is "focusable" requires simulating an actual Tab keypress and watching where focus lands.',
      reality: 'The default focusability of any element is readable directly and reliably via its <code>tabIndex</code> property — no keypress simulation needed. A non-negative <code>tabIndex</code> means it participates in the default Tab order.'
    },
  ];
}
