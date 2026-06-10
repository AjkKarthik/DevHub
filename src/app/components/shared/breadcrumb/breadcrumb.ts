import { Component, inject } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

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

const TECH_SECTIONS: Record<string, { label: string; path: string }> = {
  'angular': { label: 'Angular', path: '/angular' },
  'csharp':  { label: 'C#',     path: '/csharp'  },
};

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (segments().length > 0) {
      <nav class="breadcrumb" aria-label="breadcrumb">
        <a routerLink="/" class="bc-home" title="Home">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
          </svg>
        </a>
        @if (techSection()) {
          <span class="bc-sep">›</span>
          @if (segments().length > 1) {
            <a [routerLink]="techSection()!.path" class="bc-section-link">{{ techSection()!.label }}</a>
          } @else {
            <span class="bc-current">{{ techSection()!.label }}</span>
          }
        }
        @if (segments().length > 1) {
          <span class="bc-sep">›</span>
          <span class="bc-current">{{ pageLabel() }}</span>
        }
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
    .bc-section-link {
      color: #6366f1;
      font-size: .82rem;
      font-weight: 600;
      text-decoration: none;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background .12s;
      &:hover { background: #f0f0ff; color: #4338ca; }
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

  segments = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url.replace(/\?.*/, '').split('/').filter(Boolean)),
    ),
    { initialValue: [] as string[] },
  );

  techSection = () => {
    const segs = this.segments();
    return segs.length > 0 ? (TECH_SECTIONS[segs[0]] ?? null) : null;
  };

  pageLabel = () => {
    const segs = this.segments();
    if (segs.length < 2) return '';
    const key = segs[segs.length - 1];
    return ROUTE_LABELS[key] ?? key;
  };
}
