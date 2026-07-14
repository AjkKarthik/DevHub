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
  templateUrl: './parent-child-collapse-moves-the-parents-own-box.html',
  styleUrl: './parent-child-collapse-moves-the-parents-own-box.scss'
})
export class ParentChildCollapseMovesTheParentsOwnBoxSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'When a first child\'s top margin collapses with its parent, the margin doesn\'t create space INSIDE the parent — it "escapes" and shifts the PARENT\'s own position instead',
      points: [
        'If a <code>.wrapper</code> has no border, padding, or other BFC-triggering property separating it from its first child, and that child has <code>margin-top: 24px</code>, the margin does not push the child 24px down inside the wrapper.',
        'Instead, the wrapper itself is pushed 24px down (relative to ITS OWN parent/siblings) — measurably, the wrapper\'s top edge and the child\'s top edge end up at the EXACT SAME coordinate, since the margin bled straight through the wrapper\'s boundary as if the wrapper weren\'t there.',
      ]
    },
    {
      heading: 'The fix (a Block Formatting Context) is also directly measurable — the wrapper\'s own position stops moving once collapse is blocked',
      points: [
        'Adding <code>overflow: hidden</code> (or <code>display: flow-root</code>) to the wrapper creates a new Block Formatting Context, which specifically blocks this parent-child collapse.',
        'After the fix, the wrapper\'s own top-edge coordinate returns to its expected, un-shifted position, and the child\'s margin now genuinely applies AS INTERNAL SPACING — the child\'s top edge is measurably below the wrapper\'s top edge, not equal to it.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Parent-child collapse moves the parent's own box</title>
    <style>
      #wrapper { background: pink; }
      #child { margin-top: 24px; height: 10px; background: purple; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="wrapper">
      <div id="child">child (margin-top: 24px)</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const wrapper = document.querySelector<HTMLElement>('#wrapper')!;
const child = document.querySelector<HTMLElement>('#child')!;

const wrapperTopBefore = wrapper.getBoundingClientRect().top;
const childTopBefore = child.getBoundingClientRect().top;
console.log('BEFORE fix — wrapper.top:', wrapperTopBefore, 'child.top:', childTopBefore);
console.log('wrapper and child share the exact same top edge:', wrapperTopBefore === childTopBefore);

// Apply the fix: overflow creates a Block Formatting Context, blocking collapse.
wrapper.style.overflow = 'hidden';

const wrapperTopAfter = wrapper.getBoundingClientRect().top;
const childTopAfter = child.getBoundingClientRect().top;
console.log('AFTER fix — wrapper.top:', wrapperTopAfter, 'child.top:', childTopAfter);
console.log('child is now measurably below the wrapper (real internal spacing):', childTopAfter > wrapperTopAfter);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>.wrapper</code> with no border/padding contains a first child with <code>margin-top: 24px</code>. What does <code>wrapper.getBoundingClientRect().top</code> equal, compared to the child\'s?',
    hint: 'The margin isn\'t absorbed inside the wrapper — think about where a "collapsed-through" margin actually ends up affecting position.',
    solution: 'They\'re equal — the wrapper\'s own top edge and the child\'s top edge land at the exact same coordinate. The 24px margin escaped the wrapper entirely and shifted the wrapper\'s own position relative to whatever comes before it, rather than creating internal space between the wrapper and the child.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A first child\'s top margin, when it collapses with its parent, simply gets ignored or reduced to zero.',
      reality: 'It doesn\'t disappear — it "escapes" the parent entirely and shifts the PARENT\'s own position by that amount instead, measurably moving the wrapper\'s own bounding box, not just the space inside it.'
    },
    {
      thought: 'This kind of parent-child margin collapse only matters visually — it doesn\'t actually change any element\'s measured position.',
      reality: 'It genuinely changes the parent\'s own <code>getBoundingClientRect()</code> coordinates — this is real, measurable layout behavior, not just a visual illusion.'
    },
    {
      thought: 'Adding overflow: hidden to fix this collapse might have other layout side effects beyond just blocking the collapse.',
      reality: 'Creating a Block Formatting Context via overflow: hidden specifically and predictably blocks margin collapse (among its other well-documented effects, like containing floats) — the wrapper\'s position becomes exactly what it would be without any child margin escaping.'
    }
  ];
}
