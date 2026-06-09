import { Component, signal, linkedSignal, computed } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

const COUNTRIES: Record<string, string[]> = {
  USA:    ['New York', 'Los Angeles', 'Chicago'],
  UK:     ['London', 'Manchester', 'Birmingham'],
  India:  ['Mumbai', 'Delhi', 'Bangalore'],
  Canada: ['Toronto', 'Vancouver', 'Montreal'],
};

@Component({
  selector: 'app-linked-signal',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './linked-signal.html',
  styleUrl: './linked-signal.scss',
})
export class LinkedSignalDemo {
  qna: QnaItem[] = [
    { q: 'What problem does linkedSignal() solve?', a: 'It solves the "dependent dropdown reset" problem. Without it, you need an <code>effect()</code> to watch the parent signal and call <code>.set()</code> on the child — that\'s an anti-pattern. <code>linkedSignal()</code> makes the reset declarative.' },
    { q: 'What is the difference between linkedSignal and computed?', a: '<code>computed()</code> is read-only — you cannot override it. <code>linkedSignal()</code> is writable — the user can change it manually, but it resets to the computed default whenever its source changes.' },
    { q: 'When does linkedSignal reset to the computed value?', a: 'Only when the <strong>source</strong> signal changes. Manual calls to <code>.set()</code> or <code>.update()</code> on the linkedSignal do NOT reset it — those changes are preserved until the next source change.' },
    { q: 'What is the long form of linkedSignal?', a: '<code>linkedSignal&lt;S, D&gt;({ source: () => S, computation: (newSource, previous?) => D })</code>. The <code>previous</code> param contains <code>{ source, value }</code> — use it to conditionally carry over the previous value instead of always resetting.' },
    { q: 'Can linkedSignal() work with non-primitive sources?', a: 'Yes — the source can be an object: <code>source: () => ({ cat: category(), sub: subcategory() })</code>. Angular compares source values for equality (default: <code>===</code>) to decide if a reset is needed. Provide a custom <code>equal</code> function if needed.' },
    { q: 'Is linkedSignal() available in Angular 18?', a: 'No — <code>linkedSignal()</code> was introduced in Angular 19 as a developer preview and became stable in Angular 20. Projects on Angular 18 must use the <code>effect()</code> workaround.' },
  ];

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

  theory: TheoryPoint[] = [
    {
      heading: 'What is linkedSignal()?',
      points: [
        'linkedSignal() is a writable signal that resets to a computed default whenever its source changes.',
        'It bridges the gap between derived state (computed) and user-editable state (signal).',
        'Without linkedSignal() you need manual effect() + set() to reset a signal when a dependency changes.',
        'Returns a WritableSignal — can be read, set(), and update()d just like a regular signal.',
      ],
    },
    {
      heading: 'Two forms',
      points: [
        'Short form: linkedSignal(() => sourceSignal()) — resets to the source value when source changes.',
        'Long form: linkedSignal({ source, computation }) — source triggers reset, computation derives the new value.',
        'computation receives (newSourceValue, previousSignalValue) — use previousSignalValue to carry over user edits conditionally.',
        'The linked signal resets ONLY when the source changes — manual set()/update() calls are preserved until then.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Perfect for dependent dropdowns: country → city, category → subcategory, user → role.',
        'Unlike computed(), the user CAN override the value — it only resets on source change.',
        'Available from Angular 19+. Ensure your project uses the correct version.',
        'linkedSignal() is not a replacement for computed() — use computed() when the value should never be manually writable.',
      ],
    },
  ];

  tabs: CodeTab[] = [
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

  // Auto-resets to first city when country changes
  // User can still select a different city manually
  city = linkedSignal(() => CITIES[this.country()][0]);
}

// Template:
// <select (change)="country.set($event.target.value)">...</select>
// <select (change)="city.set($event.target.value)">...</select>
// city() resets when country() changes`,
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
  currentPage = linkedSignal<number>({
    source: () => ({ items: this.items(), size: this.pageSize() }),
    computation: (_src, _prev) => 1,   // always reset to page 1
  });

