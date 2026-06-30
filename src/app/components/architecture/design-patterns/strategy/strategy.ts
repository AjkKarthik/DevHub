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
  { name: 'Intent',    type: 'keyword',   desc: 'Define a family of algorithms, encapsulate each one, and make them interchangeable.' },
  { name: 'Strategy',  type: 'interface', desc: 'Common interface for all algorithm variants — declares the Execute/Sort/Calculate method.' },
  { name: 'Context',   type: 'class',     desc: 'Holds a reference to the current IStrategy and delegates the algorithm call to it.' },
  { name: 'OCP',       type: 'keyword',   desc: 'New algorithms are added as new classes — no modification to Context or existing strategies.' },
  { name: 'vs State',  type: 'keyword',   desc: 'Strategy: client chooses algorithm; strategies are independent. State: object auto-transitions; states know each other.' },
  { name: 'Func<T>',   type: 'keyword',   desc: 'Modern .NET: a delegate (Func, Action) can replace a full Strategy interface for simple algorithms.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Strategy Pattern?',
    points: [
      'Strategy defines a family of algorithms, encapsulates each in its own class, and makes them interchangeable.',
      'The Context holds a reference to an IStrategy and delegates the algorithm call to it.',
      'The client selects the appropriate strategy and injects it into the context.',
      'Strategies are independent of each other — adding a new algorithm requires only a new class.',
    ],
  },
  {
    heading: 'Why Strategy Over Conditionals',
    points: [
      'Without Strategy: if/switch on a "mode" or "type" field inside a method — violates OCP.',
      'With Strategy: each algorithm is a separate class; switching means injecting a different IStrategy.',
      'New algorithms never modify existing code — new class only.',
      'Each strategy is independently testable with its own unit tests.',
    ],
  },
  {
    heading: 'Modern .NET: Delegates as Strategies',
    points: [
      'For simple single-method strategies, a Func<TInput, TOutput> or delegate replaces the full interface.',
      'Array.Sort(IComparer<T>) and LINQ OrderBy(keySelector) are Strategy via Func/IComparer.',
      'When the algorithm has multiple methods or state, a full interface is still appropriate.',
      'DI containers can register named strategy implementations for runtime selection.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'IComparer<T> / Comparer<T>: sorting strategy — BubbleSort, QuickSort, merge sort.',
      'IEqualityComparer<T>: comparison strategy — by value, by reference, case-insensitive.',
      'IPasswordHasher<T> in ASP.NET Core Identity: pluggable hashing strategy.',
      'IHostedService scheduling: different retry/backoff strategies in Polly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Shipping Strategy',
    language: 'csharp',
    code: `// Strategy interface
public interface IShippingStrategy
{
    decimal CalculateCost(Order order);
    string  Name { get; }
}

// Concrete Strategies
public class StandardShipping : IShippingStrategy
{
    public string  Name => "Standard (5-7 days)";
    public decimal CalculateCost(Order order) => order.Weight * 0.50m + 2.99m;
}

public class ExpressShipping : IShippingStrategy
{
    public string  Name => "Express (2 days)";
    public decimal CalculateCost(Order order) => order.Weight * 1.50m + 9.99m;
}

public class OvernightShipping : IShippingStrategy
{
    public string  Name => "Overnight (next day)";
    public decimal CalculateCost(Order order) => order.Weight * 3.00m + 24.99m;
}

public class FreeShipping : IShippingStrategy
{
    public string  Name => "Free shipping";
    public decimal CalculateCost(Order order) => 0m;
}

// Context
public class ShippingCalculator(IShippingStrategy strategy)
{
    public decimal Calculate(Order order) => strategy.CalculateCost(order);
    public string  MethodName             => strategy.Name;
}

// Select strategy at runtime based on business rules
public IShippingStrategy SelectStrategy(Order order, Customer customer) =>
    (customer.IsPremium, order.Total) switch
    {
        (true,  _)      => new FreeShipping(),
        (false, > 100m) => new StandardShipping(),
        (false, _)      => new StandardShipping()
    };

// Usage
var order = new Order { Weight = 2.5m, Total = 150m };
var calc  = new ShippingCalculator(SelectStrategy(order, customer));
Console.WriteLine($"{calc.MethodName}: {calc.Calculate(order):C}");`,
  },
  {
    label: 'Sorting Strategies',
    language: 'csharp',
    code: `// IComparer<T> is Strategy — .NET BCL uses it everywhere

// Custom sort strategies
public class ProductByPriceAsc : IComparer<Product>
{
    public int Compare(Product? x, Product? y) =>
        x!.Price.CompareTo(y!.Price);
}

public class ProductByNameDesc : IComparer<Product>
{
    public int Compare(Product? x, Product? y) =>
        string.Compare(y!.Name, x!.Name, StringComparison.Ordinal);
}

public class ProductByRating : IComparer<Product>
{
    public int Compare(Product? x, Product? y) =>
        y!.Rating.CompareTo(x!.Rating); // descending
}

// Context: List.Sort accepts any IComparer<T>
var products = GetProducts();
products.Sort(new ProductByPriceAsc());   // cheapest first
products.Sort(new ProductByRating());     // best rated first

// Modern equivalent: delegates as strategies (no class needed)
products.Sort(Comparer<Product>.Create((a, b) => a.Price.CompareTo(b.Price)));

// LINQ: OrderBy is Strategy via keySelector delegate
var sorted = products
    .OrderBy(p => p.Price)
    .ThenByDescending(p => p.Rating);`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Strategies knowing about each other',
    wrong: `public class ExpressShipping : IShippingStrategy
{
    // Checks whether StandardShipping would be cheaper — strategies must be independent
    public decimal Calculate(Order o) =>
        new StandardShipping().Calculate(o) < 9.99m ? new StandardShipping().Calculate(o) : 9.99m;
}`,
    right: `// Each strategy is independent — no references to other strategies
public class ExpressShipping : IShippingStrategy
{
    public decimal Calculate(Order o) => o.Weight * 1.5m + 9.99m;
}`,
    explanation: 'Strategy classes must be independent of each other. Cross-strategy knowledge creates coupling — comparison logic belongs in the client or a strategy selector, not inside a strategy.',
  },
  {
    title: 'Putting context-specific logic inside a strategy',
    wrong: `public decimal Calculate(Order order)
{
    if (order.Customer.IsPremium) return 0; // context logic inside strategy!
    return order.Weight * 0.5m;
}`,
    right: `// Context-aware selection happens outside — strategies are pure algorithms
IShippingStrategy strategy = customer.IsPremium ? new FreeShipping() : new StandardShipping();`,
    explanation: 'Strategies implement algorithms, not business rules about when to apply them. Customer-tier logic belongs in the strategy selector/factory, not inside the strategy.',
  },
  {
    title: 'Using full Strategy when a delegate suffices',
    wrong: `public interface ISortKey<T> { int Compare(T a, T b); }
public class AlphaSort : ISortKey<string> { public int Compare(string a, string b) => string.Compare(a, b); }`,
    right: `list.Sort((a, b) => string.Compare(a, b)); // lambda IS a strategy`,
    explanation: 'For single-method, stateless algorithms, a delegate (Func, Action, Comparison<T>) is cleaner and requires no extra class. Use a full interface when the strategy has multiple methods or needs to maintain state.',
  },
  {
    title: 'Not injecting the strategy — hard-coding it in Context',
    wrong: `public class Sorter { private readonly ISortStrategy _s = new BubbleSort(); }`,
    right: `public class Sorter(ISortStrategy strategy) { private readonly ISortStrategy _s = strategy; }`,
    explanation: 'Hard-coding the strategy defeats the pattern. The strategy must be injectable — either via constructor, property, or method — so it can be swapped without modifying the Context.',
  },
];

