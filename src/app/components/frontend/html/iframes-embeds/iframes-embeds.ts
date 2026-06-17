import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-html-iframes-embeds',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './iframes-embeds.html',
  styleUrl: './iframes-embeds.scss',
})
export class HtmlIframesEmbeds {

  quickRef: QuickRefItem[] = [
    { name: '<iframe>', type: 'keyword', desc: 'Embeds another HTML document within the current page in an isolated browsing context.' },
    { name: 'sandbox', type: 'syntax', desc: 'Restricts iframe capabilities — empty = deny-all; tokens explicitly re-enable features.' },
    { name: 'allow', type: 'syntax', desc: 'Permissions Policy — grants specific browser features (camera, fullscreen, payment) to the iframe.' },
    { name: 'srcdoc', type: 'syntax', desc: 'Inline HTML string for the iframe content — no network request, safer for user-generated HTML.' },
    { name: 'loading="lazy"', type: 'syntax', desc: 'Defers iframe loading until it nears the viewport — same as img lazy loading.' },
    { name: 'title', type: 'syntax', desc: 'Accessible label for the iframe — screen readers announce this to describe the embedded content.' },
    { name: 'X-Frame-Options', type: 'keyword', desc: 'HTTP response header — DENY or SAMEORIGIN to block the page from being embedded in iframes.' },
    { name: 'frame-ancestors', type: 'keyword', desc: "CSP directive controlling which origins may embed this page — supersedes X-Frame-Options." },
    { name: '<object>', type: 'keyword', desc: 'Embeds external resources (PDF, SVG) with inline fallback content between its tags.' },
    { name: 'allow-same-origin', type: 'syntax', desc: 'Dangerous sandbox token — combined with allow-scripts it effectively removes the sandbox.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'iframe Basics — src, srcdoc, and sandbox',
      points: [
        'The src attribute loads an external URL into a separate browsing context; srcdoc embeds an inline HTML string directly without a network request, ideal for sandboxed user-generated content.',
        'An iframe with no sandbox attribute has the same-origin privileges as the parent page — always add sandbox to third-party embeds.',
        'An empty sandbox="" attribute applies maximum restrictions: no scripts, no forms, no popups, no same-origin access, no top-level navigation.',
        'Each token in sandbox re-enables one capability: allow-scripts re-enables JavaScript; allow-forms re-enables form submission; allow-popups re-enables window.open().',
        'Combining allow-scripts and allow-same-origin in sandbox is dangerous — a sandboxed script can remove its own sandbox attribute if it has same-origin access.',
      ],
    },
    {
      heading: 'Security — Clickjacking, X-Frame-Options, and CSP',
      points: [
        'Clickjacking attacks overlay a transparent iframe over a legitimate UI, tricking users into clicking buttons on the embedded page — e.g., liking a post or authorizing a transfer.',
        'X-Frame-Options: DENY prevents the page being embedded in any iframe; SAMEORIGIN allows embedding only from the same origin. It is a single-value header with no multi-origin support.',
        'Content Security Policy frame-ancestors is the modern replacement — it supports multiple origins: Content-Security-Policy: frame-ancestors \'self\' https://trusted.com.',
        'Cross-origin iframes cannot access each other\'s DOM, cookies, or localStorage due to the Same-Origin Policy — this is the browser\'s primary isolation guarantee.',
        'The Fetch Metadata headers (Sec-Fetch-Dest: iframe) allow the server to detect and reject unexpected iframe requests at the HTTP layer before rendering.',
      ],
    },
    {
      heading: 'Permissions Policy — the allow Attribute',
      points: [
        'The allow attribute implements Permissions Policy, controlling which browser APIs the iframe can access — camera, microphone, geolocation, fullscreen, payment, autoplay, and more.',
        'Syntax uses semicolons as separators and an allowlist per feature: allow="camera; microphone; fullscreen" — commas are wrong and silently break parsing.',
        'An empty string allow="" blocks all Permissions Policy features from the iframe — useful for untrusted third-party content.',
        'You can restrict a feature to a specific origin: allow="payment https://pay.example.com" — the iframe only gets payment access if its src matches that origin.',
        'Permissions Policy applies at the iframe level; the page-level policy (Permissions-Policy header) can only restrict, never expand, what iframes may grant.',
      ],
    },
    {
      heading: 'Performance and Accessibility',
      points: [
        'loading="lazy" defers iframe loading until it enters the viewport intersection — reduces initial page weight for below-the-fold embeds like maps or comment widgets.',
        'Always set explicit width and height on iframes to prevent Cumulative Layout Shift (CLS) — the browser reserves space before the iframe loads.',
        'The title attribute is mandatory for accessibility — screen readers announce it to users navigating with keyboard or AT: title="Google Maps — DevHub office location".',
        'Avoid iframes for content that should be in the page DOM — search engines may not index iframe content, and it cannot be styled with parent CSS.',
      ],
    },
    {
      heading: 'embed vs object vs iframe vs Inline SVG',
      points: [
        '<iframe> is the modern standard for embedding foreign documents — it has the best security surface (sandbox, CSP), the most browser support, and the clearest semantics.',
        '<object> embeds a resource with a fallback: content between the tags is shown if the browser cannot display the data type — useful for PDFs with a download link fallback.',
        '<embed> is a void element (no fallback) historically used for plugins like Flash; today it is only useful for embedding PDFs in some browsers without UI chrome.',
        'Inline SVG (pasting the <svg> directly into HTML) is preferred for icons and illustrations — it is part of the DOM, styleable with CSS, and manipulable with JS, with zero extra request.',
        'SVG via <img src="file.svg"> is the simplest approach but isolates the SVG from CSS and JS; <object data="file.svg"> is a middle ground that loads the SVG with its own document context.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sandboxed iframe',
      language: 'html',
      code: `<!-- ── Sandbox attribute controls ────────────────────────────────── -->

<!-- 1. Maximum restriction: empty sandbox blocks EVERYTHING -->
<iframe
  srcdoc="<h2>Fully sandboxed</h2><p>No JS, no forms, no popups.</p>"
  sandbox=""
  width="400" height="150"
  title="Fully sandboxed iframe example">
</iframe>

<!-- 2. Allow scripts only (still blocks forms, popups, same-origin) -->
<iframe
  srcdoc="<p>Click: <button onclick='this.textContent=&quot;Clicked!&quot;'>Click me</button></p>"
  sandbox="allow-scripts"
  width="400" height="80"
  title="Script-enabled sandboxed iframe">
</iframe>

<!-- 3. Allow scripts + forms — typical newsletter embed -->
<iframe
  src="https://newsletter.example.com/embed"
  sandbox="allow-scripts allow-forms allow-popups-to-escape-sandbox"
  width="400" height="200"
  loading="lazy"
  title="Newsletter signup form">
</iframe>

<!-- ── srcdoc — inline HTML, no network request ────────────────── -->
<!-- Safe for rendering user-generated HTML previews             -->
<iframe
  srcdoc="<!DOCTYPE html><html><body>
    <h1 style='color:teal'>User preview</h1>
    <p>Safe because sandbox blocks scripts.</p>
  </body></html>"
  sandbox=""
  width="400" height="120"
  title="User content preview">
</iframe>

<!-- ⚠️  NEVER combine allow-scripts + allow-same-origin         -->
<!-- A script can remove its own sandbox attribute if same-origin -->
<!-- <iframe sandbox="allow-scripts allow-same-origin" ...>  ✗   -->`,
    },
    {
      label: 'Permissions Policy & lazy load',
      language: 'html',
      code: `<!-- ── Permissions Policy (allow attribute) ────────────────────── -->

<!-- YouTube embed — allow autoplay + fullscreen only             -->
<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;">
  <iframe
    src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    title="YouTube video player"
    allow="autoplay; fullscreen; picture-in-picture"
    sandbox="allow-scripts allow-same-origin allow-presentation"
    loading="lazy"
    style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;"
    referrerpolicy="strict-origin-when-cross-origin">
  </iframe>
</div>

<!-- Map embed — location only, block camera/mic/payment         -->
<iframe
  src="https://maps.example.com/embed?q=London"
  title="Location map — DevHub London office"
  allow="geolocation"
  sandbox="allow-scripts allow-same-origin"
  loading="lazy"
  width="600" height="400"
  style="border:0;">
</iframe>

<!-- Payment widget — restrict to specific origin                -->
<iframe
  src="https://pay.stripe.com/embed/checkout"
  title="Secure checkout"
  allow="payment https://pay.stripe.com"
  sandbox="allow-scripts allow-forms allow-same-origin"
  width="480" height="600">
</iframe>

<!-- Block ALL permissions — safest for untrusted third-party   -->
<iframe
  src="https://widget.example.com"
  title="Third-party widget"
  allow=""
  sandbox="allow-scripts"
  loading="lazy"
  width="300" height="200">
</iframe>`,
    },
    {
      label: 'Embedding patterns',
      language: 'html',
      code: `<!-- ── 1. iframe — cross-origin document embedding ─────────────── -->
<iframe
  src="https://example.com/page"
  title="External page embed"
  sandbox="allow-scripts allow-same-origin"
  loading="lazy"
  width="800" height="500">
</iframe>

<!-- ── 2. <object> — PDF with download fallback ─────────────────── -->
<object
  data="/reports/annual-2025.pdf"
  type="application/pdf"
  width="800" height="600"
  title="Annual Report 2025">
  <!-- Fallback shown when browser cannot render PDF inline -->
  <p>
    Your browser does not support inline PDFs.
    <a href="/reports/annual-2025.pdf" download>Download the PDF</a>
  </p>
</object>

<!-- ── 3. Inline SVG — best for icons and illustrations ─────────── -->
<!-- Part of the DOM: CSS-styleable, JS-queryable, zero extra request -->
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"
     viewBox="0 0 24 24" role="img" aria-label="Star icon">
  <title>Star</title>
  <path fill="currentColor"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77
           l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>

<!-- ── 4. SVG via <img> — simple, isolated ──────────────────────── -->
<!-- Cannot be styled with external CSS or manipulated with JS     -->
<img src="/icons/logo.svg" alt="Company logo" width="120" height="40">

<!-- ── 5. SVG via <object> — SVG with its own document context ──── -->
<object data="/icons/interactive-chart.svg" type="image/svg+xml"
        width="400" height="300" title="Sales chart">
  <img src="/icons/chart-fallback.png" alt="Sales chart">
</object>

<!-- ── Anti-pattern: <embed> (avoid for new code) ───────────────── -->
<!-- No fallback, inconsistent browser support, legacy only        -->
<!-- <embed src="legacy.pdf" type="application/pdf">              -->`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'No sandbox on third-party iframes',
      wrong: `<iframe src="https://third-party.com/widget"></iframe>`,
      right: `<iframe src="https://third-party.com/widget"
        sandbox="allow-scripts"
        title="Third-party widget"></iframe>`,
      explanation: 'Without sandbox, the iframe inherits the page\'s origin if it is same-origin, or can run scripts and open popups if cross-origin. Always sandbox third-party content to limit blast radius if the embed is compromised.',
    },
    {
      title: 'Semicolons vs commas in allow attribute',
      wrong: `<iframe allow="camera, microphone, fullscreen"></iframe>`,
      right: `<iframe allow="camera; microphone; fullscreen"></iframe>`,
      explanation: 'Permissions Policy directives must be separated by semicolons. Commas are invalid syntax and cause the entire allow attribute to be silently ignored, granting no permissions at all.',
    },
    {
      title: 'Missing title attribute on iframe',
      wrong: `<iframe src="https://maps.example.com/embed"></iframe>`,
      right: `<iframe src="https://maps.example.com/embed"
        title="Interactive map — office location"></iframe>`,
      explanation: 'Screen readers cannot describe an untitled iframe to the user — they read "frame" which is meaningless. The title attribute is the accessible name of the iframe and should describe its content or purpose.',
    },
    {
      title: 'Using X-Frame-Options with multiple origins',
      wrong: `X-Frame-Options: ALLOW-FROM https://a.com https://b.com`,
      right: `Content-Security-Policy: frame-ancestors 'self' https://a.com https://b.com`,
      explanation: 'X-Frame-Options only supports one value (DENY, SAMEORIGIN, or ALLOW-FROM with a single URI). For multiple allowed origins use the CSP frame-ancestors directive, which most modern browsers support.',
    },
    {
      title: 'Combining allow-scripts and allow-same-origin in sandbox',
      wrong: `<iframe sandbox="allow-scripts allow-same-origin"></iframe>`,
      right: `<iframe sandbox="allow-scripts"></iframe>
<!-- or -->
<iframe sandbox="allow-same-origin"></iframe>`,
      explanation: 'This combination effectively defeats the sandbox. A script running inside a same-origin sandboxed iframe can call frameElement.removeAttribute("sandbox") on the parent, breaking out of the sandbox entirely.',
    },
  ];

  challenge: Challenge = {
    title: 'Secure a YouTube embed',
    language: 'html',
    description: 'Embed a YouTube video correctly with: (1) youtube-nocookie.com domain to reduce tracking; (2) sandbox tokens for allow-scripts, allow-same-origin, allow-presentation; (3) allow attribute for autoplay, fullscreen, picture-in-picture only; (4) loading="lazy"; (5) a meaningful title; (6) responsive 16:9 wrapper using CSS padding trick. The video ID to use is "dQw4w9WgXcQ".',
    hints: [
      'Use www.youtube-nocookie.com/embed/<id> not www.youtube.com/embed/<id>',
      'sandbox and allow are both needed — they control different things',
      'Responsive 16:9 = padding-bottom: 56.25% on a relative container with height:0',
      'position: absolute on the iframe inside the relative wrapper',
    ],
    starterCode: `<!-- Add the YouTube embed here -->
<div class="video-wrapper">
  <!-- iframe goes here -->
</div>

<style>
  .video-wrapper {
    /* add responsive styles */
  }
</style>`,
    solution: `<div class="video-wrapper">
  <iframe
    src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    title="Never Gonna Give You Up — Rick Astley (official video)"
    allow="autoplay; fullscreen; picture-in-picture"
    sandbox="allow-scripts allow-same-origin allow-presentation"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;">
  </iframe>
</div>

<style>
  .video-wrapper {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 */
    height: 0;
    overflow: hidden;
    max-width: 800px;
  }
</style>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which attribute controls Permissions Policy features like camera and microphone in an iframe?',
      options: ['sandbox', 'allow', 'permissions', 'policy'],
      answer: 1,
      explanation: 'The allow attribute implements Permissions Policy for iframes, granting or denying specific browser APIs. The sandbox attribute is a separate, older mechanism for restricting script execution, forms, and popups.',
    },
    {
      q: 'What does an empty sandbox="" attribute do to an iframe?',
      options: ['Has no effect — same as omitting sandbox', 'Allows scripts but blocks forms', 'Applies maximum restrictions — blocks scripts, forms, popups, and same-origin', 'Only blocks popups'],
      answer: 2,
      explanation: 'An empty sandbox attribute enables all restrictions simultaneously: no JS, no forms, no popups, no same-origin access, no top navigation. Each token in the attribute string re-enables one specific capability.',
    },
    {
      q: 'Which HTTP header is the modern replacement for X-Frame-Options for multi-origin allow-lists?',
      options: ['Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy: frame-ancestors', 'Cross-Origin-Embedder-Policy'],
      answer: 2,
      explanation: 'CSP frame-ancestors supports multiple origins and wildcard patterns. X-Frame-Options is limited to DENY, SAMEORIGIN, or a single ALLOW-FROM URI — it cannot specify multiple allowed domains.',
    },
    {
      q: 'Which attribute defers iframe loading until it nears the viewport?',
      options: ['defer', 'async', 'loading="lazy"', 'fetchpriority="low"'],
      answer: 2,
      explanation: 'loading="lazy" on iframes works like loading="lazy" on images — the browser defers loading until the element is within the viewport intersection threshold, reducing initial page weight.',
    },
    {
      q: 'What is the primary advantage of inline SVG over <img src="file.svg">?',
      options: ['It loads faster because no network request is saved', 'It can be styled with CSS and scripted via the DOM', 'It works in older browsers without polyfills', 'It is smaller in file size than external SVG'],
      answer: 1,
      explanation: 'Inline SVG is part of the DOM — you can apply CSS classes, change fill colors with currentColor, animate with JS, and query individual paths. An SVG loaded via <img> is isolated and opaque to the parent page\'s CSS and JS.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the key difference between the sandbox and allow attributes?',
      a: 'sandbox is a capability-restriction mechanism that defaults to deny-all — you start locked down and use tokens to re-enable specific things (scripts, forms, popups). allow implements Permissions Policy for browser APIs (camera, fullscreen, payment) — it only controls those APIs, not script execution. A fully sandboxed iframe with allow="camera" still cannot run scripts unless you also add allow-scripts to sandbox.',
    },
    {
      q: 'How does CSP frame-ancestors differ from X-Frame-Options?',
      a: 'X-Frame-Options is a legacy single-value header — DENY, SAMEORIGIN, or ALLOW-FROM with exactly one URI. It cannot handle multiple allowed origins and ALLOW-FROM is no longer supported in modern browsers. CSP frame-ancestors supports multiple origins (frame-ancestors \'self\' https://a.com https://b.com), wildcards, and is the actively maintained standard. When both are present, frame-ancestors takes precedence in browsers that support it.',
    },
    {
      q: 'When should you use <object> instead of <iframe> for embedding a PDF?',
      a: '<object> is useful when you want inline fallback content — anything placed between its opening and closing tags is shown if the browser cannot render the data type. This lets you provide a "Download the PDF" link without JavaScript. <iframe> with a PDF src also works but offers no native fallback. For modern browsers both are equivalent; for maximum compatibility, <object> with a download fallback is the more resilient pattern.',
    },
    {
      q: 'Why is combining allow-scripts and allow-same-origin in sandbox dangerous?',
      a: 'A sandboxed iframe with both tokens can run JavaScript that has same-origin access to the parent DOM. That script can call window.parent.document.querySelector("iframe").removeAttribute("sandbox"), removing the sandbox at runtime and escaping all restrictions. This effectively defeats the purpose of sandboxing. If you need same-origin content with scripts, skip sandbox entirely and use CSP and CORS instead.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'iframes embed foreign documents in isolated browsing contexts — sandbox restricts capabilities, allow controls browser APIs, and CSP frame-ancestors prevents clickjacking.',
    mustKnow: [
      'sandbox="" (empty) = deny-all; each token re-enables one capability — allow-scripts, allow-forms, allow-popups, allow-same-origin',
      'Never combine allow-scripts + allow-same-origin — a script can remove its own sandbox attribute',
      'allow attribute uses semicolons as separators — commas silently break the entire attribute',
      'CSP frame-ancestors supersedes X-Frame-Options and supports multiple origins',
      'Always add title to iframes for screen reader accessibility',
      'loading="lazy" defers off-screen iframes — set explicit width/height to prevent CLS',
    ],
    interviewFocus: [
      'What is a clickjacking attack and how do frame-ancestors and X-Frame-Options prevent it?',
      'Explain the difference between the sandbox and allow attributes on an iframe.',
      'Why is the combination of allow-scripts and allow-same-origin in sandbox a security anti-pattern?',
      'When would you use <object> over <iframe> for embedding content?',
    ],
  };
}
