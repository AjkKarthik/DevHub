import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickRefComponent, QuickRefItem }         from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint }       from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab }             from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake }  from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge }      from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion }        from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem }              from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary }  from '../../../shared/revision-card/revision-card';
import { PageMetaComponent }                       from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent }                   from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-perf-speculation-rules',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './speculation-rules.html',
  styleUrl: './speculation-rules.scss',
})
export class PerfSpeculationRules {

  quickRef: QuickRefItem[] = [
    { name: 'Speculation Rules API', type: 'keyword', desc: 'JSON config in a <script type="speculationrules"> block — tells Chrome which pages to prefetch or prerender' },
    { name: 'prefetch (speculation)', type: 'keyword', desc: 'Fetches the next page\'s HTML early — navigation TTFB drops to near 0; requires JS + CSS still downloaded' },
    { name: 'prerender',              type: 'keyword', desc: 'Full background render of the next page — navigation appears instant; highest resource cost' },
    { name: 'eagerness: immediate',   type: 'keyword', desc: 'Start speculation as soon as the rule is parsed — use only for highly confident next pages' },
    { name: 'eagerness: eager',       type: 'keyword', desc: 'Start on mouseover / focus — good balance of confidence vs resource cost' },
    { name: 'eagerness: moderate',    type: 'keyword', desc: 'Start after cursor has hovered > 200ms — conservative, fewer wasted prerenders' },
    { name: 'eagerness: conservative', type: 'keyword', desc: 'Start on pointerdown / touchstart — highest confidence, smallest wasted resource window' },
    { name: 'Document Rules',         type: 'keyword', desc: 'CSS selector-based rules — auto-speculate all <a> tags matching a selector without listing URLs' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What the Speculation Rules API does',
      points: [
        'Speculation Rules is a JSON-based API that tells the browser which pages to fetch or render in the background.',
        'prefetch: downloads the next page\'s HTML before navigation — TTFB on navigation drops to ~0ms.',
        'prerender: fully renders the next page in a hidden tab — the navigation appears instant (< 200ms perceived).',
        'Controlled via <script type="speculationrules"> in the page — no external resource loaded.',
        'Chrome 109+ (stable); Edge follows Chrome. Safari and Firefox: partial/not yet supported — always feature-detect.',
      ],
    },
    {
      heading: 'prefetch vs prerender — choose the right level',
      points: [
        'prefetch fetches the HTML document only — when the user navigates, CSS/JS/images still need to download.',
        'prerender fetches + executes JS + downloads subresources + paints — navigation is truly instant.',
        'prerender cost: uses ~50–100 MB RAM for the hidden renderer; runs JS (analytics may double-fire).',
        'Use prefetch when you\'re moderately confident of the next page; prerender when you\'re very confident.',
        'For a "Next: checkout" link, prerender is justified. For "you might also like" links, prefetch is safer.',
      ],
    },
    {
      heading: 'Eagerness — controlling when speculation starts',
      points: [
        'immediate: start as soon as the rule is parsed — highest resource use, best for mandatory next pages.',
        'eager: start on pointer over or link focus — good for prominent CTAs; trades resource cost for accuracy.',
        'moderate: start after hovering > 200ms — the default Chrome uses for <a> links on desktop.',
        'conservative: start on pointerdown/touchstart — fires ~100ms before navigation, lowest waste.',
        'Choose eagerness based on confidence: "definitely the next page" → immediate; "probably" → eager/moderate.',
      ],
    },
    {
      heading: 'URL rules vs Document Rules',
      points: [
        'URL rules: explicit list of URLs to speculate — good for known critical flows (homepage → sign up → checkout).',
        'Document Rules: CSS selector targets all matching <a> tags automatically — prerender every product card link.',
        'where: { href_matches: "/products/*" } — only speculate product pages; exclude /admin, /logout.',
        'where: { not: { href_matches: "/logout" } } — exclude dangerous side-effect URLs.',
        'Combine: document rules with href_matches for sections, plus explicit URL list for checkout flow.',
      ],
    },
    {
      heading: 'Limits, privacy, and analytics',
      points: [
        'Chrome limits concurrent prerenders to ~10 and prefetches to ~50 — excess rules are deprioritised.',
        'Cross-origin prerenders: not supported (same-origin only for prerender; prefetch can be cross-origin).',
        'Analytics double-fire: prerender executes JS including analytics — real navigation fires again.',
        'Fix analytics: check document.prerendering === true and defer sending events until activationstart fires.',
        'Privacy: Chrome does NOT send prefetch/prerender requests for cross-origin URLs without explicit opt-in.',
      ],
    },
    {
      heading: 'Feature detection and progressive enhancement',
      points: [
        'Always feature-detect: if (!HTMLScriptElement.supports("speculationrules")) return;',
        'Browsers without support simply ignore the <script type="speculationrules"> block — safe no-op.',
        'The Speculation Rules API is additive: pages work identically without it; it only improves navigation speed.',
        'Use it alongside <link rel="prefetch"> for broader browser support (prefetch tag works in Firefox/Safari).',
        'Remove prerender of low-confidence pages on mobile — data and RAM cost is higher on mobile devices.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'URL rules — explicit list',
      language: 'html',
      code: `<!-- Speculation Rules: prerender the most likely next pages -->
<script type="speculationrules">
{
  "prerender": [
    {
      "urls": ["/checkout", "/checkout/shipping"],
      "eagerness": "eager"
    }
  ],
  "prefetch": [
    {
      "urls": [
        "/products/featured",
        "/about",
        "/pricing"
      ],
      "eagerness": "moderate"
    }
  ]
}
</script>

<!--
  prerender /checkout on hover (eager) — renders fully in background
  prefetch /products, /about, /pricing on hover > 200ms (moderate) — HTML only

  Navigation to /checkout after hover: ~0ms TTFB + instant render
  Navigation to /products after hover: ~0ms TTFB, still needs CSS/JS
-->`,
    },
    {
      label: 'Document rules — selector-based',
      language: 'html',
      code: `<!-- Automatically prerender ALL product links on the page -->
<script type="speculationrules">
{
  "prerender": [
    {
      "where": {
        "and": [
          { "href_matches": "/products/*" },
          { "not": { "href_matches": "/products/*/admin" } }
        ]
      },
      "eagerness": "moderate"
    }
  ],
  "prefetch": [
    {
      "where": {
        "and": [
          { "selector_matches": "a.nav-link" },
          { "not": { "href_matches": "/logout" } },
          { "not": { "href_matches": "/delete-account" } }
        ]
      },
      "eagerness": "conservative"
    }
  ]
}
</script>

<!--
  Document rules pick up <a href="/products/123"> and <a href="/products/456">
  dynamically — no need to know URLs at build time.

  IMPORTANT: exclude side-effect URLs (logout, delete, payment confirm)
  — prerender would trigger those server-side effects in the background!
-->`,
    },
    {
      label: 'Feature detection + dynamic injection',
      language: 'typescript',
      code: `// feature-detect before using Speculation Rules
function addSpeculationRules(rules: object): void {
  if (!HTMLScriptElement.supports?.('speculationrules')) {
    // Fall back to <link rel="prefetch"> for broader support
    const urls = [
      ...((rules as any).prefetch ?? []).flatMap((r: any) => r.urls ?? []),
      ...((rules as any).prerender ?? []).flatMap((r: any) => r.urls ?? []),
    ];
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
    return;
  }

  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.textContent = JSON.stringify(rules);
  document.head.appendChild(script);
}

// Add rules only after user shows intent (e.g. logged in, on product page)
if (document.querySelector('.product-page')) {
  addSpeculationRules({
    prerender: [{
      where: { href_matches: '/checkout' },
      eagerness: 'eager',
    }],
    prefetch: [{
      where: { href_matches: '/products/*' },
      eagerness: 'moderate',
    }],
  });
}`,
    },
    {
      label: 'Fix analytics double-fire',
      language: 'typescript',
      code: `// Problem: prerender executes analytics JS before user navigates
// Fix: defer analytics until page is actually activated

import { onLCP, onINP, onCLS } from 'web-vitals';

function sendAnalyticsEvent(name: string, value: unknown) {
  // If page is still prerendering, queue the event
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', () => {
      sendAnalyticsEvent(name, value);  // retry once activated
    }, { once: true });
    return;
  }
  // Page is active — send normally
  navigator.sendBeacon('/api/analytics', JSON.stringify({ name, value }));
}

// Web Vitals: measure from activation time, not prerender start
function collectVitals() {
  onLCP(({ value, rating }) => sendAnalyticsEvent('LCP', { value, rating }));
  onINP(({ value, rating }) => sendAnalyticsEvent('INP', { value, rating }));
  onCLS(({ value, rating }) => sendAnalyticsEvent('CLS', { value, rating }));
}

// If page was prerendered, wait for activation before collecting
if (document.prerendering) {
  document.addEventListener('prerenderingchange', collectVitals, { once: true });
} else {
  collectVitals();
}

// Page activation: browser fires this when prerendered page becomes visible
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    // bfcache restore — also re-collect vitals
    collectVitals();
  }
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Prerendering URLs with side effects',
      wrong: `{
  "prerender": [{
    "where": { "selector_matches": "a" }
  }]
}
<!-- Prerender clicks EVERY link — including /logout, /delete-account, /confirm-order
     These execute server-side effects in the background before user clicks! -->`,
      right: `{
  "prerender": [{
    "where": {
      "and": [
        { "selector_matches": "a" },
        { "not": { "href_matches": "/logout" } },
        { "not": { "href_matches": "/delete*" } },
        { "not": { "href_matches": "/confirm*" } },
        { "not": { "href_matches": "/pay*" } }
      ]
    }
  }]
}`,
      explanation: 'prerender fully executes the target page including server-side requests. Prerendering /logout logs the user out in the background. Prerendering /confirm-order may process a payment. Always explicitly exclude any URL that has side effects via href_matches exclusions.',
    },
    {
      title: 'Not feature-detecting before using Speculation Rules',
      wrong: `// Inlining speculation rules without feature detection
// Firefox and Safari: silently ignore — OK
// BUT: dynamic injection without feature detection
const s = document.createElement('script');
s.type = 'speculationrules';
s.textContent = JSON.stringify(rules);
document.head.appendChild(s);
// Works, but no fallback for browsers that don't support it`,
      right: `if (HTMLScriptElement.supports?.('speculationrules')) {
  const s = document.createElement('script');
  s.type = 'speculationrules';
  s.textContent = JSON.stringify(rules);
  document.head.appendChild(s);
} else {
  // Fallback: <link rel="prefetch"> for Firefox/Safari
  criticalUrls.forEach(url => {
    const link = Object.assign(document.createElement('link'), { rel: 'prefetch', href: url });
    document.head.appendChild(link);
  });
}`,
      explanation: 'While inline <script type="speculationrules"> is safely ignored by unsupported browsers, dynamically injected rules should still feature-detect to enable a <link rel="prefetch"> fallback. HTMLScriptElement.supports("speculationrules") returns true only in Chrome 109+ and Edge.',
    },
    {
      title: 'Using eagerness: immediate for every rule',
      wrong: `{
  "prerender": [{
    "urls": ["/products", "/about", "/contact", "/pricing", "/blog"],
    "eagerness": "immediate"
  }]
}
// Prerenders 5 pages immediately on load — 500MB RAM used before user clicks anything`,
      right: `{
  "prerender": [{
    "urls": ["/checkout"],           // Only the mandatory next step
    "eagerness": "eager"             // Starts on hover — not immediately
  }],
  "prefetch": [{
    "urls": ["/products", "/about"],
    "eagerness": "moderate"          // Starts after 200ms hover
  }]
}`,
      explanation: 'eagerness: immediate starts speculation as soon as the rule is parsed — before the user shows any intent. Each prerender uses 50–100 MB RAM. Prerendering 5 pages immediately wastes 250–500 MB for users who may navigate to none of them. Use eager/moderate for most links; reserve immediate for absolute certainty.',
    },
    {
      title: 'Prerendering cross-origin pages',
      wrong: `{
  "prerender": [{
    "urls": [
      "https://partner.example.com/landing",  // cross-origin — NOT supported
      "https://cdn.example.com/app"           // cross-origin — NOT supported
    ]
  }]
}
// Cross-origin prerender silently degrades to prefetch at best`,
      right: `{
  "prerender": [{
    "urls": ["/internal-page", "/same-origin-only"]  // same-origin only
  }],
  "prefetch": [{
    "urls": ["https://partner.example.com/landing"]  // cross-origin prefetch: OK
  }]
}`,
      explanation: 'prerender only works for same-origin URLs — the browser cannot render a cross-origin page in a hidden tab due to security restrictions (CORF, CORB, etc.). Cross-origin prefetch is supported but requires the target server to send a Supports-Loading-Mode: credentialless header.',
    },
    {
      title: 'Not handling analytics double-fire on prerendered pages',
      wrong: `// analytics.ts — fires on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  gtag('event', 'page_view', { page_path: location.pathname });
  // Fires during prerender (before user navigates) AND again on navigation
  // Result: page view counted twice in GA4
});`,
      right: `// Defer analytics until page is actually visible to the user
function trackPageView() {
  gtag('event', 'page_view', { page_path: location.pathname });
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', trackPageView, { once: true });
} else {
  trackPageView();
}`,
      explanation: 'prerender executes the page\'s JavaScript fully, including analytics. If your analytics fires on DOMContentLoaded or immediately, the page view is counted during the background render. Check document.prerendering === true and defer analytics until the prerenderingchange event fires (when user actually navigates).',
    },
    {
      title: 'Speculating on low-confidence "you might also like" links',
      wrong: `{
  "prerender": [{
    "where": { "selector_matches": ".recommendation-card a" },
    "eagerness": "immediate"  // Prerender 20 recommendations immediately
  }]
}
// 20 × 50MB = 1GB RAM consumed; 90% of prerenders wasted`,
      right: `/* Recommendations: low confidence — use prefetch + conservative eagerness */
{
  "prefetch": [{
    "where": { "selector_matches": ".recommendation-card a" },
    "eagerness": "conservative"  // Only on pointerdown — very high confidence
  }]
}
/* Or: don't speculate on low-confidence links at all */`,
      explanation: 'Speculation has a real cost — RAM for prerender, bandwidth for both. Recommendation carousels have low click-through rates (< 5%). Prerendering all of them immediately wastes resources for 95%+ of users. Save prerender for high-confidence sequential flows; use prefetch with conservative for recommendations.',
    },
  ];

  challenge: Challenge = {
    title: 'Add Speculation Rules to an e-commerce checkout flow',
    language: 'html',
    description: `An e-commerce site has a 3-step checkout flow: /cart → /checkout/shipping → /checkout/payment → /checkout/confirm.

Add Speculation Rules to make navigations between checkout steps feel instant:
1. Prerender the NEXT step with eager eagerness when on each step
2. Only prerender same-origin checkout URLs (not /logout or /cancel-order)
3. Feature-detect and fall back to <link rel="prefetch"> for unsupported browsers
4. Ensure analytics doesn't double-fire on the prerendered page`,
    hints: [
      'Use different rules per page — inject rules based on current pathname',
      'document.prerendering guards analytics in the prerendered tab',
      'HTMLScriptElement.supports("speculationrules") for feature detection',
      'eagerness: "eager" starts on mouseover — right balance for checkout CTAs',
      'Exclude /cancel-order and /logout from any broad document rules',
    ],
    starterCode: `<!-- checkout.html — currently no speculation rules -->
<!DOCTYPE html>
<html>
<head>
  <title>Checkout</title>
  <!-- TODO: add speculation rules -->
</head>
<body>
  <nav>
    <a href="/cart">Cart</a>
    <a href="/checkout/shipping">Shipping</a>
    <a href="/checkout/payment">Payment</a>
  </nav>
  <main id="checkout-step">...</main>

  <script>
    // TODO: analytics — must not double-fire on prerender
    function trackStep(step) {
      gtag('event', 'checkout_step', { step });
    }
    trackStep(document.getElementById('checkout-step').dataset.step);
  </script>
</body>
</html>`,
    solution: `<!DOCTYPE html>
<html>
<head>
  <title>Checkout</title>

  <!-- Speculation Rules: prerender the next checkout step -->
  <script type="speculationrules">
  {
    "prerender": [{
      "where": {
        "and": [
          { "href_matches": "/checkout/*" },
          { "not": { "href_matches": "/checkout/cancel*" } }
        ]
      },
      "eagerness": "eager"
    }],
    "prefetch": [{
      "urls": ["/cart"],
      "eagerness": "moderate"
    }]
  }
  </script>
</head>
<body>
  <nav>
    <a href="/cart">Cart</a>
    <a href="/checkout/shipping">Shipping</a>
    <a href="/checkout/payment">Payment</a>
  </nav>
  <main id="checkout-step" data-step="shipping">...</main>

  <script>
    // Feature detection + fallback
    if (!HTMLScriptElement.supports?.('speculationrules')) {
      // Fallback: prefetch next step for Firefox/Safari
      const nextStep = document.querySelector('a[href^="/checkout/"]');
      if (nextStep) {
        const link = Object.assign(document.createElement('link'),
          { rel: 'prefetch', href: nextStep.href });
        document.head.appendChild(link);
      }
    }

    // Analytics: defer until page is actually activated
    function trackStep(step) {
      gtag('event', 'checkout_step', { step });
    }

    const step = document.getElementById('checkout-step').dataset.step;

    if (document.prerendering) {
      // Wait until user actually navigates to this page
      document.addEventListener('prerenderingchange', () => trackStep(step), { once: true });
    } else {
      trackStep(step);
    }
  </script>
</body>
</html>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between prefetch and prerender in the Speculation Rules API?',
      options: [
        'prefetch downloads images only; prerender downloads HTML only',
        'prefetch downloads the HTML document; prerender fully renders the page including JS execution and subresources',
        'prefetch works cross-origin; prerender only works same-origin',
        'prefetch requires a service worker; prerender works without one',
      ],
      answer: 1,
      explanation: 'prefetch downloads the HTML document early — navigation still needs to download CSS, JS, and images. prerender goes further: it fetches HTML, executes JavaScript, downloads all subresources, and paints the page in a hidden renderer. Navigation to a prerendered page appears instant.',
    },
    {
      q: 'Which eagerness setting starts speculation immediately when the rule is parsed?',
      options: [
        'conservative',
        'immediate',
        'eager',
        'moderate',
      ],
      answer: 1,
      explanation: 'eagerness: "immediate" starts prefetching or prerendering as soon as the speculation rule is parsed — before the user shows any intent. Use only for pages you\'re absolutely certain the user will visit next (e.g. a mandatory onboarding step). For most links, "eager" (on hover) or "moderate" (200ms hover) is more appropriate.',
    },
    {
      q: 'Why must you exclude /logout from document rules?',
      options: [
        '/logout pages are cross-origin and cannot be speculated',
        'Prerendering /logout executes the server-side logout logic in the background before the user clicks',
        '/logout pages don\'t have HTML to prefetch',
        'Browsers automatically skip navigation-changing URLs in speculation rules',
      ],
      answer: 1,
      explanation: 'prerender fully executes the target page — including any server-side actions triggered by visiting it. Prerendering /logout would call the logout endpoint in the background, silently logging the user out before they ever click the link. Always explicitly exclude URLs with side effects.',
    },
    {
      q: 'How do you detect that a page is currently being prerendered (not yet navigated to)?',
      options: [
        'document.hidden === true',
        'document.prerendering === true',
        'window.prerenderActive === true',
        'performance.getEntriesByType("prerender").length > 0',
      ],
      answer: 1,
      explanation: 'document.prerendering is true while the page is executing in a prerendered hidden tab. When the user actually navigates to it, the prerenderingchange event fires and document.prerendering becomes false. Use this to defer analytics and other side-effectful code until the user actually arrives.',
    },
    {
      q: 'What browser support does the Speculation Rules API have?',
      options: [
        'All major browsers including Firefox and Safari since 2022',
        'Chrome 109+ and Edge (which follows Chrome); not yet in Firefox or Safari — always feature-detect',
        'Only Chrome Canary and experimental builds',
        'All Chromium-based browsers plus Firefox 120+',
      ],
      answer: 1,
      explanation: 'The Speculation Rules API shipped in Chrome 109 (stable, January 2023) and Edge follows Chrome\'s implementation. Firefox and Safari do not support it yet. The inline <script type="speculationrules"> is safely ignored by unsupported browsers, but dynamic injection should include a feature-detect and <link rel="prefetch"> fallback.',
    },
    {
      q: 'What is the difference between prefetch and prerender in Speculation Rules?',
      options: ['prefetch and prerender are identical', 'prefetch downloads only the HTML document; prerender downloads AND executes the page in a hidden browsing context', 'prefetch is for images; prerender is for scripts', 'prefetch works on mobile; prerender only on desktop'],
      answer: 1,
      explanation: 'prefetch fetches the URL\'s HTML into the HTTP cache — when the user navigates, the HTML is already cached but JS/CSS still need to parse and run. prerender goes further: the browser creates a hidden tab, fetches all subresources, runs JavaScript, and renders the full page. Navigation becomes instant (< 100ms). The cost is significant CPU/memory usage on the speculated page.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does prerender work with Angular\'s client-side router?',
      a: 'Yes, but with caveats. The prerendered page runs the full Angular bootstrap including routing. When the user actually navigates, Angular\'s router intercepts the click and does a client-side navigation — but the prerendered HTML is already displayed, so the transition is instant. The main gotcha is analytics (double-fire) and any code that must run only once per real navigation. Use document.prerendering guards for those cases.',
    },
    {
      q: 'How many pages can be prerendered simultaneously?',
      a: 'Chrome limits concurrent prerenders to approximately 10 and prefetches to approximately 50. If your rules specify more, Chrome deprioritises and queues them. In practice, you should prerender only 1–3 high-confidence pages — more than that wastes RAM and the benefit diminishes for pages the user is unlikely to visit.',
    },
    {
      q: 'Is the Speculation Rules API the same as <link rel="prefetch">?',
      a: 'No. <link rel="prefetch"> has been in browsers for years (Chrome, Firefox, Safari) — it prefetches a resource into the HTTP cache. Speculation Rules is more powerful: it supports prerender (not just prefetch), offers eagerness control, and supports Document Rules (selector-based, dynamic). For maximum browser coverage, use Speculation Rules when supported and fall back to <link rel="prefetch"> in other browsers.',
    },
    {
      q: 'Can prerender hurt my page\'s analytics by inflating page views?',
      a: 'It can if you don\'t guard against it. Analytics that fire on DOMContentLoaded or immediately will execute during the prerender before the user arrives — counting a ghost page view. The fix is document.prerendering: defer all analytics until the prerenderingchange event fires. The web-vitals library already handles this correctly in v3+.',
    },
    {
      q: 'Should I use Speculation Rules on mobile?',
      a: 'With more caution than desktop. Mobile devices have less RAM (prerender costs 50–100 MB per page), and mobile users on cellular connections pay for bandwidth. Use prefetch rather than prerender on mobile, prefer conservative or moderate eagerness, and limit the number of URLs speculated. Consider only adding prerender rules for desktop viewports: if (window.innerWidth > 768) addSpeculationRules(prerenderRules).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Speculation Rules API prefetches HTML or fully prerenders the next page in the background — navigations feel instant; always exclude side-effect URLs, feature-detect, and guard analytics with document.prerendering.',
    mustKnow: [
      'prefetch = HTML only; prerender = full render including JS + subresources',
      'eagerness levels: immediate → eager → moderate → conservative (decreasing aggressiveness)',
      'NEVER prerender side-effect URLs (/logout, /delete, /confirm) — they execute server-side',
      'document.prerendering === true while page renders in hidden tab — defer analytics until prerenderingchange',
      'prerender is same-origin only; cross-origin prefetch requires Supports-Loading-Mode: credentialless',
      'Feature-detect with HTMLScriptElement.supports("speculationrules"); fall back to <link rel="prefetch">',
    ],
    interviewFocus: [
      'What is the difference between prefetch and prerender in Speculation Rules?',
      'Why must you exclude /logout from speculation rules?',
      'How do you prevent analytics double-firing with prerendered pages?',
      'What eagerness level would you choose for a mandatory "next step" CTA?',
    ],
  };
}
