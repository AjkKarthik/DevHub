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
    heading: 'Two Handlers on the Same Class, One Silent Gap',
    points: [
      'The main page\'s own <code>OrderSummaryProjection</code> has two handler methods reacting to two different events. <code>HandleAsync(OrderCancelled e, ...)</code> correctly ends with <code>await db.SaveChangesAsync(ct);</code> after modifying the tracked entity — but <code>HandleAsync(OrderPlaced e, ...)</code> only ever called <code>db.OrderSummaries.AddAsync(...)</code>, with no matching <code>SaveChangesAsync()</code> call at all.',
      '<code>DbSet&lt;T&gt;.AddAsync()</code> is asynchronous only because EF Core may need to check a value generator (e.g. a sequence) for the new row\'s key — it queues the entity into the change tracker as "Added" but writes NOTHING to the database. Only <code>SaveChangesAsync()</code> actually issues the SQL <code>INSERT</code>.',
      'The practical consequence: every <code>OrderPlaced</code> event processed by this projection silently fails to create its <code>OrderSummary</code> row — no exception is thrown anywhere, since nothing about "add to the change tracker and never save" is invalid C#. The read model simply never gets the new order.',
    ],
  },
  {
    heading: 'Why This Kind of Bug Is Easy to Miss',
    points: [
      'A quick read of <code>HandleAsync(OrderPlaced e, ...)</code> in isolation looks complete: it reads as "build a summary, add it" — nothing about the method LOOKS unfinished on its own.',
      'The gap only becomes visible by comparing it against its SIBLING method on the same class, which does the extra step. This is a useful general habit for reviewing event handlers/projections: when a class has multiple handler methods for a shared read model, check that each one persists its own change the same way the others do.',
      'It is also a reminder that async/await alone is not proof a database write happened — <code>AddAsync</code> being <code>async</code> can read as "this method already does the write," when the actual write is a completely separate call.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — Silently Never Persisted',
    language: 'csharp',
    code: `public class OrderSummaryProjection(AppDbContext db)
{
    public async Task HandleAsync(OrderPlaced e, CancellationToken ct) =>
        await db.OrderSummaries.AddAsync(new OrderSummary(e.AggregateId, e.CustomerId, e.Total, "Pending"), ct);
        // No SaveChangesAsync() — the row is tracked as "Added" and
        // then discarded the moment this DbContext instance is gone.

    public async Task HandleAsync(OrderCancelled e, CancellationToken ct)
    {
        var summary = await db.OrderSummaries.FindAsync([e.AggregateId], ct);
        if (summary is not null) summary.Status = "Cancelled";
        await db.SaveChangesAsync(ct);   // <- this one correctly commits
    }
}`,
  },
  {
    label: 'After — Both Handlers Persist',
    language: 'csharp',
    code: `public class OrderSummaryProjection(AppDbContext db)
{
    public async Task HandleAsync(OrderPlaced e, CancellationToken ct)
    {
        await db.OrderSummaries.AddAsync(new OrderSummary(e.AggregateId, e.CustomerId, e.Total, "Pending"), ct);
        await db.SaveChangesAsync(ct);   // now actually commits the INSERT
    }

    public async Task HandleAsync(OrderCancelled e, CancellationToken ct)
    {
        var summary = await db.OrderSummaries.FindAsync([e.AggregateId], ct);
        if (summary is not null) summary.Status = "Cancelled";
        await db.SaveChangesAsync(ct);
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose a THIRD handler is added — <code>HandleAsync(OrderItemAdded e, ...)</code> — that finds the existing <code>OrderSummary</code> row and increases its <code>Total</code>. Which of the two existing handlers is the safer one to copy the structure from, and why?',
  hint: 'Compare what each existing handler does right before it returns.',
  solution: `// Copy the structure of HandleAsync(OrderCancelled e, ...) — it is
// the one handler on this class that already ends with a
// SaveChangesAsync() call after modifying a tracked entity:

public async Task HandleAsync(OrderItemAdded e, CancellationToken ct)
{
    var summary = await db.OrderSummaries.FindAsync([e.AggregateId], ct);
    if (summary is not null) summary.Total += e.Item.Price;
    await db.SaveChangesAsync(ct);
}

// Copying the ORIGINAL (buggy) OrderPlaced handler's shape instead
// would repeat the exact same silent no-op mistake this subtopic
// just fixed.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the method is declared <code>async</code> and uses <code>await</code>, it must already be writing to the database.',
    reality: '<code>await</code> only means "wait for this asynchronous operation to complete" — it says nothing about WHICH operation. <code>AddAsync()</code> is awaited, and it IS asynchronous (checking a key generator can involve I/O), but the operation it performs is "queue this entity in the change tracker," not "write it to the database." Only a call to <code>SaveChangesAsync()</code> (also awaited) performs the actual write.',
  },
  {
    thought: 'This bug would definitely be caught immediately in testing, since a missing database row is an obvious problem.',
    reality: 'It depends entirely on whether the test asserts against the DATABASE or against the in-memory change tracker. A test using EF Core\'s in-memory provider or checking <code>db.OrderSummaries.Local</code> right after calling the handler would see the tracked (but unsaved) entity and could easily pass — the gap only shows up when a FRESH <code>DbContext</code> instance queries the actual data store afterward, which is exactly the scenario every real read-model query goes through.',
  },
];

@Component({
  selector: 'app-dp-es-orderplaced-savechanges',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-orderplaced-handler-never-persists-its-insert.html',
  styleUrl: './the-orderplaced-handler-never-persists-its-insert.scss',
})
export class TheOrderplacedHandlerNeverPersistsItsInsertSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
