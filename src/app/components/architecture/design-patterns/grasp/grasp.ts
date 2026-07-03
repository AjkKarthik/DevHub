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

const quickRef: QuickRefItem[] = [
  { name: 'GRASP',             type: 'keyword', desc: 'General Responsibility Assignment Software Patterns — 9 patterns for deciding which class should own a responsibility.' },
  { name: 'Information Expert', type: 'keyword', desc: 'Assign responsibility to the class with the most information needed to fulfil it.' },
  { name: 'Creator',           type: 'keyword', desc: 'Assign creation of B to the class that contains, aggregates, or has the init data for B.' },
  { name: 'Controller',        type: 'keyword', desc: 'Assign system event handling to a Façade or Use Case controller — not the UI.' },
  { name: 'Low Coupling',      type: 'keyword', desc: 'Minimize dependencies between classes — prefer loose coupling for change tolerance.' },
  { name: 'High Cohesion',     type: 'keyword', desc: 'Keep related operations together in one class — each class does one coherent thing.' },
  { name: 'Polymorphism',      type: 'keyword', desc: 'Use polymorphism to handle type-based variation instead of if/switch on type.' },
  { name: 'Pure Fabrication',  type: 'keyword', desc: 'Create a class not found in the domain when needed to achieve low coupling — e.g. Repository, Service.' },
  { name: 'Indirection',       type: 'keyword', desc: 'Introduce an intermediate object to decouple two classes — e.g. Adapter, Facade.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is GRASP?',
    points: [
      'GRASP stands for General Responsibility Assignment Software Patterns — defined by Craig Larman in "Applying UML and Patterns".',
      'GRASP answers the fundamental question: "Which class should own this responsibility?"',
      'Unlike GoF patterns (how to structure code), GRASP guides the initial responsibility assignment during design.',
      'The 9 GRASP patterns: Information Expert, Creator, Controller, Low Coupling, High Cohesion, Polymorphism, Pure Fabrication, Indirection, Protected Variations.',
    ],
  },
  {
    heading: 'Information Expert & Creator',
    points: [
      'Information Expert: assign a responsibility to the class that has the information needed to fulfil it.',
      'Order has all its items — Order.CalculateTotal() is natural; TotalCalculator.Calculate(order) is not.',
      'Creator: assign creation of B to the class that contains, aggregates, uses, or has the initialisation data for B.',
      'Order contains OrderItems — Order should create OrderItems, not a factory elsewhere.',
    ],
  },
  {
    heading: 'Low Coupling & High Cohesion',
    points: [
      'Low Coupling: minimise the number of dependencies between classes — each change is localised.',
      'High Cohesion: a class should do one thing and do it well — all methods relate to that one purpose.',
      'These two tension each other: very low coupling can mean low cohesion (classes doing too little).',
      'Balance: cohesive classes with focused responsibilities, connected only through stable interfaces.',
    ],
  },
  {
    heading: 'Polymorphism, Pure Fabrication, Indirection & Protected Variations',
    points: [
      'Polymorphism: handle type-based variation with polymorphism — not if/switch on type tags.',
      'Pure Fabrication: create a class not in the domain model when needed for low coupling (Repository, Service, Gateway).',
      'Indirection: introduce an intermediate object to avoid direct coupling — Adapter, Proxy, Mediator.',
      'Protected Variations: identify variation points and wrap them in a stable interface — isolate what changes.',
    ],
  },
  {
    heading: 'GRASP as Principles Underlying Many Named Patterns',
    points: [
      'GRASP (General Responsibility Assignment Software Patterns) principles like Information Expert (assign a responsibility to the class that has the information needed to fulfill it) are lower-level design guidelines that many of the classic Gang of Four patterns implicitly follow, even though GRASP itself predates and is more general than those specific patterns.',
      'Information Expert answers a foundational OOP question — "which class should have this method?" — by favoring the class that already holds the relevant data, reducing the need for other classes to expose their internal state just so external logic can operate on it.',
      'Low Coupling and High Cohesion (two other core GRASP principles) are the underlying justifications for WHY patterns like Facade, Mediator, and Observer are considered good design — those patterns are essentially named, reusable applications of reducing coupling or increasing cohesion in specific recurring situations.',
      'Understanding GRASP principles helps evaluate whether a specific named pattern is genuinely the right fit for a given situation, or whether applying it would actually increase coupling or reduce cohesion — the principles provide the underlying "why," while named patterns provide the specific "how."',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Information Expert + Creator',
    language: 'csharp',
    code: `// Information Expert — Order has items, so Order calculates its total
// (not a separate TotalCalculatorService)

public class OrderItem(Guid productId, int qty, decimal unitPrice)
{
    public Guid    ProductId { get; } = productId;
    public int     Qty       { get; } = qty;
    public decimal UnitPrice { get; } = unitPrice;
    public decimal LineTotal => Qty * UnitPrice;  // Information Expert: item knows its own total
}

public class Order
{
    private readonly List<OrderItem> _items = new();

    // Information Expert: Order has items, so it knows the total — not an external class
    public decimal Total => _items.Sum(i => i.LineTotal);
    public int     ItemCount => _items.Count;

    // Creator: Order CONTAINS OrderItems, so Order creates them
    public void AddItem(Guid productId, int qty, decimal unitPrice)
    {
        if (qty <= 0) throw new DomainException("Quantity must be positive");
        _items.Add(new OrderItem(productId, qty, unitPrice)); // Creator pattern
    }

    // High Cohesion: all methods relate to the order's state
    public bool HasItems => _items.Any();
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
}

// WRONG application (violates Information Expert + Creator):
public class OrderTotalCalculator
{
    public decimal Calculate(Order order) // Order ALREADY knows its total!
        => order.Items.Sum(i => i.Qty * i.UnitPrice); // duplicated knowledge
}

public class OrderItemFactory
{
    public OrderItem Create(Guid productId, int qty, decimal price)
        => new(productId, qty, price); // Order should create its own items
}`,
  },
  {
    label: 'Polymorphism + Protected Variations',
    language: 'csharp',
    code: `// Polymorphism — variation by type handled via polymorphism, not switch
// WRONG: type-checking switch
public decimal CalculateTax(Order order, string region)
{
    return region switch
    {
        "UK"  => order.Total * 0.20m,
        "US"  => order.Total * 0.08m,
        "EU"  => order.Total * 0.19m,
        // Adding a new region requires modifying this switch ← not polymorphic
        _ => 0m
    };
}

// RIGHT: polymorphism (Polymorphism + OCP)
public interface ITaxCalculator { decimal Calculate(decimal amount); }

public class UkTaxCalculator  : ITaxCalculator { public decimal Calculate(decimal a) => a * 0.20m; }
public class UsTaxCalculator  : ITaxCalculator { public decimal Calculate(decimal a) => a * 0.08m; }
public class EuTaxCalculator  : ITaxCalculator { public decimal Calculate(decimal a) => a * 0.19m; }

// Protected Variations — isolate what changes behind a stable interface
// The interface is the "protection point" — callers are shielded from tax law changes

public class OrderTaxService(ITaxCalculator taxCalc)
{
    public decimal GetTax(Order order) => taxCalc.Calculate(order.Total);
}

// Pure Fabrication — Repository is not in the domain, but needed for low coupling
// (Order, Customer, Product are domain; OrderRepository is a pure fabrication)
public class OrderRepository(AppDbContext db)
{
    public Task<Order?> GetByIdAsync(Guid id) => db.Orders.FindAsync(id).AsTask();
}

// Indirection — Adapter decouples OrderService from the specific payment API
public interface IPaymentGateway { Task<PaymentResult> ChargeAsync(decimal amount, string token); }

public class StripeAdapter(StripeClient stripe) : IPaymentGateway
{
    public async Task<PaymentResult> ChargeAsync(decimal amount, string token)
    {
        var charge = await stripe.ChargeCreateAsync(new ChargeCreateOptions
            { Amount = (long)(amount * 100), Currency = "usd", Source = token });
        return new PaymentResult(charge.Paid, charge.Id);
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Placing business logic in controllers (violates Controller + High Cohesion)',
    wrong: `[HttpPost]
public IActionResult PlaceOrder(PlaceOrderRequest req)
{
    var total = req.Items.Sum(i => i.Price * i.Qty);
    if (total > 10000) return BadRequest("Order too large"); // domain rule in controller!
}`,
    right: `// Controller delegates to Application layer; domain rules in domain entities
var orderId = await mediator.Send(new PlaceOrderCommand(req.CustomerId, req.Items));`,
    explanation: 'GRASP Controller says system events should be handled by a non-UI controller (use case handler), not the presentation layer. Domain rules in controllers are untestable without HTTP and violate High Cohesion — the controller now has two jobs.',
  },
  {
    title: 'Feature Envy — method uses another class\'s data more than its own',
    wrong: `public class PriceCalculator
{
    public decimal Calculate(Order order)
        => order.Items.Sum(i => i.Qty * i.UnitPrice); // uses Order's data, not its own
}`,
    right: `// Information Expert: Order already has items — let Order calculate its total
public decimal Total => _items.Sum(i => i.LineTotal); // in Order class`,
    explanation: 'Feature Envy (method in wrong class) violates Information Expert. If a method heavily uses another class\'s data, move it there. PriceCalculator replicates what Order already knows — a cohesion and expert violation.',
  },
  {
    title: 'Creating objects in business logic instead of using Creator/Factory',
    wrong: `public class OrderService
{
    public void ProcessOrder(Order order)
    {
        var invoice = new Invoice(order.Id, order.Total, new Address("123 Main St")); // hard-coded creation
    }
}`,
    right: `// Creator: Invoice is created by the class that has initialisation data
// Or use a factory / builder registered via DI for complex construction`,
    explanation: 'Creating complex objects inline in business logic couples the service to the concrete class and its constructor signature. Use GRASP Creator (delegate to a containing/aggregating class) or Factory for complex construction.',
  },
  {
    title: 'High coupling from concrete class references instead of indirection',
    wrong: `public class ReportService
{
    private readonly SqlServerReportStore _store = new SqlServerReportStore("..."); // concrete + hard-coded
}`,
    right: `public class ReportService(IReportStore store) // Indirection via interface injection`,
    explanation: 'GRASP Indirection introduces an interface between the service and its dependency. This enables swapping the store (SQL → NoSQL, prod → mock) without changing ReportService — Protected Variations applied at the class level.',
  },
];

const challenge: Challenge = {
  title: 'Information Expert Assignment',
  language: 'typescript',
  description: `Apply GRASP Information Expert.
ShoppingCart contains CartItems (product, qty, price).
Assign: getTotal(), getItemCount(), getMostExpensiveItem() to the class that has the information.
CartItem should know its lineTotal.`,
  hints: [
    'CartItem knows its own qty and price — lineTotal belongs there',
    'ShoppingCart has all items — total and count belong in ShoppingCart',
    'getMostExpensiveItem uses CartItem.lineTotal — stays in ShoppingCart',
  ],
  starterCode: `class CartItem {
  constructor(public product: string, public qty: number, public price: number) {}
  // TODO: lineTotal property
}

class ShoppingCart {
  private items: CartItem[] = [];
  addItem(item: CartItem): void { this.items.push(item); }
  // TODO: getTotal(), getItemCount(), getMostExpensiveItem()
}`,
  solution: `class CartItem {
  constructor(public product: string, public qty: number, public price: number) {}
  // Information Expert: CartItem knows its own qty and price
  get lineTotal(): number { return this.qty * this.price; }
}

class ShoppingCart {
  private items: CartItem[] = [];

  addItem(item: CartItem): void { this.items.push(item); }

  // Information Expert: ShoppingCart has all items, so it calculates totals
  getTotal(): number { return this.items.reduce((sum, i) => sum + i.lineTotal, 0); }
  getItemCount(): number { return this.items.reduce((sum, i) => sum + i.qty, 0); }
  getMostExpensiveItem(): CartItem | undefined {
    return this.items.reduce((max, i) => !max || i.lineTotal > max.lineTotal ? i : max, undefined as CartItem | undefined);
  }
}

const cart = new ShoppingCart();
cart.addItem(new CartItem('Widget', 3, 9.99));
cart.addItem(new CartItem('Gadget', 1, 49.99));

console.log(cart.getTotal());               // 79.96
console.log(cart.getItemCount());           // 4
console.log(cart.getMostExpensiveItem()?.product); // Gadget`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'According to GRASP Information Expert, who should calculate an Order\'s total?',
    options: [
      'A separate TotalCalculatorService class',
      'The Order class — it has the items and their prices needed to calculate the total',
      'The controller that receives the HTTP request',
      'A shared utility class with static methods',
    ],
    answer: 1,
    explanation: 'Information Expert assigns a responsibility to the class with the information needed to fulfil it. Order has all its items and their prices — it is the natural expert for calculating its total. A separate TotalCalculatorService replicates this knowledge, creating Feature Envy.',
  },
  {
    q: 'What is a Pure Fabrication in GRASP?',
    options: [
      'A fake object used only for testing',
      'A class invented for low coupling that does not represent a concept in the domain model',
      'A domain entity with artificial constraints',
      'A pattern for creating objects without a constructor',
    ],
    answer: 1,
    explanation: 'Pure Fabrication is a class created specifically to achieve low coupling or high cohesion — it does not correspond to a concept in the real-world domain. OrderRepository, EmailService, and PaymentGateway are Pure Fabrications: necessary for clean architecture but not found in the problem domain.',
  },
  {
    q: 'GRASP Protected Variations says to identify variation points and:',
    options: [
      'Prevent them from ever changing by sealing classes',
      'Wrap them behind a stable interface so callers are shielded from the variation',
      'Document them in comments and leave them as-is',
      'Move all variation to a single configuration file',
    ],
    answer: 1,
    explanation: 'Protected Variations identifies points of instability (tax laws, payment providers, storage backends) and wraps them in a stable interface. Callers depend on the interface — when the variation changes (new tax rule, new payment provider), callers are unaffected. This is the architectural basis for OCP and Strategy.',
  },
  { q: 'What does GRASP stand for and what are its core principles?', options: ['General Refactoring and Software Patterns; guidelines for when to refactor existing code', 'General Responsibility Assignment Software Patterns; nine principles for assigning responsibilities to classes and objects in object-oriented design', 'Global Registry of Accepted Software Practices; industry-standard coding conventions', 'Granular Responsibility and Separation Principles; rules for splitting large classes'], answer: 1, explanation: 'GRASP (Craig Larman, Applying UML and Patterns) provides nine principles for deciding which class should handle which responsibility in object-oriented design. The nine patterns: Information Expert, Creator, Controller, Low Coupling, High Cohesion, Polymorphism, Pure Fabrication, Indirection, and Protected Variations. They answer: which class should own this responsibility? when designing a class structure. GRASP principles complement SOLID: SOLID focuses on what the code should look like; GRASP focuses on the reasoning process for assigning responsibilities during design.' },
  { q: 'What is the Information Expert principle in GRASP?', options: ['A class that contains the most lines of code is the information expert and should hold all business logic', 'Assign a responsibility to the class that has the information needed to fulfill it', 'The database model is the information expert for all data-related operations', 'Delegate responsibilities to external services that specialize in the relevant domain'], answer: 1, explanation: 'Information Expert: the class that owns the data should perform the operations on that data. If you need to calculate the total price of an order, the Order class has the order items and prices, so Order is the Information Expert and should calculate the total. Not a CustomerService or a static utility. This reduces the need to expose internal data: the class with the data handles its own calculations, keeping state and behavior together (encapsulation). Common violation: an anemic domain model where all behavior is in service classes and domain objects are pure data holders.' },
  { q: 'What is the Controller pattern in GRASP?', options: ['The Model-View-Controller pattern where the controller handles HTTP requests', 'A GRASP principle assigning system event handling to a class representing the system, a use-case scenario, or a facade controller that coordinates use-case work', 'A class that controls access to shared resources using mutexes', 'Any class with the word Controller in its name'], answer: 1, explanation: 'GRASP Controller assigns responsibility for handling incoming system events to a class that represents: a. The overall system or subsystem (Facade Controller). b. A use case scenario (Use Case Controller). The Controller receives events from the presentation layer and delegates to domain objects to fulfill the use case; it does not perform business logic itself. A bloated Controller that does too much is called a fat controller; it should delegate to domain classes following the Information Expert principle. The Controller is a coordination layer, not a logic layer.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do GRASP and SOLID relate to each other?',
    a: 'They complement each other from different angles. GRASP guides responsibility assignment during design ("which class should own this?"). SOLID guides class design and relationships ("how should this class be structured?"). GRASP Information Expert supports SOLID SRP. GRASP Protected Variations supports SOLID OCP. GRASP Low Coupling supports SOLID DIP. Together they provide a coherent set of design guidance for OOP.',
  },
  {
    q: 'Is GRASP still relevant in the era of microservices and functional programming?',
    a: 'Yes — GRASP principles apply wherever objects or services own responsibilities. In microservices, Information Expert guides which service owns an operation. Low Coupling guides service boundary design. Protected Variations guides API design. In functional programming, cohesion and coupling still apply to module and function organisation. The specific vocabulary differs but the underlying principles are timeless.',
  },
  { q: 'How does High Cohesion relate to the Single Responsibility Principle?', a: 'High Cohesion (GRASP) and Single Responsibility Principle (SOLID) express the same idea from different angles. High Cohesion: keep a class focused on a narrow set of closely related responsibilities; avoid classes that do many unrelated things (God Objects). Single Responsibility: a class should have only one reason to change. A class that handles user authentication, generates reports, and sends emails has low cohesion and multiple reasons to change. Splitting it into AuthenticationService, ReportGenerator, and EmailService gives each class high cohesion (focused) and a single responsibility. Both principles guide you toward smaller, focused, understandable classes.' },
  { q: 'How does overusing Pure Fabrication lead to an "anemic domain model," and how do you tell the difference between legitimate and excessive use?', a: 'Pure Fabrication is meant for responsibilities that genuinely do NOT belong on a domain concept (persistence, serialization, external API calls) — but teams sometimes over-apply the principle and extract EVERY behavior, including genuine business logic that should live on the domain object itself (e.g. an OrderPricingService that computes order totals, when that calculation is core domain behavior Order itself should own). The result is an anemic domain model: entities become pure data bags with no behavior, and all logic lives in a sprawl of "service" pure fabrications — the litmus test is whether the extracted responsibility is genuinely a technical/infrastructure concern (legitimate Pure Fabrication) versus core business behavior that just happened to be inconvenient to place on the entity (anemic-model smell).' },
  { q: 'How does Low Coupling guide dependency design in GRASP?', a: 'Low Coupling: minimize dependencies between classes. A class is highly coupled when it depends on many other classes, making changes ripple through the system. Strategies for Low Coupling: program to interfaces (depend on IOrderRepository not SqlOrderRepository). Use dependency injection so the class does not create its dependencies. Avoid accessing dependencies through other dependencies (Law of Demeter). Apply Facade or Mediator to reduce direct connections between many classes. Low Coupling and High Cohesion are complementary and often in tension: perfectly cohesive classes must collaborate, creating coupling. The goal is appropriate coupling, not zero coupling. Focus coupling on stable abstractions, not volatile implementations.' },
  { q: 'What is the Protected Variations principle in GRASP?', a: 'Protected Variations: identify points of variation or instability in the design and assign responsibilities to create a stable interface around them. If the storage mechanism might change (from SQL to NoSQL), protect code from this variation by introducing the IRepository interface. Code that uses IRepository is protected from the variation; only the concrete repository implementation changes. This principle generalizes the Open/Closed Principle and Liskov Substitution Principle: create stable abstractions that shield the rest of the system from changes in volatile parts. The plugin architecture, strategy pattern, and dependency inversion all implement Protected Variations for different kinds of instability.' },
];

const revision: RevisionSummary = {
  oneLiner: 'GRASP is 9 patterns for assigning responsibilities to classes — answering "who should own this?" with principles like Information Expert, Low Coupling, and Polymorphism.',
  mustKnow: [
    'Information Expert: assign responsibility to the class with the information to fulfil it',
    'Creator: the class that contains/aggregates B should create B',
    'Low Coupling + High Cohesion: minimal dependencies, related operations together',
    'Polymorphism: use interfaces/virtual methods for type variation — not switch statements',
    'Pure Fabrication: classes invented for low coupling (Repository, Service) not found in domain',
  ],
  interviewFocus: [
    'What is Information Expert and why does it prevent Feature Envy?',
    'What is Pure Fabrication and can you give an example?',
    'How do GRASP and SOLID complement each other?',
  ],
};

@Component({
  selector: 'app-dp-grasp',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './grasp.html',
  styleUrl: './grasp.scss',
})
export class DpGrasp {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
