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
  selector: 'app-js-functions',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './functions.html',
  styleUrl: './functions.scss',
})
export class JsFunctions {
  theory: TheoryPoint[] = [
    {
      heading: 'Function Types',
      points: [
        '<strong>Function declarations</strong> are fully hoisted and have their own <code>this</code>, <code>arguments</code>, and can be used as constructors.',
        '<strong>Function expressions</strong> are not hoisted (follow var/let/const rules) and are often assigned to variables or passed as arguments.',
        '<strong>Arrow functions</strong> have no own <code>this</code>, no <code>arguments</code> object, and cannot be used as constructors. They lexically inherit <code>this</code> from their enclosing scope — the key difference from regular functions.',
        '<strong>Generator functions</strong> (<code>function*</code>) return iterators and can pause/resume via <code>yield</code>. <strong>Async functions</strong> always return a Promise and support <code>await</code>.',
        'Functions are first-class values in JavaScript — they can be assigned to variables, stored in arrays/objects, passed as arguments, and returned from other functions.',
      ]
    },
    {
      heading: 'this Binding',
      points: [
        '<code>this</code> refers to the object that is "calling" the function. In a method call <code>obj.method()</code>, <code>this</code> is <code>obj</code>. As a standalone call, <code>this</code> is <code>undefined</code> in strict mode (global in sloppy).',
        '<strong>Explicit binding:</strong> <code>fn.call(ctx, arg1)</code> calls <code>fn</code> with <code>this = ctx</code>. <code>fn.apply(ctx, [args])</code> takes an array. <code>fn.bind(ctx)</code> returns a new function with <code>this</code> permanently bound.',
        '<strong>Arrow functions</strong> don\'t have their own <code>this</code> — they capture <code>this</code> from the surrounding lexical scope at the time of definition. This makes them ideal for callbacks inside methods.',
        '<strong>new binding:</strong> When called with <code>new</code>, <code>this</code> is set to a new empty object, and it\'s returned automatically unless you return a different object.',
        '<code>this</code> binding priority: <code>new</code> > explicit (<code>call/apply/bind</code>) > method call > default (undefined/global).',
      ]
    },
    {
      heading: 'Parameters & Arguments',
      points: [
        '<strong>Default parameters:</strong> <code>function greet(name = "World")</code> — the default is used when the argument is <code>undefined</code> (not just missing). Defaults can be expressions and reference earlier parameters.',
        '<strong>Rest parameters:</strong> <code>function sum(...nums)</code> collects all remaining arguments into a real array. Must be the last parameter. Replaces the legacy <code>arguments</code> object.',
        '<strong>Spread in calls:</strong> <code>Math.max(...arr)</code> expands an array into individual arguments. Equivalent to <code>Math.max.apply(null, arr)</code>.',
        'The legacy <code>arguments</code> object is array-like but not a real array, and doesn\'t exist in arrow functions. Prefer rest parameters in new code.',
        'Parameter destructuring: <code>function draw({ x = 0, y = 0, color = "black" } = {})</code> — destructure the options object directly in the parameter list with defaults.',
      ]
    },
    {
      heading: 'Higher-Order Functions',
      points: [
        'A higher-order function either takes a function as an argument or returns a function. <code>Array.map</code>, <code>Array.filter</code>, <code>setTimeout</code> are all higher-order functions.',
        'Returning a function creates a closure and enables <strong>currying</strong> (transforming a multi-arg function into a chain of single-arg functions) and <strong>partial application</strong>.',
        '<strong>Function composition:</strong> <code>const compose = (f, g) => x => f(g(x))</code> — combine small functions into a pipeline. Left-to-right is <code>pipe</code>, right-to-left is <code>compose</code>.',
        'Pure functions always return the same output for the same input and have no side effects. They are the building blocks of functional programming and are trivially testable.',
      ]
    },
    {
      heading: 'IIFE & Factory Functions',
      points: [
        'An IIFE (Immediately Invoked Function Expression) runs immediately after definition. Classic use: create a local scope to avoid polluting the global scope in pre-module code.',
        'Factory functions are regular functions that return objects — they\'re an alternative to classes. They naturally support private state via closure and avoid the pitfalls of <code>this</code>.',
        '<strong>When to use factory vs class:</strong> factories compose better (mixin multiple behaviors), classes have better performance for many instances and native prototype chain support. Choose based on your needs.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'fn.call(ctx, a, b)',    type: 'method', desc: 'Call fn with this=ctx and individual arguments' },
    { name: 'fn.apply(ctx, [a,b])',  type: 'method', desc: 'Call fn with this=ctx and array of arguments' },
    { name: 'fn.bind(ctx)',          type: 'method', desc: 'Return new function with this permanently bound to ctx' },
    { name: '(...args) => {}',       type: 'syntax', desc: 'Arrow function — no own this, arguments, or prototype' },
    { name: 'function*',             type: 'syntax', desc: 'Generator function — returns iterator, pauses at yield' },
    { name: 'async function',        type: 'syntax', desc: 'Async function — always returns Promise, supports await' },
    { name: '...rest',               type: 'syntax', desc: 'Rest parameter — collects remaining args into a real array' },
    { name: 'param = default',       type: 'syntax', desc: 'Default parameter — used when argument is undefined' },
    { name: '(function(){})()',       type: 'syntax', desc: 'IIFE — immediately invoked function expression' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Function Types & this',
      language: 'typescript',
      code: `// ── Regular vs arrow: this binding ───────────────────────────────────
const timer = {
  seconds: 0,

  // Regular function — this is lost in callback!
  startWrong() {
    setInterval(function() {
      this.seconds++;  // this is undefined/global, not timer
    }, 1000);
  },

  // Arrow function — this is inherited from startRight's scope
  startRight() {
    setInterval(() => {
      this.seconds++;  // this === timer ✓
    }, 1000);
  },
};

// ── Explicit this binding ──────────────────────────────────────────────
function greet(greeting, punctuation) {
  return \`\${greeting}, \${this.name}\${punctuation}\`;
}
const user = { name: 'Alice' };

greet.call(user, 'Hello', '!');        // "Hello, Alice!"
greet.apply(user, ['Hi', '...']);      // "Hi, Alice..."
const greetAlice = greet.bind(user);   // new bound function
greetAlice('Hey', '?');                // "Hey, Alice?"

// ── new binding ───────────────────────────────────────────────────────
function Person(name) {
  this.name = name;   // this = new empty object
}
const p = new Person('Bob');
console.log(p.name);  // "Bob"`,
    },
    {
      label: 'Parameters',
      language: 'typescript',
      code: `// ── Default parameters ────────────────────────────────────────────────
function createEl(tag = 'div', cls = '', text = '') {
  const el = document.createElement(tag);
  if (cls)  el.className = cls;
  if (text) el.textContent = text;
  return el;
}
createEl();                          // <div>
createEl('p', 'intro', 'Hello');    // <p class="intro">Hello</p>

// Default can reference earlier params
function makeRange(start, end = start + 10) {
  return { start, end };
}
makeRange(5);     // { start: 5, end: 15 }
makeRange(5, 20); // { start: 5, end: 20 }

// ── Rest parameters ────────────────────────────────────────────────────
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4);  // 10

function log(level, ...messages) {
  console[level]('[' + level + ']', ...messages);
}
log('warn', 'something', 'happened');  // [warn] something happened

// ── Spread in calls ────────────────────────────────────────────────────
const nums = [3, 1, 4, 1, 5, 9, 2, 6];
Math.max(...nums);           // 9
Math.min(...nums);           // 1
[...nums].sort((a,b)=>a-b); // sorted copy

// ── Destructured parameter + defaults ────────────────────────────────
function drawRect({ x=0, y=0, w=100, h=50, color='black' } = {}) {
  console.log(\`Drawing at (\${x},\${y}) size \${w}x\${h} in \${color}\`);
}
drawRect({ x: 10, color: 'red' }); // Drawing at (10,0) size 100x50 in red
drawRect();                          // Drawing at (0,0) size 100x50 in black`,
    },
    {
      label: 'Higher-Order Functions',
      language: 'typescript',
      code: `// ── Returning functions ───────────────────────────────────────────────
function multiplier(factor) {
  return (n) => n * factor;   // closes over factor
}
const double = multiplier(2);
const triple = multiplier(3);
double(5);  // 10
triple(5);  // 15

// ── Currying ──────────────────────────────────────────────────────────
const curry = fn => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
};

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3);    // 6
add(1, 2)(3);   // 6
add(1)(2, 3);   // 6

// ── Function composition ──────────────────────────────────────────────
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const processName = pipe(
  str => str.trim(),
  str => str.toLowerCase(),
  str => str.replace(/\s+/g, '-'),
);

processName('  Hello World  ');  // "hello-world"

// ── Memoization ────────────────────────────────────────────────────────
const memo = fn => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const fib = memo(n => n <= 1 ? n : fib(n-1) + fib(n-2));
fib(40);  // fast with memoization`,
    },
    {
      label: 'IIFE & Factory',
      language: 'typescript',
      code: `// ── IIFE: scoped initialization ──────────────────────────────────────
const config = (function() {
  const env = 'production';   // private
  const debug = env !== 'production';
  return { env, debug };      // public
})();

console.log(config.env);   // "production"
console.log(config.debug); // false
// console.log(env);  // ReferenceError — env is private

// ── Factory function ──────────────────────────────────────────────────
function createAnimal(name, sound) {
  // Private state in closure
  let trickCount = 0;

  return {
    speak()    { return \`\${name} says \${sound}!\`; },
    learn()    { trickCount++; },
    tricks()   { return trickCount; },
    toString() { return \`Animal(\${name})\`; },
  };
}

const cat = createAnimal('Cat', 'meow');
const dog = createAnimal('Dog', 'woof');

cat.speak();   // "Cat says meow!"
dog.learn(); dog.learn();
dog.tricks();  // 2

// ── Mixins with factory functions ─────────────────────────────────────
const serializable = (obj) => ({
  ...obj,
  serialize()   { return JSON.stringify(obj); },
  toString()    { return \`[\${Object.keys(obj).join(', ')}]\`; },
});

const loggable = (obj) => ({
  ...obj,
  log(msg) { console.log(\`[\${Date.now()}] \${msg}\`, obj); },
});

const myModel = loggable(serializable({ id: 1, name: 'Test' }));
myModel.serialize();  // '{"id":1,"name":"Test"}'
myModel.log('created');`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Losing this in callbacks',
      wrong: `class Timer {
  start() {
    setInterval(function() { this.tick(); }, 1000);  // this is undefined!
  }
}`,
      right: `class Timer {
  start() {
    setInterval(() => { this.tick(); }, 1000);  // arrow: lexical this ✓
  }
}`,
      explanation: 'Regular function callbacks do not inherit this from the method. Arrow functions lexically inherit this from the enclosing scope (the class method).',
    },
    {
      title: 'Using arguments in arrow functions',
      wrong: `const sum = () => {
  return Array.from(arguments).reduce((a, b) => a + b, 0);
};
sum(1, 2, 3);  // ReferenceError: arguments is not defined`,
      right: `const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
sum(1, 2, 3);  // 6`,
      explanation: 'Arrow functions have no arguments object. Use rest parameters (...nums) instead — they give you a real array and are clearer.',
    },
    {
      title: 'Default parameter with null (not undefined)',
      wrong: `function greet(name = 'World') { return \`Hello, \${name}!\`; }
greet(null);  // "Hello, null!" — null doesn't trigger the default`,
      right: `function greet(name = 'World') { return \`Hello, \${name ?? 'World'}!\`; }
greet(null);  // "Hello, World!"`,
      explanation: 'Default parameters only trigger for undefined (missing argument), not null. Explicitly check for null with ?? if you want to treat null as "missing".',
    },
    {
      title: 'Using arrow functions as constructors',
      wrong: `const Person = (name) => { this.name = name; };
const p = new Person('Alice');  // TypeError: Person is not a constructor`,
      right: `function Person(name) { this.name = name; }
const p = new Person('Alice');  // OK
// Or use class syntax:
class Person { constructor(name) { this.name = name; } }`,
      explanation: 'Arrow functions cannot be constructors — they have no prototype property and no own this. Use function declarations or class syntax for constructors.',
    },
    {
      title: 'Mutating function parameters (objects)',
      wrong: `function addRole(user, role) {
  user.roles.push(role);  // mutates the original object!
  return user;
}`,
      right: `function addRole(user, role) {
  return { ...user, roles: [...user.roles, role] };  // new object
}`,
      explanation: 'Objects are passed by reference. Mutating a parameter changes the caller\'s object. Return a new object with spread to keep functions pure.',
    },
    {
      title: 'Forgetting to return from arrow function body',
      wrong: `const doubled = [1,2,3].map(n => { n * 2 });  // [undefined, undefined, undefined]`,
      right: `const doubled = [1,2,3].map(n => n * 2);        // [2, 4, 6] — implicit return
// Or with braces:
const doubled2 = [1,2,3].map(n => { return n * 2; });`,
      explanation: 'Arrow functions with {} need an explicit return. Without {}, the expression is implicitly returned. Forgetting return in the block form gives undefined for every element.',
    },
  ];

  challenge: Challenge = {
    title: 'Implement Function Utilities',
    language: 'typescript',
    description: 'Implement three function utilities:\n1. `debounce(fn, ms)` — returns a function that delays calling `fn` until `ms` milliseconds have passed since the last call\n2. `throttle(fn, ms)` — returns a function that calls `fn` at most once per `ms` milliseconds\n3. `pipe(...fns)` — returns a function that passes its input through each function left-to-right',
    hints: [
      'debounce: use setTimeout and clearTimeout; store timer ID in closure',
      'throttle: track last call time in closure; compare Date.now()',
      'pipe: use reduce — start with input, pass through each fn in order',
      'All three return functions that close over the original fn',
    ],
    starterCode: `function debounce(fn, ms) {
  // delay fn until ms have passed since last call
}

function throttle(fn, ms) {
  // call fn at most once per ms milliseconds
}

const pipe = (...fns) => {
  // pass value through each fn left-to-right
};

// Test debounce
const log = debounce(console.log, 300);
log('a'); log('b'); log('c');  // only "c" logged after 300ms

// Test pipe
const process = pipe(
  x => x * 2,
  x => x + 1,
  x => \`Result: \${x}\`,
);
console.log(process(5));  // "Result: 11"`,
    solution: `function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function throttle(fn, ms) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between arrow functions and regular functions?',
      options: [
        'Arrow functions are faster',
        'Arrow functions have no own this — they inherit it lexically',
        'Arrow functions cannot return values',
        'Arrow functions are always async',
      ],
      answer: 1,
      explanation: 'Arrow functions have no own this, arguments, or prototype. They inherit this from the surrounding scope, making them ideal for callbacks inside methods.',
    },
    {
      q: 'What does fn.bind(ctx) return?',
      options: [
        'The result of calling fn with ctx as this',
        'A new function with this permanently bound to ctx',
        'The ctx object',
        'undefined',
      ],
      answer: 1,
      explanation: 'bind() returns a NEW function with this permanently bound. Unlike call/apply which invoke the function immediately, bind defers the call.',
    },
    {
      q: 'When does a default parameter activate?',
      options: [
        'When the argument is null',
        'When the argument is falsy',
        'When the argument is undefined (or not provided)',
        'When the argument is null or undefined',
      ],
      answer: 2,
      explanation: 'Default parameters only activate when the argument is undefined — either not provided, or explicitly passed as undefined. null, 0, false do NOT trigger defaults.',
    },
    {
      q: 'What does rest parameter (...args) give you?',
      options: [
        'An array-like arguments object',
        'A real Array of remaining arguments',
        'The first argument only',
        'An object with argument names as keys',
      ],
      answer: 1,
      explanation: 'Rest parameters give you a real Array (with .map, .filter etc) of the remaining arguments. Unlike the legacy arguments object which is array-like but not a real Array.',
    },
    {
      q: 'Which this binding has the highest priority?',
      options: ['Method call (obj.fn())', 'call/apply/bind', 'new keyword', 'Default (global/undefined)'],
      answer: 2,
      explanation: 'new binding is highest priority. Explicit (call/apply/bind) comes next. Then method/implicit binding. Default (undefined in strict, global in sloppy) is lowest.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use arrow functions vs regular functions?',
      a: '<strong>Use arrow functions</strong> for callbacks, array methods, and any function where you want to inherit <code>this</code> from the surrounding context. <strong>Use regular functions</strong> for methods on objects or classes (where you want a dynamic <code>this</code>), constructors, generators (<code>function*</code>), and when you need <code>arguments</code>.',
    },
    {
      q: 'What is the difference between call, apply, and bind?',
      a: '<code>call(ctx, arg1, arg2)</code> — invokes immediately, args as individual values. <code>apply(ctx, [arg1, arg2])</code> — invokes immediately, args as array. <code>bind(ctx)</code> — returns a new permanently-bound function, does NOT invoke. Mnemonic: "<strong>A</strong>pply takes an <strong>A</strong>rray, <strong>C</strong>all takes <strong>C</strong>ommas."',
    },
    {
      q: 'What is the difference between debounce and throttle?',
      a: '<strong>Debounce</strong>: delay execution until N ms after the LAST call. Good for search-as-you-type (wait until typing stops). <strong>Throttle</strong>: execute at most once every N ms regardless of call frequency. Good for scroll/resize handlers (limit how often they fire).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Functions are first-class values — arrow functions lexically inherit this making callbacks safe, call/apply/bind set this explicitly, and higher-order functions (map/filter/compose) enable functional pipelines.',
    mustKnow: [
      'Arrow functions: no own this, arguments, or prototype — inherit this lexically',
      'call() invokes with args individually; apply() with array; bind() returns new function',
      'Default parameters trigger on undefined only — not null, 0, or false',
      'Rest (...args) = real Array; arguments = legacy array-like, not in arrows',
      'this binding priority: new > bind/call/apply > method call > default',
      'Factory functions use closures for private state; IIFE creates scoped modules',
    ],
    interviewFocus: [
      'Explain the difference between arrow functions and regular functions (this, arguments, prototype)',
      'When would you use call vs apply vs bind?',
      'Implement debounce and throttle from scratch',
      'What is a higher-order function? Give three examples from the standard library.',
    ],
  };
}
