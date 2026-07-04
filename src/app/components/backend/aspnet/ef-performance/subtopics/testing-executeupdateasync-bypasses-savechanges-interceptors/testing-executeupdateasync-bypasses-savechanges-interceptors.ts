import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-executeupdateasync-bypasses-interceptors-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-executeupdateasync-bypasses-savechanges-interceptors.html',
  styleUrl: './testing-executeupdateasync-bypasses-savechanges-interceptors.scss',
})
export class TestingExecuteupdateasyncBypassesSavechangesInterceptorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states, as a passing remark, that bulk operations "bypass any interceptors or entity events that hook into the change tracker" — this is a significant behavioral claim that deserves its own verification, not just a sentence to remember',
      points: [
        'The main EF Core Performance page\'s "Bulk Operations" section says: "These methods bypass the change tracker entirely — <code>SaveChangesAsync()</code> is not needed or called. They also bypass any interceptors or entity events that hook into the change tracker (<code>SavedChanges</code>, <code>SavingChanges</code>)." If a codebase relies on a <code>SavingChanges</code>/<code>SavedChanges</code> event (or an <code>ISaveChangesInterceptor</code>) for audit logging, soft-delete enforcement, or domain event dispatching, switching a slow load-loop-save pattern to <code>ExecuteUpdateAsync()</code> for a performance win SILENTLY REMOVES that cross-cutting behavior for the affected rows — with no compiler warning, since both code paths compile and run without error.',
      ],
    },
    {
      heading: 'A test that registers a real ISaveChangesInterceptor, performs BOTH a normal SaveChangesAsync() update AND an ExecuteUpdateAsync() bulk update, and asserts on which one actually triggered the interceptor directly proves this bypass — rather than trusting the main page\'s prose alone',
      points: [
        '<code>ISaveChangesInterceptor</code> (and the simpler <code>ChangeTracker.StateChanged</code>/<code>DbContext.SavingChanges</code> events) are hooks specifically wired into the <code>SaveChangesAsync()</code> pipeline. Since <code>ExecuteUpdateAsync()</code> and <code>ExecuteDeleteAsync()</code> translate directly to SQL and execute it via a completely separate code path that never calls <code>SaveChangesAsync()</code> at all, a test that counts interceptor invocations for each code path directly demonstrates the asymmetry the main page describes — turning a documentation sentence into an executable, regression-proof fact.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A counting ISaveChangesInterceptor — the kind of hook a real app might use for audit logging',
      language: 'csharp',
      code: `public class CountingSaveChangesInterceptor : ISaveChangesInterceptor
{
    public int SavingChangesCallCount { get; private set; }
    public int SavedChangesCallCount { get; private set; }

    public InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        SavingChangesCallCount++;
        return result;
    }

    public ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result,
        CancellationToken ct = default)
    {
        SavingChangesCallCount++;
        return ValueTask.FromResult(result);
    }

    public ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData, int result, CancellationToken ct = default)
    {
        SavedChangesCallCount++;
        return ValueTask.FromResult(result);
    }
}`,
    },
    {
      label: 'The test proving the exact asymmetry the main page describes: SaveChangesAsync fires the interceptor, ExecuteUpdateAsync does not',
      language: 'csharp',
      code: `public class BulkOperationInterceptorBypassTests : IDisposable
{
    private readonly CountingSaveChangesInterceptor _interceptor = new();
    private readonly AppDbContext _db;

    public BulkOperationInterceptorBypassTests()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .AddInterceptors(_interceptor)
            .Options;

        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        _db.Products.Add(new Product { Name = "Widget", Price = 9.99m, IsActive = true });
        _db.SaveChangesAsync().GetAwaiter().GetResult();
    }

    [Fact]
    public async Task NormalSaveChangesAsync_TriggersTheInterceptor()
    {
        var initialCount = _interceptor.SavingChangesCallCount;

        var product = await _db.Products.FirstAsync();
        product.Price = 19.99m;
        await _db.SaveChangesAsync();

        // A normal load-then-modify-then-SaveChangesAsync flow goes
        // THROUGH the interceptor pipeline, as expected:
        Assert.Equal(initialCount + 1, _interceptor.SavingChangesCallCount);
        Assert.True(_interceptor.SavedChangesCallCount > 0);
    }

    [Fact]
    public async Task ExecuteUpdateAsync_DoesNotTriggerTheInterceptorAtAll()
    {
        var initialSavingCount = _interceptor.SavingChangesCallCount;
        var initialSavedCount = _interceptor.SavedChangesCallCount;

        await _db.Products
            .Where(p => p.IsActive)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Price, 29.99m));

        // THE KEY ASSERTION: the interceptor counts are COMPLETELY
        // UNCHANGED — proving ExecuteUpdateAsync genuinely never enters
        // the SaveChangesAsync pipeline at all, exactly as the main
        // page's prose describes. If a future EF Core version (or a
        // misunderstanding of the API) assumed bulk operations DO
        // trigger interceptors, this test would immediately fail:
        Assert.Equal(initialSavingCount, _interceptor.SavingChangesCallCount);
        Assert.Equal(initialSavedCount, _interceptor.SavedChangesCallCount);

        // Confirm the UPDATE genuinely happened at the database level,
        // despite the interceptor never firing — proving this isn't a
        // "nothing happened" false negative:
        var reloaded = await _db.Products.AsNoTracking().FirstAsync();
        Assert.Equal(29.99m, reloaded.Price);
    }

    public void Dispose() => _db.Dispose();
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that ExecuteUpdateAsync bypasses SaveChanges interceptors entirely, propose a concrete alternative mechanism for enforcing an audit-logging requirement ("every product price change must be recorded in an AuditLog table") that needs to work correctly for BOTH normal SaveChangesAsync updates AND bulk ExecuteUpdateAsync operations on the same table.',
    hint: 'Consider that a SaveChanges-interceptor-based solution can never see ExecuteUpdateAsync calls at all — what mechanism operates at the DATABASE level instead, seeing every UPDATE regardless of which EF Core API produced it?',
    solution: `Since the interceptor pipeline is fundamentally an application-layer
mechanism tied specifically to SaveChangesAsync's own code path, the
robust fix for a requirement that must apply uniformly to ALL updates
(regardless of whether they went through SaveChangesAsync or
ExecuteUpdateAsync) is to move the audit logic to the DATABASE layer
itself — a trigger — which observes every UPDATE regardless of which
client-side API produced it:

-- SQL Server example: an AFTER UPDATE trigger on the Products table
CREATE TRIGGER trg_Products_PriceAudit
ON Products
AFTER UPDATE
AS
BEGIN
    INSERT INTO AuditLog (ProductId, OldPrice, NewPrice, ChangedAt)
    SELECT i.Id, d.Price, i.Price, GETUTCDATE()
    FROM inserted i
    JOIN deleted d ON i.Id = d.Id
    WHERE i.Price <> d.Price;   -- only log genuine price changes
END;

This trigger fires for a row updated via a normal EF Core
SaveChangesAsync()-generated UPDATE, an ExecuteUpdateAsync()-generated
UPDATE, a raw ExecuteSqlRawAsync() call, or even a manual UPDATE run
directly against the database outside the application entirely —
because it operates at the level the DATABASE ENGINE ITSELF sees, not
at the level of which .NET API happened to generate the SQL.

The trade-off worth naming explicitly: a database trigger has NO access
to application-level context that only exists in the .NET process (the
authenticated user's identity, a correlation ID, a business-specific
"reason for change" string) unless that context is ALSO passed down as
an actual column value in the UPDATE statement itself (e.g., a
"LastModifiedBy" column set via SetProperty, which the trigger can
then read from the "inserted" pseudo-table). This means a full
audit-logging requirement often needs BOTH: an interceptor or
application-level check for CONTEXT-RICH scenarios reachable only
through SaveChangesAsync, AND a database trigger as the universal
safety net that catches everything else, including any future
ExecuteUpdateAsync-based bulk operation a developer adds without
remembering the interceptor never sees it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'an ISaveChangesInterceptor or DbContext.SavingChanges event handler registered on a DbContext will fire for ANY database write that context performs, including ExecuteUpdateAsync and ExecuteDeleteAsync bulk operations.',
      reality: 'these interceptors are wired specifically into the SaveChangesAsync() pipeline — ExecuteUpdateAsync() and ExecuteDeleteAsync() translate directly to SQL and execute through a completely separate code path that never invokes SaveChangesAsync, so the interceptor never fires for them at all.',
    },
    {
      thought: 'switching a slow load-loop-save pattern to ExecuteUpdateAsync for a performance win is purely an internal implementation detail with no behavioral difference visible to the rest of the application.',
      reality: 'if any cross-cutting behavior (audit logging, domain event dispatching, soft-delete enforcement) depends on a SaveChanges interceptor or event, switching to ExecuteUpdateAsync silently removes that behavior for the affected rows — with no compiler warning, since both code paths compile and run without error.',
    },
    {
      thought: 'the only way to guarantee an audit-logging requirement applies uniformly to a table is to make sure every EF Core code path that updates it goes through SaveChangesAsync.',
      reality: 'a database-level trigger observes every UPDATE regardless of which client-side API produced it — SaveChangesAsync, ExecuteUpdateAsync, raw SQL, or even a manual update outside the application entirely — making it the more robust mechanism for a requirement that must apply universally, at the cost of losing access to application-level context not captured in an actual column value.',
    },
  ];
}
