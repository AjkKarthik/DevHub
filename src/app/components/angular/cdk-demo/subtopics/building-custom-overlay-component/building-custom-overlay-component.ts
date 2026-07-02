import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-building-custom-overlay-component-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './building-custom-overlay-component.html',
  styleUrl: './building-custom-overlay-component.scss',
})
export class BuildingCustomOverlayComponentSubtopic {

  cdkDeps = { '@angular/cdk': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'The four pieces you assemble by hand',
      points: [
        'Building a custom popover from scratch means wiring together FOUR distinct CDK pieces yourself: (1) an <code>OverlayRef</code> created via <code>overlay.create(config)</code>, (2) a <code>FlexibleConnectedPositionStrategy</code> anchoring it to a trigger element, (3) a <code>TemplatePortal</code> or <code>ComponentPortal</code> containing the actual content, and (4) explicit open/close logic you write — the CDK provides the primitives, not a finished component.',
        '<code>overlay.position().flexibleConnectedTo(triggerElementRef).withPositions([...])</code> defines a PRIORITY-ORDERED list of position pairs (e.g. "below, aligned left" then "above, aligned left" as a fallback) — the CDK automatically picks the first one that actually FITS in the viewport, flipping above the trigger if there is no room below.',
      ],
    },
    {
      heading: 'Closing on outside click and Escape',
      points: [
        '<code>overlayRef.outsidePointerEvents()</code> is an Observable that emits on any pointer event OUTSIDE the overlay\'s content — subscribe to it and call <code>overlayRef.dispose()</code> to implement "click outside to close," a pattern you must wire up explicitly; it does not happen automatically just by creating an overlay.',
        'Similarly, closing on <kbd>Escape</kbd> requires listening to <code>overlayRef.keydownEvents()</code> and checking for the Escape keycode yourself — both "click outside" and "Escape to close" are DELIBERATE choices the CDK leaves to you, not defaults baked into <code>OverlayRef</code>.',
      ],
    },
    {
      heading: 'Cleanup discipline',
      points: [
        '<code>overlayRef.dispose()</code> both detaches the content AND destroys the OverlayRef itself, releasing its DOM node — call it (not just <code>detach()</code>) when the popover is permanently done, typically in the host component\'s <code>ngOnDestroy</code>/<code>DestroyRef.onDestroy()</code> if the popover might still be open when the host is destroyed.',
        'All the Observable subscriptions you set up (<code>outsidePointerEvents()</code>, <code>keydownEvents()</code>) are automatically completed when <code>dispose()</code> runs — but any subscription you created MANUALLY (not via these overlay-provided streams) still needs its own explicit teardown, exactly like any other RxJS subscription.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, ElementRef, ViewContainerRef, viewChild, inject, TemplateRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Hand-built popover — Overlay + FlexibleConnectedPositionStrategy + TemplatePortal</h3>
    <button #trigger (click)="toggle()">Toggle popover</button>

    <ng-template #popoverContent>
      <div style="background: white; border: 1px solid #333; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        <p>I'm anchored below the button (or above, if there's no room).</p>
        <p>Click outside or press Escape to close.</p>
      </div>
    </ng-template>
  \`,
})
export class App {
  private overlay = inject(Overlay);
  private vcr = inject(ViewContainerRef);
  private trigger = viewChild.required<ElementRef>('trigger');
  private content = viewChild.required<TemplateRef<unknown>>('popoverContent');

  private overlayRef: OverlayRef | null = null;

  toggle() {
    if (this.overlayRef) {
      this.close();
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.trigger())
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },   // below, preferred
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },   // above, fallback
      ]);

    this.overlayRef = this.overlay.create({ positionStrategy, hasBackdrop: false });

    const portal = new TemplatePortal(this.content(), this.vcr);
    this.overlayRef.attach(portal);

    // Explicit close-on-outside-click — not automatic
    this.overlayRef.outsidePointerEvents().subscribe(() => this.close());
    // Explicit close-on-Escape — not automatic
    this.overlayRef.keydownEvents().subscribe(e => {
      if (e.key === 'Escape') this.close();
    });
  }

  close() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideAnimations()] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Building a custom overlay component</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add hasBackdrop: true to the overlay.create() config, and add overlayRef.backdropClick().subscribe(() => this.close()) as another explicit close trigger.',
    hint: 'Change hasBackdrop: false to hasBackdrop: true in the create() call, then add this.overlayRef.backdropClick().subscribe(() => this.close()); alongside the outsidePointerEvents and keydownEvents subscriptions.',
    solution: `this.overlayRef = this.overlay.create({ positionStrategy, hasBackdrop: true });

const portal = new TemplatePortal(this.content(), this.vcr);
this.overlayRef.attach(portal);

this.overlayRef.backdropClick().subscribe(() => this.close());
this.overlayRef.outsidePointerEvents().subscribe(() => this.close());
this.overlayRef.keydownEvents().subscribe(e => {
  if (e.key === 'Escape') this.close();
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'creating an OverlayRef with the CDK automatically gives you click-outside-to-close and Escape-to-close behavior.',
      reality: 'both are deliberate choices you wire up yourself, by subscribing to outsidePointerEvents()/keydownEvents() (or backdropClick() with hasBackdrop: true) and calling dispose() — none of it happens automatically just from overlay.create().',
    },
    {
      thought: 'withPositions() takes exactly one position and the overlay always renders there.',
      reality: 'it takes a PRIORITY-ORDERED array of fallback positions — the CDK automatically picks the first one that actually fits in the viewport, flipping to a fallback position when the preferred one would overflow.',
    },
    {
      thought: 'calling overlayRef.detach() is equivalent to calling overlayRef.dispose() for cleanup purposes.',
      reality: 'detach() only removes the current content, leaving the OverlayRef reusable for a later attach() — dispose() destroys the OverlayRef itself and releases its DOM node, which is what you want when the popover is permanently done.',
    },
  ];
}
