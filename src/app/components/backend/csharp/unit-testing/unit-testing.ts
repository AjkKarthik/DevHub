import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-unit-testing',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './unit-testing.html',
  styleUrl: './unit-testing.scss',
})
export class CsharpUnitTesting {

  quickRef: QuickRefItem[] = [
    { name: '[Fact]',                 type: 'decorator', desc: 'Marks a parameterless test method — one test, one scenario', since: 'xUnit 1' },
    { name: '[Theory] + [InlineData]', type: 'decorator', desc: 'Parameterised test — the same body runs once per data row', since: 'xUnit 1' },
    { name: 'Assert.Equal(exp, act)', type: 'method',    desc: 'Core equality assertion; expected value always comes first', since: 'xUnit 1' },
    { name: 'Assert.Throws<T>()',     type: 'method',    desc: 'Asserts a delegate throws exactly exception type T and returns it', since: 'xUnit 1' },
    { name: 'await Assert.ThrowsAsync<T>()', type: 'method', desc: 'Async version — never wrap async asserts in .Result', since: 'xUnit 2' },
    { name: 'Mock<T>',                type: 'class',     desc: 'Moq proxy for an interface/virtual member: new Mock<IMailer>()', since: 'Moq 4' },
    { name: '.Setup(...).Returns(...)', type: 'method',  desc: 'Stubs a member: mock.Setup(m => m.Get(1)).Returns(user)', since: 'Moq 4' },
    { name: '.Verify(...)',           type: 'method',    desc: 'Asserts an interaction happened: mock.Verify(m => m.Send(It.IsAny<Mail>()), Times.Once)', since: 'Moq 4' },
    { name: 'It.IsAny<T>()',          type: 'method',    desc: 'Argument matcher that accepts any value of T in Setup/Verify', since: 'Moq 4' },
    { name: 'IClassFixture<T>',       type: 'interface', desc: 'Shares one expensive fixture instance across all tests in a class', since: 'xUnit 2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Anatomy of a test — Arrange, Act, Assert',
      points: [
        'Every good unit test has three visually distinct phases: <strong>Arrange</strong> (build the object under test and its inputs), <strong>Act</strong> (call exactly one operation), <strong>Assert</strong> (verify the outcome).',
        'One logical assertion per test. Multiple <code>Assert.Equal</code> calls are fine when they verify one outcome (e.g. several properties of the same result) — what you should avoid is testing two <em>behaviours</em> in one method.',
        'xUnit creates a <strong>new instance of the test class for every test</strong> — instance fields are per-test state, the constructor is your shared Arrange, and <code>IDisposable.Dispose()</code> is your teardown.',
        'Name tests so failures read like a spec: <code>MethodName_Scenario_ExpectedResult</code>, e.g. <code>Withdraw_AmountExceedsBalance_ThrowsInsufficientFunds</code>.',
      ],
    },
    {
      heading: '[Fact] vs [Theory] — single case vs data-driven',
      points: [
        'A <code>[Fact]</code> is a single invariant ("new cart is empty"). A <code>[Theory]</code> runs the same body once per data row, each row reported as a separate test.',
        '<code>[InlineData(...)]</code> embeds constant rows in the attribute. For non-constant data (DateTime, objects) use <code>[MemberData]</code> pointing at a static property returning <code>IEnumerable&lt;object[]&gt;</code>.',
        'Resist the urge to put if/switch logic inside a Theory to handle special rows — that re-implements the code under test. Split awkward rows into their own Facts.',
        'Theories shine for boundary tables: 0, 1, max, max+1, negative, null — one line each.',
      ],
    },
    {
      heading: 'Test doubles — stub vs mock vs fake',
      points: [
        'A <strong>stub</strong> feeds canned data IN (Setup/Returns) — you assert on the result. A <strong>mock</strong> records calls going OUT (Verify) — you assert on the interaction. A <strong>fake</strong> is a working lightweight implementation (in-memory repository).',
        'Moq builds all three from interfaces or virtual members: <code>new Mock&lt;IUserRepo&gt;()</code>; pass <code>mock.Object</code> to the class under test.',
        'Prefer asserting on <em>state/results</em> over interactions. Verify() couples the test to implementation details — reserve it for things that ARE the behaviour (an email was sent, a payment was captured).',
        '<code>MockBehavior.Strict</code> fails on any un-setup call; the default (Loose) returns default values. Loose keeps tests resilient to refactoring; Strict catches unexpected calls.',
      ],
    },
    {
      heading: 'Testing async code and exceptions',
      points: [
        'Make the test method <code>async Task</code> (never <code>async void</code> — xUnit cannot await it) and <code>await</code> the act.',
        'Exceptions: <code>var ex = Assert.Throws&lt;ArgumentException&gt;(() =&gt; sut.Parse(null));</code> then assert on <code>ex.Message</code> or <code>ex.ParamName</code>. For async, <code>await Assert.ThrowsAsync&lt;T&gt;(...)</code>.',
        'Never block with <code>.Result</code>/<code>.Wait()</code> in tests — it can deadlock and hides the real call stack.',
        'Time, randomness and I/O make tests flaky. Inject abstractions: <code>TimeProvider</code> (.NET 8+) for clocks, an interface for the file system, a seeded Random.',
      ],
    },
    {
      heading: 'Designing for testability',
      points: [
        'Testability problems are design problems. <code>new HttpClient()</code> inside a method, static singletons, and <code>DateTime.Now</code> are untestable seams — inject them instead.',
        'Constructor injection of interfaces is the pattern that makes Moq possible: the class under test declares its dependencies; the test substitutes them.',
        'Pure functions (input → output, no side effects) need no mocks at all — push logic into pure methods and keep orchestration thin.',
        'Coverage is a thermometer, not a target. 100% coverage of trivial code is worth less than thorough boundary tests on the money-handling path.',
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
        // Arrange + Act
        var account = new BankAccount("ACC-1");

        // Assert
        Assert.Equal(0m, account.Balance);
    }

    [Theory]
    [InlineData(100, 40, 60)]   // normal withdrawal
    [InlineData(100, 100, 0)]   // exact balance
    [InlineData(50, 0.01, 49.99)]
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

        var ex = Assert.Throws<InvalidOperationException>(
            () => account.Withdraw(50m));

        Assert.Contains("insufficient", ex.Message,
            StringComparison.OrdinalIgnoreCase);
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

    [Fact]
    public async Task SendWelcome_UserExists_SendsMailAndReturnsTrue()
    {
        // Arrange — stub the repository (data IN)
        _repo.Setup(r => r.GetByIdAsync(42))
             .ReturnsAsync(new User(42, "ada@example.com"));

        var sut = new WelcomeService(_repo.Object, _mailer.Object);

        // Act
        var result = await sut.SendWelcomeAsync(42);

        // Assert — result + the one interaction that IS the behaviour
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

        var sut = new WelcomeService(_repo.Object, _mailer.Object);

        var result = await sut.SendWelcomeAsync(7);

        Assert.False(result);
        _mailer.VerifyNoOtherCalls();
    }
}`,
    },
    {
      label: 'Fixtures & lifecycle',
      language: 'csharp',
      code: `// xUnit makes a NEW test-class instance per test:
// constructor = per-test setup, Dispose = per-test teardown.
public class ParserTests : IDisposable
{
    private readonly TempFile _file;

    public ParserTests()              // runs before EVERY test
    {
        _file = TempFile.Create("a,b,c");
    }

    public void Dispose()             // runs after EVERY test
    {
        _file.Delete();
    }

    [Fact]
    public void Parse_ReadsThreeColumns()
        => Assert.Equal(3, Csv.Parse(_file.Path).Columns);
}

// Expensive resource shared by ALL tests in the class:
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
}`,
    },
    {
      label: 'Deterministic time',
      language: 'csharp',
      code: `// ❌ Untestable — result changes every day
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

public class MembershipTests
{
    [Fact]
    public void IsExpired_OneSecondPast_ReturnsTrue()
    {
        // FakeTimeProvider from Microsoft.Extensions.TimeProvider.Testing
        var clock = new FakeTimeProvider(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

        var sut = new Membership(clock);
        var expiry = clock.GetUtcNow().AddSeconds(-1);

        Assert.True(sut.IsExpired(expiry));
    }

    [Fact]
    public void IsExpired_FutureDate_ReturnsFalse()
    {
        var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
        var sut = new Membership(clock);

        Assert.False(sut.IsExpired(clock.GetUtcNow().AddDays(30)));
    }
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Test a Discount Service',
    language: 'csharp',
    description: 'You are given a DiscountService that depends on ICustomerRepository. Write xUnit tests that cover: (1) a VIP customer gets 20% off, (2) an unknown customer id throws KeyNotFoundException, (3) the repository is queried exactly once per call. Use Moq for the repository.',
    hints: [
      'Create Mock<ICustomerRepository> and pass mock.Object to the service',
      'Stub with mock.Setup(r => r.GetById(1)).Returns(new Customer(...))',
      'For the missing customer, stub Returns((Customer?)null) and use Assert.Throws',
      'Use mock.Verify(r => r.GetById(1), Times.Once) for the interaction test',
      'Name each test Method_Scenario_Expectation',
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
            ?? throw new KeyNotFoundException($"Customer {customerId} not found");
        return customer.IsVip ? 0.20m : 0.05m;
    }
}

public class DiscountServiceTests
{
    // TODO: VIP customer → 0.20m
    // TODO: unknown id → KeyNotFoundException
    // TODO: repository queried exactly once
}`,
    solution: `public class DiscountServiceTests
{
    private readonly Mock<ICustomerRepository> _repo = new();

    private DiscountService CreateSut() => new(_repo.Object);

    [Fact]
    public void GetDiscount_VipCustomer_Returns20Percent()
    {
        _repo.Setup(r => r.GetById(1)).Returns(new Customer(1, IsVip: true));

        var discount = CreateSut().GetDiscount(1);

        Assert.Equal(0.20m, discount);
    }

    [Fact]
    public void GetDiscount_RegularCustomer_Returns5Percent()
    {
        _repo.Setup(r => r.GetById(2)).Returns(new Customer(2, IsVip: false));

        var discount = CreateSut().GetDiscount(2);

        Assert.Equal(0.05m, discount);
    }

    [Fact]
    public void GetDiscount_UnknownCustomer_ThrowsKeyNotFound()
    {
        _repo.Setup(r => r.GetById(It.IsAny<int>())).Returns((Customer?)null);

        var ex = Assert.Throws<KeyNotFoundException>(
            () => CreateSut().GetDiscount(99));

        Assert.Contains("99", ex.Message);
    }

    [Fact]
    public void GetDiscount_QueriesRepositoryExactlyOnce()
    {
        _repo.Setup(r => r.GetById(1)).Returns(new Customer(1, true));

        CreateSut().GetDiscount(1);

        _repo.Verify(r => r.GetById(1), Times.Once);
        _repo.VerifyNoOtherCalls();
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between [Fact] and [Theory] in xUnit?',
      options: [
        '[Fact] runs faster than [Theory]',
        '[Fact] is a single test case; [Theory] runs once per supplied data row',
        '[Theory] tests are skipped in CI builds',
        '[Fact] is for sync code, [Theory] for async code',
      ],
      answer: 1,
      explanation: 'A [Fact] is one invariant scenario. A [Theory] is parameterised — each [InlineData]/[MemberData] row executes the test body once and reports as a separate result.',
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
      explanation: 'xUnit instantiates the test class per test method — so instance fields are isolated per test, the constructor is per-test setup, and Dispose() is per-test teardown.',
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
      explanation: 'Setup(...).Returns(...) makes the double feed data into the system under test (stub role). Verify(...) checks an interaction occurred (mock role) — use it only when the call itself is the behaviour.',
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
      explanation: 'Assert.ThrowsAsync awaits the delegate and asserts the exact exception type, returning it for further message/property asserts. Blocking with .Result risks deadlocks and wraps errors in AggregateException.',
    },
    {
      q: 'Why is `new HttpClient()` inside a method a testability problem?',
      options: [
        'HttpClient is sealed so Moq refuses to compile',
        'The dependency is hard-wired — the test cannot substitute it, so the test would hit the real network',
        'HttpClient is obsolete in .NET 8',
        'It is not a problem — xUnit intercepts HTTP automatically',
      ],
      answer: 1,
      explanation: 'Dependencies constructed inside the class cannot be replaced from outside. Inject an abstraction (or HttpMessageHandler/typed client) so tests can supply a double instead of real I/O.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a stub, a mock, and a fake?',
      a: 'A <strong>stub</strong> supplies canned data to the system under test — you assert on the returned state. A <strong>mock</strong> records outgoing interactions — you assert that specific calls happened (Verify). A <strong>fake</strong> is a real but lightweight implementation, like an in-memory repository. Moq can play stub and mock roles; fakes you usually write by hand.',
    },
    {
      q: 'Why does xUnit not have [SetUp]/[TearDown] attributes like NUnit?',
      a: 'By design. xUnit creates a new test-class instance per test, so the <em>constructor</em> is the setup and <code>IDisposable.Dispose()</code> is the teardown — plain C# instead of framework attributes. Shared expensive state goes into <code>IClassFixture&lt;T&gt;</code> (per class) or collection fixtures (across classes).',
    },
    {
      q: 'Should I aim for 100% code coverage?',
      a: 'No — coverage measures what executed, not what was verified. A test with no asserts still "covers" lines. Use coverage to find untested risk areas, then invest in boundary and failure-path tests where bugs are expensive: money, security, concurrency. 80% with sharp assertions beats 100% of assert-free walkthroughs.',
    },
    {
      q: 'How do I test code that uses DateTime.Now?',
      a: 'Inject a clock. .NET 8 ships <code>TimeProvider</code> as the standard abstraction: depend on it in the constructor, call <code>clock.GetUtcNow()</code>, and in tests pass <code>FakeTimeProvider</code> (from Microsoft.Extensions.TimeProvider.Testing) which lets you set and advance time deterministically.',
    },
    {
      q: 'Why should Verify() be used sparingly?',
      a: 'Every Verify couples the test to <em>how</em> the code works rather than <em>what</em> it produces — rename a method or reorder calls and tests break without any behaviour change. Reserve interaction asserts for effects that are the contract itself (an email sent, a payment captured) and assert on returned state everywhere else.',
    },
    {
      q: 'Can Moq mock a concrete class?',
      a: 'Only its <code>virtual</code>/<code>abstract</code> members — Moq generates a runtime subclass, so non-virtual members keep their real implementation and sealed classes cannot be mocked at all. This is why dependencies are declared as interfaces in testable designs.',
    },
    {
      q: 'What makes a unit test "good"?',
      a: 'Fast (milliseconds, no I/O), isolated (no shared state, any order), repeatable (same result every run — no real time/random/network), self-checking (asserts, not console output), and readable (AAA structure, intention-revealing name). The common acronym is FIRST.',
    },
    {
      q: 'Unit test vs integration test — where is the line?',
      a: 'A unit test exercises one class/behaviour with all out-of-process dependencies replaced by doubles. An integration test exercises real collaborations — database, HTTP pipeline, file system. Both matter: unit tests give fast precise feedback; integration tests catch wiring and configuration mistakes that mocks hide.',
    },
  ];
}
