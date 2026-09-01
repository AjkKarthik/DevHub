import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Two Settings in the Same Config, Working Against Each Other',
    points: [
      'The main page\'s own helmet config sets <code>imgSrc: ["\'self\'", \'data:\', \'https://cdn.example.com\']</code> in its CSP — explicitly declaring that images should load from an external CDN — while ALSO enabling <code>crossOriginEmbedderPolicy: true</code> in the SAME config block.',
      '<code>crossOriginEmbedderPolicy: true</code> sets <code>Cross-Origin-Embedder-Policy: require-corp</code>, which blocks any cross-origin resource requested in the browser\'s default no-cors mode — including a plain <code>&lt;img src="https://cdn.example.com/..."&gt;</code> — UNLESS that resource\'s response carries its own <code>Cross-Origin-Resource-Policy: cross-origin</code> header.',
      'CSP\'s <code>imgSrc</code> allowlist and COEP are two completely independent browser mechanisms — CSP permitting a source says nothing about whether COEP will also let the response through. A CDN passing CSP\'s allowlist can still be silently blocked by COEP if it doesn\'t also send the right CORP header.',
      'This produces a genuinely confusing debugging experience: the CSP looks correct (the CDN is allowlisted), there\'s no CSP violation in the console — but the image still fails to load, with a separate, easy-to-miss COEP-specific network error.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Block',
    language: 'typescript',
    code: `// Helmet config identical to the main page's own example --
// CSP explicitly allows the CDN, COEP is also enabled.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'https://cdn.example.com'],
      // ...other directives unchanged
    },
  },
  crossOriginEmbedderPolicy: true, // Cross-Origin-Embedder-Policy: require-corp
}));

// cdn.example.com serves the image with NO Cross-Origin-Resource-Policy
// header at all -- a completely typical, unmodified CDN response.

// Result in the browser:
//   - No CSP violation logged (the source IS on the imgSrc allowlist)
//   - The <img> STILL fails to render
//   - DevTools Network tab shows the request blocked, reason:
//     "NotSameOriginAfterDefaultedToSameOriginByCoep"
//
// CSP and COEP evaluated the SAME request independently -- CSP said
// yes, COEP said no. Both checks have to pass for the image to load.`,
  },
  {
    label: 'Two Real Fixes',
    language: 'typescript',
    code: `// ── Fix 1: the CDN adds the CORP header (if you control it) ──────────
// cdn.example.com's own response headers:
//   Cross-Origin-Resource-Policy: cross-origin
//
// This explicitly opts the CDN's responses into being embeddable by
// any COEP:require-corp page -- no client-side change needed at all.

// ── Fix 2: switch to COEP: credentialless (if you don't control the CDN) ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'https://cdn.example.com'],
    },
  },
  crossOriginEmbedderPolicy: { policy: 'credentialless' },
  // credentialless still achieves cross-origin isolation (the
  // underlying reason COEP exists), but for cross-origin no-cors
  // requests it strips credentials (cookies) from the request instead
  // of requiring the third party to add a CORP header at all --
  // cdn.example.com needs ZERO changes.
}));

// Trade-off: if the CDN response genuinely NEEDS to see the
// requesting page's cookies (e.g. a private, authenticated asset),
// credentialless breaks that specific case -- fix 1 (a real CORP
// header) is the correct choice there instead.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A team switches from <code>crossOriginEmbedderPolicy: true</code> to <code>{ policy: \'credentialless\' }</code> to fix the blocked CDN image, without ever contacting the CDN. The image now loads. Is anything about the request to the CDN different from before COEP was enabled at all?',
  hint: 'credentialless changes what the no-cors cross-origin request sends, not just whether it\'s blocked.',
  solution: `// Yes -- the request no longer sends cookies (or other credentials)
// to cdn.example.com, even if it did before COEP was ever added.

// "credentialless" is not "no COEP at all" -- it still enforces
// cross-origin isolation, just via a different mechanism than
// require-corp. For a PUBLIC CDN asset (a logo, a stock image) this
// is invisible and harmless, since public assets were never using
// cookies anyway.

// For a resource that legitimately depended on receiving the
// requesting page's cookies -- a personalized or access-controlled
// asset served from the same "CDN" domain -- credentialless would
// silently strip the credential the resource needed, potentially
// causing a 401/403 from the CDN itself, a DIFFERENT failure mode
// than the original COEP block. This is exactly the scenario where
// Fix 1 (a real CORP header from the CDN) is the correct choice
// instead of switching the policy value.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'If a resource is allowlisted in CSP\'s <code>imgSrc</code>, it will load — CSP is the only header standing between the browser and the resource.',
    reality: 'CSP and COEP are separate, independently-enforced checks. CSP permitting a source only means CSP won\'t block it — COEP evaluates the SAME response against a completely different rule (does it carry the right CORP header) and can still block it even after CSP has already allowed it through.',
  },
  {
    thought: 'crossOriginEmbedderPolicy: true is a safe, no-risk default to always enable alongside a CSP that allowlists external sources.',
    reality: 'Enabling it silently breaks any cross-origin resource whose server doesn\'t ALSO send a matching CORP header — including resources you\'ve deliberately allowlisted in CSP specifically because you want them to load. It should be enabled deliberately, with the third-party resources it will affect identified in advance, not turned on by default.',
  },
  {
    thought: 'COEP: credentialless is functionally identical to not setting COEP at all — it just removes the blocking behavior.',
    reality: 'It still enforces cross-origin isolation (the SAME underlying guarantee require-corp provides) — it just achieves it by stripping credentials from no-cors cross-origin requests instead of requiring a CORP header. A resource that depends on receiving cookies will behave differently under credentialless than with no COEP at all.',
  },
];

@Component({
  selector: 'app-sec-headers-coep',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './coep-cdn-image-conflict-in-the-helmet-config.html',
  styleUrl: './coep-cdn-image-conflict-in-the-helmet-config.scss',
})
export class CoepCdnImageConflictInTheHelmetConfigSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
