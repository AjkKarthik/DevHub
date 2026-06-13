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
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';

@Component({
  selector: 'app-standalone-migration',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, BeforeAfterComponent,
  ],
  templateUrl: './standalone-migration.html',
  styleUrl: './standalone-migration.scss',
})
export class StandaloneMigrationDemo {

  quickRef: QuickRefItem[] = [
    { name: 'ng generate @angular/core:standalone',       type: 'syntax',   desc: 'Run the official migration schematic — 3-pass automated migration to standalone', since: 'Angular 15+' },
    { name: 'standalone: true',                           type: 'decorator', desc: 'Makes a component/directive/pipe self-contained — declares its own dependencies in imports[]', since: 'Angular 14' },
    { name: 'bootstrapApplication(AppComponent, config)', type: 'function', desc: 'New entry point replacing platformBrowserDynamic().bootstrapModule(AppModule)', since: 'Angular 14' },
    { name: 'importProvidersFrom(SomeModule)',            type: 'function',  desc: 'Extract providers from an NgModule for use in bootstrapApplication — bridge for legacy modules', since: 'Angular 14' },
    { name: 'provideRouter(routes)',                      type: 'function',  desc: 'Replaces RouterModule.forRoot() in standalone apps', since: 'Angular 14' },
    { name: 'provideHttpClient()',                        type: 'function',  desc: 'Replaces HttpClientModule in standalone apps', since: 'Angular 14' },
    { name: 'provideAnimationsAsync()',                   type: 'function',  desc: 'Replaces BrowserAnimationsModule in standalone apps', since: 'Angular 17' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What standalone means and why migrate',
      points: [
        'A <strong>standalone component</strong> (<code>standalone: true</code>) declares its own dependencies in its <code>imports: []</code> array — exactly like a mini-module. It can be used without being declared in any NgModule.',
        'NgModules were Angular\'s original compilation unit and DI boundary. They added cognitive overhead: every new component had to be declared in a module, every dependency had to be imported into that module, and module re-exports created complex graphs that were hard to reason about.',
        'Standalone components are the Angular default from v17 onward. They are simpler, more tree-shakeable, and enable new features like <code>@defer</code> blocks, <code>provideRouter()</code>, and <code>httpResource()</code> that require a standalone context.',
        'Migration is not required — NgModule apps continue to work — but new Angular features target the standalone model. Migrating now prevents technical debt accumulation.',
      ],
    },
    {
      heading: 'The three-pass schematic',
      points: [
        'Run <code>ng generate @angular/core:standalone</code> in the project root. The schematic prompts which of three passes to run. Run them <strong>in order, one at a time</strong>.',
        '<strong>Pass 1 — Convert to standalone:</strong> Adds <code>standalone: true</code> to every component, directive, and pipe. Moves their <code>NgModule.declarations</code> entries into each component\'s own <code>imports[]</code>. Components now compile without their module.',
        '<strong>Pass 2 — Remove unnecessary NgModule imports:</strong> Removes <code>CommonModule</code> and other re-exported modules from NgModules that are now unnecessary because components import what they need directly. Shrinks or eliminates shared modules.',
        '<strong>Pass 3 — Switch to standalone bootstrap:</strong> Replaces <code>platformBrowserDynamic().bootstrapModule(AppModule)</code> in <code>main.ts</code> with <code>bootstrapApplication(AppComponent, appConfig)</code>. Moves root providers from AppModule into <code>app.config.ts</code>.',
      ],
    },
    {
      heading: 'Manual steps and what to verify after each pass',
      points: [
        'After Pass 1: run <code>ng build</code> and fix any compile errors. Common issue: a component used a pipe or directive from a shared module but now needs to import it directly. The schematic may miss some implicit imports.',
        'After Pass 2: run tests. CommonModule removal can break templates that relied on <code>NgIf</code>, <code>NgFor</code>, <code>NgClass</code>, <code>AsyncPipe</code> — these now need to be imported individually or via a shared list.',
        'After Pass 3: verify the app bootstraps correctly. Check that all root-level providers (HTTP, router, animations, auth, state management) are in <code>app.config.ts</code>. Use <code>importProvidersFrom()</code> for any third-party modules that haven\'t been updated yet.',
        'For lazy-loaded routes: replace <code>RouterModule.forChild(routes)</code> with a plain <code>routes: Routes</code> array exported from the route file. The router\'s lazy loading picks up standalone components directly.',
      ],
    },
    {
      heading: 'CommonModule removal and direct imports',
      points: [
        'After migrating, remove <code>CommonModule</code> from all imports. Replace it with explicit imports: <code>NgIf</code> → <code>@if</code> (built-in, no import), <code>NgFor</code> → <code>@for</code> (built-in), <code>NgClass</code> → still needs to be imported, <code>AsyncPipe</code> → still needs to be imported.',
        'Angular 17+ control flow (<code>@if</code>, <code>@for</code>, <code>@switch</code>) is built into the template engine — no import needed. If you\'re on Angular 17+ you can migrate NgIf/NgFor to the new syntax at the same time.',
        'A practical tip: create a <code>shared/common-imports.ts</code> file that exports an array of the most-used pipes and directives. Each component can spread it: <code>imports: [...COMMON_IMPORTS, SpecificPipe]</code>.',
        'FormsModule and ReactiveFormsModule: components using template-driven or reactive forms must import these directly. The schematic handles this, but verify after pass 2.',
      ],
    },
    {
      heading: 'SCAM pattern and gradual migration',
      points: [
        'The SCAM (Single Component Angular Module) pattern is an intermediate step: each component gets its own tiny NgModule that declares only that component and imports what it needs. This makes each component behave like a standalone component even before the migration, and the diff per component is small.',
        'For large apps, migrate one feature at a time: convert a feature module\'s components to standalone, remove the feature module, then move on to the next feature. Run tests after each feature to catch regressions early.',
        'Components can be standalone even in apps that still have NgModules — you can declare a standalone component in an NgModule (just not the reverse). This hybrid state is stable and supported.',
        'Priority for migration: start with leaf components (no children) since they have the simplest dependency graphs. Work up toward smart/container components and routed components last.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before & after: component',
      language: 'typescript',
      code: `// ── BEFORE: NgModule-based ───────────────────────────────────────────────────
// app.module.ts
@NgModule({
  declarations: [AppComponent, UserCardComponent, UserListComponent],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes)],
  bootstrap: [AppComponent],
})
export class AppModule {}

// user-card.component.ts — no imports array, relies on module
@Component({ selector: 'app-user-card', templateUrl: './user-card.html' })
export class UserCardComponent { @Input() user!: User; }

// ── AFTER: Standalone ─────────────────────────────────────────────────────────
// app.config.ts — root providers
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
  ],
};

// main.ts
bootstrapApplication(AppComponent, appConfig);

// user-card.component.ts — self-contained
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [NgClass, CurrencyPipe],  // only what THIS template uses
  templateUrl: './user-card.html',
})
export class UserCardComponent { user = input.required<User>(); }`,
    },
    {
      label: 'Three-pass migration',
      language: 'typescript',
      code: `// Run in project root — three separate commands in order:

// PASS 1: Mark all components/directives/pipes as standalone
// ng generate @angular/core:standalone
// Choose: "Convert all components, directives and pipes to standalone"

// Result — schematic auto-generates this:
// Before:
// @Component({ selector: 'app-nav', templateUrl: './nav.html' })
// export class NavComponent { ... }

// After Pass 1:
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],  // moved from AppModule
  templateUrl: './nav.html',
})
export class NavComponent { ... }

// PASS 2: Remove unnecessary NgModule imports
// ng generate @angular/core:standalone
// Choose: "Remove unnecessary NgModule classes"

// Shrinks or removes SharedModule, CommonModule imports from NgModules

// PASS 3: Switch to standalone bootstrap
// ng generate @angular/core:standalone
// Choose: "Bootstrap the application using standalone APIs"

// Result — main.ts changes:
// Before:
// platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));

// After:
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));`,
    },
    {
      label: 'app.config.ts patterns',
      language: 'typescript',
      code: `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { importProvidersFrom } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router — functional equivalent of RouterModule.forRoot()
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
    ),

    // HTTP — functional equivalent of HttpClientModule
    provideHttpClient(
      withInterceptors([authInterceptor, loggingInterceptor]),
    ),

    // Animations — lazy-loaded (Angular 17+)
    provideAnimationsAsync(),

    // Zone-based CD (default, explicit for clarity)
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Legacy module bridge — until the library ships standalone APIs
    importProvidersFrom(SomeThirdPartyModule.forRoot({ apiKey: '...' })),

    // Feature-specific providers
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
};`,
    },
    {
      label: 'Lazy routes in standalone apps',
      language: 'typescript',
      code: `// ── BEFORE: lazy loading with a feature module ───────────────────────────────
// app.routes.ts
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
];

// admin.module.ts
@NgModule({
  declarations: [AdminComponent, AdminDashComponent],
  imports: [CommonModule, RouterModule.forChild(adminRoutes)],
})
export class AdminModule {}

// ── AFTER: lazy loading with standalone components ────────────────────────────
// app.routes.ts
const routes: Routes = [
  {
    path: 'admin',
    // Load the routes file directly — no module needed
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
  },
  // Or load a single standalone component:
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent),
  },
];

// admin/admin.routes.ts — just a plain Routes array
export const adminRoutes: Routes = [
  { path: '',        component: AdminComponent },
  { path: 'dashboard', loadComponent: () => import('./dashboard').then(m => m.AdminDashComponent) },
];`,
    },
    {
      label: 'Shared imports helper',
      language: 'typescript',
      code: `// shared/common-imports.ts — avoids repeating the same imports in every component
import { NgClass, NgStyle, AsyncPipe, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

export const COMMON_IMPORTS = [
  NgClass, NgStyle, AsyncPipe, DatePipe, CurrencyPipe, DecimalPipe,
  RouterLink, RouterLinkActive,
] as const;

export const FORM_IMPORTS = [
  ReactiveFormsModule,
] as const;

// In any component:
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [...COMMON_IMPORTS, ProductBadgeComponent],
  template: \`...\`,
})
export class ProductCardComponent {}

// Note: With Angular 17+ @if/@for control flow, you no longer need
// NgIf and NgFor in COMMON_IMPORTS — they are built into the template engine.`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'AppModule bootstrap → bootstrapApplication',
      language: 'typescript',
      before: `// main.ts — NgModule bootstrap
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));

// app.module.ts
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
    BrowserAnimationsModule,
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}`,
      after: `// main.ts — standalone bootstrap
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));

// app.config.ts — providers extracted here
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
  ],
};

// AppModule is deleted — no longer needed`,
      note: 'bootstrapApplication is tree-shakeable and function-based. The explicit providers list is more readable than chasing imports through NgModule graphs.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running the passes out of order or skipping pass 2',
      wrong: `// Running pass 3 before pass 1 — app breaks immediately
// Or: running passes 1 + 3 and skipping pass 2 — NgModules still exist with redundant imports`,
      right: `// Always run: Pass 1 → build → Pass 2 → build → Pass 3 → build
// Each pass has a prerequisite in the previous one.
// Pass 2 can't remove module imports until pass 1 has moved them to components.
// Pass 3 can't remove AppModule until pass 2 has cleaned up dependencies.`,
      explanation: 'The three passes are sequential and dependent. Running them out of order either breaks the app immediately or leaves dead code. Always build and verify between passes to catch issues early.',
    },
    {
      title: 'Forgetting to remove CommonModule after migration',
      wrong: `@Component({
  standalone: true,
  imports: [CommonModule, NgIf, AsyncPipe],  // CommonModule still here — ships extra code
})`,
      right: `@Component({
  standalone: true,
  imports: [NgClass, AsyncPipe],  // only what's actually used in the template
  // NgIf and NgFor → replaced with @if/@for (Angular 17+ built-in, no import)
})`,
      explanation: 'CommonModule includes NgIf, NgFor, NgSwitch, DatePipe, CurrencyPipe, and more. After migrating to standalone, import only what your template uses. With Angular 17+ @if/@for, NgIf and NgFor are not needed at all.',
    },
    {
      title: 'Using RouterModule.forRoot() / forChild() in standalone apps',
      wrong: `// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(RouterModule.forRoot(routes)),  // old pattern
  ],
};`,
      right: `// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),  // modern API
  ],
};

// Feature routes — no RouterModule.forChild() either
export const featureRoutes: Routes = [...];`,
      explanation: 'In standalone apps, use provideRouter() instead of RouterModule.forRoot(). Feature routes are plain Routes arrays — no forChild() needed. provideRouter() is tree-shakeable and supports functional configuration with withXxx() helpers.',
    },
    {
      title: 'Not handling third-party NgModules after pass 3',
      wrong: `// app.config.ts — third-party module not bridged
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],  // NgRx StoreModule not included
};
// Result: inject(Store) throws NullInjectorError at runtime`,
      right: `// Bridge legacy NgModules with importProvidersFrom
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(
      StoreModule.forRoot(reducers),        // NgRx — until NgRx 16 provideStore()
      EffectsModule.forRoot([AppEffects]),
    ),
  ],
};`,
      explanation: 'Third-party libraries that ship NgModules (not yet standalone) must be bridged with importProvidersFrom(). Without it, any service provided by those modules will throw NullInjectorError.',
    },
  ];

  challenge: Challenge = {
    title: 'Migrate a mini NgModule app to standalone',
    language: 'typescript',
    description: `Below is a small NgModule-based Angular app. Migrate it to standalone:
1. Add standalone: true to all components
2. Move dependencies from NgModule.imports to each component's imports[]
3. Replace the AppModule bootstrap with bootstrapApplication + app.config.ts
4. Replace HttpClientModule with provideHttpClient() and RouterModule.forRoot() with provideRouter()`,
    hints: [
      'UserCardComponent only uses NgClass — import just NgClass',
      'UserListComponent uses UserCardComponent and AsyncPipe — import both',
      'AppComponent uses RouterOutlet — import RouterOutlet standalone',
      'app.config.ts: provideRouter(routes) + provideHttpClient()',
      'main.ts: bootstrapApplication(AppComponent, appConfig)',
    ],
    starterCode: `// app.module.ts
@NgModule({
  declarations: [AppComponent, UserListComponent, UserCardComponent],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes), CommonModule],
  bootstrap: [AppComponent],
})
export class AppModule {}

// user-card.component.ts
@Component({ selector: 'app-user-card', template: '<div [ngClass]="cardClass">...</div>' })
export class UserCardComponent { @Input() user!: User; cardClass = 'card'; }

// user-list.component.ts
@Component({ selector: 'app-user-list', template: '@for (u of users$ | async; track u.id) { <app-user-card [user]="u" /> }' })
export class UserListComponent { users$ = inject(UserService).getUsers(); }

// app.component.ts
@Component({ selector: 'app-root', template: '<router-outlet />' })
export class AppComponent {}

// main.ts
platformBrowserDynamic().bootstrapModule(AppModule);`,
    solution: `// user-card.component.ts — standalone
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [NgClass],
  template: '<div [ngClass]="cardClass">...</div>',
})
export class UserCardComponent {
  user = input.required<User>();
  cardClass = 'card';
}

// user-list.component.ts — standalone
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserCardComponent, AsyncPipe],
  template: '@for (u of users$ | async; track u.id) { <app-user-card [user]="u" /> }',
})
export class UserListComponent {
  users$ = inject(UserService).getUsers();
}

// app.component.ts — standalone
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
};

// main.ts
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));

// app.module.ts — DELETE THIS FILE`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In the 3-pass standalone migration, what does Pass 1 do?',
      options: [
        'Switches main.ts to bootstrapApplication()',
        'Adds standalone: true to all components and moves their declarations to imports[]',
        'Removes NgModules from the codebase entirely',
        'Converts template syntax to @if/@for control flow',
      ],
      answer: 1,
      explanation: 'Pass 1 converts components, directives, and pipes to standalone: true and moves their NgModule.declarations into each component\'s own imports[]. The NgModules still exist after pass 1 but components no longer rely on them for compilation.',
    },
    {
      q: 'What replaces RouterModule.forRoot(routes) in a standalone app?',
      options: [
        'importProvidersFrom(RouterModule.forRoot(routes))',
        'provideRouter(routes) in the providers array of app.config.ts',
        'provideRoutes(routes) imported from @angular/router',
        'RouterModule stays the same — only the module-level declaration changes',
      ],
      answer: 1,
      explanation: 'provideRouter(routes) is the standalone equivalent of RouterModule.forRoot(). It accepts functional configuration helpers like withPreloading(), withComponentInputBinding(), etc. RouterModule.forRoot() still works via importProvidersFrom() but is not recommended.',
    },
    {
      q: 'A third-party library only exports an NgModule (no standalone APIs). How do you include it in a standalone app?',
      options: [
        'You cannot — third-party NgModules are incompatible with standalone apps',
        'importProvidersFrom(ThirdPartyModule.forRoot()) in app.config.ts providers',
        'Add it to the root component\'s imports[] array',
        'Wrap it in a SCAM module and import that SCAM in the component',
      ],
      answer: 1,
      explanation: 'importProvidersFrom() extracts providers from any NgModule and makes them available in a standalone app. This is the bridge API for libraries that have not yet shipped standalone support.',
    },
    {
      q: 'After running all 3 migration passes, what should you do with AppModule?',
      options: [
        'Keep it empty — Angular still requires an AppModule to bootstrap',
        'Delete it — bootstrapApplication no longer uses AppModule',
        'Rename it to AppConfig and keep the providers',
        'Move it to a feature module and lazy-load it',
      ],
      answer: 1,
      explanation: 'After pass 3, AppModule is replaced by app.config.ts (providers) and bootstrapApplication(AppComponent, appConfig) in main.ts. AppModule is completely redundant and should be deleted.',
    },
    {
      q: 'Which statement about CommonModule in standalone components is correct?',
      options: [
        'CommonModule must be imported in every standalone component',
        'CommonModule should be removed — import only the specific pipes/directives used',
        'CommonModule is automatically available in standalone components without importing',
        'CommonModule is required for @if and @for to work in standalone components',
      ],
      answer: 1,
      explanation: 'After migrating to standalone, import only what your template uses (NgClass, AsyncPipe, etc.) — not CommonModule. With Angular 17+ @if/@for built-in control flow, NgIf and NgFor are not needed at all. CommonModule ships unused code.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I mix standalone and NgModule components in the same app?',
      a: 'Yes — Angular fully supports hybrid apps. Standalone components can be declared in NgModules (they are used just like non-standalone declarations). NgModule-based components can be imported into standalone components via their NgModule (or if the NgModule is wrapped with importProvidersFrom). This hybrid state is the expected state mid-migration.',
    },
    {
      q: 'What is the SCAM pattern and is it still recommended?',
      a: 'SCAM (Single Component Angular Module) wraps each component in its own tiny NgModule — making it behave like a standalone component before Angular 14. SCAM was a useful intermediate pattern, but with Angular 14+ standalone: true it is no longer necessary. If you have existing SCAMs, the migration schematic handles them the same as any other NgModule.',
    },
    {
      q: 'Does migrating to standalone improve performance?',
      a: 'Modestly. Standalone components are more precisely tree-shakeable — the compiler only includes exactly what each component imports, rather than everything declared in a shared module. The bigger benefit is simpler mental model and reduced boilerplate. The largest perf wins come from pairing standalone with @defer lazy loading, provideHttpClient with functional interceptors, and Zoneless change detection.',
    },
    {
      q: 'What if the migration schematic fails or produces wrong output?',
      a: 'The schematic is generated code — verify after each pass. Common issues: (1) a component used a directive via a re-exporting shared module that the schematic didn\'t trace — add the import manually, (2) template-only directives (CDK, Material) were not added to imports[] — add them, (3) lazy-loaded modules with complex route configs may need manual cleanup. Always run ng build after each pass to surface compile errors immediately.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The 3-pass <code>ng generate @angular/core:standalone</code> schematic converts NgModule apps to standalone components: Pass 1 adds <code>standalone: true</code>, Pass 2 removes module bloat, Pass 3 switches to <code>bootstrapApplication()</code>.',
    mustKnow: [
      '3 passes run in order: (1) convert to standalone → (2) remove NgModule imports → (3) standalone bootstrap',
      '<code>bootstrapApplication(AppComponent, appConfig)</code> replaces <code>platformBrowserDynamic().bootstrapModule(AppModule)</code>',
      '<code>provideRouter()</code> replaces <code>RouterModule.forRoot()</code>; <code>provideHttpClient()</code> replaces <code>HttpClientModule</code>',
      '<code>importProvidersFrom(SomeNgModule)</code> bridges third-party NgModule libraries',
      'Remove <code>CommonModule</code> after migration — import only what each component uses',
      'Delete AppModule after Pass 3 — it serves no purpose',
    ],
    interviewFocus: [
      '<strong>What is standalone?</strong> — self-contained component; imports its own dependencies; no NgModule needed',
      '<strong>Migration steps?</strong> — 3 passes: standalone → clean imports → bootstrap; build between each',
      '<strong>provideRouter vs RouterModule?</strong> — provideRouter() is tree-shakeable, function-based; for standalone apps',
      '<strong>Third-party NgModules?</strong> — importProvidersFrom() bridges them until they ship standalone APIs',
    ],
  };
}
