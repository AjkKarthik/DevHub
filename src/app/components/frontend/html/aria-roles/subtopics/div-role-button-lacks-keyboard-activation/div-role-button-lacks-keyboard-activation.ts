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
  templateUrl: './div-role-button-lacks-keyboard-activation.html',
  styleUrl: './div-role-button-lacks-keyboard-activation.scss'
})
export class DivRoleButtonLacksKeyboardActivationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ARIA only changes what assistive technology ANNOUNCES — it adds zero behavior of its own',
      points: [
        'Setting <code>role="button"</code> on a <code>&lt;div&gt;</code> tells a screen reader "announce this as a button" — nothing more. The div does not become focusable, does not enter the tab order, and does not respond to Enter or Space.',
        'A real <code>&lt;button&gt;</code> gets three things for free from the browser: focusability (<code>tabIndex</code> defaults to 0), inclusion in the tab order, and built-in Enter/Space-to-click activation. None of these three come from the <code>role</code> attribute — they come from the element being a genuine <code>&lt;button&gt;</code>.',
      ]
    },
    {
      heading: 'Making a div-based "button" actually work requires manually replicating all three',
      points: [
        '<code>tabindex="0"</code> is required to make the div focusable and put it in the natural tab order — without it, keyboard users cannot even reach the element.',
        'A <code>keydown</code> listener checking for <code>Enter</code> and <code>" "</code> (Space) is required to replicate native activation — the browser will never fire this on its own for a div, no matter what role is set.',
        'This is exactly why the first rule of ARIA is to prefer the native element: a real <code>&lt;button&gt;</code> gets all of this for free, permanently, with zero JavaScript.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>div role=button lacks keyboard activation</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div role="button" id="fakeBtn">Fake button (div)</div>
    <button id="realBtn">Real button</button>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const fakeBtn = document.querySelector<HTMLElement>('#fakeBtn')!;
const realBtn = document.querySelector<HTMLElement>('#realBtn')!;

console.log('fakeBtn.tabIndex (no tabindex set):', fakeBtn.tabIndex);
console.log('realBtn.tabIndex (native button):', realBtn.tabIndex);

let fakeClicks = 0;
let realClicks = 0;
fakeBtn.addEventListener('click', () => fakeClicks++);
realBtn.addEventListener('click', () => realClicks++);

// Simulate pressing Enter while each element is focused — the browser's
// OWN default keyboard handling is what we're testing here, not a
// keydown listener we wrote ourselves.
function pressEnter(el: HTMLElement) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
}

pressEnter(fakeBtn);
pressEnter(realBtn);

console.log('fakeBtn click count after Enter keydown:', fakeClicks);
console.log('realBtn click count after Enter keydown:', realClicks);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>&lt;div role="button"&gt;</code> (no <code>tabindex</code>, no key handler) receives a synthetic <code>Enter</code> keydown event while focused. Does its <code>click</code> listener fire?',
    hint: 'Ask what actually causes a "click" listener to fire on Enter — is it the <code>role</code> attribute, or a real button element\'s own native behavior?',
    solution: 'No — nothing fires. <code>role="button"</code> only affects what a screen reader announces; it never wires up Enter/Space-to-click behavior. Only a genuine <code>&lt;button&gt;</code> element gets that automatically from the browser.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding <code>role="button"</code> to a <code>&lt;div&gt;</code> makes it behave like a button — focusable, clickable via keyboard, the works.',
      reality: 'It only changes the accessibility-tree announcement. Focusability, tab order, and Enter/Space activation are all separate browser behaviors tied to the real <code>&lt;button&gt;</code> element — none of them come from the <code>role</code> attribute.'
    },
    {
      thought: 'Adding <code>tabindex="0"</code> alone is enough to fully replicate native button behavior on a div.',
      reality: '<code>tabindex="0"</code> only handles focusability and tab order. You still need a manual <code>keydown</code> listener for Enter AND Space — the browser never wires up keyboard activation for a div, regardless of its role or tabindex.'
    },
    {
      thought: 'role="button" on an ACTUAL <code>&lt;button&gt;</code> element is harmless — redundant, but not a real problem.',
      reality: 'It can genuinely confuse screen readers, since the explicit role overrides the implicit native one — best case it does nothing useful, worst case a mismatched role hides real button semantics.'
    }
  ];
}
