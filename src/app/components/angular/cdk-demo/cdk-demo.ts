import { Component, signal, inject } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ClipboardModule, Clipboard } from '@angular/cdk/clipboard';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
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
  selector: 'app-cdk-demo',
  imports: [DragDropModule, ScrollingModule, ClipboardModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './cdk-demo.html',
  styleUrl: './cdk-demo.scss',
})
export class CdkDemo {
  private clipboard = inject(Clipboard);
  private bp        = inject(BreakpointObserver);

  prerequisites: Prerequisite[] = [
    { label: 'Signals', route: '/angular/signals' },
  ];

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  todo = signal(['Write unit tests', 'Review PR', 'Update docs', 'Fix bug #42', 'Deploy to staging']);
  done = signal(['Setup project', 'Create components', 'Wire routing']);

  dropTodo(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      const arr = [...this.todo()];
      moveItemInArray(arr, event.previousIndex, event.currentIndex);
      this.todo.set(arr);
    } else {
      const t = [...this.todo()];
      const d = [...this.done()];
      transferArrayItem(t, d, event.previousIndex, event.currentIndex);
      this.todo.set(t);
      this.done.set(d);
    }
  }

  dropDone(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      const arr = [...this.done()];
      moveItemInArray(arr, event.previousIndex, event.currentIndex);
      this.done.set(arr);
    } else {
      const t = [...this.todo()];
      const d = [...this.done()];
      transferArrayItem(d, t, event.previousIndex, event.currentIndex);
      this.todo.set(t);
      this.done.set(d);
    }
  }

  // ── Virtual Scroll ────────────────────────────────────────────────────────
  bigList = Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, label: `Item ${i + 1}` }));
  trackById = (_: number, item: { id: number }) => item.id;

  // ── Clipboard ─────────────────────────────────────────────────────────────
  codeToCopy = `const greeting = 'Hello, Angular CDK!';`;
  copied = signal(false);

  copy() {
    this.clipboard.copy(this.codeToCopy);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  // ── Breakpoint observer ───────────────────────────────────────────────────
  isMobile = toSignal(
    this.bp.observe('(max-width: 768px)').pipe(map(r => r.matches)),
    { initialValue: false }
  );

  theory: TheoryPoint[] = [
    {
      heading: 'What is the Angular CDK?',
      points: [
        'CDK (Component Dev Kit) is Angular\'s toolkit of <strong>behaviour primitives without visual styling</strong> — the same building blocks Angular Material uses internally, exposed so you can build fully custom-styled components.',
        'Install once: <code>npm install @angular/cdk</code>. Import only the specific module you need (<code>DragDropModule</code>, <code>ScrollingModule</code>, <code>A11yModule</code>, etc.) — each is tree-shakable.',
        'The CDK is maintained by the Angular team and versioned in sync with Angular. It follows the same breaking-change policy, so it is safe to use as a production dependency.',
        'When to choose CDK over Angular Material: when you need the <strong>interaction</strong> (drag, scroll, focus management) but want complete design freedom, or when your design system cannot use Material\'s prebuilt styles.',
        'Key CDK packages: <code>@angular/cdk/drag-drop</code>, <code>@angular/cdk/scrolling</code>, <code>@angular/cdk/a11y</code>, <code>@angular/cdk/overlay</code>, <code>@angular/cdk/portal</code>, <code>@angular/cdk/layout</code>, <code>@angular/cdk/clipboard</code>, <code>@angular/cdk/platform</code>.',
      ],
    },
    {
      heading: 'Drag & Drop (DragDropModule)',
      points: [
        'Add <code>cdkDrag</code> to any element to make it draggable. Wrap the container with <code>cdkDropList</code> to create a sortable drop zone.',
        'Handle <code>(cdkDropListDropped)="onDrop($event)"</code> on the drop list. The event carries <code>previousIndex</code>, <code>currentIndex</code>, <code>previousContainer</code>, and <code>container</code>.',
        '<code>moveItemInArray(array, previousIndex, currentIndex)</code> reorders within the same list in-place. <code>transferArrayItem(from, to, prevIdx, currIdx)</code> moves an item between two arrays.',
        'Connect multiple lists for cross-list dragging: <code>[cdkDropListConnectedTo]="[\'other-list-id\']"</code>. Both lists must reference each other. Use <code>[cdkDropListData]="items()"</code> to pass the data array.',
        'Customise with: <code>cdkDragHandle</code> (restrict drag to a handle), <code>cdkDragPreview</code> (custom drag ghost), <code>cdkDragPlaceholder</code> (custom drop placeholder), and <code>[cdkDragLockAxis]="\'y\'"</code> to constrain axis.',
      ],
    },
    {
      heading: 'Virtual Scroll (ScrollingModule)',
      points: [
        '<code>CdkVirtualScrollViewport</code> renders <strong>only the rows visible in the viewport</strong> — 10,000 items in the DOM becomes 10–20 rows, keeping scroll performance constant regardless of list size.',
        'Set <code>itemSize</code> (fixed row height in px) for the best performance. CDK uses this to calculate the total scrollable height without rendering every row. Variable-height items are possible with <code>AutoSizeVirtualScrollStrategy</code>.',
        'Use <code>*cdkVirtualFor</code> (not <code>@for</code>) inside the viewport. It integrates with the viewport\'s render window to add and remove rows as you scroll.',
        'Pair with a <code>DataSource&lt;T&gt;</code> (from <code>@angular/cdk/collections</code>) for infinite scroll and server-side pagination — the data source handles fetching more data as the user scrolls toward the end.',
        'The viewport must have an explicit height (<code>style="height: 300px"</code> or a CSS class with <code>height</code>). Without it, the viewport collapses and renders nothing.',
      ],
    },
    {
      heading: 'Overlay and Portal — rendering outside the component tree',
      points: [
        '<code>Overlay</code> (from <code>@angular/cdk/overlay</code>) creates floating panels (tooltips, dropdowns, modals) that render at the end of the <code>&lt;body&gt;</code>, breaking out of any CSS <code>overflow: hidden</code> parents.',
        'Create an overlay: <code>const overlayRef = this.overlay.create({ positionStrategy, scrollStrategy })</code>. Then attach a <code>TemplatePortal</code> or <code>ComponentPortal</code>: <code>overlayRef.attach(portal)</code>. Call <code>overlayRef.detach()</code> to close.',
        '<code>PositionStrategy</code> controls where the overlay appears: <code>GlobalPositionStrategy</code> (fixed on screen, e.g. centred modal), <code>FlexibleConnectedPositionStrategy</code> (anchored to an element, e.g. dropdown).',
        '<code>ScrollStrategy</code> controls what happens when the page scrolls while the overlay is open: <code>CloseScrollStrategy</code> (close on scroll), <code>BlockScrollStrategy</code> (prevent page scroll), <code>RepositionScrollStrategy</code> (reposition overlay on scroll).',
        '<code>Portal</code> (from <code>@angular/cdk/portal</code>) lets you render any component or template into any DOM location — not just overlays. Useful for tab panels, side sheets, and slot-based layouts.',
      ],
    },
    {
      heading: 'Accessibility primitives (A11yModule)',
      points: [
        '<code>FocusTrap</code> constrains Tab/Shift+Tab navigation to a DOM subtree — the standard pattern for accessible modal dialogs. Inject <code>FocusTrapFactory</code>, call <code>focusTrapFactory.create(element)</code>, then <code>focusTrap.focusInitialElementWhenReady()</code>.',
        '<code>FocusMonitor</code> detects how an element received focus — keyboard, mouse, touch, or programmatic. Use it to show focus rings only for keyboard users, not mouse clicks: <code>focusMonitor.monitor(el).subscribe(origin =&gt; ...)</code>.',
        '<code>LiveAnnouncer</code> announces text to screen readers via an ARIA live region: <code>liveAnnouncer.announce(\'Item deleted\', \'assertive\')</code>. Polite announcements wait for the current speech to finish; assertive interrupts immediately.',
        '<code>AriaDescriber</code> manages <code>aria-describedby</code> relationships between elements without creating DOM conflicts. Angular Material uses this internally for tooltip descriptions.',
        '<code>InteractivityChecker</code> has utility methods like <code>isFocusable(el)</code>, <code>isTabbable(el)</code> — useful when building custom focus management (e.g. menu keyboard navigation). Always import <code>A11yModule</code> to use these services.',
      ],
    },
    {
      heading: 'Clipboard, BreakpointObserver, and Platform',
      points: [
        '<code>Clipboard.copy(text)</code> copies text to the OS clipboard without DOM boilerplate. Returns <code>true</code> on success. Uses the async Clipboard API with a synchronous <code>execCommand</code> fallback for older browsers.',
        '<code>BreakpointObserver.observe(query)</code> returns an <code>Observable&lt;BreakpointState&gt;</code> that emits when a CSS media query changes. Convert to a signal with <code>toSignal(obs.pipe(map(r =&gt; r.matches)), { initialValue: false })</code>.',
        'Use built-in constants from <code>@angular/cdk/layout</code>: <code>Breakpoints.Handset</code>, <code>Breakpoints.Tablet</code>, <code>Breakpoints.Web</code> — these map to the Material Design responsive grid breakpoints.',
        '<code>Platform</code> (from <code>@angular/cdk/platform</code>) tells you where the code is running: <code>platform.isBrowser</code>, <code>platform.ANDROID</code>, <code>platform.IOS</code>. Safer for SSR than checking <code>typeof window</code> directly.',
        '<code>CdkScrollable</code> and <code>ScrollDispatcher</code> track scroll events across all scrollable containers in the app — used by Material tooltips to close when the parent container scrolls away.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Drag & Drop',
      language: 'typescript',
      code: `import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

// Template:
// <div cdkDropList id="my-list" (cdkDropListDropped)="drop($event)">
//   @for (item of items(); track item) {
//     <div cdkDrag>{{ item }}</div>
//   }
// </div>

// Same-list reorder
drop(event: CdkDragDrop<string[]>) {
  const arr = [...this.items()];            // copy signal array first!
  moveItemInArray(arr, event.previousIndex, event.currentIndex);
  this.items.set(arr);
}

// Cross-list transfer (two connected lists)
// <div cdkDropList id="list-a" [cdkDropListConnectedTo]="['list-b']">
// <div cdkDropList id="list-b" [cdkDropListConnectedTo]="['list-a']">

dropBetweenLists(event: CdkDragDrop<string[]>) {
  const a = [...this.listA()];
  const b = [...this.listB()];
  if (event.previousContainer === event.container) {
    moveItemInArray(a, event.previousIndex, event.currentIndex);
    this.listA.set(a);
  } else {
    transferArrayItem(a, b, event.previousIndex, event.currentIndex);
    this.listA.set(a);
    this.listB.set(b);
  }
}`,
    },
    {
      label: 'Virtual Scroll',
      language: 'typescript',
      code: `// Template — must use *cdkVirtualFor (NOT @for) inside the viewport
// <cdk-virtual-scroll-viewport itemSize="48" style="height: 300px;">
//   <div *cdkVirtualFor="let item of items; trackBy: trackById" class="row">
//     #{{ item.id }} {{ item.label }}
//   </div>
// </cdk-virtual-scroll-viewport>

// Component
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({ imports: [ScrollingModule] })
export class MyComponent {
  // Plain array — all 10,000 items, only ~10 in the DOM at any time
  bigList = Array.from({ length: 10_000 }, (_, i) => ({ id: i + 1, label: \`Item \${i + 1}\` }));

  trackById = (i: number, item: { id: number }) => item.id;
}

// With async DataSource for infinite scroll:
// <cdk-virtual-scroll-viewport itemSize="56">
//   <div *cdkVirtualFor="let item of dataSource">{{ item.name }}</div>
// </cdk-virtual-scroll-viewport>`,
    },
    {
      label: 'Clipboard + Breakpoints',
      language: 'typescript',
      code: `import { Clipboard } from '@angular/cdk/clipboard';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';

export class MyComponent {
  private clipboard = inject(Clipboard);
  private bp        = inject(BreakpointObserver);

  // Copy to clipboard
  copyCode(text: string) {
    const success = this.clipboard.copy(text);
    if (success) console.log('Copied!');
  }

  // Respond to screen size — bridge Observable to Signal
  isMobile = toSignal(
    this.bp.observe(Breakpoints.Handset).pipe(   // or '(max-width: 768px)'
      map(result => result.matches)
    ),
    { initialValue: false }
  );

  // Use multiple breakpoints at once
  layout = toSignal(
    this.bp.observe([Breakpoints.Handset, Breakpoints.Tablet]).pipe(
      map(r => r.breakpoints[Breakpoints.Handset] ? 'mobile' : r.breakpoints[Breakpoints.Tablet] ? 'tablet' : 'desktop')
    ),
    { initialValue: 'desktop' }
  );
}`,
    },
    {
      label: 'Overlay',
      language: 'typescript',
      code: `import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { inject, ViewContainerRef, viewChild, TemplateRef } from '@angular/core';

@Component({
  template: \`
    <button #trigger (click)="open(trigger)">Open dropdown</button>

    <ng-template #panel>
      <div class="dropdown-panel">
        <button (click)="close()">Option 1</button>
        <button (click)="close()">Option 2</button>
      </div>
    </ng-template>
  \`
})
export class DropdownDemo {
  private overlay  = inject(Overlay);
  private vcr      = inject(ViewContainerRef);
  private panelRef = viewChild<TemplateRef<void>>('panel');
  private overlayRef: OverlayRef | null = null;

  open(origin: HTMLElement) {
    this.overlayRef?.detach();
    const posStrategy = this.overlay.position()
      .flexibleConnectedTo(origin)
      .withPositions([{ originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' }]);

    this.overlayRef = this.overlay.create({
      positionStrategy: posStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
      hasBackdrop: true,
    });
    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.attach(new TemplatePortal(this.panelRef()!, this.vcr));
  }

  close() { this.overlayRef?.detach(); }
}`,
    },
    {
      label: 'A11y — FocusTrap',
      language: 'typescript',
      code: `import { A11yModule, FocusTrapFactory } from '@angular/cdk/a11y';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { inject, ElementRef } from '@angular/core';

// FocusTrap — constrain Tab/Shift+Tab inside a modal
@Component({
  imports: [A11yModule],   // or import individual services
  template: \`
    @if (isOpen()) {
      <div class="modal" cdkTrapFocus cdkTrapFocusAutoCapture>
        <!-- Tab key cannot leave this div -->
        <h2>Modal Title</h2>
        <button (click)="close()">Close</button>
      </div>
    }
  \`
})
export class ModalDemo {
  isOpen = signal(false);
  // cdkTrapFocus directive is the easiest way to use FocusTrap
  // For imperative use, inject FocusTrapFactory
}

// LiveAnnouncer — tell screen readers about dynamic changes
@Component({ imports: [A11yModule] })
export class ListDemo {
  private announcer = inject(LiveAnnouncer);

  deleteItem(name: string) {
    // ...delete logic...
    this.announcer.announce(\`\${name} deleted\`, 'assertive');
  }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which function from @angular/cdk/drag-drop reorders an item within the SAME list?',
      options: ['transferArrayItem(arr, arr, prev, curr)', 'moveItemInArray(arr, previousIndex, currentIndex)', 'CdkDragDrop.reorder(previousIndex, currentIndex)', 'sortItemInList(arr, previousIndex, currentIndex)'],
      answer: 1,
      explanation: 'moveItemInArray mutates the array in place, shifting the dragged element from previousIndex to currentIndex within the same array. transferArrayItem is used when moving between two different lists.',
    },
    {
      q: 'How are two cdkDropList columns connected so items can be dragged between them?',
      options: ['A shared cdkDropListGroup wraps both columns', 'Each list passes the other\'s component reference via @ViewChild', 'Each list uses [cdkDropListConnectedTo] with the other list\'s string id', 'transferArrayItem automatically detects sibling lists'],
      answer: 2,
      explanation: 'Use [cdkDropListConnectedTo]="[\'other-list-id\']" on each list referencing the other by its id attribute. Both lists must reference each other for bidirectional drag.',
    },
    {
      q: 'What is the purpose of the itemSize attribute on <cdk-virtual-scroll-viewport>?',
      options: ['It sets the maximum number of items rendered at once', 'It defines the fixed pixel height of each row so CDK can calculate total scroll height without rendering all items', 'It controls the size of the scrollbar thumb', 'It limits the total height of the viewport container'],
      answer: 1,
      explanation: 'CDK virtual scroll needs itemSize (in px) to calculate the total scrollable height and determine which rows fall within the visible window — without rendering every row in the DOM.',
    },
    {
      q: 'In the cdk-demo, how is isMobile derived from BreakpointObserver as a signal?',
      options: ['new Signal(this.bp.observe(\'(max-width: 768px)\'))', 'computed(() => this.bp.observe(\'(max-width: 768px)\').matches)', 'toSignal(this.bp.observe(\'(max-width: 768px)\').pipe(map(r => r.matches)), { initialValue: false })', 'signal(this.bp.isMatched(\'(max-width: 768px)\'))'],
      answer: 2,
      explanation: 'toSignal() bridges an Observable to a Signal. BreakpointObserver returns Observable<BreakpointState>, so .pipe(map(r => r.matches)) extracts the boolean, and toSignal wraps it with an initialValue for SSR safety.',
    },
    {
      q: 'Which CDK accessibility utility constrains Tab/Shift+Tab keyboard navigation to a specific DOM subtree?',
      options: ['LiveAnnouncer', 'FocusMonitor', 'FocusTrap', 'AriaDescriber'],
      answer: 2,
      explanation: 'FocusTrap (from A11yModule) constrains Tab/Shift+Tab navigation to a specific DOM subtree — the standard pattern for accessible modal dialogs. LiveAnnouncer announces messages to screen readers. FocusMonitor tracks focus origin.',
    },
    {
      q: 'What is the Angular CDK Overlay module used for?',
      options: ['Adding CSS overlays and z-index management to components', 'Creating floating panels (tooltips, dropdowns, modals) that render at the document body level, escaping overflow:hidden parents', 'Managing route transitions with overlay animations', 'Providing a backdrop for drag-and-drop placeholder areas'],
      answer: 1,
      explanation: 'The Overlay module creates floating panels that render at the end of <body>, breaking out of any CSS overflow:hidden or stacking context. It provides flexible position strategies (connected-to-element or global) and scroll strategies.',
    },
    {
      q: 'Why must you spread a copy of a signal array before calling moveItemInArray()?',
      options: ['moveItemInArray() requires a new array reference to sort correctly', 'Signals are immutable contracts — mutations on the held array object do not trigger change detection; a new reference must be .set()', 'The CDK drag-drop module creates a frozen array that cannot be mutated directly', 'Angular signals use structural equality and will always re-render if you call moveItemInArray()'],
      answer: 1,
      explanation: 'moveItemInArray mutates the array in-place. Calling it on this.items() changes the same object Angular\'s signal already holds — no new reference is set, so the signal never fires and the UI does not update.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the Angular CDK?', a: 'The CDK (Component Dev Kit) is Angular\'s toolkit of behavior primitives without styling — drag & drop, virtual scrolling, accessibility, overlay, portal, clipboard, and more. It\'s what Angular Material is built on. Import only what you need from <code>@angular/cdk</code>.' },
    { q: 'How does virtual scrolling work?', a: '<code>CdkVirtualScrollViewport</code> renders only the DOM rows visible in the viewport. Set <code>itemSize</code> (row height in px) and use <code>*cdkVirtualFor</code> instead of <code>@for</code>. CDK calculates total scroll height from itemSize × length without rendering all rows.' },
    { q: 'How do you implement sortable drag & drop lists?', a: 'Wrap the list with <code>cdkDropList</code> and each item with <code>cdkDrag</code>. Handle <code>(cdkDropListDropped)="drop($event)"</code>. In the handler: spread-copy the signal array, call <code>moveItemInArray(arr, event.previousIndex, event.currentIndex)</code>, then <code>this.items.set(arr)</code>.' },
    { q: 'How does the Clipboard API from CDK work?', a: '<code>inject(Clipboard).copy(\'text\')</code> copies text to the OS clipboard without touching the DOM directly. It uses the async Clipboard API with an <code>execCommand</code> fallback. Returns <code>true</code> on success. Import <code>ClipboardModule</code>.' },
    { q: 'What is BreakpointObserver and how do you use it?', a: '<code>inject(BreakpointObserver).observe(Breakpoints.Handset)</code> returns an Observable that emits when the screen enters/leaves the breakpoint. Convert to a signal: <code>toSignal(obs.pipe(map(r =&gt; r.matches)), { initialValue: false })</code>.' },
    { q: 'Can you drag items between two different CDK lists?', a: 'Yes — add <code>[cdkDropListConnectedTo]="[\'other-list-id\']"</code> to both lists. Handle <code>(cdkDropListDropped)</code> with <code>transferArrayItem(from, to, prevIdx, currIdx)</code>. Check <code>event.previousContainer !== event.container</code> to detect a cross-list drop.' },
    { q: 'What is the Platform service from @angular/cdk/platform used for?', a: '<code>Platform</code> (inject from <code>@angular/cdk/platform</code>) tells you the runtime environment: <code>platform.isBrowser</code>, <code>platform.ANDROID</code>, <code>platform.IOS</code>. Safer for SSR than <code>typeof window !== \'undefined\'</code> checks, since it integrates with Angular\'s DI system.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'cdkDrag', type: 'directive', desc: 'Makes any host element draggable within a cdkDropList container.', since: '7' },
    { name: 'cdkDropList', type: 'directive', desc: 'Defines a sortable drop-zone container that accepts cdkDrag items.', since: '7' },
    { name: 'moveItemInArray', type: 'function', desc: 'Reorders an item within the same array in-place given previous and current indices.', since: '7' },
    { name: 'transferArrayItem', type: 'function', desc: 'Moves an item from one array to another at the specified indices.', since: '7' },
    { name: 'CdkVirtualScrollViewport', type: 'directive', desc: 'Renders only visible rows of a large list — dramatically reduces DOM size for 10,000+ items.', since: '7' },
    { name: '*cdkVirtualFor', type: 'directive', desc: 'Structural directive used inside CdkVirtualScrollViewport to manage the render window — replaces @for.', since: '7' },
    { name: 'Clipboard', type: 'class', desc: 'Injectable CDK service that copies text to the OS clipboard without direct DOM manipulation.', since: '9' },
    { name: 'BreakpointObserver', type: 'class', desc: 'Injectable service emitting Observable<BreakpointState> whenever a CSS media query changes.', since: '6' },
    { name: 'cdkDropListConnectedTo', type: 'directive', desc: 'Links two or more cdkDropList containers so items can be dragged between them.', since: '7' },
    { name: 'FocusTrap / cdkTrapFocus', type: 'directive', desc: 'Constrains Tab/Shift+Tab keyboard navigation to a DOM subtree — required for accessible modals.', since: '5' },
    { name: 'LiveAnnouncer', type: 'class', desc: 'Injectable service that announces messages to screen readers via an ARIA live region.', since: '5' },
    { name: 'Overlay', type: 'class', desc: 'Creates floating panels (tooltips, dropdowns) that render at document body level, escaping overflow:hidden.', since: '6' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Drag & Drop: mutable array mutation vs signal-safe copy',
      before: `// Mutates the array directly — signal never updates, UI freezes
drop(event: CdkDragDrop<string[]>) {
  moveItemInArray(this.items(), event.previousIndex, event.currentIndex);
}`,
      after: `// Spread-copy first, then .set() — signal fires, UI updates
drop(event: CdkDragDrop<string[]>) {
  const arr = [...this.items()];
  moveItemInArray(arr, event.previousIndex, event.currentIndex);
  this.items.set(arr);
}`,
      note: 'Signals are immutable by contract — always mutate a copy, then call .set() to notify subscribers.',
    },
    {
      title: 'BreakpointObserver: manual subscribe() vs toSignal()',
      before: `// Old: manual subscription + ngOnDestroy boilerplate
isMobile = false;
private sub!: Subscription;
ngOnInit() {
  this.sub = this.bp.observe('(max-width: 768px)')
    .subscribe(r => this.isMobile = r.matches);
}
ngOnDestroy() { this.sub.unsubscribe(); }`,
      after: `// New: bridge to signal — auto-unsubscribes on component destroy
isMobile = toSignal(
  this.bp.observe('(max-width: 768px)').pipe(map(r => r.matches)),
  { initialValue: false }
);`,
      note: 'toSignal() auto-unsubscribes when the component is destroyed, eliminating ngOnDestroy boilerplate.',
    },
    {
      title: 'Virtual scroll: *ngFor vs *cdkVirtualFor',
      before: `<!-- Old: renders all 10,000 rows — DOM explodes -->
<div style="height:300px; overflow:auto">
  <div *ngFor="let item of bigList">{{ item.label }}</div>
</div>`,
      after: `<!-- New: renders only visible rows — DOM stays at ~10 nodes -->
<cdk-virtual-scroll-viewport itemSize="48" style="height:300px">
  <div *cdkVirtualFor="let item of bigList; trackBy: trackById">
    {{ item.label }}
  </div>
</cdk-virtual-scroll-viewport>`,
      note: 'itemSize (px) is required so the viewport can compute total scroll height without rendering every row.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating a signal array directly instead of spreading a copy',
      wrong: `drop(event: CdkDragDrop<string[]>) {
  moveItemInArray(this.items(), event.previousIndex, event.currentIndex);
  // signal never fires — UI does not re-render
}`,
      right: `drop(event: CdkDragDrop<string[]>) {
  const arr = [...this.items()];
  moveItemInArray(arr, event.previousIndex, event.currentIndex);
  this.items.set(arr);   // new reference → signal fires
}`,
      explanation: 'moveItemInArray mutates its argument in-place. Calling it on this.items() changes the array the signal already holds — no new reference is set so the signal never fires change detection.',
    },
    {
      title: 'Forgetting itemSize on CdkVirtualScrollViewport',
      wrong: `<cdk-virtual-scroll-viewport style="height:300px">
  <div *cdkVirtualFor="let i of bigList">{{ i }}</div>
</cdk-virtual-scroll-viewport>`,
      right: `<cdk-virtual-scroll-viewport itemSize="48" style="height:300px">
  <div *cdkVirtualFor="let i of bigList">{{ i }}</div>
</cdk-virtual-scroll-viewport>`,
      explanation: 'Without itemSize the viewport cannot calculate total scroll height and falls back to rendering all items, completely defeating the purpose of virtual scroll.',
    },
    {
      title: 'Using @for inside CdkVirtualScrollViewport instead of *cdkVirtualFor',
      wrong: `<cdk-virtual-scroll-viewport itemSize="48" style="height:300px">
  @for (item of bigList; track item.id) {
    <div>{{ item.label }}</div>
  }
</cdk-virtual-scroll-viewport>`,
      right: `<cdk-virtual-scroll-viewport itemSize="48" style="height:300px">
  <div *cdkVirtualFor="let item of bigList; trackBy: trackById">
    {{ item.label }}
  </div>
</cdk-virtual-scroll-viewport>`,
      explanation: '@for renders every item eagerly. Only *cdkVirtualFor integrates with the viewport\'s render window and manages which items are in the DOM as you scroll.',
    },
    {
      title: 'Not connecting lists with cdkDropListConnectedTo for cross-list drag',
      wrong: `<!-- Missing connection — items silently bounce back to origin -->
<div cdkDropList (cdkDropListDropped)="dropTodo($event)">...</div>
<div cdkDropList (cdkDropListDropped)="dropDone($event)">...</div>`,
      right: `<div cdkDropList id="todo" [cdkDropListConnectedTo]="['done']" (cdkDropListDropped)="dropTodo($event)">...</div>
<div cdkDropList id="done" [cdkDropListConnectedTo]="['todo']" (cdkDropListDropped)="dropDone($event)">...</div>`,
      explanation: 'Without cdkDropListConnectedTo each list is isolated — items can only be dropped back onto their origin list. Both lists must reference each other by id.',
    },
    {
      title: 'Importing @angular/cdk instead of specific CDK sub-packages',
      wrong: `// Wrong: @angular/cdk is not a standalone importable package
import { DragDropModule } from '@angular/cdk';`,
      right: `// Correct: import from the specific sub-package
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { A11yModule } from '@angular/cdk/a11y';`,
      explanation: 'The CDK is split into sub-packages under @angular/cdk/*. Each is separately tree-shakable. Importing from @angular/cdk directly causes a module-not-found error at runtime.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Sortable Priority List with CDK Drag & Drop',
    description: 'Create a single sortable list of priority items using Angular CDK Drag & Drop. Users should be able to drag items to reorder them. Display each item\'s current position number alongside its label, and show a count of total items in the list header.',
    language: 'typescript',
    hints: [
      'Import DragDropModule and add cdkDropList to the container div and cdkDrag to each item div.',
      'Handle the (cdkDropListDropped) event: spread-copy the signal array, call moveItemInArray(arr, event.previousIndex, event.currentIndex), then .set() to update the signal.',
      'Use the @for block\'s $index implicit variable to display the item\'s position number next to its label.',
      'The CdkDragDrop event\'s previousContainer === container check tells you if the drop is within the same list — for a single list, you always call moveItemInArray.',
    ],
    starterCode: `import { Component, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-priority-list',
  imports: [DragDropModule],
  template: \`
    <div class="list-container">
      <h3>Priority List ({{ items().length }} items)</h3>
      <!-- TODO: Add cdkDropList and (cdkDropListDropped) binding here -->
      <div class="drop-zone">
        <!-- TODO: Loop over items() with @for, add cdkDrag to each item div -->
        <!-- Display position number and item label -->
      </div>
    </div>
  \`,
  styles: [\`
    .list-container { max-width: 320px; font-family: sans-serif; }
    .drop-zone { display: flex; flex-direction: column; gap: 6px; min-height: 40px; }
    .drag-item { padding: 10px 14px; background: #e8f0fe; border-radius: 6px;
                 cursor: grab; display: flex; align-items: center; gap: 10px; }
    .drag-item:active { cursor: grabbing; }
    .pos { font-weight: 700; color: #1a73e8; min-width: 20px; }
    .cdk-drag-preview { box-shadow: 0 4px 12px rgba(0,0,0,0.2); border-radius: 6px; }
    .cdk-drag-placeholder { opacity: 0.3; }
  \`]
})
export class PriorityListComponent {
  items = signal(['Ship feature A', 'Fix critical bug', 'Write unit tests', 'Update README', 'Deploy to prod']);

  drop(event: CdkDragDrop<string[]>) {
    // TODO: spread-copy the signal array, moveItemInArray, then .set()
  }
}`,
    solution: `import { Component, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-priority-list',
  imports: [DragDropModule],
  template: \`
    <div class="list-container">
      <h3>Priority List ({{ items().length }} items)</h3>
      <div cdkDropList class="drop-zone" (cdkDropListDropped)="drop($event)">
        @for (item of items(); track item; let i = $index) {
          <div cdkDrag class="drag-item">
            <span class="pos">{{ i + 1 }}</span>
            {{ item }}
          </div>
        }
      </div>
    </div>
  \`,
  styles: [\`
    .list-container { max-width: 320px; font-family: sans-serif; }
    .drop-zone { display: flex; flex-direction: column; gap: 6px; min-height: 40px; }
    .drag-item { padding: 10px 14px; background: #e8f0fe; border-radius: 6px;
                 cursor: grab; display: flex; align-items: center; gap: 10px; }
    .drag-item:active { cursor: grabbing; }
    .pos { font-weight: 700; color: #1a73e8; min-width: 20px; }
    .cdk-drag-preview { box-shadow: 0 4px 12px rgba(0,0,0,0.2); border-radius: 6px; }
    .cdk-drag-placeholder { opacity: 0.3; }
  \`]
})
export class PriorityListComponent {
  items = signal(['Ship feature A', 'Fix critical bug', 'Write unit tests', 'Update README', 'Deploy to prod']);

  drop(event: CdkDragDrop<string[]>) {
    const arr = [...this.items()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.items.set(arr);
  }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'The Angular CDK provides behavior primitives without styling — Drag & Drop, Virtual Scroll, Overlay, Accessibility (FocusTrap, LiveAnnouncer), Clipboard, and BreakpointObserver — so you get the mechanics without being locked into Material design.',
    mustKnow: [
      'CDK is installed separately: <code>npm install @angular/cdk</code>; import from specific sub-packages (<code>@angular/cdk/drag-drop</code>, etc.), not from <code>@angular/cdk</code> directly',
      '<code>moveItemInArray</code> reorders within the same list; <code>transferArrayItem</code> moves between two lists — always spread-copy the signal array first',
      '<code>CdkVirtualScrollViewport</code> + <code>*cdkVirtualFor</code> renders only visible rows; <code>itemSize</code> (px) is required; <code>@for</code> inside the viewport defeats virtualization',
      'Connect lists for cross-list drag: <code>[cdkDropListConnectedTo]="[\'other-id\']"</code> on both lists, each referencing the other',
      '<code>FocusTrap</code> / <code>cdkTrapFocus</code> constrains Tab navigation for accessible modals; <code>LiveAnnouncer</code> announces messages to screen readers',
      '<code>BreakpointObserver.observe(query)</code> → bridge to signal with <code>toSignal(obs.pipe(map(r =&gt; r.matches)), { initialValue: false })</code>',
      '<code>Overlay</code> renders floating panels at <code>&lt;body&gt;</code> level — use <code>FlexibleConnectedPositionStrategy</code> for element-anchored dropdowns',
    ],
    interviewFocus: [
      'What is the Angular CDK and when would you choose it over Angular Material?',
      'Why must you spread-copy a signal array before calling moveItemInArray()?',
      'Why must you use *cdkVirtualFor instead of @for inside CdkVirtualScrollViewport?',
      'How do you enable keyboard focus trapping in a modal dialog using CDK?',
      'How do you convert a BreakpointObserver observable into a signal?',
    ],
  };
}
