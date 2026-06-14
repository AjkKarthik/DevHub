import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-csharp-unit-testing',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './unit-testing.html',
  styleUrl: './unit-testing.scss',
})
export class CsharpUnitTesting {

  quickRef: QuickRefItem[] = [
    { name: '[Fact]',                       type: 'decorator', desc: 'Marks a parameterless test — one scenario per method', since: 'xUnit 1' },
    { name: '[Theory] + [InlineData]',       type: 'decorator', desc: 'Parameterised test — same body runs once per data row, each row a separate result', since: 'xUnit 1' },
    { name: '[MemberData(nameof(X))]',       type: 'decorator', desc: 'Data rows from a static property — use for complex types and DateTimes', since: 'xUnit 1' },
    { name: 'Assert.Equal(exp, act)',        type: 'method',    desc: 'Core equality assertion; expected always comes first', since: 'xUnit 1' },
    { name: 'Assert.Throws<T>()',           type: 'method',    desc: 'Asserts a delegate throws exactly T and returns the exception', since: 'xUnit 1' },
    { name: 'await Assert.ThrowsAsync<T>()', type: 'method',  desc: 'Async exception assertion — never use .Result instead', since: 'xUnit 2' },
    { name: 'Mock<T>',                       type: 'class',    desc: 'Moq proxy for an interface or virtual member', since: 'Moq 4' },
    { name: '.Setup(...).Returns(...)',       type: 'method',   desc: 'Stubs a member call to return a canned value', since: 'Moq 4' },
    { name: '.ReturnsAsync(...)',             type: 'method',   desc: 'Returns a Task<T> from a stubbed async method', since: 'Moq 4' },
    { name: '.Verify(...)',                  type: 'method',   desc: 'Asserts an interaction happened — use sparingly', since: 'Moq 4' },
    { name: 'It.IsAny<T>()',                 type: 'method',   desc: 'Argument matcher that matches any value of T in Setup/Verify', since: 'Moq 4' },
    { name: 'It.Is<T>(pred)',                type: 'method',   desc: 'Argument matcher with a predicate — more specific than IsAny', since: 'Moq 4' },
    { name: 'MockBehavior.Strict',           type: 'token',    desc: 'Fails on any un-setup call instead of returning defaults', since: 'Moq 4' },
    { name: 'IClassFixture<T>',              type: 'interface', desc: 'Shares one expensive fixture instance across all tests in a class', since: 'xUnit 2' },
    { name: 'TimeProvider / FakeTimeProvider', type: 'class',  desc: 'Inject a fake clock for deterministic time-dependent tests (.NET 8+)', since: '.NET 8' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Anatomy of a test — Arrange, Act, Assert',
      points: [
        'Every good unit test has three visually distinct phases: <strong>Arrange</strong> (build the object under test and its inputs), <strong>Act</strong> (call exactly one operation), <strong>Assert</strong> (verify the outcome). A blank line between each phase acts as the separator — no comment required.',
        'One logical assertion per test. Multiple <code>Assert.Equal</code> calls are fine when they all verify aspects of the same outcome (e.g. several fields of one result object). What you avoid is testing two independent behaviours in one method — when it fails, you cannot tell which behaviour broke.',
        'xUnit creates a <strong>new instance of the test class for every test method</strong> — instance fields are fresh per-test state, the constructor is your per-test Arrange, and <code>IDisposable.Dispose()</code> is your per-test teardown. There are no <code>[SetUp]</code>/<code>[TearDown]</code> attributes.',
        'Name tests so failures read like a spec: <code>MethodName_Scenario_ExpectedResult</code>, for example <code>Withdraw_AmountExceedsBalance_ThrowsInsufficientFunds</code>. The test runner uses this as the failure message.',
        'Keep tests small and focused. A test that needs 30 lines of Arrange is a signal the production code is doing too much — or the test is testing too many things at once. Both are worth fixing.',
      ],
    },
    {
      heading: '[Fact] vs [Theory] — single case vs data-driven',
      points: [
        'A <code>[Fact]</code> is a single invariant scenario ("a new cart is empty"). A <code>[Theory]</code> runs the same body once per data row, each row reported as a separate test result with its own pass/fail status.',
        '<code>[InlineData(...)]</code> embeds constant rows directly in the attribute — ideal for primitives and strings. For non-constant data (DateTime, complex objects) use <code>[MemberData(nameof(Rows))]</code> pointing at a static property returning <code>IEnumerable&lt;object[]&gt;</code>.',
        '<code>[ClassData(typeof(MyData))]</code> moves data to a separate class, useful when the data set is large or reused across test classes. The class must implement <code>IEnumerable&lt;object[]&gt;</code>.',
        'Resist the urge to put <code>if/switch</code> logic inside a Theory to handle "special" rows — that re-implements the logic under test. Split awkward rows into dedicated Facts with descriptive names.',
        'Theories shine for boundary tables: 0, 1, max, max+1, negative, null, empty — each boundary is one line of <code>[InlineData]</code>. The test runner clearly shows which boundary failed.',
      ],
    },
    {
      heading: 'Test doubles — stub vs mock vs fake',
      points: [
        'A <strong>stub</strong> feeds canned data <em>into</em> the system under test — you assert on the returned state (result, property value). A <strong>mock</strong> records calls going <em>out</em> — you assert an interaction happened (Verify). A <strong>fake</strong> is a real but lightweight working implementation (in-memory repository, in-process bus).',
        'Moq plays both stub and mock roles from interfaces or virtual members: <code>new Mock&lt;IUserRepo&gt;()</code> creates the proxy; pass <code>mock.Object</code> to the class under test as the real dependency.',
        '<strong>Prefer asserting on state/results over interactions.</strong> <code>Verify()</code> couples the test to implementation details — reserve it for things that ARE the observable behaviour (an email sent, a payment captured, an event published).',
        '<code>MockBehavior.Strict</code> throws on any call not configured with Setup — useful for catching unexpected dependency calls. The default (Loose) returns default values for un-setup members, which keeps tests resilient to refactoring that adds new internal calls.',
        'NSubstitute is a popular alternative to Moq with a more fluent syntax: <code>var repo = Substitute.For&lt;IRepo&gt;();</code> then <code>repo.GetById(1).Returns(user);</code> and <code>repo.Received(1).GetById(1);</code> for verification.',
      ],
    },
    {
      heading: 'Testing async code and exceptions',
      points: [
        'Make the test method <code>async Task</code> — never <code>async void</code>. xUnit cannot await a void-returning method, so any exception thrown by an async void test is swallowed and the test appears to pass when it should fail.',
        'Test exceptions with <code>var ex = Assert.Throws&lt;ArgumentException&gt;(() =&gt; sut.Parse(null));</code>. You get the exception back and can assert on <code>ex.Message</code>, <code>ex.ParamName</code>, or inner properties. For async methods: <code>var ex = await Assert.ThrowsAsync&lt;T&gt;(() =&gt; sut.DoAsync());</code>.',
        'Never block with <code>.Result</code> or <code>.Wait()</code> in tests. It risks deadlocks in single-threaded contexts and wraps the real exception in an <code>AggregateException</code>, making the error message confusing.',
        'Time, randomness, and I/O make tests flaky. Inject abstractions: <code>TimeProvider</code> (.NET 8+) for clocks, an interface for the file system, a seeded <code>Random</code>, or an <code>HttpMessageHandler</code> for HTTP. Flaky tests are worse than no tests — they erode trust in the suite.',
        'For integration tests that need a real database, run it in a Docker container via Testcontainers-dotnet. The container spins up before the test suite and shuts down after, giving you a clean real database without environment pollution.',
      ],
    },
    {
      heading: 'Designing for testability',
      points: [
        'Testability problems are design problems. Code that is hard to test usually has too many responsibilities, hidden dependencies, or uncontrolled global state. The act of writing tests first (TDD) or annotating them reveals these problems early.',
        'Constructor injection of interfaces is the pattern that makes Moq possible: the class under test declares what it needs; the test supplies substitutes. Hard-coded <code>new</code> inside methods, static singletons, and <code>DateTime.Now</code> are untestable seams.',
        'Pure functions (input → output, no side effects) need no mocks at all. Push as much logic as possible into pure methods — algorithms, transformations, calculations — and keep the orchestration layer (the part that calls repositories and sends emails) thin and separately testable.',
        'The <strong>testing pyramid</strong>: many fast unit tests at the base, fewer integration tests in the middle, and a small number of end-to-end tests at the top. Inverted pyramids (lots of slow E2E tests, few unit tests) are expensive and give slow feedback.',
        'Coverage is a thermometer, not a target. 100% coverage of trivial code is worthless; thorough boundary and failure-path tests on money-handling, security, and concurrency code are invaluable. Use coverage to find risk areas, not to hit a metric.',
      ],
    },
    {
      heading: 'FluentAssertions, AutoFixture, and test quality',
      points: [
        '<strong>FluentAssertions</strong> replaces bare <code>Assert.Equal</code> with readable English: <code>result.Should().Be(42)</code>, <code>list.Should().HaveCount(3).And.Contain("Ada")</code>, <code>act.Should().Throw&lt;ArgumentException&gt;().WithMessage("*name*")</code>. Failures include a descriptive "because" message rather than just expected/actual.',
        '<strong>AutoFixture</strong> removes Arrange boilerplate by generating anonymous test data: <code>var fixture = new Fixture(); var user = fixture.Create&lt;User&gt;();</code> — properties filled with unique valid values. You declare only the values that matter to the specific test.',
        'AutoFixture integrates with xUnit via <code>[AutoData]</code> — the test parameters are generated and injected automatically, and with Moq via <code>[AutoMoqData]</code> which auto-creates mocks for interface parameters.',
        'Snapshot testing (Verify library) saves the output of a test as a .verified file on first run and diffs it on subsequent runs. Ideal for complex object graphs, serialized output, or generated code — verifying the full shape without writing dozens of individual property assertions.',
        'The <strong>FIRST principles</strong> for tests: Fast (milliseconds, no real I/O), Isolated (no shared mutable state, any order), Repeatable (same result every run), Self-checking (asserts, not console output), Timely (written close to the code they test). A test suite that violates any of these erodes developer trust over time.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Facts & Theories',
      language: 'csharp',
      code: `public class BankAccountTests
{
    [Fact]
    public void NewAccount_HasZeroBalance()
    {
        // Arrange + Act (trivial — combined)
        var account = new BankAccount("ACC-1");

        // Assert
        Assert.Equal(0m, account.Balance);
    }

    [Theory]
    [InlineData(100, 40,   60)]     // normal withdrawal
    [InlineData(100, 100,   0)]     // exact balance
    [InlineData( 50, 0.01, 49.99)]  // smallest amount
    public void Withdraw_ValidAmount_ReducesBalance(
        decimal start, decimal amount, decimal expected)
    {
        var account = new BankAccount("ACC-1");
        account.Deposit(start);

        account.Withdraw(amount);

        Assert.Equal(expected, account.Balance);
    }

    [Fact]
    public void Withdraw_MoreThanBalance_Throws()
    {
        var account = new BankAccount("ACC-1");
        account.Deposit(10m);

        // Assert.Throws returns the exception for further inspection:
        var ex = Assert.Throws<InvalidOperationException>(
            () => account.Withdraw(50m));

        Assert.Contains("insufficient", ex.Message,
            StringComparison.OrdinalIgnoreCase);
    }

    // MemberData for complex / non-constant rows:
    public static IEnumerable<object[]> BoundaryData =>
    [
        [100m, 0.01m, 99.99m],
        [0.01m, 0.01m, 0m],
    ];

    [Theory, MemberData(nameof(BoundaryData))]
    public void Withdraw_BoundaryAmounts_WorkCorrectly(
        decimal start, decimal amount, decimal expected)
    {
        var account = new BankAccount("X");
        account.Deposit(start);
        account.Withdraw(amount);
        Assert.Equal(expected, account.Balance);
    }
}`,
    },
    {
      label: 'Mocking with Moq',
      language: 'csharp',
      code: `public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
}
public interface IMailer
{
    Task SendAsync(string to, string subject);
}

public class WelcomeService(IUserRepository repo, IMailer mailer)
{
    public async Task<bool> SendWelcomeAsync(int userId)
    {
        var user = await repo.GetByIdAsync(userId);
        if (user is null) return false;
        await mailer.SendAsync(user.Email, "Welcome!");
        return true;
    }
}

public class WelcomeServiceTests
{
    private readonly Mock<IUserRepository> _repo = new();
    private readonly Mock<IMailer> _mailer = new();
    private WelcomeService CreateSut() =>
        new(_repo.Object, _mailer.Object);

    [Fact]
    public async Task SendWelcome_UserExists_SendsMailAndReturnsTrue()
    {
        // Arrange — stub (data IN)
        _repo.Setup(r => r.GetByIdAsync(42))
             .ReturnsAsync(new User(42, "ada@example.com"));

        // Act
        var result = await CreateSut().SendWelcomeAsync(42);

        // Assert — state + the one interaction that IS the behaviour
        Assert.True(result);
        _mailer.Verify(
            m => m.SendAsync("ada@example.com", It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task SendWelcome_UserMissing_DoesNotSendMail()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<int>()))
             .ReturnsAsync((User?)null);

        var result = await CreateSut().SendWelcomeAsync(7);

        Assert.False(result);
        _mailer.VerifyNoOtherCalls();  // nothing was sent
    }

    [Fact]
    public async Task SendWelcome_MailerThrows_PropagatesException()
    {
        _repo.Setup(r => r.GetByIdAsync(1))
             .ReturnsAsync(new User(1, "x@y.com"));
        _mailer.Setup(m => m.SendAsync(It.IsAny<string>(), It.IsAny<string>()))
               .ThrowsAsync(new SmtpException("timeout"));

        await Assert.ThrowsAsync<SmtpException>(
            () => CreateSut().SendWelcomeAsync(1));
    }
}`,
    },
    {
      label: 'Fixtures & lifecycle',
      language: 'csharp',
      code: `// xUnit creates a NEW test-class instance per test method.
// Constructor = per-test setup. Dispose = per-test teardown.
public class ParserTests : IDisposable
{
    private readonly TempFile _file;

    public ParserTests()               // runs before EVERY test
    {
        _file = TempFile.Create("a,b,c");
    }

    public void Dispose()              // runs after EVERY test
    {
        _file.Delete();
    }

    [Fact]
    public void Parse_ReadsThreeColumns()
        => Assert.Equal(3, Csv.Parse(_file.Path).Columns);
}

// ── Expensive shared resource: IClassFixture<T> ───────────────────────
// Spun up once per test class, not per test:
public class DbFixture : IDisposable
{
    public TestDatabase Db { get; } = TestDatabase.SpinUp();
    public void Dispose() => Db.TearDown();
}

public class OrderQueryTests : IClassFixture<DbFixture>
{
    private readonly DbFixture _fx;

    public OrderQueryTests(DbFixture fx) => _fx = fx;  // injected once

    [Fact]
    public void TopCustomers_OrdersByTotalSpend()
    {
        var top = new OrderQueries(_fx.Db).TopCustomers(3);
        Assert.Equal(3, top.Count);
    }
}

// ── Async lifecycle ───────────────────────────────────────────────────
// Implement IAsyncLifetime for async setup/teardown:
public class AsyncTests : IAsyncLifetime
{
    public async Task InitializeAsync()
        => await SeedDatabase();

    public async Task DisposeAsync()
        => await CleanDatabase();

    [Fact]
    public async Task Query_ReturnsSeededData()
    {
        var result = await db.Orders.ToListAsync();
        Assert.NotEmpty(result);
    }
}`,
    },
    {
      label: 'Deterministic time',
      language: 'csharp',
      code: `// ❌ Untestable — result changes every second
public class Membership
{
    public bool IsExpired(DateTime expiry) => expiry < DateTime.Now;
}

// ✅ Inject TimeProvider (.NET 8+) — the test owns the clock
public class Membership(TimeProvider clock)
{
    public bool IsExpired(DateTimeOffset expiry)
        => expiry < clock.GetUtcNow();
}

// Tests are deterministic and never flap:
public class MembershipTests
{
    [Fact]
    public void IsExpired_OneSecondPast_ReturnsTrue()
    {
        // FakeTimeProvider from Microsoft.Extensions.TimeProvider.Testing
        var clock = new FakeTimeProvider(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        var sut = new Membership(clock);

        Assert.True(sut.IsExpired(clock.GetUtcNow().AddSeconds(-1)));
    }

    [Fact]
    public void IsExpired_FutureDate_ReturnsFalse()
    {
        var clock = new FakeTimeProvider(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        var sut = new Membership(clock);

        Assert.False(sut.IsExpired(clock.GetUtcNow().AddDays(30)));
    }

    [Fact]
    public void IsExpired_AdvancingClock_CorrectlyExpires()
    {
        var clock = new FakeTimeProvider(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        var expiry = clock.GetUtcNow().AddHours(1);
        var sut = new Membership(clock);

        Assert.False(sut.IsExpired(expiry));

        clock.Advance(TimeSpan.FromHours(2));   // move time forward

        Assert.True(sut.IsExpired(expiry));
    }
}`,
    },
    {
      label: 'FluentAssertions & AutoFixture',
      language: 'csharp',
      code: `// NuGet: FluentAssertions, AutoFixture, AutoFixture.AutoMoq, AutoFixture.Xunit2

using FluentAssertions;
using AutoFixture;
using AutoFixture.AutoMoq;
using AutoFixture.Xunit2;

// ── FluentAssertions — readable failure messages ─────────────────────
public class FluentExamples
{
    [Fact]
    public void FluentAssertions_Basics()
    {
        var user = new User(1, "Ada", "ada@example.com");

        // Scalar
        user.Id.Should().Be(1);
        user.Name.Should().StartWith("Ada").And.HaveLength(3);
        user.Email.Should().Contain("@");

        // Collections
        var items = new[] { 1, 2, 3 };
        items.Should().HaveCount(3)
             .And.Contain(2)
             .And.BeInAscendingOrder();

        // Exceptions
        Action act = () => throw new InvalidOperationException("bad input");
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*bad*");   // * = wildcard

        // Async exceptions
        Func<Task> asyncAct = async () => await FailingAsync();
        await asyncAct.Should().ThrowAsync<TimeoutException>();
    }
}

// ── AutoFixture — anonymous data generation ───────────────────────────
public class AutoFixtureExamples
{
    [Fact]
    public void AutoFixture_ManualUsage()
    {
        var fixture = new Fixture();
        var user = fixture.Create<User>();   // all properties filled with
                                             // unique non-null values
        user.Email.Should().NotBeNullOrEmpty();
        user.Id.Should().NotBe(0);
    }

    // [AutoData]: parameters injected by AutoFixture — zero Arrange:
    [Theory, AutoData]
    public void AutoData_InjectsParameters(User user, decimal amount)
    {
        var account = new BankAccount(user.Id.ToString());
        account.Deposit(Math.Abs(amount));   // abs: AutoFixture may gen negative
        account.Balance.Should().Be(Math.Abs(amount));
    }

    // [AutoMoqData]: mocks injected automatically for interface params
    public class AutoMoqDataAttribute() : AutoDataAttribute(
        () => new Fixture().Customize(new AutoMoqCustomization()));

    [Theory, AutoMoqData]
    public async Task AutoMoq_MocksInjected(
        [Frozen] Mock<IUserRepository> repo,   // [Frozen] = same instance reused
        WelcomeService sut,                    // auto-constructed with repo.Object
        User user)
    {
        repo.Setup(r => r.GetByIdAsync(user.Id)).ReturnsAsync(user);

        var result = await sut.SendWelcomeAsync(user.Id);

        result.Should().BeTrue();
    }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Marking test methods async void instead of async Task',
      wrong: `[Fact]
public async void SendEmail_Succeeds()    // ← async void!
{
    await sut.SendAsync();   // exception here is swallowed by xUnit
    // Test appears GREEN even when the await throws
}`,
      right: `[Fact]
public async Task SendEmail_Succeeds()   // ← async Task
{
    await sut.SendAsync();   // exception propagates correctly to xUnit
}`,
      explanation: 'xUnit cannot await an async void method — it fires the method and moves on before it completes. Any exception thrown inside the async void is unobserved: the test finishes successfully, the exception is silently swallowed, and you have a permanently green test that masks a real failure. Always return async Task.',
    },
    {
      title: 'Blocking async methods with .Result or .Wait() in tests',
      wrong: `[Fact]
public void GetUser_ReturnsUser()
{
    // .Result blocks the thread — risks deadlock in some contexts
    var user = sut.GetUserAsync(1).Result;
    Assert.NotNull(user);
}`,
      right: `[Fact]
public async Task GetUser_ReturnsUser()
{
    var user = await sut.GetUserAsync(1);
    Assert.NotNull(user);
}`,
      explanation: '.Result/.Wait() blocks the calling thread and can deadlock in SynchronizationContext environments. It also wraps exceptions in AggregateException, making the xUnit failure message confusing — the real exception is buried as an inner exception. Always make the test method async Task and await properly.',
    },
    {
      title: 'Overusing Verify() for assertions instead of checking state',
      wrong: `[Fact]
public async Task ProcessOrder_CallsExpectedServices()
{
    await sut.ProcessAsync(order);

    // Asserting HOW it does it, not WHAT it produces:
    _repo.Verify(r => r.SaveAsync(It.IsAny<Order>()), Times.Once);
    _cache.Verify(c => c.Invalidate("orders"), Times.Once);
    _logger.Verify(l => l.Log(LogLevel.Info, …), Times.Once);
    // Breaks whenever internals change, even if behaviour is correct
}`,
      right: `[Fact]
public async Task ProcessOrder_UpdatesStatusToComplete()
{
    var result = await sut.ProcessAsync(order);

    // Assert on what MATTERS — the observable outcome:
    Assert.Equal(OrderStatus.Complete, result.Status);
    // Only verify interactions that ARE the behaviour contract:
    _mailer.Verify(m => m.SendConfirmationAsync(order.CustomerEmail), Times.Once);
}`,
      explanation: 'Interaction tests via Verify() couple tests to implementation details — rename a method, extract a helper, or change the call order and unrelated tests break. Prefer asserting on the returned state or persisted outcome. Reserve Verify() for side effects that are themselves the contract: email sent, payment captured, event published.',
    },
    {
      title: 'Mocking a concrete class without virtual members',
      wrong: `// Concrete class with no virtual members:
public class OrderRepository { public Order? GetById(int id) { … } }

var mock = new Mock<OrderRepository>();
mock.Setup(r => r.GetById(1)).Returns(order);  // silently ignored!
// GetById is non-virtual — Moq generates a subclass but can't override it
// The real GetById runs, hitting the actual database`,
      right: `// Define an interface that the class implements:
public interface IOrderRepository { Order? GetById(int id); }
public class OrderRepository : IOrderRepository { … }

// Now Moq can implement the interface correctly:
var mock = new Mock<IOrderRepository>();
mock.Setup(r => r.GetById(1)).Returns(order);  // works`,
      explanation: 'Moq creates a runtime subclass of your class and can only override virtual or abstract members. Non-virtual methods call through to the real implementation, so Setup() appears to work but the real code runs. The fix is to depend on an interface — which is also a better design, decoupling the class from its storage mechanism.',
    },
    {
      title: 'Sharing mutable state across tests (ordering dependency)',
      wrong: `public class InventoryTests
{
    // SHARED across tests — mutation in one test affects the next!
    private static List<Product> _products = [new(1, "Widget", 10)];

    [Fact]
    public void Add_IncreasesCount()
    {
        _products.Add(new(2, "Gadget", 5));
        Assert.Equal(2, _products.Count);
    }

    [Fact]
    public void Remove_DecreasesCount()
    {
        _products.RemoveAt(0);
        Assert.Single(_products);   // may fail if Add ran first!
    }
}`,
      right: `public class InventoryTests
{
    // Fresh per test — no ordering dependency
    private readonly List<Product> _products = [new(1, "Widget", 10)];

    [Fact]
    public void Add_IncreasesCount() { … }
    [Fact]
    public void Remove_DecreasesCount() { … }
}`,
      explanation: 'Static or shared mutable state creates test-ordering dependencies — tests pass alone but fail when run together or in a different order. xUnit runs tests in non-deterministic order (and parallelises by default). Make state an instance field (xUnit creates a fresh class instance per test) or create it in the constructor.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between [Fact] and [Theory] in xUnit?',
      options: [
        '[Fact] runs faster than [Theory]',
        '[Fact] is a single test case; [Theory] runs once per supplied data row, each row a separate result',
        '[Theory] tests are skipped in CI builds',
        '[Fact] is for sync code, [Theory] for async code',
      ],
      answer: 1,
      explanation: 'A [Fact] is one invariant scenario. A [Theory] is parameterised — each [InlineData]/[MemberData] row executes the test body independently and is reported as a separate test result in the runner.',
    },
    {
      q: 'When does xUnit create an instance of your test class?',
      options: [
        'Once for the whole assembly',
        'Once per test class',
        'A fresh instance for every test method',
        'Only when the class implements IClassFixture',
      ],
      answer: 2,
      explanation: 'xUnit instantiates the test class once per test method, so instance fields are isolated, the constructor is per-test setup, and Dispose() is per-test teardown — no [SetUp]/[TearDown] attributes needed.',
    },
    {
      q: 'In Moq, what is the difference between Setup/Returns and Verify?',
      options: [
        'They are interchangeable',
        'Setup/Returns stubs incoming data; Verify asserts that an outgoing call happened',
        'Verify is only for async methods',
        'Setup works on classes, Verify only on interfaces',
      ],
      answer: 1,
      explanation: 'Setup(...).Returns(...) configures the double to feed data into the system under test (stub role). Verify(...) checks an outgoing interaction occurred (mock role) — use it only when the call itself is the observable contract.',
    },
    {
      q: 'How should you test that an async method throws an exception?',
      options: [
        'Wrap it in try/catch and set a bool flag',
        'Call .Result and catch AggregateException',
        'await Assert.ThrowsAsync<TException>(() => sut.DoAsync())',
        'Mark the test [Fact(Skip)] — async exceptions cannot be tested',
      ],
      answer: 2,
      explanation: 'Assert.ThrowsAsync awaits the delegate and asserts the exact exception type, returning the exception for further message/property asserts. Blocking with .Result risks deadlocks and wraps errors in AggregateException, obscuring the real failure.',
    },
    {
      q: 'Why is `new HttpClient()` inside a method a testability problem?',
      options: [
        'HttpClient is sealed so Moq refuses to compile',
        'The dependency is hard-wired — the test cannot substitute it, so tests would hit the real network',
        'HttpClient is obsolete in .NET 8',
        'It is not a problem — xUnit intercepts HTTP automatically',
      ],
      answer: 1,
      explanation: 'Dependencies constructed inside the class cannot be replaced from outside. Inject an abstraction (IHttpClientFactory, typed client, or IHttpMessageHandler) so tests can supply a double and avoid real I/O.',
    },
    {
      q: 'What does MockBehavior.Strict do in Moq?',
      options: [
        'It validates argument types at compile time',
        'It throws an exception for any method call that was not configured with Setup — useful for detecting unexpected dependency use',
        'It makes mock.Verify() mandatory at the end of every test',
        'It disables the default return of default values for un-setup members',
      ],
      answer: 1,
      explanation: 'MockBehavior.Strict makes Moq throw MockException on any invocation that was not explicitly configured — it catches cases where the system under test calls a dependency in an unexpected way. The default (Loose) returns default values for un-configured calls, which is more resilient to refactoring.',
    },
    {
      q: 'What is IClassFixture<T> used for in xUnit?',
      options: [
        'It marks a test as belonging to a category for filtering',
        'It shares one expensive instance (database, container, server) across all tests in a class, created once and disposed after all tests run',
        'It provides automatic mock injection into test constructors',
        'It runs a particular test first before all others in the class',
      ],
      answer: 1,
      explanation: 'IClassFixture<T> tells xUnit to create one T instance per test class, inject it into the test constructor, and dispose it after all tests in the class complete. Use it for expensive resources like spinning up a database or an in-process web server that would be too slow to recreate per test.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a stub, a mock, and a fake?',
      a: 'A <strong>stub</strong> supplies canned data to the system under test — you assert on the returned state. A <strong>mock</strong> records outgoing interactions — you assert that specific calls happened (Verify). A <strong>fake</strong> is a real but lightweight working implementation, like an in-memory repository. Moq plays stub and mock roles; fakes you usually write by hand when the fake is simpler than configuring a mock.',
    },
    {
      q: 'Why does xUnit not have [SetUp]/[TearDown] attributes like NUnit?',
      a: 'By design. xUnit creates a new test-class instance per test, so the <em>constructor</em> is the setup and <code>IDisposable.Dispose()</code> is the teardown — plain C# instead of framework attributes. For shared expensive state (database, server) use <code>IClassFixture&lt;T&gt;</code> (per class) or <code>ICollectionFixture&lt;T&gt;</code> (across multiple classes).',
    },
    {
      q: 'Should I aim for 100% code coverage?',
      a: 'No — coverage measures what executed, not what was verified. A test with no asserts "covers" lines without testing anything. Use coverage to find untested risk areas, then invest in boundary and failure-path tests where bugs are expensive: money calculations, security checks, concurrency logic. 80% with sharp assertions beats 100% of assertion-free walkthroughs.',
    },
    {
      q: 'How do I test code that uses DateTime.Now?',
      a: 'Inject a clock. .NET 8 ships <code>TimeProvider</code> as the standard abstraction — depend on it in the constructor, call <code>clock.GetUtcNow()</code>, and in tests pass <code>FakeTimeProvider</code> (from Microsoft.Extensions.TimeProvider.Testing) which lets you set and advance time deterministically. For earlier .NET versions, define your own <code>IClock</code> interface with the same approach.',
    },
    {
      q: 'Why should Verify() be used sparingly?',
      a: 'Every Verify couples the test to <em>how</em> the code works rather than <em>what</em> it produces — rename a method or reorder internal calls and tests break without any behaviour change. Reserve interaction asserts for effects that ARE the contract: an email was sent, a payment was captured, an event was published. For everything else, assert on the returned value or persisted state.',
    },
    {
      q: 'Can Moq mock a concrete class?',
      a: 'Only its <code>virtual</code> or <code>abstract</code> members. Moq generates a runtime subclass, so non-virtual members use the real implementation. Sealed classes cannot be mocked at all. This is why testable designs declare dependencies as interfaces — and why you should depend on <code>IHttpClientFactory</code> or <code>HttpMessageHandler</code> rather than <code>HttpClient</code> directly.',
    },
    {
      q: 'What makes a unit test "good"?',
      a: 'The FIRST principles: <strong>F</strong>ast (milliseconds, no I/O), <strong>I</strong>solated (no shared mutable state, runs in any order), <strong>R</strong>epeatable (same result every run — no real time/random/network), <strong>S</strong>elf-checking (asserts, not console output), <strong>T</strong>imely (written close to the code). A test suite that violates any of these slowly erodes developer trust.',
    },
    {
      q: 'Unit test vs integration test — where is the line?',
      a: 'A unit test exercises one class/behaviour with all out-of-process dependencies replaced by doubles — it is fast and precise. An integration test exercises real collaborations: database, HTTP pipeline, file system — it is slower but catches wiring and configuration mistakes that mocks cannot. Both matter; the testing pyramid says most tests should be unit tests, with fewer integration tests and even fewer end-to-end tests.',
    },
  ];

  challenge: Challenge = {
    title: 'Test a Discount Service',
    language: 'csharp',
    description: 'You are given a DiscountService that depends on ICustomerRepository. Write xUnit tests that cover: (1) a VIP customer gets 20% off, (2) a regular customer gets 5% off, (3) an unknown customer id throws KeyNotFoundException, (4) the repository is queried exactly once per call. Use Moq for the repository.',
    hints: [
      'Create Mock<ICustomerRepository> and pass mock.Object to the service constructor',
      'Stub with mock.Setup(r => r.GetById(1)).Returns(new Customer(...))',
      'For the missing customer, setup Returns((Customer?)null) and use Assert.Throws',
      'Use mock.Verify(r => r.GetById(1), Times.Once) for the interaction test',
      'Name each test: MethodName_Scenario_ExpectedResult',
    ],
    starterCode: `public record Customer(int Id, bool IsVip);

public interface ICustomerRepository
{
    Customer? GetById(int id);
}

public class DiscountService(ICustomerRepository repo)
{
    public decimal GetDiscount(int customerId)
    {
        var customer = repo.GetById(customerId)
            ?? throw new KeyNotFoundException($"Customer \${customerId} not found");
        return customer.IsVip ? 0.20m : 0.05m;
    }
}

public class DiscountServiceTests
{
    // TODO: 1. VIP customer → 0.20m
    // TODO: 2. Regular customer → 0.05m
    // TODO: 3. Unknown id → KeyNotFoundException
    // TODO: 4. Repository queried exactly once
}`,
    solution: `public class DiscountServiceTests
{
    private readonly Mock<ICustomerRepository> _repo = new();
    private DiscountService CreateSut() => new(_repo.Object);

    [Fact]
    public void GetDiscount_VipCustomer_Returns20Percent()
    {
        _repo.Setup(r => r.GetById(1))
             .Returns(new Customer(1, IsVip: true));

        var discount = CreateSut().GetDiscount(1);

        Assert.Equal(0.20m, discount);
    }

    [Fact]
    public void GetDiscount_RegularCustomer_Returns5Percent()
    {
        _repo.Setup(r => r.GetById(2))
             .Returns(new Customer(2, IsVip: false));

        var discount = CreateSut().GetDiscount(2);

        Assert.Equal(0.05m, discount);
    }

    [Fact]
    public void GetDiscount_UnknownCustomer_ThrowsKeyNotFound()
    {
        _repo.Setup(r => r.GetById(It.IsAny<int>()))
             .Returns((Customer?)null);

        var ex = Assert.Throws<KeyNotFoundException>(
            () => CreateSut().GetDiscount(99));

        Assert.Contains("99", ex.Message);
    }

    [Fact]
    public void GetDiscount_CallsRepositoryExactlyOnce()
    {
        _repo.Setup(r => r.GetById(1))
             .Returns(new Customer(1, true));

        CreateSut().GetDiscount(1);

        _repo.Verify(r => r.GetById(1), Times.Once);
        _repo.VerifyNoOtherCalls();
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'xUnit tests use [Fact] for single cases and [Theory]+[InlineData] for parameterised data; Moq stubs incoming data with Setup/Returns and verifies outgoing interactions with Verify; testability is a design property achieved through interface injection and pure functions.',
    mustKnow: [
      'AAA structure: Arrange → Act → Assert; one logical behaviour per test; name as <code>Method_Scenario_ExpectedResult</code>',
      'xUnit creates a fresh class instance per test — constructor is setup, <code>Dispose()</code> is teardown; use <code>IClassFixture&lt;T&gt;</code> for shared expensive resources',
      'Always <code>async Task</code> for async tests — <code>async void</code> swallows exceptions and the test appears green',
      'Stub (Setup/Returns) feeds data in; Mock (Verify) asserts calls go out — prefer state assertions, reserve Verify for contract side-effects',
      'Moq can only override virtual/abstract members — depend on interfaces, not concrete classes',
      'Inject time via <code>TimeProvider</code>; inject HTTP via <code>IHttpClientFactory</code> or <code>HttpMessageHandler</code> — hard-coded static dependencies are untestable seams',
      'FIRST principles: Fast, Isolated, Repeatable, Self-checking, Timely — shared mutable state and real I/O violate multiple of these',
    ],
    interviewFocus: [
      'What is the difference between a stub, a mock, and a fake?',
      'Why must async xUnit test methods return Task, not void?',
      'When should you use Verify() in Moq vs asserting on the returned state?',
      'How do you test code that calls DateTime.Now?',
      'What is IClassFixture<T> and when do you use it instead of constructor setup?',
    ],
  };
}
