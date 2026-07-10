import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-describe-class-decorator-unnamed-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-describes-class-decorator-returns-an-unnamed-class.html',
  styleUrl: './testing-that-describes-class-decorator-returns-an-unnamed-class.scss',
})
export class TestingThatDescribesClassDecoratorReturnsAnUnnamedClassSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Class-Replacing Decorator',
      points: [
        'The TC39 Class &amp; Method Decorators tab defines <code>function describe(description: string) { return function&lt;T&gt;(target: T, _context: ClassDecoratorContext) { return class extends target { static description = description; }; }; } @describe(\'A class representing a bank account\') class BankAccount { ... }</code>.',
        'The <code>const acc = new BankAccount(100);</code> line right after it works exactly as shown — but it constructs an instance of the ANONYMOUS class the decorator returned, not literally the original <code>class BankAccount</code> declaration. This subtopic tests whether that returned class still correctly REPORTS its name as "BankAccount" anywhere runtime code might check it.',
      ],
    },
    {
      heading: 'Why the Replacement Class\'s Own .name Can Differ From the Binding',
      points: [
        'Per the TC39 decorators proposal, when a class decorator returns a new class, that returned class becomes what the variable <code>BankAccount</code> refers to going forward — but the class\'s own internal <code>.name</code> property is a SEPARATE thing, derived from how the class EXPRESSION itself was written and evaluated, not from the name of the binding it eventually gets assigned to.',
        '<code>class extends target { static description = description; }</code> is an anonymous class expression, written and evaluated INSIDE the decorator function, several calls removed from any <code>const X = ...</code> or <code>class X ...</code> syntax that would normally trigger JavaScript\'s "infer the name from the assignment target" rule (NamedEvaluation). Because of that, the returned class\'s own <code>.name</code> is <code>""</code> (empty string) — NOT <code>"BankAccount"</code>.',
        'This matters anywhere code reads <code>.name</code> or <code>.constructor.name</code> at runtime — error messages, logging, debugging tools, and some serialization or reflection-based libraries all commonly use <code>.constructor.name</code> to identify an object\'s type by a human-readable string. All of those would silently see an empty string instead of "BankAccount" for any instance built through this decorator.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Class decorators and the .name property</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own describe decorator and BankAccount class, unchanged
function describe(description: string) {
  return function<T extends new (...args: unknown[]) => unknown>(
    target: T,
    _context: ClassDecoratorContext
  ) {
    return class extends target {
      static description = description;
    };
  };
}

@describe('A class representing a bank account')
class BankAccount {
  constructor(private balance: number) {}
  getBalance(): number { return this.balance; }
}

const acc = new BankAccount(100);
console.log('acc instanceof BankAccount:', acc instanceof BankAccount); // still true -- prototype chain intact

// Does the CLASS itself still report its name correctly?
console.log('BankAccount.name:', JSON.stringify(BankAccount.name));
console.log('acc.constructor.name:', JSON.stringify(acc.constructor.name));

// Compare against an UNDECORATED class for a baseline
class PlainAccount {
  constructor(private balance: number) {}
}
const plain = new PlainAccount(50);
console.log('PlainAccount.name:', JSON.stringify(PlainAccount.name));
console.log('plain.constructor.name:', JSON.stringify(plain.constructor.name));

// A realistic consequence: an error-reporting helper that uses constructor.name
function describeError(instance: object): string {
  return \`Unexpected state in \${instance.constructor.name || '(unnamed class)'}\`;
}
console.log(describeError(acc));
console.log(describeError(plain));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Run the demo and compare BankAccount.name against PlainAccount.name. Then modify the describe decorator to explicitly set a name — research and add `Object.defineProperty(returnedClass, \'name\', { value: target.name })` inside it, and confirm the fix.',
    hint: 'JavaScript class .name is a configurable own property on the class function/object -- it can be explicitly overwritten with Object.defineProperty even though it is not writable via simple assignment.',
    solution: `BankAccount.name logs "" (empty string) and acc.constructor.name
also logs "" -- confirming the decorator-returned anonymous class
never picked up the "BankAccount" name. PlainAccount.name correctly
logs "PlainAccount" for comparison. describeError(acc) prints
"Unexpected state in (unnamed class)" while describeError(plain)
correctly prints "Unexpected state in PlainAccount".

The fix: inside the decorator, after creating the replacement class,
explicitly copy the name over:

return function(target, _context) {
  const replacement = class extends target {
    static description = description;
  };
  Object.defineProperty(replacement, 'name', { value: target.name });
  return replacement;
};

.name is defined as a non-writable but CONFIGURABLE property on
functions and classes, so Object.defineProperty can still set it
even though a plain \`replacement.name = target.name\` assignment
would silently fail (or throw in strict mode).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because `acc instanceof BankAccount` correctly returns `true` after the `@describe(...)` decorator runs, the resulting class is functionally identical to the original `BankAccount` in every observable way, including its name.',
      reality: '`instanceof` only checks the prototype chain, which the decorator correctly preserves by extending `target` — but the class\'s own `.name` property is unrelated to the prototype chain, and the anonymous `class extends target { ... }` expression never inherits "BankAccount" as its name.',
    },
    {
      thought: 'JavaScript automatically infers a sensible name for any class that ends up bound to a variable named `BankAccount`, regardless of how many function calls or indirection separate the class expression from that binding.',
      reality: 'JavaScript\'s NamedEvaluation rule only applies when a class or function EXPRESSION is the direct, immediate value of specific syntactic forms (like `const X = class {}`) — a class returned from deep inside a decorator factory function does not qualify, so it keeps its literal (empty, for an anonymous expression) name.',
    },
    {
      thought: 'a missing or incorrect `.name` on a decorated class is purely a cosmetic issue with no real consequences.',
      reality: 'plenty of ordinary code — error messages, logging utilities, debugging tools, some serialization/reflection libraries — reads `.constructor.name` to identify an object\'s type by a human-readable string, and all of it silently degrades to an empty or unhelpful value for instances built through a name-losing class decorator.',
    },
  ];
}
