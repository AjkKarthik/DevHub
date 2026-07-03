import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-ssr-locale-detection-and-avoiding-hydration-mismatches-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './ssr-locale-detection-and-avoiding-hydration-mismatches.html',
  styleUrl: './ssr-locale-detection-and-avoiding-hydration-mismatches.scss',
})
export class SsrLocaleDetectionAndAvoidingHydrationMismatchesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s one SSR bullet, actually built out',
      points: [
        'The main i18n page has exactly one bullet on SSR: "the locale should be determined per-request... and injected as a DI token... no cross-request contamination when stored in a signal." It does not show HOW to read the request\'s locale, or the specific failure mode (hydration mismatch) that occurs when the server and client disagree about which locale is active.',
        'This matters because Angular SSR (via <code>@angular/ssr</code>) renders the initial HTML on the server, then the client "hydrates" that same HTML by re-running the app in the browser and RE-ATTACHING event listeners to the EXISTING DOM nodes rather than re-rendering from scratch. If the client-side render produces DIFFERENT locale-dependent output than what the server actually sent, hydration either logs a mismatch warning and repairs the DOM (a wasted render + visible flash) or in some cases fails silently with permanently wrong content until the next state change.',
      ],
    },
    {
      heading: 'Reading locale from the request — Accept-Language and DI tokens',
      points: [
        'On the server, the incoming HTTP request\'s <code>Accept-Language</code> header (e.g. <code>"fr-CA,fr;q=0.9,en;q=0.8"</code>) is the standard signal for the user\'s preferred locale — parse the highest-quality (<code>q</code>) entry the app actually SUPPORTS, falling back to a default when no supported entry matches.',
        'In an Angular SSR server (Express-based via <code>@angular/ssr</code>), the request object is available in the server entry point — extract the header there and provide it into the app via <code>REQUEST</code> injection or a custom DI token, e.g. <code>&#123; provide: LOCALE_TOKEN, useValue: detectedLocale &#125;</code> passed into <code>bootstrapApplication</code>\'s providers for that specific request\'s render.',
        'This must be a PER-REQUEST value, not a module-level or service-level default set once at server startup — a Node.js SSR server handles MANY concurrent requests from different users on the same process; a locale value cached in a plain module-scope variable (rather than provided per-request through DI) would leak one user\'s locale into another user\'s concurrently-rendered response.',
      ],
    },
    {
      heading: 'The hydration mismatch failure mode — and why it happens',
      points: [
        'A hydration mismatch occurs specifically when the SERVER-rendered locale differs from whatever the CLIENT independently decides to use on first render — a common root cause: the server correctly reads <code>Accept-Language</code> and renders French, but the client-side bootstrap (running fresh in the browser, with no access to the original request headers) falls back to a hardcoded default (English) or reads a DIFFERENT signal (e.g. <code>navigator.language</code>, which may differ from what the server used) before the real locale-restoring logic runs.',
        'The fix is to make the SAME locale decision reach BOTH environments: the server-detected locale must be SERIALIZED into the initial HTML response (Angular\'s <code>TransferState</code> API is the standard mechanism — <code>makeStateKey</code> + <code>TransferState.set()</code> on the server, <code>TransferState.get()</code> on the client) so the client\'s FIRST render reads the exact same locale the server already committed to, instead of re-deciding independently.',
        '<code>TransferState</code> serializes the value into a <code>&lt;script id="..." type="application/json"&gt;</code> tag embedded in the server-rendered HTML — the client reads it during bootstrap, before the app\'s first render, so the locale-dependent output is IDENTICAL on both passes and hydration has nothing to reconcile.',
      ],
    },
    {
      heading: 'What to watch for in practice',
      points: [
        'A visible symptom of this exact bug: a page BRIEFLY flashes the correct (server-rendered) locale, then flickers to a DIFFERENT locale a moment later once the client bootstraps and "corrects" itself — this flash-of-wrong-locale is the tell that the client re-decided the locale instead of reusing the server\'s value via TransferState.',
        'Angular\'s dev-mode console logs an explicit hydration mismatch warning naming the specific DOM node and the expected vs. actual content when this occurs — treat any hydration warning touching locale-dependent text (a greeting, a formatted date, an ICU plural) as a signal to check whether that value is flowing through <code>TransferState</code> or being independently recomputed on the client.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/server.ts',
      content: `import { AngularNodeAppEngine, createNodeRequestHandler, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import { LOCALE_TOKEN } from './app/locale-token';

const app = express();
const angularApp = new AngularNodeAppEngine();

const SUPPORTED_LOCALES = ['en', 'fr', 'es'];

function detectLocale(acceptLanguage: string | undefined): string {
  if (!acceptLanguage) return 'en';
  // Parse "fr-CA,fr;q=0.9,en;q=0.8" — take the highest-quality SUPPORTED entry.
  const preferred = acceptLanguage
    .split(',')
    .map(part => part.trim().split(';')[0].split('-')[0]);
  return preferred.find(l => SUPPORTED_LOCALES.includes(l)) ?? 'en';
}

app.use('*', async (req, res, next) => {
  // Per-request detection — never store this in a module-level variable,
  // the same Node process serves many concurrent requests for different users.
  const locale = detectLocale(req.headers['accept-language']);

  const result = await angularApp.handle(req, {
    providers: [{ provide: LOCALE_TOKEN, useValue: locale }],
  });

  if (result) {
    writeResponseToNodeResponse(result, res);
  } else {
    next();
  }
});

export const reqHandler = createNodeRequestHandler(app);
`,
    },
    {
      path: 'src/app/locale-token.ts',
      content: `import { InjectionToken, makeStateKey, TransferState, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const LOCALE_TOKEN = new InjectionToken<string>('APP_LOCALE');
const LOCALE_STATE_KEY = makeStateKey<string>('app-locale');

// Reads the server-provided locale on first render, and — critically —
// serializes it into TransferState so the CLIENT'S first render reads the
// exact same value instead of independently re-deciding (which is what
// causes a hydration mismatch when server and client disagree).
export function resolveLocale(): string {
  const transferState = inject(TransferState);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    const locale = inject(LOCALE_TOKEN, { optional: true }) ?? 'en';
    transferState.set(LOCALE_STATE_KEY, locale);
    return locale;
  }

  // Client: read the value the server already committed to — never
  // re-detect from navigator.language here, that's what causes the mismatch.
  return transferState.get(LOCALE_STATE_KEY, 'en');
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { resolveLocale } from './locale-token';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>SSR locale detection and avoiding hydration mismatches</h3>
    <p>
      Active locale (resolved identically on server and client via TransferState):
      <strong>{{ locale() }}</strong>
    </p>
    <p>
      In a real deployment, the server reads the Accept-Language header per-request
      (see server.ts), commits to a locale, and serializes it via TransferState so
      the client's FIRST render reads the same value instead of re-deciding — which
      is exactly what would otherwise cause a hydration mismatch warning and a
      visible flash from one locale to another.
    </p>
  \`,
})
export class App {
  locale = signal(resolveLocale());
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
  <head><title>SSR Locale Detection and Avoiding Hydration Mismatches</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Extend <code>detectLocale()</code> in <code>server.ts</code> so it correctly parses full <code>q</code>-value weighting instead of just taking entries in header order — e.g. <code>"en;q=0.5,fr;q=0.9"</code> should resolve to <code>fr</code> even though <code>en</code> appears first.',
    hint: 'Parse each comma-separated part into its language code and its q value (defaulting to q=1 when absent), sort descending by q, then find the first SUPPORTED_LOCALES match in that sorted order.',
    solution: `function detectLocale(acceptLanguage: string | undefined): string {
  if (!acceptLanguage) return 'en';

  const weighted = acceptLanguage.split(',').map(part => {
    const [langPart, qPart] = part.trim().split(';');
    const lang = langPart.split('-')[0];
    const q = qPart ? parseFloat(qPart.split('=')[1]) : 1;
    return { lang, q };
  });

  weighted.sort((a, b) => b.q - a.q);

  return weighted.find(w => SUPPORTED_LOCALES.includes(w.lang))?.lang ?? 'en';
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'in Angular SSR, the client can simply re-detect the locale independently on bootstrap (e.g. via navigator.language) and it will match whatever the server rendered.',
      reality: 'the server and client have DIFFERENT signals available — the server sees the Accept-Language HTTP header, while the client sees navigator.language, which can differ (or the server may apply its own fallback logic the client has no way to replicate). Independently re-deciding causes a hydration mismatch; the server\'s decision must be serialized to the client via TransferState instead.',
    },
    {
      thought: 'storing the detected locale in a plain module-level variable on the SSR server is fine since it\'s just a simple default.',
      reality: 'a Node.js SSR server process handles MANY concurrent requests from different users — a module-level variable is shared mutable state across all of them, so one user\'s detected locale can leak into another user\'s concurrently-rendering response. Locale must be provided per-request through DI.',
    },
    {
      thought: 'a hydration mismatch warning in the console is a cosmetic/performance-only issue that can usually be ignored.',
      reality: 'while Angular can often self-repair a mismatch by re-rendering the affected DOM node, this causes a visible flash of incorrect content and wastes the whole point of SSR (avoiding client-side re-render). For locale-dependent content specifically, it usually indicates a real bug — the client independently re-decided a value the server had already committed to.',
    },
  ];
}
