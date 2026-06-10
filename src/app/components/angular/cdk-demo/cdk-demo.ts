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
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

@Component({
  selector: 'app-cdk-demo',
  imports: [DragDropModule, ScrollingModule, ClipboardModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './cdk-demo.html',
  styleUrl: './cdk-demo.scss',
})
export class CdkDemo {
  private clipboard = inject(Clipboard);
  private bp        = inject(BreakpointObserver);

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

  qna: QnaItem[] = [
    { q: 'What is the Angular CDK?', a: 'The CDK (Component Dev Kit) is Angular\'s toolkit of behaviour primitives without styling — drag & drop, virtual scrolling, accessibility, overlay, portal, clipboard, and more. Import only what you need from <code>@angular/cdk</code>.' },
    { q: 'How does virtual scrolling work?', a: '<code>CdkVirtualScrollViewport</code> renders only the DOM rows visible in the viewport. Set <code>itemSize</code> (row height in px) and <code>cdkVirtualFor</code> instead of <code>@for</code>. Handles 100,000+ rows without performance issues.' },
    { q: 'How do you implement sortable drag & drop lists?', a: 'Wrap the list with <code>cdkDropList</code> and each item with <code>cdkDrag</code>. Handle <code>(cdkDropListDropped)="drop($event)"</code> and call <code>moveItemInArray(this.items, event.previousIndex, event.currentIndex)</code>.' },
    { q: 'How does the Clipboard API from CDK work?', a: '<code>inject(Clipboard).copy(\'text\')</code> copies text to the clipboard without touching the DOM directly. It falls back gracefully on browsers without the Clipboard API. Import <code>ClipboardModule</code>.' },
    { q: 'What is BreakpointObserver and how do you use it?', a: '<code>inject(BreakpointObserver).observe(Breakpoints.Handset).pipe(map(r => r.matches))</code> returns an Observable that emits true/false when the screen enters/leaves the breakpoint. Convert with <code>toSignal()</code>.' },
    { q: 'Can you drag items between two different CDK lists?', a: 'Yes — add <code>[cdkDropListConnectedTo]="[otherList]"</code> to both lists. Use a template reference variable to identify each list. Handle the <code>(cdkDropListDropped)</code> event to move items between the source and target arrays.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is the Angular CDK?',
      points: [
        'CDK = Component Dev Kit — the unstyled, behavior-only primitives that Angular Material is built on.',
        'You use CDK when you need the behavior (drag, scroll, overlay) but want full control over the appearance.',
        'Install once: <code>npm install @angular/cdk</code>. Import only the modules you need.',
        'CDK is maintained by the Angular team and versioned in sync with Angular itself.',
      ],
    },
    {
      heading: 'Drag & Drop (DragDropModule)',
      points: [
        'Add <code>cdkDrag</code> to any element to make it draggable.',
        'Wrap a list in <code>cdkDropList</code> to define a sortable container.',
        'Use <code>(cdkDropListDropped)="onDrop($event)"</code> and call <code>moveItemInArray</code> or <code>transferArrayItem</code>.',
        'Connect multiple lists with <code>[cdkDropListConnectedTo]="[otherListRef]"</code> for cross-list drag.',
      ],
    },
    {
      heading: 'Virtual Scroll (ScrollingModule)',
      points: [
        '<code>CdkVirtualScrollViewport</code> only renders the rows currently visible — ideal for 10 000+ row lists.',
        'Set a fixed <code>itemSize</code> (row height in px) for the best performance.',
        'Use <code>*cdkVirtualFor</code> instead of <code>@for</code> inside the viewport — it manages the render window.',
        'Pair with a data source (<code>DataSource&lt;T&gt;</code>) for infinite scroll and server-side data.',
      ],
    },
    {
      heading: 'Other CDK primitives',
      points: [
        '<code>Clipboard</code> service: <code>clipboard.copy(text)</code> — no browser API boilerplate needed.',
        '<code>BreakpointObserver</code>: observe media queries as observables — bridge to signals with <code>toSignal()</code>.',
        '<code>Overlay</code>: create portals, tooltips, and dropdowns that render outside the component tree.',
        '<code>A11yModule</code>: <code>FocusTrap</code>, <code>LiveAnnouncer</code>, <code>FocusMonitor</code> for accessible UIs.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Drag & Drop',
      language: 'typescript',
      code: `import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

// Template:
// <div cdkDropList (cdkDropListDropped)="drop($event)">
//   <div *ngFor="let item of items" cdkDrag>{{ item }}</div>
// </div>

drop(event: CdkDragDrop<string[]>) {
  moveItemInArray(this.items, event.previousIndex, event.currentIndex);
}

// Transfer between two lists:
// <div cdkDropList #list1 [cdkDropListConnectedTo]="[list2]">
// <div cdkDropList #list2 [cdkDropListConnectedTo]="[list1]">

dropBetweenLists(event: CdkDragDrop<string[]>) {
  if (event.previousContainer === event.container) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(from, to, event.previousIndex, event.currentIndex);
  }
}`,
    },
    {
      label: 'Virtual Scroll',
      language: 'html',
      code: `<!-- Renders only visible items — handles 100,000+ rows -->
<!-- itemSize = fixed height in px for each item (required) -->

<cdk-virtual-scroll-viewport itemSize="48" style="height: 300px;">
  @for (item of items; track item.id) {
    <div class="row">{{ item.label }}</div>
  }
</cdk-virtual-scroll-viewport>

<!-- With async data: -->
<cdk-virtual-scroll-viewport itemSize="56">
  <div *cdkVirtualFor="let item of items$|async; trackBy: trackById">
    {{ item.name }}
  </div>
</cdk-virtual-scroll-viewport>`,
    },
    {
      label: 'Clipboard + Breakpoints',
      language: 'typescript',
      code: `import { Clipboard } from '@angular/cdk/clipboard';
import { BreakpointObserver } from '@angular/cdk/layout';

export class MyComponent {
  private clipboard = inject(Clipboard);
  private bp        = inject(BreakpointObserver);

  // Copy to clipboard
  copyCode() {
    const success = this.clipboard.copy('text to copy');
    if (success) console.log('Copied!');
  }

  // Respond to screen size
  isMobile = toSignal(
    this.bp.observe('(max-width: 768px)').pipe(
      map(result => result.matches)
    ),
    { initialValue: false }
  );
  // Template: @if (isMobile()) { <app-mobile-nav /> } @else { <app-desktop-nav /> }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which function from @angular/cdk/drag-drop should you call when a user drops an item within the SAME list to reorder it?', options: ['transferArrayItem(arr, arr, prev, curr)', 'moveItemInArray(arr, previousIndex, currentIndex)', 'CdkDragDrop.reorder(previousIndex, currentIndex)', 'sortItemInList(arr, previousIndex, currentIndex)'], answer: 1, explanation: 'moveItemInArray mutates the array in place, shifting the dragged element from previousIndex to currentIndex within the same array. transferArrayItem is used when moving between two different lists.' },
    { q: 'In the CdkDemo kanban board, how are the two cdkDropList columns connected so items can be dragged between them?', options: ['A shared cdkDropListGroup wraps both columns', 'Each list passes the other\'s component reference via @ViewChild', 'Each list uses [cdkDropListConnectedTo] with the other list\'s string id', 'transferArrayItem automatically detects sibling lists'], answer: 2, explanation: 'The template uses [cdkDropListConnectedTo]="[\'done-list\']" and [cdkDropListConnectedTo]="[\'todo-list\']" referencing each list by its string id attribute, telling CDK which lists accept drops from which.' },
    { q: 'What is the purpose of the itemSize attribute on <cdk-virtual-scroll-viewport>?', options: ['It sets the maximum number of items rendered at once', 'It defines the fixed pixel height of each row so CDK can calculate scroll position without rendering all items', 'It controls the size of the scrollbar thumb', 'It limits the total height of the viewport container'], answer: 1, explanation: 'CDK virtual scroll needs itemSize (in px) to calculate the total scrollable height and determine which items fall within the visible window — without rendering every row in the DOM.' },
    { q: 'In CdkDemo, how is the isMobile signal created from BreakpointObserver?', options: ['new Signal(this.bp.observe(\'(max-width: 768px)\'))', 'computed(() => this.bp.observe(\'(max-width: 768px)\').matches)', 'toSignal(this.bp.observe(\'(max-width: 768px)\').pipe(map(r => r.matches)), { initialValue: false })', 'signal(this.bp.isMatched(\'(max-width: 768px)\'))'], answer: 2, explanation: 'toSignal() bridges an Observable to a Signal. The BreakpointObserver returns an Observable<BreakpointState>, so .pipe(map(r => r.matches)) extracts the boolean, and toSignal wraps it with an initialValue for SSR safety.' },
    { q: 'Which CDK accessibility utility would you use to programmatically trap keyboard focus inside a modal dialog so Tab cannot leave it?', options: ['LiveAnnouncer', 'FocusMonitor', 'FocusTrap', 'AriaDescriber'], answer: 2, explanation: 'FocusTrap (from A11yModule) constrains Tab/Shift+Tab navigation to a specific DOM subtree, which is the standard pattern for accessible modal dialogs. LiveAnnouncer announces messages to screen readers; FocusMonitor tracks focus origin.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'cdkDrag', type: 'directive', desc: 'Makes any host element draggable within a cdkDropList container.', since: '7' },
    { name: 'cdkDropList', type: 'directive', desc: 'Defines a sortable drop-zone container that accepts cdkDrag items.', since: '7' },
    { name: 'moveItemInArray', type: 'function', desc: 'Reorders an item within the same array in-place given previous and current indices.', since: '7' },
    { name: 'transferArrayItem', type: 'function', desc: 'Moves an item from one array to another at the specified indices.', since: '7' },
    { name: 'CdkDragDrop', type: 'interface', desc: 'Event payload emitted by cdkDropListDropped, carrying previousIndex, currentIndex, and container refs.', since: '7' },
    { name: 'CdkVirtualScrollViewport', type: 'directive', desc: 'Renders only the visible rows of a large list, dramatically reducing DOM size for 10,000+ items.', since: '7' },
    { name: '*cdkVirtualFor', type: 'directive', desc: 'Structural directive used inside CdkVirtualScrollViewport to manage the render window instead of @for.', since: '7' },
    { name: 'Clipboard', type: 'class', desc: 'Injectable CDK service that copies text to the OS clipboard without direct DOM manipulation.', since: '9' },
    { name: 'BreakpointObserver', type: 'class', desc: 'Injectable service that emits an Observable<BreakpointState> whenever a CSS media query changes.', since: '6' },
    { name: 'cdkDropListConnectedTo', type: 'directive', desc: 'Input binding that links two or more cdkDropList containers so items can be dragged between them.', since: '7' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Drag & Drop event handler: mutable array vs signal-safe copy',
      before: `// Old: mutate items array directly
drop(event: CdkDragDrop<string[]>) {
  moveItemInArray(this.items, event.previousIndex, event.currentIndex);
}`,
      after: `// New: spread-copy signal array, then .set()
drop(event: CdkDragDrop<string[]>) {
  const arr = [...this.items()];
  moveItemInArray(arr, event.previousIndex, event.currentIndex);
  this.items.set(arr);
}`,
      note: 'Signals are immutable by contract — always mutate a copy, then call .set().',
    },
    {
      title: 'BreakpointObserver: subscribe() vs toSignal()',
      before: `// Old: manual subscription + ngOnDestroy
isMobile = false;
ngOnInit() {
  this.bp.observe('(max-width: 768px)')
    .subscribe(r => this.isMobile = r.matches);
}`,
      after: `// New: bridge to signal, no subscription boilerplate
isMobile = toSignal(
  this.bp.observe('(max-width: 768px)').pipe(map(r => r.matches)),
  { initialValue: false }
);`,
      note: 'toSignal() auto-unsubscribes when the component is destroyed.',
    },
    {
      title: 'Virtual scroll: *ngFor vs *cdkVirtualFor',
      before: `<!-- Old: renders all 10,000 rows -->
<div style='height:300px; overflow:auto'>
  <div *ngFor='let item of bigList'>{{ item.label }}</div>
</div>`,
      after: `<!-- New: renders only visible rows -->
<cdk-virtual-scroll-viewport itemSize='48' style='height:300px'>
  <div *cdkVirtualFor='let item of bigList'>{{ item.label }}</div>
</cdk-virtual-scroll-viewport>`,
      note: 'itemSize (px) is required so the viewport can compute total scroll height without rendering every row.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating a signal array directly instead of spreading a copy',
      wrong: `drop(event: CdkDragDrop<string[]>) {
  moveItemInArray(this.items(), event.previousIndex, event.currentIndex);
  // signal never updated — UI does not re-render
}`,
      right: `drop(event: CdkDragDrop<string[]>) {
  const arr = [...this.items()];
  moveItemInArray(arr, event.previousIndex, event.currentIndex);
  this.items.set(arr);
}`,
      explanation: 'moveItemInArray mutates its argument in-place. Calling it on this.items() changes the array object Angular already holds, so no new reference is set and the signal does not fire change detection.',
    },
    {
      title: 'Forgetting itemSize on CdkVirtualScrollViewport',
      wrong: `<cdk-virtual-scroll-viewport style='height:300px'>
  <div *cdkVirtualFor='let i of bigList'>{{ i }}</div>
</cdk-virtual-scroll-viewport>`,
      right: `<cdk-virtual-scroll-viewport itemSize='48' style='height:300px'>
  <div *cdkVirtualFor='let i of bigList'>{{ i }}</div>
</cdk-virtual-scroll-viewport>`,
      explanation: 'Without itemSize the viewport cannot calculate total scroll height and falls back to rendering all items, completely defeating the purpose of virtual scroll.',
    },
    {
      title: 'Using @for inside CdkVirtualScrollViewport instead of *cdkVirtualFor',
      wrong: `<cdk-virtual-scroll-viewport itemSize='48' style='height:300px'>
  @for (item of bigList; track item.id) {
    <div>{{ item.label }}</div>
  }
</cdk-virtual-scroll-viewport>`,
      right: `<cdk-virtual-scroll-viewport itemSize='48' style='height:300px'>
  <div *cdkVirtualFor='let item of bigList; trackBy: trackById'>{{ item.label }}</div>
</cdk-virtual-scroll-viewport>`,
      explanation: '@for renders every item eagerly. Only *cdkVirtualFor integrates with the viewport\'s render window to virtualize the list.',
    },
    {
      title: 'Not connecting lists with cdkDropListConnectedTo for cross-list drag',
      wrong: `<!-- Missing connection — drop between lists silently fails -->
<div cdkDropList (cdkDropListDropped)='dropTodo($event)'>...</div>
<div cdkDropList (cdkDropListDropped)='dropDone($event)'>...</div>`,
      right: `<div cdkDropList id='todo-list' [cdkDropListConnectedTo]="['done-list']" (cdkDropListDropped)='dropTodo($event)'>...</div>
<div cdkDropList id='done-list' [cdkDropListConnectedTo]="['todo-list']" (cdkDropListDropped)='dropDone($event)'>...</div>`,
      explanation: 'Without cdkDropListConnectedTo each list is isolated — items can only be dropped back onto their origin list. Both lists must reference each other by id.',
    },
  ];

  versionItems: VersionInfo[] = [
    {
      version: 'Angular 7',
      label: 'CDK Drag & Drop introduced',
      features: [
        'cdkDrag and cdkDropList directives shipped in @angular/cdk/drag-drop',
        'moveItemInArray and transferArrayItem helpers added',
        'CdkVirtualScrollViewport and *cdkVirtualFor added in @angular/cdk/scrolling',
      ],
    },
    {
      version: 'Angular 9',
      label: 'Clipboard CDK added',
      features: [
        'Clipboard service and ClipboardModule added to @angular/cdk/clipboard',
        'Provides a safe, cross-browser copy() method without manual execCommand boilerplate',
      ],
    },
  ];

  challenge: Challenge = {
    title: 'Build a Sortable Priority List with CDK Drag & Drop',
    description: 'Create a single sortable list of priority items using Angular CDK Drag & Drop. Users should be able to drag items to reorder them. Display each item\'s current position number alongside its label, and show a count of total items in the list header.',
    language: 'typescript',
    hints: [
      'Import DragDropModule and add cdkDropList to the container div and cdkDrag to each item div.',
      'Handle the (cdkDropListDropped) event and call moveItemInArray(this.items, event.previousIndex, event.currentIndex) — remember to work on a copy of the signal array and call .set() to update it.',
      'Use the @for block\'s $index implicit variable to display the item\'s position number next to its label.',
      'The CdkDragDrop event\'s previousContainer === container check tells you if the drop is within the same list.',
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

  // TODO: implement the drop handler
  drop(event: CdkDragDrop<string[]>) {

  }
}
`,
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
}
`,
  };
}
