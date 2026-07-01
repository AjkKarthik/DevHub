import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-js-dom',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './dom.html',
  styleUrl: './dom.scss',
})
export class JsDom {
  theory: TheoryPoint[] = [
    {
      heading: 'Selecting Elements',
      points: [
        '<code>document.querySelector(selector)</code> returns the first matching element or <code>null</code>. <code>querySelectorAll(selector)</code> returns a static NodeList of all matches.',
        'NodeList from <code>querySelectorAll</code> is static — it does not update when the DOM changes. Convert to array with <code>Array.from(nl)</code> or <code>[...nl]</code> to use array methods.',
        '<code>getElementById</code> is the fastest selector for known IDs. <code>getElementsByClassName</code>/<code>getElementsByTagName</code> return live HTMLCollections (update when DOM changes).',
        '<code>element.closest(selector)</code> walks up the DOM tree from the element, returning the first ancestor matching the selector — essential for event delegation.',
        '<code>element.matches(selector)</code> returns true if the element would be selected by the given selector — useful inside event handlers to check the target.',
      ]
    },
    {
      heading: 'Creating & Modifying Elements',
      points: [
        '<code>document.createElement(tag)</code> creates a new element in memory. Set properties, then append to the DOM with <code>parent.appendChild(el)</code> or <code>parent.append(el)</code> (also accepts strings).',
        '<code>element.innerHTML</code> parses HTML and replaces content — powerful but a security risk if the HTML contains user data (XSS). Use <code>textContent</code> for plain text.',
        '<code>element.insertAdjacentHTML(position, html)</code> inserts HTML at <code>beforebegin</code>, <code>afterbegin</code>, <code>beforeend</code>, or <code>afterend</code> without replacing the whole content.',
        'Use <code>DocumentFragment</code> for batch DOM insertions — build all elements in memory, then insert once to minimize reflows.',
        'Modern: <code>element.replaceWith()</code>, <code>element.before()</code>, <code>element.after()</code>, <code>element.prepend()</code>, <code>element.append()</code> — cleaner than old <code>insertBefore</code>/<code>appendChild</code> combinations.',
      ]
    },
    {
      heading: 'Performance: Reflow & Repaint',
      points: [
        'DOM manipulation can trigger <strong>reflow</strong> (recalculate layout — expensive) and <strong>repaint</strong> (redraw pixels — cheaper). Reading layout properties after writing forces a synchronous reflow — layout thrashing.',
        'Batch DOM reads before writes: read all layout properties first, then apply all changes. This avoids the read-write-read-write cycle that forces repeated reflows.',
        '<code>requestAnimationFrame(fn)</code> defers DOM updates to the next paint cycle — batched by the browser for smooth 60fps animations.',
        'Use CSS classes instead of inline style changes when possible — toggling a class makes style changes predictable and CSS-only.',
        '<code>will-change: transform</code> hints to the browser to create a new compositing layer — good for elements that will be animated, reducing repaint scope.',
      ]
    },
    {
      heading: 'MutationObserver & ResizeObserver',
      points: [
        '<code>MutationObserver</code> watches for DOM changes (child additions/removals, attribute changes, text changes) asynchronously as microtasks — no polling needed.',
        '<code>ResizeObserver</code> fires when an element\'s size changes — more reliable than listening to <code>window.resize</code>, which only fires for viewport changes.',
        '<code>IntersectionObserver</code> reports when an element enters or exits the viewport — the proper way to do lazy loading, infinite scroll, and scroll-triggered animations.',
        'All three observers use a callback-based async API — no polling, no event listeners on scroll/resize. Disconnect them when no longer needed to avoid memory leaks.',
      ]
    },
    {
      heading: 'Document Fragments and Batch DOM Updates',
      points: [
        'A <code>DocumentFragment</code> is an in-memory, lightweight container for DOM nodes that is not part of the visible document tree — appending multiple children to a fragment and then inserting the fragment once triggers only a single reflow/repaint, instead of one per individual append.',
        'Repeatedly appending elements directly to a live DOM node inside a loop forces the browser to recalculate layout on every single append (in the worst case) — batching changes via a fragment (or building an HTML string and setting innerHTML once) avoids this "layout thrashing."',
        'Reading a layout property (like <code>offsetHeight</code>) immediately after writing a style change forces a synchronous layout recalculation ("forced reflow") — interleaving many reads and writes in a loop is a common, often-overlooked performance bug.',
        'Modern frameworks (React, Vue) solve DOM batching automatically via a virtual DOM diff or fine-grained reactivity — but understanding the underlying reflow/repaint cost is essential when writing vanilla JS DOM manipulation code directly.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'document.querySelector(sel)',    type: 'method', desc: 'First matching element or null' },
    { name: 'document.querySelectorAll(sel)', type: 'method', desc: 'Static NodeList of all matches' },
    { name: 'el.closest(sel)',               type: 'method', desc: 'Walk up tree; first ancestor matching selector' },
    { name: 'el.matches(sel)',               type: 'method', desc: 'True if element matches selector' },
    { name: 'el.innerHTML',                  type: 'accessor', desc: 'Get/set HTML content — XSS risk with user data' },
    { name: 'el.textContent',               type: 'accessor', desc: 'Get/set plain text — safe for user content' },
    { name: 'el.classList.toggle(cls)',      type: 'method', desc: 'Add if missing, remove if present' },
    { name: 'el.dataset.key',               type: 'accessor', desc: 'Access data-key attribute as el.dataset.key' },
    { name: 'new MutationObserver(cb)',      type: 'method', desc: 'Watch DOM changes — childList, attributes, subtree' },
    { name: 'new IntersectionObserver(cb)', type: 'method', desc: 'Watch viewport intersection — lazy load, infinite scroll' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Selecting & Modifying',
      language: 'typescript',
      code: `// ── Selecting elements ────────────────────────────────────────────────
const btn     = document.querySelector('#submit-btn');
const inputs  = document.querySelectorAll('input[type="text"]');
const items   = [...document.querySelectorAll('.list-item')]; // NodeList → Array

// closest: find the card containing the clicked button
document.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  card.classList.toggle('expanded');
});

// ── Creating elements ─────────────────────────────────────────────────
function createCard({ title, description, imageUrl }) {
  const card = document.createElement('article');
  card.className = 'card';

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = title;

  const h2 = document.createElement('h2');
  h2.textContent = title;  // safe — no XSS

  const p = document.createElement('p');
  p.textContent = description;

  card.append(img, h2, p);
  return card;
}

// ── DocumentFragment for batch insert ────────────────────────────────
const fragment = document.createDocumentFragment();
for (const item of dataItems) {
  fragment.append(createCard(item));
}
document.querySelector('#container').append(fragment);
// Single reflow instead of one per item`,
    },
    {
      label: 'Classes & Attributes',
      language: 'typescript',
      code: `// ── classList ────────────────────────────────────────────────────────
el.classList.add('active', 'highlighted');
el.classList.remove('loading');
el.classList.toggle('expanded');          // add if missing, remove if present
el.classList.toggle('open', isOpen);      // force to isOpen boolean
el.classList.replace('old-class', 'new-class');
el.classList.contains('active');         // boolean

// ── data attributes ───────────────────────────────────────────────────
// HTML: <div data-user-id="42" data-role="admin">
const div = document.querySelector('[data-user-id]');
div.dataset.userId;    // "42" (always string)
div.dataset.role;      // "admin"
div.dataset.newProp = 'value';  // creates data-new-prop attribute

// ── Attributes vs properties ──────────────────────────────────────────
// setAttribute/getAttribute deal with the HTML attribute (always string)
// Properties deal with the DOM property (typed)
input.setAttribute('value', '42');  // sets HTML attribute
input.value;            // DOM property — reflects current value
input.getAttribute('value');  // always "42" (initial value)

// ── Safe innerHTML alternative ────────────────────────────────────────
// ❌ XSS risk if content is from user input:
el.innerHTML = userInput;

// ✓ Always escape user input or use textContent:
el.textContent = userInput;  // safe

// For templating with safe variables:
el.innerHTML = \`<strong>\${escapeHtml(name)}</strong>: \${escapeHtml(desc)}\`;`,
    },
    {
      label: 'Observers',
      language: 'typescript',
      code: `// ── MutationObserver ─────────────────────────────────────────────────
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          initComponent(node);  // auto-init new elements
        }
      });
    }
    if (mutation.type === 'attributes') {
      console.log(\`\${mutation.attributeName} changed\`);
    }
  }
});

observer.observe(document.body, {
  childList: true,   // watch for child additions/removals
  subtree:   true,   // recursively watch all descendants
  attributes: true,  // watch attribute changes
});

// Disconnect when done (important!)
// observer.disconnect();

// ── IntersectionObserver (lazy loading) ───────────────────────────────
const lazyImages = document.querySelectorAll('img[data-src]');
const imgObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const img = entry.target;
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    observer.unobserve(img);  // stop watching once loaded
  }
}, { rootMargin: '200px' });  // load 200px before viewport

lazyImages.forEach(img => imgObserver.observe(img));

// ── ResizeObserver ────────────────────────────────────────────────────
const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    updateLayout(entry.target, width, height);
  }
});
resizeObserver.observe(document.querySelector('.responsive-chart'));`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting innerHTML with user content (XSS)',
      wrong: `div.innerHTML = \`<p>Hello \${userInput}</p>\`;
// If userInput = '<img src=x onerror=alert(1)>' — XSS!`,
      right: `const p = document.createElement('p');
p.textContent = \`Hello \${userInput}\`;  // safe — text only
div.append(p);`,
      explanation: 'innerHTML parses and executes HTML including script/event attributes. Never interpolate user input into innerHTML. Use textContent for user data.',
    },
    {
      title: 'Layout thrashing (interleaved read/write)',
      wrong: `boxes.forEach(box => {
  const h = box.offsetHeight;      // read — forces reflow
  box.style.height = h + 10 + 'px'; // write — invalidates layout
  // next iteration reads again after write...
});`,
      right: `const heights = [...boxes].map(b => b.offsetHeight);  // read all
boxes.forEach((b, i) => b.style.height = heights[i] + 10 + 'px'); // write all`,
      explanation: 'Reading layout properties after writing forces the browser to synchronously recalculate layout. Batch all reads first, then all writes.',
    },
    {
      title: 'Not disconnecting observers',
      wrong: `function setupObserver(el) {
  new MutationObserver(cb).observe(el, { subtree: true });
  // observer never disconnected — memory leak if el is removed
}`,
      right: `function setupObserver(el) {
  const obs = new MutationObserver(cb);
  obs.observe(el, { subtree: true });
  return () => obs.disconnect();  // return cleanup function
}
const cleanup = setupObserver(el);
// Later: cleanup(); when el is removed`,
      explanation: 'Observers hold references to elements and prevent GC. Always disconnect MutationObserver, IntersectionObserver, and ResizeObserver when their target is removed.',
    },
    {
      title: 'Treating querySelectorAll result as an Array',
      wrong: `const items = document.querySelectorAll('.item');
items.map(el => el.textContent);  // TypeError: items.map is not a function`,
      right: `const items = [...document.querySelectorAll('.item')];
items.map(el => el.textContent);  // works`,
      explanation: 'querySelectorAll returns a NodeList, not an Array. It lacks map, filter, reduce. Convert with spread [...nl] or Array.from(nl).',
    },
    {
      title: 'Using innerHTML to insert one element when createElement is better',
      wrong: `container.innerHTML += \`<div class="item">\${text}</div>\`;
// Serializes and reparses the ENTIRE container — destroys event listeners!`,
      right: `const div = document.createElement('div');
div.className = 'item';
div.textContent = text;
container.append(div);  // efficient — no reparsing`,
      explanation: 'innerHTML += reparses the entire container HTML, destroying all event listeners attached to child elements. Use createElement + append for incremental additions.',
    },
    {
      title: 'Using scroll event for IntersectionObserver use-cases',
      wrong: `window.addEventListener('scroll', () => {
  document.querySelectorAll('.lazy-img').forEach(img => {
    const rect = img.getBoundingClientRect();
    if (rect.top < window.innerHeight) loadImage(img);  // called on every scroll tick!
  });
});`,
      right: `const observer = new IntersectionObserver(entries => {
  entries.filter(e => e.isIntersecting).forEach(e => {
    loadImage(e.target); observer.unobserve(e.target);
  });
});
document.querySelectorAll('.lazy-img').forEach(img => observer.observe(img));`,
      explanation: 'Scroll event fires dozens of times per second and requires expensive getBoundingClientRect() on each tick. IntersectionObserver is asynchronous, efficient, and off-main-thread.',
    },
  ];

  challenge: Challenge = {
    title: 'Virtual Scroll List',
    language: 'typescript',
    description: 'Implement a virtual scroll list that renders only the visible items (plus a small buffer) from a large array. Given a container of fixed height and items of fixed height, use IntersectionObserver or scroll events to determine which items to render.\n\nThe list should handle 10,000 items smoothly without rendering all of them.',
    hints: [
      'Use a sentinel/spacer div at top and bottom to maintain scroll height',
      'Calculate visible range: Math.floor(scrollTop / itemHeight)',
      'Render visibleStart-buffer to visibleEnd+buffer items',
      'Update the top spacer height to position items correctly',
    ],
    starterCode: `function createVirtualList(container, items, itemHeight = 40, buffer = 5) {
  // container has fixed height (e.g., 400px)
  // items is array of { id, text }
  // Only render visible + buffer items
}

// Test with 10,000 items
const items = Array.from({ length: 10_000 }, (_, i) => ({
  id: i, text: \`Item \${i}\`
}));
createVirtualList(document.querySelector('#list'), items);`,
    solution: `function createVirtualList(container, items, itemHeight = 40, buffer = 5) {
  const totalHeight = items.length * itemHeight;
  container.style.overflow = 'auto';
  container.style.position = 'relative';

  const spacer = document.createElement('div');
  spacer.style.height = totalHeight + 'px';
  container.append(spacer);

  const viewport = document.createElement('div');
  viewport.style.position = 'absolute';
  viewport.style.top = '0';
  viewport.style.width = '100%';
  container.append(viewport);

  function render() {
    const scrollTop = container.scrollTop;
    const visibleCount = Math.ceil(container.clientHeight / itemHeight);
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const end = Math.min(items.length, start + visibleCount + buffer * 2);

    viewport.style.transform = \`translateY(\${start * itemHeight}px)\`;
    viewport.innerHTML = '';
    for (let i = start; i < end; i++) {
      const el = document.createElement('div');
      el.style.height = itemHeight + 'px';
      el.textContent = items[i].text;
      viewport.append(el);
    }
  }

  container.addEventListener('scroll', render, { passive: true });
  render();
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does querySelectorAll return?',
      options: ['An Array', 'A live HTMLCollection', 'A static NodeList', 'A single Element'],
      answer: 2,
      explanation: 'querySelectorAll returns a static NodeList — it does not update when the DOM changes. Convert to Array with [...nl] or Array.from(nl) to use array methods like map/filter.',
    },
    {
      q: 'What is layout thrashing?',
      options: [
        'When the DOM has too many elements',
        'Interleaving DOM reads and writes that force repeated synchronous reflows',
        'When CSS transitions are too slow',
        'When innerHTML is used instead of createElement',
      ],
      answer: 1,
      explanation: 'Layout thrashing occurs when you read a layout property (like offsetHeight) after writing to the DOM. The browser must synchronously recalculate layout. Batch reads before writes.',
    },
    {
      q: 'What is the XSS risk with innerHTML?',
      options: [
        'It is slower than textContent',
        'It executes script tags and event handlers in HTML strings',
        'It does not work on all browsers',
        'It cannot handle Unicode',
      ],
      answer: 1,
      explanation: 'innerHTML parses HTML including event attributes (onerror, onclick) and script tags. User-controlled content in innerHTML can execute arbitrary JavaScript (XSS). Use textContent for user data.',
    },
    {
      q: 'Which observer efficiently handles lazy loading images?',
      options: ['MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'PerformanceObserver'],
      answer: 2,
      explanation: 'IntersectionObserver fires when elements enter/exit the viewport — ideal for lazy loading. It\'s asynchronous, off-main-thread, and far more efficient than scroll event + getBoundingClientRect.',
    },
    {
      q: 'What does `element.closest(".card")` return?',
      options: [
        'The closest child element matching .card',
        'The nearest ancestor (or self) matching .card',
        'All ancestors matching .card',
        'null if element itself is .card',
      ],
      answer: 1,
      explanation: 'closest() walks UP the DOM tree from the element (including itself) and returns the first ancestor matching the selector, or null if none matches.',
    },
    {
      q: 'What does requestAnimationFrame guarantee that setTimeout(fn, 0) does not?',
      options: ['A 60fps callback', 'The callback runs before the browser paints, synced to display refresh', 'The callback runs on the GPU', 'The callback runs in a microtask'],
      answer: 1,
      explanation: 'rAF runs the callback at the beginning of the next frame, just before the browser paints. This guarantees visual changes are applied before the next render. setTimeout(fn, 0) has no such guarantee and may fire after a paint.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use DocumentFragment?',
      a: 'Use <code>DocumentFragment</code> when inserting multiple elements into the DOM at once. Build all elements in the fragment (no reflows — it\'s not in the live DOM), then insert the fragment in one operation. This reduces reflows from N insertions to 1. Most useful for rendering lists of 50+ items.',
    },
    {
      q: 'What is the difference between MutationObserver and DOM events?',
      a: '<strong>DOM events</strong> (click, input, etc.) respond to user interactions. <strong>MutationObserver</strong> responds to structural changes in the DOM tree — elements being added/removed, attributes changing, text content changing. MutationObserver callbacks run as microtasks, batching all mutations from a task into one callback.',
    },
    {
      q: 'Should I use innerHTML or createElement for dynamic content?',
      a: '<code>innerHTML</code> is convenient for HTML templates with safe/escaped data and is fast for initial rendering. <code>createElement</code> is safer (no XSS risk) and better when attaching event listeners (innerHTML destroys them on reassignment). Rule: use <code>createElement</code> for dynamic user-controlled content; use a sanitized template or <code>innerHTML</code> with escaped content for static structure.',
    },
    {
      q: 'What is the difference between getBoundingClientRect() and offsetTop?',
      a: '<code>getBoundingClientRect()</code> returns the element\'s size and position relative to the viewport, accounting for scrolling, transforms, and stacking. Values update on every call. <code>offsetTop</code> is relative to the nearest positioned ancestor, ignores transforms, and reflects the rendered layout position. Use <code>getBoundingClientRect()</code> for position-relative-to-viewport needs (tooltips, sticky elements); <code>offsetTop</code> for layout calculations.',
    },
    {
      q: 'How does the Intersection Observer API differ from a scroll event listener?',
      a: 'Scroll event fires synchronously on every scroll step, potentially 60+ times per second, on the main thread. IntersectionObserver runs off the main thread and fires callbacks only when elements enter/leave defined thresholds — much more performant. Use IntersectionObserver for lazy loading, infinite scroll, analytics visibility tracking, and sticky headers. Only use scroll events when you need precise per-pixel scroll position.',
    },
    {
      q: 'What is layout thrashing and how do you avoid it?',
      a: 'Layout thrashing (forced synchronous layouts) happens when you interleave DOM reads and writes in a loop: read offsetHeight → write style → read offsetHeight → write style… Each read after a write forces the browser to recompute layout immediately. Fix: batch all reads first, then all writes. Or use <code>requestAnimationFrame</code> to batch writes to the next frame. Libraries like FastDOM automate read/write batching.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'DOM manipulation: querySelector for selection, createElement+append for safe creation, DocumentFragment for batch inserts, and Observer APIs (Intersection/Mutation/Resize) for efficient reactive DOM monitoring.',
    mustKnow: [
      'querySelectorAll returns static NodeList — convert to Array for map/filter',
      'innerHTML with user content = XSS — always use textContent for user data',
      'Layout thrashing: read layout after write forces reflow — batch reads before writes',
      'closest() walks UP the tree; querySelector walks DOWN',
      'IntersectionObserver > scroll event for lazy loading and viewport detection',
      'Disconnect observers when their targets are removed to prevent memory leaks',
    ],
    interviewFocus: [
      'What is layout thrashing and how do you prevent it?',
      'Why is innerHTML dangerous and what are the alternatives?',
      'How does IntersectionObserver work vs scroll event?',
      'Explain event delegation and why it\'s more efficient',
    ],
  };
}
