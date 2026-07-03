import { Component, signal, linkedSignal, computed } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

const COUNTRIES: Record<string, string[]> = {
  USA:    ['New York', 'Los Angeles', 'Chicago'],
  UK:     ['London', 'Manchester', 'Birmingham'],
  India:  ['Mumbai', 'Delhi', 'Bangalore'],
  Canada: ['Toronto', 'Vancouver', 'Montreal'],
};

@Component({
  selector: 'app-linked-signal',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './linked-signal.html',
  styleUrl: './linked-signal.scss',
})
export class LinkedSignalDemo {
  countries = Object.keys(COUNTRIES);
  selectedCountry = signal('USA');

  cities = linkedSignal(() => COUNTRIES[this.selectedCountry()]);
  selectedCity = linkedSignal(() => this.cities()[0]);

  qty   = signal(1);
  price = signal(10);
  total = linkedSignal<{ qty: number; price: number }, number>({
    source: () => ({ qty: this.qty(), price: this.price() }),
    computation: (src) => src.qty * src.price,
  });

  summary = computed(() => `${this.selectedCity()}, ${this.selectedCountry()} — Qty: ${this.qty()} × $${this.price()} = $${this.total()}`);

  prerequisites: Prerequisite[] = [
    { label: 'Signal Effects', route: '/angular/signal-effects' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'linkedSignal()',               type: 'function',   desc: 'Creates a writable signal that auto-resets to a computed default whenever its source signal changes.', since: '19' },
    { name: 'signal()',                     type: 'function',   desc: 'Creates a primitive writable signal that can be read, set, and updated reactively.', since: '16' },
    { name: 'computed()',                   type: 'function',   desc: 'Creates a read-only derived signal whose value is recalculated whenever its dependencies change.', since: '16' },
    { name: 'WritableSignal',               type: 'interface',  desc: 'Interface for a signal that exposes .set() and .update() methods in addition to being readable.', since: '16' },
    { name: 'effect()',                     type: 'function',   desc: 'Runs a side-effect function reactively whenever its signal dependencies change; the old workaround for what linkedSignal() now solves declaratively.', since: '16' },
    { name: 'source (long form)',           type: 'function',   desc: 'A function returning the value that triggers a reset of the linkedSignal when it changes.', since: '19' },
    { name: 'computation (long form)',      type: 'function',   desc: 'Derives the new value from (newSourceValue, previous?) where previous holds { source, value } for conditional carry-over.', since: '19' },
    { name: 'equal (long form)',            type: 'function',   desc: 'Custom equality function to control when a source change triggers a reset — prevents spurious resets on reference-equal data.', since: '19' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is linkedSignal() and why it exists',
      points: [
        '<code>linkedSignal()</code> is a writable signal that resets to a computed default whenever its source signal changes. It bridges the gap between derived state (<code>computed()</code>) and user-editable state (<code>signal()</code>).',
        'The classic problem it solves is the "dependent dropdown reset": when a Country signal changes, the City signal should reset to the first city in the new country — but the user should still be able to pick a different city manually.',
        'Without <code>linkedSignal()</code>, the pattern required an <code>effect()</code> that called <code>.set()</code> on the dependent signal whenever the parent changed. Angular 19 flags this as an anti-pattern (setting signals inside effects causes feedback loops).',
        '<code>linkedSignal()</code> returns a <code>WritableSignal</code> — you can call <code>.set()</code>, <code>.update()</code>, and read it like any signal. The key difference: when the source changes, Angular automatically recomputes and overwrites any manual value.',
        'It was introduced as a developer preview in Angular 19 and promoted to stable in Angular 20. The import is from <code>@angular/core</code> — no extra package needed.',
      ],
    },
    {
      heading: 'Two forms: short and long',
      points: [
        '<strong>Short form</strong>: <code>linkedSignal(() =&gt; sourceSignal())</code> — the function both defines the source and computes the reset value. Use this when the reset value IS the source value (e.g., resetting a selected item to the first item in a derived list).',
        '<strong>Long form</strong>: <code>linkedSignal({ source: () =&gt; S, computation: (newSrc, prev?) =&gt; D })</code> — separates the trigger (source) from the derivation (computation). Use when the type of the source differs from the type of the signal value.',
        'The <code>source</code> function in the long form should be kept simple — just read the signals that should trigger a reset. Complex logic belongs in <code>computation</code>, not <code>source</code>.',
        'In the short form, the computation IS the source function itself: when the function\'s signal dependencies change, the return value of that same function becomes the new signal value. This means the source and the reset value are always the same expression.',
        'You can chain linkedSignals: if <code>cities = linkedSignal(() =&gt; COUNTRIES[country()])</code> and <code>city = linkedSignal(() =&gt; cities()[0])</code>, changing <code>country</code> resets <code>cities</code>, which in turn resets <code>city</code> — a two-level dependency reset with no manual wiring.',
      ],
    },
    {
      heading: 'The computation function and conditional carry-over',
      points: [
        'The computation function in the long form receives two arguments: <code>(newSourceValue, previous?)</code> where <code>previous</code> is an object with shape <code>{ source: S, value: D }</code> — the previous source value and the previous signal value.',
        'Use <code>previous</code> when you want to conditionally carry over the old value instead of always resetting. Example: a pagination signal that resets to page 1 when a filter changes, but keeps the current page when clearing the filter.',
        'The <code>previous</code> argument is <code>undefined</code> on the very first computation (when the signal is initialised), so always use optional chaining: <code>prev?.value ?? defaultValue</code>.',
        'Conditional carry-over pattern: <code>computation: (newFilter, prev) =&gt; newFilter === \'\' ? (prev?.value ?? 1) : 1</code> — reset when a filter is applied, keep page when it\'s cleared.',
        'The previous source value (<code>prev?.source</code>) lets you compare the old and new source to decide on carry-over. For example: keep the selected item if it still exists in the new list, otherwise reset to the first item.',
      ],
    },
    {
      heading: 'Equality checking and complex sources',
      points: [
        'By default, Angular uses <code>===</code> (reference equality) to compare source values between renders. If the source is a new object on every read (e.g., <code>source: () =&gt; ({ a: this.a(), b: this.b() })</code>), every change to any dependency triggers a reset — intended behaviour for most cases.',
        'You can supply a custom <code>equal</code> function in the long form to control when a reset fires: <code>linkedSignal({ source, computation, equal: (a, b) =&gt; a.id === b.id })</code> — this way, changing a field that doesn\'t affect identity won\'t reset the linked signal.',
        'Reading multiple signals inside a single <code>source</code> function is fine and intended: <code>source: () =&gt; ({ cat: this.category(), sub: this.subcategory() })</code>. Any signal read inside <code>source</code> can trigger a reset.',
        'Signals read inside <code>computation</code> (but NOT inside <code>source</code>) do NOT trigger a reset. They are read once when the computation runs after a source change and then forgotten — they are not tracked as reactive dependencies for the purpose of resetting.',
        'If you need the signal to reset on multiple independent triggers, bundle them into one source object: <code>source: () =&gt; ({ page: this.page(), sort: this.sort() })</code>. This is cleaner than chaining multiple linkedSignals.',
      ],
    },
    {
      heading: 'linkedSignal() vs computed() vs effect() — choosing correctly',
      points: [
        'Use <code>computed()</code> when the value is always deterministically derived and should never be overridden. For example, a formatted display string — there is no user input, just a formula.',
        'Use <code>linkedSignal()</code> when the value has a smart default (derived) but the user should be able to override it — and the override should reset only when the source changes. Dependent dropdowns, editable totals, and page numbers are canonical examples.',
        'Use <code>signal()</code> when the value is purely user-driven with no derived default and no auto-reset. The source of truth is the user\'s action, not a computation.',
        'Never use <code>effect()</code> + <code>.set()</code> to reset a signal when a dependency changes — Angular 19+ warns about this. <code>linkedSignal()</code> expresses exactly the same intent declaratively and avoids the feedback-loop risk.',
        'If you find yourself writing <code>effect(() =&gt; { if (condition) this.mySignal.set(x); })</code>, that is almost always a sign that <code>linkedSignal()</code> or a <code>computed()</code> is the right tool instead.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic linkedSignal',
      language: 'typescript',
      code: `import { signal, linkedSignal } from '@angular/core';

const CITIES: Record<string, string[]> = {
  USA: ['New York', 'LA'],
  UK:  ['London', 'Manchester'],
};

export class MyComponent {
  country = signal('USA');

  // Auto-resets to full city list when country changes
  citiesList = linkedSignal(() => CITIES[this.country()]);

  // Auto-resets to first city whenever the list (country) changes
  // User can still select a different city manually
  city = linkedSignal(() => this.citiesList()[0]);
}

// Template:
// <select (change)="country.set($event.target.value)">...</select>
// <select (change)="city.set($event.target.value)">
//   @for (c of citiesList(); track c) { <option>{{ c }}</option> }
// </select>
// city() resets when country() changes — but not when the user changes city`,
    },
    {
      label: 'Long form (computation)',
      language: 'typescript',
      code: `import { signal, linkedSignal } from '@angular/core';

export class MyComponent {
  items    = signal<string[]>([]);
  pageSize = signal(10);

  // Resets to 1 when items or pageSize change
  // But the user can navigate to page 3 manually
  currentPage = linkedSignal<{ items: string[]; size: number }, number>({
    source: () => ({ items: this.items(), size: this.pageSize() }),
    computation: (_src, _prev) => 1,   // always reset to page 1
  });

  // With conditional carry-over:
  filter = signal('');
  page = linkedSignal<string, number>({
    source: () => this.filter(),
    computation: (newFilter, prev) =>
      // Keep current page when clearing the filter; reset to 1 when applying
      newFilter === '' ? (prev?.value ?? 1) : 1,
  });
}`,
    },
    {
      label: 'Custom equality (equal)',
      language: 'typescript',
      code: `import { signal, linkedSignal } from '@angular/core';

interface Category { id: number; name: string; description: string; }

export class CatalogComponent {
  category = signal<Category>({ id: 1, name: 'Electronics', description: 'Gadgets' });

  // Without custom equal: resets whenever 'category' signal is set,
  // even if only the description changed (same id → no real reset needed).
  selectedProduct = linkedSignal<Category, string>({
    source: () => this.category(),
    computation: (cat) => \`default-product-for-\${cat.id}\`,
    // Only reset when the category ID actually changes:
    equal: (a, b) => a.id === b.id,
  });
}

// Practical effect:
// category.set({ id: 1, name: 'Electronics', description: 'Updated desc' })
// → NO reset (id is the same, equal returns true)
// category.set({ id: 2, name: 'Clothing', description: 'Apparel' })
// → RESET (id changed, equal returns false)`,
    },
    {
      label: 'Carry-over with prev.source',
      language: 'typescript',
      code: `import { signal, linkedSignal } from '@angular/core';

interface FilterState { search: string; tags: string[] }

export class SearchComponent {
  filters = signal<FilterState>({ search: '', tags: [] });
  items = signal<string[]>([]);

  // Keep the selected item if it still exists in the new filtered list.
  // Otherwise reset to the first available item.
  selectedItem = linkedSignal<string[], string>({
    source: () => this.items(),
    computation: (newItems, prev) => {
      if (!prev) return newItems[0] ?? '';
      // carry over if old selection still exists in new list
      return newItems.includes(prev.value) ? prev.value : (newItems[0] ?? '');
    },
  });
}
// prev.source holds the previous items array
// prev.value holds the previous selectedItem value
// This pattern avoids surprising resets when list updates don't remove the selected item`,
    },
    {
      label: 'Chained linked signals',
      language: 'typescript',
      code: `import { Component, signal, linkedSignal } from '@angular/core';

const DATA: Record<string, Record<string, string[]>> = {
  Europe: { France: ['Paris', 'Lyon'], Germany: ['Berlin', 'Munich'] },
  Asia:   { Japan:  ['Tokyo', 'Osaka'], India: ['Mumbai', 'Delhi'] },
};

@Component({
  standalone: true,
  template: \`
    Continent:
    <select (change)="continent.set($any($event.target).value)">
      @for (c of continents; track c) { <option>{{ c }}</option> }
    </select>
    Country:
    <select (change)="country.set($any($event.target).value)">
      @for (c of countries(); track c) { <option>{{ c }}</option> }
    </select>
    City:
    <select (change)="city.set($any($event.target).value)">
      @for (c of cities(); track c) { <option>{{ c }}</option> }
    </select>
    <p>{{ city() }}, {{ country() }}, {{ continent() }}</p>
  \`,
})
export class DrilldownComponent {
  continents = Object.keys(DATA);
  continent = signal('Europe');

  // Resets when continent changes
  countries = linkedSignal(() => Object.keys(DATA[this.continent()]));
  country   = linkedSignal(() => this.countries()[0]);

  // Resets when country (or continent) changes
  cities = linkedSignal(() => DATA[this.continent()][this.country()]);
  city   = linkedSignal(() => this.cities()[0]);
}
// Changing continent → resets countries → resets country → resets cities → resets city
// Changing country  → resets cities → resets city
// Changing city     → no chain reset — only user override`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Dependent dropdown reset: effect() workaround vs linkedSignal()',
      before: `// Old: imperative anti-pattern (Angular 19+ warns about this)
country = signal('USA');
city = signal('New York');

constructor() {
  effect(() => {
    this.city.set(CITIES[this.country()][0]);
  });
}`,
      after: `// New: declarative with linkedSignal()
country = signal('USA');

// Resets automatically; user can still override
city = linkedSignal(() => CITIES[this.country()][0]);`,
      note: "effect() + set() inside a reactive context is an anti-pattern that Angular 19+ warns about. linkedSignal() expresses the same intent declaratively.",
    },
    {
      title: 'Derived-but-editable value: computed() vs linkedSignal()',
      before: `// computed() is read-only — cannot be overridden
qty = signal(1);
price = signal(10);
total = computed(() => this.qty() * this.price());
// total.set(999); // TypeError: total.set is not a function`,
      after: `// linkedSignal() allows manual overrides; resets on source change
qty = signal(1);
price = signal(10);
total = linkedSignal({
  source: () => ({ q: this.qty(), p: this.price() }),
  computation: (s) => s.q * s.p,
});
// total.set(999); // OK — resets when qty/price change`,
      note: 'Use linkedSignal() when the value should be both derived and user-editable.',
    },
    {
      title: 'Pagination reset on filter change: long form with conditional carry-over',
      before: `// No good built-in solution before Angular 19
filter = signal('');
page = signal(1);

constructor() {
  effect(() => {
    this.filter(); // track dependency
    this.page.set(1);
  });
}`,
      after: `// Long form: conditionally keep page when clearing filter
filter = signal('');
page = linkedSignal({
  source: () => this.filter(),
  computation: (f, prev) =>
    f === '' ? (prev?.value ?? 1) : 1,
});`,
      note: 'The previous parameter ({ source, value }) allows carrying over the old value when the reset condition is not met.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using effect() + set() to reset a dependent signal',
      wrong: `constructor() {
  effect(() => {
    this.city.set(CITIES[this.country()][0]);
  });
}`,
      right: `city = linkedSignal(() => CITIES[this.country()][0]);`,
      explanation: 'Calling .set() inside effect() is an anti-pattern that Angular 19+ warns about — it can cause feedback loops where the set triggers another effect run. linkedSignal() expresses the same intent declaratively without side effects.',
    },
    {
      title: 'Expecting linkedSignal NOT to reset after a manual .set()',
      wrong: `city = linkedSignal(() => CITIES[this.country()][0]);
city.set('Chicago');
// Developer expects city to stay 'Chicago' after country changes
this.country.set('UK'); // city resets to 'London' — surprise!`,
      right: `// Understand the contract: manual overrides persist ONLY until the source changes.
// If you need a permanently pinned value, use a plain signal() instead.
// If you need to carry over the value conditionally, use the long form with prev.`,
      explanation: 'linkedSignal() ALWAYS resets to the computed value when the source changes. Manual writes persist only between source changes. If you need permanent persistence, use signal(); for conditional carry-over, use the long form with the prev argument.',
    },
    {
      title: 'Trying to .set() a computed() instead of using linkedSignal()',
      wrong: `total = computed(() => this.qty() * this.price());
total.set(0); // TypeError: total.set is not a function`,
      right: `total = linkedSignal({
  source: () => ({ q: this.qty(), p: this.price() }),
  computation: (s) => s.q * s.p,
});
total.set(0); // OK — resets when qty/price change`,
      explanation: 'computed() returns a read-only Signal, not a WritableSignal. Use linkedSignal() when you need both a derived default and the ability to manually override the value.',
    },
    {
      title: 'Reading a signal inside computation that should trigger a reset',
      wrong: `// Bug: sort() changes do NOT trigger a reset because sort is read inside computation
selectedItem = linkedSignal({
  source: () => this.items(),
  computation: (items) => items.sort(this.sortFn())[0], // sort() read here — not tracked
});`,
      right: `// Fix: include sort in the source so changes to it trigger a reset
selectedItem = linkedSignal({
  source: () => ({ items: this.items(), sort: this.sortFn() }),
  computation: ({ items, sort }) => [...items].sort(sort)[0],
});`,
      explanation: 'Only signals read inside the source function are tracked as reset triggers. Signals read inside computation are NOT reactive dependencies for the reset mechanism — they are read once when the computation runs. Include all signals that should trigger a reset in the source function.',
    },
    {
      title: 'Using linkedSignal() in Angular 18 or earlier',
      wrong: `// package.json: '@angular/core': '^18.0.0'
import { linkedSignal } from '@angular/core'; // Error: not exported`,
      right: `// Upgrade to Angular 19+ to use linkedSignal() (stable in Angular 20)
// Angular 18 fallback: use signal() + effect() workaround
city = signal(CITIES[this.country()][0]);`,
      explanation: 'linkedSignal() was introduced as developer preview in Angular 19 and became stable in Angular 20. It does not exist in Angular 18 or earlier. For teams on older Angular, the effect() workaround is the only option.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between linkedSignal() and computed() in Angular?',
      options: [
        'linkedSignal() is read-only; computed() is writable',
        'linkedSignal() is writable and can be manually set; computed() is read-only',
        'linkedSignal() requires an effect(); computed() does not',
        'linkedSignal() only works with primitive values; computed() works with any type',
      ],
      answer: 1,
      explanation: 'linkedSignal() returns a WritableSignal — you can call .set() and .update() on it manually. computed() is strictly read-only and cannot be overridden. This makes linkedSignal() ideal for state that has a derived default but should also be user-editable.',
    },
    {
      q: 'When does a linkedSignal() reset to its computed default value?',
      options: [
        'Every time the component re-renders',
        'Whenever .set() or .update() is called on it',
        'Only when its source signal changes',
        'On every change detection cycle',
      ],
      answer: 2,
      explanation: 'A linkedSignal resets to its computed value ONLY when the source signal changes. Manual calls to .set() or .update() are preserved until the next source change — this is what makes it useful for dependent dropdowns where user edits should persist until the parent selection changes.',
    },
    {
      q: 'Given: cities = linkedSignal(() => COUNTRIES[this.selectedCountry()]); — what does cities hold after this.selectedCountry.set(\'UK\')?',
      options: [
        'The previous city array, unchanged',
        'undefined, because the signal was invalidated',
        'The cities array for \'UK\' — the linkedSignal recomputed its value',
        'An error, because linkedSignal() cannot reference other signals in its callback',
      ],
      answer: 2,
      explanation: "When selectedCountry changes, the linkedSignal's source function re-runs and cities resets to COUNTRIES['UK']. This is the 'dependent dropdown reset' pattern that linkedSignal() is designed to solve declaratively.",
    },
    {
      q: "In the long form linkedSignal({ source, computation }), what does the second argument (previous) of computation contain?",
      options: [
        'The previous source value only',
        'An object { source, value } with the previous source and the previous signal value',
        'The previous signal value only, as a plain primitive',
        'A snapshot of the entire component state',
      ],
      answer: 1,
      explanation: 'The computation function receives (newSourceValue, previous?) where previous is an object with shape { source, value }. This lets you conditionally carry over the previous signal value instead of always resetting — useful for pagination that should keep its page number unless a specific condition changes.',
    },
    {
      q: 'In the demo, total is a linkedSignal with source: () => ({ qty, price }) and computation: src => src.qty * src.price. The user sets total.set(999), then changes qty. What is total after the qty change?',
      options: [
        'total stays at 999 because manual writes take permanent precedence',
        'total resets to qty * price because the source signal changed',
        'total throws an error because linkedSignal cannot be manually written after creation',
        'total becomes NaN because the computation is re-run with the old price',
      ],
      answer: 1,
      explanation: 'When qty (part of the source object) changes, the source emits a new value and computation re-runs, resetting total to qty * price. The manual override of 999 is discarded. This is the key contract: manual writes persist only until the next source change.',
    },
    {
      q: 'Where should you place the signal reads that should TRIGGER a reset of the linkedSignal?',
      options: [
        'Inside the computation function — those are the reactive dependencies',
        'Inside both source and computation for redundancy',
        'Inside the source function — only signals read there are tracked as reset triggers',
        'In a separate effect() that calls linkedSignal.set() when they change',
      ],
      answer: 2,
      explanation: 'Only signals read inside the source function are tracked as reactive dependencies for resetting the linkedSignal. Signals read inside computation are read once when the computation runs but are NOT tracked — they do not trigger a reset when they change. If a signal should cause a reset, it must be read inside source.',
    },
    {
      q: 'When is the previous argument to the long-form computation function undefined?',
      options: [
        'When the linkedSignal has been manually set with .set()',
        'When the source signal returns undefined',
        'On the very first computation when the signal is initialised',
        'When the equal function returns true',
      ],
      answer: 2,
      explanation: 'The previous argument is undefined only on the initial computation because there is no prior state yet. After the first computation, previous always contains { source, value } with the last source value and last signal value. Always guard with optional chaining: prev?.value ?? defaultValue.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What problem does linkedSignal() solve?',
      a: 'It solves the "dependent dropdown reset" problem. Without it, you need an <code>effect()</code> to watch the parent signal and call <code>.set()</code> on the child — that\'s an anti-pattern that Angular 19+ warns about because it can cause feedback loops. <code>linkedSignal()</code> makes the reset declarative: the signal auto-resets when its source changes, without any side-effect code.',
    },
    {
      q: 'A linkedSignal() is manually set by the user to override its computed default. Before the source changes again, an effect() reads that linkedSignal. Does the effect see the user\'s manual override, or does it see the original computed value?',
      a: 'The effect sees the user\'s manual override — a linkedSignal() behaves like a regular WritableSignal from any consumer\'s perspective once .set() or .update() has been called on it; there is no special "the computed default is still the real value underneath" behavior. Any effect(), computed(), or template binding reading the linkedSignal gets whatever its CURRENT value is, whether that came from the initial computation or from a manual write — the distinction between "computed default" and "user override" only matters for determining WHEN the value resets (on source change), not for what value consumers see at any given moment in between resets.',
    },
    {
      q: 'A linkedSignal\'s source reads TWO signals: `source: () => ({ a: sigA(), b: sigB() })`. Only sigA changes; sigB stays the same. Does the linkedSignal reset?',
      a: 'Yes — the source function itself is treated as a computed-like reactive expression, so ANY change to ANY signal read within it (sigA or sigB) causes the source to re-evaluate and produce a new object, and linkedSignal treats that new source value as a reset trigger regardless of which specific field inside the object actually changed. This matters because the source returns a brand-new object reference on every re-evaluation (even if b\'s value is literally unchanged), so the reset fires based on "did the source function re-run," not "did the specific field the linkedSignal cares about actually change value" — a subtlety worth knowing if you expected partial-field changes to leave the linkedSignal untouched.',
    },
    {
      q: 'What is the long form of linkedSignal?',
      a: '<code>linkedSignal&lt;S, D&gt;({ source: () =&gt; S, computation: (newSource, previous?) =&gt; D })</code>. The <code>previous</code> param contains <code>{ source, value }</code> — use it to conditionally carry over the previous value instead of always resetting. For example: keep the current page number when clearing a filter, but reset to page 1 when applying a new filter.',
    },
    {
      q: 'Can linkedSignal() work with non-primitive sources?',
      a: 'Yes — the source can return an object: <code>source: () =&gt; ({ cat: category(), sub: subcategory() })</code>. Angular compares source values using <code>===</code> by default. Since a new object literal is always a new reference, any dependency change will trigger a reset. Provide a custom <code>equal</code> function to prevent spurious resets: <code>equal: (a, b) =&gt; a.id === b.id</code>.',
    },
    {
      q: 'Is linkedSignal() available in Angular 18?',
      a: 'No — <code>linkedSignal()</code> was introduced as developer preview in Angular 19 and became stable in Angular 20. Projects on Angular 18 must use the <code>effect()</code> + <code>.set()</code> workaround, even though it is not ideal. Upgrading to Angular 19+ is the recommended path.',
    },
    {
      q: 'How do you prevent a linkedSignal from resetting when the source changes by a trivial amount (e.g., same data, new object reference)?',
      a: 'Use the <code>equal</code> option in the long form: <code>linkedSignal({ source, computation, equal: (a, b) =&gt; a.id === b.id })</code>. The <code>equal</code> function compares the previous and new source values. If it returns <code>true</code>, Angular treats the source as unchanged and does not reset the linked signal. This is useful when the source contains objects that are recreated (new references) but are semantically equal.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'linkedSignal() is a writable signal that auto-resets to a computed default when its source signal changes — the declarative replacement for the effect() + set() anti-pattern in dependent dropdowns and derived-but-editable state.',
    mustKnow: [
      '<code>linkedSignal()</code> = writable signal + auto-reset on source change. Returns a <code>WritableSignal</code> — supports <code>.set()</code> and <code>.update()</code>',
      'Manual writes persist until the <strong>source</strong> changes — that is when the reset fires, not on every render or change-detection cycle',
      'Short form: <code>linkedSignal(() =&gt; sourceSignal())</code>; long form: <code>{ source, computation, equal? }</code>',
      'Only signals read inside <code>source</code> are tracked as reset triggers. Signals read inside <code>computation</code> are NOT reactive dependencies',
      'The <code>previous</code> argument in computation is <code>{ source, value }</code> — use it for conditional carry-over; it is <code>undefined</code> on the first computation',
      'Use <code>equal</code> to prevent spurious resets when the source produces structurally equal but reference-different objects',
      'Available from Angular 19 (developer preview) / Angular 20 (stable). Replaces <code>effect()</code> + <code>.set()</code> which Angular 19 warns about',
    ],
    interviewFocus: [
      'What is the difference between linkedSignal(), computed(), and signal()? When do you choose each?',
      'How does linkedSignal() solve the dependent dropdown problem without effect()?',
      'What does the previous argument contain and how is it used for conditional carry-over?',
      'Where must signal reads be placed to trigger a reset in the long form — source or computation?',
      'What happens to a manual .set() value when the source signal changes?',
    ],
  };

  challenge: Challenge = {
    title: 'Category → Subcategory Dependent Dropdown',
    language: 'typescript',
    description: 'Build a component with two dependent dropdowns: a Category selector and a Subcategory selector. When the user changes the Category, the Subcategory must automatically reset to the first subcategory in the new category using linkedSignal(). The user should also be able to manually select any subcategory without it resetting — it should only reset when the Category changes. Display the current selection below the dropdowns.',
    hints: [
      'Use signal() for the selected category and linkedSignal() for the subcategory list derived from selectedCategory.',
      'The short form linkedSignal(() => DATA[this.selectedCategory()][0]) is enough to always reset to the first item when the source changes.',
      'Bind the category <select> to (change) and call selectedCategory.set($any($event.target).value). Do the same for the subcategory.',
      'Use @for to iterate over the subcategory list for the current category — call subCategories() (the linkedSignal holding the array) to get the current list.',
    ],
    starterCode: `import { Component, signal, linkedSignal } from '@angular/core';

const CATALOG: Record<string, string[]> = {
  Electronics: ['Phones', 'Laptops', 'Tablets'],
  Clothing:    ['Shirts', 'Pants', 'Shoes'],
  Food:        ['Fruits', 'Vegetables', 'Dairy'],
};

@Component({
  selector: 'app-catalog',
  standalone: true,
  template: \`
    <label>Category
      <!-- TODO: bind (change) to update selectedCategory -->
      <select>
        @for (cat of categories; track cat) {
          <option [value]="cat">{{ cat }}</option>
        }
      </select>
    </label>
    <label>Subcategory
      <!-- TODO: bind (change) to update selectedSubcategory -->
      <!-- TODO: iterate over the correct subcategory list -->
      <select>
        @for (sub of []; track sub) {
          <option [value]="sub">{{ sub }}</option>
        }
      </select>
    </label>
    <p>Selected: </p>
  \`,
})
export class CatalogComponent {
  categories = Object.keys(CATALOG);
  // TODO: create signals and linkedSignals
}`,
    solution: `import { Component, signal, linkedSignal } from '@angular/core';

const CATALOG: Record<string, string[]> = {
  Electronics: ['Phones', 'Laptops', 'Tablets'],
  Clothing:    ['Shirts', 'Pants', 'Shoes'],
  Food:        ['Fruits', 'Vegetables', 'Dairy'],
};

@Component({
  selector: 'app-catalog',
  standalone: true,
  template: \`
    <label>Category
      <select (change)="selectedCategory.set($any($event.target).value)">
        @for (cat of categories; track cat) {
          <option [value]="cat">{{ cat }}</option>
        }
      </select>
    </label>
    <label>Subcategory
      <select (change)="selectedSubcategory.set($any($event.target).value)">
        @for (sub of subCategories(); track sub) {
          <option [value]="sub">{{ sub }}</option>
        }
      </select>
    </label>
    <p>Selected: {{ selectedSubcategory() }} in {{ selectedCategory() }}</p>
  \`,
})
export class CatalogComponent {
  categories = Object.keys(CATALOG);

  selectedCategory = signal('Electronics');

  // Resets to the list for the new category whenever selectedCategory changes
  subCategories = linkedSignal(() => CATALOG[this.selectedCategory()]);

  // Resets to the first subcategory whenever the list (and thus the category) changes
  selectedSubcategory = linkedSignal(() => this.subCategories()[0]);
}`,
  };
}
