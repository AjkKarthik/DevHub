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
    heading: 'A One-Sentence Recommendation, No Working Type',
    points: [
      'The main page\'s own "How do you handle validation" QnA ends with a specific, concrete recommendation: "Use a Result or Either type to communicate validation failures from use cases without exceptions, allowing the adapter to translate failures to appropriate HTTP error responses." No codeTab on the page ever defines or uses a <code>Result</code> type — the page\'s OWN <code>Order.Create()</code> throws a <code>DomainException</code> for its validation failure instead.',
      'This isn\'t a contradiction so much as an unfinished thought — the page correctly uses exceptions for a DOMAIN INVARIANT violation (an order genuinely cannot exist with zero items; that\'s a programming-error-shaped failure), while the QnA is talking about a DIFFERENT category: an EXPECTED, routine failure (a blocked customer trying to place an order) that the adapter needs to translate into a normal HTTP response, not an unhandled-exception 500.',
    ],
  },
  {
    heading: 'Why Expected Failures Shouldn\'t Be Exceptions',
    points: [
      'Throwing for every validation failure means the CALLER (a controller) has to wrap every use case call in a try/catch to distinguish "the customer is blocked" (an ordinary, expected outcome deserving a 400) from a genuine bug (deserving a 500 and an alert). A <code>Result&lt;T&gt;</code> makes that distinction visible in the METHOD SIGNATURE itself — <code>Task&lt;Result&lt;Guid&gt;&gt;</code> tells the caller "this can fail in an expected way" without needing to read the implementation or catch anything.',
      'The domain-invariant exception (a genuinely impossible state — zero items on an order) and the Result-typed expected failure (a blocked customer, entirely plausible business scenario) are BOTH still valid on the same page — this subtopic adds the SECOND category the QnA promises, it doesn\'t replace the first.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Result Type + Use Case',
    language: 'csharp',
    code: `// A minimal Result type — success carries a value; failure carries
// a reason, with no exception thrown or caught anywhere.
public class Result<T>
{
    public bool    IsSuccess { get; }
    public T?      Value     { get; }
    public string? Error     { get; }

    private Result(bool isSuccess, T? value, string? error)
    {
        IsSuccess = isSuccess; Value = value; Error = error;
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}

// The use case now returns Result<Guid> — its signature alone tells
// the caller this can fail in an EXPECTED way, no try/catch needed.
public class PlaceOrderHandler(IOrderRepository orders, IUnitOfWork uow, ICustomerRepository customers)
    : IRequestHandler<PlaceOrderCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var customer = await customers.GetByIdAsync(cmd.CustomerId, ct);
        if (customer is null)
            return Result<Guid>.Failure("Customer not found");

        if (customer.IsBlocked)
            return Result<Guid>.Failure("Blocked customers cannot place orders");

        // A genuine domain invariant (zero items) STILL throws --
        // that's a programming error, not an expected business outcome.
        var items = cmd.Items.Select(i => new OrderItem(i.ProductId, i.Qty, i.Price)).ToList();
        var order = Order.Create(cmd.CustomerId, items);   // throws DomainException if items is empty

        await orders.AddAsync(order, ct);
        await uow.SaveChangesAsync(ct);
        return Result<Guid>.Success(order.Id);
    }
}

// The controller (adapter) translates the Result into an HTTP response —
// exactly the "adapter translates failures to appropriate HTTP error
// responses" behaviour the QnA describes.
[ApiController, Route("api/orders")]
public class OrdersController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Place(PlaceOrderRequest req)
    {
        var result = await mediator.Send(new PlaceOrderCommand(req.CustomerId, req.Items));
        return result.IsSuccess
            ? Ok(new { orderId = result.Value })
            : BadRequest(new { error = result.Error });
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A customer that does NOT exist places an order with zero items. Trace <code>PlaceOrderHandler.Handle()</code> for this input: does it return a <code>Result&lt;Guid&gt;.Failure(...)</code>, or does it throw a <code>DomainException</code>?',
  hint: 'Check the ORDER the two checks run in — which one is reached first for a customer that doesn\'t exist at all.',
  solution: `// It returns Result<Guid>.Failure("Customer not found") -- the
// FIRST check (customer is null) short-circuits the method before
// the empty-items check is ever reached at all. Order.Create() --
// and its DomainException -- never runs for this input, because
// the method already returned on the customer-not-found branch.

// This matters as a general lesson: only ONE failure reason is ever
// reported per call, whichever check fails FIRST -- a caller
// debugging "why did my order fail?" only ever sees the earliest
// applicable reason, not every rule the input happens to violate.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Introducing <code>Result&lt;T&gt;</code> means <code>DomainException</code> is now the wrong approach and should be removed from the codebase.',
    reality: 'They serve genuinely different failure categories, and the codeTab above keeps BOTH deliberately: <code>Result&lt;T&gt;</code> is for EXPECTED business outcomes the caller needs to branch on explicitly (a blocked customer — a normal, anticipated case). <code>DomainException</code> stays for genuine INVARIANT VIOLATIONS — states that should be structurally impossible if the rest of the code is correct (an order with zero items should never even be attempted by well-behaved calling code). Conflating the two would either force ordinary business outcomes through exception handling (slow, and easy to accidentally swallow) or make genuine bugs silently return a "failure" result indistinguishable from an expected one.',
  },
  {
    thought: 'The Result type\'s job is done once <code>Handle()</code> returns it — from there it\'s just a data object like any other.',
    reality: 'Its real value is in the CALLER\'S code, not the use case\'s: because the method signature is <code>Task&lt;Result&lt;Guid&gt;&gt;</code> rather than plain <code>Task&lt;Guid&gt;</code>, the controller is STRUCTURALLY reminded (by the type itself, without reading the implementation) that this call can fail in a way that needs handling — <code>result.IsSuccess</code> has to be checked before <code>result.Value</code> can be trusted, the same discipline a checked-exception language enforces at compile time, just expressed through the return type instead of the throws clause.',
  },
];

@Component({
  selector: 'app-dp-ca-result',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './returning-a-result-type-instead-of-throwing.html',
  styleUrl: './returning-a-result-type-instead-of-throwing.scss',
})
export class ReturningAResultTypeInsteadOfThrowingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
