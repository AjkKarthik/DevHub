import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import type { Project, ProjectTemplate } from '@stackblitz/sdk';
import { DarkModeService } from '../../../services/dark-mode.service';

export interface PlaygroundFile { path: string; content: string; }

/**
 * Collapsed-by-default, embedded StackBlitz editor — the "learn by doing"
 * interactive example required on every Phase 10 subtopic page.
 *
 * Loads nothing (no SDK, no iframe) until the reader clicks "Run this
 * example". The StackBlitz SDK is dynamically imported at that point so it
 * never adds weight to the page's initial bundle. If the embed fails (ad
 * blockers, offline, corporate proxies blocking third-party iframes), the
 * static code block above this component still has the same code, and a
 * fallback button opens the same project directly on stackblitz.com in a
 * new tab instead of embedding it.
 *
 * Usage:
 *   <app-live-playground
 *     title="Creating a signal"
 *     template="angular-cli"
 *     [files]="[{ path: 'src/app/app.ts', content: '...' }]"
 *     openFile="src/app/app.ts" />
 */
@Component({
  selector: 'app-live-playground',
  standalone: true,
  template: `
    <div class="lp-wrap">
      @if (!loaded()) {
        <button type="button" class="lp-toggle" (click)="load()" [disabled]="loading()">
          <span class="lp-toggle-icon">▶</span>
          <span class="lp-toggle-text">{{ loading() ? 'Loading interactive editor…' : 'Run this example — ' + title() }}</span>
          @if (!loading()) { <span class="lp-toggle-chevron">▾</span> }
        </button>
        @if (failed()) {
          <p class="lp-error">
            Couldn't load the live editor — the code above still works, or
            <button type="button" class="lp-open-link" (click)="openInNewTab()">open this example on StackBlitz</button>.
          </p>
        }
      }
      <div #container class="lp-container" [class.lp-visible]="loaded()" [style.height.px]="height()"></div>
      @if (loaded()) {
        <div class="lp-actions">
          <button type="button" class="lp-open-link" (click)="openInNewTab()">Open in new tab ↗</button>
          <button type="button" class="lp-hide" (click)="reset()">▴ Hide live editor</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .lp-toggle {
      display: inline-flex;
      align-items: center;
      gap: .55rem;
      padding: .5rem 1rem;
      margin: .75rem 0;
      background: #1e293b;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: .875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s;

      &:hover:not(:disabled) { background: #334155; }
      &:disabled { opacity: .75; cursor: default; }
    }
    .lp-toggle-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #4f46e5;
      font-size: .6rem;
      padding-left: 2px;
    }
    .lp-toggle-chevron { opacity: .7; font-size: .8rem; }

    .lp-error {
      margin: .5rem 0 0;
      font-size: .82rem;
      color: var(--text3, #6b7280);
    }

    .lp-container {
      display: none;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      margin: .75rem 0;
      background: var(--surface2, #f3f4f6);

      &.lp-visible { display: block; }
    }

    .lp-actions {
      display: flex;
      align-items: center;
      gap: .75rem;
      margin-top: .5rem;
    }

    .lp-open-link {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      font-size: .78rem;
      font-weight: 600;
      color: #4f46e5;
      cursor: pointer;
      text-decoration: underline;
    }

    .lp-hide {
      display: inline-block;
      padding: .3rem .8rem;
      background: transparent;
      color: var(--text3, #6b7280);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 6px;
      font-size: .78rem;
      font-weight: 600;
      cursor: pointer;
      transition: color .15s, border-color .15s;

      &:hover { color: var(--text, #1f2937); border-color: #9ca3af; }
    }

    :host-context(body.dark) {
      .lp-toggle { background: #334155; &:hover:not(:disabled) { background: #475569; } }
      .lp-container { background: #1e293b; }
      .lp-open-link { color: #818cf8; }
      .lp-hide {
        border-color: #334155;
        color: #94a3b8;
        &:hover { color: #e2e8f0; border-color: #64748b; }
      }
    }
  `],
})
export class LivePlaygroundComponent {
  title = input.required<string>();
  files = input.required<PlaygroundFile[]>();
  template = input<ProjectTemplate>('angular-cli');
  openFile = input<string>();
  dependencies = input<Record<string, string>>();
  height = input<number>(480);

  private container = viewChild<ElementRef<HTMLDivElement>>('container');
  private dm = inject(DarkModeService);

  loaded  = signal(false);
  loading = signal(false);
  failed  = signal(false);

  private toProject(): Project {
    const files: Record<string, string> = {};
    for (const f of this.files()) files[f.path] = f.content;
    const deps = this.dependencies();
    return {
      title: this.title(),
      template: this.template(),
      files,
      ...(deps ? { dependencies: deps } : {}),
    };
  }

  async load(): Promise<void> {
    const el = this.container()?.nativeElement;
    if (!el || this.loading()) return;
    this.loading.set(true);
    this.failed.set(false);
    try {
      const sdk = (await import('@stackblitz/sdk')).default;
      await sdk.embedProject(el, this.toProject(), {
        height: this.height(),
        openFile: this.openFile(),
        theme: this.dm.dark() ? 'dark' : 'light',
        hideNavigation: true,
        clickToLoad: false,
      });
      this.loaded.set(true);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async openInNewTab(): Promise<void> {
    const sdk = (await import('@stackblitz/sdk')).default;
    sdk.openProject(this.toProject(), { openFile: this.openFile(), newWindow: true });
  }

  reset(): void {
    const el = this.container()?.nativeElement;
    if (el) el.innerHTML = '';
    this.loaded.set(false);
    this.failed.set(false);
  }
}
