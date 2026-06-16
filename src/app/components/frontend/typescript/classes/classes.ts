import { Component } from '@angular/core';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-ts-classes',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './classes.html',
  styleUrl: './classes.scss',
})
export class TsClasses {
  quickRef: QuickRefItem[] = [
    { name: 'public',            type: 'keyword', desc: 'Accessible from anywhere — the default when no modifier is written' },
    { name: 'private',           type: 'keyword', desc: 'TypeScript-only: accessible only inside the class — erased at runtime' },
    { name: '#field',            type: 'keyword', desc: 'JavaScript private field — truly runtime-private; not accessible outside the class at all' },
    { name: 'protected',         type: 'keyword', desc: 'Accessible inside the class and subclasses — not from outside instances' },
    { name: 'readonly',          type: 'keyword', desc: 'Can only be set in the constructor; prevents reassignment afterwards' },
    { name: 'abstract class',    type: 'keyword', desc: 'Cannot be instantiated; subclasses must implement abstract members' },
    { name: 'abstract method',   type: 'keyword', desc: 'Declared but not implemented in the base class — forces subclass implementation' },
    { name: 'override',          type: 'keyword', desc: 'TS 4.3+: explicitly marks that a method overrides a base class method' },
    { name: 'constructor(private x: T)', type: 'syntax', desc: 'Parameter property — declares and initialises a class member in one line' },
    { name: 'static',            type: 'keyword', desc: 'Belongs to the class constructor, not instances — shared across all instances' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Access modifiers — public, private, protected',
      points: [
        '<code>public</code> is the default — any code can read and write the property. Explicitly writing public is redundant but sometimes done for clarity.',
        '<code>private</code> is TypeScript-only: it prevents access outside the class in TypeScript code, but is completely erased at compile time. The generated JavaScript has no enforcement — other JS code can still access the property.',
        '<code>protected</code> allows access inside the class and in subclasses, but not from external code. Used when a base class wants to share implementation details with its subclasses without exposing them publicly.',
        'Access modifiers are a TypeScript compile-time tool. They do not affect the runtime behavior of the JavaScript output. For runtime enforcement, use JavaScript\'s <code>#privateField</code> syntax.',
      ],
    },
    {
      heading: 'JavaScript private fields (#) vs TypeScript private',
      points: [
        'JavaScript private fields use the <code>#</code> prefix: <code>#count = 0</code>. These are enforced at runtime — even in JavaScript, you cannot access <code>obj.#count</code> from outside the class. TypeScript fully supports this syntax.',
        'TypeScript\'s <code>private</code> keyword is only a compile-time restriction. If you cast to <code>any</code> or use JavaScript, you can access private members. The runtime JavaScript object has the property accessible.',
        'The practical difference: use <code>private</code> when you want TypeScript to catch accidental access in your TypeScript codebase. Use <code>#</code> when you need runtime privacy (serialization, interop with JS libraries, security-sensitive data).',
        'You cannot mix the two: <code>private #count</code> is a syntax error. Choose one per field.',
      ],
    },
    {
      heading: 'readonly and parameter properties',
      points: [
        '<code>readonly</code> on a class property allows it to be set only in the constructor (or in its declaration). After the constructor runs, the property is immutable. TypeScript enforces this at compile time.',
        'Parameter properties are a TypeScript shorthand: writing <code>constructor(public name: string, private readonly id: number)</code> automatically declares and initializes <code>name</code> and <code>id</code> as class members. This eliminates the repetitive <code>this.name = name</code> boilerplate.',
        'Parameter properties can combine any access modifier and readonly: <code>constructor(protected readonly config: Config)</code>.',
        'The generated JavaScript simply assigns the parameters in the constructor body — parameter properties are purely a TypeScript convenience.',
      ],
    },
    {
      heading: 'Abstract classes and methods',
      points: [
        'An <code>abstract class</code> cannot be instantiated directly with <code>new</code>. It exists to be extended. It can contain both abstract members (declaration only) and concrete members (full implementation).',
        'An <code>abstract method</code> has no body in the base class: <code>abstract area(): number</code>. Every concrete subclass MUST implement all abstract methods — TypeScript enforces this at compile time.',
        'Abstract classes are different from interfaces: an abstract class can have constructor logic, concrete methods, and state. An interface is a pure structural contract. When you need both a shared implementation and an enforced interface, use an abstract class.',
        'You can use an abstract class as a type: <code>function process(shape: Shape) {}</code> where Shape is abstract — TypeScript allows passing any concrete subclass as the argument.',
      ],
    },
    {
      heading: 'The override keyword (TypeScript 4.3+)',
      points: [
        'The <code>override</code> keyword explicitly marks that a method is intended to override a base class method: <code>override toString(): string { ... }</code>.',
        'Without <code>override</code>, if the base class method is renamed or removed, the subclass method silently becomes a new unrelated method — a subtle bug. With <code>override</code>, TypeScript errors if no matching method exists in the base class.',
        'When <code>noImplicitOverride: true</code> is set in tsconfig, TypeScript requires the <code>override</code> keyword on all overriding methods. This catches cases where a developer forgot to mark the intent.',
        'override works with properties too: <code>override readonly name: string = "Derived"</code>.',
      ],
    },
    {
      heading: 'Static members and class expressions',
      points: [
        'Static members belong to the class constructor, not to instances. <code>static count = 0</code> is accessed as <code>MyClass.count</code>, not <code>instance.count</code>. Static methods share the same type parameter restriction as static class members — they cannot use the class-level generic.',
        'Static blocks (ES2022) allow complex initialization of static members: <code>static { MyClass.instance = new MyClass(); }</code>. TypeScript supports this.',
        'Class expressions assign a class to a variable: <code>const Animal = class&lt;T&gt; { ... }</code>. Useful for dynamic class creation, mixins, and returning classes from functions.',
        'Mixins are a pattern for composing behavior: a function that takes a class and returns a new class with additional methods. TypeScript types these with constructor type constraints: <code>type Constructor&lt;T = {}&gt; = new (...args: any[]) =&gt; T</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Access Modifiers',
      language: 'typescript',
      code: `class BankAccount {
  public  readonly id: string;      // readable anywhere, set once
  private balance: number;          // TS-only private
  #pin: string;                     // JS runtime-private
  protected owner: string;          // accessible in subclasses

  constructor(id: string, initialBalance: number, pin: string, owner: string) {
    this.id      = id;
    this.balance = initialBalance;
    this.#pin    = pin;
    this.owner   = owner;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.balance += amount;
  }

  getBalance(pin: string): number {
    if (pin !== this.#pin) throw new Error('Wrong PIN');
    return this.balance;
  }
}

class SavingsAccount extends BankAccount {
  private interestRate: number;

  constructor(id: string, balance: number, pin: string, owner: string, rate: number) {
    super(id, balance, pin, owner);
    this.interestRate = rate;
  }

  applyInterest(): void {
    // Can access protected owner (inherited)
    console.log(\`Applying interest for \${this.owner}\`);
    // this.balance // Error — private in BankAccount
    // this.#pin    // Error — JS private, not accessible
  }
}

const account = new BankAccount('acc1', 1000, '1234', 'Alice');
account.id;      // string — public readonly
// account.balance; // Error — private
// account.#pin;    // Error — runtime private`,
    },
    {
      label: 'Parameter Properties & readonly',
      language: 'typescript',
      code: `// Without parameter properties — verbose
class OldStyle {
  private name: string;
  private readonly id: number;
  public role: string;

  constructor(name: string, id: number, role: string) {
    this.name = name;
    this.id   = id;
    this.role = role;
  }
}

// With parameter properties — concise
class User {
  constructor(
    public    readonly  id: number,
    public              name: string,
    private             email: string,
    protected           role: 'admin' | 'user' = 'user',
  ) {}

  getEmail(): string { return this.email; }
}

const user = new User(1, 'Alice', 'a@b.com');
user.id;   // number — public readonly
user.name; // string — public
// user.email; // Error — private

// readonly on class field vs constructor param
class Config {
  readonly host: string;
  readonly port: number;

  constructor(host: string, port: number) {
    this.host = host; // OK — assignment in constructor
    this.port = port;
  }

  update() {
    // this.host = 'new'; // Error — readonly after constructor
  }
}`,
    },
    {
      label: 'Abstract Classes',
      language: 'typescript',
      code: `// Abstract class — cannot be instantiated
abstract class Shape {
  constructor(public readonly color: string) {}

  // Abstract method — subclasses MUST implement
  abstract area(): number;
  abstract perimeter(): number;

  // Concrete method — shared by all subclasses
  describe(): string {
    return \`\${this.color} shape: area=\${this.area().toFixed(2)}\`;
  }
}

class Circle extends Shape {
  constructor(color: string, public readonly radius: number) {
    super(color);
  }
  area(): number      { return Math.PI * this.radius ** 2; }
  perimeter(): number { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
  constructor(color: string, public readonly width: number, public readonly height: number) {
    super(color);
  }
  area(): number      { return this.width * this.height; }
  perimeter(): number { return 2 * (this.width + this.height); }
}

// new Shape('red'); // Error — cannot instantiate abstract class

function printShapes(shapes: Shape[]): void {
  for (const s of shapes) console.log(s.describe()); // calls the abstract method polymorphically
}
printShapes([new Circle('blue', 5), new Rectangle('red', 3, 4)]);`,
    },
    {
      label: 'override Keyword',
      language: 'typescript',
      code: `class Animal {
  name: string;
  constructor(name: string) { this.name = name; }
  speak(): string { return \`\${this.name} makes a noise.\`; }
  toString(): string { return \`Animal(\${this.name})\`; }
}

class Dog extends Animal {
  override speak(): string {     // 'override' documents intent explicitly
    return \`\${this.name} barks.\`;
  }
  override toString(): string {
    return \`Dog(\${this.name})\`;
  }
}

// Without override — silent bug risk:
// If Animal.speak() is renamed to makeNoise(), Dog.speak() becomes a NEW method
// not an override — no error without 'override' keyword

// With noImplicitOverride: true in tsconfig:
class Cat extends Animal {
  speak(): string { // Error! Must use 'override' keyword explicitly
    return 'meow';
  }
}

// Override with property
class Base {
  readonly type: string = 'base';
}
class Derived extends Base {
  override readonly type: string = 'derived';
}`,
    },
    {
      label: 'Static Members & Mixins',
      language: 'typescript',
      code: `// Static members
class IdGenerator {
  private static nextId = 1;
  static generate(): number { return IdGenerator.nextId++; }
  static reset(): void      { IdGenerator.nextId = 1; }
}
console.log(IdGenerator.generate()); // 1
console.log(IdGenerator.generate()); // 2

// Singleton pattern using static
class AppConfig {
  private static _instance: AppConfig | null = null;
  private constructor(public readonly env: string) {}

  static getInstance(): AppConfig {
    return (AppConfig._instance ??= new AppConfig(process.env['NODE_ENV'] ?? 'development'));
  }
}
const cfg = AppConfig.getInstance();

// Mixin pattern — composable behavior
type Constructor<T = {}> = new (...args: any[]) => T;

function Serializable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    serialize(): string { return JSON.stringify(this); }
    static deserialize<T>(json: string): T { return JSON.parse(json) as T; }
  };
}

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
    updatedAt = new Date();
    touch() { this.updatedAt = new Date(); }
  };
}

class BaseEntity { constructor(public id: string) {} }
class User extends Timestamped(Serializable(BaseEntity)) {
  constructor(id: string, public name: string) { super(id); }
}

const u = new User('1', 'Alice');
u.serialize();  // JSON string
u.createdAt;    // Date`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'TypeScript private is not truly private at runtime',
      wrong: `class User {
  private password: string;
  constructor(pwd: string) { this.password = pwd; }
}
const u = new User('secret');
console.log((u as any).password); // 'secret' — TS private is bypassed at runtime!`,
      right: `class User {
  #password: string;  // JavaScript private field — truly private at runtime
  constructor(pwd: string) { this.#password = pwd; }
}
const u = new User('secret');
// (u as any).password; // undefined — # field not accessible via any`,
      explanation: 'TypeScript private is compile-time only — it is erased to a regular property in JavaScript. Use the # prefix for true runtime privacy, especially for security-sensitive data.',
    },
    {
      title: 'Forgetting super() call in derived class constructor',
      wrong: `class Animal { constructor(public name: string) {} }
class Dog extends Animal {
  constructor(name: string, public breed: string) {
    // this.breed = breed; // Error: 'super' must be called before accessing 'this'
    this.breed = breed; // Error!
    super(name);
  }
}`,
      right: `class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name); // Must be the first statement in a derived constructor
    // Can access 'this' after super()
  }
}`,
      explanation: 'In a derived class constructor, super() must be called before any reference to this. TypeScript (and JavaScript) enforce this — you cannot access this until the base class constructor has run.',
    },
    {
      title: 'Implementing interface vs extending class — interface does not check private members',
      wrong: `interface Shape { area(): number; color: string }
class Circle implements Shape {
  constructor(private color: string, private radius: number) {}
  area() { return Math.PI * this.radius ** 2; }
  // color is private — does it satisfy the interface?
  // YES — implements only checks public shape, so this compiles
  // but color is inaccessible as Shape!
}
const s: Shape = new Circle('red', 5);
s.color; // Error — 'color' property is private in the type 'Circle'`,
      right: `class Circle implements Shape {
  constructor(public color: string, private radius: number) {}
  area() { return Math.PI * this.radius ** 2; }
}
const s: Shape = new Circle('red', 5);
s.color; // 'red' — accessible via Shape interface`,
      explanation: 'When a class implements an interface, the interface members must be public — otherwise the instance cannot be used as the interface type. TypeScript catches this when you assign to the interface type.',
    },
    {
      title: 'Using class type parameter in a static method',
      wrong: `class Box<T> {
  static empty(): Box<T> { // Error — T is not available on static members
    return new Box();
  }
}`,
      right: `class Box<T> {
  static empty<T>(): Box<T> { // Static method declares its own T
    return new Box();
  }
}
Box.empty<string>(); // Box<string>`,
      explanation: 'Static members belong to the class constructor, not to instances. The class type parameter T is per-instance. Static methods that need a type parameter must declare their own with <T> on the method.',
    },
    {
      title: 'Overriding a method without the override keyword — silent rename bugs',
      wrong: `class Base { fetchData(): string { return 'base'; } }
class Child extends Base {
  fetchData(): string { return 'child'; } // Works — but no protection
}
// If Base renames fetchData() to loadData():
// Child.fetchData() becomes a NEW unrelated method — no compile error!`,
      right: `class Child extends Base {
  override fetchData(): string { return 'child'; }
  // If Base renames the method: Error — 'fetchData' in type 'Child' is not
  // a known override of any member in its base types.
}`,
      explanation: 'Without override, renaming a base class method leaves the subclass method silently orphaned as a new method. With override, TypeScript immediately errors when the base class method no longer exists.',
    },
    {
      title: 'abstract class not enforcing all abstract members in subclass',
      wrong: `abstract class Animal {
  abstract sound(): string;
  abstract habitat(): string;
}
class Fish extends Animal {
  sound() { return 'blub'; }
  // forgot habitat() — TypeScript errors here
}`,
      right: `class Fish extends Animal {
  override sound():   string { return 'blub'; }
  override habitat(): string { return 'ocean'; }
  // All abstract members implemented — no error
}`,
      explanation: 'TypeScript requires ALL abstract members to be implemented in concrete subclasses. Any missing implementation is a compile error. This is the main value of abstract classes — enforced contracts.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a typed observable store',
    language: 'typescript',
    description: 'Implement an abstract Store<TState> base class with: private state (# field for runtime privacy), abstract initialState(): TState, getState(): readonly version of TState, setState(partial: Partial<TState>): void, and subscribe(listener: (state: TState) => void): () => void (returns unsubscribe). Extend it with a concrete CartStore.',
    hints: [
      'Use #state: TState for runtime-private state and #listeners: Set<...> for subscribers',
      'abstract initialState(): TState forces each concrete store to define its default state',
      'getState() returns Readonly<TState> — callers cannot mutate state directly',
      'setState() merges partial state and notifies all listeners',
    ],
    starterCode: `interface CartItem { id: string; name: string; qty: number; price: number }
interface CartState { items: CartItem[]; discount: number; loading: boolean }

// TODO: implement abstract Store<TState>
// - abstract initialState(): TState
// - getState(): Readonly<TState>
// - setState(partial: Partial<TState>): void
// - subscribe(listener: (state: TState) => void): () => void (unsubscribe)

class CartStore extends Store<CartState> {
  // TODO: implement initialState()
  // Add: addItem(item: CartItem), removeItem(id: string), applyDiscount(pct: number)
}

const cart = new CartStore();
const unsub = cart.subscribe(state => console.log('Cart:', state.items.length));
cart.addItem({ id: '1', name: 'Shirt', qty: 2, price: 29.99 });
unsub(); // stop listening`,
    solution: `interface CartItem { id: string; name: string; qty: number; price: number }
interface CartState { items: CartItem[]; discount: number; loading: boolean }

abstract class Store<TState extends object> {
  #state: TState;
  #listeners = new Set<(state: TState) => void>();

  constructor() {
    this.#state = this.initialState();
  }

  abstract initialState(): TState;

  getState(): Readonly<TState> {
    return Object.freeze({ ...this.#state }) as Readonly<TState>;
  }

  protected setState(partial: Partial<TState>): void {
    this.#state = { ...this.#state, ...partial };
    for (const listener of this.#listeners) {
      listener(this.#state);
    }
  }

  subscribe(listener: (state: TState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state); // emit current state immediately
    return () => this.#listeners.delete(listener);
  }
}

class CartStore extends Store<CartState> {
  override initialState(): CartState {
    return { items: [], discount: 0, loading: false };
  }

  addItem(item: CartItem): void {
    const items = [...this.getState().items];
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      existing.qty += item.qty;
    } else {
      items.push(item);
    }
    this.setState({ items });
  }

  removeItem(id: string): void {
    this.setState({ items: this.getState().items.filter(i => i.id !== id) });
  }

  applyDiscount(pct: number): void {
    this.setState({ discount: Math.min(100, Math.max(0, pct)) });
  }

  get total(): number {
    const { items, discount } = this.getState();
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return subtotal * (1 - discount / 100);
  }
}

const cart = new CartStore();
const unsub = cart.subscribe(state => console.log('Cart items:', state.items.length));
cart.addItem({ id: '1', name: 'Shirt', qty: 2, price: 29.99 });
cart.applyDiscount(10);
console.log('Total:', cart.total.toFixed(2)); // 53.98
unsub();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between TypeScript `private` and JavaScript `#privateField`?',
      options: [
        'TypeScript private is stricter — it enforces privacy at runtime too',
        'TypeScript private is compile-time only; # is enforced at runtime and cannot be bypassed',
        'They are identical — just different syntax',
        '# can only be used with class fields, not methods',
      ],
      answer: 1,
      explanation: 'TypeScript private is erased at compile time — casting to any bypasses it. JavaScript # fields are enforced by the runtime itself — no cast can access them. Use # for true privacy.',
    },
    {
      q: 'What does `constructor(public readonly name: string)` do?',
      options: [
        'Only initialises name — does not declare a class member',
        'Declares a public readonly class member AND initialises it from the constructor argument in one line',
        'Makes name a static member',
        'Requires a separate this.name = name assignment',
      ],
      answer: 1,
      explanation: 'Parameter properties (public, private, protected, readonly on constructor params) are a TypeScript shorthand that both declares the class member and initialises it. The this.name = name assignment is generated automatically.',
    },
    {
      q: 'What is the purpose of the `abstract` keyword on a class?',
      options: [
        'It makes all methods optional',
        'It prevents the class from being instantiated directly and requires subclasses to implement abstract members',
        'It makes the class a singleton',
        'It removes the class from the JavaScript output',
      ],
      answer: 1,
      explanation: 'Abstract classes cannot be instantiated with new directly. They exist to be extended. Abstract methods have no implementation in the base class — concrete subclasses must implement all abstract members or TypeScript errors.',
    },
    {
      q: 'What does the `override` keyword protect against?',
      options: [
        'Prevents overriding base class methods',
        'Base class method being renamed or removed while the subclass silently becomes incorrect',
        'Accidental access to private members',
        'The derived class calling super() too early',
      ],
      answer: 1,
      explanation: 'Without override, if a base class method is renamed, the subclass method silently becomes an unrelated new method — a subtle bug. With override, TypeScript immediately errors if no matching method exists in the base class.',
    },
    {
      q: 'Can a static method use the class-level generic type parameter?',
      options: [
        'Yes — all members share the class type parameter',
        'No — static members belong to the class constructor, not instances; they must declare their own <T>',
        'Yes — but only in abstract classes',
        'No — static methods cannot be generic at all',
      ],
      answer: 1,
      explanation: 'The class type parameter is per-instance. Static members are on the class itself and are not associated with any particular instantiation. Static methods that need a type parameter must declare their own: static empty<T>(): Box<T>.',
    },
    {
      q: 'When must you call `super()` in a derived class constructor?',
      options: [
        'After setting all instance properties',
        'As the last statement in the constructor',
        'As the first statement — before any access to this',
        'Only if the base class has a non-default constructor',
      ],
      answer: 2,
      explanation: 'super() must be called before any access to this in a derived class constructor. TypeScript and JavaScript both enforce this. The base class constructor must run first to initialise the inherited state.',
    },
    {
      q: 'What is a mixin in TypeScript?',
      options: [
        'A type that combines two interfaces',
        'A function that takes a class and returns a new class with additional methods — enables composable behavior',
        'A static method that initialises class state',
        'An abstract method that merges two class hierarchies',
      ],
      answer: 1,
      explanation: 'A mixin is a function of the form function Serializable<TBase extends Constructor>(Base: TBase) { return class extends Base { ... } }. It takes a class as input and returns a new extended class. Multiple mixins can be composed: Timestamped(Serializable(BaseEntity)).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use an abstract class vs an interface?',
      a: 'Use an interface when you only need to define a structural contract — no shared implementation, no state. Use an abstract class when you need shared implementation (concrete methods), shared state (class fields), or constructor logic, AND you want to enforce some methods in subclasses. If you need both a shared base AND want classes to implement multiple "abilities", use an interface for the contract and a separate mixin for the shared behavior.',
    },
    {
      q: 'What is the difference between readonly and a getter without a setter?',
      a: 'readonly is a property modifier — the property is assigned in the constructor and cannot be reassigned. A getter without a setter is a computed property — it runs a function on every access. Use readonly for values set once and stored. Use a getter for values computed on demand or derived from other properties.',
    },
    {
      q: 'What happens if I do not call super() in a derived class?',
      a: 'TypeScript errors immediately: "Constructors for derived classes must contain a super call." The JavaScript runtime also throws a ReferenceError if you try to access this before super() returns. This is enforced both at the type level (TypeScript) and at runtime (JavaScript engine).',
    },
    {
      q: 'How does the mixin pattern avoid TypeScript type issues?',
      a: 'The key is the Constructor type alias: type Constructor<T = {}> = new (...args: any[]) => T. Mixin functions are constrained to this type: function Mixin<TBase extends Constructor>(Base: TBase). TypeScript then correctly types the returned class as an intersection of TBase and the new members. The ...args: any[] in the constructor signature allows mixins to work with any base class constructor.',
    },
    {
      q: 'Should I use class expressions or class declarations?',
      a: 'Use class declarations (class MyClass {}) for top-level named classes — they are hoisted and clearer. Use class expressions (const MyClass = class {}) when you need to return a class from a function (factory, mixin), assign it conditionally, or define it inline. Class expressions are also useful for anonymous classes in tests.',
    },
    {
      q: 'What is `noImplicitOverride` and should I enable it?',
      a: 'noImplicitOverride is a tsconfig compiler option that requires you to explicitly write override on any method that overrides a base class method. Without it, override is optional. Enabling it ensures all override relationships are documented and protected against base class renames. It is a good practice for larger codebases and is increasingly common in Angular and other framework projects.',
    },
    {
      q: 'Can I access a protected member from outside the class hierarchy?',
      a: 'No. protected members are accessible only within the class itself and in classes that extend it. External code — including sibling classes or unrelated code — cannot access protected members. If you need to allow external read access but prevent external write access, use a public getter backed by a private/protected field.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'TypeScript classes add access modifiers (public/private/protected) and readonly to JavaScript classes — private is compile-time only; # is runtime-enforced. Abstract classes define contracts with shared implementation; override prevents silent rename bugs.',
    mustKnow: [
      'TypeScript private is compile-time only — use # for true runtime privacy',
      'Parameter properties (constructor(public name: string)) declare + initialise in one line',
      'abstract class: cannot be instantiated; forces subclasses to implement abstract members',
      'override keyword: errors if the base class method is renamed or removed — use it',
      'super() must be the first statement in a derived constructor — before any this access',
      'Static members cannot use the class-level type parameter — declare a separate <T> on the static method',
      'Mixins: function(Base: Constructor) → new class extends Base { ... } for composable behavior',
    ],
    interviewFocus: [
      'What is the difference between TypeScript private and JavaScript # private fields?',
      'What are parameter properties and what do they eliminate?',
      'When would you use an abstract class instead of an interface?',
      'What does the override keyword protect against?',
      'How do you implement a mixin in TypeScript and what is the Constructor type alias?',
    ],
  };
}
