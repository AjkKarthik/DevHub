import { Component, signal, computed } from '@angular/core';
import { NgClass, NgStyle, DecimalPipe, JsonPipe } from '@angular/common';
import { HighlightDirective } from './highlight.directive';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
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

type Theme = 'default' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-directives-demo',
  imports: [NgClass, NgStyle, DecimalPipe, JsonPipe, HighlightDirective, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './directives-demo.html',
  styleUrl: './directives-demo.scss',
})
export class DirectivesDemo {
  // NgClass demo
  theme     = signal<Theme>('default');
  isBold    = signal(false);
  isItalic  = signal(false);
  hasShadow = signal(false);

  get ngClassObj() {
    return {
      'theme-success': this.theme() === 'success',
      'theme-warning': this.theme() === 'warning',
      'theme-danger':  this.theme() === 'danger',
      'is-bold':       this.isBold(),
      'is-italic':     this.isItalic(),
      'has-shadow':    this.hasShadow(),
    };
  }

  // NgStyle demo
  textFontSize  = signal(16);
  textOpacity   = signal(1);
  textColor     = signal('#1a1a1a');
  bgColor       = signal('#ffffff');
  letterSpacing = signal(0);

  get ngStyleObj() {
    return {
      'font-size': `${this.textFontSize()}px`,
      'opacity':   `${this.textOpacity()}`,
      'color':     this.textColor(),
      'background-color': this.bgColor(),
      'letter-spacing': `${this.letterSpacing()}px`,
    };
  }

  // Repeat directive demo
  repeatCount = signal(3);
  repeatRange = computed(() => Array.from({ length: this.repeatCount() }, (_, i) => i + 1));

  // Highlight directive demo
  highlightColor = signal('#fef08a');
  highlightItems = ['Hover over this row', 'And this one too', 'Each uses [appHighlight]', 'Colour comes from the picker'];

  prerequisites: Prerequisite[] = [
    { label: 'Components', route: '/angular/components' },
    { label: 'Parent-Child Communication', route: '/angular/parent-child' },
  ];

