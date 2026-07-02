import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-programmatic-projection-createcomponent-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './programmatic-projection-createcomponent.html',
  styleUrl: './programmatic-projection-createcomponent.scss',
})
export class ProgrammaticProjectionCreatecomponentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'projectableNodes — content projection without a parent template',
      points: [
        'When a component is created imperatively via <code>ViewContainerRef.createComponent(MyComponent, { projectableNodes })</code>, there is no parent TEMPLATE providing content between opening/closing tags — <code>projectableNodes</code> is how you supply that content programmatically instead.',
        '<code>projectableNodes</code> is an ARRAY OF ARRAYS: <code>[[...nodesForFirstNgContent], [...nodesForSecondNgContent]]</code> — each inner array maps to one <code>&lt;ng-content&gt;</code> slot in the target component\'s template, IN THE SAME ORDER those slots appear.',
        'The nodes themselves are raw DOM nodes (<code>Node[]</code>), not Angular templates — commonly built with <code>document.createElement()</code>/<code>createTextNode()</code>, or extracted from an existing <code>ElementRef.nativeElement</code>.',
      ],
    },
    {
      heading: 'When this is actually needed',
      points: [
        'Most Angular code never needs this — declarative <code>&lt;ng-content&gt;</code> inside a template handles the vast majority of projection needs. Reach for <code>projectableNodes</code> only when components are created OUTSIDE the template tree — imperative toast/notification systems, portal/overlay libraries, or a CDK-style dynamic-injection API.',
        'Angular CDK\'s <code>Overlay</code> and <code>Portal</code> APIs use exactly this mechanism internally — when you \'attach a component to an overlay\', the CDK is calling <code>createComponent</code> with <code>projectableNodes</code> under the hood to project host content into the dynamically created component.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/toast.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: \`
    <div style="padding: 1rem; border: 2px solid #6366f1; border-radius: 8px;">
      <strong>Toast:</strong>
      <ng-content />
    </div>
  \`,
})
export class ToastComponent {}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, ViewContainerRef, viewChild } from '@angular/core';
import { ToastComponent } from './toast';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Programmatic content projection via createComponent + projectableNodes</h3>
    <button (click)="showToast()">Show a toast</button>
    <div #toastHost></div>
  \`,
})
export class App {
  private vcr = viewChild.required('toastHost', { read: ViewContainerRef });

  showToast() {
    // Build the content that would normally sit between <app-toast>...</app-toast>
    const message = document.createElement('span');
    message.textContent = 'Saved successfully! (built with document.createElement, not a template)';
    message.style.color = 'green';

    // projectableNodes[0] maps to the FIRST (and only) <ng-content /> in ToastComponent
    const ref = this.vcr().createComponent(ToastComponent, {
      projectableNodes: [[message]],
    });

    setTimeout(() => ref.destroy(), 4000);
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
  <head><title>Programmatic content projection</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the toast message text and color to show a red "Error!" message instead of the green success message.',
    hint: 'Change message.textContent to an error message and message.style.color to \'red\'.',
    solution: `const message = document.createElement('span');
message.textContent = 'Error! Something went wrong.';
message.style.color = 'red';`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'projectableNodes accepts Angular template syntax, similar to what you\'d write between a component\'s tags in HTML.',
      reality: 'it accepts raw DOM Node objects (Node[][]), not Angular template markup — you build them with document.createElement()/createTextNode() or extract existing nativeElement references, since there is no template compiler involved at this point.',
    },
    {
      thought: 'projectableNodes is a commonly needed pattern for most component composition.',
      reality: 'the vast majority of projection needs are covered by declarative <ng-content> inside a template — projectableNodes is specifically for components created OUTSIDE the template tree (imperative toasts, overlays, portals), which is a fairly narrow use case.',
    },
    {
      thought: 'a single flat array of nodes works for a component with multiple <ng-content> slots.',
      reality: 'projectableNodes is an array of arrays — one inner array per <ng-content> slot, in the same order those slots appear in the target component\'s template; a flat array only works for a component with exactly one slot.',
    },
  ];
}
