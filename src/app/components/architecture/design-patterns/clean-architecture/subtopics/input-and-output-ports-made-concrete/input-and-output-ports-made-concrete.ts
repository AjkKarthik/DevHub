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
    heading: 'A Quiz Question With No Matching Code',
    points: [
      'One of the main page\'s own quiz questions defines Input and Output Ports precisely: "Input Ports... interfaces defining the use cases that external actors... can trigger... Output Ports... interfaces defining what the application needs from infrastructure." No codeTab on the page ever declares an explicit port interface — the main page\'s own <code>PlaceOrderHandler</code> is a plain MediatR <code>IRequestHandler&lt;TCommand, TResult&gt;</code>, which works, but never names an "InputPort"/"OutputPort" the way the quiz\'s own vocabulary describes.',
      'MediatR\'s <code>IRequestHandler&lt;TCommand, TResult&gt;</code> IS effectively an Input Port already — it\'s the interface an "external actor" (the controller) uses to trigger the use case — but the RETURN VALUE (<code>Guid</code>) is a plain synchronous result, not the separate, explicit Output Port interface the quiz describes for cases where the use case needs to hand its result to something more flexible than a method return.',
    ],
  },
  {
    heading: 'Why an Explicit OutputPort Earns Its Keep',
    points: [
      'A plain return value works fine when there is exactly ONE way the caller wants the result shaped. An explicit <code>IOutputPort</code> the use case calls INTO (rather than a value it returns) lets the SAME use case serve multiple different callers — an HTTP controller, a GraphQL resolver, a CLI command — each with its OWN output port implementation shaping the result differently, without the use case itself knowing or caring which one is listening.',
      'This directly extends this hub\'s own CQRS topic\'s "Syncing a Read Model Projection" subtopic — MediatR\'s <code>Publish()</code>/<code>INotificationHandler&lt;T&gt;</code> is ONE way to get fan-out; an explicit output-port interface, called directly (not through a message bus), is a simpler, synchronous alternative for a use case that needs to hand its result to exactly one caller-supplied presenter per invocation.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Explicit Input/Output Ports',
    language: 'csharp',
    code: `// Input Port -- the interface EXTERNAL ACTORS (controllers, CLI,
// a message consumer) use to trigger this use case. Plain data in,
// nothing returned directly -- the result goes out through the
// Output Port instead.
public interface IPlaceOrderInputPort
{
    Task ExecuteAsync(PlaceOrderRequest request, CancellationToken ct = default);
}

public record PlaceOrderRequest(Guid CustomerId, List<OrderItemDto> Items);

// Output Port -- what the USE CASE calls INTO once it has a result.
// The use case only knows this interface -- never which concrete
// presenter is actually listening.
public interface IPlaceOrderOutputPort
{
    void Ok(Guid orderId);
    void Invalid(string reason);
}

// The Use Case itself -- implements the Input Port, depends only on
// the Output Port and Domain-layer interfaces.
public class PlaceOrderUseCase(IOrderRepository orders, IUnitOfWork uow, IPlaceOrderOutputPort output)
    : IPlaceOrderInputPort
{
    public async Task ExecuteAsync(PlaceOrderRequest request, CancellationToken ct)
    {
        if (request.Items.Count == 0)
        {
            output.Invalid("Order must have at least one item");
            return;
        }

        var items = request.Items.Select(i => new OrderItem(i.ProductId, i.Qty, i.Price)).ToList();
        var order = Order.Create(request.CustomerId, items);
        await orders.AddAsync(order, ct);
        await uow.SaveChangesAsync(ct);

        output.Ok(order.Id);   // hands the result to WHATEVER output port was injected
    }
}

// ── Two different Output Port implementations, same Use Case ──────

// HTTP controller's own presenter -- shapes the result as an HTTP response.
public class HttpPlaceOrderPresenter : IPlaceOrderOutputPort
{
    public IActionResult? Response { get; private set; }
    public void Ok(Guid orderId) => Response = new OkObjectResult(new { orderId });
    public void Invalid(string reason) => Response = new BadRequestObjectResult(new { error = reason });
}

// CLI command's own presenter -- shapes the SAME use case's result for a console.
public class CliPlaceOrderPresenter : IPlaceOrderOutputPort
{
    public void Ok(Guid orderId) => Console.WriteLine($"Order placed: {orderId}");
    public void Invalid(string reason) => Console.WriteLine($"Failed: {reason}");
}

// Controller -- registers ITS OWN presenter as the output port for this request.
[ApiController, Route("api/orders")]
public class OrdersController(IOrderRepository orders, IUnitOfWork uow) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Place(PlaceOrderRequest request, CancellationToken ct)
    {
        var presenter = new HttpPlaceOrderPresenter();
        var useCase   = new PlaceOrderUseCase(orders, uow, presenter);
        await useCase.ExecuteAsync(request, ct);
        return presenter.Response!;
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Someone adds a THIRD caller — a background job that places orders from a scheduled import file and needs to log successes/failures instead of returning HTTP responses or printing to a console. What does adding this caller require changing in <code>PlaceOrderUseCase</code> itself?',
  hint: 'Check what <code>PlaceOrderUseCase</code>\'s own constructor and <code>ExecuteAsync</code> body actually depend on.',
  solution: `// Nothing in PlaceOrderUseCase needs to change at all -- only a
// THIRD IPlaceOrderOutputPort implementation needs to be written:

public class ImportJobPlaceOrderPresenter(ILogger logger) : IPlaceOrderOutputPort
{
    public void Ok(Guid orderId) => logger.LogInformation("Imported order {OrderId}", orderId);
    public void Invalid(string reason) => logger.LogWarning("Import failed: {Reason}", reason);
}

// This is the whole point of the Output Port: PlaceOrderUseCase's
// own logic (validate, create the order, save it) is completely
// unaware of HTTP, the console, or logging -- it only ever calls
// output.Ok(...)/output.Invalid(...). Every new caller just supplies
// its own small presenter class; the use case itself stays exactly
// as it was written for the first caller.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'This is just the Observer pattern with extra naming — an Output Port is basically the same idea as MediatR\'s <code>INotificationHandler&lt;T&gt;</code> from the CQRS topic\'s own projection subtopic.',
    reality: 'They solve a similar SHAPE of problem (letting one operation\'s result reach code that doesn\'t know about it directly) but differ in an important way: <code>Publish()</code>/<code>INotificationHandler&lt;T&gt;</code> can fan out to MANY independent, decoupled subscribers with no caller-specific wiring — useful for "notify whoever happens to be listening." An Output Port is deliberately ONE-TO-ONE per invocation — the CALLER explicitly supplies exactly which presenter should receive THIS particular call\'s result, which is what lets three different callers each get their own differently-shaped response from the identical use case logic.',
  },
  {
    thought: 'Since the Output Port pattern adds an interface and a presenter class for every caller, it is strictly more code than just having the use case return a value directly — not worth it unless there are already multiple callers.',
    reality: 'That trade-off assessment is exactly right, and it matches the main page\'s OWN "when is Clean Architecture over-engineering" QnA: introducing an explicit Output Port for a use case with exactly one caller (like the main page\'s own MediatR-based <code>PlaceOrderHandler</code>, which only the API controller ever calls) is legitimate extra ceremony without benefit. It earns its keep specifically once — or because you anticipate — MULTIPLE genuinely different callers need the SAME use case logic shaped differently, which is precisely the scenario this subtopic\'s own Try It walks through.',
  },
];

@Component({
  selector: 'app-dp-ca-ports',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './input-and-output-ports-made-concrete.html',
  styleUrl: './input-and-output-ports-made-concrete.scss',
})
export class InputAndOutputPortsMadeConcreteSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