  theory: TheoryPoint[] = [
  {
    heading: 'Attribute directives',
    points: [
      'Attribute directives change the appearance or behaviour of an element WITHOUT adding or removing DOM nodes — they sit on an existing element and modify it in place.',
      '<code>NgClass</code>: applies CSS classes conditionally via string, array, or object: <code>[ngClass]="{ active: isActive, bold: isBold }"</code>. Prefer the terser <code>[class.active]="isActive"</code> for single classes.',
      '<code>NgStyle</code>: applies inline CSS properties dynamically via an object map. Prefer the terser <code>[style.fontSize.px]="size"</code> syntax for single properties.',
      'Custom attribute directive: decorate a class with <code>@Directive({ selector: \'[appTooltip]\' })</code>. The bracketed selector matches any element that has the <code>appTooltip</code> attribute.',
      'Attribute directives are standalone by default in Angular 14+ — import them in the consuming component\'s <code>imports: []</code> array, not in any NgModule.',
    ],
  },
  {
    heading: 'Custom directive anatomy',
    points: [
      'Inject <code>ElementRef</code> (to access the host element) and <code>Renderer2</code> (to mutate it safely). Never use <code>el.nativeElement.style.x = y</code> directly — it breaks SSR.',
      'Use <code>@HostListener(\'mouseenter\')</code> to respond to DOM events on the host element. The decorated method is called with the event object as argument if declared: <code>@HostListener(\'click\', [\'$event\'])</code>.',
      'Use <code>input()</code> (or <code>@Input()</code>) to receive configuration: <code>appHighlight = input(\'#fef08a\')</code> lets the parent bind <code>[appHighlight]="color"</code>.',
      'Reflect state back to the host via <code>host: { \'[class.active]\': \'isActive()\' }</code> in the <code>@Directive</code> metadata. This is cleaner than a separate <code>@HostBinding</code> decorator for each property.',
      'Use <code>inject()</code> for all dependencies at field level — no constructor needed. <code>private el = inject(ElementRef); private r = inject(Renderer2);</code>',
    ],
  },
  {
    heading: 'Built-in structural directives and the new control flow',
    points: [
      'Structural directives add or remove DOM nodes — they are prefixed with <code>*</code>, which is syntactic sugar: <code>*ngIf="cond"</code> desugars to <code>&lt;ng-template [ngIf]="cond"&gt;&lt;/ng-template&gt;</code>.',
      'Angular 17+ introduced native control flow: <code>@if</code>, <code>@for</code>, <code>@switch</code>/<code>@case</code>. These are built into the template compiler — no directive import needed.',
      '<code>@for (item of items; track item.id) { }</code> replaces <code>*ngFor</code> and makes <code>track</code> mandatory, improving rendering performance by default.',
      '<code>@if (x) { } @else if (y) { } @else { }</code> replaces <code>*ngIf</code> and eliminates the awkward <code>ng-template #elseBlock</code> pattern.',
      'Only one structural directive per element — wrap with <code>&lt;ng-container&gt;</code> (zero DOM cost) to apply two independently: outer hosts <code>*ngIf</code>, inner hosts <code>*ngFor</code>.',
    ],
  },
  {
    heading: 'Custom structural directives — TemplateRef + ViewContainerRef',
    points: [
      'Custom structural directives inject <code>TemplateRef&lt;C&gt;</code> (the template to stamp) and <code>ViewContainerRef</code> (where to insert views into the DOM).',
      'Call <code>this.vcr.createEmbeddedView(this.tpl, context)</code> to render the template. Call <code>this.vcr.clear()</code> to remove all views — equivalent to *ngIf toggling.',
      'Pass context to the template: <code>{ $implicit: value }</code> binds to <code>let-x</code> in <code>&lt;ng-template let-x&gt;</code>. Named props: <code>{ index: i }</code> binds to <code>let-i="index"</code>.',
      'The <code>*appRepeat="3"</code> microsyntax desugars to <code>&lt;ng-template [appRepeat]="3"&gt;</code> — Angular maps the <code>*attr="value"</code> shorthand to a regular attribute binding on the ng-template.',
      'Prefer <code>@if</code>/<code>@for</code> for standard conditions/loops. Build custom structural directives only for reusable logic with complex inputs — permission guards, feature flags, lazy-load wrappers.',
    ],
  },
  {
    heading: 'Directive Composition API (hostDirectives)',
    points: [
      '<code>hostDirectives</code> in <code>@Directive</code> or <code>@Component</code> applies one or more directives to the host without requiring the consumer to add them in the template.',
      'Consumers see only the composed directive — the composed behaviour (ripple, tooltip, focus trap) is encapsulated and invisible unless you explicitly re-expose inputs/outputs.',
      'Re-expose inputs with <code>{ directive: TooltipDir, inputs: [\'appTooltip\'] }</code> in the <code>hostDirectives</code> array. The consumer can then bind <code>[appTooltip]="text"</code> directly on the host.',
      'This pattern replaces mixin-like base classes and wrapper components: apply <code>hostDirectives</code> to a <code>ButtonComponent</code> to bundle ripple + tooltip + disabled state in one declaration.',
      'Composed directives can themselves have <code>hostDirectives</code>, enabling multi-level composition trees — useful for design system primitives that accumulate behaviour across layers.',
    ],
  },
  {
    heading: 'Best practices',
    points: [
      'Prefer signal <code>input()</code> over <code>@Input()</code> for directive inputs — signal inputs are reactive, work with <code>OnPush</code> change detection, and compose better with <code>computed()</code>.',
      'Always use <code>Renderer2</code> to mutate the host element\'s styles, classes, and attributes — direct DOM mutation via <code>nativeElement</code> breaks server-side rendering and web worker contexts.',
      'Test directives with <code>TestBed.createComponent(HostFixture)</code> where <code>HostFixture</code> is a minimal test component that uses the directive — this exercises the real DOM interaction path.',
      'Keep directive logic focused: a directive should do ONE thing (highlight on hover, show a tooltip, trap focus). Bundle multiple behaviours with the Directive Composition API rather than in one fat directive class.',
      'Prefer <code>[class.active]="bool"</code> and <code>[style.fontSize.px]="n"</code> over <code>NgClass</code>/<code>NgStyle</code> for simple single-property cases — fewer imports and clearer intent.',
    ],
  },
];

