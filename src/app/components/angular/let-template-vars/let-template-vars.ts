import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-let-template-vars',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent,
  ],
  templateUrl: './let-template-vars.html',
  styleUrl: './let-template-vars.scss',
})
export class LetTemplateVarsDemo {

  prerequisites: Prerequisite[] = [
    { label: 'Template Syntax', route: '/angular/templates' },
    { label: 'Signals & State', route: '/angular/counter' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '@let name = expr',          type: 'syntax',   desc: 'Declare a template-local variable equal to expr — re-evaluated on each change detection', since: 'Angular 18' },
    { name: '@let total = items().length', type: 'syntax', desc: 'Assign a signal call result — avoids calling the same signal multiple times in the template', since: 'Angular 18' },
    { name: '@let user = user$ | async',  type: 'syntax',  desc: 'Unwrap an Observable with async pipe and give the result a name', since: 'Angular 18' },
    { name: 'block scope',               type: 'syntax',   desc: '@let is scoped to its enclosing template block — not visible outside @if, @for, etc.', since: 'Angular 18' },
    { name: 'read-only',                 type: 'syntax',   desc: '@let variables cannot be assigned to after declaration — they are template constants', since: 'Angular 18' },
    { name: 'multiple per block',        type: 'syntax',   desc: 'Multiple @let declarations in the same block are allowed and independent', since: 'Angular 18' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What @let does and why it exists',
      points: [
        '<code>@let</code> (Angular 18+) lets you declare a named local variable inside a template, bound to any expression. It is evaluated during change detection — every time the template re-runs, the variable gets the current value of the expression.',
        'Before <code>@let</code>, the only way to avoid repeating complex expressions in templates was to add computed properties to the component class. That scattered template-local logic into the TS file, polluting the class with properties that were only used in one part of one template.',
        'Common use cases: caching a signal call result, naming the result of an async pipe, naming a derived computation to avoid repetition, and storing the result of a method call used multiple times in the same template block.',
        '<code>@let</code> is not a signal or a reactive primitive — it is just a template variable that gets re-assigned every change detection cycle. Do not confuse it with <code>signal()</code> or <code>computed()</code>.',
      ],
    },
    {
      heading: 'Syntax and scoping rules',
      points: [
        'The syntax is <code>@let name = expression;</code> — semicolon required. The expression can be any valid Angular template expression: signal calls, pipe results, method calls, arithmetic, ternary operators.',
        '<code>@let</code> is <strong>block-scoped</strong>: a variable declared inside <code>@if</code>, <code>@for</code>, or <code>@switch</code> is not accessible outside that block. This mirrors JavaScript\'s <code>const</code> scoping rules.',
        'Variables are declared in the order they appear. You cannot reference a later-declared <code>@let</code> from an earlier one in the same block.',
        '<code>@let</code> variables are <strong>read-only</strong> in the template — you cannot write <code>@let total = total + 1</code> inside an event binding. They are effectively template constants for each change detection cycle.',
      ],
    },
    {
      heading: 'Caching signal calls and async pipe results',
      points: [
        'The primary motivating use case: when you call <code>items()</code> (a signal) three times in the same template, Angular evaluates the signal three times. <code>@let items = items();</code> reads it once and reuses the result.',
        'Similarly, <code>@let user = user$ | async</code> unwraps the observable once and gives the result a meaningful name. Without <code>@let</code>, you had to use <code>*ngIf="user$ | async as user"</code> — which wrapped all consuming markup in the if-block.',
        'The <code>as</code> pattern from <code>@if (cond; as result)</code> still works, but <code>@let</code> is more flexible: you can declare variables independently of control flow, use them anywhere in the enclosing block, and declare multiple variables at the top of the block.',
        'For complex computed values that depend on multiple signals, <code>@let</code> can inline a computed expression that would otherwise require a separate <code>computed()</code> in the TS class.',
      ],
    },
    {
      heading: 'When to use @let vs computed() vs a class property',
      points: [
        'Use <code>@let</code> when the derived value is <strong>template-only</strong> — it is never accessed from the TS class, never tested independently, and only used in one block of one template. Adding a class property for it would pollute the API.',
        'Use <code>computed()</code> when the derived value is used in the TS class logic (e.g., checked in a method), needs to be accessed from multiple templates, or benefits from memoisation that persists across change detection cycles. <code>computed()</code> only recomputes when its signals change; <code>@let</code> recomputes every change detection cycle.',
        'Use a class property when the value is not reactive — a static transform, a fixed mapping, or a value that only changes via explicit user action.',
        'Rule of thumb: "if the expression belongs in the template and is only used in the template, put it in <code>@let</code>". If it\'s logic, put it in <code>computed()</code> or a service.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic @let usage',
      language: 'html',
      code: `<!-- Avoid repeating a signal call three times -->
<!-- ❌ Before @let -->
<div>Total: {{ items().length }}</div>
<div>Empty: {{ items().length === 0 }}</div>
<button [disabled]="items().length === 0">Submit</button>

<!-- ✅ After @let — call signal once, use the name -->
@let count = items().length;
<div>Total: {{ count }}</div>
<div>Empty: {{ count === 0 }}</div>
<button [disabled]="count === 0">Submit</button>

<!-- Complex computed expression inline -->
@let discountedTotal = cartItems().reduce((sum, i) => sum + i.price * (1 - i.discount), 0);
<p>You pay: {{ discountedTotal | currency }}</p>

<!-- Derived boolean -->
@let isAdmin = currentUser().roles.includes('admin');
@if (isAdmin) {
  <app-admin-panel />
}
<nav [class.admin-nav]="isAdmin">...</nav>`,
    },
    {
      label: 'Async pipe + @let (replacing *ngIf as)',
      language: 'html',
      code: `<!-- ❌ Old pattern: async as requires wrapping in @if -->
@if (user$ | async; as user) {
  <h2>Hello, {{ user.name }}</h2>
  <p>{{ user.email }}</p>
  <!-- Everything that uses 'user' must be inside this @if block -->
}

<!-- ✅ @let — declare at block top, use anywhere in the block -->
@let user = currentUser$ | async;

@if (user) {
  <h2>Hello, {{ user.name }}</h2>
}

<!-- Can also use outside the @if since @let is in the parent scope -->
<footer>Logged in as: {{ user?.email }}</footer>

<!-- Multiple async unwraps -->
@let profile = profile$ | async;
@let settings = settings$ | async;

@if (profile && settings) {
  <app-dashboard [profile]="profile" [settings]="settings" />
}`,
    },
    {
      label: 'Scoping inside @for and @if',
      language: 'html',
      code: `<!-- @let inside @for — scoped to each iteration -->
@for (order of orders(); track order.id) {
  @let total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  @let isLarge = total > 1000;
  @let statusClass = order.status === 'shipped' ? 'green' : 'orange';

  <div class="order" [class.order--large]="isLarge">
    <span [class]="statusClass">{{ order.status }}</span>
    <span>{{ total | currency }}</span>
    @if (isLarge) {
      <span class="badge">Large Order</span>
    }
  </div>
  <!-- total, isLarge, statusClass are NOT accessible outside this @for iteration -->
}

<!-- @let inside @if — scoped to the if block -->
@if (selectedItem()) {
  @let item = selectedItem()!;
  @let taxedPrice = item.price * 1.2;

  <h3>{{ item.name }}</h3>
  <p>Price with tax: {{ taxedPrice | currency }}</p>
}
<!-- item and taxedPrice are NOT accessible here -->`,
    },
    {
      label: 'Replacing class pollution with @let',
      language: 'typescript',
      code: `// ❌ Before @let — class properties only used in the template
@Component({ ... })
export class CartComponent {
  items = this.cartService.items;

  // These 4 getters exist solely to avoid repeating template expressions
  get itemCount() { return this.items().length; }
  get isEmpty()   { return this.itemCount === 0; }
  get subtotal()  { return this.items().reduce((s, i) => s + i.price * i.qty, 0); }
  get tax()       { return this.subtotal * 0.2; }
  get total()     { return this.subtotal + this.tax; }
  // (total is used in the template but also submitted to an API — keep that one)

  constructor(private cartService: CartService) {}
}`,
    },
    {
      label: 'Replacing class pollution with @let (template)',
      language: 'html',
      code: `<!-- ✅ After @let — only logic that belongs in TS stays in TS -->
<!-- component.ts has NO extra getters -->
@let count    = items().length;
@let isEmpty  = count === 0;
@let subtotal = items().reduce((sum, i) => sum + i.price * i.qty, 0);
@let tax      = subtotal * 0.2;
@let total    = subtotal + tax;  <!-- total still in @let if only used in template -->

<h2>Cart ({{ count }} items)</h2>

@if (isEmpty) {
  <p>Your cart is empty.</p>
} @else {
  @for (item of items(); track item.id) {
    <div>{{ item.name }} — {{ item.price * item.qty | currency }}</div>
  }
  <hr />
  <div>Subtotal: {{ subtotal | currency }}</div>
  <div>Tax (20%): {{ tax | currency }}</div>
  <strong>Total: {{ total | currency }}</strong>
  <button (click)="checkout(total)">Checkout</button>
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using @let outside the block it was declared in',
      wrong: `@if (user()) {
  @let name = user()!.name;
}
<!-- ❌ name is not in scope here — template compile error -->
<p>{{ name }}</p>`,
      right: `<!-- Move @let to the outer scope if you need it outside the if -->
@let name = user()?.name ?? 'Guest';
@if (user()) {
  <p>Logged in: {{ name }}</p>
}
<p>Hello, {{ name }}</p>  <!-- ✓ — @let is in the outer scope -->`,
      explanation: '@let is block-scoped like const. A @let declared inside @if, @for, or @switch is only visible inside that block. Declare it in the nearest enclosing scope where all consumers live.',
    },
    {
      title: 'Using @let for values that need memoisation — should be computed()',
      wrong: `<!-- @let recomputes on EVERY change detection cycle
     If filteredItems() is expensive, use computed() in the class instead -->
@let filtered = allItems().filter(i => i.price > minPrice() && i.category === activeCategory());`,
      right: `// In the component class — computed() only recomputes when signals change
filteredItems = computed(() =>
  this.allItems().filter(i => i.price > this.minPrice() && i.category === this.activeCategory())
);

<!-- In template — reads the memoised computed signal -->
@for (item of filteredItems(); track item.id) { ... }`,
      explanation: '@let recomputes on every change detection cycle (even if its inputs did not change). computed() is memoised — it only recomputes when its tracked signals change. Use computed() for expensive derived values.',
    },
    {
      title: 'Trying to assign to a @let variable in an event handler',
      wrong: `@let count = 0;
<button (click)="count = count + 1">  <!-- ❌ compile error — @let is read-only -->
  Clicked {{ count }} times
</button>`,
      right: `<!-- Use a signal in the class for mutable state -->
// In .ts: clickCount = signal(0);

@let count = clickCount();
<button (click)="clickCount.update(n => n + 1)">
  Clicked {{ count }} times
</button>`,
      explanation: '@let variables are read-only — they represent the current value of an expression, not mutable state. For mutable state, use a signal in the component class and read it via @let if you want to name it.',
    },
    {
      title: 'Using @let instead of the @if (expr; as alias) pattern when narrowing is needed',
      wrong: `<!-- @let does NOT narrow types — user could still be null after this -->
@let user = maybeUser();
{{ user.name }}  <!-- TS error in strict mode: user might be null -->`,
      right: `<!-- Option 1: @if narrows the type -->
@if (maybeUser(); as user) {
  {{ user.name }}  <!-- user is narrowed to non-null inside the block -->
}

<!-- Option 2: @let + null guard -->
@let user = maybeUser();
@if (user) {
  {{ user.name }}  <!-- type narrowed inside @if even with @let -->
}`,
      explanation: '@let does not narrow TypeScript types. If the expression can be null or undefined, you still need @if to narrow the type before accessing properties. Use @if (expr; as alias) for the combined null-check + naming pattern.',
    },
  ];

  challenge: Challenge = {
    title: 'Refactor a verbose template using @let',
    language: 'html',
    description: `Given this verbose template with repeated signal calls and long expressions, refactor it using @let to:
1. Call each signal at most once per block
2. Name complex derived values (totals, classes, boolean flags)
3. Keep the template readable with @let declarations at the top of each block

The template uses: products() signal (array), cart() signal (array), activeFilter() signal (string)`,
    hints: [
      '@let filteredProducts = products().filter(p => p.category === activeFilter());',
      '@let cartCount = cart().length; reduces the signal call',
      '@let totalPrice = cart().reduce((s, i) => s + i.price, 0); names the computation',
      '@let isEmpty = cartCount === 0; is cleaner than repeating the condition',
      'Put @let declarations at the top of the scope where they are used',
    ],
    starterCode: `<!-- Refactor this template using @let declarations -->
<div class="shop">
  <aside>
    <p>Cart: {{ cart().length }} items</p>
    <p>Total: {{ cart().reduce((s, i) => s + i.price, 0) | currency }}</p>
    <button [disabled]="cart().length === 0">Checkout</button>
  </aside>

  <main>
    @for (product of products().filter(p => p.category === activeFilter()); track product.id) {
      <div [class.on-sale]="product.price < product.originalPrice"
           [class.in-cart]="cart().some(i => i.id === product.id)">
        {{ product.name }}
        @if (product.price < product.originalPrice) {
          <span>Save {{ product.originalPrice - product.price | currency }}</span>
        }
      </div>
    }
  </main>
</div>`,
    solution: `<!-- Clean template using @let -->
@let cartItems = cart();
@let cartCount = cartItems.length;
@let cartTotal = cartItems.reduce((s, i) => s + i.price, 0);
@let cartEmpty = cartCount === 0;

<div class="shop">
  <aside>
    <p>Cart: {{ cartCount }} items</p>
    <p>Total: {{ cartTotal | currency }}</p>
    <button [disabled]="cartEmpty">Checkout</button>
  </aside>

  <main>
    @let filtered = products().filter(p => p.category === activeFilter());

    @for (product of filtered; track product.id) {
      @let onSale = product.price < product.originalPrice;
      @let inCart = cartItems.some(i => i.id === product.id);
      @let savings = product.originalPrice - product.price;

      <div [class.on-sale]="onSale" [class.in-cart]="inCart">
        {{ product.name }}
        @if (onSale) {
          <span>Save {{ savings | currency }}</span>
        }
      </div>
    }
  </main>
</div>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which Angular version introduced @let template variables?',
      options: ['Angular 16', 'Angular 17', 'Angular 18', 'Angular 15'],
      answer: 2,
      explanation: '@let was introduced in Angular 18 as part of the new template syntax modernization (alongside @if, @for, @switch which arrived in Angular 17).',
    },
    {
      q: 'A @let variable is declared inside @for. Where is it accessible?',
      options: [
        'Anywhere in the entire template file',
        'Only inside that @for iteration block',
        'In the current @for block and any parent blocks',
        'Only in the first iteration of the loop',
      ],
      answer: 1,
      explanation: '@let is block-scoped like const. A variable declared inside @for is only accessible within that @for block (and nested blocks). It is not accessible outside the @for, nor in other iterations.',
    },
    {
      q: 'When does Angular re-evaluate a @let expression?',
      options: [
        'Only when the component\'s signals change',
        'On every change detection cycle',
        'Once — on component initialization',
        'When you explicitly call markForCheck()',
      ],
      answer: 1,
      explanation: '@let is a template variable, not a signal or computed. It is re-evaluated on every change detection cycle. For expensive computations, use computed() in the class for memoisation.',
    },
    {
      q: 'Which is the correct way to use @let with an async pipe?',
      options: [
        '@let user = async user$',
        '@let user = user$ | async;',
        '@async let user = user$',
        '@let user: Observable = user$',
      ],
      answer: 1,
      explanation: '@let works with any Angular template expression, including pipes. The syntax is @let name = expression; — so @let user = user$ | async; is correct. The semicolon is required.',
    },
    {
      q: 'When should you use computed() instead of @let?',
      options: [
        'When the derived value is only used in the template',
        'When the computation is expensive and benefits from memoisation across change detection cycles',
        'When the value is a string, not an object',
        '@let is always preferred over computed() in Angular 18+',
      ],
      answer: 1,
      explanation: 'computed() is memoised — it only recomputes when its signal dependencies change. @let recomputes every change detection cycle. Use computed() for expensive derivations (array filters, sorts, reduces) to avoid repeated computation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can @let replace the async pipe entirely?',
      a: 'Not entirely. @let name = obs$ | async still uses the async pipe to subscribe and unwrap the observable — @let just gives the result a name. What @let replaces is the old pattern of *ngIf="obs$ | async as name" which forced all consuming markup into an if-block. Now you can declare the variable at the outer scope and use it anywhere in the block.',
    },
    {
      q: 'Is @let the same as template reference variables (#ref)?',
      a: 'No — they are very different. Template reference variables (#myInput) capture a DOM element, component, or directive instance. @let declares a computed value from an expression. #ref is set once when the element is created; @let is re-evaluated on each change detection cycle. They serve entirely different purposes.',
    },
    {
      q: 'Can I declare @let at the top level of a template (outside any block)?',
      a: 'Yes — @let can appear anywhere in the template, including at the root level. A @let declared at the top of the template is accessible throughout the entire template (except in sibling @if/@for blocks that started before the @let declaration). The most useful pattern is declaring @let at the top of each logical section of the template.',
    },
    {
      q: 'Does @let work with template type checking (strict mode)?',
      a: 'Yes — Angular\'s template type checker fully understands @let. The variable\'s type is inferred from the expression. If the expression can return null, the variable\'s type includes null. Use @if to narrow after @let if you need non-null access: @let user = maybeUser(); then @if (user) { {{ user.name }} }.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: '<code>@let name = expr;</code> declares a block-scoped, read-only template variable re-evaluated each change detection cycle — the Angular 18+ way to name complex expressions without adding class properties.',
    mustKnow: [
      'Angular 18+ only; syntax is <code>@let name = expr;</code> — semicolon required',
      '<strong>Block-scoped</strong> — @let inside @if/@for is not accessible outside that block',
      '<strong>Read-only</strong> — cannot assign to @let after declaration; use signals for mutable state',
      'Recomputes every CD cycle — use <code>computed()</code> for expensive memoised derivations',
      'Works with any template expression: signal calls, async pipe, arithmetic, ternary',
      'Replaces class getters that exist solely to avoid template expression repetition',
    ],
    interviewFocus: [
      '<strong>@let vs computed()?</strong> — @let recomputes every CD cycle; computed() is memoised (only on signal change). Use computed() for expensive derivations.',
      '<strong>Scope?</strong> — block-scoped like const; not accessible outside enclosing @if/@for',
      '<strong>Type narrowing?</strong> — @let does not narrow; use @if (expr; as alias) for null narrowing',
      '<strong>When to use?</strong> — template-only derived values to avoid repeating expressions or adding class properties',
    ],
  };
}
