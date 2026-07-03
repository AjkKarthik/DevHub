import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-safely-enabling-devtools-on-staging-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './safely-enabling-devtools-on-staging.html',
  styleUrl: './safely-enabling-devtools-on-staging.scss',
})
export class SafelyEnablingDevtoolsOnStagingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A single boolean flag is not the whole story',
      points: [
        'The main topic\'s <code>environment.enableDevTools</code> flag pattern controls WHETHER <code>enableDebugTools()</code> RUNS, but it does not, by itself, guarantee the debug-enabling CODE never reaches the real production bundle at all — if <code>enableDebugTools</code> is imported STATICALLY at the top of <code>main.ts</code> (even behind an <code>if</code> check), bundlers typically still include the imported module\'s code in every build, since a static import\'s module code is bundled REGARDLESS of whether the branch that calls it ever executes at runtime. The <code>if</code> check controls execution, not inclusion.',
      ],
    },
    {
      heading: 'Dynamic import — genuinely excluding the code, not just skipping its execution',
      points: [
        'The fix the main topic\'s own second code example hints at (but does not fully explain WHY it matters) is using a DYNAMIC <code>await import(\'@angular/platform-browser\')</code> inside the <code>if</code> branch instead of a static top-level import — with a dynamic import, most modern bundlers (Angular\'s esbuild-based builder included) can code-split the imported module into a SEPARATE chunk that is only fetched at runtime when that branch actually executes. In a REAL production build (where <code>environment.enableDevTools</code> is compile-time-known to be <code>false</code>), tree-shaking combined with dead-code elimination can remove the reference entirely, meaning the debug-tools chunk is never even requested over the network, let alone executed.',
        'This distinction matters because a STATIC import that is merely gated by a runtime <code>if</code> still SHIPS the debug-tools code to every user\'s browser (even if it never runs) — a meaningfully different security and bundle-size posture than genuinely not shipping it at all.',
      ],
    },
    {
      heading: 'A staging-specific build configuration, not a runtime toggle in the shipped production artifact',
      points: [
        'The most robust pattern goes one step further than an environment FLAG: use Angular\'s file-replacement mechanism (<code>angular.json</code>\'s <code>fileReplacements</code>) to swap in an ENTIRELY DIFFERENT <code>environment.staging.ts</code> file at BUILD TIME for a dedicated staging configuration — <code>ng build --configuration=staging</code> — so the decision of "does this build include debug tooling" is made once, at BUILD time, by whoever runs the staging build command, rather than being a runtime branch present (even if dormant) inside the exact same artifact that gets deployed to real customers.',
        'This means the PRODUCTION artifact (built with <code>ng build --configuration=production</code>) never contains the debug-enabling branch or its dynamically-imported module reference AT ALL — there is no environment flag to accidentally flip, because the code path simply does not exist in that build\'s output.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/environments/environment.ts',
      content: `// Default (production) environment — used by \`ng build\` with no --configuration
// This file NEVER references enableDebugTools at all.
export const environment = {
  production: true,
};
`,
    },
    {
      path: 'src/environments/environment.staging.ts',
      content: `// Staging-only environment — swapped in via angular.json fileReplacements
// when running \`ng build --configuration=staging\`.
export const environment = {
  production: false,
  enableDevToolsForDebugging: true,
};
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

bootstrapApplication(App, appConfig).then(async (appRef) => {
  // Dynamic import — only fetched over the network if this branch actually
  // executes. In a real production build, 'environment.enableDevToolsForDebugging'
  // does not even exist on the production environment.ts's type, so this whole
  // block is dead code eliminated at build time, not just skipped at runtime.
  if ('enableDevToolsForDebugging' in environment && environment.enableDevToolsForDebugging) {
    const { enableDebugTools } = await import('@angular/platform-browser');
    enableDebugTools(appRef.components[0]);
    console.warn('[DEBUG TOOLS ENABLED] This build exposes Angular internals — staging only.');
  }
}).catch(console.error);
`,
    },
    {
      path: 'angular.json.snippet.json',
      content: `{
  "configurations": {
    "staging": {
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.staging.ts"
        }
      ]
    }
  }
}
// ng build --configuration=staging   → uses environment.staging.ts, debug tools included
// ng build --configuration=production → uses environment.ts, debug tools never referenced
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Safely enabling DevTools on staging</h3>
    <p>This demo simulates the staging environment.ts — check the console for the
    warning confirming debug tools are enabled. A real production build would use
    a DIFFERENT environment.ts file (via angular.json fileReplacements) that never
    references enableDebugTools at all.</p>
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/app/app.config.ts',
      content: `import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = { providers: [] };
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Safely enabling DevTools on staging</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a distinct visual banner (not just a console warning) to the rendered page when debug tools are enabled, so staging testers cannot mistake the build for real production even without opening devtools.',
    hint: 'In main.ts\'s enableDevToolsForDebugging branch, after enableDebugTools() runs, insert a fixed-position <div> into document.body with a bright background and the text "STAGING — DEBUG TOOLS ENABLED".',
    solution: `if ('enableDevToolsForDebugging' in environment && environment.enableDevToolsForDebugging) {
  const { enableDebugTools } = await import('@angular/platform-browser');
  enableDebugTools(appRef.components[0]);

  const banner = document.createElement('div');
  banner.textContent = 'STAGING — DEBUG TOOLS ENABLED';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#f59e0b;' +
    'color:#000;text-align:center;padding:4px;font-weight:bold;z-index:9999;';
  document.body.appendChild(banner);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'gating enableDebugTools() behind a runtime "if (environment.enableDevTools)" check is enough to keep it out of the production bundle.',
      reality: 'a statically-imported module\'s code is typically bundled regardless of whether the branch that calls it ever executes — the if check controls EXECUTION, not INCLUSION; a dynamic import is needed to genuinely exclude the code from the shipped bundle.',
    },
    {
      thought: 'an environment flag inside the SAME environment.ts file used for production is a safe way to toggle debug tools for staging.',
      reality: 'the most robust pattern uses Angular\'s fileReplacements to swap in an entirely DIFFERENT environment file at build time for staging — so the production artifact never contains the debug-enabling branch or its dynamic import reference at all, with no flag to accidentally flip.',
    },
    {
      thought: 'a console warning is sufficient to prevent staging testers from confusing a debug-enabled build with real production.',
      reality: 'a visible on-page banner is a much stronger signal, since testers may not have devtools open to see a console warning — visual confirmation prevents confusing staging behavior with production behavior.',
    },
  ];
}
