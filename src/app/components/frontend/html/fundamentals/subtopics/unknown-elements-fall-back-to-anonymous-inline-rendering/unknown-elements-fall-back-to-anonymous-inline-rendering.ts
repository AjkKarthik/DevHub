import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-unknown-elements-fall-back-to-anonymous-inline-rendering',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './unknown-elements-fall-back-to-anonymous-inline-rendering.html',
  styleUrl: './unknown-elements-fall-back-to-anonymous-inline-rendering.scss'
})
export class UnknownElementsFallBackToAnonymousInlineRenderingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A tag the browser has never heard of is never rejected — it becomes a real, generic DOM node',
      points: [
        'The main page\'s Q&amp;A states this directly: "Browsers render unknown elements as anonymous inline elements (like <code>&lt;span&gt;</code>) and add them to the DOM." A made-up tag name like <code>&lt;totally-fake-tag&gt;</code> is not an error, not skipped, and not silently dropped — it becomes a completely ordinary DOM element with that exact tag name.',
        'This is exactly the mechanism the QnA credits for making progressive enhancement of semantic elements and custom elements possible historically: "This \'unknown element\' fallback is why HTML5 semantic elements (<code>&lt;article&gt;</code>, <code>&lt;section&gt;</code>) worked in older browsers after a polyfill created the elements via <code>document.createElement()</code>."',
      ]
    },
    {
      heading: 'The "anonymous inline" default is directly, numerically verifiable via computed styles',
      points: [
        'You can confirm an unknown element genuinely exists in the DOM by simply querying for it — <code>document.querySelector(\'totally-fake-tag\')</code> finds it, exactly like any built-in element.',
        'The specific CSS default the main page describes is confirmable via <code>getComputedStyle(el).display</code> — an unknown element with no explicit CSS reports <code>\'inline\'</code>, the exact same default a real <code>&lt;span&gt;</code> would report, confirming the browser treats it as a generic inline box unless a stylesheet says otherwise.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>unknown elements fall back to inline</title></head>
  <body>
    <p>Real span (for comparison):</p>
    <span id="realSpan">a real span</span>

    <p>Completely made-up, never-registered tag name:</p>
    <totally-fake-tag id="fakeTag">an unknown element</totally-fake-tag>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const realSpan = document.getElementById('realSpan')!;
const fakeTag = document.querySelector('totally-fake-tag') as HTMLElement;

function report(label: string, el: HTMLElement | null): string {
  if (!el) return \`\${label}: NOT FOUND in the DOM\`;
  const display = getComputedStyle(el).display;
  return \`\${label}:\\n  found in DOM? true\\n  tagName = "\${el.tagName}"\\n  computed display = "\${display}"\`;
}

output.textContent =
  report('<span> (real, known element)', realSpan) + '\\n\\n' +
  report('<totally-fake-tag> (completely made up)', fakeTag) + '\\n\\n' +
  'The made-up tag is a real DOM node, found by querySelector like any other\\n' +
  'element — and its default computed display is "inline", identical to the\\n' +
  'real span, confirming the "anonymous inline element" fallback described\\n' +
  'on the main page.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The tag name <code>&lt;totally-fake-tag&gt;</code> matches no known HTML element and was never registered via <code>customElements.define()</code>. Predict: will <code>document.querySelector(\'totally-fake-tag\')</code> find it, and what will its default <code>display</code> value be?',
    hint: 'The browser\'s HTML parser accepts any well-formed tag syntax and creates a real element for it — recognizing the tag name is a completely separate concern from parsing it into the DOM.',
    solution: `querySelector finds it, and its default computed display is "inline" — identical to the behavior
of a real <span>. The HTML parser never rejects an unrecognized tag name; it simply creates a
generic HTMLElement with that tag name and inserts it into the DOM tree like any other element. The
"unknown element" only becomes special (gaining custom behavior, a shadow DOM, lifecycle callbacks)
if you later register it with customElements.define() — until then, it behaves exactly like an
anonymous inline box with no built-in semantics.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A made-up, unrecognized tag name causes the browser to skip that element entirely, or drop it from the parsed DOM.',
      reality: 'The element is created and inserted into the DOM exactly like any recognized tag — it is fully queryable, fully present, and fully part of the tree. Nothing about parsing rejects an unfamiliar tag name.'
    },
    {
      thought: 'An unrecognized element defaults to display: none until something explicitly styles it, since the browser doesn\'t know how to render it.',
      reality: 'It defaults to display: inline — the same generic default a <code>&lt;span&gt;</code> gets — not display: none. It is visually rendered normally; there is simply no special layout behavior associated with the unfamiliar tag name.'
    },
    {
      thought: 'This "unknown element" fallback is purely a historical curiosity with no relevance to modern web development.',
      reality: 'It is the exact mechanism that makes Custom Elements possible at all — customElements.define() works specifically because the browser already creates a real, generic element for any tag name it doesn\'t recognize, which the registration then upgrades with real behavior.'
    },
  ];
}
