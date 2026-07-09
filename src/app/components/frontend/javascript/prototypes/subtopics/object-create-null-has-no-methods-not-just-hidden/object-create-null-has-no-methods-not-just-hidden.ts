import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-object-create-null-no-methods-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './object-create-null-has-no-methods-not-just-hidden.html',
  styleUrl: './object-create-null-has-no-methods-not-just-hidden.scss',
})
export class ObjectCreateNullHasNoMethodsNotJustHiddenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Demo Sets toString BEFORE Testing It — This Tests the Genuinely Empty Case',
      points: [
        'The Object.create code tab\'s comparison is subtly confusing: it writes <code>dict[\'toString\'] = \'my value\'</code> FIRST, THEN checks <code>\'toString\' in dict</code> — of course that\'s true, since it was just explicitly set as an own property. The comment "but only because we set it explicitly" is correct, but the demo never shows what a <code>Object.create(null)</code> object looks like BEFORE anything is set on it.',
        'This subtopic tests the genuinely empty case: an <code>Object.create(null)</code> object that has NEVER had <code>toString</code> (or anything else) set on it — and tries to actually CALL <code>.toString()</code> as a method, to confirm it doesn\'t just "not show up" in some check, but is genuinely, functionally absent.',
      ],
    },
    {
      heading: 'Why Object.create(null) Is Different From an Empty {} Literal',
      points: [
        '<code>{}</code> (or <code>new Object()</code>) creates an object whose <code>[[Prototype]]</code> is <code>Object.prototype</code> — even though it has zero OWN properties, it inherits every method Object.prototype provides: <code>toString</code>, <code>hasOwnProperty</code>, <code>valueOf</code>, <code>isPrototypeOf</code>, and more, all found by walking one step up the (very short) prototype chain.',
        '<code>Object.create(null)</code> creates an object with <code>[[Prototype]]</code> literally set to <code>null</code> — there is NO chain to walk at all. Calling <code>dict.toString()</code> on such an object doesn\'t find a hidden or inherited method; the property lookup fails completely, exactly the same as accessing any other genuinely-undefined property, and attempting to CALL <code>undefined</code> as a function throws a real <code>TypeError</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Object.create(null) demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const normalObj = {};
const nullProtoObj = Object.create(null);

console.log('typeof normalObj.toString:', typeof normalObj.toString);
console.log('normalObj.toString() ->', normalObj.toString());

console.log('typeof nullProtoObj.toString:', typeof nullProtoObj.toString);

try {
  // @ts-ignore -- deliberately calling toString() on an object with no prototype, to observe the real failure
  console.log('nullProtoObj.toString() ->', nullProtoObj.toString());
} catch (err) {
  console.log('nullProtoObj.toString() THREW:', (err as Error).message);
}

console.log('Object.getPrototypeOf(normalObj):', Object.getPrototypeOf(normalObj));
console.log('Object.getPrototypeOf(nullProtoObj):', Object.getPrototypeOf(nullProtoObj));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare typeof normalObj.toString and typeof nullProtoObj.toString, then compare what happens when each is actually CALLED as a function.',
    hint: 'Ask whether nullProtoObj.toString is "hidden" (present but not shown) or genuinely undefined — then ask what happens when you try to call undefined as a function.',
    solution: `typeof normalObj.toString is "function" -- the plain {} object
correctly inherits the real toString function from Object.prototype,
and calling normalObj.toString() succeeds, returning "[object
Object]".

typeof nullProtoObj.toString is "undefined" -- not hidden, not
present-but-inaccessible, genuinely undefined, because there is no
prototype chain at all for the lookup to walk. Attempting to call
nullProtoObj.toString() then throws a real TypeError:
"nullProtoObj.toString is not a function" -- exactly the same error
you'd get trying to call any other undefined value as a function.

Object.getPrototypeOf(normalObj) confirms Object.prototype (a real
object with all those inherited methods); Object.getPrototypeOf
(nullProtoObj) confirms null (literally nothing to inherit from).

This confirms the deeper point the main page's own demo doesn't
quite show: Object.create(null) doesn't just avoid a NAMING
collision with "toString" as a dictionary key -- it genuinely lacks
EVERY Object.prototype method, functionally, not just "hidden from a
membership check." This is exactly why it's the safer choice for a
dictionary where arbitrary, attacker-influenced keys need to be
stored without any risk of accidentally invoking or shadowing an
inherited method.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Object.create(null) objects still have access to toString, hasOwnProperty, and other Object.prototype methods — they\'re just "hidden" from enumeration, similar to how symbol keys are hidden.',
      reality: 'Object.create(null) objects genuinely have NO prototype chain at all — every Object.prototype method is functionally absent, not just hidden from a listing. Calling one throws a real TypeError, the same as calling any other undefined value as a function.',
    },
    {
      thought: 'the main page\'s dict[\'toString\'] = \'my value\' example shows that Object.create(null) objects can\'t have a toString property at all.',
      reality: 'Object.create(null) objects can absolutely have their OWN toString property set explicitly (as the main page\'s example does) — what they lack is an INHERITED one from Object.prototype; an own property with that name works completely normally.',
    },
    {
      thought: 'using Object.create(null) is purely a defensive/security measure with no functional difference in ordinary usage, since you\'d rarely call toString() on a dictionary object anyway.',
      reality: 'the functional absence matters beyond toString specifically — code that generically expects any object to have valueOf, hasOwnProperty, or other Object.prototype methods (common in utility libraries, serialization, or debugging tools) can genuinely break when handed a null-prototype object, which is a real trade-off to be aware of, not just theoretical.',
    },
  ];
}
