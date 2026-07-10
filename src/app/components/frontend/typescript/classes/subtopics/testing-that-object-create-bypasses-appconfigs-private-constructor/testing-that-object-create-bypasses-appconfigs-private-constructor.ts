import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-object-create-bypasses-private-ctor-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-object-create-bypasses-appconfigs-private-constructor.html',
  styleUrl: './testing-that-object-create-bypasses-appconfigs-private-constructor.scss',
})
export class TestingThatObjectCreateBypassesAppconfigsPrivateConstructorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Singleton\'s Private Constructor',
      points: [
        'The Static Members &amp; Mixins tab defines <code>class AppConfig { private static _instance: AppConfig | null = null; private constructor(public readonly env: string) {} static getInstance(): AppConfig { ... } }</code> — the <code>private constructor</code> is meant to force every caller through <code>getInstance()</code>, guaranteeing a single shared instance.',
        'Common Mistake #1, elsewhere on this page, already establishes that TypeScript <code>private</code> on FIELDS is erased at compile time. This subtopic tests whether the exact same erasure applies to a <code>private</code> CONSTRUCTOR too — and what happens if a caller reaches for a completely different, cast-free way to create an instance: <code>Object.create()</code>.',
      ],
    },
    {
      heading: 'Why Object.create Sidesteps the Constructor Entirely',
      points: [
        '<code>Object.create(AppConfig.prototype)</code> is a JavaScript-level operation that creates a new object whose prototype chain is <code>AppConfig.prototype</code> — it does this WITHOUT ever calling the <code>AppConfig</code> function/constructor. This is standard, well-defined ECMAScript behavior, unrelated to any privacy mechanism.',
        'TypeScript\'s <code>private constructor</code> check only intercepts the <code>new AppConfig(...)</code> syntax specifically — it has no way to restrict a call to the unrelated built-in <code>Object.create</code> function, which isn\'t "constructing" in the sense TypeScript\'s privacy analysis understands.',
        'The result is worse than simply "another instance exists": because the constructor never ran, the object created this way has NO <code>env</code> own property at all — the parameter property <code>public readonly env: string</code> is only ever assigned inside the constructor body, which was completely skipped. Accessing <code>.env</code> on this bypassed instance returns <code>undefined</code>, silently, with no error — a malformed "instance" masquerading as a real one.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>private constructor and Object.create</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own AppConfig singleton, unchanged
class AppConfig {
  private static _instance: AppConfig | null = null;
  private constructor(public readonly env: string) {}

  static getInstance(): AppConfig {
    return (AppConfig._instance ??= new AppConfig('production'));
  }
}

// The intended path -- correctly returns the same shared instance every time
const cfg1 = AppConfig.getInstance();
const cfg2 = AppConfig.getInstance();
console.log('same instance via getInstance():', cfg1 === cfg2); // true
console.log('cfg1.env:', cfg1.env); // 'production'

// new AppConfig('dev');
// Uncomment above -- TypeScript correctly flags this at compile time:
// "Constructor of class 'AppConfig' is private and only accessible
// within the class declaration."

// Bypassing the constructor entirely with Object.create -- no 'new',
// no cast, nothing TypeScript's private-constructor check watches for
const bypassed = Object.create(AppConfig.prototype) as AppConfig;
console.log('bypassed instanceof AppConfig:', bypassed instanceof AppConfig); // true!
console.log('bypassed === cfg1 (the real singleton):', bypassed === cfg1);    // false -- a SECOND instance
console.log('bypassed.env:', bypassed.env); // what does this print?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Predict what `bypassed.env` logs before running the demo. Then explain why it differs from cfg1.env, given that both objects report `instanceof AppConfig` as true.',
    hint: 'Object.create only sets up the prototype chain -- the parameter property env: string is assigned by code INSIDE the constructor body, which Object.create never runs.',
    solution: `bypassed.env logs undefined -- the constructor body (the only place
that ever assigns env, via the parameter property shorthand) never
ran for this object. bypassed instanceof AppConfig is still true,
because instanceof only checks the prototype chain, and
Object.create correctly wired that up -- but the object is
otherwise an empty shell wearing AppConfig's "instanceof badge".

This demonstrates two separate things at once: first, that private
constructors, like private fields, provide zero runtime enforcement
(the exact same erasure Common Mistake #1 already shows for
fields) -- and second, that the SPECIFIC bypass here (Object.create)
is arguably worse than a simple "second instance" problem, because
it produces a genuinely malformed object that never ran any of the
class's own initialization logic.

Runtime-enforced singletons in JavaScript generally rely on module
scope (a private, non-exported variable holding the instance) rather
than a private constructor, precisely because module-level
encapsulation has no equivalent bypass.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a `private constructor` genuinely prevents any code, anywhere, from creating a second instance of `AppConfig` outside of `getInstance()`.',
      reality: 'TypeScript\'s private-constructor check only intercepts the `new AppConfig(...)` syntax — `Object.create(AppConfig.prototype)` sidesteps it entirely using a completely different, constructor-independent mechanism, with no cast or workaround needed.',
    },
    {
      thought: 'if a bypass like `Object.create` does manage to create an extra "instance", it would at least be a properly-initialized object, just an unwanted extra one.',
      reality: '`Object.create` never runs the constructor body at all — parameter properties like `env` are never assigned, leaving the bypassed object in a malformed, only-partially-initialized state that still reports `instanceof AppConfig` as true.',
    },
    {
      thought: 'this is a completely different, unrelated issue from the "TypeScript private is erased at compile time" lesson already covered elsewhere on this page for FIELDS.',
      reality: 'it is the exact same underlying erasure, just applied to constructors instead of fields — TypeScript privacy checks exist only in the type checker, not in the emitted JavaScript, regardless of which class member they\'re attached to.',
    },
  ];
}