  qna: QnaItem[] = [
    { q: 'What is the difference between attribute and structural directives?', a: '<strong>Attribute directives</strong> change the appearance or behaviour of an element (NgClass, NgStyle, custom tooltip). <strong>Structural directives</strong> add or remove DOM elements (*ngFor, *ngIf, *ngSwitch).' },
    { q: 'Why use Renderer2 instead of direct DOM manipulation?', a: '<code>Renderer2</code> is platform-agnostic — it works in SSR (Node.js) and Web Workers where <code>document</code> doesn\'t exist. Direct DOM access breaks server-side rendering.' },
    { q: 'How do you pass data into a custom directive?', a: 'Use <code>input()</code> (or <code>@Input()</code>) on the directive class. Bind in the template: <code>[myDirective]="value"</code>. The directive reads the value from its input signal/property.' },
    { q: 'Can a directive have its own host bindings?', a: 'Yes — use <code>host: { \'[class.active]\': \'isActive()\' }</code> in the <code>@Directive</code> decorator, or <code>@HostBinding(\'class.active\')</code>. This avoids needing a template.' },
    { q: 'When would you use a structural directive over @if/@for?', a: 'Built-in <code>@if</code> and <code>@for</code> cover most cases. Use a custom structural directive when you need reusable conditional logic with complex inputs — e.g. a permission-guard directive <code>*canSee="\'admin\'"</code>.' },
    { q: 'How do you share state between a directive and its host component?', a: 'Inject the host component in the directive constructor: <code>private host = inject(MyComponent)</code>. Or use a shared service. Or emit via <code>output()</code> from the directive.' },
    { q: 'What is the Directive Composition API and what problem does it solve?', a: 'The <code>hostDirectives</code> field in <code>@Directive</code>/<code>@Component</code> applies other directives to a host automatically — the consumer gets the composed behaviour (ripple, tooltip, focus trap) without explicitly adding those directives in the template. It replaces mixin-like base classes and eliminates wrapper components created just to bundle directive behaviours.' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'NgClass',
      language: 'html',
      code: `<!-- Option 1: string -->
<div [ngClass]="'active highlighted'">...</div>

<!-- Option 2: array of strings -->
<div [ngClass]="['active', isSpecial ? 'special' : '']">...</div>

<!-- Option 3: object — key is class name, value is boolean -->
<div [ngClass]="{
  'theme-success': theme === 'success',
  'is-bold': isBold,
  'has-shadow': hasShadow
}">...</div>

<!-- Preferred modern alternative: [class.xxx] binding -->
<div
  [class.active]="isActive"
  [class.bold]="isBold"
>...</div>`,
    },
    {
      label: 'NgStyle',
      language: 'html',
      code: `<!-- Option 1: object map -->
<p [ngStyle]="{
  'font-size': fontSize + 'px',
  'color': textColor,
  'opacity': opacity
}">Styled text</p>

<!-- Option 2: computed property from component -->
<p [ngStyle]="currentStyles">Styled text</p>

<!-- Preferred modern alternatives (no NgStyle import needed): -->
<p [style.fontSize.px]="fontSize">Explicit size</p>
<p [style.color]="textColor">Explicit color</p>
<p [style]="{ fontSize: '16px', color: 'red' }">Object shorthand</p>`,
    },
    {
      label: 'Custom attribute directive',
      language: 'typescript',
      code: `// src/app/directives/tooltip.directive.ts
@Directive({ selector: '[appTooltip]' })
export class TooltipDirective {
  appTooltip = input('');  // the tooltip text

  private tip: HTMLElement | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter') show() {
    this.tip = document.createElement('div');
    this.tip.textContent = this.appTooltip();
    this.tip.className = 'app-tooltip';
    document.body.appendChild(this.tip);

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.tip.style.top  = (rect.bottom + 8 + window.scrollY) + 'px';
    this.tip.style.left = (rect.left + window.scrollX) + 'px';
  }

  @HostListener('mouseleave') hide() {
    this.tip?.remove();
    this.tip = null;
  }
}

// Usage in template:
// <button appTooltip="Saves your changes">Save</button>`,
    },
    {
      label: 'Directive Composition API',
      language: 'typescript',
      code: `// Directive Composition: apply multiple directives to a host component
// without the consumer needing to add them in the template

import { Directive, hostDirectives } from '@angular/core';

// Two leaf directives
@Directive({ selector: '[appRipple]' })
export class RippleDirective {}

@Directive({ selector: '[appTooltip]' })
export class TooltipDirective { appTooltip = input(''); }

// Compose them into one "button" directive
@Directive({
  selector: '[appButton]',
  hostDirectives: [
    RippleDirective,
    {
      directive: TooltipDirective,
      inputs: ['appTooltip'],   // expose the input to consumers
    },
  ],
})
export class ButtonDirective {}

// Consumer just uses [appButton]:
// <button appButton appTooltip="Click to save">Save</button>
// Both RippleDirective and TooltipDirective are active automatically.`,
    },
    {
      label: 'Custom structural directive',
      language: 'typescript',
      code: `// src/app/directives/repeat.directive.ts
// *appRepeat="3" — renders its template N times

@Directive({ selector: '[appRepeat]' })
export class RepeatDirective implements OnInit {
  appRepeat = input(1);

  constructor(
    private templateRef: TemplateRef<{ $implicit: number }>,
    private viewContainer: ViewContainerRef,
  ) {}

  ngOnInit() {
    for (let i = 0; i < this.appRepeat(); i++) {
      this.viewContainer.createEmbeddedView(
        this.templateRef,
        { $implicit: i + 1 }  // exposes index via let-n
      );
    }
  }
}

// Usage in template:
// <p *appRepeat="3; let n">Row {{ n }}</p>
// Renders: Row 1, Row 2, Row 3`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the purpose of NgClass?', options: ['Apply inline styles', 'Dynamically add/remove CSS classes', 'Define a new directive', 'Bind to DOM events'], answer: 1, explanation: 'NgClass accepts an object/array/string and adds or removes CSS classes based on truthiness of each key.' },
    { q: 'Which type of directive can add/remove DOM elements?', options: ['Attribute directive', 'Component', 'Structural directive', 'Pipe'], answer: 2, explanation: 'Structural directives (like *ngIf, *ngFor) change the DOM layout by adding or removing elements.' },
    { q: 'How do you create a custom attribute directive in Angular 22?', options: ['@Directive({ selector: \'[appName]\' })', '@Component({ selector: \'app-name\' })', '@Pipe({ name: \'appName\' })', '@Injectable()'], answer: 0, explanation: 'Custom attribute directives use @Directive with a bracketed selector like [appHighlight] to match any element that has that attribute.' },
    { q: 'What does NgStyle do?', options: ['Adds CSS classes dynamically', 'Sets inline CSS styles dynamically', 'Loops over a list', 'Handles events'], answer: 1, explanation: 'NgStyle accepts a {property: value} object and applies those as inline styles. Useful for values that can\'t be expressed as class names.' },
    { q: 'How do you pass a value to a custom directive?', options: ['Using @Output()', 'Using input() or @Input()', 'Via the template ref variable', 'Through the constructor only'], answer: 1, explanation: 'Use input() (Angular 17+) or @Input() to accept values in a directive, same as in a component.' },
    { q: 'What two classes does a custom structural directive inject to render and remove views?', options: ['ElementRef and Renderer2', 'TemplateRef and ViewContainerRef', 'ChangeDetectorRef and NgZone', 'ViewRef and ComponentRef'], answer: 1, explanation: 'TemplateRef holds the ng-template content to stamp out; ViewContainerRef is the anchor point where views are created and destroyed. Call vcr.createEmbeddedView(tpl, context) to render and vcr.clear() to remove — the same pair that powers *ngIf and *ngFor.' },
    { q: 'Which Angular 17+ control flow block replaces *ngFor and what is newly required that was optional before?', options: ['@list — the track expression is now optional', '@for — the track expression is now mandatory for all loops', '@repeat — the track expression defaults to the index', '@iterate — the track expression is inferred from the collection type'], answer: 1, explanation: '@for (item of items; track item.id) replaces *ngFor. The key difference is that track is now MANDATORY — Angular uses it to efficiently reconcile the list on change. This eliminates the common perf bug of accidentally using *ngFor without trackBy.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '@Directive', type: 'decorator', desc: 'Marks a class as an Angular directive and provides configuration metadata like selector and host bindings.', since: '2' },
    { name: 'NgClass', type: 'directive', desc: 'Adds or removes CSS classes on an element dynamically based on a string, array, or object expression.', since: '2' },
    { name: 'NgStyle', type: 'directive', desc: 'Applies inline CSS styles to an element dynamically using an object map of property-value pairs.', since: '2' },
    { name: 'HostListener', type: 'decorator', desc: 'Listens for a DOM event on the host element and calls the decorated method when that event fires.', since: '2' },
    { name: 'HostBinding', type: 'decorator', desc: 'Binds a host element property or attribute to a directive class property.', since: '2' },
    { name: 'ElementRef', type: 'class', desc: 'Provides a reference to the host DOM element; inject it to read element properties or pass it to Renderer2.', since: '2' },
    { name: 'Renderer2', type: 'class', desc: 'Platform-agnostic DOM abstraction; use setStyle / removeStyle / addClass instead of direct DOM mutation for SSR safety.', since: '4' },
    { name: 'TemplateRef', type: 'class', desc: 'A reference to an embedded template; injected in structural directives to stamp out views via ViewContainerRef.', since: '2' },
    { name: 'ViewContainerRef', type: 'class', desc: 'A container that can create, insert, and destroy embedded or component views; core to custom structural directives.', since: '2' },
    { name: 'hostDirectives', type: 'decorator', desc: 'Directive Composition API field inside @Directive/@Component that applies one or more directives to the host without template changes.', since: '15' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: '@Input() vs input() signal in directives',
      before: `import { Directive, Input } from '@angular/core';

@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  @Input() appHighlight = '#fef08a';
}`,
      after: `import { Directive, input } from '@angular/core';

@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  appHighlight = input('#fef08a'); // reactive signal
}`,
      note: 'input() returns a Signal, plays nicely with OnPush, and requires no decorator import.',
    },
    {
      title: '*ngIf / *ngFor structural syntax vs @if / @for control flow',
      before: `<div *ngIf='isVisible'>
  <li *ngFor='let item of items'>{{ item }}</li>
</div>
<!-- requires CommonModule or NgIf/NgFor imports -->`,
      after: `@if (isVisible) {
  @for (item of items; track item) {
    <li>{{ item }}</li>
  }
}
<!-- no imports needed, built into the compiler -->`,
      note: '@if / @for / @switch are native Angular 17+ template syntax and need no directive imports.',
    },
    {
      title: 'Constructor inject vs inject() for ElementRef / Renderer2',
      before: `constructor(
  private el: ElementRef,
  private renderer: Renderer2
) {}`,
      after: `private el       = inject(ElementRef);
private renderer = inject(Renderer2);`,
      note: 'inject() works at field initialisation level, removes constructor boilerplate, and is the preferred modern style.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating the DOM directly instead of using Renderer2',
      wrong: `@HostListener('mouseenter') onEnter() {
  this.el.nativeElement.style.background = 'yellow';
}`,
      right: `@HostListener('mouseenter') onEnter() {
  this.renderer.setStyle(this.el.nativeElement,
    'background', 'yellow');
}`,
      explanation: 'Direct DOM access breaks server-side rendering where document is unavailable. Always use Renderer2 methods so Angular can swap the renderer per platform.',
    },
    {
      title: 'Applying two structural directives on the same element',
      wrong: `<li *ngFor='let x of items' *ngIf='x.active'>{{ x.name }}</li>
<!-- parse error: only one structural directive allowed -->`,
      right: `<ng-container *ngFor='let x of items'>
  <li *ngIf='x.active'>{{ x.name }}</li>
</ng-container>`,
      explanation: 'Angular only allows one structural directive per element. Wrap with ng-container (zero DOM cost) to layer multiple directives.',
    },
    {
      title: 'Forgetting to import a standalone directive in the component',
      wrong: `@Component({
  selector: 'app-root',
  template: '<div appHighlight>Hover me</div>',
  // imports: [] — HighlightDirective missing
})`,
      right: `@Component({
  selector: 'app-root',
  imports: [HighlightDirective],
  template: '<div appHighlight>Hover me</div>',
})`,
      explanation: 'Standalone directives must be listed in the consuming component\'s imports array; Angular will not discover them automatically.',
    },
    {
      title: 'Using NgStyle / NgClass when native binding is sufficient',
      wrong: `<!-- imports NgStyle just to set one property -->
<p [ngStyle]="{ 'font-size': size + 'px' }">text</p>`,
      right: `<!-- no NgStyle import needed -->
<p [style.font-size.px]='size'>text</p>`,
      explanation: 'Angular\'s built-in [style.*] and [class.*] bindings handle single-property cases without needing NgStyle/NgClass imports.',
    },
    {
      title: 'Calling input() signal in ngOnInit instead of reacting in effect()',
      wrong: `appHighlight = input('#fef08a');

ngOnInit() {
  // runs once — misses future color changes from the parent
  this.renderer.setStyle(this.el.nativeElement,
    'background', this.appHighlight());
}`,
      right: `appHighlight = input('#fef08a');

constructor() {
  effect(() => {
    // reactive — re-runs whenever appHighlight() changes
    this.renderer.setStyle(this.el.nativeElement,
      'background', this.appHighlight());
  });
}`,
      explanation: 'ngOnInit runs once at initialisation. If the parent changes the bound color after that, ngOnInit never re-runs. Use effect() to react to signal input changes reactively — it re-runs whenever the signal value changes.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular directives are reusable behaviours attached to elements — attribute directives modify appearance without touching the DOM structure; structural directives add or remove nodes; the Directive Composition API (<code>hostDirectives</code>) bundles multiple directives without template boilerplate.',
    mustKnow: [
      '<code>@Directive({ selector: \'[appName]\' })</code> — attribute selector matches any element with that attribute',
      'Always use <code>Renderer2</code> to mutate styles/classes — direct <code>nativeElement</code> access breaks SSR',
      '<code>@HostListener(\'event\')</code> reacts to host DOM events; <code>host: { \'[class.x]\': \'isX()\' }</code> reflects state to host',
      'Structural directives inject <code>TemplateRef</code> + <code>ViewContainerRef</code>; <code>vcr.createEmbeddedView(tpl)</code> renders, <code>vcr.clear()</code> removes',
      '<code>@for (x of items; track x.id)</code> replaces <code>*ngFor</code> — <code>track</code> is now mandatory',
      '<code>hostDirectives: [Dir]</code> composes multiple directive behaviours onto a host without consumer template changes',
      'Use <code>effect()</code> to react to signal input changes in directives — <code>ngOnInit</code> only runs once and misses future updates',
    ],
    interviewFocus: [
      'What is the difference between attribute directives and structural directives?',
      'Why must you use <code>Renderer2</code> rather than <code>el.nativeElement.style</code>?',
      'What two injected classes does a custom structural directive need, and what does each do?',
      'What is the Directive Composition API and when would you use it?',
      'What changed about <code>@for</code> vs <code>*ngFor</code>? What is now mandatory?',
    ],
  };

  challenge: Challenge = {
    title: 'Custom Border Highlight Directive',
    description: 'Create an attribute directive appBorderHighlight that adds a 2px solid colored border to any element it\'s applied to. Accept a color input (default: #4f46e5).',
    language: 'typescript',
    hints: [
      'Use @Directive({ selector: \'[appBorderHighlight]\' })',
      'Inject ElementRef to access the host element',
      'Use input() for the color with a default value',
      'Apply the style in ngOnInit or use HostBinding'
    ],
    starterCode: `import { Directive, ElementRef, input, OnInit } from '@angular/core';

@Directive({
  selector: '[appBorderHighlight]',
  standalone: true,
})
export class BorderHighlightDirective implements OnInit {
  color = input('#4f46e5');
  // TODO: inject ElementRef
  // TODO: apply border in ngOnInit
}`,
    solution: `import { Directive, ElementRef, input, OnInit } from '@angular/core';

@Directive({
  selector: '[appBorderHighlight]',
  standalone: true,
})
export class BorderHighlightDirective implements OnInit {
  color = input('#4f46e5');
  private el = inject(ElementRef);

  ngOnInit() {
    this.el.nativeElement.style.border = \`2px solid \${this.color()}\`;
    this.el.nativeElement.style.borderRadius = '6px';
  }
}

// Usage: <div appBorderHighlight color="#dd0031">Highlighted!</div>`,
  };
}
