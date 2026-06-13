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
  selector: 'app-accessibility',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent,
  ],
  templateUrl: './accessibility.html',
  styleUrl: './accessibility.scss',
})
export class AccessibilityDemo {

  prerequisites: Prerequisite[] = [
    { label: 'Angular CDK',    route: '/angular/cdk' },
    { label: 'Directives',     route: '/angular/directives' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'FocusMonitor',       type: 'class',     desc: 'CDK: tracks focus origin (mouse/keyboard/touch/programmatic) and emits FocusOrigin events on an element', since: 'CDK 6' },
    { name: 'LiveAnnouncer',      type: 'class',     desc: 'CDK: announces messages to screen readers via an ARIA live region — use for dynamic content updates', since: 'CDK 6' },
    { name: 'AriaDescriber',      type: 'class',     desc: 'CDK: manages aria-describedby links to shared description elements — avoids duplicate DOM IDs', since: 'CDK 6' },
    { name: 'A11yModule',         type: 'class',     desc: 'CDK module exporting cdkTrapFocus, cdkFocusInitial, cdkMonitorSubtreeFocus and other a11y directives', since: 'CDK 6' },
    { name: 'cdkTrapFocus',       type: 'directive', desc: 'Traps keyboard focus inside a container (modal/dialog) — Tab and Shift+Tab cycle within the region', since: 'CDK 6' },
    { name: 'cdkFocusInitial',    type: 'directive', desc: 'Marks the element that should receive focus when cdkTrapFocus activates', since: 'CDK 6' },
    { name: 'InteractivityChecker', type: 'class',   desc: 'CDK: checks whether an element is visible/focusable/tabbable — useful in custom focus-management logic', since: 'CDK 7' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'WCAG 2.1 and the four principles',
      points: [
        'WCAG 2.1 organises accessibility criteria into four principles: <strong>Perceivable</strong> (content is presentable to all senses), <strong>Operable</strong> (UI components are navigable via keyboard), <strong>Understandable</strong> (content and operation are clear), and <strong>Robust</strong> (content can be interpreted by assistive technologies).',
        'Angular SPAs face specific challenges: route transitions do not move browser focus automatically (unlike full page loads), dynamic content updates are invisible to screen readers without live regions, and client-side rendering may produce inaccessible DOM order.',
        'Levels A and AA are the legal/contractual baseline in most jurisdictions. Level AA includes meaningful requirements like colour contrast ratios (4.5:1 for normal text), focus visibility, and labelling of form controls.',
        'The Angular CDK\'s a11y module implements common patterns that are hard to get right by hand: focus trapping, focus origin tracking, live announcements, and describedby management.',
      ],
    },
    {
      heading: 'FocusMonitor — keyboard vs mouse focus styles',
      points: [
        '<code>FocusMonitor</code> from <code>@angular/cdk/a11y</code> tracks <em>how</em> an element received focus. The origin can be <code>"keyboard"</code>, <code>"mouse"</code>, <code>"touch"</code>, or <code>"program"</code>.',
        'The practical use is showing focus rings only for keyboard navigation — keyboard users need visible focus; mouse users find focus rings distracting. CSS alone cannot distinguish the two, but <code>FocusMonitor</code> adds a class or lets you apply styles conditionally.',
        'Call <code>monitor(elementRef)</code> in <code>ngAfterViewInit</code> and <code>stopMonitoring(elementRef)</code> in <code>ngOnDestroy</code>. The returned Observable emits <code>FocusOrigin | null</code>.',
        '<code>focusVia(elementRef, "keyboard")</code> programmatically focuses an element with a specific origin — useful for restoring focus to a trigger after a dialog closes.',
      ],
    },
    {
      heading: 'LiveAnnouncer — announcing dynamic updates',
      points: [
        'Screen readers read static page content but miss dynamic updates (toast notifications, loading state changes, form validation results) unless you explicitly announce them.',
        '<code>LiveAnnouncer</code> creates a hidden ARIA live region and injects text into it, which screen readers then announce. Call <code>announce(message, politeness)</code> — politeness is <code>"polite"</code> (waits for silence) or <code>"assertive"</code> (interrupts immediately).',
        'Use <code>"polite"</code> for most status updates (saved, loaded, filtered). Use <code>"assertive"</code> only for urgent messages — errors during a form submission, or a session expiry warning.',
        'Avoid over-announcing — every inject() call is spoken aloud. Don\'t announce things already visible in the focused element. The message should add information, not repeat what the user can already perceive.',
      ],
    },
    {
      heading: 'Focus trapping with cdkTrapFocus',
      points: [
        'When a modal or side-panel opens, keyboard focus must be confined inside it — a user pressing Tab should not be able to reach content behind the overlay. This is the <strong>focus trap</strong> pattern (WCAG 2.1 criterion 2.1.2).',
        '<code>cdkTrapFocus</code> is a directive that intercepts Tab and Shift+Tab keypresses inside its host element and wraps focus within the tabbable elements inside. When the trap is activated (<code>[cdkTrapFocusAutoCapture]="true"</code>), focus moves into the region immediately.',
        'Mark the initial focus target with <code>cdkFocusInitial</code> — typically the first actionable element or a heading if no actionable element makes sense. Without it, CDK picks the first tabbable element.',
        'On close, you must manually return focus to the element that triggered the modal. Store a reference before opening: <code>const trigger = document.activeElement as HTMLElement</code> and call <code>trigger.focus()</code> in the close handler.',
      ],
    },
    {
      heading: 'Semantic HTML and ARIA in Angular templates',
      points: [
        'The first rule of ARIA: use native HTML elements whenever possible. <code>&lt;button&gt;</code> is keyboard-accessible, has the right role, and fires click on Enter/Space out of the box. A <code>&lt;div (click)="..."&gt;</code> needs <code>role="button"</code>, <code>tabindex="0"</code>, and keydown handlers — all of which you can forget.',
        'Common Angular patterns that need attention: <code>routerLink</code> on a <code>&lt;div&gt;</code> (use <code>&lt;a&gt;</code> instead), icon-only buttons (need <code>aria-label</code>), loading spinners (need <code>role="status"</code> + <code>aria-label</code>), and tab components (need proper ARIA tab/tabpanel/tablist roles).',
        'Use Angular\'s attribute binding for dynamic ARIA: <code>[attr.aria-expanded]="isOpen"</code>, <code>[attr.aria-disabled]="isDisabled"</code>. Do not use property binding (<code>[aria-expanded]</code>) — Angular maps property names to DOM properties, not HTML attributes, so ARIA attributes must use <code>attr.</code> prefix.',
        'Route transitions: Angular Router does not move focus on navigation. Add a skip-link, and after each navigation call <code>document.querySelector(\'h1\')?.focus()</code> or use a focus management service that listens to <code>NavigationEnd</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'FocusMonitor',
      language: 'typescript',
      code: `import { Component, ElementRef, OnDestroy, AfterViewInit, inject, viewChild } from '@angular/core';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';

@Component({
  selector: 'app-custom-button',
  standalone: true,
  template: \`
    <button #btn class="custom-btn" [class.focused-keyboard]="isKeyboardFocused()">
      <ng-content />
    </button>
  \`,
  styles: [\`
    .custom-btn { padding: .5rem 1rem; border: 2px solid transparent; border-radius: 6px; }
    /* Show ring only when focused by keyboard — not on mouse click */
    .custom-btn.focused-keyboard:focus { outline: 3px solid #0070f3; outline-offset: 2px; }
    .custom-btn:focus:not(.focused-keyboard) { outline: none; }
  \`],
})
export class CustomButtonComponent implements AfterViewInit, OnDestroy {
  private fm       = inject(FocusMonitor);
  private elRef    = inject(ElementRef);
  private btn      = viewChild.required<ElementRef>('btn');

  isKeyboardFocused = signal(false);

  ngAfterViewInit() {
    this.fm.monitor(this.btn().nativeElement).subscribe((origin: FocusOrigin) => {
      this.isKeyboardFocused.set(origin === 'keyboard');
    });
  }

  ngOnDestroy() {
    this.fm.stopMonitoring(this.btn().nativeElement);
  }

  // Restore focus to a specific element with a given origin
  focusTrigger(el: HTMLElement) {
    this.fm.focusVia(el, 'keyboard');
  }
}`,
    },
    {
      label: 'LiveAnnouncer',
      language: 'typescript',
      code: `import { Component, inject, signal } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-save-button',
  standalone: true,
  template: \`
    <button (click)="save()" [disabled]="saving()">
      {{ saving() ? 'Saving…' : 'Save' }}
    </button>
    <!-- Toast visible to sighted users -->
    @if (saved()) { <span class="toast">Saved!</span> }
  \`,
})
export class SaveButtonComponent {
  private announcer = inject(LiveAnnouncer);
  private http      = inject(HttpClient);

  saving = signal(false);
  saved  = signal(false);

  async save() {
    this.saving.set(true);

    // Announce loading state to screen readers
    await this.announcer.announce('Saving changes, please wait.', 'polite');

    this.http.post('/api/save', {}).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        // Announce success — polite: waits for reader to finish current sentence
        this.announcer.announce('Changes saved successfully.', 'polite');
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
        // Assertive: interrupts — use for errors that need immediate attention
        this.announcer.announce('Save failed. Please try again.', 'assertive');
      },
    });
  }
}`,
    },
    {
      label: 'cdkTrapFocus (modal)',
      language: 'typescript',
      code: `import { Component, signal, inject, ElementRef } from '@angular/core';
import { A11yModule, FocusMonitor } from '@angular/cdk/a11y';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [A11yModule],
  template: \`
    @if (isOpen()) {
      <!-- cdkTrapFocus confines Tab/Shift+Tab within the dialog -->
      <div class="backdrop" (click)="close()">
        <div class="dialog"
             role="dialog"
             aria-modal="true"
             [attr.aria-labelledby]="'dlg-title'"
             cdkTrapFocus
             cdkTrapFocusAutoCapture
             (click)="$event.stopPropagation()">
          <h2 id="dlg-title">Confirm Delete</h2>
          <p>This action cannot be undone.</p>
          <div class="actions">
            <!-- cdkFocusInitial: focus lands here when dialog opens -->
            <button cdkFocusInitial (click)="cancel()">Cancel</button>
            <button class="btn-danger" (click)="confirm()">Delete</button>
          </div>
        </div>
      </div>
    }
  \`,
})
export class ConfirmDialogComponent {
  private fm = inject(FocusMonitor);
  isOpen     = signal(false);
  private triggerEl: HTMLElement | null = null;

  open(trigger: HTMLElement) {
    this.triggerEl = trigger;  // remember who opened the dialog
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    // Return focus to the element that triggered the dialog
    if (this.triggerEl) this.fm.focusVia(this.triggerEl, 'keyboard');
  }

  cancel()  { this.close(); }
  confirm() { /* perform action */ this.close(); }
}`,
    },
    {
      label: 'ARIA in templates & route focus',
      language: 'typescript',
      code: `import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink],
  template: \`
    <!-- Skip link: first focusable element — lets keyboard users jump to content -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <nav>
      <!-- Use <a> with routerLink, not <div> — semantic + keyboard-accessible -->
      <a routerLink="/home">Home</a>
      <a routerLink="/about">About</a>

      <!-- Icon-only button needs aria-label -->
      <button aria-label="Open settings menu" (click)="openSettings()">
        <svg aria-hidden="true">...</svg>
      </button>

      <!-- Toggle button: use attr. prefix for ARIA attributes -->
      <button
        [attr.aria-expanded]="menuOpen"
        [attr.aria-controls]="'main-menu'"
        (click)="menuOpen = !menuOpen">
        Menu
      </button>
    </nav>

    <main id="main-content" tabindex="-1">
      <router-outlet />
    </main>
  \`,
})
export class AppComponent {
  menuOpen = false;

  constructor(private router: Router) {
    // After each route change, move focus to the main heading
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe(() => {
      const h1 = document.querySelector('h1') as HTMLElement | null;
      h1?.focus();  // h1 should have tabindex="-1" to be programmatically focusable
    });
  }
}`,
    },
    {
      label: 'AriaDescriber + accessible form',
      language: 'typescript',
      code: `import { Component, ElementRef, OnInit, OnDestroy, inject, viewChild } from '@angular/core';
import { AriaDescriber } from '@angular/cdk/a11y';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-accessible-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <div class="field">
      <label [for]="inputId">Email address</label>
      <input #inputEl
             [id]="inputId"
             type="email"
             [formControl]="emailCtrl"
             [attr.aria-invalid]="emailCtrl.invalid && emailCtrl.touched"
             [attr.aria-describedby]="inputId + '-hint ' + inputId + '-error'" />

      <!-- Hint always visible -->
      <span [id]="inputId + '-hint'" class="hint">We will not share your email.</span>

      <!-- Error only visible when invalid + touched -->
      @if (emailCtrl.invalid && emailCtrl.touched) {
        <span [id]="inputId + '-error'" class="error" role="alert">
          @if (emailCtrl.hasError('required')) { Email is required. }
          @if (emailCtrl.hasError('email'))    { Enter a valid email address. }
        </span>
      }
    </div>
  \`,
})
export class AccessibleInputComponent implements OnInit, OnDestroy {
  private describer = inject(AriaDescriber);
  private inputEl   = viewChild.required<ElementRef>('inputEl');

  inputId   = 'email-' + Math.random().toString(36).slice(2, 7);
  emailCtrl = new FormControl('', [Validators.required, Validators.email]);

  ngOnInit() {
    // AriaDescriber manages a shared description pool — avoids duplicate IDs
    this.describer.describe(this.inputEl().nativeElement, 'Format: name@domain.com');
  }

  ngOnDestroy() {
    this.describer.removeDescription(this.inputEl().nativeElement, 'Format: name@domain.com');
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using [aria-expanded] instead of [attr.aria-expanded]',
      wrong: `<!-- Angular tries to set a DOM property, not an HTML attribute -->
<button [aria-expanded]="isOpen">Menu</button>
<!-- Result: aria-expanded attribute never appears in the DOM -->`,
      right: `<!-- Use attr. prefix — Angular sets the HTML attribute directly -->
<button [attr.aria-expanded]="isOpen">Menu</button>
<!-- Now aria-expanded="true"/"false" appears correctly in the DOM -->`,
      explanation: 'Angular\'s property binding ([aria-expanded]) attempts to set a DOM property. ARIA attributes are not reflected as DOM properties — they must be set as HTML attributes via [attr.aria-expanded]. This is a very common Angular-specific mistake.',
    },
    {
      title: 'Using <div> for interactive elements',
      wrong: `<!-- Not keyboard accessible, no role, no Enter/Space activation -->
<div class="btn" (click)="submit()">Submit</div>
<div class="link" (click)="navigate()">Go to profile</div>`,
      right: `<!-- Native elements: keyboard, role, and activation built in -->
<button (click)="submit()">Submit</button>
<a routerLink="/profile">Go to profile</a>
<!-- If you truly need a div: add role, tabindex, and keydown handler -->`,
      explanation: 'Native <button> and <a> elements are keyboard-accessible out of the box — Tab to focus, Enter/Space to activate. A <div> needs role="button", tabindex="0", and a keydown handler for Enter/Space. Get it wrong and keyboard/screen-reader users cannot interact.',
    },
    {
      title: 'Not returning focus after dialog close',
      wrong: `close() {
  this.isOpen.set(false);
  // Focus is now lost — keyboard user has no idea where they are
}`,
      right: `private triggerEl: HTMLElement | null = null;

open(trigger: HTMLElement) {
  this.triggerEl = trigger;  // save before opening
  this.isOpen.set(true);
}

close() {
  this.isOpen.set(false);
  this.triggerEl?.focus();  // return focus to the trigger
}`,
      explanation: 'When a modal closes, focus drops to the <body> or stays on the now-removed modal. Keyboard and screen-reader users lose their place on the page. Always save the triggering element before opening and restore focus on close.',
    },
    {
      title: 'Announcing too much — spammy LiveAnnouncer calls',
      wrong: `// Called on every keystroke — announces every character typed
this.searchCtrl.valueChanges.subscribe(val => {
  this.announcer.announce(\`Search: \${val}\`);
});`,
      right: `// Debounce + announce only meaningful results, not every keystroke
this.searchCtrl.valueChanges.pipe(debounceTime(500)).subscribe(val => {
  const count = this.filteredResults().length;
  this.announcer.announce(\`\${count} result\${count === 1 ? '' : 's'} found.\`);
});`,
      explanation: 'LiveAnnouncer speaks every call. Calling it on every keystroke means the screen reader constantly interrupts itself. Debounce, and announce the meaningful outcome (result count) rather than the intermediate input.',
    },
  ];

  challenge: Challenge = {
    title: 'Build an accessible notification toast',
    language: 'typescript',
    description: `Create a ToastService and ToastComponent that:
1. Announces toasts to screen readers via LiveAnnouncer (polite for info/success, assertive for errors)
2. Uses role="status" on the toast container for passive announcements
3. Provides a close button with a proper aria-label (not just an X character)
4. Returns keyboard focus to the element that triggered the toast when it auto-closes (or is closed manually)
5. Accepts severity: 'info' | 'success' | 'error' and message: string`,
    hints: [
      'Inject LiveAnnouncer into the service; call announce() when a toast is added',
      'Use role="status" aria-live="polite" on the toast container in the template',
      'Close button: <button aria-label="Close notification">×</button>',
      'Store document.activeElement before showing the toast; restore on close',
      'assertive for error: interrupts screen reader speech for urgent messages',
    ],
    starterCode: `import { Injectable, signal, inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

export interface Toast { id: number; message: string; severity: 'info' | 'success' | 'error'; }

// TODO: ToastService
// - toasts = signal<Toast[]>([])
// - show(message, severity) — adds toast, announces it, auto-removes after 4s
// - dismiss(id) — removes toast, returns focus to triggerEl

// TODO: ToastComponent
// - template: role="status" container, list of toasts, close button with aria-label
// - inject ToastService`,
    solution: `import { Injectable, Component, signal, inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

export interface Toast { id: number; message: string; severity: 'info' | 'success' | 'error'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private announcer = inject(LiveAnnouncer);
  private nextId    = 0;
  private triggerEl: HTMLElement | null = null;

  toasts = signal<Toast[]>([]);

  show(message: string, severity: Toast['severity'] = 'info', trigger?: HTMLElement) {
    if (trigger) this.triggerEl = trigger;
    const id = ++this.nextId;
    this.toasts.update(t => [...t, { id, message, severity }]);

    // assertive for errors (interrupts); polite for info/success (waits)
    const politeness = severity === 'error' ? 'assertive' : 'polite';
    this.announcer.announce(message, politeness);

    // Auto-dismiss after 4 seconds
    setTimeout(() => this.dismiss(id), 4000);
  }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
    // Return focus when the last toast is dismissed
    if (this.toasts().length === 0 && this.triggerEl) {
      this.triggerEl.focus();
      this.triggerEl = null;
    }
  }
}

@Component({
  selector: 'app-toasts',
  standalone: true,
  template: \`
    <!-- role="status" + aria-live on the container for passive announcements -->
    <div class="toast-container" role="status" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.severity">
          <span>{{ toast.message }}</span>
          <button
            class="toast-close"
            [attr.aria-label]="'Close: ' + toast.message"
            (click)="toastService.dismiss(toast.id)">
            ×
          </button>
        </div>
      }
    </div>
  \`,
})
export class ToastsComponent {
  toastService = inject(ToastService);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does FocusMonitor\'s "keyboard" origin allow you to do that CSS :focus cannot?',
      options: [
        'Apply different styles when an element is focused by keyboard vs mouse',
        'Prevent mouse users from focusing any element',
        'Trap focus inside a container when the keyboard origin fires',
        'Read the current focused element from anywhere in the app',
      ],
      answer: 0,
      explanation: 'CSS :focus-visible approximates this but has inconsistent browser support. FocusMonitor tells you exactly whether the focus came from a keyboard, mouse, touch, or program — so you can show focus rings only for keyboard users while hiding them for mouse clicks.',
    },
    {
      q: 'When should you use LiveAnnouncer with politeness "assertive"?',
      options: [
        'For all status updates — assertive is more reliable than polite',
        'Only for urgent messages like errors that need immediate attention',
        'When the announcement message is longer than one sentence',
        'Whenever the user triggers an action themselves',
      ],
      answer: 1,
      explanation: '"assertive" interrupts the screen reader mid-speech — disorienting if overused. Reserve it for genuinely urgent announcements: authentication expiry, destructive action errors, session loss. Use "polite" (waits for silence) for routine status updates.',
    },
    {
      q: 'Which Angular syntax correctly sets an ARIA attribute dynamically?',
      options: [
        '[aria-expanded]="isOpen"',
        '[attr.aria-expanded]="isOpen"',
        '{{aria-expanded}}="isOpen"',
        'aria-expanded="{{ isOpen }}"',
      ],
      answer: 1,
      explanation: 'ARIA attributes are HTML attributes, not DOM properties. Angular\'s property binding ([]) targets DOM properties. The attr. prefix forces Angular to set the attribute directly, which is what ARIA requires. The interpolation form ({{ }}) works but does not coerce booleans to strings correctly.',
    },
    {
      q: 'What must you do when closing a modal to maintain keyboard accessibility?',
      options: [
        'Set tabindex="-1" on the modal root',
        'Return focus to the element that opened the modal',
        'Call document.body.focus()',
        'Destroy the modal DOM node immediately',
      ],
      answer: 1,
      explanation: 'When a modal closes, focus must return to the trigger element (the button that opened it). Without this, focus drops to the <body>, and keyboard/screen-reader users lose their place on the page — a WCAG 2.4.3 failure.',
    },
    {
      q: 'What is the purpose of cdkTrapFocus?',
      options: [
        'Prevents all keyboard input inside the container',
        'Confines Tab and Shift+Tab focus cycling within a container (e.g. modal)',
        'Automatically adds aria-modal to the host element',
        'Monitors focus origin inside a dialog',
      ],
      answer: 1,
      explanation: 'cdkTrapFocus intercepts Tab and Shift+Tab keypresses and wraps focus within the tabbable elements inside the container. It is essential for modal dialogs: without it, Tab can move focus behind the overlay to content the user cannot see.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use aria-live regions or LiveAnnouncer?',
      a: 'LiveAnnouncer is the Angular CDK wrapper around aria-live regions — prefer it in Angular components because it manages the live region element for you, clears previous announcements to avoid queuing issues, and cleans up on destroy. Use a raw aria-live region only if you need persistent visible text that also happens to be announced (e.g. a status bar). For ephemeral announcements (toasts, save confirmations, filter results), LiveAnnouncer is the right tool.',
    },
    {
      q: 'How do I handle route transition focus management in Angular?',
      a: 'Angular Router does not manage focus on navigation. The standard pattern is: (1) add a skip-link as the first focusable element, (2) give each page\'s h1 a tabindex="-1" so it is programmatically focusable, (3) subscribe to Router NavigationEnd events and call document.querySelector("h1")?.focus() after each navigation. Some teams use a focus management service that respects scroll restoration and focuses a landmark region instead of the heading.',
    },
    {
      q: 'How do I test accessibility in Angular?',
      a: 'Three layers: (1) automated — add jest-axe or axe-playwright to your test suite: await expect(axe(fixture.nativeElement)).resolves.toHaveNoViolations(). Catches ~30% of WCAG issues. (2) keyboard testing — manually Tab through every interactive flow in dev. (3) screen reader testing — NVDA + Chrome on Windows, VoiceOver + Safari on Mac. Automated tools cannot catch logical issues like wrong announcement text or missing focus restoration.',
    },
    {
      q: 'When should I use tabindex="0" vs tabindex="-1"?',
      a: 'tabindex="0" adds an element to the natural tab order — use it on custom interactive elements that should be reachable by Tab (custom controls built from divs/spans). tabindex="-1" removes an element from the tab order but keeps it programmatically focusable via .focus() — use it on elements you need to focus programmatically (dialog headings, main landmark after route change, error summary) without polluting the tab order.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular CDK\'s a11y module provides <code>FocusMonitor</code> (keyboard vs mouse focus origin), <code>LiveAnnouncer</code> (dynamic screen reader announcements), and <code>cdkTrapFocus</code> (modal focus confinement) — use all three alongside semantic HTML for WCAG 2.1 AA compliance.',
    mustKnow: [
      '<code>FocusMonitor.monitor(el)</code> emits <code>FocusOrigin</code> — show focus rings only for "keyboard" origin',
      '<code>LiveAnnouncer.announce(msg, politeness)</code> — "polite" waits for silence; "assertive" interrupts (errors only)',
      '<code>cdkTrapFocus</code> + <code>cdkFocusInitial</code> for modals; restore focus to trigger on close',
      '<code>[attr.aria-expanded]="isOpen"</code> — always use <code>attr.</code> prefix for ARIA attributes in Angular',
      'Semantic HTML first: <code>&lt;button&gt;</code> not <code>&lt;div (click)&gt;</code>; <code>&lt;a routerLink&gt;</code> not <code>&lt;div routerLink&gt;</code>',
      'Route transitions: subscribe to <code>NavigationEnd</code> and focus <code>h1</code> (with <code>tabindex="-1"</code>)',
    ],
    interviewFocus: [
      '<strong>FocusMonitor vs CSS :focus?</strong> — FocusMonitor knows the origin (keyboard/mouse/touch); CSS :focus fires for all',
      '<strong>LiveAnnouncer polite vs assertive?</strong> — polite waits; assertive interrupts — use assertive for errors only',
      '<strong>What to fix after dialog closes?</strong> — return focus to the triggering element (WCAG 2.4.3)',
      '<strong>[attr.aria-expanded] vs [aria-expanded]?</strong> — must use attr. prefix; Angular property binding doesn\'t set HTML attributes',
    ],
  };
}
