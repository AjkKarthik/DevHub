import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-modules-are-singletons-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './modules-are-singletons-shared-state-across-importers.html',
  styleUrl: './modules-are-singletons-shared-state-across-importers.scss',
})
export class ModulesAreSingletonsSharedStateAcrossImportersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Claim, Proven With Two Independent Importers',
      points: [
        'The main page states: "Modules are singletons: the same module is only evaluated once regardless of how many times it\'s imported. Shared state is maintained." This subtopic builds a shared <code>store.ts</code> module, then imports it from TWO SEPARATE files (<code>moduleA.ts</code> and <code>moduleB.ts</code>), each mutating the store independently — and proves both mutations land on the exact same underlying object, visible from a third file that also imports the store.',
        'No matter how many different files write <code>import { store } from \'./store.js\'</code>, the JavaScript engine evaluates <code>store.ts</code>\'s module body EXACTLY ONCE, the first time it is needed — every subsequent import (from any file, anywhere in the dependency graph) receives a reference to that SAME already-created module instance, not a fresh copy.',
      ],
    },
    {
      heading: 'Why This Matters for Application State and Services',
      points: [
        'This singleton behavior is precisely what makes the common "shared store" or "singleton service" pattern work in plain ESM with zero extra machinery — export a mutable object (or a class instance) from one module, and every file that imports it is automatically working with the SAME instance, because the module system itself guarantees there is only ever one.',
        'This is genuinely different from, say, a factory function that creates a NEW object every time it\'s called — <code>export function createStore() { return { count: 0 }; }</code> would give every caller their OWN independent object, since calling a function repeatedly always produces fresh objects, unlike importing a module which always resolves to the same evaluated instance.',
        'The main page\'s Circular imports theory bullet builds on this same singleton guarantee: circular imports are only coherent BECAUSE each module is evaluated exactly once — if importing a module re-ran its top-level code every time, a circular dependency graph would either infinite-loop or produce wildly inconsistent state between different "copies" of the same module.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Modules are singletons demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'store.ts',
      content: `// A single shared store -- this module body runs exactly ONCE,
// no matter how many different files import it.
console.log('  [store.ts] module body evaluated -- this should only print ONCE, ever');

export const store = {
  items: [] as string[],
  addItem(item: string) {
    this.items.push(item);
  },
};`,
    },
    {
      path: 'moduleA.ts',
      content: `import { store } from './store.js';

export function addFromA() {
  store.addItem('item-from-A');
}`,
    },
    {
      path: 'moduleB.ts',
      content: `import { store } from './store.js';

export function addFromB() {
  store.addItem('item-from-B');
}`,
    },
    {
      path: 'index.ts',
      content: `import { store } from './store.js';
import { addFromA } from './moduleA.js';
import { addFromB } from './moduleB.js';

console.log('--- Before any additions ---');
console.log('store.items (via index.ts\\'s own import):', store.items);

console.log('--- Calling addFromA() (uses moduleA.ts\\'s copy of the import) ---');
addFromA();
console.log('store.items now:', store.items, '<-- the item WAS added, visible via index.ts\\'s own reference');

console.log('--- Calling addFromB() (uses moduleB.ts\\'s copy of the import) ---');
addFromB();
console.log('store.items now:', store.items, '<-- both items visible from ONE shared store, despite 3 separate import statements');

console.log('--- Confirms store.ts\\'s module body only ran ONCE total (see the log above, printed only once) ---');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: '<code>store.ts</code> is imported from THREE different files: <code>index.ts</code>, <code>moduleA.ts</code>, and <code>moduleB.ts</code>. Does each import get its own separate copy of the store, or do all three share the exact same object?',
    hint: 'Watch for the "[store.ts] module body evaluated" log -- how many times does it actually print, given that three different files each have their own import statement for it?',
    solution: `All three imports share the exact same store object -- there is only
ONE store in existence, and the "[store.ts] module body evaluated"
log proves it by printing exactly ONCE, despite three separate files
each writing their own "import { store } from './store.js'" statement.

When addFromA() runs, it calls store.addItem() using moduleA.ts's OWN
import of store -- but since that import resolves to the SAME
singleton instance every other file's import also resolves to, the
mutation ("item-from-A" pushed onto items) is immediately visible
through index.ts's completely separate import statement, with zero
communication or syncing code needed between the files.

The same thing happens for addFromB() -- by the end, store.items
contains BOTH items, confirmable from any of the three files' own
import of store, because there was never more than one store object
to begin with.

This is the core mechanism the main page's "modules are singletons"
claim describes: a module's file is evaluated exactly once, the
first time the JavaScript engine needs it, and every import
statement anywhere in the entire dependency graph -- regardless of
which file writes it -- resolves to that one shared instance.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'each file\'s own import statement for a module creates its own separate, independent copy of that module\'s exports — mutations made through one file\'s import don\'t affect what another file\'s import of the same module sees.',
      reality: 'a module is evaluated exactly ONCE regardless of how many files import it — every import statement across the entire dependency graph resolves to the exact SAME module instance, so a mutation made through one file\'s import is immediately visible through every other file\'s import of that same module.',
    },
    {
      thought: 'the singleton behavior only applies to the exported values themselves (like an object\'s properties) — the module\'s own top-level code (console.log statements, initialization logic) still runs once per importing file.',
      reality: 'the ENTIRE module body — including any top-level console.log calls, side effects, or initialization code — runs exactly once, the first time the module is needed, not once per file that imports it; this is directly observable by counting how many times a top-level log statement actually prints.',
    },
    {
      thought: 'exporting a mutable shared object from a module and a factory function that returns a NEW object each time it\'s called achieve the same practical result — both let multiple files "share" state.',
      reality: 'these are fundamentally different — an exported shared object gives every importer a reference to the ONE singleton instance (true shared state), while a factory function creates a genuinely NEW, independent object on every call, giving each caller their own isolated state with no sharing at all.',
    },
  ];
}
