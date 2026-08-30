import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './snapshots-referenced-six-undefined-methods.html',
  styleUrl: './snapshots-referenced-six-undefined-methods.scss'
})
export class SnapshotsReferencedSixUndefinedMethodsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two codeTabs, one supposed aggregate, six missing members',
      points: [
        'The page\'s first codeTab, "CQRS — Commands & Queries," defines the <code>Order</code> class with exactly these members: <code>create</code>, <code>addLine</code>, <code>confirm</code>, a private <code>apply</code>, and a private <code>when</code>. Nothing else.',
        'The THIRD codeTab, "Snapshots," calls <code>order.rehydrate(e)</code>, <code>Order.restoreFromSnapshot(snapshot.state)</code>, reads <code>order.uncommittedEvents</code> and <code>order.version</code>, and calls <code>order.clearEvents()</code> and <code>order.toSnapshot()</code> — six members that appear nowhere in the actual <code>Order</code> class definition shown earlier on the same page.',
        'This is a self-contained catch requiring no external research — just checking whether a class used across multiple code samples on the same page is consistently defined, the same discipline already applied to catching undefined-type references in Challenge solutions elsewhere in this hub, just scaled up to SIX missing members on one class instead of one missing type.',
      ]
    },
    {
      heading: 'Why this one was easy to miss — it doesn\'t look like a typo',
      points: [
        'Each individual codeTab reads perfectly coherently in isolation — the Snapshots tab\'s calls all look like exactly the methods a snapshot-supporting aggregate SHOULD have, and the CQRS tab\'s Order class looks complete for what IT demonstrates (create, add lines, confirm). The gap only appears when checking whether the SAME class name, used across separate tabs, actually has a consistent set of members.',
        'The page\'s own "Snapshots" Challenge context implies these tabs together tell one continuous story about the SAME Order aggregate gaining more capability as the page progresses — which makes the missing members a real continuity gap, not simply "two different, unrelated examples that happen to both use the word Order."',
        'The fix adds the missing methods as an explicit extension, directly in the Snapshots codeTab, rather than silently assuming the reader will infer their shape — making the aggregate\'s FULL member set checkable in one place instead of scattered, undocumented assumptions.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The six missing members, made explicit',
      language: 'typescript',
      code: `// The ORIGINAL "CQRS -- Commands & Queries" tab's Order class only has:
class OrderOriginal {
  private events: DomainEvent[] = [];
  private lines: OrderLine[] = [];
  private status: 'draft' | 'confirmed' = 'draft';
  static create(customerId: string): OrderOriginal { /* ... */ return new OrderOriginal(); }
  addLine(productId: string, qty: number, price: number): void { /* ... */ }
  confirm(): void { /* ... */ }
  private apply(event: DomainEvent): void { /* ... */ }
  private when(event: DomainEvent): void { /* ... */ }
}

// The "Snapshots" tab called SIX members that don't exist above:
//   order.rehydrate(e)                          -- undefined
//   Order.restoreFromSnapshot(snapshot.state)    -- undefined
//   order.uncommittedEvents                      -- undefined
//   order.version                                -- undefined
//   order.clearEvents()                          -- undefined
//   order.toSnapshot()                           -- undefined

// What Order actually needs, to make the Snapshots tab's code real:
class Order {
  private events: DomainEvent[] = [];
  private lines: OrderLine[] = [];
  private status: 'draft' | 'confirmed' = 'draft';
  private _version = 0;

  get uncommittedEvents(): DomainEvent[] { return this.events; }
  get version(): number { return this._version; }
  clearEvents(): void { this.events = []; }

  // Used when REPLAYING history (loading), distinct from apply() which
  // is used when WRITING new events -- rehydrate skips re-recording
  // the event as "uncommitted" since it's already persisted.
  rehydrate(event: DomainEvent): void {
    this.when(event);
    this._version++;
  }

  toSnapshot(): unknown {
    return { lines: this.lines, status: this.status, version: this._version };
  }

  static restoreFromSnapshot(state: any): Order {
    const o = new Order();
    o.lines = state.lines;
    o.status = state.status;
    (o as any)._version = state.version;
    return o;
  }

  private when(event: DomainEvent): void { /* ...same as before... */ }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You\'re reading two separate documentation pages about the same "Order" concept -- one shows a class with methods A, B, C; a second, further down the same page, calls methods D, E, F on what it says is "the same Order." Both individually read as sensible, working code. How would you actually confirm whether they\'re consistent?',
    hint: 'What\'s the single most direct check -- reading each snippet more carefully in isolation, or something else entirely?',
    solution: 'The direct check is simply listing every member the class DECLARES in the first snippet, then listing every member CALLED on instances of that class in the second snippet, and diffing the two lists. Reading each snippet more carefully in isolation doesn\'t catch this kind of gap at all -- both snippets can be individually flawless and still disagree about what the class actually contains, which is exactly what happened here. This is the same "trace every declared name to its actual use" discipline already used to catch other undefined-reference bugs in this hub, just applied ACROSS two code samples referencing the same class instead of within one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If two separate code samples on the same page both read fluently and use the same class name, they\'re very likely describing the same, consistent class.',
      reality: 'Per this subtopic\'s theory, fluency within each individual snippet says nothing about cross-snippet consistency — this page\'s two Order-using codeTabs each read perfectly on their own while disagreeing about six of the class\'s actual members.'
    },
    {
      thought: 'A missing method reference is the kind of bug only likely to appear once per page, given how much text and code review normally happens.',
      reality: 'Per this subtopic\'s theory, this single instance involved SIX separate undefined members on one class, not one — a scaled-up version of the same underlying gap (declaring vs. using) rather than several unrelated small mistakes.'
    },
    {
      thought: 'rehydrate() and apply() are just two names for the same underlying operation, so it wouldn\'t matter which one a fixed version used.',
      reality: 'Per this subtopic\'s theory, they serve genuinely different purposes — apply() is for WRITING new events (and records them as uncommitted for persistence), while rehydrate() is for REPLAYING already-persisted history during load, which should not be re-recorded as a new, uncommitted event.'
    }
  ];
}
