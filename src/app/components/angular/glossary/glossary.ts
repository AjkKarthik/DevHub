import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Term {
  term: string;
  def: string;
  route?: string;
}

interface LetterGroup {
  letter: string;
  terms: Term[];
}

@Component({
  selector: 'app-glossary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './glossary.html',
  styleUrl: './glossary.scss',
})
export class GlossaryComponent {
  search = signal('');
  alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  terms: Term[] = [
    { term: 'async pipe', def: 'A built-in pipe that subscribes to an Observable or Promise in the template, renders the latest value, and unsubscribes automatically on destroy.', route: '/angular/rxjs' },
    { term: 'change detection', def: 'The process by which Angular checks component bindings and updates the DOM when application state changes.', route: '/angular/change-detection' },
    { term: 'computed', def: 'A read-only signal derived from other signals. It recalculates lazily and memoizes its value until a dependency changes.', route: '/angular/counter' },
    { term: 'content projection', def: 'Passing markup from a parent into a child component’s template via <ng-content>, optionally with selectors for multiple slots.', route: '/angular/content-projection' },
    { term: 'control flow blocks', def: 'The built-in @if, @for, and @switch template syntax that replaces *ngIf/*ngFor with faster, type-narrowing blocks.', route: '/angular/templates' },
    { term: 'CVA (ControlValueAccessor)', def: 'An interface a custom component implements so it can participate in Angular forms like a native input, bridging form model and view.', route: '/angular/cva' },
    { term: '@defer', def: 'A template block that lazy-loads its content on a trigger such as viewport, idle, hover, or interaction, with placeholder and loading sub-blocks.', route: '/angular/defer' },
    { term: 'DI (dependency injection)', def: 'Angular’s mechanism for constructing and supplying class dependencies. Components request services via inject() or constructor parameters.', route: '/angular/di' },
    { term: 'directive', def: 'A class that adds behavior to an existing element or component. Attribute directives change appearance/behavior; structural directives change DOM layout.', route: '/angular/directives' },
    { term: 'effect', def: 'A reactive side-effect function that re-runs whenever any signal it reads changes. Used for logging, syncing to storage, or imperative DOM work.', route: '/angular/counter' },
    { term: 'FormControl', def: 'The atomic unit of reactive forms: tracks a single value plus its validity, touched/dirty state, and value changes.', route: '/angular/forms' },
    { term: 'harness', def: 'A component test harness (from @angular/cdk/testing) that gives tests a stable API to interact with a component instead of brittle DOM queries.', route: '/angular/harnesses' },
    { term: 'host binding', def: 'Binding a property, attribute, or class on the directive/component’s own host element, declared via the host metadata object.', route: '/angular/directives' },
    { term: 'host directive', def: 'A directive composed onto a component via the hostDirectives metadata, letting components reuse directive behavior without template changes.', route: '/angular/directives' },
    { term: 'hydration', def: 'Reusing server-rendered HTML on the client by attaching event listeners and state instead of destroying and re-rendering the DOM.', route: '/angular/ssr' },
    { term: 'injector hierarchy', def: 'The tree of injectors (root, route, component) Angular walks upward when resolving a dependency; closer providers shadow farther ones.', route: '/angular/di' },
    { term: 'InjectionToken', def: 'A typed token used to inject values that have no class type, such as configuration objects or primitives.', route: '/angular/di' },
    { term: 'interceptor', def: 'A function that sits in the HttpClient pipeline to transform requests/responses globally — auth headers, logging, retries, error mapping.', route: '/angular/http' },
    { term: 'lazy loading', def: 'Loading feature code only when needed, typically via loadComponent/loadChildren on routes, to shrink the initial bundle.', route: '/angular/preloading' },
    { term: 'lifecycle hook', def: 'A method Angular calls at a defined moment of a component’s life, e.g. ngOnInit, ngAfterViewInit, ngOnDestroy.', route: '/angular/lifecycle' },
    { term: 'linkedSignal', def: 'A writable signal whose value resets from a computation when its source changes, but can be locally overwritten in between.', route: '/angular/linked-signal' },
    { term: 'memory leak', def: 'Resources (often subscriptions or event listeners) that outlive their component because they were never cleaned up, causing growing memory use.', route: '/angular/destroy-ref' },
    { term: 'NgModule (legacy)', def: 'The pre-standalone unit of organization that declared components and managed compilation context. New code uses standalone components instead.', route: '/angular/counter' },
    { term: 'observable', def: 'A lazy, push-based stream of zero or more values over time, the core RxJS primitive. Nothing happens until something subscribes.', route: '/angular/rxjs' },
    { term: 'OnPush', def: 'A change detection strategy where a component is checked only when its inputs change, an event fires inside it, or a signal it reads updates.', route: '/angular/change-detection' },
    { term: 'operator', def: 'A pure function (map, filter, switchMap…) that takes an observable and returns a new one, composed via pipe().', route: '/angular/rxjs' },
    { term: 'pipe', def: 'A template-level value transformer applied with the | syntax, e.g. date, currency, or custom pipes.', route: '/angular/pipes' },
    { term: 'prerendering', def: 'Rendering routes to static HTML at build time (SSG). Fastest delivery, but content is frozen until the next build.', route: '/angular/ssr' },
    { term: 'provider', def: 'A recipe telling the injector how to create a dependency: a class, value, factory, or existing alias bound to a token.', route: '/angular/di' },
    { term: 'pure pipe', def: 'A pipe re-evaluated only when its input reference changes — the default and the performant choice. Impure pipes run every change detection cycle.', route: '/angular/pipes' },
    { term: 'reactive forms', def: 'A form-building model where structure and validation live in TypeScript (FormGroup/FormControl), giving type safety and testability.', route: '/angular/forms' },
    { term: 'resolver', def: 'A route-level function that fetches data before a route activates so the component renders with data already available.', route: '/angular/route-resolvers' },
    { term: 'resource API', def: 'A signal-based primitive (resource/httpResource) for async data: exposes value, status, and error as signals and reloads when its params change.', route: '/angular/resource-api' },
    { term: 'route guard', def: 'A function (canActivate, canDeactivate, canMatch…) that allows, blocks, or redirects navigation to or from a route.', route: '/angular/routing' },
    { term: 'RxJS', def: 'The reactive extensions library Angular uses for event and async stream composition with observables and operators.', route: '/angular/rxjs' },
    { term: 'signal', def: 'A reactive wrapper around a value that notifies readers when it changes. The foundation of Angular’s fine-grained reactivity.', route: '/angular/counter' },
    { term: 'SSR (server-side rendering)', def: 'Rendering the app to HTML on the server per request for fast first paint and SEO, then hydrating it on the client.', route: '/angular/ssr' },
    { term: 'standalone component', def: 'A component that declares its own imports and needs no NgModule. The default and recommended style for modern Angular.', route: '/angular/counter' },
    { term: 'structural directive', def: 'A directive that adds, removes, or repeats DOM elements, historically written with a * prefix (e.g. *ngIf). Largely superseded by control flow blocks.', route: '/angular/directives' },
    { term: 'subject', def: 'An RxJS observable that is also an observer: you can push values into it and multicast them to many subscribers (Subject, BehaviorSubject, ReplaySubject).', route: '/angular/rxjs' },
    { term: 'subscription', def: 'The handle returned by subscribe(); represents a running observable execution and is disposed via unsubscribe().', route: '/angular/rxjs' },
    { term: 'template reference', def: 'A #name variable declared in a template that gives access to an element, component, or directive instance within that template.', route: '/angular/templates' },
    { term: 'trackBy / track', def: 'The expression in @for (or trackBy in *ngFor) that identifies items so Angular reuses DOM nodes instead of recreating the whole list.', route: '/angular/templates' },
    { term: 'TransferState', def: 'A key-value store serialized into the SSR HTML so the client can reuse server-fetched data instead of refetching during hydration.', route: '/angular/ssr' },
    { term: 'two-way binding', def: 'Combining property and event binding with [(ngModel)] or model() so a value flows into a child and changes flow back out.', route: '/angular/templates' },
    { term: 'unsubscribe', def: 'Ending an observable execution to free resources. Prefer async pipe, takeUntilDestroyed, or DestroyRef over manual bookkeeping.', route: '/angular/destroy-ref' },
    { term: 'validator', def: 'A function that inspects a control’s value and returns an error map or null. Can be sync or async, built-in or custom.', route: '/angular/custom-validators' },
    { term: 'view child', def: 'A query (viewChild signal or @ViewChild) that retrieves an element or component instance from the component’s own template.', route: '/angular/templates' },
    { term: 'view encapsulation', def: 'How component styles are scoped: Emulated (default attribute scoping), ShadowDom (native isolation), or None (global).' },
    { term: 'zone.js', def: 'A library that patches async APIs so Angular knows when to run change detection. Being phased out in favor of signal-driven scheduling.', route: '/angular/zoneless' },
    { term: 'zoneless', def: 'Running Angular without zone.js; change detection is scheduled by signals, events, and explicit notifications instead of patched async APIs.', route: '/angular/zoneless' },
  ];

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.terms;
    return this.terms.filter(
      t => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q)
    );
  });

  groups = computed<LetterGroup[]>(() => {
    const map = new Map<string, Term[]>();
    for (const t of [...this.filtered()].sort((a, b) => a.term.localeCompare(b.term))) {
      const letter = t.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return [...map.entries()].map(([letter, terms]) => ({ letter, terms }));
  });

  activeLetters = computed(() => new Set(this.groups().map(g => g.letter)));

  scrollTo(letter: string): void {
    document.getElementById('glossary-' + letter)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
