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
  selector: 'app-nested-proxy-referential-equality-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './new-proxy-per-nested-get-breaks-referential-equality.html',
  styleUrl: './new-proxy-per-nested-get-breaks-referential-equality.scss',
})
export class CreatingANewProxyWrapperOnEveryNestedPropertyAccessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #3, Proven With a Real Equality Check',
      points: [
        'The main page\'s Mistake #3 states plainly: creating a new <code>Proxy</code> on every nested <code>get</code> "Creates a NEW proxy object every time — breaks referential equality!" This subtopic reads the SAME nested property TWICE from the SAME reactive proxy and directly checks <code>===</code> between the two results, proving they are genuinely different objects despite wrapping the identical underlying data.',
        'A naive reactive <code>get</code> trap that does <code>return new Proxy(val, handler)</code> every time a nested object property is READ creates a brand new wrapper object on EVERY SINGLE ACCESS — even two back-to-back reads of the exact same property produce two objects that <code>===</code> considers different, since each is a genuinely distinct <code>Proxy</code> instance wrapping the same target.',
      ],
    },
    {
      heading: 'Why Broken Referential Equality Is a Real, Practical Bug',
      points: [
        'Referential equality (<code>===</code>) is exactly what frameworks like React use to decide whether a value has "changed" and a component needs to re-render — if <code>state.user</code> returns a NEW proxy instance on every access, a component comparing <code>prevUser === nextUser</code> will ALWAYS see them as different, even when the underlying data hasn\'t actually changed at all, triggering unnecessary re-renders or breaking memoization entirely.',
        'The main page\'s fix uses a <code>WeakMap</code> keyed by the TARGET object (not the proxy) to cache each nested proxy the first time it\'s created: <code>if (!proxyCache.has(val)) proxyCache.set(val, new Proxy(val, handler))</code>. Since the underlying target object <code>val</code> is a stable reference (Reflect.get returns the same target object every time, even before wrapping), the <code>WeakMap</code> lookup reliably returns the SAME cached proxy on every subsequent access to that same nested property.',
        'A <code>WeakMap</code> specifically (not a regular <code>Map</code>) is the correct choice here because it doesn\'t prevent the target objects from being garbage collected — if the underlying nested object is no longer referenced anywhere else in the application, both it AND its cached proxy entry can be freed, avoiding a memory leak that a regular <code>Map</code>\'s strong references would otherwise cause.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Nested proxy referential equality demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- BROKEN: a new proxy is created on EVERY nested get ---');
function reactiveBroken(obj: any): any {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (val && typeof val === 'object') {
        return reactiveBroken(val); // new Proxy every single time!
      }
      return val;
    },
  });
}

const stateBroken = reactiveBroken({ user: { name: 'Alice' } });
const userRead1 = stateBroken.user;
const userRead2 = stateBroken.user; // reading the EXACT same property again
console.log('userRead1 === userRead2 ?', userRead1 === userRead2, '<-- should be the same data, but are they the SAME object?');
console.log('but the underlying data IS identical:', userRead1.name === userRead2.name);

console.log('--- FIXED: cache nested proxies in a WeakMap, keyed by target ---');
const proxyCache = new WeakMap<object, any>();
function reactiveFixed(obj: any): any {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (!val || typeof val !== 'object') return val;
      if (!proxyCache.has(val)) {
        proxyCache.set(val, reactiveFixed(val));
      }
      return proxyCache.get(val); // same proxy instance every time
    },
  });
}

const stateFixed = reactiveFixed({ user: { name: 'Bob' } });
const userRead3 = stateFixed.user;
const userRead4 = stateFixed.user; // reading the same property again
console.log('userRead3 === userRead4 ?', userRead3 === userRead4, '<-- now genuinely the SAME cached proxy instance');

console.log('--- Why this matters: a naive "did anything change" check ---');
function didUserChange(prevUser: any, nextUser: any) {
  return prevUser !== nextUser;
}
console.log('BROKEN version reports a change even with no real update:', didUserChange(userRead1, userRead2));
console.log('FIXED version correctly reports no change:', didUserChange(userRead3, userRead4));`,
    },
  ];

  exercise: TryItExercise = {
    prompt: '<code>userRead1</code> and <code>userRead2</code> both come from reading <code>stateBroken.user</code> — the exact same property, read twice, with no mutation in between. Does <code>userRead1 === userRead2</code> evaluate to true?',
    hint: 'Ask what the broken get trap actually DOES every single time it\'s invoked -- does it look up and return some cached, stable wrapper, or does it construct something brand new on every single call?',
    solution: `No -- userRead1 === userRead2 evaluates to false, even though both
reads happened back to back with zero mutation of the underlying
data, and even though userRead1.name === userRead2.name IS true
(the underlying VALUES are identical).

This is because the broken get trap's line "return reactiveBroken
(val)" executes a fresh "new Proxy(val, handler)" call every single
time the get trap runs -- there's no caching or memoization of any
kind. Two separate calls to the SAME get trap for the SAME property
produce two structurally-identical-but-distinct Proxy objects, and
=== always compares object identity, never structural content.

The fixed version breaks this cycle with the WeakMap cache: the
FIRST time state.user is read, a new proxy is created AND stored in
proxyCache, keyed by the underlying target object (val, the plain
{ name: 'Bob' } object -- not the proxy itself). Every SUBSEQUENT
read of the same property first checks proxyCache.has(val) --  since
val is the same stable target object reference each time (Reflect.get
always returns the same underlying object), the cache lookup succeeds
and returns the SAME previously-created proxy instance, making
userRead3 === userRead4 genuinely true.

The final didUserChange() check demonstrates the practical
consequence directly: code that relies on === to detect "did this
value actually change" -- exactly what React and other frameworks do
internally -- is fooled by the broken version into reporting a change
that never actually happened.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'reading the same property of a reactive proxy object twice in a row, with no mutation in between, always returns the exact same object reference — that\'s just how property access works.',
      reality: 'this is only true if the get trap specifically caches and reuses proxy wrappers — a naive reactive implementation that creates "new Proxy(val, handler)" fresh on every get call produces a genuinely DIFFERENT object reference on each read, even for the exact same underlying data.',
    },
    {
      thought: 'as long as the underlying data inside two proxy objects is identical (same property values), any code checking for equality between them will correctly treat them as "the same," regardless of which specific equality check is used.',
      reality: '=== compares object IDENTITY, not content — two structurally-identical-but-distinct Proxy wrapper objects are NEVER === to each other, no matter how identical their underlying data is; only a deep-equality check (comparing actual property values) would treat them as equal.',
    },
    {
      thought: 'caching nested proxies in a regular Map (keyed by the target object) would work just as well as using a WeakMap for this purpose.',
      reality: 'a regular Map holds a STRONG reference to its keys, which would prevent the underlying target objects (and their cached proxies) from ever being garbage collected even after nothing else in the app references them — a WeakMap specifically avoids this memory leak by holding only weak references to its keys.',
    },
  ];
}
