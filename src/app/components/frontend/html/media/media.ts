import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';

@Component({
  selector: 'app-html-media',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    PageMetaComponent, PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent
  ],
  templateUrl: './media.html',
  styleUrl: './media.scss'
})
export class HtmlMedia {

  quickRef: QuickRefItem[] = [
    { name: '<img src alt>', type: 'keyword', desc: 'Embeds an image; alt is required — empty ("") for decorative images' },
    { name: 'loading="lazy"', type: 'keyword', desc: 'Defers off-screen image loading — easy performance win; add to all below-fold images' },
    { name: '<picture>', type: 'keyword', desc: 'Art direction: different images for different viewports or formats (AVIF/WebP fallback)' },
    { name: '<source srcset media>', type: 'keyword', desc: 'Child of picture/audio/video — provides alternative sources' },
    { name: 'srcset / sizes', type: 'keyword', desc: 'Responsive images: browser selects the best-fitting image width' },
    { name: '<video controls>', type: 'keyword', desc: 'Embeds a video with browser-native playback controls' },
    { name: '<audio controls>', type: 'keyword', desc: 'Embeds an audio player with native controls' },
    { name: 'preload="metadata"', type: 'keyword', desc: 'Loads only video metadata (duration, dimensions) on page load — not the full file' },
    { name: '<track kind="subtitles">', type: 'keyword', desc: 'Provides captions/subtitles for video — required for accessibility' },
    { name: '<iframe>', type: 'keyword', desc: 'Embeds an external page (YouTube, maps). Use sandbox attribute for untrusted content' },
    { name: '<svg>', type: 'keyword', desc: 'Inline scalable vector graphics — sharp at any size, styleable with CSS' },
    { name: 'width / height', type: 'keyword', desc: 'Set on img to prevent Cumulative Layout Shift (CLS) — always include both' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Images: alt text and performance',
      points: [
        'The <code>alt</code> attribute is mandatory on every <code>&lt;img&gt;</code>. For informative images, write a concise description of what the image communicates. For decorative images, use <code>alt=""</code> — an empty alt tells screen readers to skip the image entirely.',
        'Always set <code>width</code> and <code>height</code> attributes matching the image\'s intrinsic dimensions. The browser uses them to reserve space before the image loads, preventing Cumulative Layout Shift (CLS).',
        '<code>loading="lazy"</code> defers loading off-screen images until they are near the viewport. Add it to all below-fold images. Do NOT add it to above-the-fold or LCP images — it delays the largest visible element.',
        'Image formats: WebP is the modern default (smaller than JPEG/PNG at equal quality). AVIF is next-gen (30–50% smaller than WebP). Always provide a JPEG/PNG fallback via <code>&lt;picture&gt;</code>.',
      ]
    },
    {
      heading: 'Responsive images: srcset and picture',
      points: [
        '<code>srcset</code> on <code>&lt;img&gt;</code> lists candidate images at different widths: <code>srcset="img-400.jpg 400w, img-800.jpg 800w"</code>. The browser picks the best fit based on device pixel density and the sizes hint.',
        '<code>sizes</code> tells the browser what width the image will actually occupy at different viewport widths: <code>sizes="(max-width: 600px) 100vw, 50vw"</code>.',
        '<code>&lt;picture&gt;</code> enables art direction — serving a different crop for mobile vs desktop, or providing next-gen format (AVIF/WebP) with JPEG fallback. The browser uses the first matching <code>&lt;source&gt;</code>.',
        'The <code>&lt;img&gt;</code> inside <code>&lt;picture&gt;</code> is the fallback. It is always required and always provides the alt text.',
      ]
    },
    {
      heading: 'Video: controls, captions, and performance',
      points: [
        '<code>controls</code> adds the browser-native play/pause/volume UI. Without it, users cannot interact with the video (unless you build custom controls with JS).',
        '<code>preload="metadata"</code> — loads only duration and dimensions, not the media. Use for most hosted videos. <code>preload="none"</code> loads nothing until the user clicks play.',
        '<code>muted</code> + <code>autoplay</code> — browsers allow autoplay only when the video is muted. Required combination for background/hero videos. Add <code>loop</code> and <code>playsinline</code> for looping hero videos on mobile.',
        '<code>&lt;track kind="subtitles" src="captions.vtt" srclang="en" label="English" default&gt;</code> provides captions. Captions are a legal requirement in many jurisdictions for media content.',
        'Multiple <code>&lt;source&gt;</code> elements provide format fallback: WebM first (smaller), MP4 last (universal support). The browser picks the first it can play.',
      ]
    },
    {
      heading: 'iframe and SVG',
      points: [
        '<code>&lt;iframe&gt;</code> embeds external content. For untrusted content, add <code>sandbox</code> — it restricts scripts, forms, and top-frame navigation. Restore only the permissions you need: <code>sandbox="allow-scripts allow-same-origin"</code>.',
        'YouTube embeds should use the <code>youtube-nocookie.com</code> domain and add <code>loading="lazy"</code> to defer the iframe until near the viewport.',
        'Inline <code>&lt;svg&gt;</code> is sharp at any resolution, CSS-styleable (fill, stroke, dimensions), and can be animated. Use for icons, logos, and data visualisations.',
        '<code>&lt;img src="icon.svg"&gt;</code> is simpler for pure display, but prevents CSS colour overrides and JS manipulation. Choose inline SVG when you need those features.',
      ]
    },
    {
      heading: 'Audio and Video Accessibility',
      points: [
        'Video content requires captions (via a <code>&lt;track kind="captions"&gt;</code> element referencing a WebVTT file) for deaf and hard-of-hearing users — captions are a legal requirement under accessibility regulations (WCAG, ADA) in many jurisdictions for publicly accessible video content.',
        'Autoplaying audio or video with sound is broadly considered a serious accessibility and usability violation — it can be disorienting for screen reader users (competing audio streams) and is disruptive for anyone in a shared or quiet environment; use <code>muted</code> if autoplay is genuinely needed.',
        'The <code>controls</code> attribute on <code>&lt;video&gt;</code> and <code>&lt;audio&gt;</code> exposes native, keyboard-accessible play/pause/volume/seek controls — removing it to build fully custom controls means you must reimplement all of that keyboard accessibility yourself, which is frequently done incompletely.',
        'Provide a text transcript alongside video/audio content where practical — beyond captions (which are timed to the video), a standalone transcript is scannable, searchable by search engines, and usable by people who cannot play media at all (extremely low bandwidth, certain assistive technology setups).',
      ]
    },
    {
      heading: 'Media Loading Performance',
      points: [
        'The <code>loading="lazy"</code> attribute on <code>&lt;img&gt;</code> and <code>&lt;iframe&gt;</code> defers loading offscreen media until the user scrolls near it — reducing initial page weight and improving Largest Contentful Paint for content above the fold that does not compete with below-fold media for bandwidth.',
        'Never lazy-load the image that IS your LCP (Largest Contentful Paint) element — lazy-loading it delays its load start until layout calculation determines it is near-viewport, which can actually worsen LCP; use <code>fetchpriority="high"</code> instead for above-the-fold hero images.',
        'Always specify explicit <code>width</code> and <code>height</code> attributes (or CSS aspect-ratio) on images and video — this lets the browser reserve the correct space before the media loads, preventing Cumulative Layout Shift as surrounding content jumps when the media finally loads and renders.',
        'Serve appropriately sized and compressed media — a 4000px-wide image displayed at 400px CSS width wastes bandwidth proportionally; use <code>srcset</code> with multiple resolutions (covered above) combined with modern compressed formats (WebP, AVIF) for the best size-to-quality ratio.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Responsive image',
      language: 'html',
      code: `<!-- Basic img with required attributes -->
<img
  src="hero.jpg"
  alt="A developer typing at a standing desk in a bright office"
  width="1200"
  height="630"
>

<!-- Responsive srcset — browser picks best width -->
<img
  src="card-400.jpg"
  srcset="card-400.jpg 400w,
          card-800.jpg 800w,
          card-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw,
         (max-width: 1200px) 50vw,
         400px"
  alt="Screenshot of the code editor interface"
  width="800"
  height="500"
  loading="lazy"
>

<!-- Art direction with picture: different crop + format fallback -->
<picture>
  <!-- AVIF format (smallest, newest) -->
  <source type="image/avif"
          srcset="hero-mobile.avif 600w, hero-desktop.avif 1200w"
          media="(min-width: 600px)">
  <!-- WebP fallback -->
  <source type="image/webp"
          srcset="hero-mobile.webp 600w, hero-desktop.webp 1200w">
  <!-- JPEG fallback — img is always last, always has alt -->
  <img src="hero-desktop.jpg" alt="Conference room with developers on laptops"
       width="1200" height="630">
</picture>`
    },
    {
      label: 'Video with captions',
      language: 'html',
      code: `<!-- Standard video player -->
<video
  controls
  width="854"
  height="480"
  preload="metadata"
  poster="thumbnail.jpg"
>
  <source src="intro.webm" type="video/webm">
  <source src="intro.mp4" type="video/mp4">

  <!-- Accessibility: captions/subtitles -->
  <track
    kind="subtitles"
    src="captions-en.vtt"
    srclang="en"
    label="English"
    default
  >
  <track
    kind="subtitles"
    src="captions-fr.vtt"
    srclang="fr"
    label="Français"
  >

  <!-- Fallback for very old browsers -->
  <p>Your browser does not support video.
     <a href="intro.mp4">Download the video</a>.</p>
</video>

<!-- Background hero video (autoplay requires muted) -->
<video autoplay muted loop playsinline width="1920" height="1080">
  <source src="bg.webm" type="video/webm">
  <source src="bg.mp4" type="video/mp4">
</video>`
    },
    {
      label: 'SVG & iframe',
      language: 'html',
      code: `<!-- Inline SVG (CSS-styleable, JS-accessible) -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width="24"
  height="24"
  aria-hidden="true"
  focusable="false"
>
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
  <path d="M2 17l10 5 10-5"/>
</svg>

<!-- SVG as img (simpler; can't CSS-style fill color) -->
<img src="logo.svg" alt="DevHub logo" width="120" height="40">

<!-- YouTube embed — nocookie domain, lazy load, sandbox -->
<iframe
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
  width="560"
  height="315"
  title="Introduction to HTML — video tutorial"
  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  loading="lazy"
  sandbox="allow-scripts allow-same-origin allow-presentation"
></iframe>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Missing or empty alt on informative images',
      wrong: `<img src="chart.png">
<img src="team.jpg" alt="">`,
      right: `<img src="chart.png" alt="Bar chart: Q1 revenue up 23% vs Q4 2024">
<img src="team.jpg" alt="The DevHub engineering team at the 2025 offsite">`,
      explanation: 'Missing alt means screen readers read out the filename. Empty alt on informative images hides meaningful content from users who cannot see the image.'
    },
    {
      title: 'Adding loading="lazy" to above-fold images',
      wrong: `<!-- Hero image (visible on page load) -->
<img src="hero.jpg" alt="Hero" loading="lazy">`,
      right: `<!-- Hero image — no lazy loading -->
<img src="hero.jpg" alt="Hero banner" width="1200" height="630">
<!-- Below-fold images get lazy -->
<img src="card.jpg" alt="Product card" loading="lazy" width="400" height="300">`,
      explanation: 'loading="lazy" on the LCP (largest contentful paint) image delays the most important visual element and hurts Core Web Vitals. Only apply it to below-fold images.'
    },
    {
      title: 'Omitting width and height on img',
      wrong: `<img src="photo.jpg" alt="Profile photo">`,
      right: `<img src="photo.jpg" alt="Profile photo" width="300" height="300">`,
      explanation: 'Without dimensions, the browser cannot reserve space. When the image loads, surrounding content jumps (Cumulative Layout Shift). CLS is a Core Web Vitals metric.'
    },
    {
      title: 'Video autoplay without muted',
      wrong: `<video autoplay src="promo.mp4"></video>`,
      right: `<video autoplay muted loop playsinline src="promo.mp4"></video>`,
      explanation: 'Browsers block autoplay with audio. The video silently fails to play. muted allows autoplay; playsinline prevents fullscreen on iOS; loop keeps it running.'
    },
    {
      title: 'iframes without sandbox',
      wrong: `<iframe src="https://third-party.com/widget"></iframe>`,
      right: `<iframe
  src="https://third-party.com/widget"
  sandbox="allow-scripts allow-same-origin"
  title="Third-party widget"
></iframe>`,
      explanation: 'Unsandboxed iframes can redirect the parent page, access cookies, and run scripts in your domain. sandbox restricts these by default; restore only needed permissions.'
    },
  ];

  challenge: Challenge = {
    title: 'Build a responsive media section',
    language: 'html',
    description: `Build a "hero" section for a product page containing:

1. A responsive hero image using \`<picture>\` with:
   - A WebP source for modern browsers
   - A JPEG fallback img element
   - srcset providing 600w and 1200w variants for each format
   - Proper alt text, width, height (no lazy loading — it's above fold)

2. A promotional video below the hero with:
   - Native controls and a poster image
   - WebM and MP4 sources
   - English caption track (use a placeholder .vtt filename)
   - preload="metadata"

3. A company logo using inline SVG with aria-hidden="true"`,
    hints: [
      'picture > source (WebP) then img (JPEG fallback)',
      'source elements go inside video before the track element',
      'preload="metadata" is a string attribute, not boolean',
      'SVG must have xmlns="http://www.w3.org/2000/svg" and a viewBox',
      'The img inside picture must always have the alt attribute'
    ],
    starterCode: `<section class="hero">
  <!-- 1. Responsive picture -->

  <!-- 2. Product video -->

  <!-- 3. Company SVG logo -->
</section>`,
    solution: `<section class="hero">

  <!-- 1. Responsive picture with WebP + JPEG fallback -->
  <picture>
    <source
      type="image/webp"
      srcset="hero-600.webp 600w, hero-1200.webp 1200w"
      sizes="100vw"
    >
    <img
      src="hero-1200.jpg"
      srcset="hero-600.jpg 600w, hero-1200.jpg 1200w"
      sizes="100vw"
      alt="Dashboard showing real-time analytics with colourful bar charts"
      width="1200"
      height="630"
    >
  </picture>

  <!-- 2. Product video -->
  <video controls preload="metadata" poster="promo-thumb.jpg" width="854" height="480">
    <source src="promo.webm" type="video/webm">
    <source src="promo.mp4" type="video/mp4">
    <track kind="subtitles" src="captions-en.vtt" srclang="en" label="English" default>
    <p>Your browser does not support video. <a href="promo.mp4">Download</a>.</p>
  </video>

  <!-- 3. Company SVG logo -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 120 40"
    width="120"
    height="40"
    aria-hidden="true"
    focusable="false"
  >
    <rect width="120" height="40" rx="8" fill="#e34c26"/>
    <text x="60" y="26" text-anchor="middle" fill="white" font-size="14">DevHub</text>
  </svg>

</section>`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When should you use alt="" (empty alt text)?',
      options: [
        'When you forget what the image shows',
        'For decorative images that add no information',
        'When the image has a visible caption below it',
        'Never — alt must always have content'
      ],
      answer: 1,
      explanation: 'Empty alt tells screen readers to skip the image entirely. Use it for purely decorative images (backgrounds, dividers) that convey no meaning. For informative images, always describe what the image communicates.'
    },
    {
      q: 'Which attribute prevents Cumulative Layout Shift from images?',
      options: ['loading="lazy"', 'decoding="async"', 'width and height attributes', 'object-fit: cover'],
      answer: 2,
      explanation: 'Setting width and height on <img> lets the browser calculate the aspect ratio and reserve space before the image loads, preventing content shift. CLS is a Core Web Vitals metric.'
    },
    {
      q: 'What must you add to enable video autoplay?',
      options: [
        'autoplay="true"',
        'autoplay and controls',
        'autoplay and muted',
        'preload="auto"'
      ],
      answer: 2,
      explanation: 'Browsers block autoplay of audio/unmuted video by default to prevent noise. muted allows autoplay. Most background hero videos also add loop and playsinline.'
    },
    {
      q: 'What does the <picture> element enable that plain srcset cannot?',
      options: [
        'Responsive image width selection',
        'Device pixel density selection',
        'Art direction — different image crops for different viewports',
        'Lazy loading of images'
      ],
      answer: 2,
      explanation: 'srcset on <img> only lets the browser choose size variants of the same image. <picture> with media queries lets you serve a completely different image crop or composition — portrait for mobile, landscape for desktop.'
    },
    {
      q: 'Which <track> kind provides timed text shown over a video for hearing-impaired users?',
      options: ['descriptions', 'chapters', 'metadata', 'captions'],
      answer: 3,
      explanation: 'kind="captions" provides visible timed text including dialogue and sound effects for hearing-impaired users. kind="subtitles" is for translation only. Captions are a legal requirement in many countries.'
    },
    {
      q: 'What does the preload attribute on <video> or <audio> control?',
      options: ['Whether the media autoplays', 'How much media data the browser loads before the user plays it', 'The media quality level', 'Whether captions are shown by default'],
      answer: 1,
      explanation: 'preload="none" avoids loading anything until play is requested. preload="metadata" loads only duration/dimensions/track list. preload="auto" lets the browser decide how much to buffer. On mobile, browsers ignore preload to save data. Default is browser-dependent.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use <img> vs inline <svg> for icons?',
      a: 'Use inline <svg> when you need CSS color control (e.g. fill changes on hover/dark mode) or JavaScript interaction. Use <img src="icon.svg"> when the icon is purely decorative, has a fixed appearance, and you want simpler HTML. Inline SVG is the better default for UI icons.'
    },
    {
      q: 'What is the difference between poster and preload on <video>?',
      a: 'poster is a static image shown before the video plays or while it is loading — like a thumbnail. preload controls how much of the video is downloaded on page load: "none" downloads nothing, "metadata" downloads duration/dimensions only, "auto" downloads the whole file. Use poster + preload="metadata" for most hosted videos.'
    },
    {
      q: 'How do I embed a YouTube video without privacy issues?',
      a: 'Use the youtube-nocookie.com domain instead of youtube.com in the iframe src. This prevents YouTube from setting tracking cookies on your visitors until they click play. Add sandbox="allow-scripts allow-same-origin allow-presentation" and loading="lazy".'
    },
    {
      q: 'What does the sandbox attribute on iframe actually restrict?',
      a: 'An empty sandbox attribute blocks all of: script execution, form submission, pointer lock, popups, top-frame navigation, same-origin access. You re-enable each permission with a token: allow-scripts, allow-forms, allow-same-origin, allow-popups, etc. Always start with an empty sandbox and add only what the embed needs.'
    },
    {
      q: 'How do you make a video accessible for screen reader users?',
      a: 'Provide: (1) <code>&lt;track kind="captions"&gt;</code> for dialogue/audio description of sounds, (2) <code>&lt;track kind="descriptions"&gt;</code> for audio description of visual content for blind users, (3) a text transcript as a visible or linked alternative. Add aria-label or title to the video element to give it an accessible name. Ensure custom controls (if replacing native ones) are keyboard-navigable and properly labeled.',
    },
    {
      q: 'What is the difference between lazy and eager loading of images?',
      a: '<code>loading="eager"</code> (default) fetches the image immediately regardless of viewport position — correct for LCP images and above-the-fold content. <code>loading="lazy"</code> defers loading until the image nears the viewport, reducing initial bandwidth. Do NOT lazy-load the hero image or any LCP candidate — it delays the Largest Contentful Paint metric. Add <code>fetchpriority="high"</code> to the LCP image to signal it should load as fast as possible.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'HTML media elements embed images, video, audio, and SVG — performance and accessibility require explicit attributes on all of them.',
    mustKnow: [
      'alt is required on every img — empty alt for decorative, descriptive for informative',
      'width + height prevent CLS; loading="lazy" only on below-fold images',
      '<picture> with <source type="image/webp"> enables format fallback and art direction',
      'video autoplay requires muted — browsers block unmuted autoplay',
      '<track kind="captions"> provides accessibility for video — legally required in many regions',
      'sandbox attribute on iframe restricts embedded content by default',
    ],
    interviewFocus: [
      'What CLS is and how width/height prevents it',
      'srcset vs <picture> — when to use each',
      'Why autoplay requires muted and what playsinline does on iOS',
      'iframe sandbox — what it restricts and how to selectively re-enable permissions',
    ]
  };
}