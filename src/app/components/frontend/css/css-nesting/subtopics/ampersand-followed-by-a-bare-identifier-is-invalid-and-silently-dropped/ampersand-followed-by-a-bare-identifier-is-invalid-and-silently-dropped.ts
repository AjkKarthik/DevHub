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
  templateUrl: './ampersand-followed-by-a-bare-identifier-is-invalid-and-silently-dropped.html',
  styleUrl: './ampersand-followed-by-a-bare-identifier-is-invalid-and-silently-dropped.scss'
})
export class AmpersandFollowedByABareIdentifierIsInvalidAndSilentlyDroppedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '&__element (a bare identifier glued directly onto &, no dot, no colon) is not valid CSS at all — the entire rule is a syntax error and gets dropped',
      points: [
        'After the nesting selector <code>&</code>, only simple-selector types that are legally allowed to follow ANOTHER selector in a compound can come next: a class (<code>&.foo</code>), an ID (<code>&#foo</code>), a pseudo-class (<code>&:hover</code>), a pseudo-element (<code>&::before</code>), or an attribute (<code>&[foo]</code>).',
        'This is a genuine correction to a common assumption (including on this hub\'s own main topic page, now fixed): the popular belief is that <code>&__element</code> compiles down to a descendant selector like <code>.block __element</code> — verified directly in-browser, that is NOT what happens.',
      ],
    },
    {
      heading: 'A bare identifier like __element or --modifier is a TYPE selector (matching an element tag name) — and type selectors can only appear at the very START of a compound selector, never after another selector',
      points: [
        '<code>&__element</code> tries to place a type-selector-shaped token immediately after <code>&</code>, which is structurally invalid — not "unusual" or "discouraged", genuinely invalid CSS syntax.',
        'The parser doesn\'t try to interpret it as a descendant selector or partially recover — the WHOLE nested rule is silently dropped from the stylesheet, confirmed directly by reading the browser\'s own parsed <code>cssRules</code>, which shows the invalid rule simply isn\'t there at all — with zero console warning.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>& followed by a bare identifier is invalid and silently dropped</title>
    <style>
      .block {
        color: black;
        &__element { color: red; }    /* invalid -- silently dropped */
        &--modifier { color: blue; }  /* also invalid -- silently dropped */
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="block">text</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const sheet = document.styleSheets[0];
const rules = Array.from(sheet.cssRules).map(r => r.cssText);

console.log('parsed CSS rules that actually survived:', rules);
console.log('number of rules containing "block":', rules.filter(r => r.includes('block')).length);
console.log('only the base .block rule survived -- the &__element and &--modifier rules were dropped entirely:', rules.filter(r => r.includes('block')).length === 1);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes <code>.card { &__title { font-weight: 700; } }</code> hoping to style elements with class "card__title". After deploying, the title text never gets bold — no error appears anywhere. What is happening?',
    hint: 'Ask whether &__title is actually valid CSS nesting syntax, or whether it silently fails to parse at all.',
    solution: '&__title is invalid — a bare identifier cannot follow & in a compound selector. The whole rule is silently dropped from the stylesheet with no console warning, which is why nothing visibly errors but the styling never applies. The fix is either writing .card__title { } as its own flat top-level rule, or nesting with the full class name including its leading dot: .card__title { &.card__title--large { } }.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '&__element must work at least SOMEHOW in native CSS nesting — even if not concatenation, surely it becomes some kind of descendant or sibling selector.',
      reality: 'It doesn\'t become anything — it\'s a straightforward syntax error. The whole rule is dropped from the parsed stylesheet, exactly as if it had a typo like a missing closing brace, just without any visible error.'
    },
    {
      thought: 'If &__element were truly invalid, the browser would show a warning in the console or DevTools\' Styles panel, the same way it flags other CSS errors.',
      reality: 'Invalid selectors inserted via a stylesheet are silently dropped with no console warning at all — confirmed directly by inspecting the parsed cssRules, which shows only the valid sibling rules survived. The only way to notice is realizing the intended style never applies.'
    },
    {
      thought: 'This means & can never be combined with a full BEM modifier/element class name inside a nested rule.',
      reality: 'It works fine as long as the FULL class name follows a leading dot — &.block__element--modifier is valid (a class selector legally following &), it\'s specifically the bare, dot-less &__element/&--modifier shorthand that fails.'
    }
  ];
}
