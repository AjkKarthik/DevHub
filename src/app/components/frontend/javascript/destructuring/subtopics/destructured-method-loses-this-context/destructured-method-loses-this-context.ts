import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-destructured-method-loses-this-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './destructured-method-loses-this-context.html',
  styleUrl: './destructured-method-loses-this-context.scss',
})
export class DestructuredMethodLosesThisContextSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #3\'s Own Wrong Example Actually WORKS — Only the Second Half Fails',
      points: [
        'Mistake #3\'s "wrong" code is genuinely confusing to read at a glance: <code>copy.greet()</code> is commented "works here, but:" — meaning the FIRST call actually succeeds, and only the SECOND call (after destructuring <code>greet</code> out into its own variable) actually breaks. This two-step structure is easy to misread as "destructuring always breaks methods."',
        'This subtopic isolates the exact moment the failure happens: it calls the method three distinct ways — as <code>obj.greet()</code>, then destructures <code>{ greet }</code> and calls the bare <code>greet()</code>, then calls the bound version — to make the precise before/after boundary undeniable.',
      ],
    },
    {
      heading: 'Why the Method Call Syntax Itself Determines this',
      points: [
        'Calling <code>obj.method()</code> uses "implicit binding" — JavaScript sets <code>this</code> to whatever is immediately to the LEFT of the dot at the call site. <code>obj.greet()</code> sets <code>this = obj</code> because <code>obj</code> is literally the object the method is being called ON.',
        'Destructuring <code>const &#123; greet &#125; = obj</code> copies the FUNCTION VALUE itself into a new, independent variable named <code>greet</code> — this is no different from <code>const greet = obj.greet</code>. The function is now just a bare function reference, with no object attached to its call site anymore.',
        'Calling the bare <code>greet()</code> afterward has NO object to the left of a dot at all — it falls back to JavaScript\'s DEFAULT binding, which is <code>undefined</code> in strict mode (the default for ES modules) or the global object in sloppy mode. Either way, it is NOT <code>obj</code>, which is exactly why <code>this.name</code> inside the destructured call fails.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Destructured method loses this demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const obj = {
  name: 'Alice',
  greet() { return 'Hello, ' + this.name; },
};

console.log('1. obj.greet() ->', obj.greet());

const { greet } = obj;

try {
  console.log('2. destructured greet() ->', greet());
} catch (err) {
  console.log('2. destructured greet() THREW:', (err as Error).message);
}

const boundGreet = greet.bind(obj);
console.log('3. greet.bind(obj)() ->', boundGreet());
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare all 3 results: obj.greet(), the destructured greet() called bare, and greet.bind(obj)(). Which one(s) actually fail or produce a wrong result?',
    hint: 'Ask what is immediately to the LEFT of the dot (if any) at each individual call site — that is what determines this for that specific call.',
    solution: `1. obj.greet() correctly returns "Hello, Alice" -- this call uses
implicit binding: obj is directly to the left of the dot, so this =
obj inside the method.

2. The destructured greet() call FAILS -- in a strict-mode ES module
(which this file is), it throws "Cannot read properties of
undefined (reading 'name')", because this is undefined by default
binding, and this.name on undefined throws. (In sloppy, non-module
code, this would instead silently return "Hello, undefined" -- this
being the global object, which has no name property -- an equally
wrong but non-throwing result.)

3. greet.bind(obj)() correctly returns "Hello, Alice" again --
.bind(obj) permanently attaches this = obj to a NEW function,
independent of how that new function is later called.

This confirms the exact boundary Mistake #3's own two-step wrong
example describes: destructuring itself doesn't corrupt the
function -- copy.greet() (called via the dot, right after
destructuring copy from obj) would ALSO still work fine, since it's
still a method call with copy to the left of the dot. The failure
specifically requires the EXTRA step of pulling the function itself
out into its own bare variable and calling THAT without any object
prefix at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'destructuring an object with methods (like { ...obj } spread, or accessing copy.method() on a destructured/spread copy) breaks those methods\' this binding.',
      reality: 'a method called via dot notation on ANY object reference (the original, a spread copy, a destructured object) works completely normally — the failure specifically requires extracting the FUNCTION ITSELF into its own bare variable and calling it without any object prefix.',
    },
    {
      thought: 'the this-losing bug happens at the moment of destructuring itself — const { greet } = obj already breaks something.',
      reality: 'the destructuring assignment itself does nothing wrong — greet at that point is just a normal function value; the failure only happens later, at the moment greet() is CALLED with no object prefix at the call site.',
    },
    {
      thought: 'arrow function methods avoid this problem entirely, so converting every method to an arrow function is a safe general fix.',
      reality: 'arrow function CLASS FIELDS (defined with an assignment, closing over the instance via a constructor-time closure) do avoid this specific issue, but a shorthand method like greet() {} defined directly in an object literal (as in this example) is NOT an arrow function — converting it to one requires a different object-literal syntax (greet: () => {}), which has its own different scoping trade-offs.',
    },
  ];
}
