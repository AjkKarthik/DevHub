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
  templateUrl: './no-native-keyboard-to-dragstart-mapping-exists.html',
  styleUrl: './no-native-keyboard-to-dragstart-mapping-exists.scss'
})
export class NoNativeKeyboardToDragstartMappingExistsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Unlike a native <button>\'s Enter/Space activation, there is no keyboard path to dragstart AT ALL — in any browser, for any key',
      points: [
        'A native <code>&lt;button&gt;</code> genuinely does respond to a real Enter or Space press — that default action exists on the platform, even though a script can\'t trigger it on itself (a script-dispatched event is always untrusted).',
        'The HTML5 Drag and Drop API has NO equivalent mapping whatsoever — there is no key, combination, or accessibility feature that natively fires <code>dragstart</code>. This isn\'t a "script can\'t prove it" limitation like the button case; the feature genuinely doesn\'t exist on the platform for ANY input source, keyboard included.',
      ]
    },
    {
      heading: 'Because there\'s no native behavior of any kind to be gated by trust, this absence IS directly, accurately testable via script',
      points: [
        'Dispatching a synthetic Enter or Space keydown at a <code>draggable="true"</code> element and confirming <code>dragstart</code> never fires is a meaningful, accurate test here — unlike testing a real button\'s native click activation, there is no true native behavior being masked by the untrusted-event limitation; there\'s simply nothing there to trigger.',
        'This is exactly why the main page\'s guidance is to build a PARALLEL interaction path (custom keyboard handlers, an alternative "Move up/down" UI, or a purpose-built library) rather than expecting any native fallback — none exists to fall back to.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>No native keyboard-to-dragstart mapping</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div draggable="true" tabindex="0" id="item">Draggable item</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const item = document.querySelector<HTMLElement>('#item')!;
let dragstartFired = false;
item.addEventListener('dragstart', () => dragstartFired = true);

item.focus();
item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
item.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));

console.log('dragstart fired from Enter or Space?', dragstartFired);

// Contrast: a manually-added keydown handler CAN start a custom
// drag-like interaction — proving the gap is filled by application
// code, never by any native browser behavior.
let customDragTriggered = false;
item.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') customDragTriggered = true;
});
item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
console.log('a manually-added keydown handler CAN detect the key:', customDragTriggered);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>draggable="true"</code> element is focused, and a script dispatches a synthetic Space keydown at it. Does <code>dragstart</code> fire?',
    hint: 'This is different from asking whether a real button responds to Enter — ask whether ANY native keyboard-to-drag mapping exists on the platform at all, for any input source.',
    solution: 'No, never — not because of the untrusted-synthetic-event limitation that affects testing a real button\'s Enter activation, but because no native keyboard-to-dragstart mapping exists on the platform at all, for any key, in any browser. There is nothing to trigger.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a draggable element has <code>tabindex="0"</code> and can be focused, pressing Enter or Space on it should start a drag, the same way it activates a button.',
      reality: 'It never does, in any browser — the Drag and Drop API has no keyboard-triggered path to <code>dragstart</code> at all. Focusability alone doesn\'t grant an element every kind of native keyboard behavior.'
    },
    {
      thought: 'This is the same "script-dispatched events can\'t prove native default actions" limitation as testing a real button\'s Enter-activation.',
      reality: 'It\'s a genuinely different situation: for buttons, the native behavior IS real, just untestable via script due to the trust requirement. For drag-and-drop, there is no native keyboard behavior in the first place — the absence is real and provable, not just hidden from testing.'
    },
    {
      thought: 'Making drag-and-drop keyboard-accessible means finding the right ARIA attribute to add.',
      reality: 'No ARIA attribute grants keyboard drag capability — the main page\'s guidance is explicit: build a parallel interaction path with your own keydown handlers, an alternative UI (e.g. Move-up/Move-down buttons), or a purpose-built accessible drag-and-drop library.'
    }
  ];
}
