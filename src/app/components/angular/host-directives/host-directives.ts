import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-host-directives',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent,
  ],
  templateUrl: './host-directives.html',
  styleUrl: './host-directives.scss',
})
export class HostDirectivesDemo {

  prerequisites: Prerequisite[] = [
    { label: 'Directives',          route: '/angular/directives' },
    { label: 'Dependency Injection', route: '/angular/di' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'hostDirectives: [Dir]',             type: 'decorator', desc: 'Apply Dir to the host element — all its host bindings activate on this component', since: 'Angular 15' },
    { name: 'hostDirectives: [{ directive: Dir, inputs: [...] }]', type: 'decorator', desc: 'Expose specific inputs of Dir as inputs on this component', since: 'Angular 15' },
    { name: 'hostDirectives: [{ directive: Dir, outputs: [...] }]', type: 'decorator', desc: 'Expose specific outputs of Dir as outputs on this component', since: 'Angular 15' },
    { name: 'inputs: ["dirInput:alias"]',         type: 'syntax',    desc: 'Map host directive input "dirInput" to a local alias for consumers of this component', since: 'Angular 15' },
    { name: 'inject(HostDirective)',              type: 'function',  desc: 'Access the host directive instance inside the component via DI — all inject() rules apply', since: 'Angular 15' },
    { name: 'standalone: true (required)',        type: 'decorator', desc: 'Host directives MUST be standalone — NgModule-based directives cannot be used as host directives', since: 'Angular 15' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What hostDirectives does',
      points: [
        '<code>hostDirectives</code> is an array in <code>@Component</code> (or <code>@Directive</code>) that <strong>applies other standalone directives to the host element</strong>. All of those directives\' host bindings, event listeners, and class/style changes activate as if they were written on the element itself.',
        'It is Angular\'s answer to "how do I share behaviour across many components without inheritance?" Before hostDirectives, you had to either inherit a base class (fragile, couples hierarchy) or wrap the component (changes DOM structure).',
        'Use it for: adding CDK drag-and-drop to a component, making any button focusable with CdkFocusTrap, applying a tooltip to any element, adding router-link–like behaviour. The host directive does the work; the component doesn\'t need to know the implementation.',
        'Unlike component composition via <code>&lt;app-child&gt;</code>, hostDirectives do not change the DOM tree — they only add behaviour to the existing host element.',
      ],
    },
    {
      heading: 'Exposing inputs and outputs',
      points: [
        'By default, a host directive\'s inputs and outputs are <strong>not visible</strong> to consumers of the component. You must explicitly opt-in each one via the <code>inputs</code> and <code>outputs</code> arrays.',
        'Syntax: <code>inputs: [\'directiveInputName\']</code> exposes it with the same name. <code>inputs: [\'directiveInputName: publicAlias\']</code> renames it for consumers.',
        'Example: <code>CdkDrag</code> has a <code>cdkDragDisabled</code> input. Expose it as <code>inputs: [\'cdkDragDisabled: disabled\']</code> so consumers write <code>[disabled]="true"</code> on your component instead of knowing about CdkDrag.',
        'Outputs follow the same pattern: <code>outputs: [\'cdkDragStarted: dragStarted\']</code> lets consumers bind <code>(dragStarted)="handler()"</code>.',
      ],
    },
    {
      heading: 'Accessing the host directive instance',
      points: [
        'Inside the component\'s class, inject the host directive instance: <code>private drag = inject(CdkDrag)</code>. This works because hostDirectives are provided in the same injector as the component.',
        'Injection lets you imperatively control the directive: <code>this.drag.reset()</code>, read its state, or call its methods from the component\'s own logic.',
        'You can also read injected instances in <code>afterViewInit</code> if you need to access the rendered state, but the instance itself is available from the constructor.',
        'If a host directive is not applied but you inject it, Angular throws at runtime. Use <code>inject(CdkDrag, { optional: true })</code> if the directive is conditionally applied.',
      ],
    },
    {
      heading: 'Composing multiple host directives',
      points: [
        'You can apply multiple directives: <code>hostDirectives: [CdkDrag, TooltipDirective, FocusRingDirective]</code>. All of them activate on the host element simultaneously.',
        'Order matters when directives bind the same DOM event — Angular applies host bindings in the order listed. For host listeners on the same event, all listeners fire; there is no "first one wins" shortcut.',
        'A host directive can itself have host directives — the composition is recursive. This lets you build "behaviour stacks" that are mixed into components à la carte.',
        'Avoid stacking too many unrelated directives — it makes the component\'s public API opaque. Prefer one host directive that internally composes its own sub-behaviour.',
      ],
    },
    {
      heading: 'hostDirectives vs component inheritance vs ng-content composition',
      points: [
        '<strong>Component inheritance</strong> is the worst option: tight coupling, Angular change detection sometimes misses lifecycle hooks, and you end up shipping base-class logic even when unused. Avoid for components.',
        '<strong>Content projection (ng-content)</strong> is for structural composition — you project children into slots. It changes the DOM tree.',
        '<strong>hostDirectives</strong> is for <em>behavioural</em> composition — adding capabilities to the host element without changing structure. It is the recommended pattern for reusable behaviours in Angular 15+.',
        'In standalone-first Angular apps, hostDirectives is the standard way to share imperative DOM behaviour across an arbitrary set of components.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic host directive',
      language: 'typescript',
      code: `// tooltip.directive.ts — standalone, composable
@Directive({
  selector: '[appTooltip]',
  standalone: true,
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
  },
})
export class TooltipDirective {
  tooltipText = input<string>('');

  show() { console.log('Show tooltip:', this.tooltipText()); }
  hide() { console.log('Hide tooltip'); }
}

// button.component.ts — button gets tooltip behaviour for free
@Component({
  selector: 'app-button',
  standalone: true,
  // No changes to template or DOM — tooltip behaviour is on the host element
  template: '<ng-content />',
  hostDirectives: [
    {
      directive: TooltipDirective,
      inputs: ['tooltipText: tooltip'],  // expose as 'tooltip' to consumers
    },
  ],
})
export class ButtonComponent {}

// In a parent template:
// <app-button tooltip="Save document">Save</app-button>`,
    },
    {
      label: 'CDK Drag composition',
      language: 'typescript',
      code: `import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-draggable-card',
  standalone: true,
  imports: [CdkDrag],  // Still import for template use if needed
  template: \`
    <div class="card-header">{{ title() }}</div>
    <div class="card-body"><ng-content /></div>
  \`,
  hostDirectives: [
    {
      directive: CdkDrag,
      inputs:  ['cdkDragDisabled: disabled'],    // consumer: [disabled]="true"
      outputs: ['cdkDragStarted: dragStarted'],  // consumer: (dragStarted)="..."
    },
  ],
})
export class DraggableCardComponent {
  title = input('');
  disabled = input(false);

  // Access the CdkDrag instance for programmatic control
  private cdkDrag = inject(CdkDrag);

  resetPosition() {
    this.cdkDrag.reset();
  }
}

// Parent usage — no knowledge of CdkDrag needed
// <app-draggable-card title="Task" [disabled]="locked()" (dragStarted)="onDrag($event)" />`,
    },
    {
      label: 'Stacking host directives',
      language: 'typescript',
      code: `// focus-ring.directive.ts
@Directive({ selector: '[appFocusRing]', standalone: true,
  host: { '(focus)': 'addRing()', '(blur)': 'removeRing()',
          '[class.ring]': 'hasFocus' } })
export class FocusRingDirective {
  hasFocus = false;
  addRing()    { this.hasFocus = true; }
  removeRing() { this.hasFocus = false; }
}

// loading-state.directive.ts
@Directive({ selector: '[appLoading]', standalone: true,
  host: { '[attr.aria-busy]': 'loading()', '[class.loading]': 'loading()' } })
export class LoadingStateDirective {
  loading = input(false);
}

// interactive-button.component.ts — stacks three host directives
@Component({
  selector: 'app-interactive-button',
  standalone: true,
  template: '<ng-content />',
  hostDirectives: [
    FocusRingDirective,            // adds focus ring CSS class
    { directive: TooltipDirective, inputs: ['tooltipText: tooltip'] },
    { directive: LoadingStateDirective, inputs: ['loading'] },
  ],
})
export class InteractiveButtonComponent {
  // Access stacked instances if needed
  private focusRing  = inject(FocusRingDirective);
  private loadingDir = inject(LoadingStateDirective);
}

// <app-interactive-button tooltip="Submit" [loading]="saving()">
//   Save
// </app-interactive-button>`,
    },
    {
      label: 'Host directive on a directive (chaining)',
      language: 'typescript',
      code: `// A host directive can itself declare host directives — recursive composition

// base-interactive.directive.ts
@Directive({
  selector: '[appBaseInteractive]',
  standalone: true,
  host: {
    '[tabindex]': '0',
    '(keydown.enter)': 'activate()',
    '(keydown.space)': 'activate()',
  },
})
export class BaseInteractiveDirective {
  activated = output<void>();
  activate() { this.activated.emit(); }
}

// rich-interactive.directive.ts — composes base + focus ring
@Directive({
  selector: '[appRichInteractive]',
  standalone: true,
  hostDirectives: [
    BaseInteractiveDirective,
    FocusRingDirective,
  ],
})
export class RichInteractiveDirective {
  private base = inject(BaseInteractiveDirective);

  doSomethingOnActivate() {
    this.base.activated.subscribe(() => console.log('activated!'));
  }
}

// card.component.ts — picks up BOTH base + focusRing through RichInteractive
@Component({
  selector: 'app-rich-card',
  standalone: true,
  template: '<ng-content />',
  hostDirectives: [RichInteractiveDirective],
})
export class RichCardComponent {}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using a non-standalone directive as a host directive',
      wrong: `// OldTooltipDirective is NOT standalone — it belongs to TooltipModule
@Component({
  selector: 'app-card',
  hostDirectives: [OldTooltipDirective],  // ❌ ERROR at compile time
})
export class CardComponent {}`,
      right: `// Make the directive standalone first
@Directive({ selector: '[appTooltip]', standalone: true })
export class TooltipDirective { ... }

// Now it can be used as a host directive
@Component({
  selector: 'app-card',
  hostDirectives: [TooltipDirective],  // ✓
})
export class CardComponent {}`,
      explanation: 'hostDirectives requires standalone directives. NgModule-based directives cannot be used. Migrate the directive to standalone: true before composing it.',
    },
    {
      title: 'Expecting host directive inputs/outputs to be available without explicitly exposing them',
      wrong: `// CdkDrag has cdkDragDisabled input — but it is NOT automatically visible
@Component({
  selector: 'app-draggable',
  hostDirectives: [CdkDrag],  // no inputs: [] specified
})
export class DraggableComponent {}

// Parent template — this does NOT work
// <app-draggable [cdkDragDisabled]="true" />  ❌ Unknown input`,
      right: `@Component({
  selector: 'app-draggable',
  hostDirectives: [{
    directive: CdkDrag,
    inputs: ['cdkDragDisabled'],  // explicitly exposed
  }],
})
export class DraggableComponent {}

// <app-draggable [cdkDragDisabled]="true" />  ✓`,
      explanation: 'Host directive inputs and outputs are private by default. You must list each one in the inputs/outputs arrays to expose them. Unadvertised inputs are not accessible to the component\'s consumers.',
    },
    {
      title: 'Adding the directive to imports[] AND hostDirectives[]',
      wrong: `@Component({
  selector: 'app-card',
  standalone: true,
  imports: [TooltipDirective],         // for template use
  hostDirectives: [TooltipDirective],  // for host composition
  template: \`<span appTooltip>...</span>\`,  // using it in template too
})`,
      right: `// If it's in hostDirectives, it applies to the HOST element automatically.
// Only add to imports[] if you also use it in the template on child elements.
// Using it on the host element via hostDirectives AND the template selector
// would apply it twice — avoid.
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  hostDirectives: [TooltipDirective],  // applies to host element only
  template: \`<span>content here (no tooltip on this span)</span>\`,
})`,
      explanation: 'hostDirectives already applies the directive to the host element. You only need imports[] if you want to use the directive\'s selector inside the template on different child elements. Applying both at the same time applies the directive twice.',
    },
    {
      title: 'Trying to use hostDirectives with class-based lifecycle (ngOnInit etc.)',
      wrong: `// Host directive lifecycle hooks DO work — but the order can be surprising
@Directive({ selector: '[appInit]', standalone: true })
export class InitDirective implements OnInit {
  ngOnInit() { console.log('directive init'); }
}

// Component assumes its own ngOnInit runs first
@Component({ ..., hostDirectives: [InitDirective] })
export class MyComponent implements OnInit {
  ngOnInit() { console.log('component init'); }
  // Actual order: directive ngOnInit, then component ngOnInit
}`,
      right: `// Know the order: host directive hooks run before component hooks of the same type
// If you need to coordinate timing, use effect() or communicate via inject()
@Component({ ..., hostDirectives: [InitDirective] })
export class MyComponent {
  private initDir = inject(InitDirective);
  // Access the directive instance after Angular has initialized it
}`,
      explanation: 'Host directive lifecycle hooks run before the component\'s own hooks of the same type. If ordering matters, use inject() to access the directive instance and coordinate explicitly rather than relying on lifecycle order.',
    },
    {
      title: 'Applying hostDirectives to a non-standalone component',
      wrong: `// This component is not standalone — hostDirectives is not supported
@Component({
  selector: 'app-card',
  standalone: false,  // or no standalone: true
  hostDirectives: [TooltipDirective],  // ignored or ERROR
})
export class CardComponent {}`,
      right: `// hostDirectives works on standalone components and standalone directives only
@Component({
  selector: 'app-card',
  standalone: true,
  hostDirectives: [TooltipDirective],
})
export class CardComponent {}`,
      explanation: 'hostDirectives is a feature of standalone Angular. Both the host component/directive AND the applied directives must be standalone: true.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a composable "resizable" card component',
    language: 'typescript',
    description: `Create a ResizableDirective (standalone) that:
1. Adds a resize handle to the host element's bottom-right corner via a host binding class
2. Accepts a resizeMin input (number, default 100) and a resizeMax input (number, default 800)
3. Emits a resized output with the new width

Then create a CardComponent that:
1. Uses ResizableDirective via hostDirectives
2. Exposes resizeMin, resizeMax as inputs and resized as output
3. Injects ResizableDirective and logs the current width in its constructor`,
    hints: [
      'In ResizableDirective, use host: { "[class.resizable]": "true" } to always add the CSS class',
      'Expose inputs with inputs: ["resizeMin: minWidth", "resizeMax: maxWidth"]',
      'Expose the output with outputs: ["resized"]',
      'inject(ResizableDirective) works because it is in the same injector',
      'You can simulate resizing with a signal and a button for testing purposes',
    ],
    starterCode: `import { Component, Directive, output, input, inject } from '@angular/core';

// TODO: Create ResizableDirective (standalone)
// - resizeMin input (default 100)
// - resizeMax input (default 800)
// - resized output
// - host: { "[class.resizable]": "true" }

// TODO: Create CardComponent (standalone)
// - hostDirectives: [{ directive: ResizableDirective, inputs: [...], outputs: [...] }]
// - inject ResizableDirective and log in constructor`,
    solution: `import { Component, Directive, output, input, inject, signal } from '@angular/core';

@Directive({
  selector: '[appResizable]',
  standalone: true,
  host: { '[class.resizable]': 'true' },
})
export class ResizableDirective {
  resizeMin = input(100);
  resizeMax = input(800);
  resized = output<number>();

  private currentWidth = signal(200);

  resize(delta: number) {
    const next = Math.min(
      this.resizeMax(),
      Math.max(this.resizeMin(), this.currentWidth() + delta),
    );
    this.currentWidth.set(next);
    this.resized.emit(next);
  }
}

@Component({
  selector: 'app-card',
  standalone: true,
  template: \`
    <div class="card-content"><ng-content /></div>
    <button (click)="grow()">+ Wider</button>
    <button (click)="shrink()">- Narrower</button>
  \`,
  hostDirectives: [{
    directive: ResizableDirective,
    inputs:  ['resizeMin: minWidth', 'resizeMax: maxWidth'],
    outputs: ['resized'],
  }],
})
export class CardComponent {
  private resizable = inject(ResizableDirective);

  constructor() {
    console.log('ResizableDirective instance:', this.resizable);
  }

  grow()   { this.resizable.resize(50); }
  shrink() { this.resizable.resize(-50); }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary purpose of hostDirectives?',
      options: [
        'Replacing component inheritance for sharing templates between components',
        'Applying standalone directives to a component\'s host element to share behaviour',
        'Loading directives lazily on navigation',
        'Providing directives to child components without importing them',
      ],
      answer: 1,
      explanation: 'hostDirectives applies standalone directives to the host element, adding their behaviour (host bindings, event listeners) without changing the DOM structure. It is the Angular 15+ answer to behavioural composition.',
    },
    {
      q: 'A component uses hostDirectives: [CdkDrag]. What must be true for its consumers to bind [cdkDragDisabled]?',
      options: [
        'Nothing — host directive inputs are automatically exposed to consumers',
        'The component must list cdkDragDisabled in the inputs array of the hostDirective config',
        'The consumer must also import CdkDrag in their own component',
        'The component must declare cdkDragDisabled as its own @Input()',
      ],
      answer: 1,
      explanation: 'Host directive inputs are private by default. You must explicitly list them in inputs: ["cdkDragDisabled"] (or with an alias "cdkDragDisabled: disabled") inside the hostDirectives config object.',
    },
    {
      q: 'How do you access the CdkDrag instance from inside a component that uses it as a host directive?',
      options: [
        '@ViewChild(CdkDrag) drag!: CdkDrag',
        'inject(CdkDrag) in the constructor or class body',
        'Input the directive instance from the parent via @Input()',
        'Access it via this.hostDirectives.cdkDrag',
      ],
      answer: 1,
      explanation: 'Host directives are provided in the same injector as the component, so inject(CdkDrag) returns the instance. @ViewChild only works for directives in the template, not the host.',
    },
    {
      q: 'Which requirement must a directive meet to be used in hostDirectives?',
      options: [
        'It must be in the same module as the component',
        'It must be standalone: true',
        'It must have no inputs or outputs',
        'It must extend BaseDirective from @angular/core',
      ],
      answer: 1,
      explanation: 'hostDirectives requires standalone directives. NgModule-based directives (those declared in an NgModule) cannot be composed with hostDirectives. Both the host component and the applied directive must be standalone.',
    },
    {
      q: 'What happens when you apply hostDirectives: [FocusRing, Tooltip] to a component?',
      options: [
        'Only the last directive wins — directives override each other',
        'Both directives\' host bindings are applied to the host element simultaneously',
        'Angular throws because only one host directive is allowed',
        'The directives are applied to child elements in the template, not the host',
      ],
      answer: 1,
      explanation: 'Multiple host directives all activate on the host element simultaneously. Their host bindings, listeners, and class/style changes all apply. There is no override — they coexist.',
    },
    {
      q: 'How do you expose a host directive\'s output to consumers of the component?',
      options: [
        'Outputs are automatically exposed — no configuration needed',
        'List the output in the outputs array of the hostDirectives config: outputs: ["cdkDragMoved"]',
        'Declare an @Output() with the same name on the component class',
        'Host directive outputs cannot be forwarded to consumers',
      ],
      answer: 1,
      explanation: 'Like inputs, host directive outputs are private by default. Add them to the outputs array in the hostDirectives config: outputs: ["cdkDragMoved"] or with an alias outputs: ["cdkDragMoved: moved"]. The consumer can then listen with (moved)="onMoved($event)".',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use hostDirectives on a directive, not just a component?',
      a: 'Yes — @Directive can also declare hostDirectives just like @Component. This enables "directive stacking" where one standalone directive composes multiple sub-behaviours. For example, a RichInteractiveDirective might compose BaseInteractiveDirective and FocusRingDirective, and then components apply just RichInteractiveDirective to get all three behaviours at once.',
    },
    {
      q: 'What is the difference between hostDirectives and adding the directive selector to the host element?',
      a: 'Adding a directive to the host via host: { "[appTooltip]": "" } or similar does not actually activate the directive — Angular\'s selector matching does not run inside the host metadata. hostDirectives is the proper API to apply a directive to the host. The key difference: with hostDirectives, Angular instantiates the directive in the same injector and wires its lifecycle and host bindings correctly.',
    },
    {
      q: 'How does hostDirectives compare to using directive composition via a shared base class?',
      a: 'Base class inheritance is discouraged in Angular: it couples the hierarchy, can confuse change detection, and ships unused base logic in every consumer. hostDirectives is purely additive — each directive is self-contained, tree-shakeable, and can be mixed in without a shared ancestor. It also allows composing two unrelated directives that could never share a common base class.',
    },
    {
      q: 'Can a host directive emit its own outputs that the component re-exposes?',
      a: 'Yes — use outputs: ["cdkDragStarted: dragStarted"] in the hostDirectives config. The host directive emits cdkDragStarted; the component exposes it as dragStarted to its consumers. In the component class, inject(CdkDrag).cdkDragStarted is the EventEmitter you can listen to programmatically.',
    },
    {
      q: 'How do I access a host directive instance from inside the component class?',
      a: 'Use inject() in the component\'s constructor: private drag = inject(CdkDrag). Angular adds host directives to the same component injector, so inject() resolves them without any provider configuration. You can then call methods or subscribe to observables on the directive instance. This is the main advantage over a composed base class — the component and directive are fully decoupled at the class level but share an injector.',
    },
    {
      q: 'Are host directives instantiated in a guaranteed order, and does it matter?',
      a: 'Host directives are instantiated in the order they appear in the hostDirectives array. Each directive\'s constructor runs in that order, then lifecycle hooks (ngOnInit etc.) run in the same order after all constructors complete. In practice, order matters when one host directive depends on inject()ing another — the earlier directive in the array is already in the injector when later ones initialise. Design directives to be independent to avoid ordering bugs.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: '<code>hostDirectives</code> applies standalone directives to a component\'s host element — the Angular 15+ way to share behaviour across components without inheritance or DOM changes.',
    mustKnow: [
      'Applied directives must be <strong>standalone: true</strong> — NgModule directives are not supported',
      'Host directive inputs/outputs are <strong>private by default</strong> — list them in <code>inputs[]</code> / <code>outputs[]</code> to expose',
      'Alias with <code>"directiveInput: publicName"</code> to rename inputs for consumers',
      '<code>inject(HostDirective)</code> inside the component returns the instance — same injector',
      'Multiple host directives are stacked — all activate simultaneously on the host element',
      'Prefer over base-class inheritance for sharing imperative DOM behaviour',
    ],
    interviewFocus: [
      '<strong>What is hostDirectives for?</strong> — behavioural composition on the host element without inheritance or DOM changes',
      '<strong>Why must directives be standalone?</strong> — hostDirectives is a standalone-first feature; NgModule directives cannot be composed this way',
      '<strong>How to expose inputs?</strong> — explicitly list in inputs: ["dirInput: alias"]; nothing is exposed by default',
      '<strong>Vs inheritance?</strong> — hostDirectives is additive and tree-shakeable; base classes are coupled and can confuse Angular CD',
    ],
  };
}