const challenge: Challenge = {
  title: 'Discount Strategy',
  language: 'typescript',
  description: `Implement a discount calculator using Strategy pattern.
IDiscountStrategy has calculate(price: number): number.
Strategies: NoDiscount, PercentageDiscount(pct), FixedDiscount(amount), BuyOneGetOneDiscount.
PriceCalculator uses the injected strategy.`,
  hints: [
    'Each strategy implements calculate(price) returning the final price',
    'PriceCalculator holds IDiscountStrategy',
    'BuyOneGetOne: buy 1 get 1 free = pay half price',
  ],
  starterCode: `interface IDiscountStrategy {
  calculate(price: number): number;
  name: string;
}

class PriceCalculator {
  constructor(private strategy: IDiscountStrategy) {}
  getFinalPrice(price: number): number { return this.strategy.calculate(price); }
  getStrategyName(): string { return this.strategy.name; }
}

// TODO: NoDiscount, PercentageDiscount, FixedDiscount, BuyOneGetOneDiscount`,
  solution: `interface IDiscountStrategy {
  calculate(price: number): number;
  name: string;
}

class NoDiscount implements IDiscountStrategy {
  name = 'No Discount';
  calculate(price: number): number { return price; }
}

class PercentageDiscount implements IDiscountStrategy {
  name: string;
  constructor(private pct: number) { this.name = \`\${pct}% Off\`; }
  calculate(price: number): number { return price * (1 - this.pct / 100); }
}

class FixedDiscount implements IDiscountStrategy {
  name: string;
  constructor(private amount: number) { this.name = \`\$\${amount} Off\`; }
  calculate(price: number): number { return Math.max(0, price - this.amount); }
}

class BuyOneGetOneDiscount implements IDiscountStrategy {
  name = 'Buy One Get One Free';
  calculate(price: number): number { return price / 2; }
}

class PriceCalculator {
  constructor(private strategy: IDiscountStrategy) {}
  getFinalPrice(price: number): number { return this.strategy.calculate(price); }
  getStrategyName(): string { return this.strategy.name; }
}

const price = 100;
[new NoDiscount(), new PercentageDiscount(20), new FixedDiscount(15), new BuyOneGetOneDiscount()]
  .forEach(s => {
    const calc = new PriceCalculator(s);
    console.log(\`\${calc.getStrategyName()}: \$\${calc.getFinalPrice(price).toFixed(2)}\`);
  });`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the core benefit of Strategy over if/switch on an algorithm type?',
    options: [
      'Strategy is always faster at runtime',
      'New algorithms are added as new classes without modifying the Context or existing strategies (OCP)',
      'Strategy prevents all invalid algorithm selections',
      'Strategy automatically selects the best algorithm at runtime',
    ],
    answer: 1,
    explanation: 'Strategy follows the Open/Closed Principle: new algorithm variants are new classes — existing code is unchanged. A switch statement requires editing an existing method every time a new variant is added.',
  },
  {
    q: 'LINQ\'s `OrderBy(keySelector)` demonstrates Strategy via:',
    options: ['Abstract class inheritance', 'A delegate (Func<T, TKey>) as the strategy', 'A virtual method override', 'A static factory method'],
    answer: 1,
    explanation: 'OrderBy accepts a key selector delegate — a lambda IS a Strategy for "how to extract the sort key". Func<T, TKey> replaces the need for an IKeyExtractor<T> interface for this simple, stateless algorithm.',
  },
  {
    q: 'When is a Func<T> delegate preferable to a full IStrategy interface?',
    options: [
      'Never — always use a full interface for clarity',
      'When the strategy has a single method with no state to maintain',
      'When performance is critical',
      'When the strategy needs to be serialised',
    ],
    answer: 1,
    explanation: 'A Func<T> or delegate is preferable for single-method, stateless strategies — it is simpler and avoids creating a class. Use a full interface when the strategy has multiple related methods, needs state, or requires DI registration.',
  },
  { q: 'What is the Strategy pattern and what does it enable?', options: ['A long-term plan for software architecture evolution', 'A behavioral pattern that defines a family of algorithms, encapsulates each one, and makes them interchangeable, enabling the algorithm to vary independently of the clients that use it', 'A pattern for implementing parallel execution strategies in threading frameworks', 'A caching strategy pattern for managing multiple cache backends'], answer: 1, explanation: 'Strategy encapsulates algorithms behind a common interface. The context holds a reference to the strategy interface and delegates algorithm execution to it. The client selects which concrete strategy to use. Without Strategy: the context contains a switch statement choosing an algorithm implementation. Adding a new algorithm requires modifying the context. With Strategy: add a new ConcreteStrategy class; no modification to the context or existing strategies. Classic examples: sorting algorithms (QuickSort, MergeSort, BubbleSort), payment methods (CreditCard, PayPal, Bitcoin), discount strategies, compression algorithms.' },
  { q: 'How does Strategy support the Open/Closed Principle?', options: ['It makes algorithms closed for extension and open for modification', 'New algorithms can be added by creating new ConcreteStrategy classes without modifying the context or existing strategies', 'Strategy requires modifying the interface for each new algorithm', 'Strategy only applies to a fixed set of algorithms defined at design time'], answer: 1, explanation: 'OCP applied to Strategy: the context is closed for modification (no changes when adding new algorithms). The system is open for extension via new ConcreteStrategy implementations. Adding a new payment method: create BankTransferStrategy implementing IPaymentStrategy. Register it. The PaymentContext does not change. Existing strategies do not change. Tests for existing strategies still pass. This is the key benefit over switch statements: the context does not grow with new algorithm additions.' },
  { q: 'What is the difference between Strategy and Template Method for varying algorithms?', options: ['Strategy uses inheritance; Template Method uses composition', 'Strategy uses composition to swap algorithms; Template Method uses inheritance to let subclasses override specific steps of an algorithm defined in the base class', 'Template Method allows runtime algorithm swapping; Strategy requires compile-time selection', 'They are identical patterns expressing the same concept differently'], answer: 1, explanation: 'Template Method: the base class defines the overall algorithm structure (template). Specific steps are declared as abstract or overridable methods. Subclasses override the steps without changing the overall flow. Uses inheritance. Variation is per subclass at compile time. Strategy: the algorithm is encapsulated entirely in interchangeable strategy objects. The context holds a reference and can swap strategies at runtime. Uses composition. Variation is at runtime. Template Method is simpler when the variation is in a few steps of a fixed overall process. Strategy is more flexible when the entire algorithm varies and runtime swapping is needed.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you select strategies at runtime in ASP.NET Core DI?',
    a: 'Register all strategies with their concrete types and also register a factory or dictionary mapping keys to strategy types. Alternatively, use the "named service" pattern: register all IShippingStrategy implementations with a key (AddKeyedScoped<IShippingStrategy, ExpressShipping>("express")) and resolve by key. Scrutor\'s Decorate also helps compose strategies.',
  },
  {
    q: 'Can strategies have state?',
    a: 'Yes — strategies can hold configuration state set at construction time (e.g., PercentageDiscount(20) holds the 20%). They should not hold mutable per-call state that persists across calls — that would make them non-reentrant. If per-call state is needed, use local variables inside the Execute() method, not instance fields.',
  },
  { q: 'How is Strategy used in sorting and comparison in standard libraries?', a: 'Strategy for comparison/sorting: Java Comparator<T> is a strategy interface for comparison algorithms. Collections.sort(list, new NaturalOrderComparator()) or list.sort(Comparator.reverseOrder()). C# IComparer<T> and the comparer parameter in Array.Sort() serve the same purpose. These allow sorting the same collection in different orders without modifying the collection or the sorting algorithm. Java lambda functions and method references implement IComparer/Comparator inline without separate classes. This is the Strategy pattern with functional programming syntax: the strategy is passed as a lambda rather than as a named class.' },
  { q: 'When is it better to use lambdas/functions rather than Strategy classes?', a: 'In modern languages with first-class functions, a strategy interface with a single method can be replaced by a function type. Java: Comparator<T> (functional interface) passed as a lambda. C#: Func<T,TResult> or a delegate. Python: any callable. Use class-based strategies when: the strategy needs state (constructor parameters). Multiple methods are needed on the strategy interface. The strategy has a meaningful name in the domain vocabulary (PercentageDiscountStrategy is more expressive than Func<Order,decimal>). Use function-based strategies (lambdas) for: simple, stateless single-method algorithms. Ad hoc or inline configuration of algorithms. Both are valid Strategy implementations; choose based on complexity and readability.' },
  { q: 'How does the Strategy pattern apply to dependency injection?', a: 'Strategy and DI work naturally together. Define the strategy interface in the application layer. Register all concrete strategies in the DI container. Inject the desired strategy into the context. For selecting among multiple registered strategies: use a factory or strategy selector service that receives all IPaymentStrategy registrations (enumerable injection in .NET: IEnumerable<IPaymentStrategy>). The selector filters by a key or condition to pick the appropriate strategy for a given input. Named service registration (Keyed Services in .NET 8+): services.AddKeyedScoped<IPaymentStrategy, CreditCardStrategy>("creditcard"). Inject by key: context.GetKeyedService<IPaymentStrategy>("creditcard").' },
  { q: 'What are the signs that you need the Strategy pattern?', a: 'Signs: a context class contains a large switch or if-else block selecting among several algorithms or behaviors based on a type or mode. Adding a new algorithm requires modifying the context class (OCP violation). Algorithm implementations are tested directly in the context class tests, mixing concerns. The same algorithm combination appears in multiple context classes (duplication). Clients want to configure which algorithm to use (different users, environments, or configurations). When you see these signs, extract each branch of the switch into its own ConcreteStrategy class, define a common interface, and inject the appropriate strategy. The context becomes algorithm-agnostic.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Strategy encapsulates a family of interchangeable algorithms — the client selects and injects one, following OCP: new algorithms require no changes to existing code.',
  mustKnow: [
    'Context holds IStrategy and delegates the algorithm call to it',
    'Strategies are independent — no cross-strategy references',
    'Client selects the strategy; strategy selector logic is external to the strategies',
    'For single-method stateless algorithms, Func/delegate replaces the full interface',
    '.NET: IComparer<T>, IEqualityComparer<T>, IPasswordHasher<T>, Polly policies',
  ],
  interviewFocus: [
    'Strategy vs State — key structural and intent difference?',
    'When is a delegate (Func) preferable to a full Strategy interface?',
    'How do you register and select multiple strategies in ASP.NET Core DI?',
  ],
};

@Component({
  selector: 'app-dp-strategy',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './strategy.html',
  styleUrl: './strategy.scss',
})
export class DpStrategy {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
