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
  selector: 'app-html-head-metadata',
  standalone: true,
  imports: [
    CommonModule,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent,
  ],
  templateUrl: './head-metadata.html',
  styleUrl: './head-metadata.scss',
})
export class HtmlHeadMetadata {

  quickRef: QuickRefItem[] = [
    { name: '<meta charset>', type: 'syntax', desc: 'Defines the character encoding for the document — must be within the first 1024 bytes.' },
    { name: '<meta name="viewport">', type: 'syntax', desc: 'Controls layout on mobile browsers — width=device-width, initial-scale=1.' },
    { name: '<title>', type: 'keyword', desc: 'Sets the browser tab title and SEO headline — keep to 50–60 characters.' },
    { name: '<link rel="canonical">', type: 'syntax', desc: 'Points search engines to the preferred URL when duplicate content exists.' },
    { name: 'og:title', type: 'keyword', desc: 'Open Graph title shown in social media link previews.' },
    { name: 'og:image', type: 'keyword', desc: 'Thumbnail for social previews — use 1200×630 px for best results.' },
    { name: '<link rel="preload">', type: 'syntax', desc: 'Tells the browser to fetch a critical resource early — requires the as= attribute.' },
    { name: '<meta name="theme-color">', type: 'syntax', desc: 'Sets mobile browser chrome color to match the site brand.' },
    { name: '<meta name="robots">', type: 'syntax', desc: 'Controls search-engine indexing — noindex, nofollow, noarchive, nosnippet.' },
    { name: '<link rel="icon">', type: 'syntax', desc: 'Declares the favicon — SVG scales best; provide ICO/PNG fallbacks for older browsers.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Charset and Viewport Meta',
      points: [
        'The <meta charset="UTF-8"> tag must appear within the first 1024 bytes of the document so the browser decodes the rest of the HTML correctly before encountering any character data.',
        'UTF-8 encodes all Unicode characters and is the universal standard — legacy encodings like ISO-8859-1 only cover Western European characters and cause mojibake on international content.',
        'The viewport meta tag is the single most important tag for mobile responsiveness; without it, mobile browsers render at desktop width (~980 px) then scale down.',
        'width=device-width tells the browser the viewport should match the physical device width — the foundation of every responsive layout.',
        'initial-scale=1.0 prevents iOS Safari from zooming in on page load; user-scalable=no is an accessibility anti-pattern and should be avoided.',
      ],
    },
    {
      heading: 'SEO Meta Tags',
      points: [
        'The <title> tag is the single most important on-page SEO signal — Google truncates titles beyond ~60 characters in search results, so keep them concise and front-loaded with keywords.',
        'Meta descriptions should be around 155 characters; they do not directly influence ranking but a compelling description improves click-through rate from search results.',
        'The robots meta tag accepts comma-separated directives: noindex prevents the page from appearing in search results; nofollow stops link equity from passing to outbound links.',
        'noarchive suppresses the "Cached" link in search results; nosnippet prevents Google from showing a text snippet or thumbnail from the page.',
        'For pages you want indexed, robots defaults to "index, follow" — you only need the tag when overriding that default behavior.',
      ],
    },
    {
      heading: 'Open Graph Protocol',
      points: [
        'Open Graph tags (og:*) control how a page looks when shared on Facebook, LinkedIn, Slack, and other platforms that consume OG metadata.',
        'The minimum required set is og:title, og:description, og:image, og:url, and og:type — missing any of these causes platforms to fall back to guessing or show a blank preview.',
        'og:image should be at least 1200×630 px for high-DPI displays; images smaller than 200×200 px may be rejected by some platforms entirely.',
        'og:type defaults to "website"; use "article" for blog posts to unlock Article-specific properties like published_time and author.',
        'Twitter Cards share the og:* properties as fallback but adds twitter:card (summary, summary_large_image, app, player) for platform-specific control.',
      ],
    },
    {
      heading: 'Link Rel: Canonical, Preload, Prefetch, DNS-Prefetch',
      points: [
        'rel="canonical" solves the duplicate content problem — when the same content is accessible at multiple URLs (http vs https, trailing slash, query strings), canonical tells Google which is the master version.',
        'rel="preload" forces the browser to fetch a resource at high priority before the parser would normally discover it — always include the as= attribute (font, script, style, image) or the browser ignores the hint.',
        'crossorigin attribute is required on font preloads — without it, the browser fetches the font twice (once for the preload, once when CSS uses it).',
        'rel="prefetch" is a low-priority hint for resources needed on the next navigation — ideal for the top search result or the next page in a wizard flow.',
        'rel="dns-prefetch" resolves domain names early for third-party origins (analytics, CDNs, fonts); rel="preconnect" goes further and also establishes the TCP + TLS handshake.',
      ],
    },
    {
      heading: 'Favicon and Theme Color',
      points: [
        'A modern favicon setup uses an SVG as the primary icon (scales to any size, supports dark mode via prefers-color-scheme inside the SVG) with ICO as a fallback for older browsers.',
        'The sizes attribute on <link rel="icon"> declares the resolution — browsers pick the closest match; 16×16 and 32×32 PNG are the minimum pair for desktop coverage.',
        'apple-touch-icon at 180×180 px is used when a user adds the site to their iOS home screen — Android uses the manifest icons instead.',
        'theme-color sets the mobile browser address bar and OS task-switcher color — use your primary brand color for an immersive feel on Chrome for Android.',
        'The Web App Manifest (manifest.json, linked via <link rel="manifest">) extends favicon and theme-color with PWA-specific fields like name, icons array, and display mode.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Essential head setup',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- 1. Character encoding — MUST be first, within the first 1024 bytes -->
  <meta charset="UTF-8">

  <!-- 2. Viewport — required for responsive design -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- 3. Page title — 50-60 chars, front-load keywords -->
  <title>Learn HTML Head Tags | DevHub</title>

  <!-- 4. SEO meta -->
  <meta name="description" content="Master HTML head tags: charset, viewport, SEO meta, Open Graph, and resource hints. Practical examples for every developer.">
  <meta name="robots" content="index, follow">

  <!-- 5. Canonical URL — always use absolute URL -->
  <link rel="canonical" href="https://devhub.example.com/html/head-metadata">

  <!-- 6. Favicon — SVG scales to any size; ICO fallback for IE/old browsers -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">

  <!-- 7. Apple touch icon for iOS home screen -->
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

  <!-- 8. Theme color — mobile browser chrome -->
  <meta name="theme-color" content="#e34c26">

  <!-- 9. PWA manifest -->
  <link rel="manifest" href="/manifest.json">

  <!-- 10. Stylesheet -->
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <h1>HTML Head & Metadata</h1>
</body>
</html>`,
    },
    {
      label: 'Open Graph & Twitter Cards',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Understanding Open Graph Tags | DevHub</title>

  <!-- ── Open Graph (Facebook, LinkedIn, Slack, WhatsApp) ── -->
  <!-- Minimum required set: type, url, title, description, image -->
  <meta property="og:type"        content="article">
  <meta property="og:url"         content="https://devhub.example.com/html/head-metadata">
  <meta property="og:title"       content="Understanding Open Graph Tags">
  <meta property="og:description" content="Learn how to craft perfect social media previews with og:* meta tags.">
  <!-- Image: minimum 1200×630 px; JPEG or PNG; max 8 MB -->
  <meta property="og:image"       content="https://devhub.example.com/og/head-metadata.jpg">
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt"    content="HTML head tag diagram showing key meta elements">
  <!-- Article-specific OG fields -->
  <meta property="article:published_time" content="2026-01-15T08:00:00Z">
  <meta property="article:author"         content="https://devhub.example.com/authors/john">

  <!-- ── Twitter / X Cards ── -->
  <!-- twitter:* falls back to og:* when not set, so only override differences -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:site"        content="@devhub">
  <meta name="twitter:creator"     content="@johndev">
  <!-- twitter:title / description / image fall back to og:* if omitted -->
</head>
<body>
  <article>
    <h1>Understanding Open Graph Tags</h1>
    <p>Share this page to see the custom preview card on social platforms.</p>
  </article>
</body>
</html>`,
    },
    {
      label: 'Resource hints & preload',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance-Optimised Page | DevHub</title>

  <!-- ── 1. DNS-prefetch: resolve third-party domains early (cheapest hint) -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="https://analytics.example.com">

  <!-- ── 2. Preconnect: DNS + TCP + TLS for critical third parties -->
  <!-- Use sparingly — each open connection consumes browser resources -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- ── 3. Preload: fetch critical resources at HIGH priority -->
  <!-- Font: crossorigin is REQUIRED even for same-origin fonts -->
  <link rel="preload" href="/fonts/inter-v13-latin-regular.woff2"
        as="font" type="font/woff2" crossorigin>

  <!-- Critical above-the-fold CSS -->
  <link rel="preload" href="/styles/critical.css" as="style">

  <!-- Hero image visible on first paint -->
  <link rel="preload" href="/images/hero.webp" as="image">

  <!-- ── 4. Modulepreload: preload ES module + its static imports -->
  <link rel="modulepreload" href="/js/app.js">

  <!-- ── 5. Prefetch: fetch next-navigation resources at LOW priority -->
  <!-- Browser fetches this when idle — useful for paginated content -->
  <link rel="prefetch" href="/html/forms" as="document">

  <!-- ── 6. Apply the actual stylesheets after preloads ── -->
  <link rel="stylesheet" href="/styles/critical.css">
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <img src="/images/hero.webp" alt="Hero image" width="1200" height="600">
  <script type="module" src="/js/app.js"></script>
</body>
</html>`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Charset not first in <head>',
      wrong: `<head>
  <link rel="stylesheet" href="style.css">
  <meta charset="UTF-8">
</head>`,
      right: `<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="style.css">
</head>`,
      explanation: 'The charset declaration must appear within the first 1024 bytes of the document. Placing CSS or other tags before it can cause the browser to begin parsing with the wrong encoding, corrupting any special characters that appear early in the document.',
    },
    {
      title: 'Missing initial-scale on viewport',
      wrong: `<meta name="viewport" content="width=device-width">`,
      right: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
      explanation: 'Omitting initial-scale=1 causes iOS Safari to zoom in on the page when it first loads, making the layout appear larger than intended. Always include both width and initial-scale.',
    },
    {
      title: 'Relative URL in canonical link',
      wrong: `<link rel="canonical" href="/html/head-metadata">`,
      right: `<link rel="canonical" href="https://example.com/html/head-metadata">`,
      explanation: 'Canonical URLs must be absolute (including scheme and domain). A relative canonical is ambiguous — if the page is mirrored on multiple domains, a relative URL resolves differently on each, defeating the purpose of the canonical tag.',
    },
    {
      title: 'Preload without the as= attribute',
      wrong: `<link rel="preload" href="/fonts/inter.woff2">`,
      right: `<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>`,
      explanation: 'Without as=, the browser cannot determine the resource type, ignores the preload hint entirely, and logs a warning. Font preloads also require the crossorigin attribute — omitting it causes the font to be fetched twice.',
    },
    {
      title: 'Small og:image dimensions',
      wrong: `<meta property="og:image" content="thumbnail-200x200.jpg">`,
      right: `<meta property="og:image" content="social-preview-1200x630.jpg">`,
      explanation: 'Facebook and LinkedIn require og:image to be at least 200×200 px, but images below 600×314 px are shown as a small inline thumbnail rather than a large card. The ideal size is 1200×630 px (1.91:1 ratio) to render as a prominent summary_large_image card across all platforms.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a complete <head> for a blog post',
    language: 'html',
    description: 'Create a fully-optimised <head> section for a blog post page. Requirements: UTF-8 charset and responsive viewport, a descriptive title (under 60 chars), meta description (under 155 chars), robots index+follow, absolute canonical URL, complete Open Graph set (type=article, title, description, image at 1200x630), Twitter card (summary_large_image), SVG favicon with PNG fallback, theme-color, and a preload for a webfont with the correct as= and crossorigin attributes.',
    hints: [
      'Start with charset and viewport — they must come first',
      'og:url should match the canonical link href exactly',
      'Font preloads need both as="font" and crossorigin attributes',
      'twitter:card must be set before twitter:title for some parsers',
    ],
    starterCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Add your complete head tags here -->
  <title>My Blog Post</title>
</head>
<body>
  <article>
    <h1>My Blog Post</h1>
  </article>
</body>
</html>`,
    solution: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Why HTML Head Tags Matter for SEO | DevHub Blog</title>
  <meta name="description" content="A practical guide to HTML head tags: charset, viewport, Open Graph, resource hints, and favicon best practices.">
  <meta name="robots" content="index, follow">

  <link rel="canonical" href="https://devhub.example.com/blog/html-head-tags">

  <meta property="og:type"        content="article">
  <meta property="og:url"         content="https://devhub.example.com/blog/html-head-tags">
  <meta property="og:title"       content="Why HTML Head Tags Matter for SEO">
  <meta property="og:description" content="A practical guide to HTML head tags for every developer.">
  <meta property="og:image"       content="https://devhub.example.com/og/html-head-tags.jpg">
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="630">

  <meta name="twitter:card"    content="summary_large_image">
  <meta name="twitter:title"   content="Why HTML Head Tags Matter for SEO">
  <meta name="twitter:image"   content="https://devhub.example.com/og/html-head-tags.jpg">

  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">

  <meta name="theme-color" content="#e34c26">

  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <article>
    <h1>Why HTML Head Tags Matter for SEO</h1>
  </article>
</body>
</html>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the recommended character limit for a meta description?',
      options: ['100–120 characters', '150–160 characters', '200–250 characters', '50–60 characters'],
      answer: 1,
      explanation: 'Meta descriptions of around 155 characters are optimal — search engines truncate longer ones with an ellipsis, and very short ones miss the opportunity to describe the page.',
    },
    {
      q: 'Which attribute is required on a font <link rel="preload"> to prevent the font from being fetched twice?',
      options: ['type="font/woff2"', 'crossorigin', 'as="font"', 'fetchpriority="high"'],
      answer: 1,
      explanation: 'Without crossorigin, the browser treats the preloaded font as a different request from the one CSS triggers (because CSS font requests use CORS mode). The result is two network requests for the same file.',
    },
    {
      q: 'Which Open Graph tag defines whether the content is an article, video, or website?',
      options: ['og:title', 'og:image', 'og:url', 'og:type'],
      answer: 3,
      explanation: 'og:type categorises the content — "website" is the default, "article" unlocks extra properties like published_time. Social platforms use it to choose the right card template.',
    },
    {
      q: 'What is the correct order of the first two tags inside <head>?',
      options: [
        '<title> then <meta charset>',
        '<meta charset> then <meta name="viewport">',
        '<link rel="stylesheet"> then <meta charset>',
        '<meta name="viewport"> then <meta charset>',
      ],
      answer: 1,
      explanation: 'charset must come first (within the first 1024 bytes for correct encoding). viewport should immediately follow — both must precede any content that depends on them.',
    },
    {
      q: 'What does rel="dns-prefetch" do?',
      options: [
        'Fetches the full resource in advance',
        'Resolves the domain name early without opening a connection',
        'Establishes a TCP and TLS connection to the origin',
        'Preloads a stylesheet at high priority',
      ],
      answer: 1,
      explanation: 'dns-prefetch only performs DNS resolution — it finds the IP for a domain before it is needed. rel="preconnect" goes further and also does the TCP + TLS handshake, which is more expensive but saves more time.',
    },
    {
      q: 'What does the <meta name="robots"> tag control?',
      options: ['Robots.txt file content', 'How search engine crawlers index and follow links on the page', 'Automated test runner behavior', 'Bot-detection thresholds'],
      answer: 1,
      explanation: '<meta name="robots" content="noindex, nofollow"> tells crawlers not to index the page and not to follow its links. Common values: index/noindex (include in search results), follow/nofollow (follow links), noarchive (no cached version). Applies only to crawlers that respect the meta tag — use robots.txt for stronger crawl blocking.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why must charset appear within the first 1024 bytes?',
      a: 'Browsers start decoding the byte stream before the full document arrives. If the charset declaration comes after a large stylesheet link or script, the browser may have already misinterpreted multi-byte characters (especially non-ASCII ones) using its default guess. Placing charset first guarantees correct decoding from the very first character.',
    },
    {
      q: 'When should you use preload vs prefetch?',
      a: 'Use preload for resources the current page needs immediately — critical fonts, above-the-fold images, or render-blocking scripts. The browser fetches them at high priority, even before the parser would normally find them. Use prefetch for resources the next page will need — they are fetched at the lowest priority during idle time and stored in the cache for the subsequent navigation.',
    },
    {
      q: 'Does the meta description tag affect Google search ranking?',
      a: 'No — Google confirmed it does not use meta description as a ranking signal. Its value is entirely in click-through rate: a compelling description that matches the user\'s search intent makes them more likely to click your result over competitors. Google may also rewrite your description if it considers another excerpt from the page more relevant to the query.',
    },
    {
      q: 'What is the difference between rel="preconnect" and rel="dns-prefetch"?',
      a: 'dns-prefetch only resolves the IP address for a domain (DNS lookup). preconnect also establishes the full TCP connection and performs the TLS handshake — saving 100–500 ms per origin on first request. Use preconnect for origins you will definitely use (Google Fonts, your CDN); use dns-prefetch for origins that are possible but not certain, because each open preconnect consumes browser memory and bandwidth.',
    },
    {
      q: 'What is the purpose of the <link rel="manifest"> tag?',
      a: '<code>&lt;link rel="manifest" href="/manifest.json"&gt;</code> links the Web App Manifest — a JSON file that defines how the app appears when installed on a home screen (name, icons, start URL, display mode, theme color). Required for browsers to show the "Install App" prompt and for the app to appear as a standalone window without browser chrome. The manifest is a core PWA requirement.',
    },
    {
      q: 'How do you prevent a page from being rendered in an iframe (clickjacking protection)?',
      a: 'Two mechanisms: (1) <code>X-Frame-Options: DENY</code> HTTP header — legacy, browser-supported, simple. (2) <code>Content-Security-Policy: frame-ancestors \'none\'</code> — modern, more flexible, allows specifying trusted origins. CSP frame-ancestors supersedes X-Frame-Options in modern browsers. Never rely solely on meta tags — they are not processed in the right context to prevent framing.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The <head> element configures the browser, declares metadata for search engines and social platforms, and instructs the browser which resources to load and when.',
    mustKnow: [
      'charset must be the first tag in <head>, within the first 1024 bytes',
      'viewport with width=device-width, initial-scale=1 is required for responsive layouts',
      'Title: 50–60 chars; meta desc: ~155 chars — neither ranks, but both drive CTR',
      'Minimum Open Graph set: og:type, og:url, og:title, og:description, og:image (1200×630 px)',
      'rel="preload" + as= + crossorigin for fonts prevents double-fetch',
      'rel="canonical" must use an absolute URL to avoid cross-domain ambiguity',
    ],
    interviewFocus: [
      'What is the difference between rel="preload", rel="prefetch", and rel="preconnect"?',
      'Why does a font preload require the crossorigin attribute?',
      'How does rel="canonical" prevent duplicate content penalties?',
      'Which Open Graph tags are the minimum required set for a social preview card?',
    ],
  };
}
