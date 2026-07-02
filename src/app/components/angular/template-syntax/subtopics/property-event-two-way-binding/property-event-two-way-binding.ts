import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-property-event-two-way-binding-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './property-event-two-way-binding.html',
  styleUrl: './property-event-two-way-binding.scss',
})
export class PropertyEventTwoWayBindingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Property binding — DOM properties, not HTML attributes',
      points: [
        '<code>[property]="expression"</code> sets a DOM PROPERTY (the JavaScript object property) — this is a genuinely different thing from an HTML attribute. <code>[disabled]="isDisabled()"</code> sets the DOM <code>disabled</code> property directly.',
        'Attributes with NO matching DOM property — <code>aria-label</code>, <code>colspan</code> — need the <code>[attr.aria-label]</code> / <code>[attr.colspan]</code> prefix instead. Using plain property-binding syntax for these silently fails at runtime rather than throwing a compile error, which makes it a genuinely easy mistake to miss.',
      ],
    },
    {
      heading: 'Event binding and key-combo shortcuts',
      points: [
        '<code>(event)="handler($event)"</code> listens to any DOM event and invokes the handler with the native event object as <code>$event</code>. Angular provides KEY-COMBO shortcuts built in: <code>(keyup.enter)</code>, <code>(keydown.escape)</code> — no manual <code>if (event.key === \'Enter\')</code> check needed.',
      ],
    },
    {
      heading: 'Two-way binding — ngModel vs the signal-native alternative',
      points: [
        '<code>[(ngModel)]="field"</code> is sugar for <code>[ngModel]="field" (ngModelChange)="field=$event"</code>, and requires <code>FormsModule</code> in the component\'s <code>imports</code> array — skip it and Angular throws "Can\'t bind to \'ngModel\'" at COMPILE time, a clear, loud error (unlike the attr/property mismatch above).',
        'For signal-based state, an explicit value+input binding is the more idiomatic modern alternative: <code>[value]="name()" (input)="name.set($any($event.target).value)"</code>. Angular 17.1+\'s <code>model()</code> signals support the SAME <code>[()]</code> two-way syntax on YOUR OWN components without needing <code>ngModel</code> at all — covered in depth in the Parent-Child Communication topic.',
      ],
    },
    {
      heading: 'Class and style binding',
      points: [
        '<code>[class.active]="isActive()"</code> adds/removes ONE CSS class conditionally. <code>[style.color]="textColor()"</code> and <code>[style.fontSize.px]="fontSize()"</code> apply inline styles — the <code>.px</code> suffix auto-appends the unit, avoiding a manual string-concatenation bug. For toggling multiple classes at once, <code>[ngClass]="{ active: isActive(), error: hasError() }"</code> is more concise than several separate <code>[class.x]</code> bindings.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <!-- Property binding: sets the real DOM property -->
    <button [disabled]="isBusy()">Save</button>

    <!-- Attribute binding: aria-label has no matching DOM property -->
    <button [attr.aria-label]="'Close dialog'">✕</button>

    <!-- Event binding + a built-in key-combo shortcut -->
    <input
      [value]="name()"
      (input)="name.set($any($event.target).value)"
      (keyup.enter)="save()"
      placeholder="Type and press Enter" />

    <!-- Class and style binding -->
    <p [class.active]="isBusy()" [style.color]="isBusy() ? 'orange' : 'green'">
      Status: {{ isBusy() ? 'Saving...' : 'Ready' }}
    </p>
  \`,
  styles: [\`.active { font-weight: bold; }\`],
})
export class App {
  name = signal('');
  isBusy = signal(false);

  save() {
    this.isBusy.set(true);
    setTimeout(() => this.isBusy.set(false), 1000);
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Property, event, two-way binding</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add [attr.data-testid]="\'save-button\'" to the Save button, and a [ngClass] binding on the status paragraph that applies both "active" (when busy) and "ready" (when not busy) classes.',
    hint: '[attr.data-testid]="\'save-button\'" on the button (attribute binding, since data-testid has no DOM property). [ngClass]="{ active: isBusy(), ready: !isBusy() }" on the paragraph instead of the single [class.active] binding.',
    solution: `<button [disabled]="isBusy()" [attr.data-testid]="'save-button'">Save</button>

<p [ngClass]="{ active: isBusy(), ready: !isBusy() }" [style.color]="isBusy() ? 'orange' : 'green'">
  Status: {{ isBusy() ? 'Saving...' : 'Ready' }}
</p>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '[aria-label]="value" and [attr.aria-label]="value" are two equivalent ways to write the same binding.',
      reality: 'plain [aria-label] tries to bind a DOM PROPERTY named aria-label, which does not exist — it silently fails at runtime with no compile error. Only [attr.aria-label] correctly sets the HTML ATTRIBUTE, which is what aria-label actually is.',
    },
    {
      thought: 'two-way binding on your own custom components requires FormsModule and ngModel, the same as built-in form elements.',
      reality: 'Angular 17.1+\'s model() signals support the exact same [(prop)] two-way syntax on your OWN components with zero ngModel/FormsModule involvement — ngModel is specifically for built-in form controls and third-party components that implement ControlValueAccessor.',
    },
    {
      thought: '[style.fontSize.px]="value" and [style.fontSize]="value + \'px\'" behave identically, just with different syntax.',
      reality: 'the .px unit suffix handles the unit concatenation for you automatically and safely — manually concatenating a string is prone to forgetting the unit entirely (a bare number in a CSS style is often silently ignored by the browser) or introducing a typo in the unit string.',
    },
  ];
}