  // With conditional carry-over:
  filter = signal('');
  sortedPage = linkedSignal<number>({
    source: this.filter,
    computation: (newFilter, prevPage) =>
      newFilter === '' ? (prevPage?.value ?? 1) : 1,  // keep page if clearing filter
  });
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the key difference between linkedSignal() and computed() in Angular?', options: ['linkedSignal() is read-only; computed() is writable', 'linkedSignal() is writable and can be manually set; computed() is read-only', 'linkedSignal() requires an effect(); computed() does not', 'linkedSignal() only works with primitive values; computed() works with any type'], answer: 1, explanation: 'linkedSignal() returns a WritableSignal — you can call .set() and .update() on it manually. computed() is strictly read-only and cannot be overridden. This makes linkedSignal() ideal for state that has a derived default but should also be user-editable.' },
    { q: 'When does a linkedSignal() reset to its computed default value?', options: ['Every time the component re-renders', 'Whenever .set() or .update() is called on it', 'Only when its source signal changes', 'On every change detection cycle'], answer: 2, explanation: 'A linkedSignal resets to its computed value ONLY when the source signal changes. Manual calls to .set() or .update() are preserved until the next source change — this is what makes it useful for dependent dropdowns where user edits should persist until the parent selection changes.' },
    { q: 'Given: cities = linkedSignal(() => COUNTRIES[this.selectedCountry()]); — what does cities hold after this.selectedCountry.set(\'UK\')?', options: ['The previous city array, unchanged', 'undefined, because the signal was invalidated', 'The cities array for \'UK\' — the linkedSignal recomputed its value', 'An error, because linkedSignal() cannot reference other signals in its callback'], answer: 2, explanation: 'When selectedCountry changes, the linkedSignal\'s source function re-runs and cities resets to COUNTRIES[\'UK\']. This is the \'dependent dropdown reset\' pattern that linkedSignal() is designed to solve declaratively.' },
    { q: 'In the long form linkedSignal({ source, computation }), what does the second argument (previous) of computation contain?', options: ['The previous source value only', 'An object { source, value } with the previous source and the previous signal value', 'The previous signal value only, as a plain primitive', 'A snapshot of the entire component state'], answer: 1, explanation: 'The computation function receives (newSourceValue, previous?) where previous is an object with shape { source, value }. This lets you conditionally carry over the previous signal value instead of always resetting — useful for pagination that should keep its page number unless a specific condition changes.' },
    { q: 'In the demo component, total is defined as: linkedSignal<{ qty: number; price: number }, number>({ source: () => ({ qty: this.qty(), price: this.price() }), computation: (src) => src.qty * src.price }). If the user manually sets total.set(999) and then changes qty, what happens?', options: ['total stays at 999 because manual writes take permanent precedence', 'total resets to qty * price because the source signal changed', 'total throws an error because linkedSignal cannot be manually written after creation', 'total becomes NaN because the computation is re-run with the old price'], answer: 1, explanation: 'When qty (part of the source object) changes, the source signal emits a new value and the computation re-runs, resetting total to qty * price. The manual override of 999 is discarded. This is exactly the behavior shown in the \'Editable computed total\' demo — edit Total manually, then change Qty or Price to see it reset.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'linkedSignal()', type: 'function', desc: 'Creates a writable signal that auto-resets to a computed default whenever its source signal changes.', since: '19' },
    { name: 'signal()', type: 'function', desc: 'Creates a primitive writable signal that can be read, set, and updated reactively.', since: '16' },
    { name: 'computed()', type: 'function', desc: 'Creates a read-only derived signal whose value is recalculated whenever its dependencies change.', since: '16' },
    { name: 'WritableSignal', type: 'interface', desc: 'Interface for a signal that exposes .set() and .update() methods in addition to being readable.', since: '16' },
    { name: 'effect()', type: 'function', desc: 'Runs a side-effect function reactively whenever its signal dependencies change; the old workaround for what linkedSignal() now solves declaratively.', since: '16' },
    { name: 'source (linkedSignal long form)', type: 'function', desc: 'A function returning the signal value that triggers a reset of the linkedSignal when it changes.', since: '19' },
    { name: 'computation (linkedSignal long form)', type: 'function', desc: 'Derives the new linked-signal value from (newSourceValue, previous?) where previous holds { source, value } for conditional carry-over.', since: '19' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Dependent dropdown reset: effect() workaround vs linkedSignal()',
      before: `// Old: imperative anti-pattern
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
      note: "effect() + set() inside a reactive context is an anti-pattern; linkedSignal() makes the reset declarative.",
    },
    {
      title: 'Derived-but-editable value: computed() vs linkedSignal()',
      before: `// computed() is read-only — cannot be overridden
qty = signal(1);
price = signal(10);
total = computed(() => this.qty() * this.price());
// total.set(999); // ERROR: not a function`,
      after: `// linkedSignal() allows manual overrides
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
  source: this.filter,
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
      explanation: 'Calling .set() inside effect() is an anti-pattern and triggers a warning in Angular 19+. linkedSignal() expresses the same intent declaratively without side effects.',
    },
    {
      title: 'Expecting linkedSignal NOT to reset after a manual .set()',
      wrong: `// Developer expects city to stay 'Chicago' after country changes
city = linkedSignal(() => CITIES[this.country()][0]);
city.set('Chicago');
this.country.set('UK'); // city resets to 'London' — surprise!`,
      right: `// Understand the contract: manual overrides persist ONLY until the source changes
// If you need a permanently pinned value, use a plain signal() instead.`,
      explanation: 'linkedSignal() ALWAYS resets to the computed value when the source changes. Manual writes persist only between source changes.',
    },
    {
      title: "Confusing linkedSignal() with computed() — trying to .set() a computed()",
      wrong: `total = computed(() => this.qty() * this.price());
total.set(0); // TypeError: total.set is not a function`,
      right: `total = linkedSignal({
  source: () => ({ q: this.qty(), p: this.price() }),
  computation: (s) => s.q * s.p,
});
total.set(0); // OK`,
      explanation: 'computed() returns a read-only Signal, not a WritableSignal. Use linkedSignal() when you need both a derived default and the ability to manually override.',
    },
    {
      title: 'Using linkedSignal() in Angular 18 or earlier',
      wrong: `// package.json: '@angular/core': '^18.0.0'
import { linkedSignal } from '@angular/core';
// Error: linkedSignal is not exported from @angular/core`,
      right: `// Upgrade to Angular 19+ to use linkedSignal()
// Fallback for Angular 18: use signal() + effect() workaround
city = signal(CITIES[this.country()][0]);`,
      explanation: 'linkedSignal() was introduced as developer preview in Angular 19 and became stable in Angular 20. It does not exist in Angular 18 or earlier.',
    },
  ];

