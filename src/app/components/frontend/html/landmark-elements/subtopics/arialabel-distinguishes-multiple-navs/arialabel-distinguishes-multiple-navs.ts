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
  templateUrl: './arialabel-distinguishes-multiple-navs.html',
  styleUrl: './arialabel-distinguishes-multiple-navs.scss'
})
export class ArialabelDistinguishesMultipleNavsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Multiple <nav> elements are valid HTML — but without a label, assistive tech can\'t tell them apart by name',
      points: [
        'A page commonly has more than one navigation region — primary nav, breadcrumbs, a footer nav — and every one of them is a legitimate use of <code>&lt;nav&gt;</code>.',
        'Each unlabeled <code>&lt;nav&gt;</code> exposes the exact same generic accessible name (effectively none), so a screen reader\'s landmark list shows several entries a user can\'t distinguish except by guessing from position.',
        '<code>aria-label</code> (a short string) or <code>aria-labelledby</code> (pointing at an existing visible heading\'s id) gives each one a distinct, announced name — "Primary navigation", "Breadcrumb", "Footer navigation".',
      ]
    },
    {
      heading: 'This is directly readable and settable from JavaScript via the .ariaLabel property, not just the aria-label attribute',
      points: [
        'The ARIAMixin interface (supported in all current major browsers) exposes <code>.ariaLabel</code> as a live JS property, mirroring the <code>aria-label</code> attribute — reading one after setting the other confirms they refer to the same underlying value.',
        'Before any label is applied, <code>.ariaLabel</code> reads back as <code>null</code> on every unlabeled <code>&lt;nav&gt;</code> — there is no default value that already distinguishes them.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>aria-label on multiple navs</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <nav id="primary"><a href="#">Home</a></nav>
    <nav id="breadcrumb"><a href="#">Home</a> / <a href="#">Docs</a></nav>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const primary = document.querySelector<HTMLElement>('#primary')!;
const breadcrumb = document.querySelector<HTMLElement>('#breadcrumb')!;

// Before labeling: both report null. Nothing distinguishes them by name.
console.log('primary.ariaLabel before:', primary.ariaLabel);
console.log('breadcrumb.ariaLabel before:', breadcrumb.ariaLabel);

// Set via the reflected JS property — equivalent to setAttribute('aria-label', ...).
primary.ariaLabel = 'Primary';
breadcrumb.ariaLabel = 'Breadcrumb';

console.log('primary.ariaLabel after:', primary.ariaLabel);
console.log('breadcrumb.ariaLabel after:', breadcrumb.ariaLabel);

// The attribute and the property stay in sync either direction.
console.log('matches getAttribute:',
  primary.ariaLabel === primary.getAttribute('aria-label'));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page has two unlabeled <code>&lt;nav&gt;</code> elements. Before any <code>aria-label</code> is set, what does reading <code>.ariaLabel</code> report on each — and are the two values different from each other?',
    hint: 'Neither element has been given any label yet — think about what the "no label set" state actually looks like as a JS value, not what a screen reader might announce as a fallback.',
    solution: 'Both report <code>null</code> — completely identical, with no default distinguishing value. This is exactly why unlabeled multiple navs are indistinguishable by name to assistive tech: there\'s no implicit label to fall back on.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Having more than one <code>&lt;nav&gt;</code> element on a page is invalid HTML, or at least a code smell to avoid.',
      reality: 'It\'s completely valid and common — primary navigation, breadcrumbs, and footer navigation are all legitimate, simultaneous uses of <code>&lt;nav&gt;</code> on the same page.'
    },
    {
      thought: 'Screen readers can tell multiple <code>&lt;nav&gt;</code> elements apart automatically, e.g. by their position on the page or their contents.',
      reality: 'Without an explicit <code>aria-label</code> or <code>aria-labelledby</code>, every unlabeled nav exposes the same generic, unnamed landmark — a user browsing the landmarks list has no way to tell them apart except trial and error.'
    },
    {
      thought: 'Setting a label requires directly writing the <code>aria-label</code> HTML attribute — there\'s no way to do it from JavaScript without <code>setAttribute</code>.',
      reality: 'Modern browsers expose <code>.ariaLabel</code> as a live, readable/writable JS property (part of ARIAMixin) that stays in sync with the <code>aria-label</code> attribute in both directions — no <code>setAttribute</code>/<code>getAttribute</code> calls required.'
    }
  ];
}
