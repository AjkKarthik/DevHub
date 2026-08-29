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
    heading: 'Discussed Twice, Built Zero Times',
    points: [
      'The main page has TWO separate QnA answers dedicated to the Inbox pattern — "Is the Outbox pattern the same as the Inbox pattern?" and "How does the Inbox pattern complement the Outbox pattern?" — both describing the same mechanism in prose: record each incoming message\'s ID in an inbox table, in the SAME transaction that processes it, and skip anything already recorded.',
      'The main page\'s OWN "Not making consumers idempotent" mistake block gets partway there — its "right" example is a one-line <code>AnyAsync</code> check against a domain table (<code>db.Shipments.AnyAsync(s => s.OrderId == e.OrderId)</code>) — but that only works because shipments happen to have a natural one-per-order uniqueness. A general-purpose Inbox needs its OWN dedicated table, keyed by message ID, that works for ANY event type, not just ones with a convenient existing uniqueness constraint.',
      'The main page\'s theory is explicit that this pairing matters: Outbox guarantees AT-LEAST-ONCE delivery from the producer; Inbox is what turns that into effectively-once PROCESSING on the consumer — "together they implement... end-to-end exactly-once semantics."',
    ],
  },
  {
    heading: 'Why "Check, Then Process" Isn\'t Enough on Its Own',
    points: [
      'A naive idempotency check — query the inbox table, then separately process the message, then separately insert into the inbox — has the exact same check-then-act race this hub has flagged elsewhere: two near-simultaneous deliveries of the SAME event (a realistic outcome under at-least-once delivery) can both pass the check before either one\'s insert lands.',
      'The fix the main page\'s own QnA already names but never codes: make the inbox INSERT itself the thing that detects a duplicate — a database UNIQUE constraint on the message ID, with the processing work and the insert wrapped in ONE transaction, so a duplicate delivery fails the insert (not a separate read) and the whole transaction rolls back cleanly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Inbox Table + Idempotent Consumer',
    language: 'csharp',
    code: `// A generic inbox row — one per message ID ever successfully processed.
public class InboxMessage
{
    public Guid MessageId    { get; set; }   // unique constraint enforces idempotency
    public string EventType  { get; set; } = string.Empty;
    public DateTimeOffset ProcessedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class AppDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Shipment>      Shipments     => Set<Shipment>();
    public DbSet<InboxMessage>  InboxMessages => Set<InboxMessage>();

    protected override void OnModelCreating(ModelBuilder builder) =>
        builder.Entity<InboxMessage>().HasKey(m => m.MessageId);   // the constraint that matters
}

// Consumer: the business work and the inbox insert are ONE transaction —
// a duplicate delivery fails the INSERT itself, not a separate check.
public class OrderPlacedConsumer(AppDbContext db, IShippingService shipping)
    : IConsumer<OrderPlacedEvent>
{
    public async Task Consume(ConsumeContext<OrderPlacedEvent> ctx)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ctx.CancellationToken);
        try
        {
            db.InboxMessages.Add(new InboxMessage
            {
                MessageId = ctx.MessageId ?? throw new InvalidOperationException("Message has no ID"),
                EventType = nameof(OrderPlacedEvent),
            });

            await shipping.CreateShipmentAsync(ctx.Message.OrderId, ctx.CancellationToken);

            await db.SaveChangesAsync(ctx.CancellationToken);   // insert + shipment together
            await tx.CommitAsync(ctx.CancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            // This exact MessageId is already in the inbox — a redelivery
            // of an event already fully processed. Roll back and return
            // normally; no shipment was created a second time.
            await tx.RollbackAsync(ctx.CancellationToken);
        }
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex) =>
        ex.InnerException?.Message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) ?? false;
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The main page\'s own "Not making consumers idempotent" mistake block used a plain <code>AnyAsync</code> read as its idempotency check, not a unique-constraint-backed insert like the codeTab above. Under what specific timing does the <code>AnyAsync</code> version still double-create a shipment, and why doesn\'t the codeTab above have that problem?',
  hint: 'Think about how many separate database round trips each version needs between "check" and "act," and what happens if two deliveries interleave between them.',
  solution: `// The AnyAsync version does a SEPARATE read, then a SEPARATE write,
// with no transaction tying them together. If two deliveries of the
// same event arrive close enough together, BOTH can run the
// AnyAsync check and find "not yet shipped" before EITHER one's
// CreateShipmentAsync() call has completed and been recorded --
// producing two shipments.

// The codeTab above avoids this because the idempotency signal (the
// InboxMessage row) and the business work happen inside the SAME
// transaction, and the row's PRIMARY KEY is what detects the
// duplicate -- not a read that can go stale between check and act.
// A second delivery's INSERT attempt fails immediately at the
// database level, the whole transaction (including any shipment
// work already staged) rolls back, and nothing is double-created.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Inbox pattern and the "idempotency check" the main page\'s mistake block already shows are basically the same idea, just described differently.',
    reality: 'They share a GOAL (skip duplicate processing) but differ in a way that matters under real concurrent delivery: the mistake block\'s <code>AnyAsync</code> check is a plain READ with no enforcement mechanism backing it — two near-simultaneous deliveries can both pass it. A proper Inbox relies on a database CONSTRAINT (a unique/primary key) to make the duplicate-detection atomic with the insert itself, which a bare read can never guarantee on its own.',
  },
  {
    thought: 'Since the Outbox pattern already guarantees the event reaches the consumer, adding an Inbox table on the consumer side is redundant extra infrastructure.',
    reality: 'The main page\'s own theory is explicit about what Outbox actually guarantees: AT-LEAST-ONCE delivery, not exactly-once. That "at least" is the whole reason an Inbox is needed — Outbox solves getting the event there RELIABLY (possibly more than once); Inbox solves PROCESSING it safely exactly once despite that. Removing the Inbox doesn\'t make redelivery stop happening; it just means redelivered events silently re-trigger whatever side effect the consumer performs.',
  },
];

@Component({
  selector: 'app-dp-outbox-inbox',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-the-inbox-patterns-idempotency-table.html',
  styleUrl: './building-the-inbox-patterns-idempotency-table.scss',
})
export class BuildingTheInboxPatternsIdempotencyTableSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
