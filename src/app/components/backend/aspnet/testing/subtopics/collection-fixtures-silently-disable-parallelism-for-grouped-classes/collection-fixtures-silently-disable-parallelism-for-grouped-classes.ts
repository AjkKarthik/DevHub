import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-collection-fixtures-parallelism-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './collection-fixtures-silently-disable-parallelism-for-grouped-classes.html',
  styleUrl: './collection-fixtures-silently-disable-parallelism-for-grouped-classes.scss',
})
export class CollectionFixturesSilentlyDisableParallelismForGroupedClassesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states two true facts in two separate places — "xUnit runs test classes in parallel by default" and (in its own Q&A) "share one WebApplicationFactory across multiple test classes... via [CollectionDefinition] and [Collection]" — without ever connecting them: putting multiple classes into the SAME [Collection] is precisely what turns their execution from parallel back to sequential',
      points: [
        'xUnit\'s parallelism unit is the TEST COLLECTION, not the individual class. By default, EVERY test class that does not carry an explicit <code>[Collection("...")]</code> attribute is its own implicit, single-class collection — and DIFFERENT collections run in parallel with each other. The moment several classes are grouped under the SAME <code>[Collection("Api")]</code> name (exactly the pattern used to share one expensive <code>WebApplicationFactory</code> across them), xUnit treats them as ONE unit for scheduling purposes — classes within a single collection always run sequentially relative to each other, never concurrently, regardless of how many CPU cores are available.',
        'This is not a bug or a surprising edge case — it is the DIRECT and unavoidable mechanism by which shared collection fixtures are made safe at all: if two classes shared one <code>WebApplicationFactory</code> instance (and therefore one DI container, one in-memory database connection, one set of Singleton services) and were ALSO allowed to run in parallel, they would race on that shared state constantly. Sequential execution within a collection is the price paid for shared setup — the main page\'s own "share one factory" recommendation implicitly trades away inter-class parallelism to get that sharing, without stating the trade-off explicitly.',
      ],
    },
    {
      heading: 'The practical consequence for suite runtime: as a codebase grows and MORE test classes get added to a shared collection (a natural response to "startup cost is expensive, let\'s share the fixture more"), the SEQUENTIAL portion of the suite grows too — eventually undermining the very reason parallel test execution exists',
      points: [
        'A team chasing faster CI by aggressively sharing ONE <code>WebApplicationFactory</code> across dozens of test classes (to avoid dozens of app startups) can inadvertently create a large, slow, SEQUENTIAL block that dominates total wall-clock time — even though each individual class\'s app-startup savings look like a win in isolation. The right question is not "how many classes can share one fixture" but "how many classes NEED to share state, versus how many just want to avoid redundant startup cost" — the latter can often use a cheaper solution (a static, once-per-test-RUN factory built via a <code>[CollectionDefinition]</code> with an <code>ICollectionFixture&lt;T&gt;</code> that classes reference WITHOUT necessarily sharing MUTABLE state, only the expensive-to-build immutable parts).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The setup from the main page\'s own Q&A — and its unstated parallelism trade-off',
      language: 'csharp',
      code: `// Exactly the pattern the main page's Q&A describes:
[CollectionDefinition("Api")]
public class ApiCollection : ICollectionFixture<TestWebApp> { }

[Collection("Api")]
public class ProductsApiTests
{
    private readonly HttpClient _client;
    public ProductsApiTests(TestWebApp app) => _client = app.CreateClient();

    [Fact]
    public async Task GetProducts_ReturnsExpectedCount() { /* ... */ }
}

[Collection("Api")]
public class OrdersApiTests
{
    private readonly HttpClient _client;
    public OrdersApiTests(TestWebApp app) => _client = app.CreateClient();

    [Fact]
    public async Task GetOrders_ReturnsExpectedCount() { /* ... */ }
}

// UNSTATED CONSEQUENCE: ProductsApiTests and OrdersApiTests, despite
// being entirely different classes testing entirely different
// endpoints with NO logical dependency on each other, now ALWAYS run
// sequentially — never concurrently — because they share the "Api"
// collection. Without [Collection("Api")], xUnit would run these two
// classes in parallel by default (each getting its OWN TestWebApp
// instance, at the cost of two app startups instead of one).`,
    },
    {
      label: 'Proving the sequential behavior, and a middle-ground fix',
      language: 'csharp',
      code: `// A minimal timing test that demonstrates the trade-off directly:
// two [Fact]s in DIFFERENT [Collection("Api")]-tagged classes, each
// deliberately slow, run back-to-back — total time is close to the
// SUM of both delays, not the max:
[Collection("Api")]
public class SlowClassA
{
    [Fact]
    public async Task SlowTest() => await Task.Delay(TimeSpan.FromSeconds(2));
}

[Collection("Api")]
public class SlowClassB
{
    [Fact]
    public async Task SlowTest() => await Task.Delay(TimeSpan.FromSeconds(2));
}
// Total observed wall-clock for both: ~4 seconds (sequential).
// Remove [Collection("Api")] from both (each gets its own implicit
// collection): total observed wall-clock: ~2 seconds (parallel) —
// the SAME two Task.Delay(2s) calls, provably running concurrently.

// MIDDLE GROUND: give classes that don't actually need to share
// MUTABLE state their own lightweight startup, while still avoiding
// per-TEST-METHOD cost via IClassFixture (per-class, not per-collection):
public class ProductsApiTests : IClassFixture<TestWebApp>   // no [Collection]
{
    // Own TestWebApp instance — runs in PARALLEL with OrdersApiTests
    // below, at the cost of one extra app startup versus full sharing.
}

public class OrdersApiTests : IClassFixture<TestWebApp>     // no [Collection]
{
    // Genuinely independent — no shared mutable state risk, and
    // xUnit is free to run this concurrently with ProductsApiTests.
}

// Reserve [Collection("...")] specifically for classes that MUST
// share a genuinely expensive, hard-to-parallelize resource — a
// Testcontainers-backed real database connection is the canonical
// case, NOT a plain in-process WebApplicationFactory (which is cheap
// enough per-class that paying the startup cost per class, in
// exchange for real parallelism, is usually the better trade).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test suite has 40 test classes, all grouped into one [Collection("Api")] to share a single WebApplicationFactory (each class-level startup would otherwise take ~200ms, and each class has ~5 test methods taking ~50ms each). Estimate the wall-clock time for the collection-based approach versus giving each class its own IClassFixture (no shared collection), assuming a CI machine with 8 available cores. Which approach is actually faster overall, and why might the "obvious" choice be wrong?',
    hint: 'Sequential-in-one-collection means: total time ≈ (startup cost once) + SUM of every class\'s test time, with no parallelism benefit at all from the 8 cores. Per-class IClassFixture means: total time ≈ (startup cost + that class\'s own test time), but xUnit can run up to 8 of these class-units CONCURRENTLY. Work out both totals with the given numbers.',
    solution: `Collection-based (one shared factory, forced sequential):
Total time ≈ 200ms (one startup) + 40 classes × 5 tests × 50ms
           = 200ms + 40 × 250ms = 200ms + 10,000ms ≈ 10.2 seconds.
The 8 available cores provide ZERO benefit here — everything in the
collection runs on effectively one execution lane, regardless of core
count, because collection membership forces sequential ordering.

Per-class IClassFixture (each class independent, own factory,
eligible for parallel scheduling across 8 cores):
Each class costs 200ms startup + 5 × 50ms tests = 450ms per class.
With 40 classes distributed across 8 concurrent slots: 40 / 8 = 5
"waves" of classes, each wave taking ~450ms (assuming even distribution
and no other bottleneck) ≈ 5 × 450ms = 2.25 seconds.

The per-class approach is roughly 4-5× FASTER overall in this
scenario, despite paying the 200ms startup cost 40 separate times
(8,000ms of TOTAL startup work across all classes, versus 200ms once)
— because that repeated cost is fully parallelized across 8 cores,
while the collection approach's "savings" (one startup instead of 40)
are swamped by forcing ALL the test execution time onto a single
sequential lane that never uses the other 7 cores at all.

The "obvious" choice — share the fixture to avoid 40 startups — LOOKS
like the efficient choice when you only count "number of times we pay
the expensive setup," and that reasoning is exactly why it's an easy
trap. The real cost that matters is WALL-CLOCK time on a multi-core
CI runner, and any approach that removes work from the parallel
scheduler (by binding it into one collection) has to save an enormous
amount of setup cost to be worth losing access to every core beyond
the first. In-process WebApplicationFactory startup is usually cheap
enough (milliseconds to low hundreds of milliseconds) that this trade
rarely pays off — the "share for efficiency" reasoning was DESIGNED
for genuinely expensive, hard-to-duplicate resources like a real
database container, not a lightweight in-process test host.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'xUnit\'s "test classes run in parallel by default" behavior is unconditional — grouping classes for other purposes (like sharing a fixture) doesn\'t affect that.',
      reality: 'the unit of parallelism in xUnit is the test COLLECTION, not the class; every class without an explicit [Collection] attribute is its own separate, parallel-eligible collection, but classes sharing the SAME [Collection] name are forced to run sequentially relative to each other, by design — that is precisely the mechanism that makes shared mutable fixtures safe.',
    },
    {
      thought: 'grouping many test classes into one shared collection fixture is a straightforward performance win, since it avoids paying an expensive setup cost (like starting WebApplicationFactory) once per class.',
      reality: 'that savings has to be weighed against the LOST parallelism across however many CPU cores the CI runner has — for a cheap-to-start in-process factory, the sequential-execution cost of a large shared collection frequently outweighs the setup-cost savings, and the trade only clearly favors sharing for genuinely expensive resources like a real database container.',
    },
    {
      thought: '[Collection("Name")] is purely a way to share a fixture instance and has no other side effects on how tests are scheduled.',
      reality: 'assigning multiple classes to the same collection name is inseparable from disabling parallel execution between them — sharing and sequential scheduling are the same mechanism in xUnit, not two independent, separately-toggleable behaviors.',
    },
  ];
}
