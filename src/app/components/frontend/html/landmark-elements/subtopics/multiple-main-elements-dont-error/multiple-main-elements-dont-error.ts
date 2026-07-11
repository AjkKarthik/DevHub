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
  templateUrl: './multiple-main-elements-dont-error.html',
  styleUrl: './multiple-main-elements-dont-error.scss'
})
export class MultipleMainElementsDontErrorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"There should be only one main per document" is a spec RULE, not a browser-enforced CONSTRAINT',
      points: [
        'The HTML spec says a document must have no more than one visible <code>&lt;main&gt;</code> element — but this is a conformance rule for AUTHORS, not something the parser rejects.',
        'Writing two <code>&lt;main&gt;</code> elements produces zero parse errors and zero console warnings — the DOM simply contains both, exactly as written.',
        'This is a genuinely different category of "invalid HTML" than something like a stray closing tag — the document still parses cleanly; the violation only exists at the semantic/accessibility level, invisible to the parser.',
      ]
    },
    {
      heading: 'Catching this violation requires a linter or accessibility auditor, not the browser itself',
      points: [
        'Tools like axe-core, Lighthouse, and browser DevTools\' own accessibility panel specifically check for and flag more than one non-hidden <code>&lt;main&gt;</code> — this is exactly the kind of rule the platform leaves to tooling rather than the parser.',
        'The practical fix when a second main-content region genuinely exists (e.g. an SPA route transition briefly renders both an old and new view) is the <code>hidden</code> attribute — the spec\'s "no more than one that does not have the hidden attribute" wording is deliberately permissive about this exact case.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Multiple main elements</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <main id="first">First main</main>
    <main id="second">Second main</main>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const mains = document.querySelectorAll('main');

// No parse error occurred getting here — the document above has TWO
// <main> elements and the browser accepted both without complaint.
console.log('main element count:', mains.length);

mains.forEach((m, i) => {
  console.log(\\\`main #\\\${i}: id="\\\${m.id}", hidden=\\\${m.hidden}\\\`);
});

// The spec-compliant fix: only one may be visible (not hidden) at a time.
(mains[1] as HTMLElement).hidden = true;
console.log('after hiding the second one:', 'visible mains =',
  Array.from(mains).filter(m => !(m as HTMLElement).hidden).length);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page accidentally has two <code>&lt;main&gt;</code> elements, neither with a <code>hidden</code> attribute. Does <code>document.querySelectorAll(\'main\')</code> throw, warn, or just work?',
    hint: 'Think about what category of rule this is — a parsing constraint the browser enforces, or a semantic/accessibility convention the platform expects tooling to catch.',
    solution: 'It just works — <code>.length</code> is 2, no error, no warning. The one-main rule is only checked by accessibility linters (axe, Lighthouse, DevTools\' a11y panel), never by the HTML parser itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Writing a second <code>&lt;main&gt;</code> element is invalid HTML the same way an unclosed tag is — the browser will reject or auto-correct it.',
      reality: 'It parses completely cleanly. The "only one main" rule is a conformance guideline for accessibility, not a hard constraint the parser checks — both elements simply exist in the DOM exactly as written.'
    },
    {
      thought: 'If a bug like this ever ships, browser DevTools\' Elements/Console panel will show an error flagging it automatically.',
      reality: 'The generic console stays silent. Catching it requires actively running an accessibility tool — the DevTools Lighthouse/Accessibility panel, or a library like axe-core — not just glancing at the regular console for errors.'
    },
    {
      thought: 'An SPA that briefly renders two "main content" regions during a route transition is always violating the spec.',
      reality: 'The spec\'s actual wording only forbids more than one main that does NOT have the <code>hidden</code> attribute — so briefly having two in the DOM is fine as long as the outgoing one is marked <code>hidden</code> before or as the new one appears.'
    }
  ];
}
