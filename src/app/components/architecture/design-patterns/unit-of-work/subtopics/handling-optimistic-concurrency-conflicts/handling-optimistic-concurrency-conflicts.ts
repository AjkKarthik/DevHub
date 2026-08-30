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
    heading: 'A Full Mechanism, Described in Prose, Never in Code',
    points: [
      'The main page\'s own QnA on concurrency describes the entire mechanism precisely: a row-version/' +
      'timestamp column, an UPDATE with a <code>WHERE RowVersion = @original</code> clause, EF Core throwing ' +
      '<code>DbUpdateConcurrencyException</code> when zero rows are affected, and resolution strategies ' +
      '(reload-and-merge, client-wins, database-wins). None of it appears in any codeTab on the page — every ' +
      'example shown assumes uncontested writes.',
      'This is a genuinely different failure mode from the ones the main page\'s OWN mistake blocks already ' +
      'cover (partial commits, wrong DI lifetime, nested UoW) — concurrency conflicts happen even when a ' +
      'Unit of Work is used PERFECTLY correctly, simply because two different requests loaded and modified ' +
      'the same row before either one committed.',
    ],
  },
  {
    heading: 'What EF Core Actually Does Under the Hood',
    points: [
      'A property marked with EF Core\'s <code>[Timestamp]</code> attribute (or configured via ' +
      '<code>.IsRowVersion()</code>) becomes part of the WHERE clause of every UPDATE and DELETE statement EF ' +
      'Core generates for that entity — not just the primary key. If the row\'s CURRENT value no longer ' +
      'matches the value the entity was loaded with, the UPDATE affects zero rows.',
      'EF Core treats "the UPDATE affected zero rows, but I expected it to affect exactly one" as a concurrency ' +
      'conflict and throws <code>DbUpdateConcurrencyException</code> from <code>SaveChangesAsync()</code> — the ' +
      'SAME method the main page\'s own Unit of Work implementations already call, meaning this exception can ' +
      'surface from EXACTLY the call site every one of the page\'s own codeTabs already has, without any ' +
      'additional wiring.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'RowVersion + Conflict Resolution',
    language: 'csharp',
    code: `// The entity opts into optimistic concurrency with one attribute.
public class Product
{
    public Guid    Id    { get; set; }
    public string  Name  { get; set; } = "";
    public int     Stock { get; set; }

    [Timestamp] // SQL Server: rowversion column, auto-updated on every write
    public byte[] RowVersion { get; set; } = [];
}

// EF Core includes RowVersion in the WHERE clause of the generated
// UPDATE automatically — no extra code needed at the call site.
public class InventoryService(ShopDbContext db)
{
    public async Task<bool> TryDecrementStockAsync(Guid productId, int quantity)
    {
        var product = await db.Products.FindAsync(productId)
            ?? throw new ProductNotFoundException(productId);

        product.Stock -= quantity;

        try
        {
            await db.SaveChangesAsync();
            // UPDATE Products SET Stock = @newStock, RowVersion = @newRV
            // WHERE Id = @id AND RowVersion = @originalRV
            return true;
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // Zero rows were affected — someone else changed this
            // Product's RowVersion after we loaded it but before we
            // committed. Resolve using a reload-and-retry strategy.
            var entry = ex.Entries.Single();
            var currentValues = await entry.GetDatabaseValuesAsync();

            if (currentValues is null)
                return false; // the row was deleted entirely by the other transaction

            // "Database wins" for Stock specifically: re-read the
            // latest Stock, re-apply THIS operation's own delta on
            // top of it, and try the save exactly once more.
            var latestStock = (int)currentValues["Stock"]!;
            product.Stock = latestStock - quantity;
            entry.OriginalValues.SetValues(currentValues); // adopt the new RowVersion

            await db.SaveChangesAsync(); // retry — if this ALSO conflicts, it throws again
            return true;
        }
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If <code>TryDecrementStockAsync</code> caught <code>DbUpdateConcurrencyException</code> and simply ' +
    'retried <code>await db.SaveChangesAsync()</code> WITHOUT first calling ' +
    '<code>entry.OriginalValues.SetValues(currentValues)</code>, what would happen on the retry?',
  hint:
    'Think about what value EF Core would use for the WHERE clause\'s RowVersion check on the retry, if the ' +
    'entity\'s tracked "original" RowVersion was never updated to match what is actually in the database now.',
  solution:
    'The retry would fail with the EXACT SAME DbUpdateConcurrencyException, in an infinite-seeming loop if ' +
    'retried repeatedly — EF Core would still generate the UPDATE\'s WHERE clause using the OLD, now-stale ' +
    'RowVersion value the entity was originally loaded with, since nothing told the change tracker the ' +
    'row\'s RowVersion had moved on. SetValues(currentValues) is not just adopting the latest Stock number — ' +
    'it specifically updates the entity\'s tracked ORIGINAL values (including RowVersion) so the NEXT ' +
    'SaveChangesAsync() call generates a WHERE clause matching what is actually in the database right now, ' +
    'giving the retry a real chance to succeed instead of repeating the same failed comparison.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Optimistic concurrency conflicts only matter for genuinely high-traffic systems with many ' +
      'simultaneous users — a typical internal admin tool would never actually hit this exception in practice.',
    reality:
      'It only takes TWO requests touching the same row close together in time — a user double-clicking a ' +
      'save button, a background job and a user editing the same record, or simply two browser tabs open to ' +
      'the same edit page. The main page\'s own "risks of a long-running Unit of Work" QnA already names one ' +
      'realistic trigger: a UoW that stays open long enough for OTHER changes to land on the same rows in the ' +
      'meantime.',
  },
  {
    thought: 'Catching DbUpdateConcurrencyException and simply retrying SaveChangesAsync() once, as shown ' +
      'above, is always the correct resolution strategy.',
    reality:
      'The main page\'s own QnA lists THREE distinct strategies — client wins (overwrite with what the current ' +
      'user had), database wins (discard the current user\'s change, as this subtopic\'s own example does for ' +
      'a numeric Stock field), or custom merge logic — and the right choice depends entirely on what the ' +
      'conflicting field actually MEANS. "Database wins" is reasonable for a running total like inventory ' +
      'stock; it would be actively wrong for, say, a user\'s in-progress edit to a document\'s text content, ' +
      'where silently discarding their work is exactly the outcome to avoid.',
  },
];

@Component({
  selector: 'app-unit-of-work-handling-optimistic-concurrency-conflicts',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './handling-optimistic-concurrency-conflicts.html',
  styleUrl: './handling-optimistic-concurrency-conflicts.scss',
})
export class HandlingOptimisticConcurrencyConflictsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
