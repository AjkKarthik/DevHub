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
  templateUrl: './bare-scroll-defaults-to-the-nearest-ancestor-scroll-container.html',
  styleUrl: './bare-scroll-defaults-to-the-nearest-ancestor-scroll-container.scss'
})
export class BareScrollDefaultsToTheNearestAncestorScrollContainerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'animation-timeline: scroll() with no scroller keyword at all does not mean "the page scroll" — it means the NEAREST scrollable ancestor of the animated element',
      points: [
        'The <code>scroll()</code> function accepts an optional scroller keyword: <code>nearest</code> (the default), <code>root</code> (the document scroller), or <code>self</code> (the animated element\'s own overflow). Omitting the keyword entirely is exactly equivalent to writing <code>nearest</code> explicitly.',
        'If an animated element happens to live inside its OWN nested scrollable container (a scrollable card, a modal, a sidebar with <code>overflow-y: scroll</code>), a bare <code>scroll()</code> binds to THAT nested container — not the outer page scroll — even though the element is also, transitively, inside the page.',
      ]
    },
    {
      heading: 'This is directly measurable: the ScrollTimeline object created by a bare scroll() exposes a source property that can be checked against candidate scroll containers directly',
      points: [
        'For an element nested two levels deep inside two DIFFERENT scrollable containers (an outer one and an inner one), reading <code>element.getAnimations()[0].timeline.source</code> after applying a bare <code>scroll()</code> reveals exactly which DOM element the timeline actually bound to.',
        'The result identifies the INNER container specifically — confirmed via strict equality (<code>timeline.source === innerContainer</code>) — proving "nearest" genuinely means the closest ancestor scroller, not just "some" ancestor or the outermost one.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>bare scroll() defaults to the nearest ancestor scroll container</title>
    <style>
      #outer { width: 260px; height: 260px; overflow-y: scroll; background: #ddd; padding: 10px; }
      #outerSpacer { height: 2000px; }
      #inner { width: 200px; height: 100px; overflow-y: scroll; background: #bbb; margin-top: 50px; }
      #innerSpacer { height: 500px; }
      #bar {
        height: 10px; width: 100%; background: crimson;
        transform-origin: left; transform: scaleX(0);
        animation: growbar linear both;
        /* Bare scroll() -- no scroller keyword specified */
        animation-timeline: scroll();
      }
      @keyframes growbar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="outer">
      <div id="inner">
        <div id="bar"></div>
        <div id="innerSpacer"></div>
      </div>
      <div id="outerSpacer"></div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const outer = document.querySelector<HTMLElement>('#outer')!;
const inner = document.querySelector<HTMLElement>('#inner')!;
const bar = document.querySelector<HTMLElement>('#bar')!;

const anim = bar.getAnimations()[0];
const source = (anim.timeline as any).source as HTMLElement;

console.log('bare scroll() bound the ScrollTimeline to this element:', source === inner ? 'the INNER scroll container' : source === outer ? 'the OUTER scroll container' : 'something else');
console.log('source === inner (nearest ancestor):', source === inner);
console.log('source === outer (outermost ancestor):', source === outer);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A progress bar inside a scrollable modal dialog (the modal itself has <code>overflow-y: auto</code>) uses <code>animation-timeline: scroll();</code> with no scroller keyword, hoping to track the overall PAGE scroll behind the modal. Does it?',
    hint: 'Ask which scroll container is actually NEAREST to the progress bar element — the modal\'s own scrollable body, or the page behind it.',
    solution: 'No — bare scroll() defaults to nearest, which binds to the modal\'s own scrollable container, not the page. To track the page scroll specifically regardless of nesting, the scroller keyword must be set explicitly: animation-timeline: scroll(root block).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'animation-timeline: scroll() with nothing inside the parentheses means "the page scroll" by default, since that\'s the most common scroll-driven animation use case (a reading progress bar).',
      reality: 'It defaults to nearest — the closest ancestor scroll container to the animated element, which is very often (but not always) the page. Any element nested inside its own scrollable container binds to that inner scroller instead.'
    },
    {
      thought: 'The three scroller keywords (nearest, root, self) are rarely-needed advanced options — most real usage can just omit the keyword entirely without thinking about which one applies.',
      reality: 'Omitting the keyword IS choosing one of the three — specifically nearest — not opting out of the choice. Any component intended for reuse inside potentially-nested scroll contexts (a card that might sit inside a scrollable panel) should consider whether nearest is really the intended behavior.'
    },
    {
      thought: 'Since scroll() and root both eventually track "the scroll", using scroll(nearest) and scroll(root) should produce the same result in the vast majority of real page layouts.',
      reality: 'They diverge in exactly the situations that matter most for reusable components — any element inside a modal, a scrollable card, a sidebar panel, or a nested layout region gets a genuinely different (and often unintended) timeline with the default nearest behavior versus an explicit root.'
    }
  ];
}
