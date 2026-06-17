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

// Difficulty metadata for nav badges
const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BreadcrumbComponent,
            PageSidebarComponent, SearchComponent, BackToTopComponent],
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

  currentSection = computed<'angular' | 'csharp' | 'aspnet' | 'sql' | 'typescript' | 'react' | 'hub'>(() => {
    const url = this.currentUrl();
    if (url.startsWith('/angular'))    return 'angular';
    if (url.startsWith('/csharp'))     return 'csharp';
    if (url.startsWith('/aspnet'))     return 'aspnet';
    if (url.startsWith('/sql'))        return 'sql';
    if (url.startsWith('/typescript')) return 'typescript';
    if (url.startsWith('/react'))      return 'react';
    return 'hub';
  });

  toggleNav()  { this.navOpen.update(v => !v); }
  closeNav()   { this.navOpen.set(false); }

  diff(route: string) { return DIFF[route] ?? null; }

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (isPlatformBrowser(this.platform) && window.innerWidth < 769) {
          this.navOpen.set(false);
        }
      });
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
