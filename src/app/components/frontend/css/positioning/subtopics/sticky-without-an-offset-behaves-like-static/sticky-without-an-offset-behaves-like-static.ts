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
  templateUrl: './sticky-without-an-offset-behaves-like-static.html',
  styleUrl: './sticky-without-an-offset-behaves-like-static.scss'
})
export class StickyWithoutAnOffsetBehavesLikeStaticSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'position: sticky with no top/bottom/left/right offset never activates — it silently scrolls away like a normal element',
      points: [
        'Sticky positioning needs an offset (most commonly <code>top</code>) to know WHERE to pin the element once it reaches that threshold during scrolling — without one, the browser has no activation point to compare against.',
        'The result isn\'t an error or a warning — the element simply behaves exactly as if it were <code>position: static</code>, scrolling completely out of view along with the rest of the content around it.',
      ]
    },
    {
      heading: 'This is directly measurable by simulating a scroll and comparing the element\'s position before and after',
      points: [
        'Setting <code>scrollTop</code> on the scrollable ancestor and re-reading the sticky element\'s <code>getBoundingClientRect().top</code> reveals the real behavior: an element WITH a <code>top</code> offset stays pinned near that value; one WITHOUT any offset moves by exactly the scroll distance, just like ordinary content.',
        'This is exactly why the main page\'s Common Mistakes section lists "sticky without a top/bottom offset" as its own distinct mistake, separate from the "overflow: hidden breaks sticky" mistake — two different missing prerequisites, two different silent failure modes.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>sticky without an offset behaves like static</title>
    <style>
      #scrollContainer { height: 150px; width: 200px; overflow-y: scroll; border: 2px solid #264de4; }
      #stickyNoOffset { position: sticky; background: #dbeafe; height: 30px; }
      #spacer { height: 500px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="scrollContainer">
      <div id="stickyNoOffset">sticky, no offset set</div>
      <div id="spacer"></div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const container = document.querySelector<HTMLElement>('#scrollContainer')!;
const sticky = document.querySelector<HTMLElement>('#stickyNoOffset')!;

const containerTopBefore = container.getBoundingClientRect().top;
const stickyTopBefore = sticky.getBoundingClientRect().top - containerTopBefore;
console.log('sticky element position relative to container, before scrolling:', stickyTopBefore);

container.scrollTop = 300;

const containerTopAfter = container.getBoundingClientRect().top;
const stickyTopAfter = sticky.getBoundingClientRect().top - containerTopAfter;
console.log('sticky element position relative to container, after scrolling 300px:', stickyTopAfter);
console.log('it scrolled away with the content (behaved like static):', stickyTopAfter < -250);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An element has <code>position: sticky</code> but no <code>top</code>, <code>bottom</code>, <code>left</code>, or <code>right</code> declared. Its scroll container is scrolled 300px. Does the element stay pinned near its original position?',
    hint: 'Sticky needs to know the THRESHOLD at which to start pinning — think about what information is missing without any offset property set.',
    solution: 'No — it scrolls away completely along with the rest of the content, exactly as if it were position: static. Without an offset, sticky has no activation threshold and never pins at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'position: sticky activates automatically as soon as an element would scroll out of the viewport, without needing any extra configuration.',
      reality: 'It needs an explicit offset (top, bottom, left, or right) to know WHERE to pin — without one, it never activates and behaves exactly like position: static.'
    },
    {
      thought: 'If sticky positioning "isn\'t working," the cause is always the overflow: hidden / missing scroll container issue.',
      reality: 'That\'s one distinct cause, but a missing offset is a completely separate, equally common one — the main page\'s Common Mistakes section lists them as two SEPARATE mistakes because they\'re two different missing prerequisites with the same silent symptom.'
    },
    {
      thought: 'Setting top: 0 vs. leaving top unset produces roughly the same sticky behavior, just with a slightly different pinning distance.',
      reality: 'They\'re categorically different — top: 0 (any value) activates sticky pinning; no offset at all means sticky NEVER activates, a difference in kind, not degree.'
    }
  ];
}
