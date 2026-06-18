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
  selector: 'app-html-performance',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './performance.html',
  styleUrl: './performance.scss',
})
export class HtmlPerformance {
  quickRef: QuickRefItem[] = [
    { name: "loading=lazy", type: "syntax", desc: "Native browser attribute for images/iframes to defer loading until near the viewport." },
    { name: "fetchpriority", type: "syntax", desc: "Hints the browser about the priority of a resource (high, low, auto). Crucial for LCP." },
    { name: "preload", type: "directive", desc: "Instructs the browser to fetch a resource immediately with high priority for current page." },
    { name: "prefetch", type: "directive", desc: "Hints that the resource might be needed in the future (e.g., next page load)." },
    { name: "dns-prefetch", type: "directive", desc: "Performs DNS resolution for an external domain early to save time later." },
    { name: "preconnect", type: "directive", desc: "Establishes early connection (DNS + TCP/TLS) to a critical origin." },
    { name: "defer", type: "syntax", desc: "Downloads script asynchronously but executes after HTML parsing, preserving order." },
    { name: "async", type: "syntax", desc: "Downloads and executes script immediately as soon as available, ignoring order." },
    { name: "rel=modulepreload", type: "directive", desc: "Preloads ES modules with high priority and ensures they execute in correct order." },
    { name: "content-visibility", type: "accessor", desc: "CSS property to skip rendering of off-screen elements, improving initial paint time." }
  ];

