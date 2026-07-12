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
  templateUrl: './named-timelines-are-invisible-to-siblings-without-timeline-scope.html',
  styleUrl: './named-timelines-are-invisible-to-siblings-without-timeline-scope.scss'
})
export class NamedTimelinesAreInvisibleToSiblingsWithoutTimelineScopeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A named view-timeline-name is only visible to that element\'s own DESCENDANTS by default — a sibling referencing it by name silently binds to no timeline at all',
      points: [
        'Declaring <code>view-timeline-name: --hero-tl</code> on a section makes that name resolvable by <code>animation-timeline: --hero-tl</code>, but ONLY for elements nested inside that section — the name doesn\'t automatically become visible anywhere else in the document.',
        'A sibling element (like a page header sitting next to, not inside, the named section) trying to reference <code>--hero-tl</code> doesn\'t error and doesn\'t fall back to some other timeline — its <code>animation-timeline</code> resolves to nothing at all, and the animation effectively never progresses.',
      ]
    },
    {
      heading: 'This is directly measurable: the exact same CSS setup produces a real ViewTimeline object for a descendant, but a null timeline for a sibling — until timeline-scope is added to their shared ancestor',
      points: [
        'Reading <code>element.getAnimations()[0].timeline</code> on the sibling shows <code>null</code> — the <code>CSSAnimation</code> object exists (since <code>animation:</code> is declared), but it was never bound to a real timeline.',
        'Adding <code>timeline-scope: --hero-tl</code> to the common ancestor of both elements, with nothing else changed, makes the SAME sibling\'s <code>getAnimations()[0].timeline</code> report a genuine <code>ViewTimeline</code> object instead — confirming <code>timeline-scope</code> is the specific mechanism that made the difference.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>named timelines are invisible to siblings without timeline-scope</title>
    <style>
      @keyframes barcolor { from { background: red; } to { background: blue; } }

      /* No timeline-scope on this parent -- the sibling below cannot see --sect-tl */
      .parent-no-scope { }
      .section-a { view-timeline-name: --sect-tl; height: 50px; background: #ddd; }
      .sibling-no-scope { animation: barcolor linear both; animation-timeline: --sect-tl; height: 20px; background: gray; margin-top: 8px; }

      /* timeline-scope on this parent promotes --sect-tl2 to its whole subtree */
      .parent-with-scope { timeline-scope: --sect-tl2; }
      .section-b { view-timeline-name: --sect-tl2; height: 50px; background: #ddd; }
      .sibling-with-scope { animation: barcolor linear both; animation-timeline: --sect-tl2; height: 20px; background: gray; margin-top: 8px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="parent-no-scope">
      <div class="section-a"></div>
      <div class="sibling-no-scope" id="noScope"></div>
    </div>
    <div class="parent-with-scope">
      <div class="section-b"></div>
      <div class="sibling-with-scope" id="withScope"></div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const noScope = document.querySelector<HTMLElement>('#noScope')!;
const withScope = document.querySelector<HTMLElement>('#withScope')!;

const animNoScope = noScope.getAnimations()[0];
const animWithScope = withScope.getAnimations()[0];

console.log('sibling WITHOUT timeline-scope on the shared ancestor:');
console.log('  timeline:', animNoScope.timeline);
console.log('  bound to a real timeline:', animNoScope.timeline !== null);

console.log('sibling WITH timeline-scope on the shared ancestor:');
console.log('  timeline:', animWithScope.timeline?.constructor.name);
console.log('  bound to a real timeline:', animWithScope.timeline !== null);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A sticky header sits as a SIBLING of a <code>&lt;section id="hero"&gt;</code> (both are direct children of <code>&lt;body&gt;</code>). The hero has <code>view-timeline-name: --hero-tl</code>. The header has <code>animation-timeline: --hero-tl</code> but no <code>timeline-scope</code> is declared anywhere. Does the header\'s animation respond to the hero section\'s scroll position?',
    hint: 'Ask whether the header is a DESCENDANT of the hero section, or just a sibling — named timelines are only visible to descendants by default.',
    solution: 'No — the header is not a descendant of #hero, so --hero-tl is invisible to it. The animation-timeline: --hero-tl declaration resolves to nothing, and the header\'s animation never progresses. The fix is adding timeline-scope: --hero-tl to their common ancestor (here, <body>, or any wrapping element containing both) — that promotes the named timeline\'s visibility to the whole subtree, making it reachable by the header despite being a sibling, not a descendant, of the section that defines it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A named timeline (view-timeline-name or scroll-timeline-name) is a page-wide identifier — like a CSS custom property, it should be referenceable from anywhere once declared.',
      reality: 'Named timelines follow strict tree visibility rules, closer to how a JavaScript variable is scoped to a function — only DESCENDANTS of the declaring element can reference it, unless timeline-scope explicitly widens that visibility.'
    },
    {
      thought: 'If a sibling references a named timeline that it cannot see, the browser should show a warning or error, similar to referencing an undefined CSS custom property.',
      reality: 'There is no warning. The animation-timeline declaration is valid CSS syntax; it simply resolves to no timeline for that element, and getAnimations() confirms this directly by reporting timeline: null — silent, not broken-looking.'
    },
    {
      thought: 'timeline-scope needs to be declared on the SAME element that defines the named timeline (e.g. adding timeline-scope directly to the hero section itself).',
      reality: 'timeline-scope belongs on the COMMON ANCESTOR of the timeline source and whatever element needs to reference it — not on the source element itself. Declaring it on the hero section alone would not help a header that is the hero\'s sibling, not its descendant.'
    }
  ];
}
