import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debugging-duplicate-angular-runtime-issues-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debugging-duplicate-angular-runtime-issues.html',
  styleUrl: './debugging-duplicate-angular-runtime-issues.scss',
})
export class DebuggingDuplicateAngularRuntimeIssuesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The theory explains WHY sharing matters — this subtopic covers HOW to verify it actually worked',
      points: [
        'The main topic explains that <code>shareAll({ singleton: true })</code> SHOULD prevent duplicate Angular runtimes — but a misconfiguration (a version mismatch that silently resolves to "first loaded wins" instead of throwing, a remote accidentally NOT importing the shared config, or a typo in a package name inside the <code>shared</code> object) can silently defeat this, and the resulting bugs (broken DI across the boundary, doubled bundle size, invisible components) look confusingly unrelated to their actual root cause unless you know specifically what to check.',
      ],
    },
    {
      heading: 'The Network tab check — the fastest first diagnostic',
      points: [
        'Open the browser\'s Network tab, filter for JS files, and load the shell with a remote route active — search the list for MULTIPLE separate chunk files whose CONTENTS both contain the Angular core bundle (the file NAMES will differ, since each app has its own build hashes, but the SIZE is a strong tell: a normal shared-Angular remote chunk is small — a few KB of app-specific code — while a remote that bundled its own Angular copy will have a chunk in the hundreds-of-KB range, roughly matching the shell\'s own core Angular chunk size).',
        'This is the single fastest check because it requires no code changes or instrumentation — just opening devtools and comparing chunk sizes. A remote chunk unexpectedly large relative to its actual feature scope is the first sign sharing silently failed for that remote.',
      ],
    },
    {
      heading: 'A runtime self-check — comparing an instance identity marker across the boundary',
      points: [
        'For a DEFINITIVE runtime check (not just a size heuristic), add a tiny diagnostic service, PROVIDED IN ROOT, that generates a random ID once at construction: <code>@Injectable({ providedIn: \'root\' }) export class RuntimeMarkerService { readonly instanceId = Math.random().toString(36); }</code>. Inject it from BOTH the shell\'s root component AND a component inside the loaded remote, and log both IDs to the console — if Angular is genuinely shared as a singleton, injecting this service from EITHER app returns the SAME instance with the SAME <code>instanceId</code>, since there is only one root injector across the federated boundary. Two DIFFERENT ids printed means two separate Angular DI containers exist — sharing failed.',
        'This technique generalizes beyond Angular DevTools\' own inspection capabilities (which primarily show ONE app\'s component tree at a time and do not natively cross a federation boundary) — a simple shared marker service is a portable, framework-tool-independent way to prove or disprove singleton sharing empirically, and it is cheap enough to leave in a development build permanently as an ongoing health check.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/runtime-marker.service.ts',
      content: `import { Injectable } from '@angular/core';

// A tiny diagnostic service — if shared correctly as a singleton across
// a federation boundary, EVERY app injecting this gets the SAME instance,
// and therefore the SAME instanceId.
@Injectable({ providedIn: 'root' })
export class RuntimeMarkerService {
  readonly instanceId = Math.random().toString(36).slice(2, 10);
  readonly createdAt = new Date().toISOString();

  constructor() {
    console.log(\`[RuntimeMarkerService] NEW instance created: \${this.instanceId} at \${this.createdAt}\`);
  }
}
`,
    },
    {
      path: 'src/app/shell-root.ts',
      content: `import { Component, inject } from '@angular/core';
import { RuntimeMarkerService } from './runtime-marker.service';
import { RemoteWidgetComponent } from './remote-widget';

@Component({
  selector: 'app-shell-root',
  standalone: true,
  imports: [RemoteWidgetComponent],
  template: \`
    <p>Shell's marker instance: {{ marker.instanceId }}</p>
    <app-remote-widget />
  \`,
})
export class ShellRootComponent {
  marker = inject(RuntimeMarkerService);
}
`,
    },
    {
      path: 'src/app/remote-widget.ts',
      content: `import { Component, inject } from '@angular/core';
import { RuntimeMarkerService } from './runtime-marker.service';

// Simulates a "remote" component — in a real federated app this would be
// loaded via loadRemoteModule() from a separately-built and deployed bundle.
@Component({
  selector: 'app-remote-widget',
  standalone: true,
  template: \`<p>"Remote" widget's marker instance: {{ marker.instanceId }}</p>\`,
})
export class RemoteWidgetComponent {
  marker = inject(RuntimeMarkerService);
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ShellRootComponent } from './shell-root';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellRootComponent],
  template: \`
    <h3>Debugging duplicate Angular runtime issues</h3>
    <p>Both instanceId values below should be IDENTICAL — proving Angular's root injector
    (and this shared service) is a true singleton. In a real Native Federation setup with
    a broken shared config, these would print DIFFERENT ids, revealing the duplicate
    runtime immediately.</p>
    <app-shell-root />
  \`,
})
export class App {}
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
  <head><title>Debugging duplicate Angular runtime issues</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Simulate a BROKEN sharing config by having RemoteWidgetComponent construct its own separate RuntimeMarkerService instance directly (bypassing DI), and observe the two instanceId values now differ.',
    hint: 'In remote-widget.ts, replace `marker = inject(RuntimeMarkerService)` with `marker = new RuntimeMarkerService()` — this simulates what happens when a remote accidentally bundles its own copy instead of sharing the singleton.',
    solution: `// remote-widget.ts — simulating broken sharing
import { Component } from '@angular/core';
import { RuntimeMarkerService } from './runtime-marker.service';

@Component({
  selector: 'app-remote-widget',
  standalone: true,
  template: '<p>"Remote" widget\\'s marker instance: {{ marker.instanceId }}</p>',
})
export class RemoteWidgetComponent {
  // Constructing directly instead of injecting — simulates a duplicate
  // Angular runtime where DI is NOT actually shared across the boundary.
  marker = new RuntimeMarkerService();
}

// Now the shell's instanceId and the "remote" widget's instanceId will
// DIFFER — exactly the signal that reveals a broken shared() config in a
// real Native Federation deployment.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'configuring shareAll({ singleton: true }) is sufficient on its own to guarantee sharing actually works — no further verification needed.',
      reality: 'a version mismatch resolving silently, a remote not importing the shared config correctly, or a typo in a shared package name can all defeat sharing without any build-time error — the resulting bugs look unrelated to their actual root cause unless verified at runtime.',
    },
    {
      thought: 'Angular DevTools alone is sufficient to detect a duplicate Angular runtime across a federation boundary.',
      reality: 'Angular DevTools primarily shows one app\'s component tree at a time and does not natively cross a federation boundary — a portable, framework-tool-independent technique like a shared marker service is needed to prove or disprove singleton sharing empirically.',
    },
    {
      thought: 'comparing chunk file NAMES in the Network tab is the way to detect a duplicate Angular bundle.',
      reality: 'chunk names differ between apps due to separate build hashes regardless of sharing status — comparing chunk SIZES (an unexpectedly large remote chunk relative to its feature scope) is the useful signal, not the names.',
    },
  ];
}
