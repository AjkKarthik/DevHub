import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-named-outlet-lifecycle-and-detail-drawer-pattern-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './named-outlet-lifecycle-and-detail-drawer-pattern.html',
  styleUrl: './named-outlet-lifecycle-and-detail-drawer-pattern.scss',
})
export class NamedOutletLifecycleAndDetailDrawerPatternSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'RouterOutlet\'s (activate)/(deactivate) events — outlet-level lifecycle hooks',
      points: [
        'Beyond just rendering a component, <code>&lt;router-outlet name="drawer" (activate)="onActivate($event)" (deactivate)="onDeactivate()" /&gt;</code> exposes events specifically for the OUTLET itself — <code>(activate)</code> fires with the newly-created component INSTANCE the moment a route activates into that outlet, and <code>(deactivate)</code> fires when the outlet\'s content is cleared (component destroyed).',
        'This is DIFFERENT from the component\'s own <code>ngOnInit</code>/<code>ngOnDestroy</code> — it is the PARENT (holding the outlet) reacting to the CHILD outlet\'s lifecycle from the outside, useful for things like tracking analytics ("drawer opened with X"), or coordinating layout (adding a CSS class to shift the main content when a drawer opens).',
      ],
    },
    {
      heading: 'The detail-drawer pattern — a named outlet as a URL-addressable side panel',
      points: [
        'A "click a list item, see details in a side drawer, URL reflects it, browser back closes it" UX is EXACTLY what named outlets are built for: <code>router.navigate([{ outlets: { drawer: [\'item\', id] } }])</code> opens the drawer with that item\'s detail route, and <code>router.navigate([{ outlets: { drawer: null } }])</code> closes it — all while the PRIMARY outlet\'s content (the list) stays completely untouched.',
        'Because the drawer state lives IN THE URL, the drawer survives a page refresh, is shareable via a copied link, and the browser\'s back button naturally closes it (since it is a distinct navigation entry) — none of which a component-internal boolean flag (<code>showDrawer = signal(false)</code>) gives you for free.',
      ],
    },
    {
      heading: 'Coordinating drawer open/close with the (activate)/(deactivate) events',
      points: [
        'Use <code>(activate)</code> on the drawer outlet to add a CSS class to the layout container (e.g. <code>drawerOpen.set(true)</code>) that shifts/dims the primary content — and <code>(deactivate)</code> to reverse it — giving a genuinely CSS-driven open/close ANIMATION triggered by real router navigation events, rather than a manually-managed component boolean that could drift out of sync with the actual URL state.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/detail.ts',
      content: `import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-detail',
  standalone: true,
  template: \`<div style="padding: 1rem; background: #eef2ff;">Detail for item {{ id }}</div>\`,
})
export class DetailComponent {
  id = inject(ActivatedRoute).snapshot.paramMap.get('id');
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { DetailComponent } from './detail';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: \`
    <h3>Named-outlet detail drawer — coordinated via (activate)/(deactivate)</h3>
    <div style="display: flex; gap: 1rem;">
      <div>
        <p (click)="openDrawer('1')" style="cursor: pointer;">Item 1</p>
        <p (click)="openDrawer('2')" style="cursor: pointer;">Item 2</p>
        <router-outlet />
      </div>
      <div
        [style.width.px]="drawerOpen() ? 250 : 0"
        style="overflow: hidden; transition: width 300ms ease; background: #f9fafb;">
        <router-outlet
          name="drawer"
          (activate)="drawerOpen.set(true)"
          (deactivate)="drawerOpen.set(false)" />
        @if (drawerOpen()) {
          <button (click)="closeDrawer()">Close</button>
        }
      </div>
    </div>
  \`,
})
export class App {
  private router = inject(Router);
  drawerOpen = signal(false);

  openDrawer(id: string) {
    this.router.navigate([{ outlets: { drawer: ['detail', id] } }]);
  }

  closeDrawer() {
    this.router.navigate([{ outlets: { drawer: null } }]);
  }
}
`,
    },
    {
      path: 'src/app/app.routes.ts',
      content: `import { Routes } from '@angular/router';
import { DetailComponent } from './detail';

export const routes: Routes = [
  { path: 'detail/:id', component: DetailComponent, outlet: 'drawer' },
];
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, { providers: [provideRouter(routes)] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Named outlet lifecycle and detail drawer pattern</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Item 1", then click "Item 2" without closing the drawer first — verify the drawer content swaps directly to Item 2\'s detail without any flicker of a closed/reopened state.',
    hint: 'Navigating to a new drawer outlet route while one is already active replaces the outlet\'s content directly — (deactivate) does NOT fire in between since the outlet never becomes empty, only (activate) fires again with the new component instance.',
    solution: `// No code change needed — this confirms that swapping between two
// active drawer routes updates the outlet's content directly without
// an intermediate empty/deactivated state, since the outlet itself
// never becomes empty during the transition.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '(activate) and (deactivate) on a router-outlet are the same as the component\'s own ngOnInit/ngOnDestroy.',
      reality: 'they are genuinely different — (activate)/(deactivate) are events on the OUTLET itself, letting the PARENT holding the outlet react to the child route\'s lifecycle from the outside, distinct from the child component\'s own internal lifecycle hooks.',
    },
    {
      thought: 'a component-internal boolean flag (showDrawer signal) is just as good as a named outlet for a detail-drawer UX.',
      reality: 'a named outlet keeps the drawer state IN THE URL — surviving refresh, shareable via link, and closeable via the browser back button — none of which a purely component-internal flag provides without significant extra plumbing.',
    },
    {
      thought: 'swapping between two different routes both active in the same named outlet always fires (deactivate) then (activate).',
      reality: 'when navigating directly from one active drawer route to another, the outlet content swaps in place — (deactivate) does not fire in between since the outlet never becomes empty, only (activate) fires again with the new instance.',
    },
  ];
}
