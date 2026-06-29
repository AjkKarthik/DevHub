import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-js-hoisting',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './hoisting.html',
  styleUrl: './hoisting.scss',
})
export class JsHoisting {
  theory: TheoryPoint[] = [
    {
      heading: 'What is Hoisting?',
      points: [
        'Hoisting is JavaScript\'s behavior of moving declarations to the top of their scope before code executes. This happens during the compilation/parse phase, not at runtime.',
        'Only declarations are hoisted — not initializations. <code>var x = 5</code> has its declaration (<code>var x</code>) hoisted but the assignment (<code>= 5</code>) stays in place.',
        'The term "hoisting" is a mental model — the engine doesn\'t physically move code. Instead, during compilation it registers all declarations in the scope first, then executes the code top-to-bottom.',
        'Understanding hoisting explains why you can call a function declaration before it appears in the code, but not a function expression or arrow function stored in a variable.',
      ]
    },
    {
      heading: 'var Hoisting',
      points: [
        '<code>var</code> declarations are hoisted to the top of their containing function (or global scope) and initialized to <code>undefined</code>. This is why accessing a <code>var</code> before its declaration returns <code>undefined</code> instead of throwing.',
        'This behavior is a common source of bugs: code that seems to reference a variable before it exists silently gets <code>undefined</code> instead of an error, masking mistakes.',
        '<code>var</code> is also function-scoped, so a <code>var</code> declared inside an <code>if</code> block is hoisted to the enclosing function — it leaks out of the block.',
        'The hoisted <code>var</code> in a <code>for</code> loop (<code>for (var i ...)</code>) means all iterations share one <code>i</code> in the function scope — the root of the classic closure loop bug.',
      ]
    },
    {
      heading: 'Function Declaration Hoisting',
      points: [
        'Function <em>declarations</em> are fully hoisted — both the name and the body. You can call a function declaration anywhere in its scope, even before it appears in the source.',
        'This is different from var: var is hoisted as <code>undefined</code>; function declarations are hoisted with their entire body intact.',
        'Function <em>expressions</em> and arrow functions assigned to variables follow the rules of their declaration keyword (<code>var</code>/<code>let</code>/<code>const</code>). They are NOT fully hoisted.',
        'Function declarations inside blocks (<code>if</code>, <code>for</code>) behave inconsistently across environments — avoid them. Use <code>const fn = () => {}</code> inside blocks instead.',
      ]
    },
    {
      heading: 'Temporal Dead Zone (TDZ)',
      points: [
        'The Temporal Dead Zone is the period from the start of a block scope until the <code>let</code>/<code>const</code> declaration is reached in code execution. During TDZ, accessing the variable throws a <code>ReferenceError</code>.',
        '<code>let</code> and <code>const</code> ARE hoisted — the engine knows they exist — but they are not initialized. The TDZ is the gap between "hoisted but uninitialized" and "initialized by the declaration."',
        'The TDZ is intentional: it prevents the class of bugs that <code>var</code> enables (silent <code>undefined</code> instead of a clear error). A <code>ReferenceError</code> in the TDZ is a clear signal that code is out of order.',
        'Class declarations also have a TDZ — you can\'t instantiate a class before its declaration, even though classes are "hoisted."',
      ]
    },
    {
      heading: 'Practical Rules',
      points: [
        'Always declare variables before use. With <code>let</code>/<code>const</code> this is enforced by the TDZ; with <code>var</code> it\'s convention.',
        'Prefer <code>const</code> > <code>let</code> > <code>var</code>. Avoid <code>var</code> entirely in new code — its hoisting behavior is surprising and error-prone.',
        'Function declarations are fine to call before their definition in many codebases — it\'s idiomatic to put helper functions at the bottom of a file. But be consistent with your team.',
        'In TypeScript, the compiler catches TDZ violations at build time, removing the surprise. In plain JS you rely on <code>ReferenceError</code> at runtime.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'var hoisting',       type: 'keyword', desc: 'Declaration hoisted to function scope, initialized as undefined' },
    { name: 'let/const hoisting', type: 'keyword', desc: 'Hoisted but NOT initialized — accessing before declaration = ReferenceError (TDZ)' },
    { name: 'Function declaration hoisting', type: 'keyword', desc: 'Fully hoisted (name + body) — can call before it appears in code' },
    { name: 'Function expression', type: 'keyword', desc: 'Follows var/let/const rules — NOT fully hoisted' },
    { name: 'TDZ',               type: 'keyword', desc: 'Temporal Dead Zone — block start to let/const declaration; ReferenceError if accessed' },
    { name: 'class hoisting',    type: 'keyword', desc: 'Class declarations have TDZ — cannot instantiate before declaration' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'var Hoisting',
      language: 'typescript',
      code: `// ── var hoisting ──────────────────────────────────────────────────────
console.log(x);   // undefined (NOT ReferenceError)
var x = 5;
console.log(x);   // 5

// What the engine sees (conceptually):
var x;            // hoisted declaration
console.log(x);   // undefined
x = 5;            // stays in place
console.log(x);   // 5

// ── var leaks out of blocks ───────────────────────────────────────────
if (true) {
  var leaked = "I escaped!";
}
console.log(leaked);  // "I escaped!" — var is function-scoped

// ── let does NOT leak ─────────────────────────────────────────────────
if (true) {
  let blockScoped = "I stay here";
}
// console.log(blockScoped);  // ReferenceError

// ── var in function scope ─────────────────────────────────────────────
function test() {
  console.log(y);  // undefined — hoisted within function
  var y = 10;
  console.log(y);  // 10
}
test();
// console.log(y);  // ReferenceError — var stays in function scope`,
    },
    {
      label: 'Function Hoisting',
      language: 'typescript',
      code: `// ── Function DECLARATION — fully hoisted ─────────────────────────────
greet("Alice");    // "Hello, Alice!" — works before the declaration

function greet(name) {
  return \`Hello, \${name}!\`;
}

// ── Function EXPRESSION — not fully hoisted ───────────────────────────
// sayHi("Bob");  // TypeError: sayHi is not a function
//                // (var sayHi is hoisted as undefined, not as the function)

var sayHi = function(name) {
  return \`Hi, \${name}!\`;
};
sayHi("Bob");    // "Hi, Bob!" — works after the assignment

// ── Arrow function expression ─────────────────────────────────────────
// sayBye("Carol");  // ReferenceError (const in TDZ) or TypeError (var)

const sayBye = (name) => \`Bye, \${name}!\`;
sayBye("Carol");  // "Bye, Carol!" — only works after assignment

// ── Class declaration — has TDZ ───────────────────────────────────────
// const p = new Person("Dan");  // ReferenceError — TDZ!

class Person {
  constructor(name) { this.name = name; }
}
const p = new Person("Dan");  // works after declaration`,
    },
    {
      label: 'TDZ Examples',
      language: 'typescript',
      code: `// ── Temporal Dead Zone ────────────────────────────────────────────────
{
  // TDZ starts for 'value'
  // console.log(value);  // ReferenceError: Cannot access 'value' before initialization
  let value = 42;          // TDZ ends, value is initialized
  console.log(value);      // 42
}

// ── TDZ with const ────────────────────────────────────────────────────
function initConfig() {
  // console.log(config);  // ReferenceError
  const config = { debug: false };
  return config;
}

// ── typeof in TDZ (unlike undeclared variables) ───────────────────────
{
  // typeof undeclaredVar  → "undefined" (safe, no error)
  // typeof letVar         → ReferenceError (TDZ!!)
  let letVar = 1;
}

// ── Why TDZ exists: catching the var bug ─────────────────────────────
// With var (buggy):
function varBug() {
  console.log(x);  // undefined — hidden bug
  if (false) {
    var x = 5;     // never runs but var is hoisted anyway!
  }
}
varBug();

// With let (safe):
function letSafe() {
  // console.log(x);  // ReferenceError — explicit error, not silent
  if (false) {
    let x = 5;
  }
}`,
    },
    {
      label: 'Hoisting Order',
      language: 'typescript',
      code: `// ── What gets hoisted first? ──────────────────────────────────────────
// Order: function declarations > variable declarations

var double = "I'm a string";

function double(x) { return x * 2; }

// Due to hoisting order, the function wins:
// var double is declared but the function declaration takes precedence
// THEN the assignment "I'm a string" runs
console.log(double);  // "I'm a string" (var assignment wins at runtime)
// console.log(double(5)); // TypeError — double is not a function anymore

// ── Real-world: initializers, not declarations ─────────────────────────
// Good practice: declare all vars at top of function
function processData(data) {
  let result;      // declare first
  let total = 0;

  for (let i = 0; i < data.length; i++) {
    total += data[i];
  }

  result = total / data.length;
  return result;
}

// ── let/const in switch blocks ────────────────────────────────────────
switch (true) {
  case true:
    let x = 1;  // Works, but shared across all cases in the switch block
    break;
  case false:
    // let x = 2;  // SyntaxError: already declared! (same block scope)
    break;
}

// Fix: wrap each case in its own block
switch (true) {
  case true: {
    let x = 1;  // own scope
    break;
  }
  case false: {
    let x = 2;  // own scope — no conflict
    break;
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Relying on var hoisting for "undefined" default',
      wrong: `function render() {
  console.log(title);  // undefined — but this hides a bug
  if (condition) { var title = "Hello"; }
}`,
      right: `function render() {
  const title = condition ? "Hello" : undefined;
  console.log(title);  // explicit
}`,
      explanation: 'var hoisting gives you silent undefined instead of an error. This masks logic bugs. Declare variables at the point you have the value, using const/let.',
    },
    {
      title: 'Calling function expressions before assignment',
      wrong: `const result = calculate(5);  // TypeError: calculate is not a function
const calculate = (n) => n * 2;`,
      right: `const calculate = (n) => n * 2;
const result = calculate(5);  // 10`,
      explanation: 'Arrow functions and function expressions stored in const/let are in the TDZ until their declaration. Unlike function declarations, they cannot be called before the assignment.',
    },
    {
      title: 'TDZ with typeof (not the same as undeclared)',
      wrong: `if (typeof myVar !== 'undefined') {
  // thinking this is safe...
  console.log(myVar.value);
}
let myVar = { value: 42 };  // but myVar is in TDZ above!`,
      right: `// typeof of a let/const in TDZ throws ReferenceError — not "undefined"
// Only typeof of truly undeclared variables returns "undefined"
let myVar = { value: 42 };
if (typeof myVar !== 'undefined') {
  console.log(myVar.value);
}`,
      explanation: 'The "typeof is safe for undeclared variables" rule does NOT apply to let/const in TDZ. typeof of a TDZ variable throws a ReferenceError.',
    },
    {
      title: 'Function declarations inside blocks',
      wrong: `if (condition) {
  function helper() { return 1; }  // behavior varies across environments
}
helper();  // may or may not work depending on runtime`,
      right: `const helper = condition ? () => 1 : null;
if (helper) helper();`,
      explanation: 'Function declarations in blocks (if, for, while) have inconsistent behavior across environments. Always use const with arrow functions inside blocks.',
    },
    {
      title: 'Duplicate var declarations masking bugs',
      wrong: `var count = 0;
// ... 200 lines later ...
var count = getUserCount();  // silently shadows/reassigns — no error`,
      right: `let count = 0;
// ... 200 lines later ...
let count = getUserCount();  // SyntaxError: already declared — caught!`,
      explanation: 'var allows duplicate declarations in the same scope, silently reassigning. let/const throw a SyntaxError on redeclaration, catching the bug immediately.',
    },
    {
      title: 'Class instantiation before declaration',
      wrong: `const p = new Person("Alice");  // ReferenceError: Cannot access 'Person' before initialization
class Person {
  constructor(name) { this.name = name; }
}`,
      right: `class Person {
  constructor(name) { this.name = name; }
}
const p = new Person("Alice");  // works`,
      explanation: 'Unlike function declarations, class declarations have a TDZ. You cannot instantiate a class before its declaration in the source code.',
    },
  ];

  challenge: Challenge = {
    title: 'Predict the Output',
    language: 'typescript',
    description: 'Without running the code, predict the output of each snippet. Then explain why.\n\n```js\n// Snippet 1\nconsole.log(a); var a = 1; console.log(a);\n\n// Snippet 2\nconsole.log(b); let b = 2; console.log(b);\n\n// Snippet 3\nfoo(); function foo() { console.log("foo"); }\n\n// Snippet 4\nbar(); var bar = function() { console.log("bar"); };\n\n// Snippet 5\nconsole.log(typeof c); let c = 3;\n```\n\nBonus: Write a function `safeGet(obj, key)` that returns undefined (instead of throwing) even if the key holds a variable in TDZ — explain why this is or is not possible with let/const.',
    hints: [
      'var declarations are hoisted as undefined; let/const enter TDZ',
      'Function declarations are fully hoisted including their body',
      'Function expressions follow the rules of their declaration keyword',
      'typeof of a TDZ variable is different from typeof of an undeclared variable',
    ],
    starterCode: `// Snippet 1 — what does this print?
console.log(a);
var a = 1;
console.log(a);

// Snippet 2 — what does this print?
// console.log(b);
// let b = 2;
// console.log(b);

// Snippet 3 — what does this print?
foo();
function foo() { console.log("foo called"); }

// Snippet 4 — what does this print?
// bar();
// var bar = function() { console.log("bar called"); };

// Snippet 5 — what does this print?
// console.log(typeof c);
// let c = 3;`,
    solution: `// Snippet 1: undefined, 1
// var a is hoisted as undefined. Assignment runs later.

// Snippet 2: ReferenceError
// let b is in TDZ until the declaration line.

// Snippet 3: "foo called"
// Function declarations are fully hoisted — can call before definition.

// Snippet 4: TypeError: bar is not a function
// var bar is hoisted as undefined. The function assignment runs later.
// Calling undefined() throws TypeError.

// Snippet 5: ReferenceError
// typeof of a TDZ let/const variable throws ReferenceError
// (unlike typeof of a truly undeclared variable which returns "undefined")`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does accessing a var before its declaration return?',
      options: ['ReferenceError', 'null', 'undefined', 'TypeError'],
      answer: 2,
      explanation: 'var declarations are hoisted and initialized to undefined. Accessing them before the assignment gives undefined, not an error — which can mask bugs.',
    },
    {
      q: 'What happens when you access a let variable before its declaration?',
      options: ['Returns undefined', 'Returns null', 'ReferenceError (TDZ)', 'SyntaxError'],
      answer: 2,
      explanation: 'let and const are in the Temporal Dead Zone from the start of the block until their declaration. Accessing them there throws ReferenceError.',
    },
    {
      q: 'Which of these can be called before its declaration?',
      options: [
        'const fn = () => {}',
        'var fn = function() {}',
        'function fn() {}',
        'let fn = function() {}',
      ],
      answer: 2,
      explanation: 'Function declarations are fully hoisted — both name and body. The others follow their declaration keyword rules (undefined for var, TDZ for let/const).',
    },
    {
      q: 'What is the Temporal Dead Zone?',
      options: [
        'The time between page load and first script execution',
        'The period where let/const exists but is uninitialized (throws ReferenceError)',
        'The period where var is declared but not assigned',
        'A phase where setTimeout callbacks are queued',
      ],
      answer: 1,
      explanation: 'The TDZ is the block scope period between entering the scope and reaching the let/const declaration. Accessing the variable there throws ReferenceError.',
    },
    {
      q: 'What does `var` hoisted inside an if block result in?',
      options: [
        'The variable stays inside the if block',
        'A SyntaxError',
        'The variable is hoisted to the enclosing function or global scope',
        'The variable is undefined only inside the block',
      ],
      answer: 2,
      explanation: 'var is function-scoped, not block-scoped. A var declared inside an if/for/while block gets hoisted to the enclosing function (or global scope), leaking outside the block.',
    },
    {
      q: 'What is the value of a var variable before its initializer runs?',
      options: ['ReferenceError', 'null', 'undefined', 'The uninitialized state'],
      answer: 2,
      explanation: 'var declarations are hoisted and initialized to undefined. Only the declaration is moved up, not the assignment. So accessing it before the line of code where it is assigned gives undefined, not an error.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is let actually hoisted or not?',
      a: 'Yes — <code>let</code> (and <code>const</code>) ARE hoisted. The engine knows about them from the start of the block. The difference from <code>var</code>: they are NOT initialized. That\'s what creates the TDZ. The <code>ReferenceError</code> you get is proof the engine knows the variable exists — otherwise it would give a different error about an undeclared identifier.',
    },
    {
      q: 'Can I use typeof on a let variable in the TDZ?',
      a: 'No — this is a common misconception. <code>typeof</code> is normally "safe" for undeclared variables (returns <code>"undefined"</code>). But for <code>let</code>/<code>const</code> in the TDZ, <code>typeof</code> throws a <code>ReferenceError</code>. Only truly undeclared variables (never declared anywhere in scope) get the safe <code>"undefined"</code> treatment from <code>typeof</code>.',
    },
    {
      q: 'Why do function declarations get fully hoisted but function expressions don\'t?',
      a: 'Function declarations are a statement form — their purpose is to define a named function in the current scope, and JavaScript was designed so you can write helper functions below the code that uses them (like C header files). Function expressions are values assigned to variables — the hoisting behavior follows the variable\'s declaration keyword (<code>var</code>/<code>let</code>/<code>const</code>).',
    },
    {
      q: 'Does class hoisting behave like function hoisting?',
      a: 'No — classes are hoisted (the engine knows the name exists) but NOT initialized. Accessing a class before its declaration throws a <code>ReferenceError</code> — the same Temporal Dead Zone behavior as <code>let</code>/<code>const</code>. Unlike function declarations, you cannot call a class constructor before its definition in the source code.',
    },
    {
      q: 'What happens when you have both a var and a function declaration with the same name?',
      a: 'Function declarations win over <code>var</code> declarations at hoisting time. The function binding replaces the <code>undefined</code> that <code>var</code> would have set. However, if a <code>var</code> has an explicit assignment in the code (not just a declaration), that assignment still runs and can overwrite the function at runtime.',
    },
    {
      q: 'How does hoisting interact with modules (ESM)?',
      a: 'In ES modules, <code>import</code> bindings are hoisted and live-bound — you can use an imported value before the <code>import</code> statement in source order because the module graph is fully evaluated before any module code runs. However, within a module, <code>let</code>/<code>const</code>/<code>class</code> still have TDZ behavior, and <code>var</code> is function-scoped to the module\'s top-level scope (no global leakage).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Hoisting moves declarations (not initializations) to the top of scope — var is initialized as undefined, function declarations are fully hoisted, and let/const sit in the TDZ until their declaration line.',
    mustKnow: [
      'var: hoisted to function scope, initialized as undefined — silent bugs',
      'let/const: hoisted but in TDZ — ReferenceError if accessed before declaration',
      'Function declarations: fully hoisted (name + body) — callable before definition',
      'Function expressions and arrows: follow their keyword\'s rules',
      'TDZ exists to catch order-of-use bugs that var silently hides',
      'typeof of a TDZ variable throws ReferenceError (not "undefined")',
    ],
    interviewFocus: [
      'What is hoisting — what gets hoisted and how?',
      'var vs let/const in terms of hoisting and TDZ',
      'Function declaration vs function expression hoisting',
      'What is the TDZ and why does it exist?',
    ],
  };
}
