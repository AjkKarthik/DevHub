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
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

@Component({
  selector: 'app-animations-demo',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
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

  qna: QnaItem[] = [
    { q: 'How do you enable Angular animations?', a: 'Add <code>provideAnimationsAsync()</code> in <code>app.config.ts</code>. Import <code>BrowserAnimationsModule</code> (old) or use the standalone <code>provideAnimations()</code>. Import animation functions from <code>@angular/animations</code>.' },
    { q: 'What is the difference between state() and transition()?', a: '<code>state()</code> defines the CSS styles for a named state (e.g. "open", "closed"). <code>transition()</code> defines how Angular animates between two states — the from→to path and the duration.' },
    { q: 'How do :enter and :leave work?', a: '<code>:enter</code> triggers when an element is added to the DOM (via <code>@if</code> or <code>@for</code>). <code>:leave</code> triggers on removal. Angular holds the element in the DOM during the leave animation before finally removing it.' },
    { q: 'How does stagger work with @for?', a: '<code>query(\':enter\', stagger(50, [animate(\'200ms ease-out\', style({ opacity: 1, transform: \'translateY(0)\' }))])</code> — each list item animates in 50ms after the previous one, creating a cascade effect.' },
    { q: 'Can Angular animations be driven by signals?', a: 'Yes — bind the animation trigger to a signal value in the template: <code>[@myAnim]="isOpen() ? \'open\' : \'closed\'"</code>. When the signal changes, Angular transitions between the states.' },
    { q: 'What are keyframes() in Angular animations?', a: '<code>keyframes([ style({ offset: 0, ... }), style({ offset: 0.5, ... }), style({ offset: 1, ... }) ])</code> defines multi-step animations within a single transition — like CSS @keyframes but with Angular\'s API.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Angular Animations work',
      points: [
        '<code>provideAnimationsAsync()</code> must be in <code>app.config.ts</code> providers — animations are opt-in.',
        'The <code>animations: [...]</code> array in <code>@Component</code> registers triggers for that component only.',
        'Each <code>trigger(name, [...])</code> maps to a template binding <code>[@name]="stateExpression"</code>.',
        'Angular tracks when the state expression changes and runs the matching <code>transition()</code>.',
      ],
    },
    {
      heading: 'State vs :enter/:leave',
      points: [
        '<code>state()</code> defines a stable style snapshot. Transitions interpolate between two named states.',
        '<code>:enter</code> fires when an element is added to the DOM (e.g. inside <code>@if</code> or <code>@for</code>).',
        '<code>:leave</code> fires when an element is removed. Angular keeps it in the DOM until the animation finishes.',
        '<code>height: \'*\'</code> means "compute the natural height at runtime" — avoids hardcoding.',
      ],
    },
    {
      heading: 'keyframes + stagger',
      points: [
        '<code>keyframes([...])</code> lets you define multi-step animations using <code>offset</code> values (0–1).',
        '<code>stagger(delay, [animate(...)])</code> applies a time offset between each child element in a query.',
        '<code>query(\':enter\', [...], { optional: true })</code> — <code>optional: true</code> prevents errors when no elements match.',
        'Stagger is perfect for list animations — wrap the <code>@trigger</code> on the parent <code>ul/div</code>, not each item.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Animations run on the main thread — keep durations short (150–400ms) to avoid jank.',
        'Use <code>will-change: transform, opacity</code> in CSS to hint the browser to GPU-composite the layer.',
        'Signal state changes trigger animation state changes automatically — no extra wiring needed.',
        'Disable animations in tests: <code>NoopAnimationsModule</code> or <code>provideNoopAnimations()</code>.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'typescript',
      code: `// In main.ts — enable browser animations
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

bootstrapApplication(App, {
  providers: [provideAnimationsAsync()],
});

// In component — import BrowserAnimationsModule or use provideAnimations()
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
}`,
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

// In template — just add @fadeSlide to element
// Angular applies :enter when it appears in the DOM (@if / @for)
// and :leave when it's removed`,
    },
    {
      label: 'keyframes + stagger',
      language: 'typescript',
      code: `import { keyframes, stagger, query } from '@angular/animations';

// Keyframes — multi-step animation
trigger('pulse', [
  transition('* => active', [
    animate('600ms ease', keyframes([
      style({ transform: 'scale(1)',    offset: 0 }),
      style({ transform: 'scale(1.2)', offset: 0.5 }),
      style({ transform: 'scale(1)',    offset: 1 }),
    ])),
  ]),
]),

// Stagger — animate list items one-by-one
trigger('listAnim', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateX(-20px)' }),
      stagger(80, [
        animate('250ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ], { optional: true }),
  ]),
]),`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which function from @angular/animations is used to name a trigger and associate it with an array of states and transitions?', options: ['state()', 'animate()', 'trigger()', 'transition()'], answer: 2, explanation: 'trigger(name, [...]) is the top-level function that names an animation and groups its state/transition definitions. It maps to a [@name] binding in the template.' },
    { q: 'In the openClose trigger, height: \'*\' is used in the open state style. What does the asterisk mean?', options: ['Set height to 0', 'Animate height infinitely', 'Use the element\'s natural/computed height at runtime', 'Match any height value from CSS'], answer: 2, explanation: 'height: \'*\' is Angular\'s wildcard value meaning \'compute the element\'s natural height at runtime\', which avoids hardcoding a pixel value.' },
    { q: 'What do the special aliases :enter and :leave represent in an Angular transition()?', options: [':enter fires on hover, :leave fires on blur', ':enter fires when the element is added to the DOM, :leave fires when it is removed', ':enter runs before a state change, :leave runs after', ':enter and :leave are equivalent to \'void => *\' and \'* => void\' respectively, but only :enter has a DOM alias'], answer: 1, explanation: ':enter triggers when an element is added to the DOM (e.g. inside @if or @for becoming true), and :leave triggers when it is removed. Angular keeps the element in the DOM until the leave animation finishes.' },
    { q: 'In the pulse trigger the transition is written as \'* => active\'. What does this expression mean?', options: ['Animate from the active state to any state', 'Animate only when moving from the idle state to active', 'Animate from any state into the active state', 'Animate between any two states that include the word active'], answer: 2, explanation: 'The wildcard * matches any state, so \'* => active\' means \'whenever the state expression changes to the value active, run this animation\', regardless of what the previous state was.' },
    { q: 'When using stagger() with query(\':enter\', ...) on a list parent, where should the [@listAnim] binding be placed and why?', options: ['On each individual list item, so Angular can target them directly', 'On the parent container element, because query() searches child elements inside the host', 'On the @for block itself using a structural directive syntax', 'On the outermost page wrapper so the animation has the widest scope'], answer: 1, explanation: 'The trigger must be placed on the parent container. query(\':enter\') then searches within that host for newly-added child elements, and stagger() applies a sequential delay to each matched child.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'trigger()', type: 'function', desc: 'Defines a named animation trigger that groups states and transitions, bound in templates via [@name].' , since: '2'},
    { name: 'state()', type: 'function', desc: 'Declares a named stable CSS style snapshot that an element can be in between transitions.' , since: '2'},
    { name: 'transition()', type: 'function', desc: 'Specifies how Angular animates between two states, supporting aliases like :enter, :leave, and wildcards.' , since: '2'},
    { name: 'animate()', type: 'function', desc: 'Defines the duration, easing, and target styles for an animation step within a transition.' , since: '2'},
    { name: 'style()', type: 'function', desc: 'Declares a map of CSS properties as an inline style snapshot used in states, transitions, or keyframes.' , since: '2'},
    { name: 'keyframes()', type: 'function', desc: 'Creates multi-step animations using offset values (0–1) inside a single animate() call, like CSS @keyframes.' , since: '2'},
    { name: 'stagger()', type: 'function', desc: 'Applies a sequential time delay between each element matched by query(), creating cascade list animations.' , since: '4'},
    { name: 'query()', type: 'function', desc: 'Selects child elements inside an animation host to apply animations, supporting :enter, :leave, and CSS selectors.' , since: '4'},
    { name: 'provideAnimationsAsync()', type: 'function', desc: 'Registers the Angular animations engine as a lazy async provider in standalone app.config.ts.' , since: '17'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Enabling animations: BrowserAnimationsModule vs provideAnimationsAsync()', before: `// app.module.ts (NgModule era)
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
@NgModule({
  imports: [BrowserAnimationsModule],
})
export class AppModule {}`, after: `// main.ts (standalone Angular 17+)
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
bootstrapApplication(App, {
  providers: [provideAnimationsAsync()],
});`,
      note: 'provideAnimationsAsync() lazy-loads the animations engine, reducing initial bundle size.' },
    { title: 'Show/hide animation: *ngIf vs @if with :enter/:leave', before: `// Old: *ngIf — no :enter/:leave animation support without extra tricks
<div *ngIf='show' [@fadeSlide]>
  Content
</div>`, after: `// New: @if works seamlessly with :enter/:leave
@if (show()) {
  <div @fadeSlide>
    Content
  </div>
}`,
      note: ':enter and :leave fire automatically when @if adds or removes elements from the DOM.' },
    { title: 'Binding animation state: property vs signal', before: `// Old: plain boolean property
isOpen = false;
// template
<div [@openClose]="isOpen ? 'open' : 'closed'">...</div>`, after: `// New: signal-driven state
isOpen = signal(true);
// template
<div [@openClose]="isOpen() ? 'open' : 'closed'">...</div>`,
      note: 'Signals integrate naturally — Angular re-evaluates the expression and transitions states when the signal changes.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Forgetting { optional: true } on query() when list may be empty', wrong: `query(':enter', [
  stagger(80, [animate('250ms', style({ opacity: 1 }))])
]) // throws if no :enter elements found`, right: `query(':enter', [
  stagger(80, [animate('250ms', style({ opacity: 1 }))])
], { optional: true }) // safe when list is empty`, explanation: 'Without { optional: true }, Angular throws a runtime error if query() finds no matching elements, which is common when a list starts empty or all items are already visible.'  },
    { title: 'Placing [@listAnim] on each item instead of the parent container', wrong: `// Wrong: trigger on individual items
@for (item of items(); track item) {
  <li [@listAnim]>{{ item }}</li>
}`, right: `// Correct: trigger on parent, items animate via query()
<ul [@listAnim]='items().length'>
  @for (item of items(); track item) {
    <li>{{ item }}</li>
  }
</ul>`, explanation: 'query(\':enter\') searches inside the trigger host element. Placing the trigger on each item means there are no children to query — stagger never fires correctly.'  },
    { title: 'Not resetting state before re-triggering a one-shot animation', wrong: `// Only sets 'active' — if already active, no transition fires
triggerPulse() {
  this.pulseState.set('active');
}`, right: `// Reset to idle first, then set active on next tick
triggerPulse() {
  this.pulseState.set('idle');
  setTimeout(() => this.pulseState.set('active'), 10);
}`, explanation: 'Angular only runs a transition when the state expression actually changes. If the value is already \'active\', setting it again is a no-op; resetting to \'idle\' first forces a new state change.'  },
    { title: 'Using BrowserAnimationsModule in a standalone component instead of provideAnimationsAsync()', wrong: `// Importing NgModule in standalone component imports array
@Component({
  imports: [BrowserAnimationsModule], // invalid in standalone
})`, right: `// Provide globally in app.config.ts
providers: [provideAnimationsAsync()]`, explanation: 'BrowserAnimationsModule is an NgModule and cannot be listed in a standalone component\'s imports array. Use provideAnimationsAsync() (or provideAnimations()) in the root providers instead.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 17', label: 'provideAnimationsAsync() + @if/@for integration', features: ['provideAnimationsAsync() enables lazy-loaded animations engine, reducing initial bundle size', '@if and @for built-in control flow blocks work seamlessly with :enter and :leave animation aliases', 'No longer need *ngIf or *ngFor with separate animation modules — the new syntax is animation-aware by default'] },
    { version: 'Angular 4', label: 'query() and stagger() introduced', features: ['query() allows targeting child elements inside an animation host for coordinated animations', 'stagger() enables sequential time-offset animations across a list of matched child elements', 'AnimationBuilder service introduced for imperative programmatic animations'] },
  ];

  challenge: Challenge = {
    title: 'Build a Bounce-In Notification Badge',
    description: 'Create an Angular component that shows a notification badge using Angular animations. The badge should: (1) use a trigger called \'badgeAnim\' with keyframes to bounce in when it appears — scale from 0 → 1.3 → 0.9 → 1 — and fade out on :leave, (2) be toggled by a signal called \'show\', and (3) display a count passed via an input signal. Wire up the template binding [@badgeAnim] on the badge element.',
    language: 'typescript',
    hints: [
      'Import trigger, transition, animate, keyframes, style from \'@angular/animations\' and add them to the component\'s animations: [] array.',
      'Use transition(\':enter\', [ style({...}), animate(\'400ms ease-out\', keyframes([...])) ]) with offset values 0, 0.6, 0.85, 1 to build the bounce curve.',
      'Use transition(\':leave\', [ animate(\'200ms ease-in\', style({ opacity: 0, transform: \'scale(0)\' })) ]) for exit.',
      'In the template use @if (show()) around the badge div, and add @badgeAnim as a trigger attribute (no binding value needed for :enter/:leave triggers).',
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
          style({ opacity: 0, transform: 'scale(0)',   offset: 0    }),
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
}
