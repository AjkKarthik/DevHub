import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-deletebehavior-restrict-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-deletebehavior-restrict-genuinely-throws-sqlite.html',
  styleUrl: './testing-deletebehavior-restrict-genuinely-throws-sqlite.scss',
})
export class TestingDeletebehaviorRestrictGenuinelyThrowsSqliteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake shows adding OnDelete(DeleteBehavior.Restrict) as the fix for accidental cascade deletes — but nothing on the page shows a test proving that fix actually prevents the delete',
      points: [
        'The main EF Relationships page\'s "Using DeleteBehavior.Cascade on important data without thinking" mistake shows the fix: adding <code>.OnDelete(DeleteBehavior.Restrict)</code> so that "deleting a user should not delete all their orders." The stated behavior — "throws if user has orders" — is a claim about the DATABASE\'s own foreign-key enforcement, which means the test verifying it MUST exercise a real database engine\'s FK constraint checking, not a fake in-memory store that has no concept of foreign keys at all.',
      ],
    },
    {
      heading: 'UseInMemoryDatabase() cannot verify this AT ALL — it has no real foreign-key constraint enforcement — while UseSqlite() genuinely enforces FKs and lets a test directly prove the Restrict behavior works',
      points: [
        'The main page\'s OWN sibling topic (EF Core Basics) explicitly recommends <code>UseSqlite(":memory:")</code> over <code>UseInMemoryDatabase()</code> "for integration tests that need real SQL behavior" — <code>DeleteBehavior.Restrict</code> is EXACTLY this kind of behavior: it relies on the DATABASE PROVIDER actually enforcing a foreign-key constraint and raising a real <code>DbUpdateException</code> (wrapping the provider\'s own FK violation) when a delete would orphan child rows. <code>UseInMemoryDatabase()</code> has no real referential-integrity enforcement whatsoever — a test using it would silently ALLOW the delete to "succeed" even with <code>DeleteBehavior.Restrict</code> configured, giving a FALSE POSITIVE that the safety mechanism works when it actually never gets exercised at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own User/Orders relationship, tested with real SQLite FK enforcement',
      language: 'csharp',
      code: `public class RestrictDeleteTests : IDisposable
{
    private readonly AppDbContext _db;

    public RestrictDeleteTests()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();   // creates the SCHEMA, including
                                          // the FK constraint EF Core
                                          // generates from OnDelete(Restrict)
    }

    [Fact]
    public async Task DeletingAUserWithOrders_ThrowsDbUpdateException()
    {
        var user = new User { Name = "Alice" };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _db.Orders.Add(new Order { UserId = user.Id, Total = 49.99m });
        await _db.SaveChangesAsync();

        _db.Users.Remove(user);

        // THE KEY ASSERTION: this must actually THROW — proving the
        // database-level FK constraint, generated from
        // OnDelete(DeleteBehavior.Restrict), genuinely rejects a delete
        // that would orphan the Order row. If Restrict were accidentally
        // reverted back to the default Cascade, this test would FAIL
        // (no exception thrown, the delete would silently succeed and
        // cascade-delete the Order too):
        await Assert.ThrowsAsync<DbUpdateException>(
            () => _db.SaveChangesAsync());
    }

    [Fact]
    public async Task DeletingAUserWithNoOrders_SucceedsNormally()
    {
        var user = new User { Name = "Bob" };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _db.Users.Remove(user);

        // A user with NO orders should delete cleanly — Restrict only
        // blocks deletes that would ORPHAN existing children, it does
        // not block deletion of childless parents:
        var affected = await _db.SaveChangesAsync();
        Assert.Equal(1, affected);
    }

    public void Dispose() => _db.Dispose();
}`,
    },
    {
      label: 'Why the SAME test using UseInMemoryDatabase() would give a false-positive pass, even with Cascade accidentally left in place',
      language: 'csharp',
      code: `// A SUBTLY BROKEN version of the same test — using
// UseInMemoryDatabase() instead of UseSqlite():
public class RestrictDeleteTests_Broken : IDisposable
{
    private readonly AppDbContext _db;

    public RestrictDeleteTests_Broken()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
    }

    [Fact]
    public async Task DeletingAUserWithOrders_ThrowsDbUpdateException_BROKEN()
    {
        var user = new User { Name = "Alice" };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _db.Orders.Add(new Order { UserId = user.Id, Total = 49.99m });
        await _db.SaveChangesAsync();

        _db.Users.Remove(user);

        // THIS ASSERTION FAILS — not because Restrict is broken, but
        // because UseInMemoryDatabase() has NO REAL FOREIGN KEY
        // ENFORCEMENT AT ALL. The delete simply "succeeds" as far as
        // the in-memory provider is concerned, regardless of what
        // OnDelete() behavior is configured in OnModelCreating — the
        // in-memory provider does not generate or check FK constraints
        // the way a real database does:
        await Assert.ThrowsAsync<DbUpdateException>(
            () => _db.SaveChangesAsync());   // never throws — test FAILS

        // WORSE: if this assertion were accidentally INVERTED or
        // removed (a developer "fixing" a failing test without
        // understanding WHY it fails), the test suite would report
        // "all green" while providing ZERO actual coverage of the
        // Restrict behavior — a false sense of safety around a
        // genuinely important data-protection mechanism.
    }

    public void Dispose() => _db.Dispose();
}

// THE LESSON: any test verifying DATABASE-LEVEL CONSTRAINT BEHAVIOR
// (foreign keys, unique constraints, check constraints, cascade rules)
// REQUIRES a real database engine capable of enforcing them —
// UseInMemoryDatabase() is fundamentally the wrong tool for this class
// of test, regardless of how the test itself is written.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Propose a test that would specifically catch a regression where OnDelete(DeleteBehavior.Restrict) is accidentally changed to OnDelete(DeleteBehavior.SetNull) instead of back to the default Cascade — a more SUBTLE regression than reverting to Cascade entirely, since SetNull also "succeeds" without throwing, but produces a different, still potentially undesirable outcome (an orphaned Order with UserId = null instead of a blocked delete).',
    hint: 'Consider that the test in this subtopic only checks WHETHER an exception was thrown — it does not check WHAT HAPPENED TO THE ORDER if the delete unexpectedly succeeded. What additional assertion, run in the case where SaveChangesAsync does NOT throw, would distinguish "Restrict correctly blocked this" from "SetNull silently orphaned the order"?',
    solution: `The existing test only proves "an exception was thrown" — to also catch
a SetNull regression, the test needs a fallback assertion for the case
where SaveChangesAsync unexpectedly succeeds, checking what actually
happened to the Order row:

[Fact]
public async Task DeletingAUserWithOrders_BlocksTheDelete_OrderRemainsIntact()
{
    var user = new User { Name = "Alice" };
    _db.Users.Add(user);
    await _db.SaveChangesAsync();

    var order = new Order { UserId = user.Id, Total = 49.99m };
    _db.Orders.Add(order);
    await _db.SaveChangesAsync();

    _db.Users.Remove(user);

    // Instead of only checking for an exception, capture whether one
    // was thrown, then verify the Order's state EITHER WAY:
    var ex = await Record.ExceptionAsync(() => _db.SaveChangesAsync());

    if (ex is null)
    {
        // If SaveChangesAsync did NOT throw, the delete succeeded —
        // which should NEVER happen with Restrict. This branch
        // specifically catches a regression to SetNull: the order
        // would still exist, but with a NULL UserId instead of being
        // blocked entirely:
        var reloadedOrder = await _db.Orders
            .AsNoTracking()
            .SingleOrDefaultAsync(o => o.Id == order.Id);

        Assert.Fail(
            $"Expected the delete to be BLOCKED by DeleteBehavior.Restrict, " +
            $"but it succeeded. Order.UserId is now " +
            $"{(reloadedOrder is null ? "the order was DELETED (Cascade?)" : reloadedOrder.UserId?.ToString() ?? "NULL (SetNull?)")} " +
            "— indicating the OnDelete behavior was changed away from Restrict.");
    }
    else
    {
        Assert.IsType<DbUpdateException>(ex);

        // Also confirm the Order genuinely still exists, unmodified,
        // proving Restrict didn't just throw WHILE ALSO partially
        // applying some other side effect:
        var stillExists = await _db.Orders
            .AsNoTracking()
            .AnyAsync(o => o.Id == order.Id && o.UserId == user.Id);
        Assert.True(stillExists);
    }
}

This single test now distinguishes THREE possible outcomes explicitly:
Restrict correctly blocking the delete (the expected, passing case),
a regression to Cascade (order deleted entirely), and a regression to
SetNull (order survives but with a null UserId) — providing a much
more diagnostic failure message than a bare "expected exception, none
thrown" assertion would, since the failure message itself now reveals
WHICH behavior the OnDelete configuration actually regressed to.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a unit test using UseInMemoryDatabase() can reliably verify that OnDelete(DeleteBehavior.Restrict) actually prevents a parent from being deleted while children exist.',
      reality: 'UseInMemoryDatabase() has no real foreign-key constraint enforcement at all — a test using it would report a false-positive pass (or silently fail to catch a regression) regardless of what OnDelete() behavior is actually configured, since the in-memory provider never checks FK constraints the way a real database does.',
    },
    {
      thought: 'testing that SaveChangesAsync() throws an exception is sufficient to fully verify DeleteBehavior.Restrict is correctly configured.',
      reality: 'a regression to DeleteBehavior.SetNull also causes SaveChangesAsync() to succeed WITHOUT throwing — just like a regression to Cascade would, though with a different outcome (an orphaned child with a null FK instead of a deleted child) — a test should also assert on what happened to the child row when no exception was thrown, to distinguish these cases.',
    },
    {
      thought: 'since the main EF Core Basics topic recommended UseSqlite over UseInMemoryDatabase for query-translation tests, that recommendation does not necessarily extend to tests specifically about cascade/restrict delete behavior.',
      reality: 'the SAME underlying reasoning applies even more strongly here — DeleteBehavior enforcement is fundamentally a database-level foreign-key constraint check, which UseInMemoryDatabase() has no equivalent for at all, making UseSqlite (or another real provider) not just preferable but strictly REQUIRED for this class of test to have any validity.',
    },
  ];
}
