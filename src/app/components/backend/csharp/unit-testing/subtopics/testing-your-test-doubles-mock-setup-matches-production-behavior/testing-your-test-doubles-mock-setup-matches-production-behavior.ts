import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-your-test-doubles-mock-setup-matches-production-behavior-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-your-test-doubles-mock-setup-matches-production-behavior.html',
  styleUrl: './testing-your-test-doubles-mock-setup-matches-production-behavior.scss',
})
export class TestingYourTestDoublesMockSetupMatchesProductionBehaviorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows HOW to create a Mock<T> — this subtopic asks a question it never raises: how do you know the mock still tells the truth?',
      points: [
        'The main Unit Testing page\'s <code>Mock&lt;IUserRepo&gt;()</code> examples configure a stub to return canned data via <code>.Setup(...).Returns(...)</code>. This works perfectly UNTIL the real <code>IUserRepo</code> implementation\'s actual behavior drifts away from what the mock assumes — e.g. the real repository starts throwing a new exception type, or its method signature\'s semantics subtly change — and every test using the mock keeps passing, completely unaware production behavior no longer matches what the tests believe it to be.',
      ],
    },
    {
      heading: 'This is the well-known "mocks lie" problem — tests can pass while the system is genuinely broken',
      points: [
        'A suite of unit tests using mocked dependencies proves ONLY that the code under test behaves correctly GIVEN the assumptions baked into the mock setups — it proves NOTHING about whether those assumptions still hold true against the REAL dependency. If the real <code>IUserRepo.FindAsync</code> starts returning <code>null</code> for a case the mock always stubs as a found user, every unit test stays green while the actual application throws a <code>NullReferenceException</code> in production.',
        'This gap is exactly what the main page\'s own testing-pyramid guidance (a FEW integration/E2E tests alongside many unit tests) exists to catch — but a more targeted, cheaper technique exists specifically for verifying mock ASSUMPTIONS stay valid, without needing a full integration test suite.',
      ],
    },
    {
      heading: 'Contract tests: run the SAME test logic against both the mock\'s assumed behavior and the real implementation',
      points: [
        'A "contract test" (or "consumer-driven contract" in its fuller form) asserts a SHARED set of expectations against BOTH the real implementation AND however you\'ve set up the mock to behave — e.g. "calling <code>FindAsync</code> with an unknown ID returns <code>null</code>, never throws" is checked once against the REAL repository (perhaps via a lightweight in-memory or test-database implementation) and CONFIRMS the mock setups elsewhere in the suite are assuming the same, currently-true behavior.',
        'This does not require abandoning mocks for everyday unit tests — it means maintaining a SMALL, focused set of contract tests specifically anchored to the interface boundary, so that a drift between "what the mock assumes" and "what the real thing actually does" gets caught quickly, in ONE place, rather than silently rotting across dozens of unit tests that all share the same wrong assumption.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The gap — every unit test passes, but the mock\'s assumption has quietly gone stale',
      language: 'csharp',
      code: `public interface IUserRepo
{
    Task<User?> FindAsync(int id);
}

// Unit test — using the main page's own Moq pattern:
public class UserServiceTests
{
    [Fact]
    public async Task GetDisplayName_UserExists_ReturnsName()
    {
        var mockRepo = new Mock<IUserRepo>();
        mockRepo.Setup(r => r.FindAsync(1))
                .ReturnsAsync(new User(1, "Alice")); // ASSUMES FindAsync
                                                       // returns a User,
                                                       // never throws

        var service = new UserService(mockRepo.Object);
        var name = await service.GetDisplayNameAsync(1);

        Assert.Equal("Alice", name); // PASSES — but only proves the
                                     // SERVICE handles this ASSUMED
                                     // shape correctly, nothing about
                                     // whether the assumption itself
                                     // is still true in production
    }
}

// If the REAL SqlUserRepo.FindAsync is later changed to THROW a
// SqlException for a transient connection issue instead of ever
// returning null gracefully — this unit test keeps passing forever,
// completely blind to that real, production-breaking change.`,
    },
    {
      label: 'A contract test — anchoring the mock\'s assumption to the real implementation',
      language: 'csharp',
      code: `// A shared, reusable set of expectations BOTH the real implementation
// and the mock's setup are expected to satisfy:
public abstract class UserRepoContractTests
{
    protected abstract IUserRepo CreateRepo(); // real or in-memory —
                                                 // provided by each
                                                 // concrete test class

    [Fact]
    public async Task FindAsync_UnknownId_ReturnsNullNeverThrows()
    {
        var repo = CreateRepo();

        // This SAME assertion runs against whatever CreateRepo()
        // provides — proving the "returns null for unknown IDs, never
        // throws" behavior the main test suite's mocks assume is
        // ACTUALLY true wherever it matters:
        var result = await repo.FindAsync(int.MaxValue); // definitely unknown
        Assert.Null(result);
    }
}

// Run against the REAL repository (an integration test, but scoped
// tightly to just this one contract, not the whole application):
public class SqlUserRepoContractTests : UserRepoContractTests
{
    protected override IUserRepo CreateRepo() => new SqlUserRepo(TestConnectionString);
}

// Run against an in-memory fake used elsewhere in fast unit tests —
// proving the FAKE also honors the SAME contract the real repo does:
public class InMemoryUserRepoContractTests : UserRepoContractTests
{
    protected override IUserRepo CreateRepo() => new InMemoryUserRepo();
}`,
    },
    {
      label: 'Catching drift the moment it happens — a concrete before/after',
      language: 'csharp',
      code: `// BEFORE: real SqlUserRepo genuinely returns null for unknown IDs —
// the contract test (run against SqlUserRepo) PASSES, confirming every
// mock elsewhere in the suite that assumes "FindAsync returns null for
// unknown IDs" is safe to rely on.

public class SqlUserRepo : IUserRepo
{
    public async Task<User?> FindAsync(int id)
    {
        var row = await _db.QuerySingleOrDefaultAsync(...);
        return row is null ? null : new User(row.Id, row.Name);
    }
}

// AFTER a well-intentioned "improvement" — someone adds strict
// validation that THROWS instead of returning null:
public class SqlUserRepoChanged : IUserRepo
{
    public async Task<User?> FindAsync(int id)
    {
        var row = await _db.QuerySingleOrDefaultAsync(...);
        if (row is null)
            throw new UserNotFoundException(id); // BEHAVIOR CHANGED —
                                                  // no longer returns
                                                  // null at all
        return new User(row.Id, row.Name);
    }
}

// SqlUserRepoContractTests.FindAsync_UnknownId_ReturnsNullNeverThrows
// NOW FAILS IMMEDIATELY — catching the drift in ONE targeted place,
// rather than leaving dozens of unrelated unit tests silently
// asserting against a stale, no-longer-true assumption about
// FindAsync's behavior.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a contract test proving that BOTH a real <code>IEmailSender</code> implementation and any test double used to stand in for it agree that calling <code>SendAsync</code> with an empty recipient address throws <code>ArgumentException</code> (not some other exception type, and not silently succeeding).',
    hint: 'Follow the same abstract-base-class pattern — an abstract UserRepoContractTests-style class with a CreateSender() method each concrete subclass overrides, one for the real sender and one for an in-memory fake.',
    solution: `public interface IEmailSender
{
    Task SendAsync(string toAddress, string subject, string body);
}

public abstract class EmailSenderContractTests
{
    protected abstract IEmailSender CreateSender();

    [Fact]
    public async Task SendAsync_EmptyRecipient_ThrowsArgumentException()
    {
        var sender = CreateSender();

        // This SAME assertion runs against whatever concrete
        // implementation CreateSender() provides — proving BOTH the
        // real sender AND any fake used in unit tests genuinely agree
        // on this specific contract:
        await Assert.ThrowsAsync<ArgumentException>(() =>
            sender.SendAsync("", "Subject", "Body"));
    }
}

// Against the real implementation:
public class SmtpEmailSenderContractTests : EmailSenderContractTests
{
    protected override IEmailSender CreateSender() => new SmtpEmailSender(TestSmtpConfig);
}

// Against the in-memory fake used throughout the rest of the unit
// test suite — proving IT also honors the same contract:
public class InMemoryEmailSenderContractTests : EmailSenderContractTests
{
    protected override IEmailSender CreateSender() => new InMemoryEmailSender();
}

// If either implementation's actual behavior ever drifts from this
// shared contract, its own dedicated contract test fails immediately —
// rather than the drift silently going unnoticed across every unit
// test that mocks IEmailSender elsewhere in the codebase.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a passing suite of unit tests using mocked dependencies proves the whole system genuinely works correctly.',
      reality: 'it only proves the code under test behaves correctly GIVEN the assumptions baked into the mock setups — it says nothing about whether those assumptions still match the real dependency\'s actual current behavior.',
    },
    {
      thought: 'the only way to catch drift between mocked and real dependency behavior is a full integration or end-to-end test suite.',
      reality: 'a small, targeted set of "contract tests" — the same shared assertions run against both the real implementation and any fakes/mocks used elsewhere — catches this specific drift cheaply, without needing the cost of full integration testing everywhere.',
    },
    {
      thought: 'if a mock and the real implementation both satisfy the SAME interface, they are automatically guaranteed to behave the same way for callers.',
      reality: 'an interface only constrains method SIGNATURES, not BEHAVIOR — two implementations can both compile against IUserRepo while disagreeing completely on what happens for an unknown ID (null vs exception), and nothing about the interface itself catches that mismatch.',
    },
  ];
}
