import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-xunit-dotnet',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './xunit.html',
  styleUrl: './xunit.scss',
})
export class XunitDotnet {
  quickRef: QuickRefItem[] = [
    { name: '[Fact]',          type: 'keyword', desc: 'Marks a parameterless test method that always runs the same way.' },
    { name: '[Theory]',        type: 'keyword', desc: 'Marks a parameterised test. Requires [InlineData], [MemberData], or [ClassData].' },
    { name: '[InlineData]',    type: 'keyword', desc: 'Supplies inline parameter values to a [Theory].' },
    { name: 'IClassFixture<T>',type: 'interface', desc: 'Shares a single fixture instance across all tests in a class — for expensive setup.' },
    { name: 'Assert.Equal()',  type: 'method', desc: 'Deep equality assertion. First param is expected, second is actual.' },
    { name: 'Assert.Throws<T>',type: 'method', desc: 'Asserts that a specific exception type is thrown by an action.' },
    { name: 'FluentAssertions',type: 'keyword', desc: 'Third-party library for readable assertions: result.Should().Be(5).' },
  ];

  theory: TheoryPoint[] = [
    { heading: '[Fact] and [Theory]', points: [
      '[Fact] is for a test with no parameters — a single, fixed scenario.',
      '[Theory] runs the same test body multiple times with different inputs from [InlineData].',
      '[MemberData] reads inputs from a static property — useful for complex data sets.',
      '[ClassData] reads from an IEnumerable<object[]> class — for large or shared data sets.',
    ]},
    { heading: 'Fixtures and Shared Setup', points: [
      'Constructor injection in the test class acts as setup — runs before every test.',
      'IClassFixture<T>: one T instance is shared across all tests in the class (expensive setup).',
      'ICollectionFixture<T>: shares a fixture across multiple test classes via [Collection].',
      'Implement IAsyncLifetime to run async setup/teardown (InitializeAsync / DisposeAsync).',
    ]},
    { heading: 'Assert API', points: [
      'Assert.Equal(expected, actual) — note: expected first, actual second (opposite of Jest).',
      'Assert.True / Assert.False — boolean assertions.',
      'Assert.Throws<ExceptionType>(() => ...) — catches and returns the exception for further assertions.',
      'Assert.ThrowsAsync<T>(async () => ...) — for async code that throws.',
      'Assert.Collection(list, item => ...) — asserts each element with a separate action.',
    ]},
    { heading: 'FluentAssertions', points: [
      'Makes assertions read like English: result.Should().Be(5).And.BePositive().',
      'Better failure messages — shows expected vs actual with context.',
      'Supports collections, exceptions, async, strings, dates, and more.',
      'Install via NuGet: FluentAssertions. No test framework dependency — works with xUnit, NUnit, MSTest.',
    ]},
    { heading: 'xUnit\'s Constructor-Based Test Isolation', points: [
      'xUnit creates a NEW instance of the test class for every single test method, meaning constructor logic runs fresh before each test — this structurally prevents the shared-mutable-state-between-tests bugs that plague frameworks reusing one instance across a suite.',
      'IClassFixture<T> and ICollectionFixture<T> provide explicit, opt-in mechanisms for sharing expensive setup (like a database connection) across tests, making shared state a deliberate choice rather than an accidental default.',
      'This per-test-instance model differs from NUnit and MSTest\'s [SetUp]/[TestInitialize] attribute-based approach, which achieves similar isolation but relies on convention (a developer correctly resetting all state in the setup method) rather than the language\'s own instantiation guarantees.',
      'Theory-based tests ([Theory] with [InlineData]/[MemberData]) let a single test method run against multiple data-driven cases, reducing duplication compared to writing a nearly-identical [Fact] test per input combination.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: '[Fact] & [Theory]', language: 'csharp', code:
`using Xunit;

public class CalculatorTests
{
    private readonly Calculator _calc = new();

    [Fact]
    public void Add_ReturnsSum()
    {
        var result = _calc.Add(2, 3);
        Assert.Equal(5, result);
    }

    [Theory]
    [InlineData(2, 3, 5)]
    [InlineData(-1, 1, 0)]
    [InlineData(0, 0, 0)]
    public void Add_WithVariousInputs_ReturnsCorrectSum(int a, int b, int expected)
    {
        var result = _calc.Add(a, b);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void Divide_ByZero_ThrowsException()
    {
        var ex = Assert.Throws<DivideByZeroException>(() => _calc.Divide(10, 0));
        Assert.Contains("zero", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}` },
    { label: 'IClassFixture', language: 'csharp', code:
`// Shared fixture — created once for the whole class
public class DatabaseFixture : IAsyncLifetime
{
    public TestDatabase Db { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Db = await TestDatabase.StartAsync();
        await Db.SeedAsync();
    }

    public async Task DisposeAsync() => await Db.StopAsync();
}

public class UserRepositoryTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;

    public UserRepositoryTests(DatabaseFixture fixture)
        => _fixture = fixture; // xUnit injects the shared fixture

    [Fact]
    public async Task GetUser_ReturnsSeededUser()
    {
        var repo = new UserRepository(_fixture.Db.Connection);
        var user = await repo.GetByIdAsync(1);
        Assert.NotNull(user);
        Assert.Equal("Alice", user.Name);
    }
}` },
    { label: 'FluentAssertions', language: 'csharp', code:
`using FluentAssertions;

[Fact]
public void Order_ShouldContainAllItems()
{
    var order = new Order();
    order.Add("Widget").Add("Gadget");

    order.Items.Should().HaveCount(2)
               .And.Contain("Widget")
               .And.Contain("Gadget");
}

[Fact]
public async Task FetchUser_ShouldThrow_WhenNotFound()
{
    var svc = new UserService(emptyDb);

    await svc.Invoking(s => s.GetByIdAsync(-1))
             .Should().ThrowAsync<NotFoundException>()
             .WithMessage("*not found*");
}` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Wrong parameter order in Assert.Equal', wrong: 'Assert.Equal(actual, expected)', right: 'Assert.Equal(expected, actual)', explanation: 'xUnit convention is (expected, actual). Getting them backwards gives confusing failure messages like "Expected: 5 but was: 5" when values are swapped.' },
    { title: 'Using IClassFixture for mutable state', wrong: 'IClassFixture<DbFixture> and modifying the DB in tests', right: 'Reset state in constructor or use transactions that roll back', explanation: 'IClassFixture shares ONE instance across all tests. If test A modifies the DB, test B sees dirty data. Either rollback per test or seed read-only data.' },
    { title: 'Ignoring async in Assert.Throws', wrong: 'Assert.Throws<Exception>(async () => await svc.GetAsync())', right: 'await Assert.ThrowsAsync<Exception>(async () => await svc.GetAsync())', explanation: 'Assert.Throws does not await the async delegate — the exception is never observed. Use Assert.ThrowsAsync and await it.' },
    { title: 'Testing private methods directly', wrong: 'var method = typeof(MyClass).GetMethod("privateHelper", ...)', right: 'test via the public API that exercises the private method', explanation: 'Private methods are implementation details. Test them through the public interface — if you cannot, the class may need to be refactored.' },
    { title: 'One [Fact] per class', wrong: 'public class WhenAdding_TwoPositiveNumbers : IDisposable { ... }', right: 'group related facts in one class, one method per scenario', explanation: 'One class per test makes navigation and fixture sharing awkward. Group by the system-under-test class, not by individual scenario.' },
  ];

  challenge: Challenge = {
    title: 'Write xUnit tests for a bank account',
    language: 'typescript',
    description: 'Write xUnit [Fact] and [Theory] tests for a BankAccount class with Deposit(amount) and Withdraw(amount) methods. Test: normal deposit, insufficient funds exception, and parameterised deposit amounts.',
    hints: [
      'Use [Theory][InlineData] for multiple deposit amounts.',
      'Assert.Throws<InsufficientFundsException>(() => account.Withdraw(1000)) when balance is 0.',
    ],
    starterCode:
`// C# — implement the tests
public class BankAccount
{
    public decimal Balance { get; private set; }
    public void Deposit(decimal amount) => Balance += amount;
    public void Withdraw(decimal amount)
    {
        if (amount > Balance) throw new InvalidOperationException("Insufficient funds");
        Balance -= amount;
    }
}

public class BankAccountTests
{
    // Write your [Fact] and [Theory] tests here
}`,
    solution:
`public class BankAccountTests
{
    [Fact]
    public void Deposit_IncreasesBalance()
    {
        var account = new BankAccount();
        account.Deposit(100);
        Assert.Equal(100, account.Balance);
    }

    [Theory]
    [InlineData(50)]
    [InlineData(200)]
    [InlineData(999.99)]
    public void Deposit_WithVariousAmounts_AddsToBalance(decimal amount)
    {
        var account = new BankAccount();
        account.Deposit(amount);
        Assert.Equal(amount, account.Balance);
    }

    [Fact]
    public void Withdraw_InsufficientFunds_ThrowsException()
    {
        var account = new BankAccount();
        Assert.Throws<InvalidOperationException>(() => account.Withdraw(100));
    }

    [Fact]
    public void Withdraw_ReducesBalance()
    {
        var account = new BankAccount();
        account.Deposit(500);
        account.Withdraw(200);
        Assert.Equal(300, account.Balance);
    }
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between [Fact] and [Theory] in xUnit?', options: ['[Fact] is faster; [Theory] is slower', '[Fact] has no parameters; [Theory] runs with multiple data sets via [InlineData]', '[Theory] is the newer replacement for [Fact]', '[Fact] supports async; [Theory] does not'], answer: 1, explanation: '[Fact] is a fixed test with no parameters. [Theory] is parameterised — it runs the same test method once per data row supplied by [InlineData], [MemberData], or [ClassData].' },
    { q: 'What is the correct parameter order for Assert.Equal in xUnit?', options: ['Assert.Equal(actual, expected)', 'Assert.Equal(expected, actual)', 'The order does not matter', 'Assert.Equal(value, tolerance, expected)'], answer: 1, explanation: 'xUnit convention is Assert.Equal(expected, actual). Swapping them produces correct results but confusing failure messages.' },
    { q: 'When should you use IClassFixture<T>?', options: ['Whenever you have more than one test method', 'For expensive, stateless setup shared across all tests in a class (e.g. starting a web host)', 'As a replacement for the class constructor', 'For parameterised test data'], answer: 1, explanation: 'IClassFixture creates one T instance for the whole class and disposes it when done. Use it for expensive setup like starting a server or seeding a database — NOT for mutable state that needs resetting per test.' },
  { q: 'What is xUnit.net and how does it differ from NUnit?', options: ['xUnit is older than NUnit', 'xUnit is a newer framework designed for .NET Core; discourages shared state via constructor injection instead of [SetUp]', 'NUnit is for unit tests, xUnit for integration tests', 'They are identical'], answer: 1, explanation: 'xUnit discourages shared state: each test class gets a fresh instance (constructor = setup). No [SetUp]/[TearDown] — use IDisposable. NUnit and MSTest use attribute-based setup/teardown. xUnit is the recommended framework for .NET Core / modern projects.' },
  { q: 'Can a [Theory] test use [MemberData] to pull test cases from a method that returns data computed at runtime, unlike [InlineData]\'s compile-time constants?', options: ['No, [MemberData] also requires compile-time constant values just like [InlineData]', 'Yes — [MemberData] references a static property or method returning IEnumerable<object[]>, which can compute or load test cases dynamically (from a file, a database fixture, or generated combinations) at test-discovery time', '[MemberData] can only supply a single test case per test method', 'Only [ClassData] supports runtime-computed values, not [MemberData]'], answer: 1, explanation: '[InlineData] values must be compile-time constants (attribute arguments are restricted to constant expressions in C#), which is why it cannot express things like "today\'s date" or "a randomly generated string." [MemberData] sidesteps this by pointing to a static member that returns the actual test case collection, letting that member run arbitrary code to build the data set — the standard escape hatch whenever [InlineData]\'s constant-only restriction is too limiting.' },
  { q: 'How does xUnit handle shared state between tests?', options: ['Via static fields', 'Via IClassFixture<T> for shared expensive setup; ICollectionFixture<T> for cross-class sharing', 'Via [SetUpFixture] attribute', 'xUnit has no shared state mechanism'], answer: 1, explanation: 'IClassFixture<TFixture>: fixture created once for all tests in the class, injected via constructor. ICollectionFixture<TFixture>: shared across multiple test classes decorated with [Collection("name")]. Used for expensive resources like DB containers.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do I run xUnit tests in CI with dotnet CLI?', a: '`dotnet test` discovers and runs all xUnit projects in the solution. Add `--no-build` after a prior `dotnet build` step, and `--logger trx` for test result XML. Use `--filter "Category=Unit"` to run a subset.' },
    { q: 'Should I use xUnit, NUnit, or MSTest?', a: 'xUnit is the most widely adopted in modern .NET — it ships with ASP.NET Core templates and has first-class async support. NUnit is solid and has more built-in assertions. MSTest ships with Visual Studio. Choose xUnit for new projects; stick with what you have for existing ones.' },
    { q: 'How does IAsyncLifetime work?', a: 'Implement IAsyncLifetime on your fixture or test class to get InitializeAsync() (called before the first test) and DisposeAsync() (called after the last test). Essential for async setup like starting Testcontainers or seeding a database.' },
  { q: 'How do you test async code in xUnit?', a: 'Mark test methods as async and return Task: [Fact] public async Task ShouldReturnUser() { var result = await service.GetUserAsync(1); Assert.NotNull(result); Assert.Equal(1, result.Id); }. xUnit awaits the Task and reports failures correctly. Never use .Result or .Wait() — they can deadlock. Use await Assert.ThrowsAsync<Exception>(() => badMethod()) for async exceptions.' },
  { q: 'How do you use [MemberData] or [ClassData] in xUnit theories?', a: '[MemberData]: reference a static IEnumerable<object[]> property: [Theory] [MemberData(nameof(TestCases))] public void Test(int a, int b, int expected). [ClassData]: implement IEnumerable<object[]> in a class: public class TestCases : IEnumerable<object[]> { public IEnumerator<object[]> GetEnumerator() {...} }. Useful for complex test data that cannot fit in [InlineData].' },
  { q: 'How do you skip a test conditionally in xUnit?', a: 'Skip always: [Fact(Skip = "Not implemented yet")]. For environment-specific: [SkippableFact] from the Xunit.SkippableFact package — call Skip.If(condition, reason) inside the test. Tests marked skip show as skipped (not failed) in the runner output.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'xUnit uses [Fact] for fixed tests, [Theory]+[InlineData] for parameterised tests, and IClassFixture for shared expensive setup.',
    mustKnow: [
      '[Fact]: single test, no parameters',
      '[Theory] + [InlineData]: parameterised — runs once per data row',
      'Assert.Equal(expected, actual) — expected first',
      'Assert.Throws<T>(() => ...) for sync; Assert.ThrowsAsync<T> for async',
      'IClassFixture<T>: one shared instance across all tests in the class',
      'IAsyncLifetime: async InitializeAsync / DisposeAsync',
    ],
    interviewFocus: [
      '[Fact] vs [Theory] — purpose and usage',
      'Assert parameter order (expected before actual)',
      'IClassFixture for shared state — and its pitfalls with mutable data',
    ],
  };
}
