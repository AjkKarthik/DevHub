import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-missing-doctype-quirks-mode-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './missing-doctype-triggers-quirks-mode-compatmode-reveals-it.html',
  styleUrl: './missing-doctype-triggers-quirks-mode-compatmode-reveals-it.scss',
})
export class MissingDOCTYPESubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #1, Confirmed With a Real Browser API',
      points: [
        'The main page states plainly: "Without <code>&lt;!DOCTYPE html&gt;</code>, browsers render in quirks mode." This subtopic proves quirks mode is genuinely active — not just a documented claim — by reading <code>document.compatMode</code> directly, which the browser itself exposes specifically so JavaScript can check which rendering mode is currently active.',
        '<code>document.compatMode</code> returns exactly one of two strings: <code>"CSS1Compat"</code> for standards mode (a valid <code>DOCTYPE</code> was present), or <code>"BackCompat"</code> for quirks mode (no valid <code>DOCTYPE</code>, or an old, incomplete one). This property exists precisely because rendering mode has real, observable consequences that JavaScript sometimes needs to detect.',
      ],
    },
    {
      heading: 'What "Quirks Mode" Actually Changes — It\'s Not Just a Label',
      points: [
        'Quirks mode isn\'t a vague "legacy compatibility flag" — it makes the browser reimplement SPECIFIC, DOCUMENTED rendering bugs from browsers of the late 1990s, because countless old websites were built around (and depend on) those exact bugs still being present. Box model sizing, table cell sizing, vertical alignment, and font size inheritance all behave measurably differently in quirks mode versus standards mode.',
        'This is why the main page\'s guidance is unconditional and absolute: "Always include it" — there is no scenario in modern web development where quirks mode\'s legacy bugs are desirable, and the DOCTYPE\'s only job today (HTML5 simplified away everything else a DOCTYPE used to do) is to opt every single page into standards mode.',
        'The check happens ONCE, essentially at the very start of parsing — whatever mode a document parses into is fixed for that document\'s entire lifetime; there is no way to "switch" a document from quirks mode to standards mode after the fact by, say, injecting a DOCTYPE via JavaScript once the page has already loaded.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<html>
  <head>
    <title>Missing DOCTYPE demo</title>
  </head>
  <body>
    <p>This document deliberately has NO &lt;!DOCTYPE html&gt; declaration.</p>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- This document has NO DOCTYPE declaration ---');
console.log('document.compatMode:', document.compatMode);

if (document.compatMode === 'BackCompat') {
  console.log('CONFIRMED: this document is rendering in QUIRKS MODE');
} else {
  console.log('This document is in standards mode (unexpected for a missing DOCTYPE)');
}

console.log('--- For comparison: what a document WITH a valid DOCTYPE reports ---');
console.log('(See the next subtopic\\'s sibling demo, or add <!DOCTYPE html> as the very first line above and reload -- document.compatMode would then report "CSS1Compat")');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'This demo\'s <code>index.html</code> has no <code>&lt;!DOCTYPE html&gt;</code> line at all. What does <code>document.compatMode</code> report?',
    hint: 'Ask what the ONLY two possible values of document.compatMode are, and which one specifically corresponds to a document that never opted into standards mode via a valid DOCTYPE.',
    solution: `document.compatMode reports "BackCompat" -- confirming this document
is genuinely rendering in quirks mode, not just theoretically
"missing a best practice."

This is directly observable and testable, not merely a documented
claim: document.compatMode is a real, standard DOM property every
browser implements specifically so code (yours, or a library's) can
detect which mode is active. There are only ever two possible
values -- "CSS1Compat" (standards mode) or "BackCompat" (quirks
mode) -- and a document with no DOCTYPE (or an old, incomplete one)
always falls into the "BackCompat" bucket.

If you add <!DOCTYPE html> as the literal first line of this same
index.html and reload, document.compatMode would immediately report
"CSS1Compat" instead -- the DOCTYPE's presence (or absence) is
checked once, essentially at the very start of parsing, and that
determination is fixed for the document's entire lifetime. There is
no API to switch modes afterward, and no way for a script running
inside the page to retroactively "fix" a missing DOCTYPE's effect
on rendering.

The lesson: quirks mode isn't an abstract concern -- it's a real,
checkable rendering mode with concrete layout differences (box
model sizing, vertical alignment, font inheritance, and more), and
its presence is exactly one missing line away in any HTML document.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'quirks mode is a vague, informal term for "the browser being slightly less strict about invalid HTML" — it doesn\'t correspond to anything specifically checkable or observable from JavaScript.',
      reality: 'quirks mode is a real, standardized rendering mode exposed directly via document.compatMode ("BackCompat" for quirks, "CSS1Compat" for standards) — it is a concrete, checkable browser state, not an informal concept.',
    },
    {
      thought: 'if a page accidentally loads without a DOCTYPE and ends up in quirks mode, a script could detect this after the fact and inject a DOCTYPE to switch the page into standards mode.',
      reality: 'rendering mode is determined essentially at the very start of parsing and is fixed for the document\'s entire lifetime — there is no API or technique to retroactively switch an already-loaded document from quirks mode to standards mode.',
    },
    {
      thought: 'quirks mode only causes minor, cosmetic rendering differences that are unlikely to matter for most modern layouts built with CSS Grid or Flexbox.',
      reality: 'quirks mode reimplements specific, documented legacy rendering bugs (affecting box model sizing, table cell sizing, vertical alignment, and font size inheritance) that can cause genuinely broken, inconsistent layouts — this is exactly why the main page\'s guidance to always include the DOCTYPE is unconditional, not situational.',
    },
  ];
}
