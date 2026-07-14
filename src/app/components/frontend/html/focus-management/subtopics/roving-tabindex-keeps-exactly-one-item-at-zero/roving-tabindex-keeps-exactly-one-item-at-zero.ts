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
  templateUrl: './roving-tabindex-keeps-exactly-one-item-at-zero.html',
  styleUrl: './roving-tabindex-keeps-exactly-one-item-at-zero.scss'
})
export class RovingTabindexKeepsExactlyOneItemAtZeroSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A composite widget (toolbar, tab list, carousel) needs Tab to enter/exit ONCE — arrow keys handle movement inside',
      points: [
        'If every button inside a toolbar had <code>tabindex="0"</code>, Tab would stop on each one individually — a keyboard user would need many Tab presses just to get past the toolbar, exactly the opposite of the fast, single-stop landmark experience they expect.',
        'The "roving tabindex" pattern solves this: only ONE item in the group has <code>tabindex="0"</code> at any moment (the "current" item); every other item has <code>tabindex="-1"</code>, making them focusable via script but invisible to the natural Tab sequence.',
      ]
    },
    {
      heading: 'Arrow keys move the roving tabindex, not Tab — and this is a live, checkable invariant',
      points: [
        'On <code>ArrowRight</code>/<code>ArrowLeft</code> (or Up/Down for vertical widgets), the handler sets the newly-focused item\'s <code>tabindex</code> to <code>0</code>, sets the PREVIOUS item\'s back to <code>-1</code>, and calls <code>.focus()</code> on the new one.',
        'At every moment, exactly one item in the group should have <code>tabindex="0"</code> — this invariant is directly checkable by counting how many items in the group have <code>.tabIndex === 0</code> after each arrow-key move.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Roving tabindex</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div role="toolbar" id="toolbar">
      <button tabindex="0" data-i="0">Bold</button>
      <button tabindex="-1" data-i="1">Italic</button>
      <button tabindex="-1" data-i="2">Underline</button>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const toolbar = document.querySelector<HTMLElement>('#toolbar')!;
const items = Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button'));

function countZeroTabindex(): number {
  return items.filter(el => el.tabIndex === 0).length;
}

console.log('zero-tabindex count at start:', countZeroTabindex());
console.log('which item:', items.find(el => el.tabIndex === 0)?.dataset['i']);

function moveTo(index: number) {
  const current = items.find(el => el.tabIndex === 0);
  if (current) current.tabIndex = -1;
  items[index].tabIndex = 0;
  items[index].focus();
}

// Simulate ArrowRight moving from item 0 to item 1.
moveTo(1);
console.log('after moving right, zero-tabindex count:', countZeroTabindex());
console.log('which item now:', items.find(el => el.tabIndex === 0)?.dataset['i']);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A 3-button toolbar uses roving tabindex, currently focused on item 1. After pressing ArrowRight once, how many buttons in the group have <code>tabIndex === 0</code>?',
    hint: 'The pattern\'s entire point is to keep the group behaving like a single Tab stop — think about what would break if more than one item had tabindex 0 at once.',
    solution: 'Exactly one — item 2 now has <code>tabIndex === 0</code>, and item 1\'s was set back to <code>-1</code> as part of the same move. The invariant "exactly one item at tabindex 0" holds after every arrow-key move, not just at the start.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Giving every item in a toolbar <code>tabindex="0"</code> is the simplest way to make them all keyboard-accessible.',
      reality: 'It makes the widget WORSE for keyboard users — Tab would stop on every individual item, turning a single logical group into many separate tab stops instead of one, exactly the opposite of expected toolbar behavior.'
    },
    {
      thought: 'Roving tabindex means arrow keys AND Tab both move between items in the group.',
      reality: 'Tab moves focus in and out of the whole group as a single stop (landing on whichever item currently has tabindex="0"); arrow keys are what move between items WITHIN the group. Mixing these responsibilities up defeats the pattern\'s purpose.'
    },
    {
      thought: 'It doesn\'t matter if two items briefly have <code>tabindex="0"</code> at the same time during a transition, as long as it gets corrected eventually.',
      reality: 'The invariant needs to hold at every point — setting the new item\'s tabindex to 0 and the old item\'s to -1 should happen together, in the same handler, so a Tab press mid-interaction never lands somewhere confusing.'
    }
  ];
}
