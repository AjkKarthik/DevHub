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
  selector: 'app-perf-browser-rendering',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './browser-rendering.html',
  styleUrl: './browser-rendering.scss',
})
export class PerfBrowserRendering {

  quickRef: QuickRefItem[] = [
    { name: 'Compositor thread',    type: 'keyword', desc: 'GPU-backed thread that composites layers — runs independently of the main thread' },
    { name: 'Composite-only props', type: 'keyword', desc: 'transform and opacity — no layout or paint; cheapest animations possible' },
    { name: 'Layout trigger',       type: 'keyword', desc: 'Any CSS property change that requires recalculating element sizes/positions (width, height, top, margin…)' },
    { name: 'Paint trigger',        type: 'keyword', desc: 'Color, background, box-shadow changes — skip layout but redraw pixels' },
    { name: 'will-change',          type: 'syntax',  desc: 'Hints the browser to promote an element to its own compositor layer ahead of animation' },
    { name: 'contain',              type: 'syntax',  desc: 'contain: layout strict — isolates subtree so its changes don\'t trigger global layout' },
    { name: 'content-visibility',   type: 'syntax',  desc: 'content-visibility: auto — skips render for off-screen elements; speeds up initial paint' },
    { name: 'requestAnimationFrame',type: 'function',desc: 'Schedule visual updates to run at the start of the next frame — safe for DOM mutations' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The four rendering stages',
      points: [
        'Style: browser matches CSS selectors to DOM nodes and computes each node\'s computed style.',
        'Layout (Reflow): browser calculates size and position of every visible element in the document flow.',
        'Paint: browser rasterises each element into pixel layers — text, images, borders, shadows.',
        'Composite: GPU composites the separate paint layers into the final frame shown on screen.',
        'Each stage can be triggered independently — the cheapest path skips layout and paint entirely (composite-only).',
      ],
    },
    {
      heading: 'CSS properties and their pipeline cost',
      points: [
        'Layout triggers (most expensive): width, height, padding, margin, top, left, font-size, display, position.',
        'Paint triggers (medium cost): color, background-color, border-color, box-shadow, outline, text-decoration.',
        'Composite-only (cheapest): transform (translate, scale, rotate) and opacity — handled entirely on the GPU.',
        'Rule: animate with transform and opacity whenever possible; avoid animating layout properties.',
        'Reference: csstriggers.com lists which pipeline stages every property triggers.',
      ],
    },
    {
      heading: 'Compositor layers and will-change',
      points: [
        'The browser automatically promotes elements with 3D transforms, video, canvas, or fixed positioning to their own compositor layer.',
        'will-change: transform (or will-change: opacity) explicitly promotes an element — useful before an animation starts.',
        'Each compositor layer uses GPU memory; over-promoting large numbers of elements can exhaust VRAM and hurt performance.',
        'Use will-change on the specific element that will animate, not on everything.',
        'Remove will-change after the animation ends to free the GPU layer.',
      ],
    },
    {
      heading: 'contain and content-visibility',
      points: [
        'contain: layout — changes inside the element do not affect outside layout; the rest of the page doesn\'t reflow.',
        'contain: paint — element does not paint outside its bounds; browser can skip painting it when off-screen.',
        'contain: strict — combines layout, paint, and size; strongest isolation.',
        'content-visibility: auto — browser skips style/layout/paint for off-screen sections; massive paint-time win for long pages.',
        'Pair content-visibility: auto with contain-intrinsic-size to prevent CLS as sections scroll into view.',
      ],
    },
    {
      heading: 'requestAnimationFrame and avoiding forced layout',
      points: [
        'requestAnimationFrame (rAF) fires at the START of the next frame — safe window to mutate DOM before style recalc.',
        'Reading layout properties (offsetWidth, getBoundingClientRect) after a write forces a synchronous layout — layout thrashing.',
        'Pattern: batch all reads first, then all writes — or use ResizeObserver/IntersectionObserver for reactive layout reads.',
        'rAF is throttled in hidden tabs and to 60 fps by default; requestIdleCallback is for non-visual work.',
        'Double-rAF trick: rAF → rAF → mutation ensures the browser paints once before the next mutation.',
      ],
    },
    {
      heading: 'Measuring rendering performance',
      points: [
        'Chrome DevTools Performance panel: "Main" track shows style/layout/paint/composite tasks as coloured blocks.',
        'Long green blocks = expensive paint; long purple = layout. Red triangle = long task.',
        '"Rendering" tab (DevTools → More Tools → Rendering): toggle "Paint flashing" (green overlay on repainted regions).',
        '"Layer" panel: shows compositor layers — too many thin layers = over-compositing.',
        'PerformanceObserver with type "longtask" fires for tasks > 50 ms — use to detect rendering bottlenecks in production.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Composite-only animation',
      language: 'css',
      code: `/* BAD: animating left/top triggers layout on every frame */
.box-bad {
  position: absolute;
  left: 0;
  transition: left 0.3s ease;  /* layout → paint → composite every frame */
}
.box-bad.active { left: 200px; }

/* GOOD: transform runs entirely on the compositor — zero layout or paint */
.box-good {
  position: absolute;
  transform: translateX(0);
  transition: transform 0.3s ease;  /* composite only */
  will-change: transform;           /* promote layer ahead of animation */
}
.box-good.active { transform: translateX(200px); }

/* GOOD: fade with opacity — also composite-only */
.fade {
  opacity: 1;
  transition: opacity 0.2s ease;
}
.fade.hidden { opacity: 0; }

/* Remember: remove will-change after animation to free GPU memory */
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});`,
    },
    {
      label: 'contain + content-visibility',
      language: 'css',
      code: `/* Isolate a widget so its layout changes don't ripple to the whole page */
.sidebar-widget {
  contain: layout paint;   /* layout changes inside stay inside */
}

/* Skip rendering of off-screen page sections entirely */
.page-section {
  content-visibility: auto;
  /* Estimated height prevents CLS as section enters viewport */
  contain-intrinsic-size: 0 600px;
}

/* Strict containment — strongest isolation */
.isolated-component {
  contain: strict;
  /* Equivalent to: contain: size layout paint style */
  width: 300px;
  height: 200px;  /* size must be declared when using contain: size */
}

/* content-visibility for long article pages — dramatic paint savings */
article > section {
  content-visibility: auto;
  contain-intrinsic-block-size: 500px;  /* logical equivalent of height */
}`,
    },
    {
      label: 'Avoiding layout thrashing',
      language: 'typescript',
      code: `// BAD: read → write → read → write (forced layout each iteration)
function resizeAll(elements: HTMLElement[]) {
  elements.forEach(el => {
    const w = el.offsetWidth;              // READ — layout computed
    el.style.width = (w * 1.1) + 'px';    // WRITE — layout invalidated
    const h = el.offsetHeight;             // READ — forced layout again
    el.style.height = (h * 1.1) + 'px';   // WRITE
  });
}

// GOOD: batch reads, then batch writes — one layout computation
function resizeAllFast(elements: HTMLElement[]) {
  // Phase 1: read all values (one layout)
  const sizes = elements.map(el => ({
    w: el.offsetWidth,
    h: el.offsetHeight,
  }));

  // Phase 2: apply all writes (no read → no forced layout)
  elements.forEach((el, i) => {
    el.style.width  = (sizes[i].w * 1.1) + 'px';
    el.style.height = (sizes[i].h * 1.1) + 'px';
  });
}

// BETTER: use requestAnimationFrame to align with browser frame cycle
function animateFrame(elements: HTMLElement[]) {
  requestAnimationFrame(() => {
    const sizes = elements.map(el => ({ w: el.offsetWidth, h: el.offsetHeight }));
    requestAnimationFrame(() => {  // second rAF = after style recalc
      elements.forEach((el, i) => {
        el.style.width  = (sizes[i].w * 1.1) + 'px';
        el.style.height = (sizes[i].h * 1.1) + 'px';
      });
    });
  });
}`,
    },
    {
      label: 'Detect rendering bottlenecks',
      language: 'typescript',
      code: `// Observe long tasks (> 50ms) in production
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn('Long task:', entry.duration.toFixed(0), 'ms', entry);
  }
});
observer.observe({ type: 'longtask', buffered: true });

// Paint timing — FCP, LCP visual milestones
const paintObs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, ':', entry.startTime.toFixed(0), 'ms');
    // "first-paint" and "first-contentful-paint"
  }
});
paintObs.observe({ type: 'paint', buffered: true });

// Custom performance marks around a render-heavy operation
performance.mark('render-start');
renderLargeList(data);
performance.mark('render-end');
performance.measure('renderLargeList', 'render-start', 'render-end');
const [measure] = performance.getEntriesByName('renderLargeList');
console.log('renderLargeList took:', measure.duration.toFixed(0), 'ms');`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Animating layout-triggering CSS properties',
      wrong: `.slide { transition: left 0.3s; }   /* triggers layout every frame */
.slide.open { left: 0; }`,
      right: `.slide { transition: transform 0.3s; transform: translateX(-100%); }
.slide.open { transform: translateX(0); }   /* compositor-only */`,
      explanation: 'Animating left, top, width, height, or margin triggers a full layout recalculation every frame. At 60fps that is 60 layout operations per second. transform runs on the GPU compositor with zero layout cost.',
    },
    {
      title: 'Using will-change on too many elements',
      wrong: `/* Applying will-change to everything — wastes GPU memory */
* { will-change: transform; }`,
      right: `/* Only the element that WILL animate, and only while it needs to */
.animated-card { will-change: transform; }`,
      explanation: 'Every element with will-change gets its own GPU layer. Hundreds of promoted layers exhaust VRAM, causing the browser to de-promote and trigger expensive re-uploads. Use will-change surgically.',
    },
    {
      title: 'Reading layout values immediately after writing',
      wrong: `el.style.height = '200px';         // write — invalidates layout
const h = el.offsetHeight;          // read — forces synchronous layout`,
      right: `// Read first, then write
const h = el.offsetHeight;          // read (layout up to date)
el.style.height = (h + 50) + 'px'; // write`,
      explanation: 'Reading a layout property after writing forces the browser to flush pending style changes and recompute layout synchronously before returning the value. This is "forced synchronous layout" — one of the most common rendering bottlenecks.',
    },
    {
      title: 'Not pairing content-visibility with contain-intrinsic-size',
      wrong: `.section { content-visibility: auto; }
/* Height collapses to 0 when off-screen → scroll position jumps */`,
      right: `.section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;  /* estimate avoids scroll jump */
}`,
      explanation: 'content-visibility: auto skips rendering off-screen sections, reducing their layout height to 0. Without contain-intrinsic-size the scrollbar jumps as sections enter/exit the viewport.',
    },
    {
      title: 'Forgetting to remove will-change after animation',
      wrong: `// Sets will-change on click — never removed
btn.addEventListener('click', () => {
  card.style.willChange = 'transform';
  card.classList.add('flying');
});`,
      right: `btn.addEventListener('click', () => {
  card.style.willChange = 'transform';
  card.classList.add('flying');
  card.addEventListener('transitionend', () => {
    card.style.willChange = 'auto';   // free the GPU layer
    card.classList.remove('flying');
  }, { once: true });
});`,
      explanation: 'will-change keeps an element on its own GPU layer permanently if never cleared. This wastes video memory and can hurt performance on mobile devices with limited VRAM.',
    },
    {
      title: 'Using JavaScript for animations that CSS handles better',
      wrong: `// JS-driven position animation — runs on main thread, can be jittery
let pos = 0;
function animate() {
  pos++;
  el.style.left = pos + 'px';   // triggers layout every frame
  requestAnimationFrame(animate);
}`,
      right: `/* CSS animation runs on compositor — smoother and more efficient */
.el {
  animation: slide 0.5s ease forwards;
}
@keyframes slide {
  from { transform: translateX(0); }
  to   { transform: translateX(200px); }
}`,
      explanation: 'JS-driven animations run on the main thread and are susceptible to jank when other JS blocks the thread. CSS animations using transform/opacity run on the compositor thread and stay smooth even when the main thread is busy.',
    },
  ];

  challenge: Challenge = {
    title: 'Audit and fix a jank-prone animation',
    language: 'scss',
    description: `The code below animates a notification card onto the screen, but it causes
jank because it:

1. Animates using top and left (layout triggers)
2. Reads offsetWidth inside the animation loop (forced layout)
3. Never removes will-change after the animation ends

Rewrite it to run at 60fps with zero layout triggers.`,
    hints: [
      'Replace top/left animation with transform: translate()',
      'Remove the offsetWidth read from inside the animation — read it once before starting',
      'Add a transitionend listener to clear will-change after the card slides in',
    ],
    starterCode: `/* Bad: layout-triggering animation */
.notification {
  position: fixed;
  top: -100px;
  right: 20px;
  will-change: top;
  transition: top 0.4s ease;
}
.notification.show {
  top: 20px;
}

/* JS that also reads layout inside animation */
function showNotification(el) {
  el.classList.add('show');
  requestAnimationFrame(() => {
    console.log('Width:', el.offsetWidth);  // forced layout mid-animation
  });
}`,
    solution: `/* Fix 1: use transform instead of top — compositor-only */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  transform: translateY(calc(-100% - 20px));  /* start off-screen */
  will-change: transform;
  transition: transform 0.4s ease;
}
.notification.show {
  transform: translateY(0);
}

/* Fix 2: read offsetWidth BEFORE animation starts — not inside rAF */
function showNotification(el) {
  const w = el.offsetWidth;  // read before adding class (layout already up to date)
  console.log('Width:', w);

  el.classList.add('show');  // triggers compositor-only animation

  /* Fix 3: remove will-change after animation to free GPU layer */
  el.addEventListener('transitionend', () => {
    el.style.willChange = 'auto';
  }, { once: true });
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which CSS properties trigger ONLY the composite stage (not layout or paint)?',
      options: [
        'color and background-color',
        'width and height',
        'transform and opacity',
        'margin and padding',
      ],
      answer: 2,
      explanation: 'transform and opacity are the only properties that run entirely on the compositor thread — they do not require layout or paint recalculation. All other common properties trigger at least paint, and many trigger layout.',
    },
    {
      q: 'What is "forced synchronous layout"?',
      options: [
        'Running layout calculations inside a Web Worker',
        'Reading a layout property immediately after a DOM write, forcing the browser to flush pending changes synchronously',
        'Using synchronous XHR to fetch layout data from the server',
        'Triggering CSS animations from JavaScript',
      ],
      answer: 1,
      explanation: 'When you write to the DOM then immediately read a layout property (offsetHeight, getBoundingClientRect), the browser must synchronously flush all pending style/layout changes before returning the value. This is expensive and a common cause of jank.',
    },
    {
      q: 'What does contain: layout do?',
      options: [
        'Prevents the element from being painted outside its bounds',
        'Makes the element\'s layout independent — changes inside don\'t cause layout recalculation outside',
        'Enables GPU compositing for the element',
        'Defers layout calculation to the next frame',
      ],
      answer: 1,
      explanation: 'contain: layout creates a layout boundary. The browser knows that nothing inside the element can affect layout outside it, allowing it to skip recalculating the rest of the page when the contained element changes.',
    },
    {
      q: 'When should you use will-change: transform?',
      options: [
        'On every element to improve general performance',
        'Just before an element is about to be animated with transform',
        'Instead of transform in your CSS',
        'Only on fixed-position elements',
      ],
      answer: 1,
      explanation: 'will-change hints the browser to promote the element to its own layer BEFORE the animation. Use it just before the animation starts (on hover/interaction), not globally — each promoted layer consumes GPU memory.',
    },
    {
      q: 'Which tool in Chrome DevTools shows which areas of the page are being repainted?',
      options: [
        'Performance panel → Long Tasks',
        'Rendering tab → Paint Flashing',
        'Network panel → Waterfall',
        'Elements panel → Computed',
      ],
      answer: 1,
      explanation: 'DevTools → More Tools → Rendering → enable "Paint Flashing" overlays repainted regions with a green highlight in real time, making it easy to spot unexpected repaints during interactions or animations.',
    },
    {
      q: 'Which CSS property change does NOT trigger a layout reflow?',
      options: ['width', 'margin', 'opacity', 'padding'],
      answer: 2,
      explanation: 'opacity only affects the compositing layer — the browser does not need to recalculate layout or repaint other elements. It is one of the cheapest CSS properties to animate. width, margin, and padding all affect the element\'s geometry and trigger layout (reflow), which invalidates layout for all affected elements in the same formatting context.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why does opacity: 0 not cause a repaint in some cases but visibility: hidden does?',
      a: 'opacity: 0 is a composite-only change — the element is still painted, just transparent. The compositor handles the fade without touching the paint layer. visibility: hidden, while similarly invisible, triggers a paint pass because it affects the element\'s rendered state differently in the paint layer.',
    },
    {
      q: 'What is the difference between requestAnimationFrame and setTimeout for animations?',
      a: 'requestAnimationFrame fires at the start of the next browser frame (typically 60fps, or the screen\'s refresh rate). It is throttled in hidden tabs and syncs with the display refresh cycle, preventing frame-skipping. setTimeout with 16ms is an approximation that can drift and fire at the wrong point in the frame cycle, causing tearing or jank.',
    },
    {
      q: 'How does the browser decide which elements to promote to compositor layers automatically?',
      a: 'The browser auto-promotes elements with: CSS 3D transforms (transform3d, perspective), video/canvas/iframe elements, elements with position: fixed or sticky, elements with a CSS filter, and elements explicitly using will-change. The heuristics vary by browser engine.',
    },
    {
      q: 'What does Paint Flashing in DevTools tell you that the Performance panel doesn\'t?',
      a: 'Paint Flashing shows WHICH regions repaint in real time during interactions — useful for spotting hover effects, scroll handlers, or animations that unexpectedly repaint large portions of the page. The Performance panel shows the cost of paints after the fact, but not which regions triggered them interactively.',
    },
    {
      q: 'Is there a performance cost to using contain: strict on many elements?',
      a: 'Yes — contain: strict includes size containment, meaning the element\'s size is not affected by its children. This can break layouts if the element doesn\'t have explicit dimensions set. Also, each contained element is isolated from the parent\'s layout context, which can increase rendering complexity if misused. Use it on widget-like isolated components, not fine-grained elements.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The four rendering stages are Style → Layout → Paint → Composite — animate with transform and opacity to skip the first two entirely.',
    mustKnow: [
      'Four stages: Style, Layout (reflow), Paint, Composite',
      'Composite-only: transform and opacity — cheapest; never trigger layout or paint',
      'Layout triggers: width, height, top, left, margin — expensive; avoid in animations',
      'Paint triggers: color, background, box-shadow — skip layout but still repaint',
      'will-change: transform promotes a layer BEFORE animation; remove it after',
      'contain: layout / content-visibility: auto isolate subtrees from global recalculation',
    ],
    interviewFocus: [
      'What are the four browser rendering stages? Which CSS properties trigger each?',
      'Explain "forced synchronous layout" — how do you avoid it?',
      'Why are transform and opacity the preferred animation properties?',
      'What does will-change do and when should you NOT use it?',
    ],
  };
}
