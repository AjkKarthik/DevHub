import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-polymorphic-code-mocking-interfaces-and-verifying-virtual-dispatch-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-polymorphic-code-mocking-interfaces-and-verifying-virtual-dispatch.html',
  styleUrl: './testing-polymorphic-code-mocking-interfaces-and-verifying-virtual-dispatch.scss',
})
export class TestingPolymorphicCodeMockingInterfacesAndVerifyingVirtualDispatchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s payoff, never actually demonstrated',
      points: [
        'The main OOP page repeatedly states that coding against interfaces makes classes "testable, swappable" and that <code>OrderService(IRepository&lt;Order&gt; repo, IEmailSender email)</code> is "easy to test, swap, and evolve independently" — but never shows an actual test. This subtopic writes the test the main page promises is possible.',
      ],
    },
    {
      heading: 'Mocking an interface with Moq — no real dependency needed',
      points: [
        '<code>Moq</code> (the most widely used .NET mocking library) generates a fake implementation of an INTERFACE at runtime: <code>var mockRepo = new Mock&lt;IRepository&lt;Order&gt;&gt;();</code> creates an object satisfying <code>IRepository&lt;Order&gt;</code>\'s contract, with every method returning a default value until configured.',
        '<code>mockRepo.Setup(r =&gt; r.GetByIdAsync(42, It.IsAny&lt;CancellationToken&gt;())).ReturnsAsync(someOrder);</code> configures the mock: WHEN <code>GetByIdAsync(42, ...)</code> is called, return <code>someOrder</code> instead of hitting a real database — this is precisely what interface-based design (the main topic\'s core argument) makes possible: <code>OrderService</code> never knows whether it received a real <code>SqlOrderRepository</code> or this fake.',
        'This is ONLY possible because <code>OrderService</code>\'s constructor accepts <code>IRepository&lt;Order&gt;</code> (the interface), not <code>SqlOrderRepository</code> (the concrete class) — the main topic\'s "Prefer composition, code against interfaces" advice is not just a style preference, it is the SPECIFIC mechanism that makes this test possible at all. A constructor typed to the concrete class could not be mocked this way.',
      ],
    },
    {
      heading: 'Verifying INTERACTIONS, not just return values',
      points: [
        'Beyond configuring return values, mocks let you ASSERT that a method was actually called: <code>mockEmail.Verify(e =&gt; e.SendAsync(order.CustomerEmail, "Order confirmed", It.IsAny&lt;string&gt;()), Times.Once);</code> — this proves <code>OrderService.PlaceOrderAsync()</code> genuinely sent a confirmation email, a behavior with no return value to assert on directly (the main topic\'s <code>IEmailSender.SendAsync</code> returns <code>Task</code>, not data).',
        '<code>Times.Once</code>, <code>Times.Never</code>, and <code>Times.Exactly(n)</code> catch a real class of bug that a return-value-only test misses entirely: a method that gets called TWICE by accident (e.g. a duplicate email sent due to a retry-loop bug) passes a test that only checks "was SendAsync eventually called" but FAILS a <code>Times.Once</code> verification.',
      ],
    },
    {
      heading: 'Testing polymorphic dispatch directly — no mocking needed',
      points: [
        'Verifying that <code>override</code> ACTUALLY dispatches polymorphically (vs a <code>new</code>-hiding bug, covered as a Common Mistake on the main page) needs no mocking library at all — it is a plain assertion against REAL objects: <code>Animal a = new Dog(); Assert.Equal("Woof!", a.Speak());</code> — if <code>Dog.Speak()</code> were accidentally declared with <code>new</code> instead of <code>override</code>, this exact test would fail (asserting <code>"..."</code> was returned instead of <code>"Woof!"</code>), catching the CS0114-warning-only mistake as a hard test failure instead of an easily-ignored compiler warning.',
        'This is a genuinely useful REGRESSION test pattern: write ONE test per virtual member that asserts dispatch through the BASE-TYPED reference specifically (<code>Animal a = new Dog()</code>, not <code>Dog d = new Dog()</code>) — a test using the derived type directly would pass even with the <code>new</code>-hiding bug, since C# resolves <code>Dog.Speak()</code> correctly when called through a <code>Dog</code>-typed variable; the bug ONLY manifests through a base-typed reference, so the test must use one to actually catch it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Mocking a dependency with Moq',
      language: 'csharp',
      code: `using Moq;
using Xunit;

public class OrderServiceTests
{
    [Fact]
    public async Task PlaceOrderAsync_AddsOrderAndSendsConfirmationEmail()
    {
        // Arrange — fake implementations of the INTERFACES OrderService depends on
        var mockRepo  = new Mock<IRepository<Order>>();
        var mockEmail = new Mock<IEmailSender>();

        var order = new Order { Id = 42, CustomerEmail = "alice@example.com" };
        var service = new OrderService(mockRepo.Object, mockEmail.Object);

        // Act
        await service.PlaceOrderAsync(order);

        // Assert — verify the INTERACTION happened, no real DB or SMTP server involved
        mockRepo.Verify(r => r.AddAsync(order, It.IsAny<CancellationToken>()), Times.Once);
        mockEmail.Verify(
            e => e.SendAsync("alice@example.com", "Order confirmed", It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task PlaceOrderAsync_SendsExactlyOneEmail_NotTwice()
    {
        // Times.Once catches a duplicate-send bug that a "was it called" check misses.
        var mockRepo  = new Mock<IRepository<Order>>();
        var mockEmail = new Mock<IEmailSender>();
        var service   = new OrderService(mockRepo.Object, mockEmail.Object);

        await service.PlaceOrderAsync(new Order { Id = 1, CustomerEmail = "bob@example.com" });

        mockEmail.Verify(
            e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Once); // fails if PlaceOrderAsync accidentally sends twice
    }
}`,
    },
    {
      label: 'Configuring return values',
      language: 'csharp',
      code: `[Fact]
public async Task GetOrderSummary_ReturnsFormattedSummary_ForExistingOrder()
{
    var mockRepo = new Mock<IRepository<Order>>();

    // Setup: WHEN GetByIdAsync(42, ...) is called, RETURN this specific order —
    // no real database involved, deterministic every test run.
    mockRepo
        .Setup(r => r.GetByIdAsync(42, It.IsAny<CancellationToken>()))
        .ReturnsAsync(new Order { Id = 42, CustomerEmail = "alice@example.com" });

    var reportService = new OrderReportService(mockRepo.Object);

    string summary = await reportService.GetOrderSummaryAsync(42);

    Assert.Contains("alice@example.com", summary);
}

[Fact]
public async Task GetOrderSummary_ReturnsNotFoundMessage_ForMissingOrder()
{
    var mockRepo = new Mock<IRepository<Order>>();

    // A DIFFERENT setup — GetByIdAsync(999, ...) returns null, simulating "not found"
    // without needing a real empty database to test the missing-order code path.
    mockRepo
        .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
        .ReturnsAsync((Order?)null);

    var reportService = new OrderReportService(mockRepo.Object);

    string summary = await reportService.GetOrderSummaryAsync(999);

    Assert.Equal("Order not found", summary);
}`,
    },
    {
      label: 'Testing override vs new dispatch directly',
      language: 'csharp',
      code: `public class Animal
{
    public virtual  string Speak()    => "...";
    public          string Identify() => "Animal";
}

public class Dog : Animal
{
    public override string Speak()    => "Woof!";  // polymorphic — correct
    public new      string Identify() => "Dog";     // hides — the main topic's warned-against mistake
}

public class PolymorphismTests
{
    [Fact]
    public void Speak_DispatchesToDerivedOverride_ThroughBaseTypedReference()
    {
        // The base-typed reference is ESSENTIAL to this test — it's the only
        // way to actually exercise the override-vs-new distinction.
        Animal a = new Dog();

        Assert.Equal("Woof!", a.Speak()); // override — dispatches to Dog's version
    }

    [Fact]
    public void Identify_DoesNotDispatchThroughNew_ThroughBaseTypedReference()
    {
        // This test documents (and locks in) the 'new' hiding behavior explicitly —
        // if Identify() were ever changed from 'new' to 'override', THIS assertion
        // would need to change too, making the polymorphism change visible in review.
        Animal a = new Dog();

        Assert.Equal("Animal", a.Identify()); // new — does NOT dispatch to Dog's version
    }

    [Fact]
    public void Identify_ReturnsDog_WhenCalledThroughDerivedTypedReference()
    {
        // Contrast: through a Dog-typed reference, Identify() DOES resolve to
        // Dog's version — proving the bug is specifically about base-typed dispatch.
        Dog d = new Dog();

        Assert.Equal("Dog", d.Identify());
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving that <code>OrderService.PlaceOrderAsync()</code> does NOT send a confirmation email if <code>repo.AddAsync()</code> throws an exception — i.e. the email send should only happen after a successful save, not unconditionally.',
    hint: 'Configure mockRepo.Setup(r => r.AddAsync(...)).ThrowsAsync(new Exception("DB error")). Wrap the call to service.PlaceOrderAsync(order) in an Assert.ThrowsAsync<Exception>(...) (or a try/catch), then verify mockEmail.Verify(..., Times.Never) afterward.',
    solution: `[Fact]
public async Task PlaceOrderAsync_DoesNotSendEmail_WhenSaveFails()
{
    var mockRepo  = new Mock<IRepository<Order>>();
    var mockEmail = new Mock<IEmailSender>();

    // Simulate a database failure on save
    mockRepo
        .Setup(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
        .ThrowsAsync(new Exception("DB error"));

    var service = new OrderService(mockRepo.Object, mockEmail.Object);
    var order = new Order { Id = 1, CustomerEmail = "carol@example.com" };

    await Assert.ThrowsAsync<Exception>(() => service.PlaceOrderAsync(order));

    // The email should never have been sent — proves the ordering/error-handling
    // logic in PlaceOrderAsync is correct, not just that AddAsync was attempted.
    mockEmail.Verify(
        e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
        Times.Never);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'coding against interfaces (as the main topic recommends) is primarily a stylistic/architectural preference with vague long-term maintainability benefits.',
      reality: 'it is the SPECIFIC mechanism that makes mocking possible in a unit test — a constructor parameter typed to a concrete class (SqlOrderRepository) cannot be swapped for a test double the way one typed to an interface (IRepository&lt;Order&gt;) can.',
    },
    {
      thought: 'a test that verifies a mocked method returns the expected value is sufficient to test a service\'s behavior.',
      reality: 'many important behaviors (sending an email, logging, saving) have no return value to assert on — Times.Once / Times.Never verification proves an INTERACTION actually happened (or didn\'t), catching bugs like a duplicate email send that a return-value-only test would miss entirely.',
    },
    {
      thought: 'a test like <code>Dog d = new Dog(); Assert.Equal("Dog", d.Identify())</code> is sufficient to catch an accidental override-vs-new mistake.',
      reality: 'the override-vs-new bug ONLY manifests when called through a BASE-typed reference (Animal a = new Dog()) — a test using the derived type directly resolves correctly either way and would not catch the regression the main topic\'s Common Mistakes section warns about.',
    },
  ];
}
