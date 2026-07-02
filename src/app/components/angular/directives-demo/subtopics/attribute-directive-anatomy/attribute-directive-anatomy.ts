import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-attribute-directive-anatomy-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './attribute-directive-anatomy.html',
  styleUrl: './attribute-directive-anatomy.scss',
})
export class AttributeDirectiveAnatomySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Attribute directives — modify, don\'t add or remove',
      points: [
        'An attribute directive changes the appearance or behavior of an EXISTING element WITHOUT adding or removing DOM nodes — it sits on the element and modifies it in place. This is the key distinction from a structural directive (covered next subtopic), which controls whether/how many DOM nodes exist at all.',
        'Declare one with <code>&#64;Directive({ selector: \'[appTooltip]\' })</code> — the BRACKETED selector matches any element carrying an <code>appTooltip</code> ATTRIBUTE. Directives are standalone by default since Angular 14 — import the class directly in a consuming component\'s <code>imports</code> array, no NgModule involved.',
      ],
    },
    {
      heading: 'ElementRef + Renderer2 — never touch nativeElement directly',
      points: [
        'Inject <code>ElementRef</code> to access the host element and <code>Renderer2</code> to mutate it SAFELY: <code>this.renderer.setStyle(this.el.nativeElement, \'color\', \'red\')</code>. Never write <code>this.el.nativeElement.style.color = \'red\'</code> directly — direct DOM mutation breaks server-side rendering and web-worker rendering contexts, where there is no real DOM to mutate.',
        'Both are injected via <code>inject()</code> at the field level, same pattern as everywhere else: <code>private el = inject(ElementRef); private renderer = inject(Renderer2);</code> — no constructor parameters needed.',
      ],
    },
    {
      heading: 'Responding to events and receiving configuration',
      points: [
        '<code>&#64;HostListener(\'mouseenter\')</code> responds to a DOM event ON THE HOST ELEMENT. Declare <code>&#64;HostListener(\'click\', [\'$event\'])</code> to receive the native event object as the decorated method\'s argument.',
        'Signal <code>input()</code> is the preferred way to receive configuration from the consumer: <code>appHighlight = input(\'#fef08a\')</code> lets the parent bind <code>[appHighlight]="color"</code> — reactive, works cleanly with <code>OnPush</code>, and composes with <code>computed()</code> the same way a component\'s own inputs do.',
      ],
    },
    {
      heading: 'Reflecting state back to the host',
      points: [
        '<code>host: { \'[class.active]\': \'isActive()\' }</code> in the <code>&#64;Directive</code> metadata reflects component/directive state back onto the host element\'s class list — cleaner than a separate <code>&#64;HostBinding</code> decorator per property, and keeps all host bindings visible in one place in the decorator metadata.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/highlight.directive.ts',
      content: `import { Directive, ElementRef, Renderer2, inject, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
  host: {
    '(mouseenter)': 'onEnter()',
    '(mouseleave)': 'onLeave()',
  },
})
export class HighlightDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  // Signal input — parent binds [appHighlight]="color"
  appHighlight = input('#fef08a');

  onEnter() {
    // Renderer2, never el.nativeElement.style directly — safe for SSR
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', this.appHighlight());
  }

  onLeave() {
    this.renderer.removeStyle(this.el.nativeElement, 'backgroundColor');
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { HighlightDirective } from './highlight.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HighlightDirective],
  template: \`
    <p appHighlight>Hover me — default yellow highlight.</p>
    <p [appHighlight]="'#bbf7d0'">Hover me — custom green highlight, via input().</p>
  \`,
})
export class App {}
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
  <head><title>Attribute directive anatomy</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a bold text effect on hover too, reflecting it back to the host via the host metadata\'s [class.bold] binding rather than Renderer2, using an isHovering signal.',
    hint: 'isHovering = signal(false); set it true/false in onEnter/onLeave, and add \'[class.bold]\': \'isHovering()\' to the host object in the @Directive decorator — this demonstrates the host-binding-reflects-state pattern instead of imperative Renderer2 calls for simple class toggling.',
    solution: `import { Directive, ElementRef, Renderer2, inject, input, signal } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
  host: {
    '(mouseenter)': 'onEnter()',
    '(mouseleave)': 'onLeave()',
    '[class.bold]': 'isHovering()',
  },
})
export class HighlightDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  appHighlight = input('#fef08a');
  isHovering = signal(false);

  onEnter() {
    this.isHovering.set(true);
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', this.appHighlight());
  }
  onLeave() {
    this.isHovering.set(false);
    this.renderer.removeStyle(this.el.nativeElement, 'backgroundColor');
  }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'setting el.nativeElement.style directly is a fine shortcut as long as the directive works in the browser during development.',
      reality: 'direct nativeElement mutation breaks server-side rendering and web-worker rendering contexts, where there is no real browser DOM to mutate — Renderer2 exists specifically to abstract over these different rendering environments safely.',
    },
    {
      thought: 'attribute directives require an NgModule to declare and export them, the same as older Angular library integrations.',
      reality: 'directives are standalone by default since Angular 14 — import the directive class directly into whichever component\'s imports array uses it, no NgModule wrapper needed anywhere.',
    },
    {
      thought: '@HostBinding decorators are required for reflecting directive state onto the host element — there is no alternative.',
      reality: 'the host: {...} object in the @Directive metadata is the modern alternative, keeping every host binding visible in one place in the decorator rather than scattered across multiple @HostBinding-decorated class members.',
    },
  ];
}
