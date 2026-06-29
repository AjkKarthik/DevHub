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
  selector: 'app-js-events',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class JsEvents {
  theory: TheoryPoint[] = [
    {
      heading: 'Event Phases',
      points: [
        'DOM events travel in three phases: <strong>capture</strong> (window → target), <strong>target</strong> (the element), and <strong>bubble</strong> (target → window). By default, listeners run in the bubble phase.',
        'Pass <code>{ capture: true }</code> (or <code>true</code> as third arg) to <code>addEventListener</code> to listen during the capture phase — fires before any bubble-phase listeners.',
        '<code>e.stopPropagation()</code> prevents the event from continuing up (or down) the DOM tree. <code>e.stopImmediatePropagation()</code> also prevents other listeners on the same element.',
        '<code>e.preventDefault()</code> cancels the browser\'s default action (form submission, link navigation, checkbox toggle) — but does NOT stop propagation.',
        'Most events bubble, but some do not: <code>focus</code>, <code>blur</code>, <code>load</code>, <code>unload</code>. Use <code>focusin</code>/<code>focusout</code> if you need bubbling focus events.',
      ]
    },
    {
      heading: 'addEventListener Options',
      points: [
        '<code>{ once: true }</code> — the listener removes itself after firing once. Cleaner than manually calling <code>removeEventListener</code>.',
        '<code>{ passive: true }</code> — tells the browser this listener will never call <code>preventDefault()</code>, allowing it to optimize scroll performance. Required for smooth scroll on touch.',
        '<code>{ capture: true }</code> — runs in the capture phase instead of bubble.',
        'A listener is only registered once per unique (handler reference, capture flag) pair — calling <code>addEventListener</code> with the same function twice has no effect.',
        'Always remove listeners when components unmount to prevent memory leaks: <code>removeEventListener</code> requires the EXACT same function reference and options.',
      ]
    },
    {
      heading: 'Event Delegation',
      points: [
        'Instead of attaching a listener to every child, attach ONE listener to a parent and use <code>e.target</code> or <code>e.target.closest()</code> to identify which child was acted on.',
        'Benefits: (1) Works for dynamically added children — no need to re-attach. (2) Far fewer listeners — important for large lists. (3) Single cleanup point.',
        '<code>e.target</code> is the element that triggered the event. <code>e.currentTarget</code> is the element the listener is attached to (the delegating parent).',
        'Use <code>e.target.closest(".list-item")</code> to safely handle clicks on elements nested inside list items — without it, clicking a child element would give you the child, not the item.',
      ]
    },
    {
      heading: 'Custom Events',
      points: [
        '<code>new CustomEvent("event-name", { detail: data, bubbles: true, cancelable: true })</code> creates a custom event. Dispatch with <code>element.dispatchEvent(event)</code>.',
        'Custom events enable component communication without tight coupling — a child element can emit an event that a parent listens to, just like native DOM events.',
        'Set <code>bubbles: true</code> so the event propagates up the tree — this enables event delegation and decouples the emitter from the listener.',
        'The <code>detail</code> property carries custom data with the event. Access it in the handler as <code>e.detail</code>.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'el.addEventListener(ev, fn, opts)', type: 'method', desc: 'Attach listener; opts: { once, passive, capture }' },
    { name: 'el.removeEventListener(ev, fn)',    type: 'method', desc: 'Remove listener — must be same fn reference' },
    { name: 'e.target',                          type: 'accessor', desc: 'Element that triggered the event' },
    { name: 'e.currentTarget',                   type: 'accessor', desc: 'Element the listener is attached to' },
    { name: 'e.stopPropagation()',               type: 'method', desc: 'Stop event from bubbling/capturing further' },
    { name: 'e.preventDefault()',               type: 'method', desc: 'Cancel default browser action' },
    { name: 'e.target.closest(sel)',             type: 'method', desc: 'Walk up from target to find delegating element' },
    { name: 'new CustomEvent(name, { detail, bubbles })', type: 'syntax', desc: 'Create custom event with data payload' },
    { name: 'el.dispatchEvent(event)',           type: 'method', desc: 'Fire event on element synchronously' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Event Delegation',
      language: 'typescript',
      code: `// ── Instead of one listener per button ────────────────────────────────
// ❌ Inefficient — N listeners for N buttons
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', handleClick);
});

// ✓ One listener on the parent
document.querySelector('#toolbar').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;  // clicked outside a button
  handleAction(btn.dataset.action, btn.dataset.id);
});

// Works even for dynamically added buttons!

// ── Delegation with closest for nested elements ───────────────────────
// HTML: <ul> <li class="item"> <button class="delete">×</button> </li> </ul>
document.querySelector('#list').addEventListener('click', e => {
  if (e.target.matches('.delete')) {
    const item = e.target.closest('.item');
    item?.remove();
  }

  if (e.target.matches('.edit')) {
    const item = e.target.closest('.item');
    openEditDialog(item?.dataset.id);
  }
});

// ── e.target vs e.currentTarget ──────────────────────────────────────
document.querySelector('#parent').addEventListener('click', e => {
  console.log(e.target);        // the actual clicked element (child/grandchild)
  console.log(e.currentTarget); // always #parent — where the listener lives
});`,
    },
    {
      label: 'Event Phases & Options',
      language: 'typescript',
      code: `// ── Capture vs bubble ────────────────────────────────────────────────
// <div id="outer"> <div id="inner"> <button> </button> </div> </div>

document.querySelector('#outer').addEventListener('click', e => {
  console.log('outer capture');
}, { capture: true });  // runs FIRST (capture phase)

document.querySelector('#inner').addEventListener('click', e => {
  console.log('inner bubble');
});  // runs SECOND (bubble phase, inner)

document.querySelector('#outer').addEventListener('click', e => {
  console.log('outer bubble');
});  // runs THIRD (bubble phase, outer)

// When button clicked: "outer capture" → "inner bubble" → "outer bubble"

// ── Stop propagation ─────────────────────────────────────────────────
modal.addEventListener('click', e => e.stopPropagation());  // don't close
overlay.addEventListener('click', () => closeModal());      // clicking overlay closes

// ── once, passive ─────────────────────────────────────────────────────
// Fire once and auto-remove
el.addEventListener('animationend', cleanup, { once: true });

// Passive: tell browser we won't preventDefault (enables scroll optimization)
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('touchstart', onTouch, { passive: true });

// ── preventDefault ────────────────────────────────────────────────────
form.addEventListener('submit', async e => {
  e.preventDefault();      // stop form from reloading page
  await submitViaFetch(e.target);
});

link.addEventListener('click', e => {
  e.preventDefault();      // stop navigation
  handleRouteChange(link.href);
});`,
    },
    {
      label: 'Custom Events',
      language: 'typescript',
      code: `// ── Emit a custom event ──────────────────────────────────────────────
class ShoppingCart extends HTMLElement {
  addItem(item) {
    this._items.push(item);

    // Notify listeners — they don't need to know anything about ShoppingCart internals
    this.dispatchEvent(new CustomEvent('cart:item-added', {
      bubbles: true,       // let it bubble so parent containers can listen
      cancelable: true,
      detail: { item, total: this.total() },
    }));
  }
}

// Parent container listens — works with event delegation too
document.querySelector('#app').addEventListener('cart:item-added', e => {
  updateCartBadge(e.detail.total);
  showToast(\`Added \${e.detail.item.name} to cart\`);
});

// ── Cancelable custom events ──────────────────────────────────────────
function requestDelete(itemId) {
  const event = new CustomEvent('item:delete-requested', {
    bubbles: true,
    cancelable: true,
    detail: { itemId },
  });

  const notCancelled = element.dispatchEvent(event);
  if (notCancelled) {
    performDelete(itemId);
  }
  // Other code can call e.preventDefault() to cancel the delete
}

// ── EventTarget for non-DOM objects ──────────────────────────────────
class Store extends EventTarget {
  #state = {};

  setState(patch) {
    this.#state = { ...this.#state, ...patch };
    this.dispatchEvent(new CustomEvent('change', { detail: this.#state }));
  }

  getState() { return this.#state; }
}

const store = new Store();
store.addEventListener('change', e => render(e.detail));
store.setState({ count: 0 });`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Removing a listener with a different function reference',
      wrong: `el.addEventListener('click', () => handleClick());
el.removeEventListener('click', () => handleClick());  // does nothing! New fn ref`,
      right: `const handler = () => handleClick();
el.addEventListener('click', handler);
el.removeEventListener('click', handler);  // same reference ✓`,
      explanation: 'removeEventListener must receive the exact same function reference. Arrow functions defined inline are new objects each time. Store the handler in a variable.',
    },
    {
      title: 'Confusing e.target with e.currentTarget in delegation',
      wrong: `list.addEventListener('click', e => {
  e.currentTarget.remove();  // removes the LIST, not the clicked item!
});`,
      right: `list.addEventListener('click', e => {
  const item = e.target.closest('.list-item');
  item?.remove();  // removes the specific item that was clicked
});`,
      explanation: 'e.target is the clicked element; e.currentTarget is where the listener is attached. In delegation, you want e.target (or closest) to identify the specific child.',
    },
    {
      title: 'Using innerHTML to insert event handlers',
      wrong: `container.innerHTML = \`<button onclick="handleClick('\${id}')">Click</button>\`;`,
      right: `const btn = document.createElement('button');
btn.textContent = 'Click';
btn.addEventListener('click', () => handleClick(id));
container.append(btn);`,
      explanation: 'Inline event handlers (onclick="...") are string-based, can\'t access closures, are an XSS vector, and are hard to test. Always use addEventListener.',
    },
    {
      title: 'Not using passive for scroll/touch listeners',
      wrong: `window.addEventListener('scroll', heavyHandler);
// Chrome warning: "Added non-passive event listener to a scroll-blocking event"`,
      right: `window.addEventListener('scroll', heavyHandler, { passive: true });
// Browser can scroll without waiting for JS to complete`,
      explanation: 'Without passive:true, the browser must wait for the handler to run before scrolling (to check for preventDefault). passive:true signals you won\'t call preventDefault, enabling optimized scroll.',
    },
    {
      title: 'Custom events without bubbles:true failing delegation',
      wrong: `child.dispatchEvent(new CustomEvent('my-event', { detail: data }));
// bubbles defaults to false — parent listeners never fire!`,
      right: `child.dispatchEvent(new CustomEvent('my-event', {
  bubbles: true,     // let it bubble to parent listeners
  cancelable: true,
  detail: data,
}));`,
      explanation: 'Custom events do not bubble by default (unlike most native events). Without bubbles:true, only listeners on the dispatching element itself receive the event.',
    },
    {
      title: 'Memory leak from unremoved event listeners on removed elements',
      wrong: `function mountWidget(container) {
  const el = document.createElement('div');
  document.addEventListener('keydown', handleKey);  // global listener
  container.append(el);
  // container is cleared later but handleKey still runs
}`,
      right: `function mountWidget(container) {
  const el = document.createElement('div');
  document.addEventListener('keydown', handleKey);
  container.append(el);
  return () => document.removeEventListener('keydown', handleKey);  // cleanup
}
const cleanup = mountWidget(container);
// Later: cleanup(); when container is removed`,
      explanation: 'Global event listeners (on document/window) outlive their elements. Always return a cleanup function and call it when the component unmounts.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Type-Safe Event Bus',
    language: 'typescript',
    description: 'Build an `EventBus` class that extends `EventTarget` with:\n- `emit(event, data)` — fire a typed event\n- `on(event, handler)` — subscribe, returns unsubscribe function\n- `once(event, handler)` — subscribe for one call\n- Namespaced events: `"user:login"`, `"cart:update"` etc.',
    hints: [
      'Extend EventTarget — already implements the event system',
      'emit: this.dispatchEvent(new CustomEvent(event, { detail: data, bubbles: false }))',
      'on: this.addEventListener(event, wrapper); return () => this.removeEventListener(...)',
      'once: addEventListener with { once: true }',
    ],
    starterCode: `class EventBus extends EventTarget {
  // emit, on, once
}

const bus = new EventBus();

const unsub = bus.on('user:login', (e) => {
  console.log('User logged in:', e.detail);
});

bus.once('app:ready', () => console.log('Ready!'));

bus.emit('user:login', { id: 1, name: 'Alice' });  // "User logged in: { id:1, name:'Alice' }"
bus.emit('app:ready');   // "Ready!"
bus.emit('app:ready');   // nothing — once removed

unsub();  // unsubscribe
bus.emit('user:login', { id: 2 });  // nothing — unsubscribed`,
    solution: `class EventBus extends EventTarget {
  emit(event, data) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  on(event, handler) {
    const wrapper = (e) => handler(e);
    this.addEventListener(event, wrapper);
    return () => this.removeEventListener(event, wrapper);
  }

  once(event, handler) {
    this.addEventListener(event, (e) => handler(e), { once: true });
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In what order do event phases occur?',
      options: ['bubble → target → capture', 'target → capture → bubble', 'capture → target → bubble', 'bubble → capture → target'],
      answer: 2,
      explanation: 'Events travel: capture (window → target), then target phase, then bubble (target → window). Default listeners attach to the bubble phase.',
    },
    {
      q: 'What is e.currentTarget vs e.target?',
      options: [
        'They are always the same element',
        'e.target is where listener is attached; e.currentTarget is what was clicked',
        'e.target is what was clicked; e.currentTarget is where listener is attached',
        'e.currentTarget is undefined for delegated events',
      ],
      answer: 2,
      explanation: 'e.target is the actual element that triggered the event. e.currentTarget is the element the listener is attached to. In delegation, they differ — e.currentTarget is the parent.',
    },
    {
      q: 'What does { passive: true } do in addEventListener?',
      options: [
        'Prevents the listener from being removed',
        'Makes the listener fire once',
        'Tells the browser the listener won\'t call preventDefault — enables scroll optimization',
        'Runs the listener in a Web Worker',
      ],
      answer: 2,
      explanation: 'passive:true signals the browser this listener will never call preventDefault. The browser can then start scrolling immediately without waiting for the listener, improving scroll performance.',
    },
    {
      q: 'Why do custom events need `bubbles: true`?',
      options: [
        'Custom events don\'t bubble by default — without it, only the dispatching element hears it',
        'For performance reasons',
        'Required for event delegation to work with native events',
        'bubbles:true makes events faster',
      ],
      answer: 0,
      explanation: 'Custom events have bubbles:false by default. Without bubbles:true, the event only fires on the dispatching element itself and cannot be heard by parent elements or used with delegation.',
    },
    {
      q: 'What does e.stopPropagation() do?',
      options: [
        'Cancels the browser default action',
        'Prevents the event from reaching other elements in the capture/bubble chain',
        'Removes all event listeners',
        'Prevents the event from firing on the target',
      ],
      answer: 1,
      explanation: 'stopPropagation() stops the event from traveling further through the DOM (up in bubble, down in capture). It does NOT cancel the browser default action — that requires preventDefault().',
    },
    {
      q: 'Which events do NOT bubble by default?',
      options: ['click, keydown', 'focus, blur, scroll, load, error', 'mouseover, mouseout', 'input, change'],
      answer: 1,
      explanation: 'focus, blur, scroll, load, and error do not bubble. For delegation of focus/blur, use the bubbling alternatives: focusin/focusout. scroll does not bubble on document; you need to attach the listener directly to the scrollable element.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is event delegation and when should I use it?',
      a: 'Event delegation attaches ONE listener to a parent instead of many listeners to each child. Use it when: (1) you have many similar child elements (lists, tables, grids), (2) children are dynamically added, (3) you want a single cleanup point. Use <code>e.target.closest(selector)</code> inside the handler to identify the relevant child.',
    },
    {
      q: 'What\'s the difference between stopPropagation and preventDefault?',
      a: '<code>stopPropagation()</code> stops the event from traveling to other DOM elements (up/down the tree). <code>preventDefault()</code> cancels what the browser would normally do for that event (form submit, link navigation, checkbox toggle). They are independent — you can call either, both, or neither.',
    },
    {
      q: 'Can I use EventTarget outside the DOM?',
      a: 'Yes! Any class can extend <code>EventTarget</code> to get a full event system. This is perfect for non-DOM objects like stores, services, or data models. No need for custom EventEmitter implementations — the native EventTarget is already built-in and available in modern browsers and Node.js 14+.',
    },
    {
      q: 'What is event delegation and why is it preferred for dynamic lists?',
      a: 'Event delegation attaches ONE listener to a parent instead of many listeners on individual children. The listener checks <code>event.target</code> to determine which child was clicked. Benefits: (1) works for dynamically added children automatically, (2) far fewer listeners in memory, (3) simpler cleanup. Use <code>event.target.closest(".item")</code> to safely handle clicks on nested child elements.',
    },
    {
      q: 'What is the difference between passive and non-passive event listeners?',
      a: 'Passive listeners (<code>{ passive: true }</code>) promise the browser they will never call <code>preventDefault()</code>. The browser can then scroll and animate immediately without waiting for the listener to finish — major performance win for scroll and touch events. Non-passive listeners block rendering until the callback returns. Modern browsers default scroll/touch listeners to passive; override to <code>{ passive: false }</code> only when you must call <code>preventDefault()</code>.',
    },
    {
      q: 'How do you dispatch and listen to custom events?',
      a: 'Create with <code>new CustomEvent("my-event", { detail: { data }, bubbles: true, composed: true })</code>. Dispatch with <code>element.dispatchEvent(event)</code>. Listen with <code>element.addEventListener("my-event", e => e.detail.data)</code>. <code>bubbles: true</code> makes it propagate up. <code>composed: true</code> makes it cross shadow DOM boundaries.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Events flow capture→target→bubble; delegation uses one parent listener + e.target.closest(); custom events with bubbles:true enable component communication; always store handler references for removeEventListener.',
    mustKnow: [
      'Phases: capture (window→target) → target → bubble (target→window)',
      'e.target = clicked; e.currentTarget = listener attachment point',
      'stopPropagation stops travel; preventDefault cancels browser default',
      'Event delegation: one parent listener + e.target.closest(selector)',
      'Custom events: bubbles:false by default — set bubbles:true for delegation',
      'removeEventListener requires exact same function reference — store handlers in variables',
    ],
    interviewFocus: [
      'Explain event bubbling and capture — in what order do they fire?',
      'What is event delegation and why is it efficient?',
      'Difference between stopPropagation and preventDefault',
      'How do you create and dispatch a custom event?',
    ],
  };
}
