import { Component, computed, inject, signal, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './services/auth.service';
import { ProgressService } from './services/progress.service';
import { DarkModeService } from './services/dark-mode.service';
import { SearchService, SEARCH_INDEX } from './services/search.service';
import { BreadcrumbComponent } from './components/shared/breadcrumb/breadcrumb';
import { PageSidebarComponent } from './components/shared/page-sidebar/page-sidebar';
import { SearchComponent } from './components/shared/search/search';
import { BackToTopComponent } from './components/shared/back-to-top/back-to-top';
import { GoNavComponent } from './components/shared/go-nav/go-nav';
import { DevopsNavComponent } from './components/shared/devops-nav/devops-nav';
import { ContainersNavComponent } from './components/shared/containers-nav/containers-nav';
import { AwsNavComponent } from './components/shared/aws-nav/aws-nav';
import { AzureNavComponent } from './components/shared/azure-nav/azure-nav';
import { LinuxNavComponent } from './components/shared/linux-nav/linux-nav';
import { TerraformNavComponent } from './components/shared/terraform-nav/terraform-nav';
import { MeshNavComponent } from './components/shared/mesh-nav/mesh-nav';
import { SysdesignNavComponent } from './components/shared/sysdesign-nav/sysdesign-nav';
import { ArchNavComponent } from './components/shared/arch-nav/arch-nav';
import { DpNavComponent } from './components/shared/dp-nav/dp-nav';
import { SecurityNavComponent } from './components/shared/security-nav/security-nav';
import { ApiDesignNavComponent } from './components/shared/api-design-nav/api-design-nav';
import { ObsNavComponent } from './components/shared/obs-nav/obs-nav';
import { MongoNavComponent } from './components/shared/mongo-nav/mongo-nav';
import { RedisNavComponent } from './components/shared/redis-nav/redis-nav';
import { GqlNavComponent } from './components/shared/gql-nav/gql-nav';
import { MessagingNavComponent } from './components/shared/messaging-nav/messaging-nav';
import { TestingNavComponent } from './components/shared/testing-nav/testing-nav';
import { DsaNavComponent } from './components/shared/dsa-nav/dsa-nav';
import { AiNavComponent } from './components/shared/ai-nav/ai-nav';

// Difficulty metadata for nav badges
const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

// Phase 10 — subtopic pages, keyed by parent topic route slug (e.g. 'counter').
// Populated incrementally as subtopic pages are built; topics without an
// entry here simply render no nested list (no forced empty expand arrow).
interface SubtopicNavEntry { label: string; route: string; }
const SUBTOPICS: Record<string, SubtopicNavEntry[]> = {
  counter: [
    { label: 'What Is a Signal?', route: '/angular/counter/what-is-a-signal' },
    { label: 'computed() — Derived State', route: '/angular/counter/computed' },
    { label: 'effect() — Reactive Side Effects', route: '/angular/counter/effects' },
    { label: '@if and @for — Control Flow', route: '/angular/counter/control-flow' },
    { label: 'Signals in Services', route: '/angular/counter/readonly-and-services' },
    { label: 'RxJS Interop', route: '/angular/counter/rxjs-interop' },
  ],
  todo: [
    { label: 'inject() — Modern Dependency Injection', route: '/angular/todo/inject-di' },
    { label: 'Reactive Forms Basics', route: '/angular/todo/reactive-forms-basics' },
    { label: 'Route Guards', route: '/angular/todo/route-guards' },
    { label: 'Signal-Based Services', route: '/angular/todo/signal-based-services' },
    { label: 'Custom & Async Validators', route: '/angular/todo/custom-validators' },
    { label: 'Form State — touched, dirty, status', route: '/angular/todo/form-state' },
  ],
  forms: [
    { label: 'Template-Driven vs Reactive', route: '/angular/forms/template-driven-vs-reactive' },
    { label: 'FormGroup, FormControl & FormArray', route: '/angular/forms/formgroup-formcontrol-formarray' },
    { label: 'Cross-Field Validators', route: '/angular/forms/cross-field-validators' },
    { label: 'Typed Forms', route: '/angular/forms/typed-forms' },
  ],
  http: [
    { label: 'HttpClient Setup', route: '/angular/http/httpclient-setup' },
    { label: 'GET Requests — toSignal() and httpResource()', route: '/angular/http/get-requests' },
    { label: 'Mutation Requests — POST, PUT, DELETE', route: '/angular/http/mutation-requests' },
    { label: 'Error Handling & Retry', route: '/angular/http/error-handling-retry' },
  ],
  'http-interceptors': [
    { label: 'What Are Interceptors?', route: '/angular/http-interceptors/what-are-interceptors' },
    { label: 'Auth Interceptor & Token Refresh', route: '/angular/http-interceptors/auth-interceptor-token-refresh' },
    { label: 'Global Error Interceptor', route: '/angular/http-interceptors/global-error-interceptor' },
    { label: 'Loading Spinner & HttpContext', route: '/angular/http-interceptors/loading-spinner-httpcontext' },
  ],
  'parent-child': [
    { label: 'input() — Modern @Input', route: '/angular/parent-child/input-signals' },
    { label: 'output() — Modern @Output', route: '/angular/parent-child/output-signals' },
    { label: 'model() — Two-Way Binding', route: '/angular/parent-child/model-two-way-binding' },
    { label: 'viewChild() and viewChildren()', route: '/angular/parent-child/viewchild-viewchildren' },
    { label: 'contentChild() & Migration', route: '/angular/parent-child/contentchild-migration' },
  ],
  'form-array': [
    { label: 'FormArray of FormGroups', route: '/angular/form-array/dynamic-formarray-of-groups' },
    { label: 'Typed FormArray', route: '/angular/form-array/typed-formarray' },
    { label: 'Add, Remove & Reorder', route: '/angular/form-array/formarray-crud-patterns' },
    { label: 'Validating the Array Itself', route: '/angular/form-array/formarray-level-validation' },
  ],
  defer: [
    { label: 'What Is @defer?', route: '/angular/defer/defer-basics' },
    { label: 'Trigger Conditions', route: '/angular/defer/defer-triggers' },
    { label: 'Placeholder, Loading & Error', route: '/angular/defer/placeholder-loading-error' },
    { label: 'Requirements & Nesting', route: '/angular/defer/defer-requirements-nesting' },
    { label: 'Performance & Prefetching', route: '/angular/defer/defer-performance-prefetch' },
  ],
  material: [
    { label: 'Setup & Theming', route: '/angular/material/material-setup-theming' },
    { label: 'Form Fields, Inputs & Validation', route: '/angular/material/material-form-fields' },
    { label: 'Buttons, Dialogs & Snackbars', route: '/angular/material/material-common-components' },
    { label: 'MatTable — Sorting & Pagination', route: '/angular/material/mattable-sorting-pagination' },
    { label: 'Testing, Accessibility & Performance', route: '/angular/material/material-testing-accessibility' },
  ],
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BreadcrumbComponent,
            PageSidebarComponent, SearchComponent, BackToTopComponent, GoNavComponent, DevopsNavComponent, ContainersNavComponent, AwsNavComponent, AzureNavComponent, LinuxNavComponent, TerraformNavComponent, MeshNavComponent, SysdesignNavComponent, ArchNavComponent, DpNavComponent, SecurityNavComponent, ApiDesignNavComponent, ObsNavComponent, MongoNavComponent, RedisNavComponent, GqlNavComponent, MessagingNavComponent, TestingNavComponent, DsaNavComponent, AiNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  auth     = inject(AuthService);
  progress = inject(ProgressService);
  darkMode = inject(DarkModeService);
  search   = inject(SearchService);

  private platform = inject(PLATFORM_ID);
  navOpen = signal(
    isPlatformBrowser(this.platform) ? window.innerWidth >= 769 : true
  );

  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  // Current route key for progress dot
  currentRoute = computed(() =>
    this.currentUrl().replace(/\?.*/, '').split('/').filter(Boolean)[0] ?? ''
  );

  showLeftNav = computed(() => this.currentUrl() !== '/');
  showSidebar = computed(() => {
    const url = this.currentUrl();
    return !['/','','/angular','/csharp','/aspnet','/sql',
      '/html','/css','/javascript','/typescript','/react','/blazor','/performance',
      '/node','/python','/go',
      '/mongodb','/redis','/graphql','/messaging',
      '/design-patterns','/arch-patterns','/api-design','/system-design','/security','/observability',
      '/devops','/linux','/containers','/terraform','/azure','/aws','/service-mesh',
      '/dsa','/testing-hub','/ai',
    ].includes(url);
  });

  currentSection = computed<'angular' | 'csharp' | 'aspnet' | 'sql' | 'typescript' | 'react' | 'javascript' | 'html' | 'css' | 'performance' | 'blazor' | 'node' | 'python' | 'go' | 'devops' | 'containers' | 'aws' | 'azure' | 'linux' | 'terraform' | 'mesh' | 'system-design' | 'arch-patterns' | 'design-patterns' | 'security' | 'api-design' | 'observability' | 'mongodb' | 'redis' | 'graphql' | 'messaging' | 'testing-hub' | 'dsa' | 'ai' | 'hub'>(() => {
    const url = this.currentUrl();
    if (url.startsWith('/angular'))    return 'angular';
    if (url.startsWith('/csharp'))     return 'csharp';
    if (url.startsWith('/aspnet'))     return 'aspnet';
    if (url.startsWith('/sql'))        return 'sql';
    if (url.startsWith('/typescript')) return 'typescript';
    if (url.startsWith('/react'))      return 'react';
    if (url.startsWith('/javascript')) return 'javascript';
    if (url.startsWith('/html'))       return 'html';
    if (url.startsWith('/css'))        return 'css';
    if (url.startsWith('/performance')) return 'performance';
    if (url.startsWith('/blazor'))     return 'blazor';
    if (url.startsWith('/node'))       return 'node';
    if (url.startsWith('/python'))     return 'python';
    if (url.startsWith('/go'))         return 'go';
    if (url.startsWith('/devops'))     return 'devops';
    if (url.startsWith('/containers')) return 'containers';
    if (url.startsWith('/aws'))        return 'aws';
    if (url.startsWith('/azure'))      return 'azure';
    if (url.startsWith('/linux'))      return 'linux';
    if (url.startsWith('/terraform'))    return 'terraform';
    if (url.startsWith('/service-mesh')) return 'mesh';
    if (url.startsWith('/system-design')) return 'system-design';
    if (url.startsWith('/arch-patterns')) return 'arch-patterns';
    if (url.startsWith('/design-patterns')) return 'design-patterns';
    if (url.startsWith('/security'))      return 'security';
    if (url.startsWith('/api-design'))    return 'api-design';
    if (url.startsWith('/observability')) return 'observability';
    if (url.startsWith('/mongodb'))       return 'mongodb';
    if (url.startsWith('/redis'))         return 'redis';
    if (url.startsWith('/graphql'))       return 'graphql';
    if (url.startsWith('/messaging'))     return 'messaging';
    if (url.startsWith('/testing-hub'))  return 'testing-hub';
    if (url.startsWith('/dsa'))          return 'dsa';
    if (url.startsWith('/ai'))           return 'ai';
    return 'hub';
  });

  toggleNav()  { this.navOpen.update(v => !v); }
  closeNav()   { this.navOpen.set(false); }

  diff(route: string) { return DIFF[route] ?? null; }

  subtopicsOf(routeSlug: string): SubtopicNavEntry[] | null {
    return SUBTOPICS[routeSlug] ?? null;
  }

  // Phase 10 — subtopics list per topic collapses by default; expand state
  // does not persist across reloads (a fresh page load always starts collapsed).
  private expandedTopics = signal<Set<string>>(new Set());

  isSubtopicsExpanded(routeSlug: string): boolean {
    return this.expandedTopics().has(routeSlug);
  }

  toggleSubtopics(routeSlug: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const next = new Set(this.expandedTopics());
    next.has(routeSlug) ? next.delete(routeSlug) : next.add(routeSlug);
    this.expandedTopics.set(next);
  }

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (isPlatformBrowser(this.platform) && window.innerWidth < 769) {
          this.navOpen.set(false);
        }
        this.autoExpandForCurrentUrl();
      });
    this.autoExpandForCurrentUrl();
  }

  // Auto-expand a topic's subtopics accordion when landing directly on one of
  // its subtopic pages (bookmark, prev/next pager, refresh) — otherwise the
  // active link would be hidden inside a collapsed accordion with no clue
  // where in the nav tree the reader actually is.
  private autoExpandForCurrentUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const [topicSlug, subs] of Object.entries(SUBTOPICS)) {
      if (subs.some(s => s.route === url)) {
        this.expandedTopics.update(set => new Set(set).add(topicSlug));
        break;
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (isPlatformBrowser(this.platform) && window.innerWidth < 769) {
      this.navOpen.set(false);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(e: UIEvent) {
    const w = (e.target as Window).innerWidth;
    if (w >= 769 && !this.navOpen()) this.navOpen.set(true);
    if (w < 769  &&  this.navOpen()) this.navOpen.set(false);
  }
}
