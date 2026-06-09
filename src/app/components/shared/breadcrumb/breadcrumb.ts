import { Component, inject } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

interface Crumb { label: string; path: string; }

const ROUTE_LABELS: Record<string, string> = {
  '':                   'Home',
  'counter':            'Signals & State',
  'template-syntax':    'Template Syntax',
  'directives':         'Directives',
  'lifecycle':          'Lifecycle Hooks',
  'pipes':              'Pipes',
  'di':                 'Dependency Injection',
  'parent-child':       'Input / Output',
  'content-projection': 'Content Projection',
  'change-detection':   'Change Detection',
  'animations':         'Animations',
  'forms':              'Forms',
  'form-array':         'FormArray',
  'todo':               'Todo (guarded)',
  'zod-forms':          'Zod Validation',
  'custom-validators':  'Custom Validators',
  'cva':                'Control Value Accessor',
  'dynamic-forms':      'Dynamic Forms',
  'wizard-form':        'Wizard Form',
  'http':               'HTTP Client',
  'routing':            'Routing',
  'defer':              '@defer Blocks',
  'store':              'Signal Store',
  'rxjs':               'RxJS Operators',
  'testing':            'Testing',
  'route-resolvers':    'Route Resolvers',
  'preloading':         'Preloading',
  'material':           'Angular Material',
  'charts':             'Charts',
  'cdk':                'Angular CDK',
  'ag-grid':            'AG Grid',
  'tanstack-query':     'TanStack Query',
  'date-fns':           'date-fns',
  'tailwind':           'Tailwind CSS',
  'resource-api':       'resource() API',
  'ngrx-signals':       'NgRx Signals',
  'destroy-ref':        'DestroyRef',
  'linked-signal':      'linkedSignal()',
  'zoneless':           'Zoneless Angular',
  'e2e':                'E2E (Playwright)',
  'harnesses':          'Harnesses',
  'ng-image':           'NgOptimizedImage',
  'web-workers':        'Web Workers',
  'pwa':                'PWA / Service Worker',
  'i18n':               'i18n',
  'ssr':                'SSR + Hydration',
};

const SECTION_LABELS: Record<string, string> = {
  'counter':            'Core',
  'template-syntax':    'Core',
  'directives':         'Core',
  'lifecycle':          'Core',
  'pipes':              'Core',
  'di':                 'Core',
  'parent-child':       'Core',
  'content-projection': 'Core',
  'change-detection':   'Core',
  'animations':         'Core',
  'forms':              'Forms',
  'form-array':         'Forms',
  'todo':               'Forms',
  'zod-forms':          'Forms',
  'custom-validators':  'Forms',
  'cva':                'Forms',
  'dynamic-forms':      'Forms',
  'wizard-form':        'Forms',
  'http':               'Advanced',
  'routing':            'Advanced',
  'defer':              'Advanced',
  'store':              'Advanced',
  'rxjs':               'Advanced',
  'testing':            'Advanced',
  'route-resolvers':    'Advanced',
  'preloading':         'Advanced',
  'material':           'UI',
  'charts':             'UI',
  'cdk':                'UI',
  'ag-grid':            'UI',
  'tanstack-query':     'UI',
  'date-fns':           'UI',
  'tailwind':           'UI',
  'resource-api':       'Modern APIs',
  'ngrx-signals':       'Modern APIs',
  'destroy-ref':        'Modern APIs',
  'linked-signal':      'Modern APIs',
  'zoneless':           'Modern APIs',
  'e2e':                'Testing',
  'harnesses':          'Testing',
  'ng-image':           'Platform',
  'web-workers':        'Platform',
  'pwa':                'Platform',
  'i18n':               'Platform',
  'ssr':                'Platform',
};

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (crumbs().length > 1) {
      <nav class="breadcrumb" aria-label="breadcrumb">
        <a routerLink="/" class="bc-home" title="Home">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
          </svg>
        </a>
        @if (section()) {
          <span class="bc-sep">›</span>
          <span class="bc-section">{{ section() }}</span>
        }
        <span class="bc-sep">›</span>
        <span class="bc-current">{{ currentLabel() }}</span>
      </nav>
    }`,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: .3rem;
      padding: .7rem 1.25rem .3rem;
      font-size: .82rem;
      color: #9ca3af;
    }
    .bc-home {
      display: flex;
      align-items: center;
      color: #6366f1;
      text-decoration: none;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background .12s;
      &:hover { background: #f0f0ff; color: #4338ca; }
    }
    .bc-sep { color: #d1d5db; font-size: .9rem; }
    .bc-section {
      color: #9ca3af;
      font-size: .78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .bc-current {
      color: #374151;
      font-weight: 600;
      font-size: .82rem;
    }
  `],
})
export class BreadcrumbComponent {
  private router = inject(Router);

  private routeKey = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url.replace(/\?.*/, '').split('/').filter(Boolean)[0] ?? ''),
    ),
    { initialValue: '' },
  );

  crumbs = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const segments = this.router.url.replace(/\?.*/, '').split('/').filter(Boolean);
        const crumbs: Crumb[] = [{ label: 'Home', path: '/' }];
        segments.forEach((seg, i) => {
          const path = '/' + segments.slice(0, i + 1).join('/');
          crumbs.push({ label: ROUTE_LABELS[seg] ?? seg, path });
        });
        return crumbs;
      }),
    ),
    { initialValue: [] as Crumb[] },
  );

  currentLabel = () => {
    const key = this.routeKey();
    return ROUTE_LABELS[key] ?? key;
  };

  section = () => {
    const key = this.routeKey();
    return SECTION_LABELS[key] ?? null;
  };
}
