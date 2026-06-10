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
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

type Theme = 'default' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-directives-demo',
  imports: [NgClass, NgStyle, DecimalPipe, JsonPipe, HighlightDirective, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
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

  theory: TheoryPoint[] = [
  {
    heading: 'Attribute directives',
    points: [
      'Attribute directives change the appearance or behaviour of an element without adding/removing DOM nodes.',
      '<code>NgClass</code>: applies CSS classes conditionally. <code>[ngClass]="{ \'active\': isActive }"</code>.',
      '<code>NgStyle</code>: applies inline styles dynamically. <code>[ngStyle]="{ color: textColor }"</code>.',
      'Custom attribute directive: decorate a class with <code>@Directive({ selector: \'[appTooltip]\' })</code>.',
    ],
  },
  {
    heading: 'Custom directive anatomy',
    points: [
      'Inject <code>ElementRef</code> and <code>Renderer2</code> — never manipulate the DOM directly for SSR compatibility.',
      'Use <code>@HostListener(\'mouseenter\')</code> to respond to DOM events on the host element.',
      'Use <code>input()</code> to receive configuration: <code>&lt;div [appTooltip]="\'Hello\'"&gt;</code>.',
      'Use <code>@HostBinding()</code> or <code>host: { \'[class.active]\': \'isActive\' }</code> to reflect state back to the host.',
    ],
  },
  {
    heading: 'Structural directives',
    points: [
      'Structural directives add/remove DOM nodes — prefixed with <code>*</code> (syntactic sugar for <code>&lt;ng-template&gt;</code>).',
      'Built-ins: <code>*ngIf</code>, <code>*ngFor</code>, <code>*ngSwitch</code>. Prefer the new <code>@if</code>/<code>@for</code>/<code>@switch</code> blocks in Angular 17+.',
      'Custom structural directive: inject <code>TemplateRef</code> and <code>ViewContainerRef</code>. Call <code>vcr.createEmbeddedView(tpl)</code> to show, <code>vcr.clear()</code> to hide.',
      'Only one structural directive per element — use <code>&lt;ng-container&gt;</code> to layer multiple.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Prefer signal <code>input()</code> over <code>@Input()</code> in new directives — it works with OnPush and is more composable.',
      'Directives are standalone by default — import them directly in the component\'s <code>imports</code> array.',
      'Use <code>Renderer2</code> over direct DOM manipulation to keep server-side rendering compatible.',
      'Test directives with <code>TestBed</code> by creating a host component that uses the directive.',
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
  ];

  tabs: CodeTab[] = [
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
  ];

  versionItems: VersionInfo[] = [
    {
      version: '15',
      label: 'Directive Composition API',
      features: [
        'hostDirectives field in @Directive/@Component applies directives to a host without template changes',
        'Inputs and outputs from composed directives can be explicitly re-exposed to consumers',
        'Eliminates wrapper components just to bundle multiple directive behaviours',
      ],
    },
    {
      version: '17',
      label: 'Built-in control flow replaces structural directives',
      features: [
        '@if / @else blocks replace *ngIf — no NgIf import required',
        '@for with mandatory track replaces *ngFor — better performance defaults',
        '@switch / @case replaces *ngSwitch — cleaner multi-branch syntax',
        'Custom structural directives still supported but rarely needed for simple cases',
      ],
    },
  ];

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
