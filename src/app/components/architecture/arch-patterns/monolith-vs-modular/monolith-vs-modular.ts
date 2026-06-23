import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  selector: 'app-arch-monolith-vs-modular',
  standalone: true,
  imports: [CommonModule, RouterLink, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './monolith-vs-modular.html',
  styleUrl: './monolith-vs-modular.scss',
})
export class ArchMonolithVsModular {

  quickRef: QuickRefItem[] = [
    { name: 'Monolith', type: 'keyword', desc: 'Single deployable unit; all features in one process' },
    { name: 'Modular Monolith', type: 'keyword', desc: 'Strict internal module boundaries with a single deployment' },
    { name: 'Bounded Module', type: 'keyword', desc: 'A module with an explicit public API and no cross-boundary class access' },
    { name: 'Strangler Fig', type: 'keyword', desc: 'Incrementally route traffic to new services, keeping the monolith alive during migration' },
    { name: 'Deployment Unit', type: 'keyword', desc: 'The artifact that is versioned and deployed as one; monoliths have one, microservices have many' },
    { name: 'Shared Kernel', type: 'keyword', desc: 'A small, agreed-upon subset of the domain model shared across modules' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Monolith — not a dirty word',
      points: [
        'A monolith deploys as a single process; all features share the same runtime, memory, and database.',
        '"Monolith-first" is a valid strategy: start simple, ship fast, collect real usage signals before splitting.',
        'Most successful microservices architectures grew out of a well-understood monolith — not the other way around.',
        'The problem is not the monolith itself but the Big Ball of Mud: no module boundaries, no separation of concerns.',
      ],
    },
    {
      heading: 'Modular Monolith — the middle ground',
      points: [
        'A Modular Monolith enforces strict module boundaries internally while remaining a single deployable artifact.',
        'Each module owns its data (a schema per module or a well-defined table namespace) and exposes a typed public API.',
        'Cross-module calls go through the public interface — never via direct class instantiation across module boundaries.',
        'Testing is simpler: in-process, no network stubs; yet the domain logic is cleanly isolated per bounded context.',
        'Migrating a module to a microservice later is straightforward because the interface contract already exists.',
      ],
    },
    {
      heading: 'When to split into Microservices',
      points: [
        'Scale bottleneck: one module needs 10× more resources than the rest — isolating it pays for the operational cost.',
        'Team independence: two teams are blocking each other on deployments and have clearly separate domains.',
        'Technology fit: one module needs a different language, runtime, or database technology.',
        'Never split speculatively. Network calls, distributed transactions, and operational overhead are real costs.',
        'Rule of thumb: you need at least a team of 10–15 engineers and a stable domain before microservices pay off.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Modular Monolith Structure',
      language: 'bash',
      code: `# Folder-level module isolation
src/
  Modules/
    Orders/
      OrdersModule.cs          # registers all internal services
      API/
        OrdersController.cs
      Application/
        PlaceOrderHandler.cs
      Domain/
        Order.cs
        OrderLine.cs
      Infrastructure/
        OrderRepository.cs
    Inventory/
      InventoryModule.cs
      API/
        InventoryController.cs
      Application/
        ReserveStockHandler.cs
      Domain/
        Product.cs
      Infrastructure/
        InventoryRepository.cs
  Shared/
    SharedKernel/
      Money.cs               # Value object used across modules`
    },
    {
      label: 'Module Registration',
      language: 'typescript',
      code: `// Each module registers its own services
// Orders/OrdersModule.ts
export function registerOrdersModule(services: ServiceCollection): void {
  services.addScoped<OrderRepository>();
  services.addScoped<PlaceOrderHandler>();
  // Only internal services — nothing cross-module
}

// Cross-module calls via typed interface, NOT direct import
export interface IInventoryService {
  reserveStock(productId: string, qty: number): Promise<boolean>;
}

// Orders module depends on the interface, injected at composition root
export class PlaceOrderHandler {
  constructor(private inventory: IInventoryService) {}

  async handle(command: PlaceOrderCommand): Promise<void> {
    const reserved = await this.inventory.reserveStock(
      command.productId, command.quantity
    );
    if (!reserved) throw new Error('Insufficient stock');
    // place order...
  }
}`
    },
    {
      label: 'Strangler Fig Routing',
      language: 'typescript',
      code: `// Route requests to old or new system via a facade
// Feature flag controls which system handles the request
class OrderFacade {
  constructor(
    private legacyOrderSystem: LegacyOrderService,
    private newOrderService: NewOrderService,
    private features: FeatureFlags,
  ) {}

  async placeOrder(command: PlaceOrderCommand): Promise<OrderResult> {
    if (this.features.isEnabled('new-order-service')) {
      return this.newOrderService.placeOrder(command);
    }
    return this.legacyOrderSystem.placeOrder(command);
  }
}

// Gradually ramp: 5% → 25% → 100% → retire legacy`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Directly importing across module boundaries',
      wrong: `// Orders imports Inventory's internal class directly
import { InventoryItem } from '../Inventory/Domain/InventoryItem';`,
      right: `// Orders depends on the public interface only
import { IInventoryService } from '../Inventory/API/IInventoryService';`,
      explanation: 'Direct cross-module imports couple modules at the class level, making future extraction impossible. Always go through the public API.',
    },
    {
      title: 'Sharing a single database schema across modules',
      wrong: `// Both modules reference the same ORM context with all tables`,
      right: `// Each module has its own schema or DbContext scoped to its tables`,
      explanation: 'A shared schema means both modules must deploy together when any table changes. Module-scoped schemas enable independent evolution.',
    },
    {
      title: 'Splitting too early without sufficient domain understanding',
      wrong: `// Day 1: create 20 microservices for a new product`,
      right: `// Ship a modular monolith; extract services when team and domain are stable`,
      explanation: 'Splitting before you understand your domain leads to wrong service boundaries — which are extremely expensive to fix once traffic runs through them.',
    },
    {
      title: 'Treating the Strangler Fig as a permanent state',
      wrong: `// Feature flag "new-order-service" lives in production for 2 years`,
      right: `// Set a deadline: ramp to 100%, delete legacy code, remove the flag`,
      explanation: 'Indefinite dual-system maintenance doubles operational burden. The Strangler Fig is a migration tool, not an architecture pattern.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a Modular Monolith for an E-Commerce App',
    language: 'typescript',
    description: `Define the module structure for an e-commerce application with Orders, Catalog, and Customers.
1. List the modules and what each owns (data + logic).
2. Define the public interface that Orders uses to call Catalog (product pricing).
3. Show how OrdersModule is registered without importing Catalog internals.
4. Identify what would go in the SharedKernel.`,
    hints: [
      'Each module owns its own tables — Orders table, Products table, Customers table',
      'The interface goes in the consuming module or a shared contracts library',
      'SharedKernel: value objects like Money, ProductId, CustomerId that cross module lines',
      'Registration: composition root wires ICatalogService → CatalogService',
    ],
    starterCode: `// Define module interfaces and registration
interface ICatalogService {
  // TODO: define method to get product price
}

function registerOrdersModule(services: ServiceCollection, catalog: ICatalogService): void {
  // TODO: register handlers
}

// TODO: define SharedKernel value objects`,
    solution: `interface ICatalogService {
  getProductPrice(productId: string): Promise<Money>;
}

interface Money { amount: number; currency: string; }
interface ProductId { value: string; }
interface CustomerId { value: string; }

// SharedKernel exports: Money, ProductId, CustomerId

function registerOrdersModule(
  services: ServiceCollection,
  catalog: ICatalogService
): void {
  services.addSingleton<ICatalogService>(catalog);
  services.addScoped<PlaceOrderHandler>();
  services.addScoped<OrderRepository>();
}

// Composition root:
const catalogService = new CatalogService(catalogDb);
registerOrdersModule(appServices, catalogService);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary advantage of a Modular Monolith over a Big Ball of Mud monolith?',
      options: [
        'It deploys faster',
        'It enforces explicit module boundaries and public APIs',
        'It uses less memory',
        'It auto-scales each module independently',
      ],
      answer: 1,
      explanation: 'Strict module boundaries prevent cross-cutting coupling and make future extraction to microservices feasible.',
    },
    {
      q: 'When does splitting a monolith into microservices make sense?',
      options: [
        'Always — microservices are modern',
        'When a specific module has a genuine scale or team-independence bottleneck',
        'When the codebase has more than 10,000 lines',
        'When the team is fewer than 5 engineers',
      ],
      answer: 1,
      explanation: 'Split on demonstrated need — scale bottleneck, team coupling, or technology mismatch — not on hype.',
    },
    {
      q: 'What does the Strangler Fig pattern do?',
      options: [
        'Deletes the legacy system immediately',
        'Runs the new and old systems in parallel and routes traffic incrementally',
        'Converts the monolith to a modular monolith',
        'Adds an ESB between modules',
      ],
      answer: 1,
      explanation: 'The Strangler Fig keeps the old system alive while routing increasing traffic to the new system — zero big-bang risk.',
    },
    {
      q: 'Which of these belongs in the SharedKernel?',
      options: [
        'OrderRepository',
        'Money value object',
        'InventoryController',
        'CustomerEmailService',
      ],
      answer: 1,
      explanation: 'SharedKernel contains only small, stable value objects or types that multiple modules legitimately share.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is a Modular Monolith just good naming conventions?',
      a: 'No — it requires tooling enforcement: build-time rules (ArchUnit, NDepend, ESLint module-boundary rules) that fail the build if a module imports another module\'s internals. Naming alone is not enforced.',
    },
    {
      q: 'Can a Modular Monolith use a single database?',
      a: 'Yes, but each module should have its own schema namespace or set of tables, and ideally its own DbContext. Avoid joining across module schemas — use the public API instead.',
    },
    {
      q: 'How long should the Strangler Fig migration last?',
      a: 'Aim for 6–12 weeks per service extraction. Set a hard deadline to ramp to 100% and retire the legacy code. Open-ended migrations balloon in operational cost.',
    },
    {
      q: 'What is the Shared Kernel vs Anti-Corruption Layer difference?',
      a: 'SharedKernel: both modules agree on and co-own a small shared subset of the model. Anti-Corruption Layer: a translation layer that protects your model from an external model you do not control.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Start with a well-structured Modular Monolith; extract services only when team or scale demands it.',
    mustKnow: [
      'Monolith-first is a legitimate strategy — simplicity wins early',
      'Modular Monolith: bounded modules with typed public APIs, single deployment',
      'Cross-module calls: always via interface, never direct class import',
      'Strangler Fig: route traffic incrementally from old to new, retire old system',
      'Split trigger: proven scale bottleneck or team independence need, not speculation',
    ],
    interviewFocus: [
      'When would you choose a Modular Monolith over Microservices?',
      'How do you prevent module coupling from re-emerging over time?',
      'Walk through a Strangler Fig migration for a checkout service',
    ],
  };
}
