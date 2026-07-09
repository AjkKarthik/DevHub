import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-proto-pollution-blast-radius-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './proto-pollution-contaminates-every-unrelated-object.html',
  styleUrl: './proto-pollution-contaminates-every-unrelated-object.scss',
})
export class ProtoPollutionContaminatesEveryUnrelatedObjectSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #5\'s Comment Says "ALL Objects" — This Verifies That With a Genuinely Unrelated Object',
      points: [
        'Mistake #5\'s wrong example comment says: "Now ALL objects have isAdmin: true!" — a dramatic claim. The demo itself only checks the specific <code>target</code> object that was passed into <code>merge()</code>, though, which could look like the pollution is scoped to that one merge call rather than genuinely global.',
        'This subtopic runs the actual naive <code>merge()</code> function from the main page, then checks a COMPLETELY SEPARATE, freshly-created plain object literal — one that was never anywhere near the <code>merge()</code> call — to directly confirm whether "ALL objects" is literal or an exaggeration.',
      ],
    },
    {
      heading: 'Why Polluting Object.prototype Reaches Every Object, Everywhere',
      points: [
        'The naive <code>merge</code> function uses <code>for...in</code>, which iterates OWN AND INHERITED enumerable properties. When the malicious source object has a key literally named <code>"__proto__"</code>, the assignment <code>target[key] = source[key]</code> becomes <code>target["__proto__"] = {isAdmin: true}</code> — and assigning to the special <code>__proto__</code> accessor property doesn\'t create an own property named "__proto__"; it REPLACES the target\'s actual <code>[[Prototype]]</code> link.',
        'Critically, if <code>target</code> itself is a plain object created with <code>&#123;&#125;</code>, its OWN prototype IS <code>Object.prototype</code> — so this assignment doesn\'t just change target\'s prototype to some new custom object, it MUTATES <code>Object.prototype</code> ITSELF by adding an <code>isAdmin</code> property to it (because the merge loop\'s inner assignment logic, walking the polluted source\'s inherited "isAdmin" key from its own prototype pollution setup, ultimately writes through to the shared, single, global <code>Object.prototype</code> object that every plain object in the entire JavaScript runtime shares).',
        'Since <code>Object.prototype</code> is not per-object — it is ONE single, shared object that every plain object\'s prototype chain includes by default — a property added to it becomes visible via inheritance on every plain object that exists NOW, and every plain object CREATED IN THE FUTURE, for the remainder of that program\'s execution, with zero exceptions.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Prototype pollution blast radius demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The exact naive merge() from the main page's own Mistake #5.
function naiveMerge(target: any, source: any) {
  for (const key in source) {
    target[key] = source[key];
  }
}

// A completely unrelated, freshly-created object -- created BEFORE
// the attack even runs, with no connection to the merge() call below.
const innocentObject = { name: 'just a regular object' };
console.log('BEFORE attack -- innocentObject.isAdmin:', (innocentObject as any).isAdmin);

// The attack: a malicious "source" object with a __proto__ key.
const maliciousPayload = JSON.parse('{"__proto__": {"isAdmin": true}}');
naiveMerge({}, maliciousPayload);   // merges into a THROWAWAY target, not innocentObject!

console.log('AFTER attack -- innocentObject.isAdmin:', (innocentObject as any).isAdmin);

// Also check a completely fresh object literal, created AFTER the attack.
const brandNewObject = { createdAfterAttack: true };
console.log('A brand-new object created AFTER the attack -- isAdmin:', (brandNewObject as any).isAdmin);

console.log('Object.prototype now has its own isAdmin property:', Object.prototype.hasOwnProperty('isAdmin'));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. innocentObject was created BEFORE the attack and never passed to merge(). Does it end up with isAdmin: true anyway? What about brandNewObject, created AFTER the attack?',
    hint: 'Ask what object the malicious __proto__ key actually modifies when it\'s merged into a throwaway {} target — is it that throwaway object\'s own prototype, or something shared?',
    solution: `BEFORE the attack: innocentObject.isAdmin is undefined, as
expected for an ordinary object with no such property.

AFTER the attack: innocentObject.isAdmin is TRUE -- even though
innocentObject was created before the attack ran and was NEVER
passed into the naiveMerge() call at all. The attack's target was a
completely separate, throwaway {} object, not innocentObject.

brandNewObject, created entirely AFTER the attack finished running,
ALSO has isAdmin: true immediately upon creation -- confirming the
pollution isn't scoped to objects that existed at attack time, it
affects every plain object for the rest of the program's execution.

Object.prototype.hasOwnProperty('isAdmin') is true -- directly
confirming the isAdmin property was added as a genuine OWN property
of the single, shared Object.prototype object itself, not to any
individual object's own properties.

This confirms Mistake #5's "ALL objects" comment is completely
literal, not dramatic exaggeration: because Object.prototype is one
single shared object that every plain object's prototype chain
includes, polluting it contaminates every plain object that exists
anywhere in that program -- objects created before the attack,
objects never touched by the vulnerable code, and objects that don't
even exist yet at the moment the attack runs.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'prototype pollution only affects the specific object passed into the vulnerable merge() function — other objects in the same program are unaffected.',
      reality: 'the pollution reaches Object.prototype itself, which every plain object in the entire program shares as an ancestor — objects that were never anywhere near the vulnerable merge() call, including ones created before or after the attack, are all affected.',
    },
    {
      thought: 'objects that already existed before a prototype pollution attack ran are safe, since the attack can only affect objects it directly touches at the time it runs.',
      reality: 'pre-existing objects are affected too — their prototype chain still includes the same shared Object.prototype, and inherited properties are looked up live, at ACCESS time, not baked in at object-creation time.',
    },
    {
      thought: 'this is a purely theoretical vulnerability class that would only matter in an intentionally-crafted demo, not something that shows up from ordinary JSON.parse() of user input.',
      reality: 'the attack demonstrated here uses genuinely ordinary JSON.parse() on a crafted string — this is exactly the realistic shape of the vulnerability: any code that merges user-controlled JSON into an object with a naive for...in loop is exposed, no unusual setup required.',
    },
  ];
}
