import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-handling-unrecoverable-state-and-manual-update-checks-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './handling-unrecoverable-state-and-manual-update-checks.html',
  styleUrl: './handling-unrecoverable-state-and-manual-update-checks.scss',
})
export class HandlingUnrecoverableStateAndManualUpdateChecksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic covers VERSION_READY — this page covers the other two events',
      points: [
        'The main PWA page\'s <code>SwUpdate.versionUpdates</code> example filters for ONLY <code>VERSION_READY</code>. Two other real events exist and are silently ignored by that code: <code>VERSION_INSTALLATION_FAILED</code> (a new version was detected but failed to fully cache — e.g. a flaky network mid-download) and, separately, <code>SwUpdate.unrecoverable</code> — a distinct Observable that fires when the CURRENT running app is in a broken state (missing a chunk the browser needs) and cannot self-repair.',
        'An app that only listens for <code>VERSION_READY</code> will silently do nothing when installation fails or when the running app becomes unrecoverable — from the user\'s perspective, the app just quietly breaks with no prompt to reload, which is worse than not having update detection at all.',
      ],
    },
    {
      heading: 'SwUpdate.unrecoverable — when the current app, not a new one, is broken',
      points: [
        '<code>swUpdate.unrecoverable</code> emits an <code>UnrecoverableStateEvent &#123; reason: string &#125;</code> when the service worker detects the currently-running app is missing a resource it needs (a common real-world cause: a user leaves a tab open across a deploy that removed an old lazy-chunk file the open tab still references).',
        'Unlike <code>VERSION_READY</code>, there is no "wait for a good moment" option here — the current app state is already broken, so the correct response is an IMMEDIATE forced reload, not a dismissible banner: <code>swUpdate.unrecoverable.subscribe(() => document.location.reload())</code>.',
        'Consider logging the <code>reason</code> string to your error-tracking service before reloading — an unusually high rate of unrecoverable events across users can indicate your deployment process is not keeping old chunk files available long enough for in-flight sessions (a versioned-asset-retention issue, not a code bug).',
      ],
    },
    {
      heading: 'VERSION_INSTALLATION_FAILED — a new version could not be cached',
      points: [
        'This event fires when the service worker detected a new version but failed to fully download and cache it (network interruption, a 404 on one listed asset, quota exceeded). The user is NOT affected yet — they are still running the last successfully-installed version — but the update will never become <code>VERSION_READY</code> until the failure is resolved.',
        'A reasonable response is silent logging (this is a background concern, not a user-facing error) plus an automatic retry via <code>checkForUpdate()</code> after a delay, rather than surfacing anything to the user for a state that does not affect their current session.',
      ],
    },
    {
      heading: 'checkForUpdate() — polling on your own schedule',
      points: [
        'By default, Angular\'s service worker only checks for a new version on app STARTUP and on each subsequent navigation — a user who leaves a tab open for hours without navigating never gets checked again. <code>await swUpdate.checkForUpdate()</code> manually triggers an immediate check and resolves to a boolean indicating whether a new version was found.',
        'Combine with <code>setInterval</code> (commonly every 6–12 hours, guarded to only run when the tab is visible via the Page Visibility API) for long-lived dashboard-style apps where users may keep a tab open indefinitely: <code>document.addEventListener(\'visibilitychange\', () =&gt; &#123; if (document.visibilityState === \'visible\') swUpdate.checkForUpdate(); &#125;)</code> is a lighter-weight alternative to a blind interval — it checks when the user returns to the tab instead of on a fixed clock regardless of tab visibility.',
        'Do not poll too aggressively — each <code>checkForUpdate()</code> call is a real network request to check the app\'s ngsw manifest. A few times per day per active session is typically sufficient; this is a background freshness check, not a real-time sync mechanism.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/update-manager.service.ts',
      content: `import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent, VersionInstallationFailedEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UpdateManagerService {
  private swUpdate = inject(SwUpdate);

  updateReady = false;

  init() {
    if (!this.swUpdate.isEnabled) return;

    // 1. A new version is fully cached and ready — safe to prompt the user.
    this.swUpdate.versionUpdates.pipe(
      filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
    ).subscribe(() => {
      this.updateReady = true;
    });

    // 2. A new version was detected but failed to install — log it, retry later.
    //    The user is unaffected (still on the last GOOD version) — no UI needed.
    this.swUpdate.versionUpdates.pipe(
      filter((e): e is VersionInstallationFailedEvent => e.type === 'VERSION_INSTALLATION_FAILED'),
    ).subscribe((event) => {
      console.error('SW install failed:', event.reason);
      setTimeout(() => this.swUpdate.checkForUpdate(), 60_000); // retry in 1 min
    });

    // 3. The CURRENT running app is broken (missing a chunk) — force reload now.
    //    Not dismissible — there's nothing to preserve, the app is already broken.
    this.swUpdate.unrecoverable.subscribe((event) => {
      console.error('Unrecoverable app state:', event.reason);
      document.location.reload();
    });

    // 4. Check for updates whenever the tab becomes visible again — lighter
    //    than a blind setInterval that runs even while the tab is hidden.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.swUpdate.checkForUpdate();
      }
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { UpdateManagerService } from './update-manager.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Handling unrecoverable state and manual update checks</h3>
    <p>
      This example wires up all THREE SwUpdate signals the main topic's example leaves
      out — VERSION_INSTALLATION_FAILED, unrecoverable, and visibility-driven
      checkForUpdate() — alongside the VERSION_READY prompt the main topic already covers.
    </p>
    @if (updateManager.updateReady) {
      <p class="banner">New version ready — <button (click)="reload()">Reload</button></p>
    } @else {
      <p>No update pending. (This demo has no real service worker to trigger events with —
      see update-manager.service.ts for the full wiring.)</p>
    }
  \`,
})
export class App {
  updateManager = inject(UpdateManagerService);

  constructor() {
    this.updateManager.init();
  }

  reload() {
    document.location.reload();
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
  <head><title>Handling Unrecoverable State and Manual Update Checks</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add exponential backoff to the <code>VERSION_INSTALLATION_FAILED</code> retry — instead of always retrying after a fixed 60 seconds, double the delay on each consecutive failure (capped at 30 minutes), and reset it back to 60 seconds once a check succeeds.',
    hint: 'Track a retryDelayMs field on the service (initial 60_000). In the VERSION_INSTALLATION_FAILED handler, use setTimeout with the current retryDelayMs, then double it (capped via Math.min(delay * 2, 30 * 60_000)) for next time. Reset it to 60_000 inside the VERSION_READY handler, since a successful VERSION_READY means checks are working again.',
    solution: `private retryDelayMs = 60_000;
private readonly MAX_RETRY_DELAY_MS = 30 * 60_000;

init() {
  // ...isEnabled guard unchanged

  this.swUpdate.versionUpdates.pipe(
    filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
  ).subscribe(() => {
    this.updateReady = true;
    this.retryDelayMs = 60_000; // reset backoff — checks are working again
  });

  this.swUpdate.versionUpdates.pipe(
    filter((e): e is VersionInstallationFailedEvent => e.type === 'VERSION_INSTALLATION_FAILED'),
  ).subscribe((event) => {
    console.error('SW install failed:', event.reason);
    setTimeout(() => this.swUpdate.checkForUpdate(), this.retryDelayMs);
    this.retryDelayMs = Math.min(this.retryDelayMs * 2, this.MAX_RETRY_DELAY_MS);
  });

  // ...unrecoverable + visibilitychange handlers unchanged
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'filtering <code>SwUpdate.versionUpdates</code> for <code>VERSION_READY</code> alone is a complete update-handling implementation.',
      reality: 'VERSION_INSTALLATION_FAILED (a NEW version failing to cache) and the separate SwUpdate.unrecoverable Observable (the CURRENT running app becoming broken) are both silently ignored by a VERSION_READY-only implementation — the app can be in a broken state with zero user-facing signal.',
    },
    {
      thought: 'an <code>unrecoverable</code> event should be handled the same way as <code>VERSION_READY</code> — a dismissible "reload?" prompt.',
      reality: 'unrecoverable means the CURRENTLY RUNNING app is already broken, not that a new version is available — there is nothing to preserve by waiting, so an immediate forced reload is the correct response, unlike the deliberately non-disruptive VERSION_READY prompt.',
    },
    {
      thought: 'the Angular service worker automatically re-checks for updates periodically as long as the app tab stays open.',
      reality: 'by default it only checks on app startup and subsequent navigations — a long-lived tab with no navigation (common in dashboard-style apps) never gets re-checked unless you explicitly call checkForUpdate(), e.g. driven by the Page Visibility API or a periodic timer.',
    },
  ];
}
