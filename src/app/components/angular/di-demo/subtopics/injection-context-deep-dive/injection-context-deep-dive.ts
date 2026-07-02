import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-injection-context-deep-dive-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './injection-context-deep-dive.html',
  styleUrl: './injection-context-deep-dive.scss',
})
export class InjectionContextDeepDiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What actually counts as an injection context',
      points: [
        'An injection context is active in exactly three places: a class field initializer during construction, a constructor body, and the body of a callback passed to <code>runInInjectionContext()</code>. Factory functions passed to <code>new InjectionToken(\'desc\', { factory: () => inject(OtherToken) })</code> are also injection contexts.',
        '<code>assertInInjectionContext(myFunction)</code> throws immediately with a clear error if called outside a valid context — library authors put this at the top of composable inject functions so misuse fails fast with a helpful message instead of a confusing downstream <code>NG0203</code>.',
      ],
    },
    {
      heading: 'Functional guards and resolvers get an injection context for free',
      points: [
        'A <code>CanActivateFn</code> or <code>ResolveFn</code> is a plain function, not a class — yet <code>inject()</code> works at the TOP of its body. Angular Router invokes these functions FROM WITHIN an injection context it sets up internally, so the injection context exists for the duration of the synchronous part of the function call.',
        'The context is only guaranteed for the SYNCHRONOUS portion. Once you <code>await</code> a promise or schedule a <code>setTimeout</code> inside a guard/resolver, the context has already closed by the time that callback runs — call <code>inject()</code> BEFORE the first <code>await</code>, capture what you need, and use the captured references afterward.',
      ],
    },
    {
      heading: 'The composable "inject function" pattern',
      points: [
        'A reusable function like <code>function injectCurrentUser() { return inject(AuthService).user; }</code> can be called from any class field initializer or constructor — exactly like a built-in Angular API. This mirrors the React hooks pattern: small, composable, testable units built on top of <code>inject()</code>.',
        'The convention is to name these functions with an <code>inject</code> prefix (<code>injectCurrentUser</code>, <code>injectFeatureFlag</code>) so callers immediately know they must be invoked synchronously inside a valid injection context, just like <code>inject()</code> itself.',
        'Because these are just functions, they compose freely: <code>injectCurrentUser()</code> can internally call <code>inject(AuthService)</code> AND <code>inject(Router)</code> and combine them — there is no restriction against calling multiple <code>inject()</code>s inside one composable function.',
      ],
    },
    {
      heading: 'runInInjectionContext() for genuinely deferred injection',
      points: [
        'When you truly need to resolve a dependency LATER — inside a <code>setTimeout</code>, a raw Promise callback, or a WebSocket event handler — capture an <code>Injector</code> first (<code>private injector = inject(Injector)</code>) while still in a valid context, then wrap the later call: <code>runInInjectionContext(this.injector, () => inject(MyService))</code>.',
        'This is also the standard pattern for calling <code>inject()</code> inside test utilities and standalone scripts that are not classes — grab the app\'s root <code>EnvironmentInjector</code> and wrap the call, rather than restructuring the calling code into a class just to get field-initializer timing.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, Injector, InjectionToken, signal, computed, runInInjectionContext } from '@angular/core';

interface AppConfig { appName: string; }

const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',
  factory: () => ({ appName: 'DevHub Demo' }),
});

// Composable "inject function" — reusable across any injection context
function injectGreeting() {
  const config = inject(APP_CONFIG);
  return computed(() => \`Hello from \${config.appName}\`);
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>✅ Composable inject function (works — called at field-init time)</h3>
    <p>{{ greeting() }}</p>

    <h3>❌ vs ✅ Deferred inject() inside setTimeout</h3>
    <button (click)="brokenAttempt()">Try broken inject() in setTimeout</button>
    <button (click)="fixedAttempt()">Try fixed version with runInInjectionContext</button>
    <p>{{ log() }}</p>
  \`,
})
export class App {
  private injector = inject(Injector);
  log = signal('Click a button and check this line + the console.');

  // Composable function called at field-init time — always a valid context
  greeting = injectGreeting();

  brokenAttempt() {
    setTimeout(() => {
      try {
        // By the time this callback runs, the injection context has closed.
        const config = inject(APP_CONFIG);
        this.log.set('unexpected: ' + config.appName);
      } catch (err) {
        this.log.set('❌ threw NG0203 — inject() called outside an injection context');
        console.error(err);
      }
    }, 0);
  }

  fixedAttempt() {
    setTimeout(() => {
      // Wrap the deferred call — runInInjectionContext restores a valid context.
      const config = runInInjectionContext(this.injector, () => inject(APP_CONFIG));
      this.log.set('✅ resolved via runInInjectionContext: ' + config.appName);
    }, 0);
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
  <head><title>Injection context deep dive</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a composable inject function called injectIsDarkMode() that reads a boolean DARK_MODE InjectionToken (default false) and returns its raw value — then call it from a field initializer.',
    hint: 'const DARK_MODE = new InjectionToken<boolean>(\'dark.mode\', { providedIn: \'root\', factory: () => false }); function injectIsDarkMode() { return inject(DARK_MODE); }',
    solution: `const DARK_MODE = new InjectionToken<boolean>('dark.mode', {
  providedIn: 'root',
  factory: () => false,
});

function injectIsDarkMode() {
  return inject(DARK_MODE);
}

export class App {
  isDark = injectIsDarkMode(); // called at field-init time — valid context
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a functional route guard or resolver can call inject() anywhere in its body, including after an await.',
      reality: 'Angular Router only guarantees an injection context for the SYNCHRONOUS portion of the function call — call inject() before the first await and capture what you need, or it throws NG0203 once the context has closed.',
    },
    {
      thought: 'composable "inject function" helpers are a special Angular API that need to be registered somewhere.',
      reality: 'they are just plain functions that happen to call inject() internally — there is no registration step; any function called synchronously from a valid injection context works, following the injectXxx() naming convention purely by community/team convention.',
    },
    {
      thought: 'runInInjectionContext() lets you call inject() from literally anywhere, at any time, indefinitely.',
      reality: 'it only works if you captured a live Injector (or EnvironmentInjector) BEFORE the deferred callback runs, and that injector has not been destroyed — it restores a valid context for the callback, it does not create injection context out of nothing.',
    },
  ];
}
