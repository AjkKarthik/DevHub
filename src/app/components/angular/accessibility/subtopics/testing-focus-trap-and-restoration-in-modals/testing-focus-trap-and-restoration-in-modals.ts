import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-focus-trap-and-restoration-in-modals-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-focus-trap-and-restoration-in-modals.html',
  styleUrl: './testing-focus-trap-and-restoration-in-modals.scss',
})
export class TestingFocusTrapAndRestorationInModalsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Focus behavior is genuinely testable — most teams skip it because it "looks visual"',
      points: [
        'Focus management is not actually a visual-only concern — <code>document.activeElement</code> is a real, queryable piece of DOM state in JSDOM/happy-dom test environments, exactly like any other DOM property. This means the three most important a11y behaviors of a modal — WHERE focus lands when it opens, whether Tab/Shift+Tab stay confined inside it, and WHERE focus returns when it closes — are all assertable in a normal unit test with no browser automation tool needed.',
        'The common mistake list\'s "not returning focus after dialog close" bug is exactly the kind of regression a targeted test catches immediately, while a purely visual/manual QA pass might miss it entirely (the dialog LOOKS closed correctly either way — only <code>document.activeElement</code> reveals whether focus actually returned).',
      ],
    },
    {
      heading: 'Testing that cdkFocusInitial receives focus on open',
      points: [
        'After opening the dialog and calling <code>fixture.detectChanges()</code>, assert <code>document.activeElement</code> is the SPECIFIC element marked with <code>cdkFocusInitial</code> — not just "some element inside the dialog has focus," but the exact intended one. This catches a bug where <code>cdkFocusInitial</code> is accidentally placed on the wrong button (e.g. the destructive "Delete" action instead of the safer "Cancel" default), which is a genuinely serious UX/safety issue for keyboard users who might press Enter immediately after the dialog opens.',
      ],
    },
    {
      heading: 'Testing that Tab at the boundary wraps back into the trap',
      points: [
        'Simulate a Tab keypress on the LAST focusable element inside the dialog (via <code>dispatchEvent(new KeyboardEvent(\'keydown\', { key: \'Tab\' }))</code>) and assert focus moves back to the FIRST focusable element — NOT to whatever content exists behind the modal. This directly tests the "confines Tab/Shift+Tab within tabbable elements" behavior that <code>cdkTrapFocus</code> promises, rather than trusting the CDK\'s own internal tests to cover your SPECIFIC dialog\'s tabbable-element structure (which can vary — a dialog with a date picker or a rich text editor has a very different tabbable-element set than a simple confirm dialog).',
        'Testing that focus RETURNS to the trigger element on close is the final piece: save a reference to a button OUTSIDE the dialog, click it to open the dialog, close the dialog (via Escape or the close button), and assert <code>document.activeElement</code> is that ORIGINAL trigger button again — this is the exact behavior the main topic\'s common mistake warns about forgetting.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/confirm-dialog.ts',
      content: `import { Component, signal, inject, ElementRef } from '@angular/core';
import { A11yModule, FocusMonitor } from '@angular/cdk/a11y';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [A11yModule],
  template: \`
    @if (isOpen()) {
      <div class="backdrop">
        <div class="dialog" role="dialog" aria-modal="true" cdkTrapFocus cdkTrapFocusAutoCapture>
          <h2>Confirm Delete</h2>
          <p>This action cannot be undone.</p>
          <button cdkFocusInitial (click)="cancel()">Cancel</button>
          <button (click)="confirm()">Delete</button>
        </div>
      </div>
    }
  \`,
})
export class ConfirmDialogComponent {
  private fm = inject(FocusMonitor);
  isOpen = signal(false);
  private triggerEl: HTMLElement | null = null;

  open(trigger: HTMLElement) {
    this.triggerEl = trigger;
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    if (this.triggerEl) this.fm.focusVia(this.triggerEl, 'keyboard');
  }

  cancel() { this.close(); }
  confirm() { this.close(); }
}
`,
    },
    {
      path: 'src/app/confirm-dialog.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmDialogComponent focus behavior', () => {
  it('focuses the cdkFocusInitial element (Cancel) when it opens', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    fixture.componentInstance.open(trigger);
    fixture.detectChanges();

    const cancelButton = fixture.nativeElement.querySelectorAll('button')[0];
    expect(document.activeElement).toBe(cancelButton);
    expect(cancelButton.textContent).toContain('Cancel'); // the SAFE default, not Delete
  });

  it('wraps focus from the last element back to the first on Tab', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentInstance.open(document.createElement('button'));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const [cancelButton, deleteButton] = buttons;

    deleteButton.focus();
    deleteButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    fixture.detectChanges();

    // cdkTrapFocus should wrap Tab from the last element back to the first —
    // this assertion depends on CDK's real focus-trap behavior being wired up
    // correctly for THIS dialog's specific tabbable elements.
    expect(document.activeElement).toBe(cancelButton);
  });

  it('returns focus to the original trigger element on close', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const trigger = document.createElement('button');
    trigger.textContent = 'Open dialog';
    document.body.appendChild(trigger);
    trigger.focus();

    fixture.componentInstance.open(trigger);
    fixture.detectChanges();
    expect(document.activeElement).not.toBe(trigger); // focus moved into the dialog

    fixture.componentInstance.close();
    fixture.detectChanges();

    expect(document.activeElement).toBe(trigger); // focus correctly returned
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ConfirmDialogComponent } from './confirm-dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ConfirmDialogComponent],
  template: \`
    <h3>Testing focus trap and restoration in modals</h3>
    <p>Open confirm-dialog.spec.ts — document.activeElement is a real, queryable piece of
    DOM state, making the initial focus target, Tab-wrapping, and focus-restoration all
    directly testable without any browser automation tool.</p>
    <app-confirm-dialog />
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
  <head><title>Testing focus trap and restoration in modals</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving Shift+Tab from the FIRST focusable element (Cancel) wraps to the LAST one (Delete), the reverse-direction case.',
    hint: 'Focus the cancel button, dispatch a keydown KeyboardEvent with key: "Tab" and shiftKey: true, then assert document.activeElement is the delete button.',
    solution: `it('wraps focus from the first element back to the last on Shift+Tab', () => {
  const fixture = TestBed.createComponent(ConfirmDialogComponent);
  fixture.componentInstance.open(document.createElement('button'));
  fixture.detectChanges();

  const buttons = fixture.nativeElement.querySelectorAll('button');
  const [cancelButton, deleteButton] = buttons;

  cancelButton.focus();
  cancelButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
  fixture.detectChanges();

  expect(document.activeElement).toBe(deleteButton);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'focus management behavior (where focus lands, whether it stays trapped, where it returns) is a visual-only concern that cannot be unit tested.',
      reality: 'document.activeElement is a real, queryable piece of DOM state in standard test environments — all three focus behaviors are directly assertable in a normal unit test, no browser automation tool required.',
    },
    {
      thought: 'testing that "some element inside the dialog" has focus after it opens is sufficient coverage for cdkFocusInitial.',
      reality: 'asserting the SPECIFIC intended element (e.g. the safe "Cancel" default, not the destructive "Delete" action) catches a real safety-relevant bug where cdkFocusInitial is accidentally placed on the wrong button.',
    },
    {
      thought: 'trusting Angular CDK\'s own test suite for cdkTrapFocus is sufficient — no need to test the Tab-wrapping behavior for your own specific dialog.',
      reality: 'a dialog\'s specific tabbable-element structure (a date picker, a rich text editor, a simple button pair) varies enough that testing the wrap behavior for YOUR dialog\'s actual content is still worthwhile, not redundant with CDK\'s generic tests.',
    },
  ];
}