  theory: TheoryPoint[] = [
    {
      heading: "Critical Rendering Path",
      points: [
        "The browser parses HTML to build the DOM and CSSOM.",
        "Render Tree is created by combining DOM and CSSOM.",
        "Layout calculates geometry (position/size) of elements.",
        "Paint fills in pixels, followed by Composite for layers."
      ]
    },
    {
      heading: "Resource Hints: preload/prefetch/preconnect/dns-prefetch",
      points: [
        "preload fetches resources needed immediately with high priority.",
        "prefetch fetches resources likely needed in the near future.",
        "preconnect establishes early connection to critical origins.",
        "dns-prefetch resolves DNS for external domains early."
      ]
    },
    {
      heading: "Script loading: defer vs async vs module",
      points: [
        "defer downloads in background and executes after HTML parsing.",
        "async downloads and executes immediately, breaking order.",
        "modulepreload ensures ES modules are fetched early.",
        "Scripts without attributes block parsing until downloaded."
      ]
    },
    {
      heading: "Image optimisation: lazy loading, fetchpriority, srcset",
      points: [
        "loading=lazy defers off-screen images to save bandwidth.",
        "fetchpriority=high ensures LCP image loads first.",
        "srcset provides multiple resolutions for different devices.",
        "WebP/AVIF formats reduce file size compared to PNG/JPEG."
      ]
    },
    {
      heading: "Render-blocking resources and how to eliminate them",
      points: [
        "CSS in head is render-blocking by default.",
        "JS in head blocks parsing unless async or defer is used.",
        "Move non-critical CSS to the bottom or use media queries.",
        "Inline critical CSS for above-the-fold content."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: "Resource hints in head",
      language: "html",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resource Hints Example</title>

  <!-- Preload critical font -->
  <link rel="preload" href="/fonts/critical-font.woff2" as="font" type="font/woff2" crossorigin>

  <!-- Preconnect to API origin -->
  <link rel="preconnect" href="https://api.example.com">

  <!-- DNS Prefetch for analytics -->
  <link rel="dns-prefetch" href="https://analytics.example.com">

  <!-- Prefetch next page resource -->
  <link rel="prefetch" href="/next-page-data.json">

  <!-- Preload critical image -->
  <link rel="preload" href="/hero.jpg" as="image">

  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`
    },
    {
      label: "Image lazy loading + fetchpriority",
      language: "html",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Image Optimization</title>
</head>
<body>
  <!-- LCP Image: High priority, not lazy -->
  <img src="hero.jpg" 
       alt="Hero Banner" 
       fetchpriority="high" 
       width="1200" 
       height="630">

  <!-- Below fold images: Lazy loaded -->
  <img src="product1.jpg" 
       alt="Product 1" 
       loading="lazy" 
       width="400" 
       height="400">

  <img src="product2.jpg" 
       alt="Product 2" 
       loading="lazy" 
       width="400" 
       height="400">

  <!-- Responsive image with srcset -->
  <picture>
    <source srcset="photo.webp" type="image/webp">
    <img src="photo.jpg" alt="Responsive Photo" loading="lazy">
  </picture>
</body>
</html>`
    },
    {
      label: "Eliminating render-blocking CSS/JS",
      language: "html",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>No Render Blocking</title>

  <!-- Inline Critical CSS -->
  <style>
    .hero { background: blue; color: white; }
    .nav { position: fixed; top: 0; }
  </style>

  <!-- Async non-critical JS -->
  <script src="analytics.js" async></script>

  <!-- Defer critical but non-UI JS -->
  <script src="app.js" defer></script>

  <!-- Link to non-critical CSS with media query trick -->
  <link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'">
</head>
<body>
  <nav class="nav">Menu</nav>
  <div class="hero">Hero Content</div>
  <script>
    // Fallback if CSS fails to load
    var link = document.querySelector('link[rel="stylesheet"][media="print"]');
    if (link && link.media !== 'all') {
      link.onload = function() { this.media = 'all'; };
    }
  </script>
</body>
</html>`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: "Preloading Everything",
      wrong: "<link rel='preload' href='/all-resources.css'>",
      right: "<link rel='preload' href='/critical.css'>",
      explanation: "Preloading non-critical resources wastes bandwidth and delays critical content."
    },
    {
      title: "Using Async on Critical Scripts",
      wrong: "<script src='app.js' async></script>",
      right: "<script src='app.js' defer></script>",
      explanation: "Async scripts execute immediately, potentially breaking dependencies and execution order."
    },
    {
      title: "Missing fetchpriority on LCP Image",
      wrong: "<img src='hero.jpg'>",
      right: "<img src='hero.jpg' fetchpriority='high'>",
      explanation: "Without high priority, the LCP image may load late, hurting Core Web Vitals."
    },
    {
      title: "Forgetting crossorigin on Font Preloads",
      wrong: "<link rel='preload' href='font.woff2' as='font'>",
      right: "<link rel='preload' href='font.woff2' as='font' crossorigin>",
      explanation: "Fonts require CORS headers; missing this attribute causes the browser to ignore the preload."
    },
    {
      title: "Blocking JS in Head Without Defer",
      wrong: "<script src='app.js'></script>",
      right: "<script src='app.js' defer></script>",
      explanation: "Scripts without async/defer block HTML parsing, delaying the first paint."
    }
  ];

  challenge: Challenge = {
    title: "Audit and Optimize HTML Performance",
    language: "html",
    description: "Take a slow-loading HTML page. Add resource hints for fonts/APIs, optimize images with lazy loading and fetchpriority, and ensure scripts do not block rendering.",
    hints: [
      "Use preload for the LCP image and critical font.",
      "Add defer to all non-critical scripts in the head.",
      "Use loading=lazy for images below the fold."
    ],
    starterCode: `<!DOCTYPE html>
<html>
<head>
  <script src="app.js"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <img src="hero.jpg">
  <img src="footer.jpg">
</body>
</html>`,
    solution: `<!DOCTYPE html>
<html>
<head>
  <link rel="preload" href="hero.jpg" as="image" fetchpriority="high">
  <script src="app.js" defer></script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <img src="hero.jpg" fetchpriority="high">
  <img src="footer.jpg" loading="lazy">
</body>
</html>`
  };

  quiz: QuizQuestion[] = [
    {
      q: "Which attribute defers script execution until after HTML parsing?",
      options: ["async", "defer", "preload", "module"],
      answer: 1,
      explanation: "Defer ensures scripts execute in order after the document is parsed."
    },
    {
      q: "What is the primary purpose of fetchpriority='high'?",
      options: ["To compress the image", "To prioritize LCP resource loading", "To cache the resource", "To disable lazy loading"],
      answer: 1,
      explanation: "It tells the browser to prioritize fetching this resource for the Largest Contentful Paint."
    },
    {
      q: "Which hint establishes an early connection to a domain?",
      options: ["dns-prefetch", "prefetch", "preconnect", "preload"],
      answer: 2,
      explanation: "Preconnect performs DNS, TCP, and TLS handshakes early."
    },
    {
      q: "What happens if you use async on a script with dependencies?",
      options: ["It waits for DOMContentLoaded", "It breaks execution order", "It preloads the script", "It ignores the script"],
      answer: 1,
      explanation: "Async scripts execute as soon as they are downloaded, potentially before their dependencies."
    },
    {
      q: "Which CSS property skips rendering of off-screen elements?",
      options: ["display: none", "visibility: hidden", "content-visibility: auto", "opacity: 0"],
      answer: 2,
      explanation: "Content-visibility: auto allows the browser to skip layout and paint for off-screen content."
    }
  ];

  qna: QnaItem[] = [
    {
      q: "Why is fetchpriority='high' important for LCP images?",
      a: "It ensures the browser prioritizes fetching the Largest Contentful Paint image, improving perceived load time and Core Web Vitals."
    },
    {
      q: "What is the difference between preload and prefetch?",
      a: "Preload fetches the resource immediately for the current page; prefetch fetches it in idle time for a future page. Preloading non-critical resources wastes bandwidth."
    },
    {
      q: "Why does async break script ordering?",
      a: "async scripts download in parallel and execute as soon as they finish, regardless of document position. This breaks execution order and causes race conditions when later scripts depend on earlier ones."
    },
    {
      q: "What is content-visibility: auto?",
      a: "It instructs the browser to skip rendering off-screen elements and their descendants until they scroll into view. This reduces initial layout, style, and paint work — significantly improving LCP and page load time for long pages."
    }
  ];

  revision: RevisionSummary = {
    oneLiner: "Speed up pages by eliminating render-blocking resources, lazy-loading images, using resource hints (preload/prefetch/preconnect), and deferring non-critical scripts.",
    mustKnow: [
      "Critical Rendering Path: HTML parse → DOM → CSSOM → Render Tree → Layout → Paint — blocking resources in this chain delay First Paint",
      "preload: fetch now for current page (LCP image, critical font); prefetch: fetch idle for next page navigation",
      "preconnect: establish TCP+TLS early for third-party origins; dns-prefetch: resolve DNS only (lighter)",
      "defer: scripts run after HTML parsed, in order; async: runs as soon as downloaded, unordered — do not use async on scripts with dependencies",
      "loading=lazy on images defers fetch until near the viewport; fetchpriority=high on the LCP image boosts its queue priority",
      "Render-blocking CSS: inline critical CSS in <style>, load rest async; render-blocking JS: always defer or move to bottom"
    ],
    interviewFocus: [
      "Difference between preload and prefetch — give a concrete use case for each",
      "When to use defer vs async — and why async can break script-dependent code",
      "How fetchpriority=high improves Core Web Vitals (LCP)",
      "What content-visibility: auto does and when to apply it"
    ]
  };
}
