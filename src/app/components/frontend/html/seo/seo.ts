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
  selector: 'app-html-seo',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './seo.html',
  styleUrl: './seo.scss',
})
export class HtmlSeo {
  quickRef: QuickRefItem[] = [
    { name: "meta description", type: "syntax", desc: "Provides a concise summary of the page content for search engine results pages (SERPs)." },
    { name: "canonical link", type: "syntax", desc: "Specifies the preferred version of a page to prevent duplicate content issues." },
    { name: "robots meta", type: "directive", desc: "Controls how search engines index and follow links on a specific page." },
    { name: "JSON-LD script", type: "syntax", desc: "The recommended format for structured data, embedded directly in the head or body." },
    { name: "og:title/image", type: "accessor", desc: "Open Graph tags that control how content appears when shared on social media platforms." },
    { name: "hreflang", type: "syntax", desc: "Specifies the language and geographical targeting of a page for international audiences." },
    { name: "sitemap.xml", type: "syntax", desc: "An XML file that lists URLs for a site to allow search engines to crawl them efficiently." },
    { name: "Core Web Vitals", type: "keyword", desc: "A set of metrics (LCP, CLS, INP) measuring user experience and page performance." },
    { name: "title tag", type: "syntax", desc: "The primary headline for a page in search results; critical for relevance and click-through rates." },
    { name: "alt text", type: "keyword", desc: "Descriptive text for images, improving accessibility and providing context to crawlers." }
  ];

