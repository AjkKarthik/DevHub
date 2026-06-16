import { Component, signal } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes, stagger, query } from '@angular/animations';
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
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

@Component({
  selector: 'app-animations-demo',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './animations-demo.html',
  styleUrl: './animations-demo.scss',
  animations: [
    trigger('openClose', [
      state('open',   style({ height: '*', opacity: 1, overflow: 'hidden' })),
      state('closed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      transition('open <=> closed', animate('300ms ease-in-out')),
    ]),
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-12px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-12px)' })),
      ]),
    ]),
    trigger('pulse', [
      transition('* => active', [
        animate('600ms ease', keyframes([
          style({ transform: 'scale(1)',    offset: 0   }),
          style({ transform: 'scale(1.15)', offset: 0.5 }),
          style({ transform: 'scale(1)',    offset: 1   }),
        ])),
      ]),
    ]),
    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(80, [
            animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
          ]),
        ], { optional: true }),
        query(':leave', [
          stagger(40, [
            animate('150ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class AnimationsDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Signals', route: '/angular/signals' },
  ];

  isOpen      = signal(true);
  showBanner  = signal(true);
  pulseState  = signal('idle');
  items       = signal(['Apple', 'Banana', 'Cherry', 'Date']);

  triggerPulse() {
    this.pulseState.set('idle');
    setTimeout(() => this.pulseState.set('active'), 10);
  }

  addItem() {
    const fruits = ['Elderberry', 'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon', 'Mango'];
    const next = fruits.find(f => !this.items().includes(f));
    if (next) this.items.update(arr => [...arr, next]);
  }

  removeItem(i: number) {
    this.items.update(arr => arr.filter((_, idx) => idx !== i));
  }

  theory: TheoryPoint[] = [
    {
      heading: 'How Angular Animations work',
      points: [
        'Angular\'s animation engine is opt-in: add <code>provideAnimationsAsync()</code> to the <code>providers</code> array in <code>app.config.ts</code>. It lazy-loads the animation runtime so it does not bloat the initial bundle.',
        'The <code>animations: [...]</code> array in <code>@Component</code> registers named triggers scoped to that component. Each <code>trigger(name, [...])</code> maps to a <code>[@name]</code> binding in the template.',
        'Angular tracks the value of the state expression bound in the template. When the value changes, Angular finds the matching <code>transition()</code> rule and runs the animation between the two states.',
        'Animations run at the browser paint level — Angular uses the Web Animations API under the hood. The engine handles CSS property interpolation, timing functions, and DOM cleanup (especially for <code>:leave</code>).',
        'Signal values integrate naturally as state expressions: <code>[@myTrigger]="isOpen() ? \'open\' : \'closed\'"</code>. Angular re-evaluates the expression reactively and starts the transition when the signal changes.',
      ],
    },
    {
      heading: 'State, transition, and the :enter/:leave aliases',
      points: [
        '<code>state(name, style({...}))</code> declares a stable CSS snapshot for a named state. Between animation runs, the element holds these exact CSS values.',
        '<code>transition(\'open &lt;=&gt; closed\', animate(\'300ms ease-in-out\'))</code> runs in both directions. Use <code>\'open =&gt; closed\'</code> for one-way. The bidirectional shorthand is convenient for toggle patterns.',
        '<code>height: \'*\'</code> in a state style means "compute the element\'s natural height at runtime" — Angular measures the element before animating. This avoids hardcoding pixel values for dynamic content.',
        '<code>:enter</code> is an alias for <code>void =&gt; *</code>: fires when an element is inserted into the DOM (via <code>@if</code>, <code>@for</code>, or <code>@switch</code> becoming truthy). <code>:leave</code> is <code>* =&gt; void</code>: fires on removal.',
        'Angular holds the leaving element in the DOM until its <code>:leave</code> animation finishes, then removes it. This is automatic — no <code>setTimeout</code> cleanup needed.',
      ],
    },
    {
      heading: 'keyframes and stagger — choreographed sequences',
      points: [
        '<code>keyframes([style({ offset: 0, ... }), style({ offset: 0.5, ... }), ...])</code> creates multi-step animations within a single <code>animate()</code> call. <code>offset</code> values range from 0 to 1 and map to percentage progress.',
        '<code>query(selector, [animation])</code> inside a trigger targets child elements within the animation host. Selectors can be <code>\':enter\'</code>, <code>\':leave\'</code>, or any CSS selector like <code>\'.item\'</code>.',
        '<code>stagger(delayMs, [animation])</code> inside a <code>query()</code> applies a sequential time offset between each matched element — the first item starts at 0ms, the second at delayMs, the third at 2×delayMs, and so on.',
        'Place the <code>[@trigger]</code> binding on the <strong>parent container</strong>, not on individual list items. <code>query(\':enter\')</code> searches inside the host and finds the children — putting it on each child defeats the purpose.',
        '<code>{ optional: true }</code> as the third argument to <code>query()</code> prevents Angular from throwing a runtime error when no elements match — essential when a list starts empty or removes its last element.',
      ],
    },
    {
      heading: 'AnimationBuilder — imperative animations',
      points: [
        '<code>AnimationBuilder</code> (inject from <code>@angular/animations</code>) lets you build and run animations <strong>programmatically</strong> rather than declaratively in the <code>animations: []</code> metadata array.',
        'Create a factory: <code>const factory = this.builder.build([style({...}), animate(\'300ms\', style({...}))])</code>. Then create a player: <code>const player = factory.create(element)</code>.',
        'The player exposes <code>player.play()</code>, <code>player.pause()</code>, <code>player.reset()</code>, <code>player.finish()</code>, and <code>player.destroy()</code> — giving you full imperative control over playback.',
        'Use <code>player.onDone(() =&gt; { ... })</code> to run a callback when the animation finishes. Always call <code>player.destroy()</code> in the callback to free resources.',
        'AnimationBuilder is ideal when you need to animate elements you get via <code>@ViewChild()</code> / <code>ElementRef</code>, or when the animation parameters (duration, colour) are computed at runtime.',
      ],
    },
    {
      heading: 'Route animations — transitions between pages',
      points: [
        'Route animations animate the transition between two route components by wrapping the <code>&lt;router-outlet&gt;</code> and its contents in a trigger that fires on route data changes.',
        'Add a <code>data: { animation: \'PageA\' }</code> property to each route in <code>app.routes.ts</code>. In the shell template, inject <code>ActivatedRoute</code> or read <code>RouterOutlet.activatedRouteData[\'animation\']</code> to get the key.',
        'Use <code>group([animate(...), query(\':enter\', ...), query(\':leave\', ...)])</code> to run enter and leave animations simultaneously — this creates a clean crossfade or slide transition between pages.',
        'Bind the trigger to the router outlet host: <code>&lt;div [@routeAnimation]="outlet.activatedRouteData[\'animation\']" class="route-host"&gt;&lt;router-outlet #outlet="outlet" /&gt;&lt;/div&gt;</code>.',
        'Route animation components must have <code>position: absolute</code> or <code>position: fixed</code> during the transition so the entering and leaving pages can overlap during the crossfade — restore position after the animation.',
      ],
    },
    {
      heading: 'Performance and accessibility considerations',
      points: [
        'Only animate <code>transform</code> and <code>opacity</code> on the GPU-composited layer for maximum performance. Animating <code>width</code>, <code>height</code>, <code>top</code>, <code>left</code> triggers layout recalculation (expensive).',
        'Add <code>will-change: transform, opacity</code> in CSS on elements you plan to animate — this hints the browser to promote them to their own composite layer before the animation starts, eliminating paint costs.',
        'Keep durations between <strong>150ms and 400ms</strong>. Shorter than 150ms is imperceptible; longer than 400ms feels sluggish. Entrance animations (200–300ms) should be slightly slower than exit animations (150–200ms).',
        'Respect the <code>prefers-reduced-motion</code> media query. Wrap animation definitions in <code>&#64;media (prefers-reduced-motion: no-preference)</code> in CSS, or check <code>window.matchMedia(\'(prefers-reduced-motion: reduce)\')</code> and use <code>provideNoopAnimations()</code> programmatically.',
        'Disable animations in tests using <code>provideNoopAnimations()</code> (standalone) or <code>NoopAnimationsModule</code> (NgModule). Animations in tests add timing complexity and make snapshot tests non-deterministic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'typescript',
      code: `// app.config.ts — lazy-load the animations engine
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [provideAnimationsAsync()],
};

// component.ts — declare triggers in @Component metadata
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  animations: [
    trigger('openClose', [
      state('open',   style({ height: '*', opacity: 1 })),
      state('closed', style({ height: '0px', opacity: 0 })),
      transition('open <=> closed', animate('300ms ease-in-out')),
    ]),
  ],
})
export class MyComponent {
  isOpen = signal(true);
}

// template
// <div [@openClose]="isOpen() ? 'open' : 'closed'">...</div>`,
    },
    {
      label: ':enter/:leave',
      language: 'typescript',
      code: `trigger('fadeSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-12px)' }),
    animate('250ms ease-out',
      style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('200ms ease-in',
      style({ opacity: 0, transform: 'translateY(-12px)' })),
  ]),
]),

// Template — add @fadeSlide on the element inside @if
// Angular fires :enter when @if becomes truthy, :leave when it becomes falsy
// The element is kept in the DOM until :leave animation completes

// @if (show()) {
//   <div @fadeSlide>
//     Content
//   </div>
// }`,
    },
    {
      label: 'keyframes + stagger',
      language: 'typescript',
      code: `import { keyframes, stagger, query } from '@angular/animations';

// Keyframes — multi-step animation using offset values 0–1
trigger('pulse', [
  transition('* => active', [
    animate('600ms ease', keyframes([
      style({ transform: 'scale(1)',    offset: 0    }),
      style({ transform: 'scale(1.2)', offset: 0.5  }),
      style({ transform: 'scale(1)',   offset: 1    }),
    ])),
  ]),
]),

// Stagger — animate list items sequentially with a delay between each
trigger('listAnim', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateX(-20px)' }),
      stagger(80, [                       // 80ms gap between each item
        animate('250ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ], { optional: true }),              // safe when list is empty
  ]),
]),

// Template — put [@listAnim] on the PARENT, not each item
// <ul [@listAnim]="items().length">
//   @for (item of items(); track item) { <li>{{ item }}</li> }
// </ul>`,
    },
    {
      label: 'AnimationBuilder',
      language: 'typescript',
      code: `import { AnimationBuilder, animate, style } from '@angular/animations';
import { inject, ElementRef, viewChild } from '@angular/core';

@Component({
  template: \`
    <div #box class="box">Animate me</div>
    <button (click)="runAnim()">Animate</button>
  \`,
})
export class BuilderDemo {
  private builder = inject(AnimationBuilder);
  private boxRef  = viewChild<ElementRef>('box');

  runAnim() {
    const factory = this.builder.build([
      style({ opacity: 1, transform: 'translateX(0)' }),
      animate('500ms ease-out', style({ opacity: 0, transform: 'translateX(100px)' })),
      animate('300ms ease-in',  style({ opacity: 1, transform: 'translateX(0)' })),
    ]);

    const player = factory.create(this.boxRef()!.nativeElement);

    player.onDone(() => player.destroy()); // always destroy when done
    player.play();
  }
}`,
    },
    {
      label: 'Route animations',
      language: 'typescript',
      code: `// 1. app.routes.ts — add 'animation' key to route data
export const routes: Routes = [
  { path: 'home',   loadComponent: () => import('./home.ts'),   data: { animation: 'Home' } },
  { path: 'detail', loadComponent: () => import('./detail.ts'), data: { animation: 'Detail' } },
];

// 2. shell component — trigger on the router-outlet wrapper
@Component({
  animations: [
    trigger('routeAnim', [
      transition('* <=> *', [
        query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
        group([
          query(':leave', [ animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-100%)' })) ], { optional: true }),
          query(':enter', [
            style({ opacity: 0, transform: 'translateX(100%)' }),
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
          ], { optional: true }),
        ]),
      ]),
    ]),
  ],
})
export class AppShell {}

// 3. shell template
// <div [@routeAnim]="outlet.activatedRouteData['animation']">
//   <router-outlet #outlet="outlet" />
// </div>`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which function from @angular/animations defines a named trigger and groups states and transitions?',
      options: ['state()', 'animate()', 'trigger()', 'transition()'],
      answer: 2,
      explanation: 'trigger(name, [...]) is the top-level function that names an animation and groups its state/transition definitions. It maps to a [@name] binding in the template.',
    },
    {
      q: 'In a state() style, what does height: \'*\' mean?',
      options: ['Set height to 0', 'Animate height infinitely', 'Use the element\'s natural/computed height at runtime', 'Match any height value from CSS'],
      answer: 2,
      explanation: 'height: \'*\' is Angular\'s wildcard value meaning "compute the element\'s natural height at runtime", which avoids hardcoding a pixel value for dynamically-sized content.',
    },
    {
      q: 'What do :enter and :leave represent in an Angular transition()?',
      options: [':enter fires on hover, :leave fires on blur', ':enter fires when the element is added to the DOM; :leave fires when it is removed', ':enter runs before a state change, :leave runs after', ':enter and :leave only work inside @for blocks'],
      answer: 1,
      explanation: ':enter (alias for void => *) triggers when an element is added to the DOM (e.g. inside @if becoming true), and :leave (* => void) triggers when it is removed. Angular keeps the element in DOM until :leave animation finishes.',
    },
    {
      q: 'In the pulse trigger, the transition is written as \'* => active\'. What does the wildcard * mean here?',
      options: ['Animate from the active state to any state', 'Animate only when moving from the idle state to active', 'Animate from any state into the active state', 'Animate between any two states that include the word active'],
      answer: 2,
      explanation: 'The wildcard * matches any state. So \'* => active\' means "whenever the state expression changes to the value active, run this animation", regardless of what the previous state was.',
    },
    {
      q: 'Where should the [@listAnim] binding be placed for stagger() to work correctly?',
      options: ['On each individual list item so Angular can target them directly', 'On the parent container element, because query() searches child elements inside the host', 'On the @for block using a structural directive syntax', 'On the outermost page wrapper so the animation has the widest scope'],
      answer: 1,
      explanation: 'The trigger must be on the parent container. query(\':enter\') then searches inside that host for newly-added child elements, and stagger() applies a sequential delay to each matched child.',
    },
    {
      q: 'What does AnimationBuilder enable that declarative triggers cannot do?',
      options: ['Defining animations at compile time for better performance', 'Running animations imperatively on any element via player.play(), with runtime-computed parameters', 'Using CSS @keyframes directly in Angular components', 'Sharing animation definitions between multiple trigger() calls'],
      answer: 1,
      explanation: 'AnimationBuilder creates animation players imperatively from an ElementRef, giving you full play/pause/reset control. This is essential when you need runtime-computed parameters (e.g. colours, durations from an API) or when animating elements obtained via @ViewChild.',
    },
    {
      q: 'How should you disable Angular animations in unit tests?',
      options: ['Call animations.disable() in the beforeEach() hook', 'Set animationEnabled = false on the trigger', 'Use provideNoopAnimations() (standalone) or NoopAnimationsModule (NgModule) in the TestBed providers', 'Import BrowserAnimationsModule with { disable: true }'],
      answer: 2,
      explanation: 'provideNoopAnimations() replaces the real animation engine with a no-op that runs animations instantaneously. This eliminates timing complexity and prevents non-deterministic snapshot tests.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'How do you enable Angular animations?', a: 'Add <code>provideAnimationsAsync()</code> in <code>app.config.ts</code> providers. For synchronous loading use <code>provideAnimations()</code>. In NgModule apps import <code>BrowserAnimationsModule</code>. Then import animation functions from <code>@angular/animations</code>.' },
    { q: 'What is the difference between state() and transition()?', a: '<code>state()</code> defines the CSS styles for a named stable state (e.g. "open", "closed"). <code>transition()</code> defines how Angular animates between two states — the from→to path and the duration. State = snapshot; transition = journey.' },
    { q: 'How do :enter and :leave work?', a: '<code>:enter</code> (alias for <code>void =&gt; *</code>) triggers when an element is added to the DOM via <code>@if</code> or <code>@for</code>. <code>:leave</code> (<code>* =&gt; void</code>) triggers on removal. Angular holds the element in the DOM during the leave animation before finally removing it.' },
    { q: 'How does stagger work with @for?', a: 'Put the trigger on the parent container: <code>&lt;ul [@listAnim]="items().length"&gt;</code>. Inside the trigger, use <code>query(\':enter\', stagger(80, [animate(...)]), { optional: true })</code>. Each newly added item animates in 80ms after the previous one.' },
    { q: 'Can Angular animations be driven by signals?', a: 'Yes — bind the animation trigger to a signal value in the template: <code>[@myAnim]="isOpen() ? \'open\' : \'closed\'"</code>. When the signal changes, Angular transitions between the states automatically — no extra wiring needed.' },
    { q: 'What are keyframes() in Angular animations?', a: '<code>keyframes([ style({ offset: 0, ... }), style({ offset: 0.5, ... }), style({ offset: 1, ... }) ])</code> defines multi-step animations within a single <code>animate()</code> call — equivalent to CSS @keyframes but with Angular\'s type-safe API. <code>offset</code> values are 0–1.' },
    { q: 'How do you create a route-level page transition animation?', a: 'Add <code>data: { animation: \'PageName\' }</code> to each route. In the shell, bind a trigger to the router-outlet wrapper: <code>[@routeAnim]="outlet.activatedRouteData[\'animation\']"</code>. Inside the trigger use <code>query(\':enter\')</code> and <code>query(\':leave\')</code> with <code>group()</code> to run both simultaneously.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'trigger()', type: 'function', desc: 'Defines a named animation trigger that groups states and transitions, bound in templates via [@name].', since: '2' },
    { name: 'state()', type: 'function', desc: 'Declares a named stable CSS style snapshot that an element can be in between transitions.', since: '2' },
    { name: 'transition()', type: 'function', desc: 'Specifies how Angular animates between two states, supporting :enter, :leave, and wildcard * expressions.', since: '2' },
    { name: 'animate()', type: 'function', desc: 'Defines the duration, easing function, and target styles for a single animation step within a transition.', since: '2' },
    { name: 'style()', type: 'function', desc: 'Declares a map of CSS properties as an inline style snapshot used in states, transitions, or keyframes.', since: '2' },
    { name: 'keyframes()', type: 'function', desc: 'Creates multi-step animations using offset values (0–1) inside a single animate() call, like CSS @keyframes.', since: '2' },
    { name: 'stagger()', type: 'function', desc: 'Applies a sequential time delay between each element matched by query(), creating cascade list animations.', since: '4' },
    { name: 'query()', type: 'function', desc: 'Selects child elements inside an animation host to apply animations — supports :enter, :leave, and CSS selectors.', since: '4' },
    { name: 'group()', type: 'function', desc: 'Runs multiple animations simultaneously (in parallel) — used in route transitions to run enter + leave at the same time.', since: '4' },
    { name: 'AnimationBuilder', type: 'class', desc: 'Injectable service for building and running animations imperatively on ElementRef instances via player.play()/pause()/destroy().', since: '4' },
    { name: 'provideAnimationsAsync()', type: 'function', desc: 'Registers the Angular animations engine as a lazy async provider in standalone app.config.ts.', since: '17' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Enabling animations: BrowserAnimationsModule vs provideAnimationsAsync()',
      before: `// app.module.ts (NgModule era)
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
@NgModule({
  imports: [BrowserAnimationsModule],
})
export class AppModule {}`,
      after: `// app.config.ts (standalone Angular 17+)
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
export const appConfig: ApplicationConfig = {
  providers: [provideAnimationsAsync()],   // lazy-loaded — smaller initial bundle
};`,
      note: 'provideAnimationsAsync() lazy-loads the animations engine, reducing initial bundle size vs the synchronous BrowserAnimationsModule.',
    },
    {
      title: 'Show/hide animation: *ngIf vs @if with :enter/:leave',
      before: `<!-- Old: *ngIf — :enter/:leave still works, but verbose -->
<div *ngIf="show" [@fadeSlide]>
  Content
</div>`,
      after: `<!-- New: @if works seamlessly — add @fadeSlide directly to inner element -->
@if (show()) {
  <div @fadeSlide>
    Content
  </div>
}`,
      note: ':enter and :leave fire automatically when @if adds or removes elements from the DOM. No extra configuration needed.',
    },
    {
      title: 'Binding animation state: plain property vs signal',
      before: `// Old: plain boolean property
isOpen = false;

// template
<div [@openClose]="isOpen ? 'open' : 'closed'">...</div>`,
      after: `// New: signal-driven state
isOpen = signal(true);

// template
<div [@openClose]="isOpen() ? 'open' : 'closed'">...</div>`,
      note: 'Signals integrate naturally — Angular re-evaluates the expression reactively and starts the transition when the signal changes.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting { optional: true } on query() when list may be empty',
      wrong: `query(':enter', [
  stagger(80, [animate('250ms', style({ opacity: 1 }))])
]) // throws RuntimeError if no :enter elements found`,
      right: `query(':enter', [
  stagger(80, [animate('250ms', style({ opacity: 1 }))])
], { optional: true }) // safe when list is empty`,
      explanation: 'Without { optional: true }, Angular throws a runtime error if query() finds no matching elements — common when a list starts empty or all items are already visible.',
    },
    {
      title: 'Placing [@listAnim] on each item instead of the parent container',
      wrong: `// Wrong: trigger on individual items — stagger has nothing to orchestrate
@for (item of items(); track item) {
  <li [@listAnim]>{{ item }}</li>
}`,
      right: `// Correct: trigger on parent — query() finds children inside it
<ul [@listAnim]="items().length">
  @for (item of items(); track item) {
    <li>{{ item }}</li>
  }
</ul>`,
      explanation: 'query(\':enter\') searches inside the trigger host element. Placing the trigger on each item means there are no children to query — stagger never fires correctly.',
    },
    {
      title: 'Not resetting state before re-triggering a one-shot animation',
      wrong: `// Only sets 'active' — if already 'active', Angular sees no change
triggerPulse() {
  this.pulseState.set('active');
}`,
      right: `// Reset to idle first, then set active on the next tick
triggerPulse() {
  this.pulseState.set('idle');
  setTimeout(() => this.pulseState.set('active'), 10);
}`,
      explanation: 'Angular only runs a transition when the state expression actually changes. If the value is already \'active\', setting it again is a no-op. Reset to \'idle\' first to force a new transition.',
    },
    {
      title: 'Using BrowserAnimationsModule in a standalone component\'s imports array',
      wrong: `// BrowserAnimationsModule is an NgModule — invalid here
@Component({
  imports: [BrowserAnimationsModule],
})`,
      right: `// Provide globally in app.config.ts providers
export const appConfig: ApplicationConfig = {
  providers: [provideAnimationsAsync()],
};`,
      explanation: 'BrowserAnimationsModule cannot be listed in a standalone component\'s imports array. Use provideAnimationsAsync() (or provideAnimations()) in the root providers instead.',
    },
    {
      title: 'Using animation durations that are too long or too short',
      wrong: `// 1200ms feels sluggish; 50ms is imperceptible
transition('open <=> closed', animate('1200ms ease-in-out'))
// or
transition(':enter', [animate('50ms', style({ opacity: 1 }))])`,
      right: `// Entrance: 200–300ms; exit: 150–200ms; state transitions: 250–350ms
transition('open <=> closed', animate('300ms ease-in-out'))
transition(':enter',  [animate('250ms ease-out', style({ opacity: 1 }))])
transition(':leave',  [animate('180ms ease-in',  style({ opacity: 0 }))])`,
      explanation: 'Animations under 150ms are imperceptible; over 400ms feel sluggish. Exit animations should be slightly faster than entrances. Match duration to distance: tiny movements need shorter durations than full-screen transitions.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Bounce-In Notification Badge',
    description: 'Create an Angular component that shows a notification badge using Angular animations. The badge should: (1) use a trigger called \'badgeAnim\' with keyframes to bounce in when it appears — scale from 0 → 1.3 → 0.9 → 1 — and fade out on :leave, (2) be toggled by a signal called \'show\', and (3) display a count passed via an input signal. Wire up the template binding [@badgeAnim] on the badge element.',
    language: 'typescript',
    hints: [
      'Import trigger, transition, animate, keyframes, style from \'@angular/animations\' and add them to the component\'s animations: [] array.',
      'Use transition(\':enter\', [ animate(\'400ms ease-out\', keyframes([...])) ]) with offset values 0, 0.6, 0.85, 1 to build the bounce curve.',
      'Use transition(\':leave\', [ animate(\'200ms ease-in\', style({ opacity: 0, transform: \'scale(0)\' })) ]) for exit.',
      'In the template use @if (show()) around the badge element, and add @badgeAnim as a trigger attribute (no binding value needed for :enter/:leave-only triggers).',
    ],
    starterCode: `import { Component, signal, input } from '@angular/core';
import { trigger, transition, animate, keyframes, style } from '@angular/animations';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [],
  animations: [
    // TODO: define trigger('badgeAnim', [...])
    // :enter -> bounce in using keyframes (scale 0 -> 1.3 -> 0.9 -> 1)
    // :leave -> fade + shrink out
  ],
  template: \`
    <div class="badge-host">
      <button (click)="show.set(!show())">Toggle Badge</button>
      <!-- TODO: wrap badge in @if (show()) and add [@badgeAnim] -->
      <span class="badge">{{ count() }}</span>
    </div>
  \`,
  styles: [\`
    .badge-host { position: relative; display: inline-block; }
    .badge {
      position: absolute; top: -8px; right: -8px;
      background: crimson; color: white;
      border-radius: 50%; width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: bold;
    }
  \`]
})
export class NotificationBadge {
  count = input(0);
  show  = signal(true);
}`,
    solution: `import { Component, signal, input } from '@angular/core';
import { trigger, transition, animate, keyframes, style } from '@angular/animations';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [],
  animations: [
    trigger('badgeAnim', [
      transition(':enter', [
        animate('400ms ease-out', keyframes([
          style({ opacity: 0, transform: 'scale(0)',    offset: 0    }),
          style({ opacity: 1, transform: 'scale(1.3)', offset: 0.6  }),
          style({ opacity: 1, transform: 'scale(0.9)', offset: 0.85 }),
          style({ opacity: 1, transform: 'scale(1)',   offset: 1    }),
        ])),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0)' })),
      ]),
    ]),
  ],
  template: \`
    <div class="badge-host">
      <button (click)="show.set(!show())">Toggle Badge</button>
      @if (show()) {
        <span class="badge" @badgeAnim>{{ count() }}</span>
      }
    </div>
  \`,
  styles: [\`
    .badge-host { position: relative; display: inline-block; }
    .badge {
      position: absolute; top: -8px; right: -8px;
      background: crimson; color: white;
      border-radius: 50%; width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: bold;
    }
  \`]
})
export class NotificationBadge {
  count = input(0);
  show  = signal(true);
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular animations are declared in the @Component animations array as named triggers — state+transition pairs driven by signal values in templates, with :enter/:leave for DOM insertion/removal.',
    mustKnow: [
      '<code>provideAnimationsAsync()</code> in <code>app.config.ts</code> is required — animations are opt-in and lazy-loaded',
      '<code>trigger(name, [state(...), transition(...)])</code> declares an animation; bind it in templates via <code>[@name]="expression"</code>',
      '<code>:enter</code> = element added to DOM (<code>@if</code>/<code>@for</code>); <code>:leave</code> = element removed — Angular holds it in DOM until leave animation finishes',
      '<code>height: \'*\'</code> in a state() style means "natural computed height at runtime" — avoids hardcoding pixel values',
      'For list animations: put <code>[@listAnim]</code> on the <strong>parent</strong>, use <code>query(\':enter\', stagger(...))</code> inside; always add <code>{ optional: true }</code>',
      '<code>keyframes([ style({ offset: 0, ... }), ... ])</code> creates multi-step animations; <code>offset</code> values are 0–1',
      'Animate only <code>transform</code> and <code>opacity</code> for GPU-composited performance; keep durations 150–400ms; use <code>provideNoopAnimations()</code> in tests',
    ],
    interviewFocus: [
      'What is the difference between state() and transition() in an Angular animation trigger?',
      'What do :enter and :leave represent, and how does Angular handle the DOM during :leave?',
      'Why must the [@listAnim] trigger be on the parent container for stagger() to work?',
      'What does AnimationBuilder provide that declarative triggers cannot?',
      'How do you disable Angular animations in unit tests?',
    ],
  };
}
