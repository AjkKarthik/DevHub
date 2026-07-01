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
  { name: 'DRY',   type: 'keyword', desc: "Don't Repeat Yourself — every piece of knowledge must have a single, authoritative representation in the system." },
  { name: 'KISS',  type: 'keyword', desc: 'Keep It Simple, Stupid — favour simple solutions; avoid unnecessary complexity.' },
  { name: 'YAGNI', type: 'keyword', desc: "You Aren't Gonna Need It — don't implement something until it is actually needed." },
  { name: 'WET',   type: 'keyword', desc: "Write Everything Twice / We Enjoy Typing — the violation of DRY; duplicated knowledge scattered across the codebase." },
  { name: 'Rule of Three', type: 'keyword', desc: 'Abstract only when you see the same pattern three times — not after two occurrences.' },
  { name: 'DAMP',  type: 'keyword', desc: 'Descriptive And Meaningful Phrases — in TESTS, some repetition is acceptable for clarity and independence.' },
];

const theory: TheoryPoint[] = [
  {
    heading: "DRY — Don't Repeat Yourself",
    points: [
      '"Every piece of knowledge must have a single, unambiguous, authoritative representation within a system." — The Pragmatic Programmer.',
      'DRY is about knowledge, not code. Two loops doing different things are not DRY violations. Two places encoding the same business rule ARE.',
      'Duplication forces every change to be made in multiple places — a bug fixed in one place remains in another.',
      'DRY does not mean "never write similar code" — it means the same fact or decision should not exist in two places.',
    ],
  },
  {
    heading: 'KISS — Keep It Simple',
    points: [
      'Simple code is easier to read, debug, test, and maintain than complex code that does the same thing.',
      'Complexity is the enemy of reliability — every layer of abstraction, every interface, every indirection adds surface for bugs.',
      'KISS does not mean "write no abstractions" — it means each abstraction must earn its place by solving a real problem.',
      'Ask: "Is there a simpler way to achieve the same result?" If yes, use it.',
    ],
  },
  {
    heading: "YAGNI — You Aren't Gonna Need It",
    points: [
      'Do not implement features or abstractions until they are actually required by a real use case.',
      'Every line of code that is not needed: costs to write, costs to read, costs to test, costs to maintain, and may be wrong.',
      'YAGNI is a response to speculative generality — building flexibility for hypothetical future requirements.',
      'Work iteratively: implement what is needed now, refactor when the next real requirement arrives.',
    ],
  },
  {
    heading: 'Balancing DRY, KISS, and YAGNI',
    points: [
      'Over-applying DRY can hurt KISS: premature abstraction creates complexity to eliminate minor duplication.',
      'YAGNI prevents speculative abstractions that violate KISS without meeting real needs.',
      'Rule of Three: abstract when you see the same pattern three times — two occurrences may be coincidence.',
      'In tests: prefer DAMP (Descriptive And Meaningful Phrases) — test independence and clarity are worth some repetition.',
    ],
  },
  {
    heading: 'Balancing DRY Against Premature Abstraction',
    points: [
      'DRY (Don\'t Repeat Yourself) is often over-applied to superficially similar code that is not actually conceptually the same — two pieces of code that look alike today but represent genuinely different business concepts will likely diverge over time, and prematurely unifying them creates a shared abstraction that must awkwardly branch as they diverge.',
      'The "rule of three" (wait until a pattern repeats three times before extracting a shared abstraction) is a pragmatic heuristic against premature DRY — two occurrences might be coincidental similarity, while three genuinely suggests an underlying reusable pattern worth abstracting.',
      'A shared abstraction created too early, before its actual variation points are understood, tends to accumulate special-case branches and flags over time as new requirements reveal that the "shared" logic was not actually as universal as originally assumed — sometimes worse than the duplication it was meant to eliminate.',
      'DRY should apply to KNOWLEDGE and business rules, not merely to code that happens to look textually similar — two pieces of code that coincidentally have identical logic today but represent different business rules should remain separate, since they are conceptually independent even if currently identical.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'DRY in Practice',
    language: 'csharp',
    code: `// ── DRY Violation ─────────────────────────────────────────────────────────────

// Tax rate defined in three places — change one, bug in two others
public class InvoiceService
{
    public decimal CalculateTax(decimal subtotal) => subtotal * 0.20m; // 20% VAT
}

public class OrderService
{
    public decimal GetTaxAmount(decimal total) => total * 0.20m; // same rule, duplicated
}

public class ReportService
{
    public string FormatTaxLine(decimal amount) =>
        $"VAT (20%): {amount * 0.20m:C}"; // same rule, third time
}

// ── DRY Fix ───────────────────────────────────────────────────────────────────

// Single authoritative source for the tax rate
public static class TaxPolicy
{
    public const decimal VatRate = 0.20m;
    public static decimal Apply(decimal amount) => amount * VatRate;
    public static string Label => $"VAT ({VatRate:P0})";
}

public class InvoiceService
{
    public decimal CalculateTax(decimal subtotal) => TaxPolicy.Apply(subtotal);
}
public class OrderService
{
    public decimal GetTaxAmount(decimal total) => TaxPolicy.Apply(total);
}
public class ReportService
{
    public string FormatTaxLine(decimal amount) =>
        $"{TaxPolicy.Label}: {TaxPolicy.Apply(amount):C}";
}

// Now changing the rate to 23% requires ONE change: TaxPolicy.VatRate = 0.23m

// ── DRY vs Code Similarity ────────────────────────────────────────────────────

// Two loops with similar code — NOT a DRY violation (different knowledge)
public decimal SumOrderTotals(IEnumerable<Order> orders) =>
    orders.Sum(o => o.Total);

public int CountActiveUsers(IEnumerable<User> users) =>
    users.Count(u => u.IsActive);
// These happen to look similar but encode DIFFERENT domain knowledge — do NOT abstract them`,
  },
  {
    label: 'KISS & YAGNI',
    language: 'csharp',
    code: `// ── KISS Violation ───────────────────────────────────────────────────────────

// Over-engineered ID generation when Guid.NewGuid() is sufficient
public class IdGeneratorFactory
{
    public static IIdGenerator Create(IdGenerationStrategy strategy) => strategy switch
    {
        IdGenerationStrategy.Sequential  => new SequentialIdGenerator(),
        IdGenerationStrategy.Random      => new RandomIdGenerator(),
        IdGenerationStrategy.TimeStamped => new TimestampedIdGenerator(),
        _ => throw new ArgumentException("Unknown strategy")
    };
}
// Usage: IdGeneratorFactory.Create(IdGenerationStrategy.Random).Generate()
// When you just need: Guid.NewGuid() ← KISS

// ── KISS Fix ──────────────────────────────────────────────────────────────────
public Guid GenerateId() => Guid.NewGuid(); // or just inline it

// ── YAGNI Violation ───────────────────────────────────────────────────────────

// "We might need multiple databases someday" — built before any requirement exists
public interface IDatabaseProvider { DbConnection Connect(string connStr); }
public class SqlProvider : IDatabaseProvider { /*...*/ }
public class MongoProvider : IDatabaseProvider { /*...*/ }
public class CassandraProvider : IDatabaseProvider { /*...*/ }
public class DatabaseProviderFactory { /*...*/ }
// The app has ONE database and no plans to change it

// ── YAGNI Fix ─────────────────────────────────────────────────────────────────

// Build what you need now — refactor when you actually need to swap
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connStr));
// If you ever need Postgres, the change is ONE line in DI registration.

// ── Appropriate Abstraction (DRY + KISS balanced) ─────────────────────────────

// Three services need retry logic — abstract it (Rule of Three, real need)
public static class RetryPolicy
{
    public static async Task<T> ExecuteAsync<T>(
        Func<Task<T>> action, int maxAttempts = 3, TimeSpan? delay = null)
    {
        var d = delay ?? TimeSpan.FromSeconds(1);
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try   { return await action(); }
            catch { if (attempt == maxAttempts) throw; await Task.Delay(d); }
        }
        throw new UnreachableException();
    }
}

// Or use Polly — the library is the KISS answer to retry
var pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions { MaxRetryAttempts = 3 })
    .Build();`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Premature DRY — abstracting before the third occurrence',
    wrong: `// Two methods look similar after 10 minutes of coding
// Immediately extract to a base class or shared helper "to be DRY"
// Result: wrong abstraction that the third real use case doesn't fit`,
    right: `// Wait for the third occurrence (Rule of Three) before abstracting
// Accept some duplication early; the right abstraction becomes clear with more examples`,
    explanation: 'Premature abstraction is worse than duplication. Two similar things might be coincidence — the right abstraction only becomes clear after three real examples. Abstract too early and you create the wrong abstraction that blocks future changes.',
  },
  {
    title: 'YAGNI: Building plugin systems, event buses, or multi-tenancy speculatively',
    wrong: `// "Let's make it multi-tenant from day one just in case"
// Adds TenantId to every table, every query, every DTO — before any tenant exists`,
    right: `// Build single-tenant first; add multi-tenancy when a real customer requires it
// The cost of adding it later is much less than the cost of maintaining unused complexity`,
    explanation: 'Every speculative feature has carrying costs: more code to maintain, more bugs to fix, more cognitive load for every developer who reads the code. YAGNI says: pay the refactoring cost later, when you have a concrete requirement and can design it correctly.',
  },
  {
    title: 'Confusing DRY with "no similar-looking code"',
    wrong: `// Two validators that look alike
bool IsValidEmail(string email) => email.Contains('@');
bool IsValidUsername(string name) => name.Length >= 3;
// Merged "to be DRY": bool IsValid(string value, ValidationType t) — wrong abstraction`,
    right: `bool IsValidEmail(string email)    => email.Contains('@');
bool IsValidUsername(string name)  => name.Length >= 3;
// Different knowledge — keep separate even if they look similar`,
    explanation: 'DRY is about knowledge duplication, not code similarity. Two methods that look alike but encode different business rules are NOT a DRY violation. Merging them creates a coupled abstraction that\'s harder to change independently.',
  },
  {
    title: 'KISS violation: over-engineering with unnecessary design patterns',
    wrong: `// A to-do list app with Repository, UoW, CQRS, Event Sourcing, Saga, and Outbox
// For a single-user app with 20 items`,
    right: `// A to-do list app with a List<Todo> and a JSON file
// Add patterns when real complexity demands them`,
    explanation: 'Design patterns solve real problems — applying them speculatively to a simple problem is a KISS and YAGNI violation. Start simple; introduce patterns only when you hit the specific problem they address.',
  },
];

const challenge: Challenge = {
  title: 'Refactor WET to DRY',
  language: 'typescript',
  description: `Refactor the following WET (duplicated) code to DRY.
Three functions all apply a percentage discount to a price.
applyMemberDiscount (10%), applyEmployeeDiscount (20%), applyVipDiscount (30%).
Extract a shared applyDiscount(price, percent) utility and update the three functions.`,
  hints: [
    'The discount formula is price * (1 - percent/100) — the same knowledge in three places',
    'Extract to applyDiscount(price, pct) function',
    'The three functions become one-liners calling the shared function',
  ],
  starterCode: `function applyMemberDiscount(price: number): number {
  return price * (1 - 10 / 100); // 10% discount
}

function applyEmployeeDiscount(price: number): number {
  return price * (1 - 20 / 100); // 20% discount
}

function applyVipDiscount(price: number): number {
  return price * (1 - 30 / 100); // 30% discount
}

console.log(applyMemberDiscount(100));   // 90
console.log(applyEmployeeDiscount(100)); // 80
console.log(applyVipDiscount(100));      // 70`,
  solution: `// DRY: single authoritative implementation of discount logic
function applyDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
}

// Named functions still provide intent — they delegate to the shared logic
const applyMemberDiscount   = (price: number) => applyDiscount(price, 10);
const applyEmployeeDiscount = (price: number) => applyDiscount(price, 20);
const applyVipDiscount      = (price: number) => applyDiscount(price, 30);

console.log(applyMemberDiscount(100));   // 90
console.log(applyEmployeeDiscount(100)); // 80
console.log(applyVipDiscount(100));      // 70

// Now changing the formula (e.g. add tax after discount) requires ONE change
// in applyDiscount — not three changes in three functions`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'DRY says "Every piece of knowledge must have a single representation." This means:',
    options: [
      'Never write two loops that look similar',
      'Every business rule or decision should exist in exactly one place — changing it means one change',
      'All code must be put in a single file',
      'Functions can never share the same name',
    ],
    answer: 1,
    explanation: 'DRY is about knowledge, not code. Two loops that look similar but encode different rules are not DRY violations. Two places encoding the same business rule (tax rate, validation logic) ARE violations — a change to the rule requires finding and updating all copies.',
  },
  {
    q: 'What is YAGNI and when should you apply it?',
    options: [
      'A design pattern for building optional features; apply it when requirements are clear',
      'A principle to avoid implementing features until they are actually needed; apply when tempted to build speculative functionality',
      'A refactoring technique to remove unused code after project completion',
      'A testing principle that reduces test coverage to the minimum',
    ],
    answer: 1,
    explanation: 'YAGNI (You Aren\'t Gonna Need It) says don\'t implement something until a real requirement demands it. Every unneeded feature costs to write, read, test, and maintain — and is often wrong because future requirements differ from speculation. Implement the simplest thing that works now.',
  },
  {
    q: 'The "Rule of Three" says you should abstract when:',
    options: [
      'You write the same line three times in a single method',
      'You see the same pattern or knowledge duplicated three times across the codebase',
      'A class has more than three methods',
      'A function is called from more than three places',
    ],
    answer: 1,
    explanation: 'The Rule of Three: the first time you write something, just write it. The second time you write something similar, note the duplication. The third time you see it, abstract it. Two occurrences may be coincidence; three occurrences reveal a real pattern worth abstracting.',
  },
  { q: 'What does DRY stand for and what is its core principle?', options: ['Design Refactoring Yearly; code should be refactored every year', 'Do not Repeat Yourself; every piece of knowledge should have a single, unambiguous, authoritative representation in the system', 'Delete Redundant Yield; generators should not produce duplicate values', 'Distribute Responsibility Yearly; responsibilities should be reassigned annually'], answer: 1, explanation: 'DRY: Do not Repeat Yourself (Andy Hunt and Dave Thomas, The Pragmatic Programmer). Every piece of knowledge — business logic, algorithm, configuration, schema definition — should have one authoritative home. Duplication means that when the knowledge changes, you must remember to update every copy. DRY is about knowledge duplication, not code duplication: two pieces of identical-looking code that represent different concepts are not DRY violations. Conversely, the same business rule expressed in different ways in different modules is a DRY violation even if the code looks different.' },
  { q: 'What is the YAGNI principle and when does violating it cause problems?', options: ['You Always Get New Issues; problems are inevitable in software', 'You Ain not Gonna Need It; do not add functionality until you actually need it, because speculative features waste time and add complexity that may never be needed', 'Your Application Gets New Interfaces; interfaces should be updated with each release', 'You Always Generate New Ideas; brainstorm before implementing'], answer: 1, explanation: 'YAGNI warns against building speculative features because they waste time and add complexity that may never be justified. Common problems: you spend time on something never used. The speculative abstraction adds complexity making the system harder to change. When the real requirement arrives, it differs from what was anticipated, requiring a rewrite anyway. The premature abstraction may create a poor foundation. YAGNI is especially relevant for premature abstractions, generic frameworks, and configurable options where only one value is ever used.' },
  { q: 'What is the KISS principle and why does complexity emerge without it?', options: ['Keep It Simple and Stupid; simplicity is more important than correctness', 'Keep It Simple, Stupid; prefer the simplest solution that works; avoid unnecessary complexity in design and implementation', 'Keep Interfaces Separated and Stable; interface changes break clients', 'Keep Iterations Short and Safe; releases should be small and low-risk'], answer: 1, explanation: 'KISS: Keep It Simple, Stupid (from Kelly Johnson). Simple code is easier to read, test, debug, and change. Complexity emerges from: over-engineering (adding configurability and abstractions for hypothetical future scenarios), premature optimization (complex cache invalidation when simple loading is fast enough), clever code (short but incomprehensible one-liners), and unnecessary patterns (Factory pattern for a class with only one implementation). KISS does not mean never use patterns or abstractions; it means do not add complexity without a clear, current justification.' },
];

