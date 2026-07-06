import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-css-style-isolation-with-shadowdom-encapsulation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './css-style-isolation-with-shadowdom-encapsulation.html',
  styleUrl: './css-style-isolation-with-shadowdom-encapsulation.scss',
})
export class CssStyleIsolationWithShadowdomEncapsulationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Emulated encapsulation is scoped, but only WITHIN Angular\'s own CSS-processing pipeline',
      points: [
        'Angular\'s DEFAULT encapsulation (<code>ViewEncapsulation.Emulated</code>) adds unique <code>_ngcontent-*</code> attributes to elements and rewrites component-scoped selectors to match — this prevents one Angular COMPONENT\'s styles from leaking into ANOTHER Angular component within the SAME Angular app. It does NOT create a hard boundary against GLOBAL styles (a plain, un-scoped <code>button { ... }</code> rule in a global stylesheet still applies everywhere), and critically, it provides NO protection at all against a completely SEPARATE Angular application (a different micro-frontend, with its own separate compilation) whose global styles happen to target the same tag names or class names.',
        'In a micro-frontend setup, the shell\'s global <code>styles.scss</code> and a remote\'s global <code>styles.scss</code> are BOTH just CSS rules applied to the SAME page\'s SAME DOM tree once composed together — Emulated encapsulation\'s component-scoping mechanism does not know or care which MICRO-FRONTEND a global rule originated from.',
      ],
    },
    {
      heading: 'ViewEncapsulation.ShadowDom creates a TRUE browser-level boundary',
      points: [
        '<code>ViewEncapsulation.ShadowDom</code> attaches the component\'s rendered DOM inside a real browser Shadow Root — CSS rules defined OUTSIDE the shadow root (including the shell\'s ENTIRE global stylesheet) simply CANNOT reach inside it, and rules defined INSIDE the component\'s own styles cannot leak OUT to affect the rest of the page. This is a genuine, browser-enforced boundary — not a naming-convention trick like BEM prefixing, and not dependent on Angular\'s own compiler doing anything special.',
        'Apply it per-component: <code>@Component({ encapsulation: ViewEncapsulation.ShadowDom, ... })</code> — typically on the ROOT component of a remote that will be embedded into a shell with an unknown, potentially conflicting global stylesheet, rather than on every component throughout the remote (nested components inside the shadow-rooted root automatically render inside the SAME shadow tree, inheriting the isolation without needing the encapsulation mode repeated on each one).',
      ],
    },
    {
      heading: 'The trade-off: intentional global values (fonts, CSS custom properties, design tokens) need explicit passthrough',
      points: [
        'ShadowDom\'s isolation is BIDIRECTIONAL and INTENTIONALLY strict — it also blocks things you likely WANT to inherit, like the shell\'s global font-family or a shared design system\'s CSS custom properties (<code>--brand-primary-color</code>). CSS custom properties DO cross shadow boundaries by INHERITANCE (they behave like normal inherited CSS properties, unlike most other rules) — as long as they are defined on an ancestor OUTSIDE the shadow root (e.g. on <code>:root</code> in the shell\'s global stylesheet), a component INSIDE the shadow root can still read them via <code>var(--brand-primary-color)</code>.',
        'Regular selectors, resets, and utility classes do NOT cross the boundary at all — if a remote MFE genuinely needs the shell\'s CSS reset or a shared component library\'s base styles, those specific stylesheets must be explicitly IMPORTED into the shadow-rooted component\'s own <code>styleUrls</code>, duplicating them into the shadow tree rather than relying on inheritance from the page\'s global styles.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/styles.css',
      content: `/* Simulates the SHELL's global stylesheet — deliberately aggressive,
   as a real shell's design system reset often is. */
:root {
  --brand-primary-color: #6366f1; /* a CSS custom property — DOES cross shadow boundaries */
}

button {
  background: crimson;
  color: white;
  padding: 4px 8px;
  border: none;
  font-family: 'Comic Sans MS', cursive; /* deliberately jarring for the demo */
}
`,
    },
    {
      path: 'src/app/emulated-widget.ts',
      content: `import { Component } from '@angular/core';

// Default encapsulation (Emulated) — this component's OWN button rule below
// is scoped to itself, but it does NOT protect against the GLOBAL button
// rule in styles.css, which still applies here since Emulated encapsulation
// only prevents component-to-component leakage WITHIN the same Angular app.
@Component({
  selector: 'app-emulated-widget',
  standalone: true,
  template: \`<button>Emulated (affected by global styles.css)</button>\`,
  styles: [\`/* no button rule here — nothing overrides the global crimson style */\`],
})
export class EmulatedWidgetComponent {}
`,
    },
    {
      path: 'src/app/shadow-widget.ts',
      content: `import { Component, ViewEncapsulation } from '@angular/core';

// ShadowDom encapsulation — this button is rendered inside a real Shadow
// Root. The global crimson button rule from styles.css CANNOT reach in here
// at all — only THIS component's own styles apply. The CSS custom property
// still crosses the boundary since custom properties inherit through shadow roots.
@Component({
  selector: 'app-shadow-widget',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: \`<button>ShadowDom (isolated from global styles.css)</button>\`,
  styles: [\`
    button {
      background: var(--brand-primary-color, #333); /* inherits the custom property */
      color: white;
      padding: 4px 8px;
      border: none;
      font-family: system-ui, sans-serif; /* NOT affected by global Comic Sans rule */
    }
  \`],
})
export class ShadowWidgetComponent {}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { EmulatedWidgetComponent } from './emulated-widget';
import { ShadowWidgetComponent } from './shadow-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EmulatedWidgetComponent, ShadowWidgetComponent],
  template: \`
    <h3>CSS style isolation: Emulated vs ShadowDom</h3>
    <p>Both buttons sit on the same page with the same global styles.css loaded. The
    Emulated one is styled crimson + Comic Sans by the "shell's" global CSS. The ShadowDom
    one is completely isolated — but still picks up the shared --brand-primary-color
    custom property, since custom properties inherit through shadow boundaries.</p>
    <app-emulated-widget />
    <app-shadow-widget />
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
  <head><title>CSS style isolation with ShadowDom encapsulation</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a font-family rule to ShadowWidgetComponent\'s styles that explicitly imports the shell\'s intended global font (Arial), proving that fonts do NOT automatically cross the shadow boundary and must be explicitly declared inside.',
    hint: 'Add `font-family: Arial, sans-serif;` directly inside shadow-widget.ts\'s button style rule — this is a deliberate, explicit passthrough rather than relying on inheritance from a global stylesheet.',
    solution: `// shadow-widget.ts
styles: [\`
  button {
    background: var(--brand-primary-color, #333);
    color: white;
    padding: 4px 8px;
    border: none;
    font-family: Arial, sans-serif; /* explicitly declared — NOT inherited from global styles.css */
  }
\`],`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Angular\'s default Emulated encapsulation protects a component from a completely SEPARATE micro-frontend\'s global styles.',
      reality: 'Emulated encapsulation only prevents component-to-component style leakage WITHIN the same Angular app\'s own compilation — it provides no protection against another micro-frontend\'s unrelated global stylesheet targeting the same tag or class names.',
    },
    {
      thought: 'ShadowDom encapsulation blocks ALL external CSS from affecting a component, with no exceptions.',
      reality: 'CSS custom properties (like --brand-primary-color) DO cross shadow boundaries by inheritance, as long as they are defined on an ancestor outside the shadow root — only regular selectors and non-inherited rules are blocked.',
    },
    {
      thought: 'a shadow-rooted remote automatically inherits the shell\'s global font, CSS reset, or shared design-system base styles.',
      reality: 'those must be explicitly imported into the shadow-rooted component\'s own styleUrls — regular stylesheet rules do not cross the shadow boundary at all, unlike CSS custom properties.',
    },
  ];
}
