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
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

@Component({
  selector: 'app-content-projection',
  imports: [TitleCasePipe, CodeBlockComponent, TheoryBlockComponent, CardComponent, AlertComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './content-projection.html',
  styleUrl: './content-projection.scss',
})
export class ContentProjectionDemo {
  alertType = signal<'info' | 'success' | 'warning' | 'danger'>('info');
  showGroup = signal(true);

  theory: TheoryPoint[] = [
    {
      heading: 'What is content projection?',
      points: [
        '<code>ng-content</code> is a slot — the parent decides what HTML goes inside a child component.',
        'Angular replaces <code>&lt;ng-content /&gt;</code> with the markup placed between the child\'s opening and closing tags.',
        'Projected content belongs to the <strong>parent\'s</strong> change detection — not the child\'s.',
        'Content projection does NOT create a new scope — CSS of the host still applies to projected content.',
      ],
    },
    {
      heading: 'Multi-slot projection',
      points: [
        'Add a <code>select</code> attribute to target specific elements: <code>&lt;ng-content select="[card-header]" /&gt;</code>.',
        'The selector is a CSS attribute, class, or element selector applied to children in the parent template.',
        'Unmatched content goes into a default <code>&lt;ng-content /&gt;</code> with no select (the catch-all slot).',
        '<code>ngProjectAs</code> overrides what selector a projected element matches — useful for wrapping components.',
      ],
    },
    {
      heading: 'ng-template vs ng-container',
      points: [
        '<code>ng-template</code> defines a lazy fragment — nothing renders until you instantiate it via <code>NgTemplateOutlet</code> or a structural directive.',
        '<code>ng-container</code> is a zero-DOM wrapper — useful to group elements or host a directive without adding a real element.',
        'Pass templates as <code>@Input()</code> to child components: <code>input&lt;TemplateRef&lt;any&gt;&gt;()</code>.',
        'Use <code>let-variable</code> on <code>ng-template</code> to bind context variables passed via <code>NgTemplateOutlet</code>.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'You cannot project content into a component that uses <code>OnPush</code> differently — the projection slot is always eager.',
        'Projected content is accessible via <code>contentChild()</code> / <code>contentChildren()</code> after <code>ngAfterContentInit</code>.',
        'Avoid putting logic in projected content — it couples the parent and child unnecessarily.',
        'Multiple <code>&lt;ng-content /&gt;</code> without <code>select</code> is an error — only one default slot is allowed.',
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
  ];

  tabs: CodeTab[] = [
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
  ];

  versionItems: VersionInfo[] = [
    {
      version: '17',
      label: 'Signal-based content queries',
      features: [
        'contentChild() and contentChildren() replaced @ContentChild/@ContentChildren with reactive signals',
        'Queries automatically update when projected content changes without manual change detection',
        'Compatible with the new input() and output() signal primitives introduced in Angular 17',
      ],
    },
    {
      version: '2',
      label: 'Core content projection primitives',
      features: [
        'ng-content with select attribute for multi-slot projection',
        'ngProjectAs attribute to override slot matching for wrapped elements',
        'ng-template and NgTemplateOutlet for passing and rendering template fragments',
      ],
    },
  ];

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
