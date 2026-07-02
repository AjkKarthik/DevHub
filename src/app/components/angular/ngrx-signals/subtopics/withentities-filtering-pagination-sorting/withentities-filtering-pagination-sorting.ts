import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-withentities-filtering-pagination-sorting-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './withentities-filtering-pagination-sorting.html',
  styleUrl: './withentities-filtering-pagination-sorting.scss',
})
export class WithentitiesFilteringPaginationSortingSubtopic {

  ngrxDeps = { '@ngrx/signals': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Layering filter/sort/page state ON TOP of withEntities',
      points: [
        '<code>withEntities&lt;T&gt;()</code> gives you the normalized collection (<code>entities()</code>, <code>entityMap()</code>, <code>ids()</code>) — filtering, sorting, and pagination are NOT built into it; you compose them yourself as ADDITIONAL <code>withState</code> (for the filter/sort/page criteria) plus <code>withComputed</code> (deriving the final visible list from both the entities AND the criteria).',
        'The pattern: <code>withState({ filterText: \'\', sortBy: \'name\' as const, page: 1, pageSize: 10 })</code> alongside <code>withEntities&lt;Product&gt;()</code>, then a <code>withComputed</code> that reads BOTH — <code>filteredSorted = computed(() =&gt; store.entities().filter(p =&gt; p.name.includes(store.filterText())).sort(...))</code> and <code>pagedItems = computed(() =&gt; store.filteredSorted().slice((store.page()-1)*store.pageSize(), store.page()*store.pageSize()))</code>.',
      ],
    },
    {
      heading: 'Keeping the derived pipeline efficient',
      points: [
        'Because <code>computed()</code> is MEMOIZED, <code>filteredSorted</code> only actually recomputes when <code>entities()</code>, <code>filterText()</code>, or <code>sortBy()</code> genuinely change — changing ONLY the <code>page</code> signal does not re-run the filter/sort logic, since <code>pagedItems</code> depends on <code>filteredSorted</code> (which is unaffected by page) plus <code>page</code>/<code>pageSize</code> directly. This layered computed structure is what keeps pagination cheap even over a large filtered/sorted list.',
        'A common mistake is combining EVERYTHING (filter + sort + page) into ONE giant computed — this works correctly but loses the memoization benefit above, since ANY change (including just paging) re-runs the full filter+sort logic from scratch every time.',
      ],
    },
    {
      heading: 'Resetting page on filter change',
      points: [
        'A genuinely common UX bug: the user is on page 3, types a new filter that only matches 1 result, and the list appears EMPTY because <code>page</code> is still 3 — a <code>withMethods</code> method that updates the filter should ALSO reset <code>page</code> to 1 in the SAME <code>patchState()</code> call: <code>setFilter(text: string) { patchState(store, { filterText: text, page: 1 }); }</code>.',
        'Batching both fields into one <code>patchState()</code> call (rather than two separate calls) ensures the UI updates ONCE with both the new filter text AND the reset page, avoiding a visible flash of an empty/incorrect intermediate state.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/product.store.ts',
      content: `import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withEntities, addEntity } from '@ngrx/signals/entities';
import { computed } from '@angular/core';

interface Product { id: number; name: string; price: number; }

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withEntities<Product>(),
  withState({ filterText: '', page: 1, pageSize: 3 }),
  withComputed((store) => ({
    // Only recomputes when entities() or filterText() actually change
    filtered: computed(() =>
      store.entities().filter(p => p.name.toLowerCase().includes(store.filterText().toLowerCase())),
    ),
  })),
  withComputed((store) => ({
    // Only recomputes when filtered() or page()/pageSize() change — NOT on unrelated updates
    pagedItems: computed(() => {
      const start = (store.page() - 1) * store.pageSize();
      return store.filtered().slice(start, start + store.pageSize());
    }),
    totalPages: computed(() => Math.max(1, Math.ceil(store.filtered().length / store.pageSize()))),
  })),
  withMethods((store) => ({
    setFilter(text: string) {
      // Batch filterText + page reset into ONE patchState call
      patchState(store, { filterText: text, page: 1 });
    },
    setPage(page: number) {
      patchState(store, { page });
    },
    seed(products: Product[]) {
      products.forEach(p => patchState(store, addEntity(p)));
    },
  })),
);
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { ProductStore } from './product.store';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Filter + paginate over withEntities()</h3>
    <input placeholder="Filter by name..." (input)="store.setFilter($any($event.target).value)" />

    <ul>
      @for (p of store.pagedItems(); track p.id) {
        <li>{{ p.name }} — \${{ p.price }}</li>
      }
    </ul>

    <button (click)="store.setPage(store.page() - 1)" [disabled]="store.page() <= 1">Prev</button>
    Page {{ store.page() }} / {{ store.totalPages() }}
    <button (click)="store.setPage(store.page() + 1)" [disabled]="store.page() >= store.totalPages()">Next</button>
  \`,
})
export class App {
  store = inject(ProductStore);

  constructor() {
    this.store.seed([
      { id: 1, name: 'Widget A', price: 10 },
      { id: 2, name: 'Widget B', price: 15 },
      { id: 3, name: 'Gadget C', price: 20 },
      { id: 4, name: 'Widget D', price: 12 },
      { id: 5, name: 'Gizmo E', price: 8 },
    ]);
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>withEntities filtering, pagination, sorting</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Type "Widget" into the filter and navigate to page 2 — then type "Gizmo" and confirm the page automatically resets to 1 instead of showing an empty page 2.',
    hint: 'setFilter() calls patchState(store, { filterText: text, page: 1 }) in ONE call — this is exactly what resets the page whenever the filter text changes, preventing the empty-page bug.',
    solution: `// No code change needed — this confirms the existing setFilter()
// batches filterText and page: 1 into one patchState call, which is
// what correctly resets pagination whenever the filter changes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'withEntities() has built-in filtering, sorting, and pagination options you configure.',
      reality: 'withEntities() only gives you the normalized collection itself — filtering/sorting/pagination are composed on top with your own withState (for the criteria) and withComputed (deriving the final list).',
    },
    {
      thought: 'combining filter + sort + page logic into one big computed() is simpler and equally efficient as splitting it into layers.',
      reality: 'a single combined computed re-runs the ENTIRE filter+sort logic on every page change too — layering computeds (filtered, then pagedItems built from filtered) preserves memoization so paging alone doesn\'t re-filter/re-sort.',
    },
    {
      thought: 'updating the filter text and resetting the page can be done as two separate patchState() calls without any visible difference.',
      reality: 'two separate calls cause the UI to update twice — once with the new filter but old page, then again with the reset page — batching both into ONE patchState() call avoids a visible flash of an incorrect intermediate (possibly empty) state.',
    },
  ];
}