  theory: TheoryPoint[] = [
    {
      heading: "Title and Meta Description Best Practices",
      points: [
        "Keep title tags between 50-60 characters to avoid truncation in SERPs.",
        "Include primary keywords near the beginning of the title tag for better relevance signaling.",
        "Write unique meta descriptions for every page, aiming for 150-160 characters.",
        "Use compelling call-to-action language in meta descriptions to improve click-through rates.",
        "Avoid keyword stuffing; focus on natural language that matches user intent."
      ]
    },
    {
      heading: "Structured Data with JSON-LD and Schema.org",
      points: [
        "JSON-LD is the preferred format for structured data as it keeps HTML clean and easy to maintain.",
        "Use Schema.org vocabulary to define entities like Article, Product, or Event clearly.",
        "Validate structured data using Google's Rich Results Test before deployment.",
        "Include essential properties like headline, image, datePublished, and author for articles.",
        "Structured data helps search engines understand context, potentially enabling rich snippets."
      ]
    },
    {
      heading: "Open Graph and Twitter Card Meta Tags",
      points: [
        "Open Graph tags (og:) control how content appears when shared on Facebook, LinkedIn, etc.",
        "Twitter Cards use similar syntax but require specific meta tags like twitter:card.",
        "Always include og:image with a minimum resolution of 1200x630 pixels for optimal display.",
        "Use og:url to specify the canonical URL for the shared content.",
        "Test social previews using Facebook Sharing Debugger and Twitter Card Validator."
      ]
    },
    {
      heading: "Canonical URLs and Hreflang for International Sites",
      points: [
        "Use rel='canonical' to point duplicate or similar pages to the preferred version.",
        "Implement hreflang tags to tell search engines which language/region a page targets.",
        "Ensure hreflang annotations are bidirectional; if A links to B, B must link back to A.",
        "Use x-default for hreflang to handle users whose language isn't specifically targeted.",
        "Canonical and hreflang work together but serve different purposes: duplication vs. localization."
      ]
    },
    {
      heading: "Core Web Vitals: LCP/CLS/INP and Their HTML Impact",
      points: [
        "Largest Contentful Paint (LCP) measures loading performance; optimize large images and scripts.",
        "Cumulative Layout Shift (CLS) measures visual stability; always define width and height for media.",
        "Interaction to Next Paint (INP) measures responsiveness; minimize main-thread blocking code.",
        "Use <link rel='preload'> for critical resources like fonts and above-the-fold images.",
        "Avoid inserting content above existing content without user interaction to prevent CLS spikes."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: "Complete SEO Head Section",
      language: "html",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary SEO Tags -->
  <title>Angular HTML SEO Best Practices | TechGuide</title>
  <meta name="description" content="Learn how to optimize your Angular application for search engines using HTML meta tags, structured data, and performance techniques.">
  <link rel="canonical" href="https://example.com/angular-seo-guide">
  
  <!-- Robots Directive -->
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph Tags -->
  <meta property="og:title" content="Angular HTML SEO Best Practices">
  <meta property="og:description" content="Comprehensive guide to optimizing Angular apps for SEO.">
  <meta property="og:image" content="https://example.com/images/seo-guide.jpg">
  <meta property="og:url" content="https://example.com/angular-seo-guide">
  <meta property="og:type" content="article">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Angular HTML SEO Best Practices">
  <meta name="twitter:description" content="Comprehensive guide to optimizing Angular apps for SEO.">
  <meta name="twitter:image" content="https://example.com/images/seo-guide.jpg">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon.png">
</head>
<body>
  <app-root></app-root>
</body>
</html>`
    },
    {
      label: "JSON-LD Article Structured Data",
      language: "html",
      code: `<!-- Place this in the head or body -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Angular HTML SEO Best Practices",
  "image": [
    "https://example.com/images/seo-guide.jpg"
  ],
  "datePublished": "2023-10-01T08:00:00+08:00",
  "dateModified": "2023-10-02T09:00:00+08:00",
  "author": [{
    "@type": "Person",
    "name": "Jane Doe"
  }],
  "publisher": {
    "@type": "Organization",
    "name": "TechGuide",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "description": "A comprehensive guide to optimizing Angular applications for search engines.",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/angular-seo-guide"
  }
}
</script>`
    },
    {
      label: "Open Graph + Twitter Card Tags",
      language: "html",
      code: `<!-- Open Graph Protocol -->
<meta property="og:title" content="My Awesome Product Page">
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.com/product/123">
<meta property="og:image" content="https://example.com/images/product-123.jpg">
<meta property="og:description" content="Discover the features of our latest product.">
<meta property="og:site_name" content="Example Store">
<meta property="og:locale" content="en_US">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@examplestore">
<meta name="twitter:creator" content="@jane_doe">
<meta name="twitter:title" content="My Awesome Product Page">
<meta name="twitter:description" content="Discover the features of our latest product.">
<meta name="twitter:image" content="https://example.com/images/product-123.jpg">
<meta name="twitter:image:alt" content="Product 123 Image">`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: "Duplicate Title Tags",
      wrong: "<title>Home - My Site</title>\n<title>Home - My Site</title>",
      right: "<title>Home - My Site</title>",
      explanation: "Having multiple title tags confuses search engines. Only one <title> tag should exist per page."
    },
    {
      title: "Missing Canonical Causing Duplicate Content",
      wrong: "<!-- No canonical tag -->\nURL: /product?id=123\nURL: /product/123",
      right: '<link rel="canonical" href="https://example.com/product/123">',
      explanation: "Without a canonical tag, search engines may treat different URLs as separate pages, splitting ranking power."
    },
    {
      title: "OG Image Too Small",
      wrong: '<meta property="og:image" content="https://example.com/thumb.jpg">',
      right: '<meta property="og:image" content="https://example.com/large-1200x630.jpg">',
      explanation: "Facebook and other platforms require a minimum image size (usually 1200x630) for full-size previews."
    },
    {
      title: "JSON-LD Errors Wrong Type",
      wrong: '<script type="application/ld+json">\n{\n  "@type": "Product"\n}\n</script>',
      right: '<script type="application/ld+json">\n{\n  "@type": "Article",\n  "headline": "..."\n}\n</script>',
      explanation: "Using the wrong @type (e.g., Product for an Article) prevents rich results and may cause validation errors."
    },
    {
      title: "Forgetting Hreflang X-Default",
      wrong: '<link rel="alternate" hreflang="en" href="https://example.com/en/">',
      right: '<link rel="alternate" hreflang="x-default" href="https://example.com/">',
      explanation: "Without x-default, users whose language isn't targeted may see a 404 or irrelevant content."
    }
  ];

  challenge: Challenge = {
    title: "Add All Required SEO Meta Tags",
    language: "html",
    description: "Given a bare HTML page, add all critical meta tags for SEO including title, description, canonical, robots, Open Graph, and Twitter Cards.",
    hints: [
      "Ensure the <title> tag is unique and descriptive.",
      "Add a <meta name='description'> with relevant keywords.",
      "Include <link rel='canonical'> to point to the preferred URL.",
      "Add og:title, og:image, og:url for social sharing.",
      "Add twitter:card and related tags for Twitter previews."
    ],
    starterCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bare Page</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,
    solution: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Essential SEO -->
  <title>Hello World - My Site</title>
  <meta name="description" content="A simple hello world page optimized for search engines.">
  <link rel="canonical" href="https://example.com/hello-world">
  <meta name="robots" content="index, follow">

  <!-- Open Graph -->
  <meta property="og:title" content="Hello World - My Site">
  <meta property="og:description" content="A simple hello world page.">
  <meta property="og:image" content="https://example.com/og.jpg">
  <meta property="og:url" content="https://example.com/hello-world">
  <meta property="og:type" content="article">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Hello World - My Site">

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Hello World",
    "author": { "@type": "Person", "name": "Author" },
    "datePublished": "2024-01-01"
  }
  </script>
</head>
<body>
  <h1>Hello World</h1>
  <p>An SEO-optimised page.</p>
</body>
</html>`
  };

  quiz: QuizQuestion[] = [
    { q: "Which tag tells search engines not to index a page?", options: ["<meta name=\"robots\" content=\"nofollow\">", "<meta name=\"robots\" content=\"noindex\">", "<meta name=\"googlebot\" content=\"none\">", "<link rel=\"noindex\">"], answer: 1, explanation: "noindex in the robots meta tag prevents search engines from including the page in their index." },
    { q: "What is the minimum recommended og:image size for a full social preview?", options: ["600x315 px", "800x400 px", "1200x630 px", "1920x1080 px"], answer: 2, explanation: "Facebook and Twitter both recommend at least 1200x630 px for a full-width link preview card." },
    { q: "What does a canonical link element do?", options: ["Redirects the user to the canonical URL", "Tells crawlers which URL is the preferred version of duplicate content", "Blocks crawlers from following links", "Sets the base URL for all relative links"], answer: 1, explanation: "rel=canonical consolidates link equity from duplicate URLs to the preferred version, avoiding duplicate content penalties." },
    { q: "Which format does Google recommend for structured data?", options: ["Microdata", "RDFa", "JSON-LD", "Open Graph"], answer: 2, explanation: "Google recommends JSON-LD because it can be placed anywhere in the page and does not require mixing data into HTML markup." },
    { q: "What does hreflang x-default signal to search engines?", options: ["The page has no language", "The fallback URL for users who do not match any specific hreflang", "The default stylesheet language", "The canonical URL for all languages"], answer: 1, explanation: "x-default is the catch-all URL shown to users whose locale does not match any specific hreflang tag." }
  ];

  qna: QnaItem[] = [
    { q: "What is the difference between canonical and robots noindex?", a: "canonical tells search engines which URL is the preferred version of content that appears at multiple URLs — the page is still indexed, just consolidated. noindex prevents the page from being indexed entirely. Use canonical for duplicates; use noindex for private or low-value pages." },
    { q: "Why is JSON-LD preferred over microdata for structured data?", a: "JSON-LD lives in a <script> tag and does not require weaving attributes into HTML markup, making it easier to add and maintain. Microdata requires adding itemscope/itemprop attributes directly to HTML elements. Google recommends JSON-LD." },
    { q: "How does CLS affect SEO?", a: "Cumulative Layout Shift is a Core Web Vital. Google uses CWV as a ranking signal — a poor CLS score (above 0.1) hurts rankings. Reserve space for images and ads with explicit width/height or CSS aspect-ratio to prevent layout shifts." },
    { q: "What is hreflang and when do you need it?", a: "hreflang tells search engines which language/region version of a page to show to users. Use it when you have the same content in multiple languages or serve region-specific variants (e.g. en-US vs en-GB). Always include a self-referential hreflang and an x-default fallback." }
  ];

  revision: RevisionSummary = {
    oneLiner: "HTML SEO centres on accurate title/description tags, structured JSON-LD data, Open Graph social tags, canonical URLs, and optimising Core Web Vitals.",
    mustKnow: [
      "Title tag: unique per page, 50-60 chars — the primary on-page SEO signal",
      "Meta description: 150-160 chars, not a ranking factor but drives click-through rate",
      "JSON-LD structured data enables rich results in search (FAQ, Article, Product, BreadcrumbList)",
      "Canonical link consolidates duplicate-URL link equity to the preferred version",
      "Open Graph (og:*) controls how pages appear in social previews — og:image needs 1200x630 px minimum",
      "Core Web Vitals (LCP, CLS, INP) are ranking signals — LCP and CLS have the most HTML impact"
    ],
    interviewFocus: [
      "When to use canonical vs noindex — and what happens if you use both",
      "What JSON-LD structured data enables in search results",
      "How hreflang works and what x-default means",
      "How CLS is caused by HTML/CSS choices and how to fix it"
    ]
  };
}
