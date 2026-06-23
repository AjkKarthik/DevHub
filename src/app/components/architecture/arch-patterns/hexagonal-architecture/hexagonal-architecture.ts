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
  selector: 'app-arch-hexagonal-architecture',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './hexagonal-architecture.html',
  styleUrl: './hexagonal-architecture.scss',
})
export class ArchHexagonalArchitecture {

  quickRef: QuickRefItem[] = [
    { name: 'Port', type: 'interface', desc: 'An interface defined by the application core — the contract for interacting with it' },
    { name: 'Adapter', type: 'keyword', desc: 'An implementation of a port — connects the core to an external system' },
    { name: 'Driving Adapter', type: 'keyword', desc: 'Initiates interaction with the core: HTTP controller, CLI, test harness' },
    { name: 'Driven Adapter', type: 'keyword', desc: 'Called by the core: database, email gateway, external API' },
    { name: 'Primary Port', type: 'keyword', desc: 'Interface for driving adapters to call the application (use case interface)' },
    { name: 'Secondary Port', type: 'keyword', desc: 'Interface the core calls; driven adapters implement it' },
    { name: 'Application Core', type: 'keyword', desc: 'Domain + use cases; zero awareness of HTTP, DB, or external systems' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Ports & Adapters — the Core Idea',
      points: [
        'Alistair Cockburn invented Hexagonal Architecture in 2005 to answer: how do I test my application without a UI or a database?',
        'The answer: define ports (interfaces) at the boundary of the application core. Plug adapters in on either side.',
        'Primary (left) side: driving adapters call into the core through a primary port (e.g., PlaceOrderPort).',
        'Secondary (right) side: the core calls out through secondary ports (e.g., IOrderRepository, IEmailGateway); adapters implement them.',
      ],
    },
    {
      heading: 'Why "Hexagonal"?',
      points: [
        'The hex shape has nothing to do with six. It is drawn as a hexagon to emphasise equal treatment of all sides — no "top" or "bottom".',
        'You can plug any adapter into any port: swap HTTP for CLI, Postgres for in-memory, SMTP for a console logger.',
        'This symmetry enables fully in-process testing without any infrastructure running.',
      ],
    },
    {
      heading: 'Relationship to Clean Architecture',
      points: [
        'Hexagonal Architecture is the original pattern; Clean Architecture is a refined, opinionated implementation of the same idea.',
        'Both share the inward dependency rule and the use of interfaces at boundaries.',
        'Hexagonal emphasises adapter symmetry (driving vs driven). Clean Architecture adds explicit layer rings.',
        'In practice you can implement either using the same code structure.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Ports (defined in core)',
      language: 'typescript',
      code: `// Application Core — Primary Port (driving adapters call this)
export interface PlaceOrderPort {
  execute(cmd: PlaceOrderCommand): Promise<PlaceOrderResult>;
}

// Application Core — Secondary Ports (core calls these; adapters implement them)
export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
}

export interface IPaymentGateway {
  charge(customerId: string, amount: Money): Promise<PaymentId>;
}

// Use case implements the primary port
export class PlaceOrderUseCase implements PlaceOrderPort {
  constructor(
    private orders: IOrderRepository,    // secondary port
    private payments: IPaymentGateway,   // secondary port
  ) {}

  async execute(cmd: PlaceOrderCommand): Promise<PlaceOrderResult> {
    const order = Order.create(cmd.customerId, cmd.lines);
    const paymentId = await this.payments.charge(cmd.customerId, order.total);
    order.markPaid(paymentId);
    await this.orders.save(order);
    return { orderId: order.id };
  }
}`
    },
    {
      label: 'Driving Adapters',
      language: 'typescript',
      code: `// HTTP Driving Adapter — calls the primary port
export class OrdersController {
  constructor(private port: PlaceOrderPort) {}

  async post(req: Request): Promise<Response> {
    const cmd = new PlaceOrderCommand(req.body.customerId, req.body.lines);
    const result = await this.port.execute(cmd);
    return Response.json({ orderId: result.orderId }, { status: 201 });
  }
}

// CLI Driving Adapter — same port, different entry
export class PlaceOrderCli {
  constructor(private port: PlaceOrderPort) {}

  async run(args: string[]): Promise<void> {
    const cmd = PlaceOrderCommand.fromArgs(args);
    const result = await this.port.execute(cmd);
    console.log('Order placed:', result.orderId);
  }
}

// Test Driving Adapter — directly calls the port in tests
it('places an order', async () => {
  const port = new PlaceOrderUseCase(fakeRepo, fakePayments);
  const result = await port.execute(testCommand);
  expect(result.orderId).toBeDefined();
});`
    },
    {
      label: 'Driven Adapters',
      language: 'typescript',
      code: `// Postgres Driven Adapter — implements secondary port
export class PostgresOrderRepository implements IOrderRepository {
  async save(order: Order): Promise<void> {
    await this.db.query(
      'INSERT INTO orders VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE ...',
      [order.id, order.customerId, order.status]
    );
  }
  async findById(id: string): Promise<Order | null> { ... }
}

// Stripe Driven Adapter
export class StripePaymentGateway implements IPaymentGateway {
  async charge(customerId: string, amount: Money): Promise<PaymentId> {
    const intent = await this.stripe.paymentIntents.create({ ... });
    return new PaymentId(intent.id);
  }
}

// In-memory Driven Adapter for tests
export class InMemoryOrderRepository implements IOrderRepository {
  private store = new Map<string, Order>();
  async save(order: Order): Promise<void> { this.store.set(order.id, order); }
  async findById(id: string): Promise<Order | null> { return this.store.get(id) ?? null; }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Defining secondary ports in the Infrastructure layer',
      wrong: `// Infrastructure/IOrderRepository.ts — wrong location`,
      right: `// Application/Ports/IOrderRepository.ts — port belongs in core`,
      explanation: 'Ports are owned by the core. Putting them in Infrastructure reverses the dependency — the core would import from Infrastructure.',
    },
    {
      title: 'Leaking HTTP concepts into the primary port',
      wrong: `interface PlaceOrderPort { execute(req: Request): Promise<Response>; }`,
      right: `interface PlaceOrderPort { execute(cmd: PlaceOrderCommand): Promise<PlaceOrderResult>; }`,
      explanation: 'Ports use domain-level types. HTTP request/response objects are adapter concerns. The core should not know what HTTP is.',
    },
    {
      title: 'Having only one adapter per port',
      wrong: `// Only a Postgres adapter ever implements IOrderRepository`,
      right: `// Also write an InMemoryOrderRepository for fast unit tests`,
      explanation: 'The value of hexagonal architecture is swappable adapters. If you only have one, you have not implemented ports & adapters — just an interface.',
    },
    {
      title: 'Circular adapter dependencies',
      wrong: `// HttpAdapter imports from DatabaseAdapter for config`,
      right: `// Adapters are independent; shared config comes from composition root`,
      explanation: 'Adapters should only depend on the core port interfaces, never on each other. Shared state is injected at the composition root.',
    },
  ];

  challenge: Challenge = {
    title: 'Add a CLI Adapter to an Existing Hexagonal App',
    language: 'typescript',
    description: `A SendNotificationPort exists with a single execute(cmd) method.
Currently only an HTTP adapter (NotificationController) drives it.
1. Write a CLI driving adapter that reads recipient and message from process.argv.
2. Write an InMemoryNotificationGateway driven adapter for testing.
3. Show the composition root that wires everything.`,
    hints: [
      'CLI adapter: constructor(private port: SendNotificationPort)',
      'process.argv[2] = recipient, process.argv[3] = message',
      'InMemory adapter stores sent notifications in an array for assertion',
      'Composition root: new SendNotificationCli(new SendNotificationUseCase(new SmtpGateway()))',
    ],
    starterCode: `interface SendNotificationPort {
  execute(cmd: { recipient: string; message: string }): Promise<void>;
}

// TODO: implement CLI driving adapter
class SendNotificationCli { }

// TODO: implement in-memory driven adapter
class InMemoryNotificationGateway implements INotificationGateway { }`,
    solution: `// CLI Driving Adapter
class SendNotificationCli {
  constructor(private port: SendNotificationPort) {}

  async run(): Promise<void> {
    const [,, recipient, message] = process.argv;
    if (!recipient || !message) {
      console.error('Usage: notify <recipient> <message>');
      process.exit(1);
    }
    await this.port.execute({ recipient, message });
    console.log(\`Notification sent to \${recipient}\`);
  }
}

// In-Memory Driven Adapter (for tests)
class InMemoryNotificationGateway implements INotificationGateway {
  sent: Array<{ recipient: string; message: string }> = [];

  async send(recipient: string, message: string): Promise<void> {
    this.sent.push({ recipient, message });
  }
}

// Composition Root
const gateway = new InMemoryNotificationGateway();
const useCase = new SendNotificationUseCase(gateway);
const cli = new SendNotificationCli(useCase);
cli.run();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In Hexagonal Architecture, what is a "driving adapter"?',
      options: [
        'A database implementation',
        'Something that calls INTO the application core (HTTP, CLI, test)',
        'An interface defined in the core',
        'An email gateway',
      ],
      answer: 1,
      explanation: 'Driving (primary) adapters initiate interactions with the core — they are on the left side of the hexagon.',
    },
    {
      q: 'Where are port interfaces defined?',
      options: [
        'In the Infrastructure adapter implementations',
        'In the Application Core',
        'In the HTTP Controller',
        'In the database migration files',
      ],
      answer: 1,
      explanation: 'Ports are owned by the core — they define what the core needs and how it can be driven. Adapters implement/call them from outside.',
    },
    {
      q: 'What is the main benefit of writing an InMemory driven adapter?',
      options: [
        'Production performance',
        'Allows testing the use case without starting a real database',
        'Generates SQL automatically',
        'Reduces bundle size',
      ],
      answer: 1,
      explanation: 'In-memory adapters let unit tests exercise the full use case with real domain logic at millisecond speed, no infrastructure required.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is there a difference between Hexagonal Architecture and Ports & Adapters?',
      a: 'They are the same thing. "Ports & Adapters" is the formal name Cockburn gave the pattern; "Hexagonal Architecture" is the informal name that stuck because of the hex diagram.',
    },
    {
      q: 'How many adapters should each port have?',
      a: 'At minimum two: the real implementation (Postgres, SMTP) and a test double (InMemory, Fake). Having only one adapter defeats the purpose of the port abstraction.',
    },
    {
      q: 'When does Hexagonal Architecture add too much overhead?',
      a: 'Simple CRUD apps with no complex business rules — the port/adapter indirection adds mapping and interface boilerplate without meaningful payoff. Use a flat layered structure instead.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Hexagonal Architecture isolates the application core behind ports (interfaces); adapters plug in on either side without the core knowing about them.',
    mustKnow: [
      'Port: interface defined in the core (primary = driven by adapters; secondary = implemented by adapters)',
      'Driving adapters: HTTP, CLI, test harness — call into the core',
      'Driven adapters: DB, email, payment — called by the core',
      'Core has zero imports from any adapter',
      'Every secondary port should have at least two adapters: real + in-memory',
    ],
    interviewFocus: [
      'Explain driving vs driven adapters with an example',
      'Why are port interfaces owned by the core, not Infrastructure?',
      'How does hexagonal architecture improve testability?',
    ],
  };
}
