import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-captured-pooled-dbcontext-leak-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './captured-reference-pooled-dbcontext-leaks-across-requests.html',
  styleUrl: './captured-reference-pooled-dbcontext-leaks-across-requests.scss',
})
export class CapturedReferencePooledDbcontextLeaksAcrossRequestsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake warns against STORING state ON a pooled DbContext (an instance field) — but a DIFFERENT, subtler variant of the same underlying risk involves capturing a REFERENCE TO the context instance itself somewhere that outlives its intended scope',
      points: [
        'The main EF Core Performance page\'s "Storing instance state in a pooled DbContext" mistake shows the danger of adding a custom property (like <code>CurrentUserId</code>) directly ON the <code>DbContext</code> subclass. The underlying reason this is dangerous — "instances are reset and reused between requests... instance fields... will retain their values across requests" — applies EQUALLY to a subtler mistake the main page does not cover: capturing a REFERENCE to the DbContext INSTANCE itself in something that outlives the request scope (a static cache, a captured closure passed to an un-awaited <code>Task.Run</code>, an event handler subscription that is never unsubscribed).',
      ],
    },
    {
      heading: 'Because AddDbContextPool() RETURNS instances to a pool rather than disposing them, a captured reference that outlives its scope does not become a dangling pointer to a disposed object — it becomes a LIVE reference to an object the pool will hand out to a COMPLETELY UNRELATED, FUTURE request',
      points: [
        'With ordinary <code>AddDbContext&lt;T&gt;()</code> (no pooling), a <code>DbContext</code> captured beyond its intended scope and used after the request ends would throw <code>ObjectDisposedException</code> the moment it is touched — a LOUD, easily diagnosed failure, since the underlying object genuinely no longer exists in a usable state. With <code>AddDbContextPool&lt;T&gt;()</code>, the SAME captured reference is NOT disposed at request end — it is reset (change tracker cleared) and returned to the pool, ready to be handed out via <code>CreateDbContext()</code> for an ENTIRELY DIFFERENT, LATER request. A stale, captured reference from an EARLIER request can therefore continue to silently function, reading and writing data through a DbContext instance that a completely unrelated LATER request believes it exclusively owns — a genuine cross-request data corruption risk, not just an exception.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A captured DbContext reference escaping its request scope via an un-awaited background Task',
      language: 'csharp',
      code: `public class ProductService(AppDbContext db)
{
    public async Task CreateAsync(CreateProductDto dto, CancellationToken ct)
    {
        var product = new Product { Name = dto.Name, Price = dto.Price };
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);

        // BUG: fire-and-forget — the lambda CAPTURES 'db' (a reference
        // to THIS scoped/pooled DbContext instance), and the Task
        // keeps running AFTER this method (and the whole HTTP request)
        // has already returned to the client:
        _ = Task.Run(async () =>
        {
            await Task.Delay(2000);   // simulates some delayed work
            // 'db' here is the SAME DbContext instance this request's
            // scope owned — but by the time this code actually runs,
            // the REQUEST'S OWN SCOPE HAS ALREADY ENDED. With
            // AddDbContextPool(), the DbContext was likely ALREADY
            // reset and handed out to a DIFFERENT, UNRELATED request
            // by the time this delayed code tries to use it:
            await db.Products.Where(p => p.Id == product.Id)
                              .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsActive, true));
        });
    }
}

// Registration:
builder.Services.AddDbContextPool<AppDbContext>(opts => opts.UseSqlServer(cs));`,
    },
    {
      label: 'What actually happens — the delayed task can silently corrupt an UNRELATED later request\'s data',
      language: 'csharp',
      code: `// THE ACTUAL SEQUENCE OF EVENTS, WITH POOLING ENABLED:
//
//   T+0ms:    Request A begins. Pool hands out DbContext instance #7
//             for Request A's scope. ProductService.CreateAsync runs,
//             saves the new product, and starts the fire-and-forget
//             Task.Run — capturing a reference to instance #7.
//
//   T+50ms:   Request A's HTTP response is sent to the client. The DI
//             container disposes Request A's SCOPE — but because
//             instance #7 came from AddDbContextPool(), "disposing"
//             it means RESETTING its internal state and RETURNING it
//             to the pool, NOT actually destroying the object.
//
//   T+80ms:   Request B begins (a COMPLETELY UNRELATED request, from a
//             different user, updating a DIFFERENT product). The pool
//             hands out... instance #7 again — the SAME object Request
//             A's background task is STILL HOLDING A REFERENCE TO.
//             Request B's own service code runs normally, using
//             instance #7 for ITS OWN legitimate queries.
//
//   T+2000ms: Request A's delayed background task FINALLY wakes up and
//             calls 'db.Products...ExecuteUpdateAsync(...)' — but 'db'
//             is STILL instance #7, which by now is Request B's
//             ACTIVELY-OWNED context (Request B may itself still be
//             mid-flight, or may have already finished and had
//             instance #7 returned to the pool YET AGAIN for a THIRD
//             request by this point). The delayed update executes
//             against WHATEVER CONNECTION/STATE instance #7 currently
//             holds — potentially issuing a query on a connection
//             string, transaction, or tracked-entity state that
//             belongs to an entirely different, unrelated request's
//             context.
//
// THIS IS NOT MERELY A THEORETICAL RISK — it is the EXACT SAME
// underlying danger the main page's own mistake describes for
// instance FIELDS, just manifesting through a captured OBJECT
// REFERENCE instead of a stored PROPERTY VALUE. Both stem from the
// same root cause: AddDbContextPool() instances are RESET AND REUSED,
// not destroyed, so anything holding onto an instance beyond its
// intended scope risks interacting with a future, unrelated owner.

// ── THE FIX: never capture 'db' (or any scoped service) in an
// un-awaited background Task. Use IDbContextFactory<T> to create a
// GENUINELY INDEPENDENT context for background work, exactly as the
// main page's own IDbContextFactory guidance for Singleton services
// recommends — applied here to a fire-and-forget Task instead ──
public class ProductService(AppDbContext db, IDbContextFactory<AppDbContext> dbFactory)
{
    public async Task CreateAsync(CreateProductDto dto, CancellationToken ct)
    {
        var product = new Product { Name = dto.Name, Price = dto.Price };
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);

        var productId = product.Id;   // capture only the PRIMITIVE value

        _ = Task.Run(async () =>
        {
            await Task.Delay(2000);
            // A FRESH, independent DbContext — never shared with any
            // request's own scope or pool rental, regardless of how
            // long this delayed task takes to run:
            await using var backgroundDb = await dbFactory.CreateDbContextAsync();
            await backgroundDb.Products.Where(p => p.Id == productId)
                                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsActive, true));
        });
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Propose a test that would catch a regression back to the broken pattern (capturing "db" directly in a fire-and-forget Task) — one that specifically simulates the pooled context being reused by a SECOND, unrelated operation before the delayed background task runs.',
    hint: 'Consider directly modeling the pool\'s reuse behavior in a test: create a context via a real pool-backed factory, simulate the "delayed" work running AFTER a second, unrelated context rental has already occurred, and check whether the delayed work ends up operating on data belonging to the wrong logical owner.',
    solution: `A test that explicitly drives the pool through two sequential rentals,
with the "delayed" work deliberately interleaved AFTER the second
rental, directly reproduces the cross-request corruption risk:

[Fact]
public async Task CapturedContextInBackgroundTask_CanOperateOnAnUnrelatedLaterRentals_State()
{
    var services = new ServiceCollection();
    services.AddDbContextPool<AppDbContext>(opts =>
        opts.UseSqlite("Data Source=shared-test.db"), poolSize: 1);   // pool size 1
                                                                        // FORCES reuse
                                                                        // of the SAME
                                                                        // instance
    var provider = services.BuildServiceProvider();

    AppDbContext capturedContext;
    using (var scopeA = provider.CreateScope())
    {
        capturedContext = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        capturedContext.Database.EnsureCreated();
        capturedContext.Products.Add(new Product { Id = 1, Name = "Request A's Product" });
        await capturedContext.SaveChangesAsync();

        // Simulates the BROKEN pattern: a reference to 'capturedContext'
        // survives past scopeA's own disposal below — exactly like a
        // fire-and-forget Task capturing 'db'.
    }   // scopeA disposed — with pooling, this RESETS and RETURNS the
        // instance to the pool rather than destroying it

    // A SECOND, UNRELATED "request" rents from the pool — with
    // poolSize: 1, this is GUARANTEED to receive the SAME instance:
    using (var scopeB = provider.CreateScope())
    {
        var contextB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();
        contextB.Products.Add(new Product { Id = 2, Name = "Request B's Product" });
        await contextB.SaveChangesAsync();

        // Now simulate Request A's "delayed background task" finally
        // running, using its STALE captured reference — which, with
        // poolSize: 1, is the EXACT SAME underlying instance contextB
        // is currently using:
        var staleQueryResult = await capturedContext.Products
            .AsNoTracking()
            .Select(p => p.Name)
            .ToListAsync();

        // THE KEY ASSERTION: the "stale" query, run through
        // capturedContext, sees BOTH products — proving it is
        // genuinely operating against the SAME shared connection/state
        // as contextB, not an isolated, disposed, or otherwise safely
        // quarantined object:
        Assert.Contains("Request A's Product", staleQueryResult);
        Assert.Contains("Request B's Product", staleQueryResult);
        // In a REAL production scenario, this is the mechanism by
        // which a delayed background operation captured from an
        // EARLIER request can read or write data through a context
        // instance a LATER, unrelated request currently believes it
        // exclusively owns.
    }
}

This test forces pool reuse deterministically (via poolSize: 1) rather
than relying on production traffic patterns to coincidentally trigger
the same instance being rented twice — making the cross-request risk
this subtopic describes directly reproducible and verifiable in a fast,
deterministic unit test.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s "don\'t store state in a pooled DbContext" warning only applies to adding custom PROPERTIES directly on the DbContext subclass — capturing a reference to the context instance elsewhere in application code is a separate, unrelated concern.',
      reality: 'both stem from the exact same underlying risk: AddDbContextPool() instances are reset and reused, not destroyed, at scope end — a captured REFERENCE to the instance (in a fire-and-forget Task, a static cache, an unsubscribed event handler) is just as dangerous as a stored PROPERTY VALUE, since both survive past the instance\'s intended scope.',
    },
    {
      thought: 'a DbContext reference captured beyond its intended scope and used later would throw an ObjectDisposedException, making the bug immediately obvious.',
      reality: 'with AddDbContextPool() specifically, the captured reference is NOT disposed at scope end — it is reset and returned to the pool, meaning a stale reference silently continues to function, potentially operating against a completely unrelated later request\'s active context, with no exception thrown at all.',
    },
    {
      thought: 'a fire-and-forget Task.Run() that captures a scoped service like DbContext is generally safe as long as the delayed work eventually completes successfully without throwing.',
      reality: 'the delayed work "succeeding" is not proof of correctness — it may be silently operating against a database connection, transaction, or tracked-entity state that a completely different, unrelated request now owns, corrupting or misattributing data with no error surfaced anywhere.',
    },
  ];
}
