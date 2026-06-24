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
      a: 'MediatR (Jimmy Bogard) is the de facto standard. It dispatches commands and queries to their registered handlers and supports pipeline behaviours for cross-cutting concerns (logging, validation, caching).',
    },
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
