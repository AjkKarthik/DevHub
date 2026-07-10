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
  selector: 'app-mixin-breaks-instanceof-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './spreading-a-prototype-in-a-mixin-breaks-instanceof.html',
  styleUrl: './spreading-a-prototype-in-a-mixin-breaks-instanceof.scss',
})
export class SpreadingAPrototypeInAMixinBreaksInstanceofSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #2, Proven With a Broken instanceof Check',
      points: [
        'The main page\'s Mistake #2 warns: replacing <code>target.prototype</code> with a spread (<code>{ ...target.prototype, ...mixin }</code>) "breaks the prototype chain" — this subtopic actually checks <code>instanceof</code> before and after applying a mixin both ways, proving the spread version genuinely breaks it while <code>Object.assign</code> does not.',
        'A class\'s <code>prototype</code> property is not just a bag of methods — it is a specific OBJECT that every instance created with <code>new</code> is secretly linked to via its internal <code>[[Prototype]]</code>. <code>instanceof</code> works by checking whether that EXACT prototype object appears anywhere in an instance\'s prototype chain — replacing the prototype with a brand new object (via spread) severs that link entirely for every instance already created before the replacement.',
      ],
    },
    {
      heading: 'Why Object.assign() Is Safe But Spread Isn\'t',
      points: [
        '<code>Object.assign(target.prototype, mixin)</code> MUTATES the EXISTING prototype object in place — it copies the mixin\'s methods onto the same object reference that already has <code>constructor</code> and any inherited methods, and that every existing/future instance is already (or will be) linked to. The object\'s IDENTITY never changes, only its contents grow.',
        '<code>target.prototype = { ...target.prototype, ...mixin }</code> creates an ENTIRELY NEW plain object literal via spread, then reassigns the class\'s <code>prototype</code> property to point at it. Any instance created BEFORE this reassignment is still linked to the OLD prototype object — the class\'s prototype pointer moved, but existing instances\' internal links did not follow it.',
        'This also silently loses the prototype\'s own <code>constructor</code> property (which normally points back to the class itself) unless it\'s manually re-added — a plain object literal spread of a prototype does NOT automatically preserve this special, non-enumerable-by-default linkage the same way a real prototype object does.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Mixin breaks instanceof demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const Serializable = {
  toJSON() { return JSON.stringify(this); },
};

console.log('--- BROKEN: replacing prototype with a spread ---');
class BrokenUser {
  constructor(public name: string) {}
  greet() { return 'Hi, ' + this.name; }
}

const brokenInstanceBefore = new BrokenUser('Alice');
console.log('brokenInstanceBefore instanceof BrokenUser (BEFORE mixin applied):', brokenInstanceBefore instanceof BrokenUser);

// The broken pattern: spread creates a BRAND NEW object, then reassigns prototype
(BrokenUser as any).prototype = { ...BrokenUser.prototype, ...Serializable };

console.log('brokenInstanceBefore instanceof BrokenUser (AFTER mixin applied):', brokenInstanceBefore instanceof BrokenUser, '<-- still linked to the OLD prototype object');

const brokenInstanceAfter = new BrokenUser('Bob');
console.log('brokenInstanceAfter instanceof BrokenUser (created AFTER mixin applied):', brokenInstanceAfter instanceof BrokenUser);
try {
  console.log('brokenInstanceAfter.greet():', (brokenInstanceAfter as any).greet());
} catch (e) {
  console.log('brokenInstanceAfter.greet() THREW:', (e as Error).message, '<-- greet() was lost! The new prototype object never had it');
}

console.log('--- FIXED: Object.assign mutates the EXISTING prototype ---');
class FixedUser {
  constructor(public name: string) {}
  greet() { return 'Hi, ' + this.name; }
}

const fixedInstanceBefore = new FixedUser('Carol');
console.log('fixedInstanceBefore instanceof FixedUser (BEFORE mixin applied):', fixedInstanceBefore instanceof FixedUser);

// The correct pattern: mutate the SAME prototype object in place
Object.assign(FixedUser.prototype, Serializable);

console.log('fixedInstanceBefore instanceof FixedUser (AFTER mixin applied):', fixedInstanceBefore instanceof FixedUser, '<-- still true! same prototype object, just extended');
console.log('fixedInstanceBefore.greet():', fixedInstanceBefore.greet(), '<-- still works');
console.log('fixedInstanceBefore.toJSON():', (fixedInstanceBefore as any).toJSON(), '<-- mixin method works too');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: '<code>brokenInstanceAfter</code> is created AFTER the spread-based mixin is applied to <code>BrokenUser</code>. Does calling <code>.greet()</code> on it work, even though <code>greet()</code> was defined on the ORIGINAL <code>BrokenUser</code> class?',
    hint: 'Ask what exactly the spread { ...BrokenUser.prototype, ...Serializable } actually copies -- does spreading a prototype object capture EVERY method defined via class syntax, the same way Object.assign mutating the real prototype would?',
    solution: `No -- brokenInstanceAfter.greet() throws a TypeError, even though
greet() was clearly defined in the BrokenUser class body. This is
the deeper trap in the spread-based mixin bug: it doesn't just break
instanceof for OLD instances, it can silently lose the class's OWN
original methods for NEW instances too.

Here's why: { ...BrokenUser.prototype } only spreads the prototype
object's OWN ENUMERABLE properties. Methods defined via class syntax
(like greet()) are added to the prototype as NON-ENUMERABLE by
default -- so a spread of BrokenUser.prototype silently skips greet()
entirely, along with the crucial constructor link. The resulting
plain object only has Serializable's toJSON() method, nothing from
the original class body.

instanceof also breaks in the direction the main page describes:
brokenInstanceBefore (created before the reassignment) stays linked
to the ORIGINAL prototype object via its internal [[Prototype]] --
reassigning BrokenUser.prototype to a NEW object afterward has zero
effect on instances that already exist, so instanceof still (weirdly)
returns true for it, but ANY new instance created after the
reassignment is instanceof-checked against the NEW (broken, methodless)
prototype object instead.

FixedUser avoids both problems entirely: Object.assign(FixedUser.
prototype, Serializable) mutates the EXISTING prototype object in
place -- its identity never changes, so instanceof stays correct for
every instance (old and new), and every original class method
(including non-enumerable ones like greet()) survives untouched,
since nothing about the original prototype object was ever replaced.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'spreading a class\'s prototype ({ ...MyClass.prototype }) captures every method defined in that class, the same way Object.assign onto the real prototype object would.',
      reality: 'a spread only copies a prototype object\'s OWN ENUMERABLE properties — methods defined via class syntax are non-enumerable by default, so spreading a prototype silently drops them, along with the crucial constructor back-reference.',
    },
    {
      thought: 'reassigning a class\'s prototype property to a new object retroactively updates every existing instance of that class to use the new prototype.',
      reality: 'existing instances keep their internal [[Prototype]] link to whatever object was the prototype AT THE TIME they were constructed — reassigning MyClass.prototype afterward only affects instances created AFTER the reassignment, not ones that already exist.',
    },
    {
      thought: 'the choice between Object.assign(prototype, mixin) and prototype = { ...prototype, ...mixin } is mostly a stylistic preference — both achieve the same end result of adding the mixin\'s methods to the class.',
      reality: 'these are fundamentally different operations — Object.assign MUTATES the existing prototype object in place (safe, preserves identity and non-enumerable methods), while the spread version CREATES A NEW OBJECT and reassigns the pointer (breaks instanceof for existing instances and silently drops non-enumerable methods like class-defined functions).',
    },
  ];
}
