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
  selector: 'app-html-custom-elements',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './custom-elements.html',
  styleUrl: './custom-elements.scss',
})
export class HtmlCustomElements {
  quickRef: QuickRefItem[] = [
    { name: 'customElements.define()', type: 'syntax', desc: 'Registers a custom element with the browser — name must contain a hyphen.' },
    { name: 'HTMLElement', type: 'keyword', desc: 'The base class all custom elements must extend.' },
    { name: 'attachShadow()', type: 'syntax', desc: 'Creates and attaches a shadow root to an element — takes {mode:"open"|"closed"}.' },
    { name: '<template>', type: 'syntax', desc: 'Holds inert HTML markup until cloned and inserted into the DOM via JS.' },
    { name: '<slot>', type: 'syntax', desc: 'Placeholder in shadow DOM for light DOM content projected by the consumer.' },
    { name: 'connectedCallback()', type: 'syntax', desc: 'Lifecycle hook called when the element is inserted into the DOM.' },
    { name: 'disconnectedCallback()', type: 'syntax', desc: 'Lifecycle hook called when the element is removed from the DOM — cleanup here.' },
    { name: 'observedAttributes', type: 'keyword', desc: 'Static getter returning attribute names that trigger attributeChangedCallback.' },
    { name: 'attributeChangedCallback()', type: 'syntax', desc: 'Called when an observed attribute is added, changed, or removed.' },
    { name: ':host', type: 'syntax', desc: 'CSS selector inside shadow root that targets the custom element itself.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Custom Elements — Define Your Own HTML Tags',
      points: [
        'customElements.define(name, class) registers a new tag with the browser — the name must contain at least one hyphen (e.g., my-card) to avoid collisions with current and future native elements.',
        'Autonomous custom elements extend HTMLElement directly and behave like any block or inline element; customized built-in elements extend a specific tag (e.g., extends HTMLButtonElement) but have limited browser support.',
        'The constructor must call super() as its first statement — skipping it throws a ReferenceError because HTMLElement base class setup is required before accessing this.',
        'Shadow DOM and template setup belong in the constructor; side effects like network requests belong in connectedCallback when the element is actually in the document.',
        'customElements.whenDefined(name) returns a Promise that resolves once the element is registered — useful for waiting on deferred upgrades.',
      ],
    },
    {
      heading: 'Shadow DOM — Encapsulated DOM Subtrees',
      points: [
        'attachShadow({ mode: "open" }) creates a shadow root where internal markup and styles are encapsulated — "open" allows external JS to read element.shadowRoot, "closed" hides it.',
        'Styles defined inside the shadow root do not leak out to the rest of the page, and global stylesheets cannot reach elements inside the shadow root by default.',
        ':host selector targets the custom element itself from within its own shadow root — useful for display, margin, and CSS custom property defaults.',
        '::slotted(selector) styles light DOM nodes projected into named or default slots — only direct children of slots can be targeted, not descendants.',
        'CSS custom properties (--my-color) pierce the shadow boundary — the consumer can theme a component from outside by setting variables that the internal styles consume.',
      ],
    },
    {
      heading: 'HTML Templates and Slots',
      points: [
        'The <template> element is completely inert — its content is parsed but not rendered, not executed, and not resource-fetched until cloned via JavaScript.',
        'template.content.cloneNode(true) creates a deep copy of the template fragment ready to insert into the shadow root — you must use cloneNode, not appendChild(template) directly.',
        '<slot> elements act as named or default insertion points for light DOM content that consumers place between the opening and closing tags of the custom element.',
        'Named slots (<slot name="title">) require the consumer to explicitly assign content with slot="title" on the child element; the default slot catches everything unassigned.',
        'Slot content lives in the light DOM (it is part of the host document) and is merely projected visually into the shadow root — events bubble through the slot into the host.',
      ],
    },
    {
      heading: 'Lifecycle Callbacks',
      points: [
        'connectedCallback fires each time the element is inserted into a connected document — it may fire multiple times if the element is moved around the DOM.',
        'disconnectedCallback fires each time the element is removed — the right place to clean up event listeners, timers, and observers to prevent memory leaks.',
        'attributeChangedCallback(name, oldValue, newValue) fires only for attributes listed in the static observedAttributes getter — it will not fire for any attribute not in that array.',
        'adoptedCallback fires when the element is moved to a different Document (e.g., into an iframe) — rare in practice but useful for cross-document widget libraries.',
        'Upgrade order: constructor → attributeChangedCallback (for attributes already in HTML) → connectedCallback — any attributeChangedCallback calls before connectedCallback mean the element is not yet in the document.',
      ],
    },
    {
      heading: 'Web Components vs Frameworks',
      points: [
        'Web Components are native browser standards — they require no build step, no runtime, and work in any framework (React, Angular, Vue) or vanilla HTML.',
        'True style and DOM encapsulation with Shadow DOM is something no JS framework can replicate — frameworks simulate it with scope attributes or CSS-in-JS, Web Components enforce it at the browser level.',
        'Limitations: no built-in reactivity (state changes require manual re-renders), no server-side rendering support in the spec itself, and tooling/DX is less mature than major frameworks.',
        'Progressive enhancement use case: ship a Web Component as a standalone <script> drop-in for teams using any stack — Angular/React wrap it in a component adapter with minimal effort.',
        'For complex applications with rich state, routing, and forms, a full framework will always outperform hand-rolled Web Components — use Web Components for leaf-node UI elements, not application shells.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic custom element',
      language: 'typescript',
      code: `// Autonomous custom element — extends HTMLElement directly
class MyButton extends HTMLElement {
  constructor() {
    super(); // Always first — sets up the HTMLElement base

    // Safe to set up shadow DOM in constructor
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = \`
      <style>
        button {
          padding: 10px 20px;
          background: #e34c26;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        }
        button:hover { background: #c0392b; }
        button[disabled] { opacity: 0.5; cursor: not-allowed; }
      </style>
      <button><slot>Click me</slot></button>
    \`;
  }

  // connectedCallback: element is in the DOM — safe for side effects
  connectedCallback() {
    const btn = this.shadowRoot.querySelector('button');
    btn.disabled = this.hasAttribute('disabled');
    btn.addEventListener('click', this._handleClick.bind(this));
  }

  disconnectedCallback() {
    // Clean up listeners — element is leaving the DOM
    const btn = this.shadowRoot.querySelector('button');
    btn?.removeEventListener('click', this._handleClick);
  }

  _handleClick(e) {
    // Dispatch a custom event that bubbles out of the shadow root
    this.dispatchEvent(new CustomEvent('my-click', {
      bubbles: true, composed: true, detail: { time: Date.now() }
    }));
  }
}

// Register — name MUST contain a hyphen
customElements.define('my-button', MyButton);

// Usage: <my-button>Save</my-button>`,
    },
    {
      label: 'Shadow DOM with slots',
      language: 'typescript',
      code: `// Component with named + default slots and CSS custom properties
class InfoCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Use <template> for reusable structure
    const template = document.createElement('template');
    template.innerHTML = \`
      <style>
        :host {
          display: block;
          border: 1px solid var(--card-border, #ddd);
          border-radius: 8px;
          overflow: hidden;
          font-family: sans-serif;
        }
        .header {
          background: var(--card-accent, #e34c26);
          color: white;
          padding: 12px 16px;
          font-weight: bold;
        }
        .body {
          padding: 16px;
          color: var(--card-text, #333);
          line-height: 1.6;
        }
        .footer {
          border-top: 1px solid #eee;
          padding: 10px 16px;
          font-size: 0.85rem;
          color: #888;
        }
        /* Style slotted direct children */
        ::slotted(img) { max-width: 100%; border-radius: 4px; }
        ::slotted(p)   { margin: 0; }
      </style>

      <div class="header"><slot name="title">Card Title</slot></div>
      <div class="body"><slot></slot></div>       <!-- default slot -->
      <div class="footer"><slot name="footer"></slot></div>
    \`;

    // Must clone — not append the template element itself
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('info-card', InfoCard);

/* HTML usage:
<info-card style="--card-accent: #6b21a8;">
  <span slot="title">My Card</span>
  <p>This goes into the default slot.</p>
  <img src="photo.jpg">         <!-- also default slot -->
  <span slot="footer">Last updated: today</span>
</info-card>
*/`,
    },
    {
      label: 'Attributes & lifecycle',
      language: 'typescript',
      code: `// Reactive component — updates on attribute changes
class StatusBadge extends HTMLElement {

  // Declare which attributes trigger attributeChangedCallback
  static get observedAttributes() {
    return ['status', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // Called each time element is inserted into a connected document
  connectedCallback() {
    this._render();
    console.log('StatusBadge connected — route safe for fetch here');
  }

  // Called when element is removed — clean up resources
  disconnectedCallback() {
    clearInterval(this._timer);
  }

  // Called ONLY for attributes in observedAttributes
  // Also fires during upgrade for attributes already in HTML
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this._render();
  }

  _render() {
    const status = this.getAttribute('status') ?? 'unknown';
    const label  = this.getAttribute('label')  ?? status;

    const colours = { success: '#16a34a', warning: '#d97706', error: '#dc2626', unknown: '#6b7280' };
    const bg = colours[status] ?? colours.unknown;

    this.shadowRoot.innerHTML = \`
      <style>
        :host { display: inline-block; }
        span {
          padding: 2px 10px;
          border-radius: 999px;
          background: \${bg};
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
        }
      </style>
      <span role="status" aria-live="polite">\${label}</span>
    \`;
  }
}

customElements.define('status-badge', StatusBadge);

// Attribute changes re-render automatically:
// const badge = document.querySelector('status-badge');
// badge.setAttribute('status', 'error'); // triggers attributeChangedCallback`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Missing super() in constructor',
      wrong: `class MyEl extends HTMLElement {
  constructor() { this.attachShadow({mode:'open'}); }
}`,
      right: `class MyEl extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); }
}`,
      explanation: 'super() must be the very first statement in a custom element constructor. Without it, this is undefined and any access (including attachShadow) throws a ReferenceError.',
    },
    {
      title: 'Custom element name missing hyphen',
      wrong: `customElements.define('mybutton', MyButton);`,
      right: `customElements.define('my-button', MyButton);`,
      explanation: 'The Web Components spec requires a hyphen in the element name. This prevents collisions with current and future native HTML elements. The browser throws a SyntaxError for names without a hyphen.',
    },
    {
      title: 'Using appendChild on template instead of cloneNode',
      wrong: `this.shadowRoot.appendChild(template.content);`,
      right: `this.shadowRoot.appendChild(template.content.cloneNode(true));`,
      explanation: 'template.content is a DocumentFragment — appending it moves the nodes (they are consumed). The second time you create an instance of the element the template is empty. cloneNode(true) creates a deep copy each time.',
    },
    {
      title: 'attributeChangedCallback without observedAttributes',
      wrong: `attributeChangedCallback(name, old, newVal) { this.render(); }
// (no observedAttributes getter)`,
      right: `static get observedAttributes() { return ['color', 'label']; }
attributeChangedCallback(name, old, newVal) { this.render(); }`,
      explanation: 'attributeChangedCallback is never called unless you declare which attributes to observe in the static observedAttributes getter. Without it, attribute changes are silently ignored.',
    },
    {
      title: 'Forgetting composed:true on custom events',
      wrong: `this.dispatchEvent(new CustomEvent('change', { bubbles: true }));`,
      right: `this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));`,
      explanation: 'Events dispatched inside a shadow root do not cross the shadow boundary by default. Without composed:true the event stops at the shadow root and parent document listeners never receive it.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a <user-card> custom element',
    language: 'typescript',
    description: 'Create a custom element <user-card> that: (1) accepts name, role, and avatar attributes; (2) renders with Shadow DOM (open mode) using a <template>; (3) updates the display reactively when attributes change; (4) dispatches a custom "card-click" event (bubbles + composed) when clicked.',
    hints: [
      'Custom element names must contain a hyphen',
      'Declare name/role/avatar in observedAttributes to react to changes',
      'Use composed:true on the dispatched event so it crosses the shadow boundary',
      'cloneNode(true) on template.content — not appendChild(template)',
    ],
    starterCode: `const template = document.createElement('template');
template.innerHTML = \`
  <style>
    /* add :host and card styles here */
  </style>
  <div class="card">
    <!-- add img and text slots here -->
  </div>
\`;

class UserCard extends HTMLElement {
  static get observedAttributes() {
    // list attributes here
  }

  constructor() {
    super();
    // attach shadow, clone template
  }

  connectedCallback() {
    // first render + click listener
  }

  attributeChangedCallback() {
    // re-render on attr change
  }

  _render() {
    // read attrs and update shadowRoot
  }
}

customElements.define('user-card', UserCard);`,
    solution: `const template = document.createElement('template');
template.innerHTML = \`
  <style>
    :host { display: block; font-family: sans-serif; cursor: pointer; }
    .card { display: flex; align-items: center; gap: 12px; padding: 12px;
            border: 1px solid #ddd; border-radius: 8px; }
    img   { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .name { font-weight: bold; }
    .role { font-size: 0.85rem; color: #666; }
  </style>
  <div class="card">
    <img id="avatar" src="" alt="">
    <div><div class="name" id="name"></div><div class="role" id="role"></div></div>
  </div>
\`;

class UserCard extends HTMLElement {
  static get observedAttributes() { return ['name', 'role', 'avatar']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this._render();
    this.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('card-click', {
        bubbles: true, composed: true,
        detail: { name: this.getAttribute('name') }
      }));
    });
  }

  attributeChangedCallback() { this._render(); }

  _render() {
    const sr = this.shadowRoot;
    sr.getElementById('name').textContent  = this.getAttribute('name')   ?? 'Anonymous';
    sr.getElementById('role').textContent  = this.getAttribute('role')   ?? 'Member';
    const img = sr.getElementById('avatar');
    img.src = this.getAttribute('avatar') ?? '';
    img.alt = this.getAttribute('name')   ?? '';
  }
}

customElements.define('user-card', UserCard);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which method is called when a custom element is removed from the DOM?',
      options: ['disconnectedCallback', 'willRemoveCallback', 'removedCallback', 'unmount'],
      answer: 0,
      explanation: 'disconnectedCallback is the standard lifecycle hook for cleanup — the right place to remove event listeners, clear timers, and disconnect observers.',
    },
    {
      q: 'What does customElements.define() throw if the same name is registered twice?',
      options: ['It silently ignores the second call', 'A DOMException (NotSupportedError)', 'A TypeError', 'A SyntaxError'],
      answer: 1,
      explanation: 'Attempting to register a name that is already registered throws a DOMException with type "NotSupportedError". Each name can only be registered once per document.',
    },
    {
      q: 'Which CSS selector targets the custom element host from inside its shadow root?',
      options: [':root', ':shadow', ':host', '::part'],
      answer: 2,
      explanation: ':host selects the shadow host element (the custom element itself) from within its own shadow DOM. It is the correct way to set display, margin, and default CSS custom properties.',
    },
    {
      q: 'What is the correct way to clone and use template content?',
      options: [
        'shadowRoot.appendChild(template)',
        'shadowRoot.innerHTML = template.outerHTML',
        'shadowRoot.appendChild(template.content.cloneNode(true))',
        'shadowRoot.insertAdjacentHTML("beforeend", template.innerHTML)',
      ],
      answer: 2,
      explanation: 'template.content is a DocumentFragment. appendChild moves (consumes) it, so you must cloneNode(true) for a deep copy. The template element itself has no visual content — only its .content does.',
    },
    {
      q: 'Why must custom element names contain a hyphen?',
      options: [
        'It is a CSS convention for web components',
        'It prevents collisions with current and future native HTML elements',
        'The JavaScript parser requires it for class detection',
        'It enables Shadow DOM mode automatically',
      ],
      answer: 1,
      explanation: 'The HTML spec guarantees that native elements will never contain a hyphen. Requiring it in custom element names creates a permanent safe namespace and allows parsers to distinguish them without ambiguity.',
    },
    {
      q: 'What is the difference between open and closed Shadow DOM mode?',
      options: ['open allows external JS to access shadowRoot; closed returns null to external JS', 'closed is faster', 'open requires polyfills', 'closed allows CSS variables to pierce the boundary'],
      answer: 0,
      explanation: 'attachShadow({ mode: "open" }) makes element.shadowRoot accessible to external JS. attachShadow({ mode: "closed" }) returns null — the reference is lost unless the component stores it internally. Closed mode is NOT a true security boundary; determined code can still access the shadow root via devtools or monkey-patching.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should you choose Web Components over a framework like React or Angular?',
      a: 'Web Components are the right choice when you need truly framework-agnostic UI widgets that work across multiple tech stacks — for example, a design system shared between a React SPA and an Angular admin panel. They are also ideal for drop-in widgets that run without a build pipeline. Choose a framework for full applications that need routing, form handling, complex state, and SSR.',
    },
    {
      q: 'What is the difference between Shadow DOM open and closed modes?',
      a: 'In "open" mode, element.shadowRoot returns the shadow root, allowing external JavaScript to read and manipulate it. In "closed" mode, element.shadowRoot returns null — the reference is hidden from outside code. Closed mode provides stronger encapsulation but prevents third-party accessibility tools and test libraries from inspecting the shadow tree. Most components use "open" for better interoperability.',
    },
    {
      q: 'How do slots differ from setting innerHTML directly for content projection?',
      a: 'Slots project light DOM nodes — they remain in the host document\'s DOM and simply appear inside the shadow root visually. Their events bubble normally, their styles can be set from the consumer\'s stylesheet (with ::slotted limits), and they update reactively when the light DOM changes. innerHTML replaces content statically, destroys existing nodes and their listeners, and creates new nodes owned by the shadow root.',
    },
    {
      q: 'How do you communicate from a Web Component to its parent document?',
      a: 'Dispatch a CustomEvent with both bubbles: true and composed: true. The composed flag is essential — without it, the event stops at the shadow root boundary and never reaches parent document listeners. The parent listens with element.addEventListener("my-event", handler). You can also expose properties and methods directly (element.open() etc.) since the custom element is a plain JavaScript object.',
    },
    {
      q: 'What are CSS custom properties (variables) and do they pierce Shadow DOM?',
      a: 'CSS custom properties (--color-primary: #f00) DO cross shadow DOM boundaries — they are inherited and cascade into shadow trees. This is the intended mechanism for theming web components: the host page defines design tokens, the component uses var(--color-primary, fallback). Contrast with regular CSS selectors and classes, which are scoped and do NOT pierce shadow DOM.',
    },
    {
      q: 'How do you register a custom element as an upgrade of an existing HTML element (customised built-ins)?',
      a: 'Pass an extends option: <code>customElements.define("my-button", MyButton, { extends: "button" })</code> and use <code>&lt;button is="my-button"&gt;</code> in HTML. Customised built-ins extend native elements and inherit all their semantics and accessibility — a great pattern for progressively enhancing a native element. Note: Safari requires a polyfill (Apple objects to the spec) so autonomous custom elements (extending HTMLElement) are more portable today.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Web Components combine Custom Elements, Shadow DOM, and HTML Templates to build encapsulated, reusable UI widgets that work natively in any browser and any framework.',
    mustKnow: [
      'Custom element names must contain a hyphen — the browser throws SyntaxError without it',
      'super() must be the first line in the constructor before any this access',
      'Use template.content.cloneNode(true) — appending template.content directly consumes it',
      'observedAttributes static getter is required for attributeChangedCallback to fire',
      'Events dispatched inside shadow DOM need composed:true to cross the shadow boundary',
      'Shadow DOM "open" vs "closed" controls whether element.shadowRoot is externally readable',
    ],
    interviewFocus: [
      'What are the three pillars of Web Components and what does each provide?',
      'Why is cloneNode(true) required when using <template> content?',
      'How do you make a custom event visible to listeners outside the shadow root?',
      'When would you choose Web Components over a JS framework, and vice versa?',
    ],
  };
}
