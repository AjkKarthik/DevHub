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
  templateUrl: './storage-event-never-fires-in-the-writing-tab.html',
  styleUrl: './storage-event-never-fires-in-the-writing-tab.scss'
})
export class StorageEventNeverFiresInTheWritingTabSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The "storage" event exists specifically for CROSS-TAB communication — not for observing your own writes',
      points: [
        'When one tab calls <code>localStorage.setItem()</code>, the browser fires a <code>storage</code> event on the <code>window</code> object of every OTHER open tab/window that shares the same origin — this is how tabs can react to storage changes made elsewhere.',
        'The tab that actually performed the write NEVER receives its own <code>storage</code> event, by design — the event\'s entire purpose is telling other contexts "something changed elsewhere", which is meaningless to fire back at the context that already knows because it made the change itself.',
      ]
    },
    {
      heading: 'This is directly, deterministically testable within a single tab — proving the negative, not just the positive',
      points: [
        'Attaching a <code>storage</code> listener and then calling <code>setItem()</code> in the exact same window reliably produces ZERO listener invocations — no timing race, no "maybe it fires late" — the spec guarantees the writing document is excluded.',
        'If you need same-tab reactivity to a storage change YOUR code just made, that has to come from your own application logic calling the update function directly — the <code>storage</code> event will never do it for you.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>storage event same-tab exclusion</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `let fired = false;
window.addEventListener('storage', () => {
  fired = true;
  console.log('storage event fired (should NOT happen in this same tab)');
});

localStorage.setItem('demo-key', 'demo-value');

// Give any (nonexistent) async event dispatch a moment to prove the point.
setTimeout(() => {
  console.log('storage event fired in this same tab?', fired);
  localStorage.removeItem('demo-key');
}, 100);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A tab attaches a <code>window.addEventListener(\'storage\', ...)</code> listener, then immediately calls <code>localStorage.setItem()</code> itself, in that same tab. Does the listener fire?',
    hint: 'Think about what the storage event is actually FOR — a mechanism for informing other contexts about a change, versus a generic "something in storage changed" notification that would fire everywhere including the source.',
    solution: 'No — it never fires in the tab that made the write. The storage event is spec-defined to notify OTHER same-origin tabs/windows only; the writing document is deliberately excluded, since it already knows about the change it just made.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The <code>storage</code> event is a generic "localStorage changed" notification that fires in every context, including the one that made the change.',
      reality: 'It specifically excludes the writing document — only OTHER same-origin tabs/windows receive it. This is core to its purpose: cross-tab communication, not self-notification.'
    },
    {
      thought: 'If you need your own tab\'s UI to update after writing to localStorage, listening for the storage event is the right approach.',
      reality: 'The storage event will never fire in that same tab, so this approach silently does nothing. Same-tab reactivity has to come from calling your update/render logic directly at the point where you write the data.'
    },
    {
      thought: 'sessionStorage changes fire the same cross-tab storage event as localStorage changes.',
      reality: 'sessionStorage is isolated per tab by design — there is no "other tab" to notify, so it never triggers storage events at all, cross-tab or otherwise.'
    }
  ];
}
