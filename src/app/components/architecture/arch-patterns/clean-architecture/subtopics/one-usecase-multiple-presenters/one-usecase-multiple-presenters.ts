import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './one-usecase-multiple-presenters.html',
  styleUrl: './one-usecase-multiple-presenters.scss'
})
export class OneUsecaseMultiplePresentersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names OutputPort but never shows what it looks like',
      points: [
        'The page\'s own QnA on the Use Case layer states: "Use cases receive input via an InputPort interface... and communicate results via an OutputPort interface or return value" — naming OutputPort as an alternative to simply returning a value, but never showing what an OutputPort actually looks like in code, or why you would choose it over a plain return value.',
        'The previous subtopic fixed a controller that was building its own response shape instead of delegating to a presenter. OutputPort is the mechanism that generalizes that fix: instead of a Use Case returning ONE fixed result type that every caller must reshape themselves, the Use Case pushes its result through an OutputPort interface that DIFFERENT presenters can implement differently, for different callers.',
      ]
    },
    {
      heading: 'The concrete problem this solves: one Use Case, genuinely different output formats',
      points: [
        'Consider a single PlaceOrderUseCase that needs to serve THREE different callers: an HTTP REST controller (wants a JSON DTO), a GraphQL resolver (wants a different shape matching the GraphQL schema), and a CLI command (wants a human-readable console string). A plain "return one result object" design forces every caller to reshape that one result itself — duplicating mapping logic in three different adapters, or forcing the Use Case\'s return type to compromise between three different callers\' needs.',
        'With an OutputPort, the Use Case calls a method on an injected OutputPort interface (e.g. outputPort.present(result)) instead of returning a value directly — and each CALLER supplies its own OutputPort implementation (HttpOrderPresenter, GraphQLOrderPresenter, CliOrderPresenter), each producing whatever shape THAT caller actually needs, with zero duplicated logic and zero compromise in the Use Case\'s own contract.',
      ]
    },
    {
      heading: 'When the simpler "just return a value" approach (used elsewhere on this page) is the right call instead',
      points: [
        'The page\'s OWN PlaceOrderUseCase and SendWelcomeEmailUseCase examples both use the simpler "return a value directly" approach, not OutputPort — and that\'s a reasonable choice specifically because each of those Use Cases, as shown, only has ONE real caller/format to serve.',
        'OutputPort earns its extra indirection specifically when a single Use Case genuinely needs to serve multiple, differently-shaped callers — for a Use Case with just one caller, a plain return value is simpler and just as compliant with the Dependency Rule, since the caller can still map the returned value to whatever shape it needs without an extra interface.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'OutputPort — one Use Case, three different presenters',
      language: 'typescript',
      code: `// Domain/OutputPort.ts -- defined in the inner ring, like any
// other interface the Use Case depends on.
interface PlaceOrderOutputPort {
  present(result: PlaceOrderResult): void;
}

// Application/PlaceOrderUseCase.ts -- pushes its result through
// the port instead of returning it directly.
class PlaceOrderUseCase {
  constructor(
    private repo: IOrderRepository,
    private outputPort: PlaceOrderOutputPort,
  ) {}

  async execute(cmd: PlaceOrderCommand): Promise<void> {
    const order = Order.create(cmd.customerId);
    for (const line of cmd.lines) order.addLine(line.productId, line.qty, line.price);
    order.confirm();
    await this.repo.save(order);

    // Instead of "return result;" -- push through the port:
    this.outputPort.present({ orderId: order.id });
  }
}

// THREE different callers, each with their own OutputPort
// implementation -- zero duplicated mapping logic in the Use Case:

class HttpOrderPresenter implements PlaceOrderOutputPort {
  private response: { orderId: string } | null = null;
  present(result: PlaceOrderResult): void {
    this.response = { orderId: result.orderId }; // JSON DTO shape
  }
  toResponse(): Response {
    return Response.json(this.response, { status: 201 });
  }
}

class GraphQLOrderPresenter implements PlaceOrderOutputPort {
  present(result: PlaceOrderResult): void {
    // Shape matching the GraphQL schema's own Order type
  }
}

class CliOrderPresenter implements PlaceOrderOutputPort {
  present(result: PlaceOrderResult): void {
    console.log(\`Order placed: #\${result.orderId}\`); // human-readable
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A single PlaceOrderUseCase needs to serve an HTTP controller (JSON response), a GraphQL resolver (a different shape matching the schema), and a CLI command (a printed confirmation message) -- all from the exact same business logic. The page\'s own PlaceOrderUseCase example returns one fixed result type. What has to change to support all three callers without duplicating mapping logic, and what pattern does this require?',
    hint: 'If the Use Case returns ONE fixed shape, does each of the three callers need its own separate reshaping logic -- and where would that logic have to live?',
    solution: 'The Use Case needs to stop returning a single fixed shape and instead push its result through an OutputPort interface, with each caller supplying its OWN implementation of that interface (an HttpOrderPresenter, a GraphQLOrderPresenter, a CliOrderPresenter). Each presenter shapes the result however that specific caller needs -- a JSON DTO, a GraphQL-schema-matching object, or a printed console string -- without the Use Case itself knowing or caring which one is in use. This is exactly the pattern the page\'s own QnA names ("communicate results via an OutputPort interface") but never shows in code -- it\'s the generalized version of using a single presenter class, extended to support MULTIPLE presenters for the same Use Case.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the page\'s own PlaceOrderUseCase and SendWelcomeEmailUseCase examples both simply return a value rather than using an OutputPort, returning a value directly must be the only pattern Clean Architecture actually recommends -- OutputPort is a rarely-used alternative.',
      reality: 'Per this subtopic\'s theory, both approaches are legitimate and the page\'s own QnA explicitly names OutputPort as a real option ("an OutputPort interface or return value") — a plain return value is simply the right choice for a Use Case with one caller, while OutputPort earns its place specifically when a Use Case needs to serve multiple, differently-shaped callers.'
    },
    {
      thought: 'Supporting multiple output formats (HTTP JSON, GraphQL, CLI text) for the same Use Case requires either duplicating the Use Case\'s business logic per format, or building format-detection logic INTO the Use Case itself.',
      reality: 'Per this subtopic\'s theory, neither is necessary — the OutputPort pattern lets the Use Case stay completely unaware of which format is being requested; each caller supplies its own OutputPort implementation, and the Use Case\'s business logic runs identically regardless of which presenter is injected.'
    },
    {
      thought: 'The OutputPort pattern is a completely separate, unrelated concept from the plain "controller delegates to a presenter class" pattern already shown elsewhere on this page.',
      reality: 'Per this subtopic\'s theory, OutputPort is a generalization of the same idea — instead of the Use Case returning a value that ONE presenter maps afterward, the Use Case pushes its result directly through an interface that DIFFERENT presenters can each implement, extending the single-presenter pattern to support multiple callers with zero duplicated logic.'
    }
  ];
}
