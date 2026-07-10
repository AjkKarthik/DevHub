import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-events-no-bubble-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-events-dont-bubble-by-default.html',
  styleUrl: './custom-events-dont-bubble-by-default.scss',
})
export class CustomEventsDontBubbleByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #5, Proven by a Parent Listener That Never Fires',
      points: [
        'The main page states plainly: "Custom events do not bubble by default (unlike most native events)." Its Mistake #5 shows the broken pattern; this subtopic dispatches the SAME custom event twice — once without <code>bubbles: true</code>, once with it — from an identical nested element, and shows a parent listener catching one and completely missing the other.',
        'This is the OPPOSITE default from what most native DOM events behave like: <code>click</code>, <code>input</code>, <code>change</code>, and most other native events bubble automatically with no configuration needed. <code>CustomEvent</code> deliberately defaults <code>bubbles</code> to <code>false</code> — a genuinely easy trap for anyone assuming custom events "just work like real DOM events."',
      ],
    },
    {
      heading: 'Why This Default Exists and What It Means for Component Communication',
      points: [
        'A non-bubbling custom event only fires listeners attached DIRECTLY to the element that dispatched it — <code>e.currentTarget</code> during dispatch is always the dispatching element itself, and without <code>bubbles: true</code>, no ancestor ever gets a chance to observe the event at all, no matter how you\'ve structured your delegation.',
        'Setting <code>bubbles: true</code> is what enables the exact same event-delegation pattern the main page uses for native events (one listener on a parent, using <code>e.target</code> to identify the source) to also work for custom, application-defined events — turning a component\'s internal state changes into events a completely decoupled ancestor can listen for.',
        'The main page also mentions <code>composed: true</code> — a SEPARATE, independent option that lets a bubbling event cross shadow DOM boundaries. Setting <code>bubbles: true</code> alone does not cross shadow boundaries; both options are needed together for an event to escape a shadow root and still bubble through the light DOM above it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Custom events don't bubble by default demo</title></head>
  <body>
    <div id="parent">
      <div id="child"></div>
    </div>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const parent = document.getElementById('parent')!;
const child = document.getElementById('child')!;

let nonBubblingHeard = false;
let bubblingHeard = false;

parent.addEventListener('non-bubbling-event', () => {
  nonBubblingHeard = true;
  console.log('  [parent] heard non-bubbling-event -- this should NOT print');
});

parent.addEventListener('bubbling-event', (e) => {
  bubblingHeard = true;
  console.log('  [parent] heard bubbling-event, detail:', (e as CustomEvent).detail);
});

console.log('--- Dispatching WITHOUT bubbles: true ---');
child.dispatchEvent(new CustomEvent('non-bubbling-event', {
  detail: { source: 'child' },
  // bubbles defaults to false
}));
console.log('Did the parent hear it?', nonBubblingHeard, '<-- false: the event never left the child element');

console.log('--- Dispatching WITH bubbles: true ---');
child.dispatchEvent(new CustomEvent('bubbling-event', {
  detail: { source: 'child' },
  bubbles: true, // explicit -- this is what makes delegation possible
}));
console.log('Did the parent hear it?', bubblingHeard, '<-- true: the event traveled up to the parent, exactly like a native bubbling event would');

console.log('--- Contrast: a native click event bubbles automatically, no options needed ---');
let nativeClickHeard = false;
parent.addEventListener('click', () => {
  nativeClickHeard = true;
  console.log('  [parent] heard the native click -- no bubbles option was ever set for this one');
});
(child as HTMLElement).click();
console.log('Did the parent hear the native click?', nativeClickHeard, '<-- true, automatically, since native click events bubble by default');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The <code>non-bubbling-event</code> and <code>bubbling-event</code> are dispatched on the exact same <code>child</code> element, with an identical parent listener setup. Why does the parent hear one but not the other?',
    hint: 'Compare the CustomEventInit options passed to each new CustomEvent(...) call -- one of them explicitly sets a property the other one leaves at its default value.',
    solution: `The parent hears bubbling-event but never hears non-bubbling-event,
because only the second dispatchEvent() call explicitly passes
bubbles: true. The first one omits it entirely, so it falls back to
CustomEvent's default of bubbles: false.

A non-bubbling event only fires listeners attached DIRECTLY to the
dispatching element (child, in this case) -- it never travels up
the DOM tree at all, so parent's listener for that event type simply
never runs, regardless of how the listener itself is written.

The contrast with the native click event at the end reinforces why
this default is easy to get wrong: click bubbles automatically with
zero configuration, because MOST native DOM events default to
bubbling. CustomEvent deliberately inverts that default -- you must
opt IN to bubbling behavior every single time you create one, or
your event delegation pattern will silently fail with no error, no
warning, just a listener that never fires.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a CustomEvent dispatched on a child element automatically bubbles up to parent listeners, just like native events such as click and input do by default.',
      reality: 'CustomEvent defaults <code>bubbles</code> to <code>false</code> — the OPPOSITE default from most native DOM events — so a custom event only reaches listeners on the exact element that dispatched it unless you explicitly pass <code>bubbles: true</code>.',
    },
    {
      thought: 'if a parent listener for a custom event never fires, there is likely a bug in the listener itself — a typo in the event name, a timing issue, or the listener being attached too late.',
      reality: 'a silently non-firing custom event listener is very often simply a missing <code>bubbles: true</code> on the dispatching side — this fails with no error and no console warning of any kind, so it looks identical to a listener bug from the outside.',
    },
    {
      thought: 'setting bubbles: true on a custom event is enough to make it cross a shadow DOM boundary (e.g. from inside a web component out to the regular document).',
      reality: '<code>bubbles: true</code> alone only makes an event bubble within its own DOM tree — crossing a shadow DOM boundary additionally requires <code>composed: true</code>, a separate and independent option; both need to be set together for an event to escape a shadow root and continue bubbling through the light DOM above it.',
    },
  ];
}
