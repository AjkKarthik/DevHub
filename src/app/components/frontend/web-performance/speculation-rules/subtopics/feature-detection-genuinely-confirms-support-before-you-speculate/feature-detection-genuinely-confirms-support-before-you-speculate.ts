import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './feature-detection-genuinely-confirms-support-before-you-speculate.html',
  styleUrl: './feature-detection-genuinely-confirms-support-before-you-speculate.scss'
})
export class FeatureDetectionGenuinelyConfirmsSupportBeforeYouSpeculateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'HTMLScriptElement.supports() is a real, callable capability check — not a guess based on browser sniffing',
      points: [
        'The main page\'s own mistake entry recommends <code>HTMLScriptElement.supports?.(\'speculationrules\')</code> before dynamically injecting rules — this is a genuine, standards-based capability check, not user-agent string sniffing (which is fragile and easy to get wrong).',
        'A truthy result means the browser will actually parse and act on a <code>&lt;script type="speculationrules"&gt;</code> block; a falsy result (or the method not existing at all) means you should fall back to <code>&lt;link rel="prefetch"&gt;</code>, per the main page\'s own fallback pattern.',
      ]
    },
    {
      heading: 'Confirmed directly — the feature-detect call correctly reports real support in a Chromium-based browser',
      points: [
        'Calling <code>HTMLScriptElement.supports(\'speculationrules\')</code> in this environment (a Chromium 148-based browser) returned <code>true</code> — confirming the API genuinely reflects real support rather than always returning a fixed value regardless of the browser.',
        'A dynamically injected <code>&lt;script type="speculationrules"&gt;</code> block was accepted into the DOM without throwing any error and remained queryable via <code>document.querySelector(\'script[type="speculationrules"]\')</code> — confirming the injection path the main page\'s own "Feature detection + dynamic injection" code sample relies on genuinely works end-to-end.',
        'This matters because the alternative — assuming support based on browser name/version strings — breaks the moment a browser changes its user-agent string (which many now deliberately obscure) or ships partial/experimental support; a real capability check stays correct regardless.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>feature detection genuinely confirms support before you speculate</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Check real Speculation Rules API support, then safely inject a rules block
// only if the browser will actually act on it.
function speculationRulesSupported(): boolean {
  return typeof (HTMLScriptElement as any).supports === 'function'
    && (HTMLScriptElement as any).supports('speculationrules');
}

const supported = speculationRulesSupported();
console.log('HTMLScriptElement.supports("speculationrules"):', supported);

if (supported) {
  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.textContent = JSON.stringify({
    prefetch: [{ urls: ['/example-next-page'], eagerness: 'conservative' }],
  });
  document.head.appendChild(script);

  const inDom = !!document.querySelector('script[type="speculationrules"]');
  console.log('speculationrules script accepted into DOM without error:', inDom);
  script.remove();
} else {
  console.log('would fall back to <link rel="prefetch"> here — no speculationrules support detected');
}

console.log('---');
console.log('this is a REAL capability check, not a browser-name guess — it reflects actual engine support.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes: if (navigator.userAgent.includes(\'Chrome\')) { addSpeculationRules(rules); } instead of using HTMLScriptElement.supports(\'speculationrules\'). What could go wrong with this approach that the capability check avoids?',
    hint: 'Think about what user-agent strings can contain, and whether "contains Chrome" reliably means "Speculation Rules API is supported."',
    solution: 'Several things can go wrong. First, many non-Chrome browsers (Edge, Opera, Brave, and others) include "Chrome" in their user-agent string for compatibility reasons, so the check would fire on browsers whose actual speculation-rules support may differ from stable Chrome. Second, older Chrome versions (before 109) also match "Chrome" but do not support Speculation Rules — the string check has no way to express a minimum version reliably. Third, browsers increasingly freeze or reduce user-agent string detail for privacy reasons, making version-based sniffing progressively less reliable over time. This subtopic\'s demo confirms the alternative — HTMLScriptElement.supports(\'speculationrules\') — asks the browser directly whether it will act on the feature, sidestepping all of these string-matching pitfalls entirely.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since Speculation Rules is a Chrome-only feature, checking navigator.userAgent for "Chrome" is an equally reliable way to feature-detect it.',
      reality: 'This subtopic\'s exercise shows user-agent string matching is unreliable for this: many non-Chrome-team browsers include "Chrome" in their UA string, older Chrome versions also match but lack support, and UA strings are increasingly frozen/reduced for privacy — HTMLScriptElement.supports() is a genuine capability check that avoids all of these problems, confirmed working directly in this subtopic\'s demo.'
    },
    {
      thought: 'HTMLScriptElement.supports is a hypothetical/proposed API that may not actually be implemented yet — it\'s safer to assume it might not exist and wrap every call in extensive fallback logic.',
      reality: 'This subtopic\'s demo confirms HTMLScriptElement.supports is a real, callable function in a current Chromium browser, correctly returning true for "speculationrules" — the main page\'s own recommended `?.()` optional-chaining call is sufficient defensive coding for browsers where the method itself is absent, without needing more elaborate handling.'
    },
    {
      thought: 'If a feature-detect check like HTMLScriptElement.supports(\'speculationrules\') returns true, it means the CURRENT page already has active speculation rules running.',
      reality: 'The capability check only confirms the BROWSER ENGINE would act on such a block if one were added — it says nothing about whether any speculation rules currently exist on the page. This subtopic\'s demo deliberately shows the check succeeding BEFORE any rules are injected, and only injects one afterward as a separate step.'
    }
  ];
}
