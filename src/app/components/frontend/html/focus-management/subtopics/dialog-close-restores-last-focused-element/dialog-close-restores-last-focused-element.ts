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
  templateUrl: './dialog-close-restores-last-focused-element.html',
  styleUrl: './dialog-close-restores-last-focused-element.scss'
})
export class DialogCloseRestoresLastFocusedElementSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '<code>dialog.close()</code> genuinely does restore focus automatically — this IS reliable, native behavior',
      points: [
        'When <code>showModal()</code> is called, the browser internally records whatever element currently has focus as the dialog\'s "previously focused element".',
        'When the dialog later closes, the browser automatically calls <code>.focus()</code> on that stored element — no custom focus-trap or restoration code required for the common case.',
      ]
    },
    {
      heading: 'The subtlety: it restores focus to whatever was focused at showModal() TIME, not necessarily the button the user thinks of as "the trigger"',
      points: [
        'If anything moves focus between the user\'s click and the actual <code>showModal()</code> call — a validation step, an analytics call that happens to touch the DOM, an intermediate confirmation — the browser faithfully restores focus to THAT element instead, not the original button.',
        'This is a genuinely different failure mode from "forgetting" to restore focus: the automatic mechanism works exactly as designed, but design intent (return to the visually-obvious trigger) and actual behavior (return to whatever was focused a moment before <code>showModal()</code> ran) can quietly diverge.',
        'The practical guardrail: call <code>showModal()</code> as close as possible to the user\'s triggering interaction, and if any intervening code focuses something else first, explicitly re-focus the real trigger immediately before opening.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>dialog close focus restoration</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <button id="trigger">Open dialog</button>
    <button id="decoy" style="display:none">Decoy (focused right before showModal)</button>
    <dialog id="dialog">
      <p>Dialog content</p>
      <button id="closeBtn">Close</button>
    </dialog>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const trigger = document.querySelector<HTMLButtonElement>('#trigger')!;
const decoy = document.querySelector<HTMLButtonElement>('#decoy')!;
const dialog = document.querySelector<HTMLDialogElement>('#dialog')!;

// The user clicks trigger...
trigger.focus();
console.log('user focused trigger:', document.activeElement === trigger);

// ...but some intervening code (validation, analytics, anything) moves
// focus elsewhere BEFORE showModal() actually runs.
decoy.focus();
console.log('right before showModal, activeElement is the decoy:', document.activeElement === decoy);

dialog.showModal();
console.log('after showModal, focus moved inside dialog:', dialog.contains(document.activeElement));

dialog.close();
console.log('after close, activeElement restored automatically to the decoy (not trigger):', document.activeElement === decoy);
console.log('after close, activeElement is trigger?', document.activeElement === trigger);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A user clicks a button to open a dialog. Before <code>showModal()</code> actually runs, an unrelated validation function briefly calls <code>.focus()</code> on a different, invisible element. When the dialog later closes, which element gets focus?',
    hint: 'The browser\'s restoration mechanism is real and automatic — think about exactly WHEN it takes its snapshot of "the element to return to".',
    solution: 'The invisible element the validation function focused — NOT the button the user actually clicked. The browser restores focus to whatever had focus at the exact moment <code>showModal()</code> was called, which can diverge from the semantic "trigger" if anything shifts focus in between.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Native <code>&lt;dialog&gt;</code> doesn\'t restore focus on close at all — you always have to implement that manually.',
      reality: 'It genuinely does restore focus automatically, reliably, across current browsers — the browser tracks the previously-focused element itself and calls <code>.focus()</code> on it when the dialog closes. No custom code is needed for the straightforward case.'
    },
    {
      thought: 'Since restoration is automatic, it will always correctly return focus to the exact button the user visually clicked to open the dialog.',
      reality: 'It returns focus to whatever element WAS FOCUSED at the moment <code>showModal()</code> ran — usually the trigger, but not guaranteed if any code shifts focus between the click and that call. The mechanism is reliable; the TARGET it captures is not always what you\'d assume.'
    },
    {
      thought: 'If restoration ever lands on the wrong element, the fix is to write your own close-event handler that manually calls <code>.focus()</code> on the trigger, replacing the native mechanism entirely.',
      reality: 'A simpler, more targeted fix usually works: keep the native mechanism, but ensure nothing else steals focus between the user\'s interaction and the <code>showModal()</code> call — or explicitly re-focus the real trigger immediately before opening if something already did.'
    }
  ];
}
