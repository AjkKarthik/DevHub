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
  selector: 'app-js-prototypes',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './prototypes.html',
  styleUrl: './prototypes.scss',
})
export class JsPrototypes {
  theory: TheoryPoint[] = [
    {
      heading: 'The Prototype Chain',
      points: [
        'Every JavaScript object has an internal <code>[[Prototype]]</code> link (accessible via <code>Object.getPrototypeOf(obj)</code> or the legacy <code>obj.__proto__</code>). When you access a property, JavaScript first looks on the object itself, then walks up the chain.',
        'Property lookup walks the chain: object → prototype → prototype\'s prototype → ... → <code>null</code>. The first match wins. If nothing matches, <code>undefined</code> is returned.',
        '<code>Object.prototype</code> is at the top of all chains (unless you explicitly create a null-prototype object with <code>Object.create(null)</code>). It provides <code>toString</code>, <code>hasOwnProperty</code>, <code>valueOf</code> etc.',
        'Methods defined on the prototype are shared across all instances — this is what makes prototype-based inheritance memory-efficient. Each instance does not get its own copy of the method.',
      ]
    },
    {
      heading: 'ES6 Classes (Syntactic Sugar)',
      points: [
        'ES6 <code>class</code> syntax is syntactic sugar over prototype-based inheritance. Under the hood, methods go on the prototype, and <code>new</code> creates an instance linked to the prototype.',
        '<code>extends</code> sets up the prototype chain. <code>super()</code> calls the parent constructor and must be called before accessing <code>this</code> in a subclass constructor.',
        'Static methods (<code>static method()</code>) are defined on the class itself, not the prototype — they can\'t be called on instances, only on the class.',
        'Private class fields (<code>#field</code>) are truly private — not accessible from outside the class, not even via subclasses. This is native privacy vs symbol-based privacy.',
        'Class fields and private fields are defined at the instance level (not prototype) — each instance gets its own copy. Methods remain on the prototype.',
      ]
    },
    {
      heading: 'Object.create & Prototypal Inheritance',
      points: [
        '<code>Object.create(proto)</code> creates a new object with <code>proto</code> as its prototype. This is the most direct way to set up prototype chains without using <code>class</code> syntax.',
        'Prototype-based inheritance is more flexible than class-based: you can set up chains between any objects, mix behaviors, and create objects without constructors.',
        '<code>Object.create(null)</code> creates a "pure" object with no prototype — useful for dictionaries/maps to avoid prototype pollution and property shadowing issues.',
        'Prototype methods can be overridden by defining the same method directly on an instance or subclass. The own property takes precedence over the prototype chain.',
      ]
    },
    {
      heading: 'instanceof & typeof',
      points: [
        '<code>instanceof</code> walks the prototype chain: <code>obj instanceof SomeClass</code> returns <code>true</code> if <code>SomeClass.prototype</code> appears anywhere in <code>obj</code>\'s chain.',
        '<code>typeof</code> returns a string identifying the type of a value. It only distinguishes primitive types + function; for objects (including arrays, dates, null) it returns <code>"object"</code>.',
        'For reliable type checking of built-in objects: <code>Array.isArray(v)</code>, <code>v instanceof Map</code>, <code>v instanceof Date</code>, or <code>Object.prototype.toString.call(v)</code> which gives <code>"[object Array]"</code> etc.',
        '<code>instanceof</code> can fail across realms (iframes, different Node.js VMs) since each realm has its own prototype. <code>Array.isArray()</code> is realm-safe.',
      ]
    },
    {
      heading: 'Mixins',
      points: [
        'JavaScript classes support single inheritance only, but you can compose behaviors using mixins — functions that take a class and return a new class with extra methods.',
        'The mixin pattern: <code>const Serializable = (Base) => class extends Base { serialize() {...} }</code>. Stack mixins: <code>class MyClass extends Serializable(Loggable(Base))</code>.',
        'Mixins are more flexible than multiple inheritance: you control composition order and can include only what you need. They don\'t pollute the prototype chain with deep hierarchies.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Object.getPrototypeOf(obj)',  type: 'method', desc: 'Returns the prototype of obj (replaces __proto__)' },
    { name: 'Object.create(proto)',         type: 'method', desc: 'Creates new object with proto as its [[Prototype]]' },
    { name: 'Object.create(null)',          type: 'method', desc: 'Creates object with no prototype (pure dictionary)' },
    { name: 'obj instanceof Class',         type: 'operator', desc: 'True if Class.prototype is in obj\'s prototype chain' },
    { name: 'class C extends B',           type: 'syntax',   desc: 'Sets C.prototype.__proto__ = B.prototype' },
    { name: 'super()',                      type: 'syntax',   desc: 'Calls parent constructor — must be called before this in subclass' },
    { name: 'static method()',              type: 'syntax',   desc: 'On the class constructor itself, not instances' },
    { name: '#privateField',               type: 'syntax',   desc: 'Truly private — not accessible outside the class body' },
    { name: 'Array.isArray(v)',             type: 'method',  desc: 'Realm-safe array check (unlike instanceof Array)' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Prototype Chain',
      language: 'typescript',
      code: `// ── Prototype chain walkthrough ───────────────────────────────────────
function Animal(name) { this.name = name; }
Animal.prototype.speak = function() { return \`\${this.name} makes a sound.\`; };

function Dog(name, breed) {
  Animal.call(this, name);   // inherit instance props
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function() { return \`\${this.name} barks!\`; };

const d = new Dog('Rex', 'Husky');
d.bark();    // "Rex barks!" — own prototype
d.speak();   // "Rex makes a sound." — Animal.prototype
d.toString();// "[object Object]" — Object.prototype

// The chain:
// d → Dog.prototype → Animal.prototype → Object.prototype → null

console.log(d instanceof Dog);    // true
console.log(d instanceof Animal); // true
console.log(Object.getPrototypeOf(d) === Dog.prototype); // true`,
    },
    {
      label: 'ES6 Classes',
      language: 'typescript',
      code: `// ── Class syntax (same prototype chain, cleaner code) ─────────────────
class Shape {
  #color;   // private field

  constructor(color = 'black') {
    this.#color = color;
  }

  getColor() { return this.#color; }
  area()      { return 0; }

  static fromCSS(str) {   // static factory method
    return new Shape(str.replace('#', ''));
  }
}

class Circle extends Shape {
  #radius;

  constructor(radius, color) {
    super(color);         // must call super() first
    this.#radius = radius;
  }

  area()     { return Math.PI * this.#radius ** 2; }
  toString() { return \`Circle(r=\${this.#radius}, color=\${this.getColor()})\`; }
}

const c = new Circle(5, 'red');
c.area();      // ~78.54
c.getColor();  // "red"
c.toString();  // "Circle(r=5, color=red)"
// c.#radius;  // SyntaxError — truly private

console.log(c instanceof Circle);  // true
console.log(c instanceof Shape);   // true`,
    },
    {
      label: 'Mixins',
      language: 'typescript',
      code: `// ── Mixin pattern ────────────────────────────────────────────────────
const Serializable = (Base) => class extends Base {
  serialize()   { return JSON.stringify(this); }
  static deserialize(json) { return Object.assign(new this(), JSON.parse(json)); }
};

const Timestamped = (Base) => class extends Base {
  constructor(...args) {
    super(...args);
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }
  touch() { this.updatedAt = Date.now(); }
};

const Validatable = (Base) => class extends Base {
  validate() {
    for (const [key, rule] of Object.entries(this.constructor.rules ?? {})) {
      if (!rule(this[key])) throw new Error(\`Invalid \${key}\`);
    }
    return true;
  }
};

// Compose mixins
class User extends Serializable(Timestamped(Validatable(class {}))) {
  static rules = {
    name:  v => typeof v === 'string' && v.length > 0,
    email: v => /^.+@.+\..+$/.test(v),
  };

  constructor(name, email) {
    super();
    this.name  = name;
    this.email = email;
  }
}

const u = new User('Alice', 'alice@example.com');
u.validate();                // true
u.serialize();               // '{"createdAt":...,"name":"Alice",...}'
u.touch();                   // updates updatedAt`,
    },
    {
      label: 'Object.create',
      language: 'typescript',
      code: `// ── Object.create for pure prototypal inheritance ─────────────────────
const animalProto = {
  speak() { return \`\${this.name} says \${this.sound}.\`; },
  toString() { return \`[\${this.type}: \${this.name}]\`; },
};

function createAnimal(name, sound, type) {
  const animal = Object.create(animalProto);
  animal.name  = name;
  animal.sound = sound;
  animal.type  = type;
  return animal;
}

const cat = createAnimal('Whiskers', 'meow', 'cat');
cat.speak();   // "Whiskers says meow."
cat.toString();// "[cat: Whiskers]"

// ── null prototype objects (safe dictionaries) ─────────────────────────
const dict = Object.create(null);
dict['toString'] = 'my value';   // no collision with Object.prototype.toString!
dict['constructor'] = 42;        // same — no prototype pollution

// Normal object has prototype keys as own properties risk:
const normal = {};
'toString' in normal;   // true — from prototype!
'toString' in dict;     // true — but only because we set it explicitly

// Useful for: counted occurrences, cache maps, arbitrary user input keys
function countWords(text) {
  const counts = Object.create(null);
  for (const word of text.toLowerCase().split(/\W+/).filter(Boolean)) {
    counts[word] = (counts[word] ?? 0) + 1;
  }
  return counts;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting super() in subclass constructor',
      wrong: `class Dog extends Animal {
  constructor(name) {
    this.name = name;  // ReferenceError: Must call super before accessing this
  }
}`,
      right: `class Dog extends Animal {
  constructor(name) {
    super(name);    // call parent constructor first
    this.breed = 'unknown';
  }
}`,
      explanation: 'In a subclass constructor, you must call super() before accessing this. The parent constructor sets up the object that this refers to.',
    },
    {
      title: 'Defining methods in the constructor (not prototype)',
      wrong: `class Animal {
  constructor(name) {
    this.name = name;
    this.speak = function() { return this.name; };  // new fn per instance!
  }
}`,
      right: `class Animal {
  constructor(name) { this.name = name; }
  speak() { return this.name; }  // defined once on prototype
}`,
      explanation: 'Defining methods in the constructor creates a new function object for every instance. Methods on the prototype are shared — one copy, many instances.',
    },
    {
      title: 'Using instanceof across iframes/realms',
      wrong: `// In an iframe, arrays from the parent frame fail instanceof check
const arr = window.parent.someArray;
arr instanceof Array;  // false! Different Array constructor`,
      right: `Array.isArray(arr);  // true — realm-safe
// For other types, use Object.prototype.toString:
Object.prototype.toString.call(arr) === '[object Array]'`,
      explanation: 'instanceof checks the prototype chain against the constructor in the current realm. Arrays from other realms have different constructors. Array.isArray() is always safe.',
    },
    {
      title: 'Extending built-ins without understanding species',
      wrong: `class MyArray extends Array {
  sum() { return this.reduce((a, b) => a + b, 0); }
}
const arr = new MyArray(1, 2, 3);
const mapped = arr.map(x => x * 2);
console.log(mapped instanceof MyArray);  // true, but may not be what you want`,
      right: `// Be explicit: if you just need utility methods, use composition
class BetterArray {
  constructor(...items) { this._data = items; }
  sum() { return this._data.reduce((a, b) => a + b, 0); }
  map(...args) { return new BetterArray(...this._data.map(...args)); }
}`,
      explanation: 'Extending built-ins works but has subtle edge cases with Symbol.species and method return types. Composition over inheritance for data structures.',
    },
    {
      title: 'Prototype pollution via user-controlled keys',
      wrong: `function merge(target, source) {
  for (const key in source) {
    target[key] = source[key];  // source could have __proto__ key!
  }
}
merge({}, JSON.parse('{"__proto__": {"isAdmin": true}}'));
// Now ALL objects have isAdmin: true!`,
      right: `function merge(target, source) {
  for (const key of Object.keys(source)) {  // own keys only
    if (key === '__proto__' || key === 'constructor') continue;
    target[key] = source[key];
  }
}
// Or use structuredClone / Object.assign on safe objects`,
      explanation: 'for...in includes inherited properties. User-controlled keys like __proto__ can poison Object.prototype affecting all objects. Always use Object.keys() and skip dangerous keys.',
    },
    {
      title: 'Accessing private fields from outside',
      wrong: `class Secret { #value = 42; }
const s = new Secret();
s['#value'];        // undefined (not accessible)
s[Symbol('value')]; // undefined
// No way to access — this is intentional!`,
      right: `class Secret {
  #value = 42;
  getValue() { return this.#value; }  // expose via method
}
const s = new Secret();
s.getValue();  // 42`,
      explanation: 'Private fields (#field) are truly private — no reflection, no computed access, no workaround. Expose values deliberately through public methods.',
    },
  ];

  challenge: Challenge = {
    title: 'Implement a Simple EventEmitter',
    language: 'typescript',
    description: 'Build an `EventEmitter` class with:\n- `on(event, listener)` — subscribe\n- `off(event, listener)` — unsubscribe\n- `emit(event, ...args)` — fire all listeners\n- `once(event, listener)` — subscribe for one call only\n\nUse class syntax with a private `#listeners` Map.',
    hints: [
      '#listeners is a Map<string, Set<Function>>',
      'on: get or create the Set for the event, add listener',
      'off: get the Set, delete the listener',
      'once: wrap listener in a function that calls off after firing',
      'emit: get the Set, call each listener with ...args',
    ],
    starterCode: `class EventEmitter {
  // Implement using private fields
}

const emitter = new EventEmitter();

emitter.on('data', (x) => console.log('got:', x));

const handler = (x) => console.log('once:', x);
emitter.once('data', handler);

emitter.emit('data', 42);  // "got: 42", "once: 42"
emitter.emit('data', 99);  // "got: 99"  (once handler removed)`,
    solution: `class EventEmitter {
  #listeners = new Map();

  #getSet(event) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    return this.#listeners.get(event);
  }

  on(event, listener)  { this.#getSet(event).add(listener); return this; }
  off(event, listener) { this.#getSet(event).delete(listener); return this; }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    for (const fn of this.#getSet(event)) fn(...args);
    return this;
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does the prototype chain do when you access obj.method()?',
      options: [
        'Looks only on the object itself',
        'Looks on the object, then its prototype, then up the chain until found or null',
        'Copies the method from the prototype to the object',
        'Throws if not found on the object directly',
      ],
      answer: 1,
      explanation: 'Property lookup walks up the prototype chain: object → prototype → prototype\'s prototype → ... → null. First match wins; undefined if nothing found.',
    },
    {
      q: 'What is ES6 class syntax?',
      options: [
        'A completely new inheritance model replacing prototypes',
        'Syntactic sugar over prototype-based inheritance',
        'A way to create objects without prototypes',
        'A copy of Java class syntax',
      ],
      answer: 1,
      explanation: 'class is syntax sugar — under the hood, methods are placed on the prototype, and instances are created the same way as with constructor functions.',
    },
    {
      q: 'What does super() do in a subclass constructor?',
      options: [
        'Creates a copy of the parent class',
        'Calls the parent constructor and sets up this',
        'Links the prototype chain',
        'Calls all parent methods',
      ],
      answer: 1,
      explanation: 'super() calls the parent constructor. In a subclass, this doesn\'t exist until super() completes — calling this before super() throws ReferenceError.',
    },
    {
      q: 'Where are class methods defined?',
      options: [
        'Copied onto every instance in the constructor',
        'On the class prototype — shared across all instances',
        'On the class constructor function itself',
        'In a hidden scope accessible only to instances',
      ],
      answer: 1,
      explanation: 'Class methods go on ClassName.prototype. All instances share one copy via the prototype chain, making this memory-efficient.',
    },
    {
      q: 'How are private class fields (#field) different from convention-private (_field)?',
      options: [
        'No difference — both are just naming conventions',
        '#field is truly private: inaccessible outside the class body at the language level',
        '#field is faster',
        '#field prevents subclasses from overriding',
      ],
      answer: 1,
      explanation: '#field is enforced by the JavaScript engine — no reflection, computed access, or workaround can reach it. _field is just a convention; it\'s completely public.',
    },
    {
      q: 'What does Object.getPrototypeOf() return for an array?',
      options: ['Object.prototype', 'Array.prototype', 'null', 'Array'],
      answer: 1,
      explanation: 'Arrays inherit from Array.prototype, which in turn inherits from Object.prototype. Object.getPrototypeOf([]) === Array.prototype. That is how arrays get map, filter, reduce, etc.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is JavaScript\'s class syntax real classes or just prototypes?',
      a: 'It\'s prototypes under the hood — <code>class</code> is syntactic sugar. <code>class Dog extends Animal</code> sets <code>Dog.prototype.__proto__ = Animal.prototype</code>. Methods go on the prototype. <code>new Dog()</code> creates a plain object with that prototype. The keyword is different, the mechanism is the same prototype chain.',
    },
    {
      q: 'When should I use class inheritance vs composition/mixins?',
      a: 'Use <strong>inheritance</strong> for genuine "is-a" relationships with 1-2 levels of hierarchy (Dog extends Animal). Use <strong>mixins/composition</strong> when you want to share behaviors across unrelated classes (Serializable, Loggable, Timestamped). Deep inheritance hierarchies (more than 2-3 levels) become brittle — prefer composition.',
    },
    {
      q: 'What is prototype pollution and why is it dangerous?',
      a: 'Prototype pollution occurs when attacker-controlled input is used to set a property on <code>Object.prototype</code> (typically via <code>__proto__</code> or <code>constructor.prototype</code>). Since all objects inherit from <code>Object.prototype</code>, this contaminates every object in the application. Prevent it by using <code>Object.keys()</code> (not <code>for...in</code>), sanitizing user keys, or using <code>Object.create(null)</code> for user-keyed data.',
    },
    {
      q: 'What is the difference between hasOwnProperty and the in operator?',
      a: '<code>obj.hasOwnProperty("key")</code> returns true only if the property is an own (non-inherited) property. The <code>in</code> operator checks own AND prototype chain. Example: <code>"toString" in {}</code> is true; <code>({}).hasOwnProperty("toString")</code> is false. Use <code>Object.hasOwn(obj, key)</code> (ES2022) as the safe modern alternative to <code>hasOwnProperty</code> — works with <code>Object.create(null)</code> objects too.',
    },
    {
      q: 'How do mixins work with prototypes in JavaScript?',
      a: 'A mixin copies methods from one or more source objects onto a target prototype: <code>Object.assign(Dog.prototype, Serializable, Loggable)</code>. This enables multiple-source code reuse without inheritance. The copied methods become own properties of the prototype. Pattern: define mixin objects with only methods (no constructor) and mix them onto classes that need those capabilities.',
    },
    {
      q: 'What is the instanceof operator actually checking?',
      a: '<code>obj instanceof Cls</code> walks <code>obj</code>\'s prototype chain looking for <code>Cls.prototype</code>. It does NOT check if <code>obj</code> was created by <code>Cls</code>. This means it fails across realms (different iframes — each realm has its own Array.prototype) and can be fooled by reassigning <code>Cls.prototype</code>. Use <code>Array.isArray()</code> for arrays and <code>Object.prototype.toString.call(obj)</code> for robust type checking.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'JavaScript uses prototype chains for inheritance — ES6 class syntax is sugar over this; methods live on the prototype, private fields (#) are truly private, and mixins enable flexible multi-behavior composition.',
    mustKnow: [
      'Prototype chain: object → prototype → ... → Object.prototype → null; first match wins',
      'class is syntax sugar — methods go on ClassName.prototype, shared across instances',
      'super() must be called before this in subclass constructors',
      'Static methods are on the class itself, not the prototype',
      '#privateField is engine-enforced private — no reflection workaround exists',
      'instanceof walks the chain; Array.isArray() is realm-safe',
    ],
    interviewFocus: [
      'Explain the prototype chain — how does property lookup work?',
      'What is the difference between class syntax and prototype-based inheritance?',
      'How does instanceof work and when does it fail?',
      'What is prototype pollution and how do you prevent it?',
    ],
  };
}
