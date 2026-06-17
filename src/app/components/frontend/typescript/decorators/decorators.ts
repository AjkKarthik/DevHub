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
  selector: 'app-ts-decorators',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './decorators.html',
  styleUrl: './decorators.scss',
})
export class TsDecorators {
  quickRef: QuickRefItem[] = [
    { name: '@decorator',                type: 'decorator', desc: 'Applied to a class, method, accessor, field, or parameter — runs at class definition time' },
    { name: 'ClassDecorator',            type: 'type',      desc: 'TC39 Stage 3: receives class constructor, can return a replacement or undefined' },
    { name: 'MethodDecorator (TC39)',    type: 'type',      desc: 'Receives { kind, name, descriptor } — can wrap or replace the method' },
    { name: 'FieldDecorator (TC39)',     type: 'type',      desc: 'Receives { kind: "field", name } — returns an initializer function' },
    { name: 'AccessorDecorator (TC39)', type: 'type',       desc: 'Applied to auto-accessors (accessor keyword) — wraps get/set' },
    { name: 'experimentalDecorators',   type: 'keyword',   desc: 'tsconfig flag for legacy TS 4.x decorator syntax used by Angular and NestJS' },
    { name: 'accessor keyword',          type: 'keyword',  desc: 'TC39 Stage 3: creates a backing private field + auto getter/setter pair' },
    { name: 'Reflect.metadata',          type: 'method',   desc: 'Legacy: stores metadata at class-definition time; requires reflect-metadata polyfill' },
    { name: 'emitDecoratorMetadata',     type: 'keyword',  desc: 'tsconfig flag: emits type information for legacy decorators (used by Angular DI)' },
    { name: 'context.addInitializer',    type: 'method',   desc: 'TC39 API: register a function to run after the class is fully defined' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Two decorator systems — legacy vs TC39 Stage 3',
      points: [
        'TypeScript has two decorator systems. The <em>legacy</em> system (enabled with <code>experimentalDecorators: true</code>) was TypeScript\'s own proposal from ~2015. It is used by Angular, NestJS, MobX, and TypeORM. The <em>TC39 Stage 3</em> system (TypeScript 5.0+, no tsconfig flag needed) implements the JavaScript standard.',
        'The two systems are not compatible — a decorator written for one does not work with the other. The legacy system uses TypeScript-specific APIs (<code>PropertyDescriptor</code>, <code>Reflect.metadata</code>). The TC39 system uses a standard <code>context</code> object.',
        'Angular 15+ and NestJS still use the legacy system by default. When you see <code>experimentalDecorators: true</code> in tsconfig, you are using legacy decorators. New libraries and plain TypeScript projects should prefer TC39 decorators.',
        'This page covers both systems. The key facts about each are clearly labeled. In practice, choose based on what your framework uses — do not mix them in the same file.',
      ],
    },
    {
      heading: 'How decorators work — run at class definition time',
      points: [
        'A decorator is a function applied with the <code>@</code> prefix. It runs <em>once</em> when the class is defined (module load time), not when instances are created. This is a crucial distinction: decorator code runs at definition time, not construction time.',
        'Decorators can: (1) observe the decorated item (logging, validation metadata), (2) wrap the item (add behavior before/after a method), (3) replace the item entirely (return a new class or method).',
        'Decorator factories are functions that return a decorator: <code>@Log("debug")</code>. The outer function takes arguments and returns the actual decorator function. This allows configuration.',
        'Multiple decorators on the same target are applied bottom-up (innermost first): <code>@A @B method()</code> — B\'s decorator runs first, then A\'s. This is like function composition: <code>A(B(method))</code>.',
      ],
    },
    {
      heading: 'TC39 Stage 3 decorators (TypeScript 5.0+)',
      points: [
        'TC39 decorators receive the decorated value and a <em>context</em> object. The context has: <code>kind</code> ("class", "method", "field", "accessor", "getter", "setter"), <code>name</code> (the property name), <code>addInitializer(fn)</code> (run after class definition).',
        'A class decorator receives the class constructor and can return a subclass or undefined. A method decorator receives the method function and can return a replacement function.',
        'The <code>accessor</code> keyword (TC39 Stage 3) creates an auto-accessor: a private backing field + public getter/setter. Accessor decorators can wrap the get/set: <code>@accessor name: string</code>.',
        'TC39 decorators are stateless across instances by design — they receive no instance-specific information. Use <code>context.addInitializer</code> plus a WeakMap for per-instance state.',
      ],
    },
    {
      heading: 'Legacy decorators (experimentalDecorators: true)',
      points: [
        'Legacy method decorators receive <code>(target, propertyKey, descriptor)</code> — target is the prototype, descriptor is the PropertyDescriptor. Return a new descriptor or mutate it.',
        'Legacy class decorators receive the constructor function. Returning a new class replaces it. Used by Angular\'s <code>@Component</code>, <code>@Injectable</code>, <code>@NgModule</code>.',
        'Legacy property decorators receive <code>(target, propertyKey)</code> with no descriptor — you cannot wrap the property access directly. This is why <code>Reflect.metadata</code> is needed to store metadata for use by Angular\'s DI system.',
        'Legacy parameter decorators receive <code>(target, methodName, paramIndex)</code>. Combined with <code>emitDecoratorMetadata: true</code>, they enable Angular\'s constructor injection by type.',
      ],
    },
    {
      heading: 'Common decorator use cases',
      points: [
        '<strong>Logging</strong>: wrap a method to log arguments and return values. The decorator adds the logging layer without modifying the original method.',
        '<strong>Memoization</strong>: cache method results by arguments. The decorator wraps the method in a caching function, storing results in a Map or WeakMap keyed by arguments.',
        '<strong>Validation</strong>: store validation rules as metadata on class properties. A <code>validate(instance)</code> function reads the metadata and checks values. This is how class-validator works.',
        '<strong>Dependency injection</strong>: Angular and NestJS use decorators to declare injectable classes, mark constructor parameters for injection, and configure provider scope. Decorators are the backbone of framework-level DI without needing a build step.',
      ],
    },
    {
      heading: 'Reflect.metadata and emitDecoratorMetadata (legacy only)',
      points: [
        '<code>emitDecoratorMetadata: true</code> in tsconfig causes TypeScript to emit type information as Reflect.metadata calls. For example, a constructor parameter of type <code>UserService</code> emits metadata that stores the <code>UserService</code> constructor function — enabling Angular DI to inject the correct service.',
        '<code>Reflect.metadata</code> requires the <code>reflect-metadata</code> npm package (a polyfill). It is imported once at the entry point: <code>import "reflect-metadata"</code>.',
        'The TC39 decorator system does NOT use Reflect.metadata — it has a built-in mechanism for metadata (TC39 Decorator Metadata proposal, in progress). Until that proposal lands, per-class WeakMap or context.addInitializer are the alternatives.',
        'New projects should avoid Reflect.metadata unless using a framework (Angular, NestJS) that requires it. It is a heavyweight polyfill for a standard that is still evolving.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'TC39 Class & Method Decorators',
      language: 'typescript',
      code: `// TC39 Stage 3 — TypeScript 5.0+, no experimentalDecorators needed

// Method decorator — log calls
function log(target: Function, context: ClassMethodDecoratorContext) {
  const name = String(context.name);
  return function(this: unknown, ...args: unknown[]) {
    console.log(\`[\${name}] called with\`, args);
    const result = (target as Function).apply(this, args);
    console.log(\`[\${name}] returned\`, result);
    return result;
  };
}

// Class decorator — add a description property
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

  @log
  deposit(amount: number): number {
    this.balance += amount;
    return this.balance;
  }

  @log
  withdraw(amount: number): number {
    if (amount > this.balance) throw new Error('Insufficient funds');
    this.balance -= amount;
    return this.balance;
  }
}

const acc = new BankAccount(100);
acc.deposit(50);   // [deposit] called with [50] → [deposit] returned 150
acc.withdraw(30);  // [withdraw] called with [30] → [withdraw] returned 120`,
    },
    {
      label: 'TC39 Field & Accessor Decorators',
      language: 'typescript',
      code: `// Field decorator — validate on set (TC39 Stage 3)
function range(min: number, max: number) {
  return function(_target: undefined, context: ClassFieldDecoratorContext) {
    return function(this: unknown, value: number) {
      if (value < min || value > max) {
        throw new RangeError(
          \`\${String(context.name)} must be between \${min} and \${max}\`
        );
      }
      return value;
    };
  };
}

// accessor keyword — creates backing field + getter/setter pair
function readonly<T>(
  target: ClassAccessorDecoratorTarget<unknown, T>,
  context: ClassAccessorDecoratorContext
): ClassAccessorDecoratorResult<unknown, T> {
  return {
    get(this: unknown) { return target.get.call(this); },
    set(_value: T)     { throw new Error(\`\${String(context.name)} is readonly\`); },
  };
}

class Temperature {
  @range(-273.15, 1e9)
  celsius: number = 0;

  @readonly
  accessor label: string = 'Temperature';
}

const t = new Temperature();
t.celsius = 100;   // OK
// t.celsius = -300; // RangeError: celsius must be between -273.15 and 1000000000
// t.label = 'x';    // Error: label is readonly`,
    },
    {
      label: 'context.addInitializer & WeakMap',
      language: 'typescript',
      code: `// Per-instance state in TC39 decorators
// Decorators run once at class definition — use WeakMap for per-instance data

function memoize(_target: Function, context: ClassMethodDecoratorContext) {
  const cache = new WeakMap<object, Map<string, unknown>>();

  context.addInitializer(function(this: object) {
    // 'this' is the instance — runs after the class is constructed
    if (!cache.has(this)) cache.set(this, new Map());
  });

  return function(this: object, ...args: unknown[]) {
    const instanceCache = cache.get(this)!;
    const key = JSON.stringify(args);
    if (instanceCache.has(key)) return instanceCache.get(key);
    const result = (_target as Function).apply(this, args);
    instanceCache.set(key, result);
    return result;
  };
}

class Calculator {
  @memoize
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}

const calc = new Calculator();
console.log(calc.fibonacci(40)); // fast — memoized per instance`,
    },
    {
      label: 'Legacy Decorators (experimentalDecorators)',
      language: 'typescript',
      code: `// Legacy — requires experimentalDecorators: true in tsconfig
// Used by Angular, NestJS, TypeORM

// Legacy method decorator
function LegacyLog(target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const original = descriptor.value as (...args: unknown[]) => unknown;
  descriptor.value = function(this: unknown, ...args: unknown[]) {
    console.log(\`\${key} called\`);
    return original.apply(this, args);
  };
  return descriptor;
}

// Legacy class decorator — replace the class
function Singleton<T extends new (...args: unknown[]) => unknown>(ctor: T): T {
  let instance: InstanceType<T>;
  return class extends ctor {
    constructor(...args: unknown[]) {
      if (instance) return instance;
      super(...args);
      instance = this as InstanceType<T>;
    }
  } as T;
}

@Singleton
class Database {
  private readonly connectionId = Math.random();
  query(sql: string): string { return \`[conn:\${this.connectionId}] \${sql}\`; }
}

// Decorator factory — with configuration
function Retry(times: number) {
  return function(target: object, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value as (...args: unknown[]) => unknown;
    descriptor.value = async function(this: unknown, ...args: unknown[]) {
      let lastErr: unknown;
      for (let i = 0; i <= times; i++) {
        try { return await original.apply(this, args); }
        catch (e) { lastErr = e; if (i < times) await new Promise(r => setTimeout(r, 100 * (i + 1))); }
      }
      throw lastErr;
    };
    return descriptor;
  };
}`,
    },
    {
      label: 'Angular-style Decorators (Legacy)',
      language: 'typescript',
      code: `// Understanding Angular decorators — legacy style with metadata

// Simplified @Injectable — marks a class for DI
function Injectable(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('injectable', true, target);
  };
}

// Simplified @Inject — marks constructor param for injection
function Inject(token: unknown): ParameterDecorator {
  return (target, _key, index) => {
    const existing = Reflect.getMetadata('inject:params', target) ?? [];
    existing[index] = token;
    Reflect.defineMetadata('inject:params', existing, target);
  };
}

// Very simplified DI container
class Container {
  private registry = new Map<unknown, unknown>();
  register(token: unknown, value: unknown) { this.registry.set(token, value); }
  resolve<T>(ctor: new (...args: unknown[]) => T): T {
    const params: unknown[] = Reflect.getMetadata('inject:params', ctor) ?? [];
    const resolved = params.map(t => this.registry.get(t));
    return new ctor(...resolved);
  }
}

const DB_TOKEN = Symbol('DB');
@Injectable()
class UserService {
  constructor(@Inject(DB_TOKEN) private db: { query: (s: string) => string }) {}
  getUser(id: string) { return this.db.query(\`SELECT * FROM users WHERE id='\${id}'\`); }
}

const container = new Container();
container.register(DB_TOKEN, { query: (s: string) => s });
const svc = container.resolve(UserService);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mixing TC39 and legacy decorator syntax',
      wrong: `// tsconfig has experimentalDecorators: true (legacy mode)
// But writing TC39 decorator signature:
function log(target: Function, context: ClassMethodDecoratorContext) { /* TC39 */ }
class A { @log method() {} } // Error — wrong signature for legacy mode`,
      right: `// Legacy mode: (target, key, descriptor) signature
function log(target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const orig = descriptor.value;
  descriptor.value = function(...args: unknown[]) { console.log(key); return orig.apply(this, args); };
  return descriptor;
}

// TC39 mode (TS 5+, no experimentalDecorators): context object
function log2(target: Function, context: ClassMethodDecoratorContext) {
  return function(this: unknown, ...args: unknown[]) { console.log(String(context.name)); return (target as Function).apply(this, args); };
}`,
      explanation: 'TC39 and legacy decorators have completely different function signatures. Check whether experimentalDecorators is true in tsconfig — if so, use legacy signatures. If not (TypeScript 5+ default), use TC39 context-object signatures.',
    },
    {
      title: 'Expecting decorators to run on every instantiation',
      wrong: `function track(target: Function, context: ClassMethodDecoratorContext) {
  console.log('Decorator running!'); // This runs ONCE at class definition
  return function(this: unknown, ...args: unknown[]) {
    // This inner function runs on every call
    return (target as Function).apply(this, args);
  };
}
// "Decorator running!" appears once when the module loads, not per new instance`,
      right: `// Separate class-definition-time logic from per-call logic:
function track(target: Function, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name);
  // This runs ONCE at class definition:
  console.log(\`Tracking enabled for \${methodName}\`);

  // This wrapper runs on every call:
  return function(this: unknown, ...args: unknown[]) {
    console.log(\`\${methodName} called\`);
    return (target as Function).apply(this, args);
  };
}`,
      explanation: 'The decorator function itself runs once when the class is defined (module load). The function it returns runs on every method call. Keep expensive setup outside the returned wrapper.',
    },
    {
      title: 'Mutating the descriptor in-place without returning it (legacy)',
      wrong: `function log(target: object, key: string, descriptor: PropertyDescriptor) {
  const orig = descriptor.value;
  descriptor.value = function(...args: unknown[]) {
    console.log(key);
    return orig.apply(this, args);
  };
  // forgot to return descriptor!
}`,
      right: `function log(target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const orig = descriptor.value;
  descriptor.value = function(this: unknown, ...args: unknown[]) {
    console.log(key);
    return orig.apply(this, args);
  };
  return descriptor; // must return the modified descriptor
}`,
      explanation: 'In legacy method decorators, if you return undefined, TypeScript uses the original descriptor. Always return the descriptor (or a new one) to apply your changes.',
    },
    {
      title: 'Forgetting to preserve `this` with arrow functions in legacy decorators',
      wrong: `function log(target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const orig = descriptor.value;
  descriptor.value = (...args: unknown[]) => { // arrow function — captures wrong 'this'!
    console.log(key);
    return orig.apply(this, args); // 'this' is the decorator scope, not the instance!
  };
  return descriptor;
}`,
      right: `function log(target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const orig = descriptor.value;
  descriptor.value = function(this: unknown, ...args: unknown[]) { // regular function
    console.log(key);
    return orig.apply(this, args); // 'this' is the instance
  };
  return descriptor;
}`,
      explanation: 'Arrow functions capture `this` from their enclosing scope (the decorator function body). Use a regular function expression in the descriptor replacement so that `this` refers to the class instance at call time.',
    },
    {
      title: 'Using class-level generic type parameter in decorator targets (legacy)',
      wrong: `class Repository<T> {
  @cache
  async findById(id: string): Promise<T> { /* ... */ return {} as T; }
}
// The decorator sees the method as (...args: any[]) => Promise<unknown>
// TypeScript does not pass T to the decorator at runtime — T is erased`,
      right: `// Decorators cannot access generic type parameters — they are erased
// Instead, pass the type info via a factory argument:
function cache(ttl: number) {
  return function(target: object, key: string, descriptor: PropertyDescriptor) {
    // ttl is available; type information is not — work with unknown
    return descriptor;
  };
}
class Repository<T> {
  @cache(60_000)
  async findById(id: string): Promise<T> { return {} as T; }
}`,
      explanation: 'TypeScript generics are erased at runtime. Decorators run at runtime and cannot access the generic type parameter. If you need type information in a decorator, pass it explicitly as a factory argument or use Reflect.metadata with a concrete type token.',
    },
    {
      title: 'Stacking decorators without understanding order',
      wrong: `// Expecting A to run first (top to bottom):
@A @B @C
class Foo {}
// Actual order: C is evaluated first, then B, then A
// But APPLICATION order: A wraps B wraps C (outermost is A)`,
      right: `// Decorators evaluate bottom-up, apply outermost-first:
// @A @B @C class => A(B(C(Foo)))
// For methods: @A @B method() => A wraps B wraps original
// Think of it as function composition: A(B(original))
// The decorator closest to the method definition runs innermost`,
      explanation: 'Multiple decorators on the same target evaluate top-down (A, B, C) but are applied bottom-up (C first, then B, then A). The result is like function composition: A(B(C(target))). Always test the order when combining decorators.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a @validate decorator system',
    language: 'typescript',
    description: 'Implement a validation decorator system with: @MinLength(n), @MaxLength(n), and @Pattern(regex) field decorators that store rules as metadata. Then implement a validate(instance) function that reads the metadata and returns an array of error messages. Use TC39 decorator style (context object).',
    hints: [
      'Store validation rules in a Map<string, Rule[]> keyed by property name — use a WeakMap<Class, Map<string, Rule[]>> for the metadata store',
      'Each field decorator uses context.addInitializer to register the property name and rule',
      'The validate(instance) function iterates the metadata map and checks each property value',
      'Return string[] of error messages — empty array means valid',
    ],
    starterCode: `// TODO: implement @MinLength, @MaxLength, @Pattern decorators (TC39 style)
// TODO: implement validate(instance): string[]

class UserForm {
  @MinLength(2)
  @MaxLength(50)
  name: string = '';

  @Pattern(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)
  email: string = '';

  @MinLength(8)
  password: string = '';
}

const form = new UserForm();
form.name = 'A';
form.email = 'not-an-email';
form.password = 'short';

const errors = validate(form);
// ['name must be at least 2 characters',
//  'email does not match required pattern',
//  'password must be at least 8 characters']`,
    solution: `type Rule =
  | { type: 'minLength'; min: number }
  | { type: 'maxLength'; max: number }
  | { type: 'pattern';   regex: RegExp };

const metadata = new WeakMap<object, Map<string, Rule[]>>();

function getRules(target: object, field: string): Rule[] {
  let classMap = metadata.get(target.constructor);
  if (!classMap) { classMap = new Map(); metadata.set(target.constructor, classMap); }
  let rules = classMap.get(field);
  if (!rules) { rules = []; classMap.set(field, rules); }
  return rules;
}

function MinLength(min: number) {
  return (_: undefined, context: ClassFieldDecoratorContext) => {
    context.addInitializer(function(this: object) {
      getRules(this, String(context.name)).push({ type: 'minLength', min });
    });
  };
}

function MaxLength(max: number) {
  return (_: undefined, context: ClassFieldDecoratorContext) => {
    context.addInitializer(function(this: object) {
      getRules(this, String(context.name)).push({ type: 'maxLength', max });
    });
  };
}

function Pattern(regex: RegExp) {
  return (_: undefined, context: ClassFieldDecoratorContext) => {
    context.addInitializer(function(this: object) {
      getRules(this, String(context.name)).push({ type: 'pattern', regex });
    });
  };
}

function validate(instance: object): string[] {
  const errors: string[] = [];
  const classMap = metadata.get(instance.constructor);
  if (!classMap) return errors;

  for (const [field, rules] of classMap) {
    const value = (instance as Record<string, unknown>)[field];
    const str = typeof value === 'string' ? value : String(value ?? '');
    for (const rule of rules) {
      if (rule.type === 'minLength' && str.length < rule.min)
        errors.push(\`\${field} must be at least \${rule.min} characters\`);
      if (rule.type === 'maxLength' && str.length > rule.max)
        errors.push(\`\${field} must be at most \${rule.max} characters\`);
      if (rule.type === 'pattern' && !rule.regex.test(str))
        errors.push(\`\${field} does not match required pattern\`);
    }
  }
  return errors;
}

class UserForm {
  @MinLength(2) @MaxLength(50) name: string = '';
  @Pattern(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/) email: string = '';
  @MinLength(8) password: string = '';
}

const form = new UserForm();
form.name = 'A'; form.email = 'not-an-email'; form.password = 'short';
console.log(validate(form));
// ['name must be at least 2 characters',
//  'email does not match required pattern',
//  'password must be at least 8 characters']`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When does a class decorator function run?',
      options: [
        'Every time a new instance is created',
        'Once when the class is defined (module load time)',
        'When the first method is called on an instance',
        'When the class is imported',
      ],
      answer: 1,
      explanation: 'Decorators run once at class definition time — when the class statement is evaluated by the JavaScript engine. This is typically at module load. They do not run per instance creation.',
    },
    {
      q: 'What is the difference between TC39 and legacy (experimentalDecorators) decorators?',
      options: [
        'TC39 decorators are faster at runtime',
        'They use different function signatures — TC39 uses a context object; legacy uses (target, key, descriptor)',
        'Legacy decorators are deprecated and will be removed',
        'TC39 decorators require experimentalDecorators: true',
      ],
      answer: 1,
      explanation: 'The two systems have incompatible APIs. TC39 decorators (TS 5+) use a context object with kind, name, and addInitializer. Legacy decorators use TypeScript-specific (target, key, descriptor) parameters. Do not mix them.',
    },
    {
      q: 'Why should you use a regular function (not an arrow function) in a legacy method descriptor replacement?',
      options: [
        'Arrow functions cannot be assigned to descriptor.value',
        'Arrow functions capture this from the decorator scope, not from the calling instance',
        'Regular functions are faster in descriptors',
        'TypeScript requires regular functions in descriptors',
      ],
      answer: 1,
      explanation: 'Arrow functions capture this lexically — from the decorator function scope. In a descriptor replacement, you need this to be the class instance at call time. Regular functions get their this from the call site.',
    },
    {
      q: 'In what order are multiple decorators on the same method applied?',
      options: [
        'Top-down — @A @B applies A first, then B',
        'Bottom-up — @A @B applies B first (innermost), then A wraps it',
        'Alphabetically by decorator name',
        'Randomly — the order is not guaranteed',
      ],
      answer: 1,
      explanation: 'Multiple decorators evaluate top-down but are applied bottom-up. @A @B method is equivalent to A(B(method)). The decorator closest to the target (B) wraps the original; A wraps the result of B.',
    },
    {
      q: 'What is `emitDecoratorMetadata` used for?',
      options: [
        'Enables TC39 decorators in TypeScript 5',
        'Causes TypeScript to emit type information as Reflect.metadata calls — used by Angular DI for constructor injection',
        'Enables experimental accessor keyword support',
        'Allows decorators to access generic type parameters at runtime',
      ],
      answer: 1,
      explanation: 'emitDecoratorMetadata: true in tsconfig causes tsc to emit type annotations as Reflect.metadata calls. Angular DI uses this to determine what types to inject for constructor parameters without explicit tokens.',
    },
    {
      q: 'What does `context.addInitializer` do in TC39 decorators?',
      options: [
        'Runs the function immediately when the decorator is applied',
        'Registers a function to run after each class instantiation',
        'Registers a function to run after the class is fully defined — before any instances are created',
        'Adds a constructor parameter to the class',
      ],
      answer: 2,
      explanation: 'context.addInitializer registers a callback that runs after the class is fully defined (all decorators applied) but before any instances are created. Inside the callback, this refers to the class or prototype depending on context.',
    },
    {
      q: 'Can decorators access TypeScript generic type parameters at runtime?',
      options: [
        'Yes — via Reflect.metadata and emitDecoratorMetadata',
        'Yes — via context.name in TC39 decorators',
        'No — TypeScript generics are erased at compile time; decorators run at runtime with no type info',
        'Yes — but only for class decorators, not method decorators',
      ],
      answer: 2,
      explanation: 'TypeScript generic type parameters are compile-time constructs — they are completely erased in the JavaScript output. Decorators run at runtime and see no trace of generics. Pass type information explicitly via factory arguments or concrete token symbols.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use TC39 or legacy decorators for a new project?',
      a: 'If you are using Angular or NestJS: use legacy decorators (experimentalDecorators: true) — these frameworks require them. If you are writing plain TypeScript or a new library: use TC39 decorators (TypeScript 5+, no flag needed) — they are the JavaScript standard. Do not use both in the same project.',
    },
    {
      q: 'Why do decorators run at class definition time, not at instantiation?',
      a: 'Decorators modify the class or its prototype — they transform the shape of the class itself, not individual instances. This is evaluated once when the JavaScript engine loads the class definition. Running once at definition and wrapping methods means the wrapper applies to all future instances automatically without re-running the decorator logic.',
    },
    {
      q: 'How does Angular use decorators for dependency injection?',
      a: 'With emitDecoratorMetadata: true, TypeScript emits the constructor parameter types as Reflect.metadata. Angular\'s DI system reads this metadata at runtime to know what service class to inject. @Injectable() marks a class as injectable. @Component() registers the class as a component with metadata (selector, template, etc.). @Inject(TOKEN) overrides the type-based injection with a specific token.',
    },
    {
      q: 'How do I share state between decorator instances for the same class?',
      a: 'Use a WeakMap keyed by the class constructor or by instances. A WeakMap does not prevent garbage collection and allows per-class or per-instance storage without memory leaks. In TC39 decorators, use context.addInitializer to access this (the instance) when storing instance-level data.',
    },
    {
      q: 'Can decorators be applied to plain functions (not class methods)?',
      a: 'No — decorators are a class feature. They can be applied to classes, class methods, class fields, accessors, and (in legacy mode) constructor parameters. Standalone functions cannot have decorators. If you want to decorate a plain function, write a higher-order function manually: const logged = logWrapper(myFn).',
    },
    {
      q: 'What is the accessor keyword and when would I use it?',
      a: 'The accessor keyword (TC39 Stage 3, TypeScript 4.9+) creates an auto-accessor: a private backing field combined with a public getter and setter. accessor name: string is roughly equivalent to #name: string + get name() { return this.#name } + set name(v) { this.#name = v }. It is designed to work with accessor decorators, which can intercept get and set operations.',
    },
    {
      q: 'What is the Reflect.metadata polyfill and do I still need it?',
      a: 'Reflect.metadata is a Stage 1 TC39 proposal polyfilled by the reflect-metadata npm package. It provides a key-value store attached to class constructors. Angular and NestJS use it (via emitDecoratorMetadata) for DI. New TC39 decorator specs have their own metadata approach (TC39 Decorator Metadata, separately progressing). For new non-framework code, you do not need reflect-metadata — use WeakMap for decorator storage instead.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Decorators are functions applied with @ that run once at class definition time — TC39 (TS 5+) uses a context object; legacy (experimentalDecorators) uses (target, key, descriptor). They wrap, observe, or replace class members without modifying source code.',
    mustKnow: [
      'TC39 decorators (TS 5+): context object with kind/name/addInitializer — no tsconfig flag needed',
      'Legacy decorators (experimentalDecorators): (target, key, descriptor) — required for Angular/NestJS',
      'Decorators run ONCE at class definition, not per instance creation',
      'Multiple decorators apply bottom-up: @A @B method ≡ A(B(method))',
      'Use regular functions (not arrows) in legacy descriptor replacements — arrow captures wrong this',
      'Generic type parameters are erased at runtime — decorators cannot access them',
      'context.addInitializer registers a callback to run after class definition, before instantiation',
    ],
    interviewFocus: [
      'When does a decorator run — at definition or at instantiation?',
      'What is the difference between TC39 and legacy TypeScript decorators?',
      'Why must you use regular functions (not arrows) in legacy descriptor replacements?',
      'In what order are multiple decorators on the same target applied?',
      'How does Angular\'s dependency injection use decorators and emitDecoratorMetadata?',
    ],
  };
}