const qna: QnaItem[] = [
  {
    q: 'When is duplicating code acceptable (violating DRY intentionally)?',
    a: 'Intentional duplication is acceptable when: (1) the code looks similar but encodes different knowledge — forced abstraction would couple things that evolve independently, (2) in tests — DAMP (Descriptive And Meaningful) test code prioritises readability and independence over DRY, (3) different bounded contexts — microservices intentionally duplicate domain models to avoid shared coupling, (4) the abstraction cost exceeds the duplication cost for rare-change code.',
  },
  {
    q: 'How do DRY, KISS, and YAGNI conflict with each other?',
    a: 'They can conflict: KISS says keep it simple; DRY may require abstraction that adds complexity. YAGNI says don\'t build for the future; DRY abstractions can be forward-thinking infrastructure. Resolution: apply them in order — YAGNI first (only build what\'s needed), then DRY (within what you build, eliminate duplication), then KISS (the simplest implementation that satisfies both). Never sacrifice KISS for speculative DRY.',
  },
  { q: 'What is the difference between DRY and WET code?', a: 'WET: Write Everything Twice (or We Enjoy Typing or Waste Every Time). WET code has duplicated logic scattered across the codebase. When a business rule changes, you hunt for every copy and update each one, inevitably missing some and introducing inconsistency bugs. DRY code centralizes the logic: the business rule lives in one function, class, or module. Changing it updates all consumers automatically. DRY applies to knowledge, not just code: the database schema should not be duplicated in both a migration script and a domain object definition without code generation linking them. Configuration values should not appear in both the config file and hardcoded in the application.' },
  { q: 'When is code duplication acceptable and not a DRY violation?', a: 'Duplication is acceptable when: two pieces of code look identical but represent different concepts that will evolve independently. Forcing DRY abstraction on them creates artificial coupling: changing one concept requires modifying shared code affecting the other. Tests can have intentionally duplicated setup for clarity: each test should be understandable in isolation, and extracting shared setup into helpers can reduce this. Copy-paste during exploration before the design is clear — refactor after the pattern emerges, not before. The rule of three: wait until three instances of similar code exist before abstracting; premature abstraction on two instances often produces the wrong abstraction.' },
  { q: 'How do you apply YAGNI when designing for extensibility?', a: 'YAGNI does not mean never design for extensibility; it means design for extensibility only when you have a concrete near-term need. If you know you will have three database providers in the next sprint, abstract the interface now. If you might need a fourth provider someday, do not add a plugin architecture today. Practical approach: write the simplest code that solves the current problem. When you add the second implementation of something, refactor toward an abstraction. Design the abstraction from real examples, not hypothetical ones. The cost of abstracting too early is a poor abstraction that must be undone. The cost of abstracting too late is a refactor — which is manageable because you have real examples to base the design on.' },
  { q: 'How do SOLID principles relate to DRY, KISS, and YAGNI?', a: 'They complement each other from different angles. DRY enforces the Single Responsibility Principle: if the same logic appears in two places, neither truly owns it. Centralizing it into one class gives that class clear ownership. YAGNI aligns with the Interface Segregation Principle: do not add interface methods you do not need yet. KISS supports all SOLID principles by discouraging the over-engineering that often accompanies applying SOLID blindly. The Open/Closed Principle can conflict with YAGNI: designing for extension requires anticipating future needs. The resolution: apply Open/Closed at boundaries where extension is clearly expected (plugin systems, report generators) and apply YAGNI elsewhere.' },
];

const revision: RevisionSummary = {
  oneLiner: 'DRY eliminates duplicated knowledge; KISS prefers simplicity over complexity; YAGNI avoids building things until genuinely needed — together they keep codebases lean and maintainable.',
  mustKnow: [
    'DRY is about knowledge duplication, not code similarity — same business rule in two places is the violation',
    'KISS: every abstraction must earn its place — is there a simpler solution?',
    'YAGNI: speculative features have carrying costs; implement only what real requirements demand',
    'Rule of Three: wait for the third occurrence before abstracting',
    'In tests: prefer DAMP over DRY — test clarity and independence matter more than shared helpers',
  ],
  interviewFocus: [
    'What is the difference between DRY and "no duplicated code"?',
    'When is intentionally duplicating code the right choice?',
    'How do DRY and YAGNI conflict, and how do you resolve the tension?',
  ],
};

@Component({
  selector: 'app-dp-dry-kiss-yagni',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './dry-kiss-yagni.html',
  styleUrl: './dry-kiss-yagni.scss',
})
export class DpDryKissYagni {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
