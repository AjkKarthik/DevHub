import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Whole Theory Section, No Code',
    points: [
      'The main page has an entire "Snapshots" theory section: "On load: restore from latest snapshot, then replay only events after that snapshot." The quiz asks about it directly. But every codeTab on the page — <code>Order.Rehydrate</code>, <code>OrderRepository.GetByIdAsync</code> — always replays the FULL event stream from the beginning, with no snapshot path anywhere.',
      'The main page\'s own <code>Order</code> aggregate already exposes exactly what a snapshot needs to capture: its public state (<code>CustomerId</code>, <code>Items</code>, <code>Status</code>, <code>Total</code>) plus <code>Version</code> — the version the snapshot was taken at.',
      'Loading with a snapshot is a two-step version of the SAME <code>Apply()</code> loop the main page already has: seed the aggregate\'s fields directly from the snapshot (skipping replay for everything up to that point), then replay only the events whose <code>Version</code> is greater than the snapshot\'s.',
    ],
  },
  {
    heading: 'Correctness Never Depends on the Snapshot',
    points: [
      'The main page\'s own theory line is precise about this: "Snapshots are an optimisation — correctness does not depend on them." A snapshot that is stale, missing, or deleted entirely just means MORE events get replayed on the next load — never fewer than the event log actually contains, and never a wrong final state.',
      'This is why a snapshot can safely be rebuilt at any time from the event log (take a fresh one at the aggregate\'s current version) but should never be treated as a substitute for storing an event — losing a snapshot loses nothing permanent; losing an event would.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Snapshot + Snapshot-Aware Rehydrate',
    language: 'csharp',
    code: `// A snapshot captures exactly the public state Apply() would have
// produced by this point, plus the version it was taken at.
public record OrderSnapshot(
    Guid Id, Guid CustomerId, List<OrderItem> Items,
    OrderStatus Status, decimal Total, int Version);

public interface ISnapshotStore
{
    Task<OrderSnapshot?> LoadLatestAsync(Guid streamId, CancellationToken ct = default);
    Task SaveAsync(OrderSnapshot snapshot, CancellationToken ct = default);
}

public class Order
{
    // ... existing fields from the main page (Id, CustomerId, Items,
    // Status, Total, Version, _uncommitted) are unchanged ...

    // Seeds state directly from a snapshot — no Apply() calls at all,
    // since the snapshot IS the already-applied result of every event
    // up to (and including) Version. Public: OrderRepository, a
    // different class, needs to call this.
    public static Order FromSnapshot(OrderSnapshot s) => new()
    {
        Id = s.Id, CustomerId = s.CustomerId, Items = s.Items,
        Status = s.Status, Total = s.Total, Version = s.Version,
    };

    public OrderSnapshot ToSnapshot() =>
        new(Id, CustomerId, Items, Status, Total, Version);

    // Replays only the events handed to it — Apply() itself stays
    // private, but this public wrapper lets a caller outside the
    // class (the repository) replay a batch after seeding a snapshot.
    public void ApplyRange(IEnumerable<DomainEvent> events)
    {
        foreach (var e in events) Apply(e);
    }
}

// Repository now checks the snapshot store first.
public class OrderRepository(IEventStore events, ISnapshotStore snapshots)
{
    private const int SnapshotEvery = 100;

    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var snapshot = await snapshots.LoadLatestAsync(id, ct);

        // No snapshot yet — fall back to the main page's own full replay.
        if (snapshot is null)
        {
            var all = await events.LoadAsync(id, ct);
            return all.Count == 0 ? null : Order.Rehydrate(all);
        }

        // Snapshot found — seed from it, then replay ONLY newer events.
        var order = Order.FromSnapshot(snapshot);
        var remaining = await events.LoadAfterVersionAsync(id, snapshot.Version, ct);
        order.ApplyRange(remaining);
        return order;
    }

    public async Task SaveAsync(Order order, CancellationToken ct = default)
    {
        var expected = order.Version - order.UncommittedEvents.Count;
        await events.AppendAsync(order.Id, order.UncommittedEvents, expected, ct);
        order.ClearUncommitted();

        // Take a fresh snapshot every N events — purely an optimisation,
        // safe to skip or fail without affecting correctness.
        if (order.Version % SnapshotEvery == 0)
            await snapshots.SaveAsync(order.ToSnapshot(), ct);
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'An aggregate is at Version 350. A snapshot exists at Version 300. <code>events.LoadAfterVersionAsync(id, 300, ct)</code> is called next. How many events does it need to return, and what would go wrong if it accidentally returned events starting from Version 0 instead?',
  hint: 'Compare "events after the snapshot" against "every event ever recorded," and think about what <code>Apply()</code> does to already-applied fields.',
  solution: `// It needs to return exactly 50 events — versions 301 through 350.

// If it accidentally returned ALL events from Version 0 instead, the
// snapshot-seeded aggregate would replay events 1-300 a SECOND time
// on top of state that already reflects them — e.g. Total would be
// summed twice for every OrderItemAdded event before Version 300,
// and the final state would be wrong (not just slow). The snapshot
// path only stays correct if "seed from snapshot" and "replay newer
// events" are strictly non-overlapping halves of the same timeline.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A snapshot is a second copy of the "real" state, so the event log and the snapshot both need to stay in sync or the system is broken.',
    reality: 'The event log is the ONLY source of truth — a snapshot is disposable, derived data, more like a cache than a second database. It never needs to be "kept in sync" in the sense of a two-way relationship; it only ever flows one direction (event log → snapshot), and it can be deleted or become stale with zero correctness impact, only a performance one.',
  },
  {
    thought: 'Once snapshotting is added, the plain <code>Order.Rehydrate(events)</code> method from the main page becomes dead code and can be deleted.',
    reality: 'It stays exactly as useful as before — it is still the correct path for the FIRST load of any aggregate with no snapshot yet, and it is what the snapshot-aware repository falls back to. Adding snapshots is additive: a faster path for the common case, not a replacement for the fundamental "replay events in order" mechanism every event-sourced aggregate still relies on.',
  },
];

@Component({
  selector: 'app-dp-es-snapshot-rehydrate',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rehydrating-from-a-snapshot.html',
  styleUrl: './rehydrating-from-a-snapshot.scss',
})
export class RehydratingFromASnapshotSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
