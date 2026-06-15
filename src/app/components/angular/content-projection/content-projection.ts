import { Component, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { CardComponent } from './card/card';
import { AlertComponent } from './alert/alert';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-content-projection',
  imports: [TitleCasePipe, CodeBlockComponent, TheoryBlockComponent, CardComponent, AlertComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './content-projection.html',
  styleUrl: './content-projection.scss',
})
export class ContentProjectionDemo {
  alertType = signal<'info' | 'success' | 'warning' | 'danger'>('info');
  showGroup = signal(true);

  prerequisites: Prerequisite[] = [
    { label: 'Components', route: '/angular/components' },
    { label: 'Parent-Child Communication', route: '/angular/parent-child' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is content projection?',
      points: [
        'Content projection lets a parent component pass markup INTO a child\'s template through <code>&lt;ng-content /&gt;</code> — similar to React\'s <code>children</code> prop or HTML\'s <code>&lt;slot&gt;</code> element in web components.',
        'Angular replaces <code>&lt;ng-content /&gt;</code> with the markup placed between the child\'s opening and closing tags in the parent template — at exactly that point in the child\'s layout.',
        'Projected content belongs to the <strong>parent\'s</strong> change detection context, not the child\'s. Even if the child uses <code>OnPush</code>, Angular runs projected content on the parent\'s change detection cycle.',
        'You cannot project content into a component that has no <code>&lt;ng-content /&gt;</code> in its template — Angular silently discards it rather than throwing an error, which can cause confusing blank areas.',
        'There are three flavours: basic single-slot, multi-slot (named slots via <code>select</code>), and template-based projection via <code>NgTemplateOutlet</code> — a critical pattern for reusable tables, lists, and virtual scroll.',
      ],
    },
    {
      heading: 'Multi-slot projection with select',
      points: [
        'Add a <code>select</code> attribute to route specific projected elements into distinct slots: <code>&lt;ng-content select="[card-header]" /&gt;</code> captures only elements tagged with <code>card-header</code>.',
        'The selector is a CSS selector — attribute selectors (<code>[attr]</code>), class selectors (<code>.class</code>), and element selectors (<code>tag</code>) are all valid. Angular evaluates it against the <strong>top-level</strong> projected children only.',
        'A plain <code>&lt;ng-content /&gt;</code> with no <code>select</code> is the catch-all slot — it receives all content that didn\'t match any named slot. Only ONE default slot per template is allowed; a second default slot causes a compile error.',
        'Slots render projected content in the order the CHILD template defines them, NOT the order the parent provided the elements. This is a common source of unexpected render order.',
        'The <code>select</code> attribute is evaluated at compile time — it cannot be dynamically changed at runtime. For dynamic slot routing, use <code>NgTemplateOutlet</code> with conditional logic.',
      ],
    },
    {
      heading: 'ngProjectAs and slot routing edge cases',
      points: [
        '<code>ngProjectAs="[selector]"</code> overrides which slot a projected element is routed into — it tells Angular to treat that element AS IF it had the specified attribute or class.',
        'The classic use case: wrapping siblings in <code>&lt;ng-container&gt;</code> breaks slot matching because <code>ng-container</code> itself has no attributes. Adding <code>ngProjectAs="[card-header]"</code> restores the match.',
        'Angular evaluates the <code>select</code> attribute against the OUTERMOST element of the projected subtree. Attributes on inner (nested) elements are invisible to the slot selector.',
        'Element type selectors also work: <code>select="app-tab-title"</code> captures <code>&lt;app-tab-title&gt;</code> components projected by the parent — enabling composite component APIs (tabs, stepper steps).',
        'Content that doesn\'t match any named slot is silently discarded if no default slot exists. This silent failure makes debugging multi-slot issues difficult — always include a default fallback slot.',
      ],
    },
    {
      heading: 'ng-template and NgTemplateOutlet',
      points: [
        '<code>&lt;ng-template&gt;</code> defines a lazy template fragment — Angular does NOT render it until explicitly instantiated. Nothing appears in the DOM at the <code>&lt;ng-template&gt;</code> location.',
        '<code>*ngTemplateOutlet="myTpl; context: { $implicit: item }"</code> renders the template at that point. The context object\'s properties bind with <code>let-varName</code> declarations on the <code>&lt;ng-template&gt;</code>.',
        'Pass a <code>TemplateRef</code> as a signal input: <code>rowTemplate = input&lt;TemplateRef&lt;any&gt; | null&gt;(null)</code>. The parent supplies the template; the child renders it. This powers virtual scroll, data tables, and any component needing user-defined render logic.',
        '<code>let-item</code> on <code>&lt;ng-template&gt;</code> binds <code>context.$implicit</code>; <code>let-x="propName"</code> binds a named context property. Use named props when passing multiple variables in one context.',
        '<code>ng-template</code> is the invisible host element for ALL structural directives — <code>@if</code>, <code>@for</code>, <code>*ngIf</code>, <code>*ngFor</code> all expand to <code>&lt;ng-template&gt;</code> under the hood. This is why only one structural directive per element is allowed.',
      ],
    },
    {
      heading: 'ng-container — zero-DOM grouping',
      points: [
        '<code>&lt;ng-container&gt;</code> renders its children directly into the DOM without emitting any wrapper element — the Angular equivalent of React\'s <code>&lt;&gt;...&lt;/&gt;</code> fragment.',
        'Use it when a wrapper element would break layout: inside <code>&lt;table&gt;</code> (which disallows arbitrary <code>&lt;div&gt;</code>), inside <code>&lt;ul&gt;</code>/<code>&lt;ol&gt;</code>, or within flex/grid containers where extra nodes affect spacing.',
        'Multiple structural directives (<code>*ngIf</code> + <code>*ngFor</code>) cannot coexist on the same element — nest them in separate <code>&lt;ng-container&gt;</code> elements to apply each independently without adding real DOM.',
        '<code>&lt;ng-container *ngTemplateOutlet="tpl" /&gt;</code> renders a template at a precise location without inserting any real DOM node at that point — ideal for optional template injection.',
        '<code>&lt;ng-container ngProjectAs="[slot]"&gt;</code> groups multiple siblings into one logical projected group that matches a named slot — without polluting the DOM with a wrapper element.',
      ],
    },
    {
      heading: 'contentChild() / contentChildren() and the content lifecycle',
      points: [
        '<code>contentChild(token)</code> returns a <code>Signal&lt;T | undefined&gt;</code> for the first projected element matching the token. <code>contentChildren(token)</code> returns <code>Signal&lt;readonly T[]&gt;</code> for all matches.',
        'Both queries become available after <code>ngAfterContentInit</code>. Reading them in <code>ngOnInit</code> returns <code>undefined</code>/<code>[]</code> — Angular has not yet inserted the projected nodes.',
        '<code>contentChild()</code> queries elements projected INTO the component via <code>&lt;ng-content&gt;</code>. <code>viewChild()</code> queries elements in the component\'s OWN template. Never swap these — they query fundamentally different subtrees.',
        '<code>contentChild.required(token)</code> asserts that at least one matching element is always projected. Angular reports a runtime error if the parent omits it — useful for enforcing component API contracts.',
        'Use the <code>read</code> option to retrieve a different type from the same query: <code>contentChild(\'ref\', { read: ElementRef })</code> returns the underlying <code>ElementRef</code> rather than the component instance.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is content projection?', a: 'Content projection passes child elements from a parent into a component\'s template using <code>&lt;ng-content&gt;</code>. It is similar to HTML slot elements or React\'s <code>children</code> prop.' },
    { q: 'How do you do multi-slot projection?', a: 'Add a <code>select</code> attribute to each <code>&lt;ng-content&gt;</code>: <code>&lt;ng-content select="[header]"&gt;</code>. The parent marks content with that attribute: <code>&lt;h1 header&gt;Title&lt;/h1&gt;</code>.' },
    { q: 'What is ngProjectAs?', a: '<code>ngProjectAs="selector"</code> on an element makes it project as if it matched the given selector — useful when wrapping content in <code>&lt;ng-container&gt;</code> and the wrapper would break selector matching.' },
    { q: 'What is the difference between ng-content and ng-template?', a: '<code>&lt;ng-content&gt;</code> projects host content into the component at the slot location. <code>&lt;ng-template&gt;</code> defines a reusable template fragment that is rendered on demand by <code>*ngTemplateOutlet</code> or structural directives.' },
    { q: 'Does projected content belong to the host or the child?', a: 'Projected content belongs to the <strong>host (parent)</strong>\'s change detection context, not the child component. This means the parent\'s change detection runs the projected content — not the child\'s OnPush cycle.' },
    { q: 'Can you query projected content with viewChild?', a: 'No — use <code>contentChild()</code> or <code>contentChildren()</code> to query projected content. <code>viewChild()</code> only queries elements defined in the component\'s own template.' },
    { q: 'How do you pass a custom row template from a parent into a data table component for rendering?', a: 'In the child, declare <code>rowTemplate = input&lt;TemplateRef&lt;any&gt; | null&gt;(null)</code>. In the child template: <code>&lt;ng-container *ngTemplateOutlet="rowTemplate(); context: { $implicit: row }" /&gt;</code>. The parent passes <code>[rowTemplate]="myTpl"</code> with an <code>&lt;ng-template #myTpl let-row&gt;{{ row.name }}&lt;/ng-template&gt;</code>. This pattern enables fully customisable render logic without coupling the table to specific content.' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic ng-content',
      language: 'html',
      code: `<!-- Child component template -->
<div class="card">
  <ng-content />   <!-- everything between tags goes here -->
</div>

<!-- Parent usage -->
<app-card>
  <h2>Title</h2>
  <p>Any HTML or components</p>
</app-card>`,
    },
    {
      label: 'Multi-slot (select)',
      language: 'html',
      code: `<!-- Named slots via CSS attribute selectors -->
<div class="panel">
  <header><ng-content select="[card-header]" /></header>
  <main>  <ng-content select="[card-body]"   /></main>
  <footer><ng-content select="[card-footer]" /></footer>
</div>

<!-- Parent — tag content with matching attributes -->
<app-panel>
  <h2 card-header>Title</h2>
  <p  card-body>Body content</p>
  <button card-footer>Save</button>
</app-panel>`,
    },
    {
      label: 'ng-template',
      language: 'html',
      code: `<!-- ng-template defines a fragment — NOT rendered until used -->
<ng-template #greet let-name="name">
  <p>Hello, {{ name }}!</p>
</ng-template>

<!-- Render with NgTemplateOutlet -->
<ng-container *ngTemplateOutlet="greet; context: { name: 'World' }" />

<!-- Pass as input to a child component -->
<app-table [rowTemplate]="greet" [data]="rows" />`,
    },
    {
      label: 'ng-container',
      language: 'html',
      code: `<!-- ng-container = zero DOM output, just a logical wrapper -->

<!-- Group elements without a wrapper div -->
@if (isAdmin) {
  <ng-container>
    <app-admin-nav />
    <app-admin-panel />
  </ng-container>
}

<!-- Combine structural directives (one per element rule) -->
<ng-container *ngTemplateOutlet="tpl; context: ctx" />

<!-- Safe in table/flex layouts where extra divs break styling -->
<table>
  <ng-container>
    <tr><td>Row 1</td></tr>
    <tr><td>Row 2</td></tr>
  </ng-container>
</table>`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What happens to content placed between a child component\'s opening and closing tags when the child template has a plain <ng-content /> with no select attribute?', options: ['It is ignored and not rendered anywhere', 'It replaces the <ng-content /> element in the child\'s template', 'It is rendered after the child component\'s host element', 'It throws a compile-time error'], answer: 1, explanation: 'Angular replaces <ng-content /> with the markup placed between the child component\'s opening and closing tags. The projected content appears exactly where <ng-content /> sits inside the child template.' },
    { q: 'Which change detection context owns projected content — the parent or the child component?', options: ['The child component that defines the ng-content slot', 'Both parent and child share ownership equally', 'The parent (host) component that provides the projected content', 'A separate detached change detection zone created by Angular'], answer: 2, explanation: 'Projected content belongs to the parent (host) component\'s change detection context, not the child\'s. This means even if the child uses OnPush, the projected content runs on the parent\'s change detection cycle.' },
    { q: 'In multi-slot projection, what kind of value does the select attribute on <ng-content> accept?', options: ['A template reference variable name, e.g. select="#myRef"', 'A CSS selector such as an attribute, class, or element selector', 'An Angular directive name', 'A component @Input() property name'], answer: 1, explanation: 'The select attribute accepts CSS selectors — attribute selectors like [card-header], class selectors like .header, or element selectors. The parent marks its content with matching attributes or classes so Angular routes it to the correct slot.' },
    { q: 'You wrap projected content in <ng-container> and it stops matching the child\'s select="[card-header]" slot. What attribute fixes this without removing the ng-container wrapper?', options: ['projectTo="[card-header]"', 'ngContentSelect="[card-header]"', 'ngProjectAs="[card-header]"', 'slotAs="card-header"'], answer: 2, explanation: 'ngProjectAs overrides which selector a projected element matches. Placing ngProjectAs="[card-header]" on the <ng-container> tells Angular to treat that wrapper as if it were an element with the card-header attribute, restoring correct slot routing.' },
    { q: 'Which hook is the earliest lifecycle point at which contentChild() / contentChildren() queries are fully resolved and safe to use?', options: ['ngOnInit', 'ngOnChanges', 'ngAfterViewInit', 'ngAfterContentInit'], answer: 3, explanation: 'contentChild() and contentChildren() queries become available after ngAfterContentInit. At ngOnInit the projected content has not yet been initialised, so queries would return undefined or empty results.' },
    { q: 'A parent projects three sibling elements into a named slot using <ng-container ngProjectAs="[card-header]">. What role does ngProjectAs play here?', options: ['It tells Angular to create a new change detection scope for the group', 'It makes Angular treat the ng-container as if it had the card-header attribute, so all its children project into the [card-header] slot', 'It is the same as adding card-header to each child element individually', 'It enables the ng-container to render an actual DOM wrapper that matches the slot'], answer: 1, explanation: 'Angular evaluates slot selectors against the OUTERMOST projected element. A bare ng-container has no attributes, so its children would miss the [card-header] slot. ngProjectAs="[card-header]" tells Angular to treat the ng-container as if it had that attribute, routing the entire group into the correct slot.' },
    { q: 'Why can you not apply two structural directives like *ngIf and *ngFor to the same element?', options: ['Angular only allows one structural directive import per NgModule', 'Structural directives expand to ng-template wrappers; two on the same element would create conflicting template nesting', 'It is a TypeScript limitation — two decorators cannot coexist on one class property', 'They cancel each other out and render nothing'], answer: 1, explanation: '*ngIf and *ngFor both expand to <ng-template> wrappers at compile time. If both targeted the same element, they would conflict about which template wraps which. The fix is nested <ng-container> elements: one hosts *ngIf and the inner one hosts *ngFor.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ng-content', type: 'directive', desc: 'Slot element that marks where projected content from the parent is inserted into the child component template.', since: '2' },
    { name: 'select', type: 'directive', desc: 'Attribute on ng-content that accepts a CSS selector to route only matching projected elements into that slot.', since: '2' },
    { name: 'ngProjectAs', type: 'directive', desc: 'Overrides which ng-content select slot a projected element or ng-container matches, bypassing native tag/attribute matching.', since: '2' },
    { name: 'ng-template', type: 'directive', desc: 'Defines a lazy template fragment that is not rendered until instantiated via NgTemplateOutlet or a structural directive.', since: '2' },
    { name: 'ng-container', type: 'directive', desc: 'A zero-DOM logical wrapper that groups elements or hosts a directive without emitting a real DOM element.', since: '2' },
    { name: 'NgTemplateOutlet', type: 'directive', desc: 'Renders an ng-template reference at a given location, optionally passing a context object with let-variable bindings.', since: '2' },
    { name: 'contentChild', type: 'function', desc: 'Signal-based query that returns the first projected content element matching a selector, available after ngAfterContentInit.', since: '17' },
    { name: 'contentChildren', type: 'function', desc: 'Signal-based query that returns all projected content elements matching a selector as a readonly signal array.', since: '17' },
    { name: 'ngAfterContentInit', type: 'hook', desc: 'Lifecycle hook that fires after Angular fully initialises projected content, making contentChild and contentChildren safe to read.', since: '2' },
    { name: 'TemplateRef', type: 'class', desc: 'A reference to an ng-template that can be passed as an @Input or inject()-ed and rendered programmatically.', since: '2' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Querying projected content: @ContentChild decorator vs contentChild() signal',
      before: `import { ContentChild, AfterContentInit } from '@angular/core';

@ContentChild('myRef') myEl: ElementRef | undefined;

ngAfterContentInit() {
  console.log(this.myEl?.nativeElement);
}`,
      after: `import { contentChild, ElementRef } from '@angular/core';

myEl = contentChild<ElementRef>('myRef');

// reactive — no lifecycle hook needed
value = computed(() => this.myEl()?.nativeElement);`,
      note: 'contentChild() returns a signal; the decorator-based @ContentChild requires a lifecycle hook to be safe.',
    },
    {
      title: 'Passing templates: @Input TemplateRef decorator vs input() signal',
      before: `import { Input, TemplateRef } from '@angular/core';

@Input() rowTemplate: TemplateRef<any> | null = null;

// template
// <ng-container *ngTemplateOutlet='rowTemplate' />`,
      after: `import { input, TemplateRef } from '@angular/core';

rowTemplate = input<TemplateRef<any> | null>(null);

// template
// <ng-container *ngTemplateOutlet='rowTemplate()' />`,
      note: 'Signal-based input() removes the need for the @Input decorator and integrates with the reactive graph.',
    },
    {
      title: 'Grouping projected elements: extra wrapper div vs ng-container',
      before: `<!-- adds a real DOM element that may break flex/grid or table layouts -->
<div>
  <span card-header>Title</span>
  <small card-header>Subtitle</small>
</div>`,
      after: `<!-- ng-container projects both children without emitting a DOM node -->
<ng-container ngProjectAs='[card-header]'>
  <span>Title</span>
  <small>Subtitle</small>
</ng-container>`,
      note: 'Use ng-container + ngProjectAs when you need to group multiple nodes into one named slot without polluting the DOM.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Multiple default ng-content slots (no select)',
      wrong: `<!-- ERROR: two catch-all slots — only one is allowed -->
<ng-content />
<ng-content />`,
      right: `<!-- One default slot; named slots use select -->
<ng-content select='[card-header]' />
<ng-content />`,
      explanation: 'Angular allows only one ng-content without a select attribute per component template. A second default slot is a compile-time error.',
    },
    {
      title: 'Using viewChild() instead of contentChild() for projected elements',
      wrong: `// viewChild only sees elements in the component's OWN template
headerEl = viewChild<ElementRef>('header');`,
      right: `// contentChild queries elements projected FROM the parent
headerEl = contentChild<ElementRef>('header');`,
      explanation: 'viewChild() only queries the component\'s own template. Projected content must be queried with contentChild() or contentChildren().',
    },
    {
      title: 'Expecting ng-container to match a named slot without ngProjectAs',
      wrong: `<!-- ng-container itself has no [card-header] attribute, so nothing projects -->
<ng-container>
  <h2 card-header>Title</h2>
</ng-container>`,
      right: `<!-- ngProjectAs makes Angular treat the wrapper as [card-header] -->
<ng-container ngProjectAs='[card-header]'>
  <h2>Title</h2>
</ng-container>`,
      explanation: 'Angular evaluates the select attribute against the top-level projected element. Wrapping content in ng-container breaks the match unless you add ngProjectAs.',
    },
    {
      title: 'Reading contentChild() before ngAfterContentInit',
      wrong: `ngOnInit() {
  // undefined — content not yet initialised
  console.log(this.myEl());
}`,
      right: `ngAfterContentInit() {
  // safe — projected content is fully initialised
  console.log(this.myEl());
}`,
      explanation: 'Projected content queries are resolved after ngAfterContentInit. Reading them in ngOnInit returns undefined because Angular has not yet inserted the projected nodes.',
    },
    {
      title: 'Expecting nested attributes to match a slot selector',
      wrong: `<!-- Only TOP-LEVEL projected children are checked against select selectors -->
<app-panel>
  <div>               <!-- outer div has no card-header attribute -->
    <h2 card-header>Title</h2>  <!-- nested — invisible to the slot selector -->
  </div>
</app-panel>
<!-- h2 is silently discarded — it never appears in [card-header] slot -->`,
      right: `<!-- Move the attribute to the outermost projected element -->
<app-panel>
  <h2 card-header>Title</h2>  <!-- top-level — correctly matches the slot -->
</app-panel>`,
      explanation: 'Angular evaluates the select attribute only against top-level projected elements. A card-header attribute on a nested h2 inside a div is invisible to the slot selector. Move the attribute to the outermost element, or use ngProjectAs on a wrapper.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Content projection passes markup from a parent into a child via <code>&lt;ng-content&gt;</code> — single-slot, multi-slot with <code>select</code>, and template-based via <code>NgTemplateOutlet</code> are the three core patterns for truly reusable wrapper components.',
    mustKnow: [
      '<code>&lt;ng-content /&gt;</code> — slot where parent-provided markup is inserted; ONE default (no-select) slot per template',
      '<code>select="[attr]"</code> on ng-content routes elements into named slots; evaluated against TOP-LEVEL projected children only',
      '<code>ngProjectAs="[attr]"</code> overrides the slot an element routes to — fix for ng-container wrappers breaking select matching',
      '<code>&lt;ng-template #tpl let-x&gt;</code> defines a lazy fragment; render with <code>*ngTemplateOutlet="tpl; context: { $implicit: x }"</code>',
      '<code>&lt;ng-container&gt;</code> = zero-DOM wrapper; use to host structural directives, group siblings, and apply <code>ngProjectAs</code>',
      'Projected content belongs to the <strong>parent\'s</strong> change detection context — not the child\'s OnPush cycle',
      '<code>contentChild()</code> queries projected content (available after ngAfterContentInit); <code>viewChild()</code> queries the component\'s own template',
    ],
    interviewFocus: [
      'What is the difference between <code>viewChild()</code> and <code>contentChild()</code>?',
      'Why does wrapping projected content in ng-container break named slot matching? How do you fix it?',
      'Which change detection context runs projected content — parent or child?',
      'Name three scenarios where you would use <code>&lt;ng-container&gt;</code> instead of a <code>&lt;div&gt;</code>.',
      'How does the ng-template + NgTemplateOutlet pattern enable custom render templates for data table rows?',
    ],
  };

  challenge: Challenge = {
    title: 'Build a Tabbed Panel with Named ng-content Slots',
    description: 'Create a reusable <app-tab-panel> component that uses multi-slot content projection. The component must expose three named slots — [tab-title], [tab-body], and [tab-footer] — and render them in the correct sections. The parent template already provides content tagged with those attributes; your job is to wire up the child component template so the slots work correctly.',
    language: 'html',
    hints: [
      'Use <ng-content select="[tab-title]" /> to pull in only the element tagged with the tab-title attribute.',
      'A plain <ng-content /> with no select acts as a catch-all for any content that did not match a named slot.',
      'Wrap each slot in a semantic element — e.g. <header>, <main>, <footer> — so you can style each section independently.',
      'If you need to project an <ng-container> wrapper and still match a named slot, add ngProjectAs="[tab-title]" to the ng-container.',
    ],
    starterCode: `<!-- tab-panel.component.html -->
<!-- TODO: add three named ng-content slots: [tab-title], [tab-body], [tab-footer] -->
<div class="tab-panel">

  <!-- slot 1: header area — select elements with the tab-title attribute -->
  <header class="tab-panel__header">
    <!-- your code here -->
  </header>

  <!-- slot 2: body area — select elements with the tab-body attribute -->
  <main class="tab-panel__body">
    <!-- your code here -->
  </main>

  <!-- slot 3: footer area — select elements with the tab-footer attribute -->
  <footer class="tab-panel__footer">
    <!-- your code here -->
  </footer>

</div>


<!-- ---- parent usage (read-only, already provided) ---- -->
<!--
<app-tab-panel>
  <span tab-title>Getting Started</span>
  <div tab-body>
    <p>Welcome to the Angular learning path.</p>
    <p>Each section builds on the last.</p>
  </div>
  <div tab-footer>
    <button>Previous</button>
    <button>Next</button>
  </div>
</app-tab-panel>
-->`,
    solution: `<!-- tab-panel.component.html -->
<div class="tab-panel">

  <!-- Named slot 1: matches elements tagged with the tab-title attribute -->
  <header class="tab-panel__header">
    <ng-content select="[tab-title]" />
  </header>

  <!-- Named slot 2: matches elements tagged with the tab-body attribute -->
  <main class="tab-panel__body">
    <ng-content select="[tab-body]" />
  </main>

  <!-- Named slot 3: matches elements tagged with the tab-footer attribute -->
  <footer class="tab-panel__footer">
    <ng-content select="[tab-footer]" />
  </footer>

</div>


<!-- ---- parent usage ---- -->
<!--
<app-tab-panel>
  <span tab-title>Getting Started</span>
  <div tab-body>
    <p>Welcome to the Angular learning path.</p>
    <p>Each section builds on the last.</p>
  </div>
  <div tab-footer>
    <button>Previous</button>
    <button>Next</button>
  </div>
</app-tab-panel>
-->`,
  };
}