  versionItems: VersionInfo[] = [
    {
      version: '19',
      label: 'Developer Preview',
      features: [
        'linkedSignal() introduced as developer preview — writable signal with auto-reset on source change',
        'Both short form (linkedSignal(() => source())) and long form ({ source, computation }) available',
        'computation receives (newSourceValue, previous?) for conditional carry-over logic',
      ],
    },
    {
      version: '20',
      label: 'Stable',
      features: [
        'linkedSignal() promoted to stable API — safe to use in production',
        'No API changes from the developer preview; imports remain from @angular/core',
      ],
    },
  ];

  challenge: Challenge = {
    title: 'Category → Subcategory Dependent Dropdown',
    description: 'Build a component with two dependent dropdowns: a Category selector and a Subcategory selector. When the user changes the Category, the Subcategory must automatically reset to the first subcategory in the new category using linkedSignal(). The user should also be able to manually select any subcategory without it resetting — it should only reset when the Category changes. Display the current selection below the dropdowns.',
    language: 'typescript',
    hints: [
      'Use signal() for the selected category and linkedSignal() for the selected subcategory — the linkedSignal source should derive its list and default from the category signal.',
      'The short form linkedSignal(() => DATA[this.selectedCategory()][0]) is enough to always reset to the first item when the source changes.',
      'Bind the category <select> to (change) and call selectedCategory.set($any($event.target).value). Do the same for the subcategory <select> using selectedSubcategory.set(...).',
      'Use @for to iterate over the subcategory list for the current category — call subCategories() (the linkedSignal holding the array) to get the current list.',
    ],
    starterCode: `import { Component, signal, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';

const CATALOG: Record<string, string[]> = {
  Electronics: ['Phones', 'Laptops', 'Tablets'],
  Clothing:    ['Shirts', 'Pants', 'Shoes'],
  Food:        ['Fruits', 'Vegetables', 'Dairy'],
};

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div>
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

      <!-- TODO: show the current selection -->
      <p>Selected: </p>
    </div>
  \`,
})
export class CatalogComponent {
  categories = Object.keys(CATALOG);

  // TODO: create a signal for the selected category (default: 'Electronics')
  selectedCategory = /* your code here */ null as any;

  // TODO: create a linkedSignal for the subcategory list derived from selectedCategory
  subCategories = /* your code here */ null as any;

  // TODO: create a linkedSignal for the selected subcategory (default: first in the list)
  selectedSubcategory = /* your code here */ null as any;
}`,
    solution: `import { Component, signal, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';

const CATALOG: Record<string, string[]> = {
  Electronics: ['Phones', 'Laptops', 'Tablets'],
  Clothing:    ['Shirts', 'Pants', 'Shoes'],
  Food:        ['Fruits', 'Vegetables', 'Dairy'],
};

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div>
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
    </div>
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
