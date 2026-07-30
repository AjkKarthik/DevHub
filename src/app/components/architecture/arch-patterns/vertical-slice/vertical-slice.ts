import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-arch-vertical-slice',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './vertical-slice.html',
  styleUrl: './vertical-slice.scss',
})
export class ArchVerticalSlice {

  quickRef: QuickRefItem[] = [
    { name: 'Slice', type: 'keyword', desc: 'A feature folder containing ALL code for one use case (command + handler + validator + DTO + test)' },
    { name: 'Feature Folder', type: 'keyword', desc: 'Organise by feature (PlaceOrder/) not by layer (Controllers/, Services/)' },
    { name: 'MediatR', type: 'keyword', desc: 'In-process mediator that dispatches commands/queries to their handlers' },
    { name: 'Minimal Coupling', type: 'keyword', desc: 'Slices communicate only via the mediator or shared domain events — never direct calls' },
    { name: 'CQRS Lite', type: 'keyword', desc: 'Commands mutate state; queries return projections — enforced naturally per-slice' },
    { name: 'Shared Kernel', type: 'keyword', desc: 'Small folder for truly shared code: base types, common validators, infrastructure wiring' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Organise by Feature, Not by Layer',
      points: [
        'Traditional layered architecture organises code horizontally: Controllers/, Services/, Repositories/.',
        'Adding a feature touches every layer and folder — a "shotgun surgery" problem.',
        'Vertical Slice organises code vertically: Features/Orders/PlaceOrder/ contains everything for that use case.',
        'A new feature is self-contained in one folder. A deleted feature is one folder delete.',
      ],
    },
    {
      heading: 'The Slice Anatomy',
      points: [
        'Each slice contains: Command or Query class, Handler, Validator, Response DTO, and its own tests.',
        'Slices do NOT share service classes. Two features that both need to send email each have their own sending logic (or call a shared utility).',
        'This looks like duplication but is actually isolation — each slice evolves independently without breaking the other.',
        'MediatR (or a similar in-process mediator) dispatches commands to their handlers, decoupling callers from implementations.',
      ],
    },
    {
      heading: 'Shared Kernel and Cross-Slice Communication',
      points: [
        'Shared/Domain: base entity, value objects, domain events — used across slices.',
        'Shared/Infrastructure: DbContext, email client — injected into handlers.',
        'Slices should NOT call each other directly. If PlaceOrder needs Inventory, it calls the Inventory service via the mediator or a domain event.',
        'Direct cross-slice calls create the same coupling as cross-layer calls in traditional layered architecture.',
      ],
    },
    {
      heading: 'Organizing Code by Feature Instead of by Technical Layer',
      points: [
        'Vertical slice architecture groups all the code needed for a single feature or use case (the API endpoint, the business logic, the data access) together in one place, rather than scattering that same feature\'s code horizontally across separate Controllers, Services, and Repositories folders.',
        'This feature-based organization means understanding or modifying a single feature typically requires touching files in ONE location, rather than navigating across multiple horizontal layers, each of which likely contains code for many unrelated features intermixed together.',
        'Vertical slices reduce the risk of accidental coupling between unrelated features — since each feature\'s code is self-contained, there is less temptation to reach for and reuse a "shared" service class that inadvertently couples two otherwise-unrelated features together.',
        'Some duplication across slices (similar-looking validation or mapping logic repeated in multiple features) is an accepted tradeoff of this approach — the pattern favors feature independence and clarity over eliminating every instance of code similarity through shared abstraction.',
      ],
    },
    {
      heading: 'Vertical Slices and the CQRS/Mediator Pattern Combination',
      points: [
        'Vertical slice architecture pairs naturally with CQRS and a mediator pattern (like MediatR in .NET) — each feature becomes a single Command or Query handler class, giving every feature slice a consistent, predictable shape regardless of what the feature actually does internally.',
        'This combination makes it trivial to add cross-cutting behavior (logging, validation, caching) via mediator pipeline behaviors that wrap every handler uniformly, without needing to modify each individual feature\'s code to add that cross-cutting concern.',
        'Testing a vertical slice in isolation is straightforward — since each feature is a self-contained handler with clear inputs and outputs, testing one feature does not require understanding or mocking a complex web of shared service dependencies the way a traditionally layered application often does.',
        'This pattern is not mutually exclusive with Clean Architecture or DDD — many production systems combine vertical slices for feature organization with Clean Architecture\'s dependency-inversion principles applied within each individual slice, taking benefits from both approaches simultaneously.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Feature Folder Structure',
      language: 'bash',
      code: `src/
  Features/
    Orders/
      PlaceOrder/
        PlaceOrderCommand.ts
        PlaceOrderHandler.ts
        PlaceOrderValidator.ts
        PlaceOrderResponse.ts
        PlaceOrder.test.ts      # tests co-located with feature
      CancelOrder/
        CancelOrderCommand.ts
        CancelOrderHandler.ts
        CancelOrder.test.ts
      GetOrderById/
        GetOrderByIdQuery.ts
        GetOrderByIdHandler.ts
        OrderSummaryDto.ts
    Inventory/
      ReserveStock/
        ReserveStockCommand.ts
        ReserveStockHandler.ts
  Shared/
    Domain/
      Order.ts
      Money.ts
    Infrastructure/
      AppDbContext.ts
      EmailClient.ts`
    },
    {
      label: 'Command + Handler',
      language: 'typescript',
      code: `// Features/Orders/PlaceOrder/PlaceOrderCommand.ts
export class PlaceOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly lines: Array<{ productId: string; qty: number }>,
  ) {}
}

// Features/Orders/PlaceOrder/PlaceOrderHandler.ts
export class PlaceOrderHandler implements IRequestHandler<PlaceOrderCommand, PlaceOrderResponse> {
  constructor(
    private db: AppDbContext,
    private mediator: IMediator,
  ) {}

  async handle(cmd: PlaceOrderCommand): Promise<PlaceOrderResponse> {
    // 1. Reserve stock via another slice
    const reserved = await this.mediator.send(
      new ReserveStockCommand(cmd.lines)
    );
    if (!reserved.success) throw new Error('Insufficient stock');

    // 2. Persist order
    const order = new Order(cmd.customerId, cmd.lines);
    await this.db.orders.insert(order);

    return { orderId: order.id };
  }
}`
    },
    {
      label: 'Query Slice (read model)',
      language: 'typescript',
      code: `// Features/Orders/GetOrderById/GetOrderByIdQuery.ts
export class GetOrderByIdQuery {
  constructor(public readonly orderId: string) {}
}

// Features/Orders/GetOrderById/GetOrderByIdHandler.ts
export class GetOrderByIdHandler
  implements IRequestHandler<GetOrderByIdQuery, OrderSummaryDto | null> {

  constructor(private db: AppDbContext) {}

  async handle(query: GetOrderByIdQuery): Promise<OrderSummaryDto | null> {
    // Queries can bypass domain — read directly from DB for performance
    const row = await this.db.orders
      .select(['id', 'customerId', 'status', 'total'])
      .where({ id: query.orderId })
      .first();

    return row ? { id: row.id, customerId: row.customerId, status: row.status, total: row.total } : null;
  }
}

// Controller — thin adapter
export class OrdersController {
  async getOrder(req: Request): Promise<Response> {
    const result = await this.mediator.send(new GetOrderByIdQuery(req.params.id));
    if (!result) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(result);
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Sharing service classes across slices',
      wrong: `// Shared OrderService used by PlaceOrder, CancelOrder, and GetOrder slices`,
      right: `// Each slice has its own handler; share only infrastructure utilities (DbContext, email client)`,
      explanation: 'Shared service classes become the same coupling problem as in traditional layered architecture. Handlers own their own logic.',
    },
    {
      title: 'Direct method calls between slice handlers',
      wrong: `// PlaceOrderHandler directly calls new ReserveStockHandler().handle(...)`,
      right: `await this.mediator.send(new ReserveStockCommand(...))`,
      explanation: 'Direct handler calls couple slices. Use the mediator or domain events to cross slice boundaries while remaining decoupled.',
    },
    {
      title: 'Putting domain entities in feature folders',
      wrong: `// Features/Orders/PlaceOrder/Order.ts  ← entity inside a slice`,
      right: `// Shared/Domain/Order.ts  ← entities belong in the shared kernel`,
      explanation: 'Domain entities are used across multiple slices. They belong in the shared domain layer, not inside any single feature.',
    },
    {
      title: 'Using Vertical Slice without a mediator on large teams',
      wrong: `// PlaceOrderController new PlaceOrderHandler() directly — couples controller to handler`,
      right: `// Controller sends via mediator; handler is registered separately`,
      explanation: 'Without a mediator, adding cross-cutting concerns (logging, validation, auth) must be added to every handler individually.',
    },
  ];

  challenge: Challenge = {
    title: 'Add a GetOrderSummary Slice',
    language: 'typescript',
    description: `Add a read-only GetOrderSummary slice to an existing Vertical Slice application.
The slice should:
1. Define a GetOrderSummaryQuery with an orderId.
2. Define an OrderSummaryDto with id, customerName, lineCount, and total.
3. Define GetOrderSummaryHandler that reads from a fake in-memory store.
4. Return null if the order does not exist.`,
    hints: [
      'Query classes have readonly fields, no mutation',
      'Handler reads from the store — no domain entity needed for simple reads',
      'Return DTO directly — no domain mapping required for queries',
    ],
    starterCode: `interface OrderRecord { id: string; customerName: string; lines: string[]; total: number; }
const store: OrderRecord[] = [
  { id: '1', customerName: 'Alice', lines: ['Widget', 'Gadget'], total: 99 },
];

// TODO: GetOrderSummaryQuery
// TODO: OrderSummaryDto
// TODO: GetOrderSummaryHandler`,
    solution: `interface OrderRecord { id: string; customerName: string; lines: string[]; total: number; }
const store: OrderRecord[] = [
  { id: '1', customerName: 'Alice', lines: ['Widget', 'Gadget'], total: 99 },
];

class GetOrderSummaryQuery {
  constructor(public readonly orderId: string) {}
}

interface OrderSummaryDto {
  id: string;
  customerName: string;
  lineCount: number;
  total: number;
}

class GetOrderSummaryHandler {
  async handle(query: GetOrderSummaryQuery): Promise<OrderSummaryDto | null> {
    const record = store.find(o => o.id === query.orderId);
    if (!record) return null;
    return {
      id: record.id,
      customerName: record.customerName,
      lineCount: record.lines.length,
      total: record.total,
    };
  }
}

// Usage:
const handler = new GetOrderSummaryHandler();
handler.handle(new GetOrderSummaryQuery('1')).then(console.log);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary organisational principle in Vertical Slice Architecture?',
      options: [
        'Organise by technical layer (Controllers, Services, Repositories)',
        'Organise by feature — all code for a use case in one folder',
        'Organise by database table',
        'Organise by HTTP method',
      ],
      answer: 1,
      explanation: 'Each slice (feature folder) contains all code for a single use case. Adding a feature means adding a folder; deleting it means deleting a folder.',
    },
    {
      q: 'How should cross-slice communication happen?',
      options: [
        'Direct handler instantiation',
        'Shared service class',
        'Via mediator or domain events',
        'HTTP calls between controllers',
      ],
      answer: 2,
      explanation: 'Cross-slice calls via mediator or domain events preserve slice independence. Direct calls or shared service classes reintroduce coupling.',
    },
    {
      q: 'What belongs in the Shared Kernel in a Vertical Slice app?',
      options: [
        'All handler classes',
        'Domain entities, value objects, infrastructure utilities',
        'HTTP DTOs for every feature',
        'Controller base classes',
      ],
      answer: 1,
      explanation: 'Shared kernel contains only genuinely shared artefacts: domain entities/value objects, and infrastructure wiring (DbContext, clients).',
    },
    { q: 'What is Vertical Slice Architecture and how does it differ from traditional layered architecture?', options: ['Vertical slices are layers of the application deployed as separate services', 'Vertical Slice Architecture organizes code by feature (each slice includes all layers needed for that feature), whereas layered architecture organizes by technical concern across all features', 'Vertical slices eliminate the need for a database layer', 'Vertical slices separate the UI into vertical columns each maintained by a different team'], answer: 1, explanation: 'Layered architecture groups code by technical concern: all controllers in one folder, all services in one folder, all repositories in one folder. A single feature touches multiple folders. Vertical Slice Architecture groups code by feature: the PlaceOrder feature contains its own controller, service, and repository in one folder (one vertical slice through all layers). This keeps feature code co-located, reduces coupling between features, and allows each feature to make its own technical decisions about how to implement its specific requirements without being constrained by a shared layer structure.' },
    { q: 'What is a mediator and how is it used in Vertical Slice Architecture?', options: ['A message broker that routes events between vertical slices', 'A pattern object (like MediatR in .NET) that dispatches commands and queries to their handlers, enabling in-process decoupling between the request and its handler', 'A database abstraction layer that mediates between domain objects and the ORM', 'A load balancer that routes HTTP requests to the correct feature handler'], answer: 1, explanation: 'In Vertical Slice Architecture, a controller does not directly call a service. Instead, it dispatches a command or query to a mediator (MediatR in .NET, a simple dispatcher in other languages). The mediator finds the registered handler for that command type and calls it. This decouples controllers from specific handler implementations and makes it easy to add cross-cutting behavior (logging, validation, transactions) via mediator pipeline behaviors without adding it to every handler. Each feature has its own command, query, and handler classes in the same folder.' },
    { q: 'How does Vertical Slice Architecture handle shared code that multiple features need?', options: ['Each feature duplicates the shared code to maintain strict feature isolation', 'Genuinely shared code (domain entities, common utilities) lives in a shared kernel layer; feature-specific code stays in the slice even if it looks similar to code in other slices', 'Shared code is extracted to a separate microservice', 'Vertical Slice Architecture prohibits any code reuse between features'], answer: 1, explanation: 'Not everything should be in feature slices. Genuinely shared domain entities (User, Order), value objects, and cross-cutting concerns (security, error handling) belong in a shared kernel. Business logic that is specific to one feature stays in that feature slice even if it looks similar to another slice. The principle is to prefer duplication over coupling for feature-specific code: if two features share an implementation detail that might need to evolve differently, keeping them separate is better than extracting a premature shared abstraction.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is Vertical Slice better than Clean Architecture?',
      a: 'Different tools for different problems. Vertical Slice excels when features are largely independent and teams work on separate features. Clean Architecture excels when the domain is deeply interconnected and rich business rules need protecting from framework churn. Many apps combine both: Vertical Slice at the feature level, Clean Architecture within each slice.',
    },
    {
      q: 'Does every slice need its own database table?',
      a: 'No — slices share the same database. The isolation is at the code level, not the storage level. Multiple slices can read from the same table; they just each have their own handler and query logic.',
    },
    {
      q: 'What mediator library is commonly used in .NET?',
      a: 'MediatR (Jimmy Bogard) has long been the de facto standard, and remains free for individuals and companies under $5M USD annual revenue -- but it went dual-licensed (commercial for larger enterprises) in July 2025 under Bogard\'s new company, Lucky Penny Software. It still dispatches commands and queries to their registered handlers and supports pipeline behaviours for cross-cutting concerns (logging, validation, caching). Since the licensing change, some teams have moved to free, source-generator-based alternatives like Mediator (by martinothamar) or Wolverine, which avoid MediatR\'s original reflection-based dispatch entirely.',
    },
    { q: 'What are the advantages of Vertical Slice Architecture for team collaboration?', a: 'Teams can work on different features simultaneously with minimal conflicts because each feature is self-contained. New features do not require touching shared service and repository classes that many features depend on. Onboarding is easier: to understand a feature, read its slice folder rather than tracing execution through multiple shared layers across the codebase. Feature ownership is clear: one team or developer can own an entire slice. Deployment strategies become easier to reason about: a feature can be feature-flagged at the handler level without affecting other features. The architecture naturally guides toward the feature-team structure common in product companies where cross-functional teams own end-to-end features.' },
    { q: 'What is CQRS in the context of Vertical Slice Architecture?', a: 'In Vertical Slice Architecture, CQRS (Command Query Responsibility Segregation) is often applied at the feature level by separating read slices from write slices. A PlaceOrder feature is a write slice: it validates, applies business rules, updates the database, and publishes events. An OrderHistory feature is a read slice: it queries a denormalized read model and returns data directly without going through business rule enforcement. Each slice uses the appropriate implementation strategy: write slices may use rich domain models and repositories; read slices may use direct SQL queries or lightweight ORMs that return simple DTOs. This per-slice flexibility is harder to achieve in layered architecture where all features share the same service and repository implementations.' },
    { q: 'When is Vertical Slice Architecture the wrong choice?', a: 'Vertical Slice Architecture can be the wrong choice when: features are highly interdependent and share complex domain logic that would need to be duplicated across many slices, creating maintenance problems. Very small applications with only a handful of features may not benefit enough from the organizational investment to justify the overhead. Teams unfamiliar with the pattern may struggle with understanding how to draw feature boundaries and where shared code ends and feature-specific code begins. Applications with very uniform CRUD operations across all features gain little from per-feature flexibility. As with any architecture pattern, apply it where the organizational clarity and feature autonomy benefits outweigh the cost of learning and maintaining the structure.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Vertical Slice organises code by feature (use case), not by layer — each slice is self-contained and changes in isolation.',
    mustKnow: [
      'Feature folder: command/query + handler + validator + DTO + tests in one place',
      'Slices communicate via mediator or domain events — never direct handler calls',
      'Domain entities and infrastructure utilities live in a shared kernel',
      'Query slices bypass domain objects for performance — read directly from DB',
      'Coupling metric: how many folders change for one feature? Should be one.',
    ],
    interviewFocus: [
      'Compare Vertical Slice to Layered Architecture — when would you pick each?',
      'How do you handle cross-feature communication without coupling?',
      'What is the role of MediatR in a Vertical Slice application?',
    ],
  };
}
