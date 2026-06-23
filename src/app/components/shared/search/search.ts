import { Component, inject, HostListener, ElementRef, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SearchService } from '../../../services/search.service';

const DIFF_LABEL: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (svc.open()) {
      <div class="search-backdrop" (click)="close()"></div>
      <div class="search-modal" role="dialog" aria-label="Search">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input #inp class="search-input" type="text" placeholder="Search topics, concepts, APIs…"
                 [value]="svc.query()"
                 (input)="svc.query.set($any($event.target).value)"
                 (keydown.escape)="close()"
                 (keydown.arrowdown)="focusResult(0)"
                 autofocus />
          <kbd class="search-kbd" (click)="close()">Esc</kbd>
        </div>

        @if (svc.results().length) {
          <div class="search-results" role="listbox">
            @for (r of svc.results(); track r.route; let i = $index) {
              <a class="search-result" [routerLink]="url(r.route)" (click)="close()"
                 role="option" [attr.tabindex]="0"
                 (keydown.enter)="navigate(r.route)"
                 (keydown.arrowdown)="focusResult(i + 1)"
                 (keydown.arrowup)="focusResult(i - 1)">
                <div class="sr-title">{{ r.title }}</div>
                <div class="sr-meta">
                  <span class="sr-section">{{ r.section }}</span>
                  <span class="sr-diff diff-{{ r.difficulty }}">{{ diffLabel(r.difficulty) }}</span>
                </div>
              </a>
            }
          </div>
        } @else if (svc.query().length >= 2) {
          <div class="search-empty">No results for "{{ svc.query() }}"</div>
        } @else {
          <div class="search-hint">Type at least 2 characters to search…</div>
        }
      </div>
    }
  `,
  styles: [`
    .search-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 900;
    }
    .search-modal {
      position: fixed; top: 18vh; left: 50%; translate: -50% 0;
      width: min(600px, 94vw); background: var(--surface, #fff);
      border-radius: 14px; box-shadow: 0 24px 64px rgba(0,0,0,.25);
      z-index: 901; overflow: hidden;
    }
    .search-bar {
      display: flex; align-items: center; gap: .75rem;
      padding: .9rem 1.1rem; border-bottom: 1px solid var(--border, #e8e8e8);
    }
    .search-icon { font-size: 1rem; flex-shrink: 0; }
    .search-input {
      flex: 1; border: none; outline: none; font-size: 1rem;
      background: transparent; color: var(--text, #1a1a1a);
      &::placeholder { color: #9ca3af; }
    }
    .search-kbd {
      padding: .15rem .45rem; border: 1px solid #d1d5db; border-radius: 4px;
      font-size: .72rem; color: #6b7280; cursor: pointer; flex-shrink: 0;
    }
    .search-results { max-height: 420px; overflow-y: auto; }
    .search-result {
      display: flex; justify-content: space-between; align-items: center;
      padding: .75rem 1.1rem; text-decoration: none; cursor: pointer;
      border-bottom: 1px solid var(--border, #f0f0f0);
      transition: background .1s;
      &:hover, &:focus { background: var(--bg, #f5f5f5); outline: none; }
    }
    .sr-title { font-size: .92rem; font-weight: 600; color: var(--text, #1f2937); }
    .sr-meta  { display: flex; gap: .5rem; align-items: center; }
    .sr-section { font-size: .72rem; color: #9ca3af; }
    .sr-diff { font-size: .68rem; font-weight: 700; padding: 1px 6px; border-radius: 10px; }
    .diff-beginner     { background: #dcfce7; color: #166534; }
    .diff-intermediate { background: #fef9c3; color: #713f12; }
    .diff-advanced     { background: #fee2e2; color: #991b1b; }
    .search-empty, .search-hint {
      padding: 1.5rem; text-align: center; font-size: .88rem; color: #9ca3af;
    }
  `],
})
export class SearchComponent {
  svc    = inject(SearchService);
  router = inject(Router);
  el     = inject(ElementRef);

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); this.svc.openSearch(); }
  }

  close() { this.svc.closeSearch(); }

  // Index keys are bare ('counter') or prefixed ('csharp-basics', 'aspnet-routing');
  // actual URLs live under /angular/, /csharp/ and /aspnet/ respectively.
  url(route: string) {
    if (route.startsWith('csharp-')) return '/csharp/' + route.slice('csharp-'.length);
    if (route.startsWith('aspnet-')) return '/aspnet/' + route.slice('aspnet-'.length);
    if (route.startsWith('sql-'))    return '/sql/'        + route.slice('sql-'.length);
    if (route.startsWith('ts-'))     return '/typescript/' + route.slice('ts-'.length);
    if (route.startsWith('react-'))  return '/react/'      + route.slice('react-'.length);
    if (route.startsWith('js-'))     return '/javascript/' + route.slice('js-'.length);
    if (route.startsWith('html-'))   return '/html/'        + route.slice('html-'.length);
    if (route.startsWith('css-'))    return '/css/'         + route.slice('css-'.length);
    if (route.startsWith('perf-'))   return '/performance/' + route.slice('perf-'.length);
    if (route.startsWith('blazor-')) return '/blazor/'      + route.slice('blazor-'.length);
    if (route.startsWith('node-'))   return '/node/'        + route.slice('node-'.length);
    if (route.startsWith('py-'))     return '/python/'      + route.slice('py-'.length);
    if (route.startsWith('go-'))     return '/go/'          + route.slice('go-'.length);
    if (route.startsWith('devops-')) return '/devops/'      + route.slice('devops-'.length);
    if (route.startsWith('k8s-'))    return '/containers/'  + route.slice('k8s-'.length);
    if (route.startsWith('aws-'))    return '/aws/'         + route.slice('aws-'.length);
    if (route.startsWith('azure-'))  return '/azure/'       + route.slice('azure-'.length);
    if (route.startsWith('linux-'))  return '/linux/'       + route.slice('linux-'.length);
    if (route.startsWith('tf-'))     return '/terraform/'     + route.slice('tf-'.length);
    if (route.startsWith('mesh-'))        return '/service-mesh/'  + route.slice('mesh-'.length);
    if (route.startsWith('sysdesign-'))   return '/system-design/' + route.slice('sysdesign-'.length);
    if (route.startsWith('hub-'))    return '/'              + route.slice('hub-'.length);
    return '/angular/' + route;
  }

  navigate(route: string) { this.router.navigate([this.url(route)]); this.close(); }

  focusResult(i: number) {
    const items = this.el.nativeElement.querySelectorAll('.search-result') as NodeListOf<HTMLElement>;
    const target = items[Math.max(0, Math.min(i, items.length - 1))];
    target?.focus();
  }

  diffLabel(d: string) { return DIFF_LABEL[d] ?? d; }
}
