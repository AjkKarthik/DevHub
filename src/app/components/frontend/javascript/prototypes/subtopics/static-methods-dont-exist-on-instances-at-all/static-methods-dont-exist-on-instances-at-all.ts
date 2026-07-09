import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-static-methods-not-on-instances-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './static-methods-dont-exist-on-instances-at-all.html',
  styleUrl: './static-methods-dont-exist-on-instances-at-all.scss',
})
export class StaticMethodsDontExistOnInstancesAtAllSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Theory Statement Is Precise — "Can\'t Be Called," Not "Shouldn\'t Be Called"',
      points: [
        'The theory section states: "Static methods are defined on the class itself, not the prototype — they can\'t be called on instances, only on the class." This is phrased as a hard capability limit, not a style guideline — but the main page never actually attempts the "wrong" call to show what happens.',
        'This subtopic runs the actual attempt: calling a static method on an instance, and (for symmetry) calling a regular instance method on the class itself — to confirm both really do throw real errors, not just produce a lint warning or "not recommended" result.',
      ],
    },
    {
      heading: 'Why Static and Instance Methods Live on Completely Different Objects',
      points: [
        'A class\'s regular (non-static) methods are attached to <code>ClassName.prototype</code> — the object every instance links to via its own internal <code>[[Prototype]]</code>. This is WHY instances can call them: <code>instance.method()</code> walks the prototype chain and finds <code>method</code> on <code>ClassName.prototype</code>.',
        'A <code>static</code> method is attached DIRECTLY to <code>ClassName</code> itself — the constructor function/object — NOT to <code>ClassName.prototype</code>. An instance\'s prototype chain is <code>instance → ClassName.prototype → Object.prototype → null</code> — <code>ClassName</code> itself never appears anywhere in that chain, so instances have no path to reach a static method at all.',
        'This is precisely symmetric to why <code>ClassName.instanceMethod()</code> also fails: the class constructor\'s own prototype chain (<code>ClassName → Function.prototype → Object.prototype → null</code>) never includes <code>ClassName.prototype</code> either — the two "sides" (class and instances) simply don\'t share a lookup path to each other\'s own methods.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Static vs instance methods demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `class Shape {
  static describe() {
    return 'Shape is a static factory helper class.';
  }

  area() {
    return 0;
  }
}

const s = new Shape();

console.log('Shape.describe() ->', Shape.describe());
console.log('s.area() ->', s.area());

try {
  // @ts-ignore -- deliberately calling a static method on an instance, to observe the real failure
  console.log('s.describe() ->', s.describe());
} catch (err) {
  console.log('s.describe() THREW:', (err as Error).message);
}

try {
  // @ts-ignore -- deliberately calling an instance method on the class itself, to observe the real failure
  console.log('Shape.area() ->', Shape.area());
} catch (err) {
  console.log('Shape.area() THREW:', (err as Error).message);
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Does s.describe() (calling the static method on an instance) actually throw? Does Shape.area() (calling the instance method on the class) also throw?',
    hint: 'Ask which object each method actually lives on, and whether the OTHER side (instance vs. class) has any prototype-chain path to reach it.',
    solution: `Shape.describe() and s.area() both succeed normally, confirming
each method works correctly when called on the side it actually
belongs to.

s.describe() THROWS: "s.describe is not a function" -- a genuine
TypeError, not a warning or a silently-returned undefined. The
instance's prototype chain (s -> Shape.prototype -> Object.prototype
-> null) never includes Shape itself, so there is no path from the
instance to the static method at all.

Shape.area() ALSO THROWS: "Shape.area is not a function" -- the
exact same category of error, for the symmetric reason. Shape's own
prototype chain (Shape -> Function.prototype -> Object.prototype ->
null) never includes Shape.prototype, so the class itself has no
path to reach its own instance methods either.

This confirms the theory's "can't be called" is literal, not a
style guideline: static methods and instance methods live on two
genuinely separate objects (the class constructor itself vs.
ClassName.prototype) with no lookup path connecting them in either
direction. This is exactly why factory-pattern static methods
(like Shape.fromCSS() in the main page's own ES6 Classes example)
must be called via the class name, never via an existing instance.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling a static method on an instance is discouraged style but still works at runtime — like calling a "private" convention-named method from outside the class.',
      reality: 'it genuinely throws a real TypeError at runtime — static methods are not reachable from an instance\'s prototype chain at all, this is a hard language-level limitation, not a style convention.',
    },
    {
      thought: 'static methods are just regular methods that happen to also be copied onto instances for convenience, in addition to living on the class.',
      reality: 'static methods exist in exactly ONE place — attached directly to the class constructor itself — there is no copy, alias, or fallback path that makes them reachable from an instance.',
    },
    {
      thought: 'the reason static methods can\'t be called on instances is arbitrary — a language design choice that could just as easily have gone the other way.',
      reality: 'it\'s a direct, mechanical consequence of the prototype chain — static methods are attached to the class object, instances only ever walk their OWN chain (which never includes the class object itself), so there genuinely is no lookup path, not an arbitrary restriction layered on top.',
    },
  ];
}
