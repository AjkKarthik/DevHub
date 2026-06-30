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
  { name: 'Intent',          type: 'keyword', desc: 'Define the skeleton of an algorithm in a base class, deferring some steps to subclasses.' },
  { name: 'Template Method', type: 'method',  desc: 'The final/sealed method in the base class that calls abstract/virtual hook methods in order.' },
  { name: 'Abstract Steps',  type: 'method',  desc: 'Steps declared abstract — subclasses MUST implement them.' },
  { name: 'Hook Methods',    type: 'method',  desc: 'Virtual methods with default implementations — subclasses MAY override them.' },
  { name: 'Hollywood Principle', type: 'keyword', desc: '"Don\'t call us, we\'ll call you" — base class calls subclass methods, not the other way around.' },
  { name: 'vs Strategy',     type: 'keyword', desc: 'Template Method uses inheritance; Strategy uses composition. Template Method is compile-time; Strategy is runtime.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is Template Method?',
    points: [
      'Template Method defines the skeleton of an algorithm in the base class and lets subclasses fill in specific steps.',
      'The template method itself is sealed (final) — the overall algorithm order cannot be changed.',
      'Abstract methods force subclasses to provide specific steps.',
      'Hook methods have default implementations — subclasses override them when needed.',
    ],
  },
  {
    heading: 'Hollywood Principle',
    points: [
      '"Don\'t call us, we\'ll call you" — the base class controls the algorithm flow and calls subclass methods.',
      'Subclasses do not call the template method; the base class calls their overrides.',
      'This inverts the typical inheritance direction: the base class is the orchestrator.',
      'Subclasses can only customise designated steps — not the overall flow.',
    ],
  },
  {
    heading: 'Template Method vs Strategy',
    points: [
      'Template Method: uses inheritance — variation at compile time; subclass chooses which steps to override.',
      'Strategy: uses composition — variation at runtime; client injects the algorithm object.',
      'Template Method has a fixed algorithm structure; Strategy can replace the entire algorithm.',
      'Prefer Strategy when you need runtime flexibility; Template Method when the structure is fixed and variation is limited.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'TextReader: ReadLine() calls Read() internally — abstract Read() is the template step.',
      'DbMigration in EF Core: Up() and Down() are abstract steps called by the migration runner (template method).',
      'XmlSerializer / JsonSerializer: abstract serialisation steps filled by concrete serialisers.',
      'ASP.NET Core Controller: OnActionExecuting/OnActionExecuted hooks are Template Method pattern.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Report Generator',
    language: 'csharp',
    code: `// Base class with Template Method
public abstract class ReportGenerator
{
    // Template Method — sealed; defines the algorithm skeleton
    public sealed void GenerateReport(ReportRequest request)
    {
        var data     = FetchData(request);          // abstract step
        var filtered = FilterData(data, request);   // hook — default: no filter
        var sorted   = SortData(filtered, request); // hook — default: no sort
        var formatted = FormatData(sorted);         // abstract step
        SaveReport(formatted, request);             // hook — default: log to console
    }

    // Abstract steps — subclasses MUST implement
    protected abstract IEnumerable<ReportRow> FetchData(ReportRequest request);
    protected abstract string FormatData(IEnumerable<ReportRow> data);

    // Hook methods — subclasses MAY override
    protected virtual IEnumerable<ReportRow> FilterData(
        IEnumerable<ReportRow> data, ReportRequest request) => data;

    protected virtual IEnumerable<ReportRow> SortData(
        IEnumerable<ReportRow> data, ReportRequest request) => data;

    protected virtual void SaveReport(string content, ReportRequest request) =>
        Console.WriteLine($"Report generated ({content.Length} chars)");
}

// Concrete report — fills in specific steps
public class SalesReportGenerator(ISalesRepository repo) : ReportGenerator
{
    protected override IEnumerable<ReportRow> FetchData(ReportRequest r) =>
        repo.GetSales(r.DateFrom, r.DateTo).Select(s => new ReportRow(s.Id, s.Total, s.Date));

    protected override string FormatData(IEnumerable<ReportRow> data) =>
        string.Join("\n", data.Select(r => $"{r.Date:yyyy-MM-dd} | {r.Id} | {r.Total:C}"));

    // Override hooks for sales-specific requirements
    protected override IEnumerable<ReportRow> FilterData(
        IEnumerable<ReportRow> data, ReportRequest r) =>
        data.Where(row => row.Total > 0);

    protected override IEnumerable<ReportRow> SortData(
        IEnumerable<ReportRow> data, ReportRequest r) =>
        data.OrderByDescending(row => row.Total);

    // Override save to write to file
    protected override void SaveReport(string content, ReportRequest r) =>
        File.WriteAllText($"sales-{r.DateFrom:yyyy-MM}.txt", content);
}

// Usage
var generator = new SalesReportGenerator(repo);
generator.GenerateReport(new ReportRequest(DateFrom: lastMonth, DateTo: today));`,
  },
  {
    label: 'Data Migration Hook',
    language: 'csharp',
    code: `// EF Core DbMigration — Up() and Down() are abstract Template Method steps
public partial class AddUserTimestamps : Migration
{
    // Template Method calls Up() or Down() — developer only fills in the steps
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "CreatedAt", table: "Users",
            nullable: false, defaultValue: DateTime.UtcNow);

        migrationBuilder.AddColumn<DateTime>(
            name: "UpdatedAt", table: "Users",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "CreatedAt", table: "Users");
        migrationBuilder.DropColumn(name: "UpdatedAt", table: "Users");
    }
}

// ASP.NET Core Controller action filters — hook methods in Template Method
public class AuditController : ControllerBase
{
    // OnActionExecuting/OnActionExecuted are hook methods called by the MVC pipeline
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        Console.WriteLine($"Before action: {context.ActionDescriptor.DisplayName}");
        base.OnActionExecuting(context); // call base template method
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Making the template method overridable (not sealed)',
    wrong: `public virtual void GenerateReport(ReportRequest r) { ... } // subclass can change the ORDER`,
    right: `public sealed void GenerateReport(ReportRequest r) { ... } // algorithm order is fixed`,
    explanation: 'The template method must be sealed (or non-virtual) to preserve the algorithm skeleton. Making it virtual allows subclasses to change the order of steps — defeating the pattern\'s purpose.',
  },
  {
    title: 'Providing too many abstract steps (rigid base class)',
    wrong: `protected abstract string Step1();
protected abstract string Step2();
protected abstract string Step3();
protected abstract string Step4(); // 4+ mandatory steps force every subclass to implement all`,
    right: `protected abstract string CoreStep();    // required
protected virtual  string OptionalStep() => string.Empty; // hook with default`,
    explanation: 'Too many abstract steps make every subclass implement unnecessary methods. Use abstract only for genuinely variable steps; hooks (virtual with default) for steps that only some subclasses need to customise.',
  },
  {
    title: 'Calling the template method from within hook methods',
    wrong: `protected override void OptionalStep() {
    base.GenerateReport(request); // calling the template from a hook!
}`,
    right: `protected override void OptionalStep() {
    // Only customise this step — never call the template method
    Console.WriteLine("Custom optional processing");
}`,
    explanation: 'The Hollywood Principle: hooks don\'t call the template. The base class calls hooks, not the other way around. Calling the template method from a hook creates infinite recursion or unexpected double-execution.',
  },
  {
    title: 'Using Template Method when Strategy is needed',
    wrong: `// Need to swap algorithms at runtime → using inheritance
class FastSorter extends Sorter { }
class SlowSorter extends Sorter { }
// Cannot switch between sorters without changing the type`,
    right: `// Runtime algorithm selection → Strategy
var sorter = new Sorter(new QuickSortStrategy());`,
    explanation: 'Template Method fixes the algorithm structure at compile time via inheritance — you cannot change which steps are used at runtime. If you need runtime algorithm swapping, use Strategy (composition over inheritance).',
  },
];

const challenge: Challenge = {
  title: 'Data Pipeline',
  language: 'typescript',
  description: `Implement Template Method for a data processing pipeline.
Base class DataProcessor has process() template method calling: fetch() → validate() → transform() → save().
fetch() and transform() are abstract. validate() and save() are hooks with defaults.
Implement UserDataProcessor and ProductDataProcessor as concrete subclasses.`,
  hints: [
    'process() is the template method — calls steps in order',
    'Abstract methods throw if not overridden (or use abstract class syntax)',
    'Hook validate() defaults to always return true',
  ],
  starterCode: `abstract class DataProcessor {
  process(): void {
    const data = this.fetch();
    if (!this.validate(data)) { console.log('Validation failed'); return; }
    const result = this.transform(data);
    this.save(result);
  }

  protected abstract fetch(): string[];
  protected abstract transform(data: string[]): string[];
  protected validate(data: string[]): boolean { return data.length > 0; }
  protected save(data: string[]): void { console.log('Saved:', data.join(', ')); }
}

// TODO: UserDataProcessor, ProductDataProcessor`,
  solution: `abstract class DataProcessor {
  process(): void {
    const data = this.fetch();
    if (!this.validate(data)) { console.log('Validation failed'); return; }
    const result = this.transform(data);
    this.save(result);
  }

  protected abstract fetch(): string[];
  protected abstract transform(data: string[]): string[];
  protected validate(data: string[]): boolean { return data.length > 0; }
  protected save(data: string[]): void { console.log('Saved:', data.join(', ')); }
}

class UserDataProcessor extends DataProcessor {
  protected fetch(): string[] { return ['alice@example.com', 'bob@example.com']; }
  protected transform(data: string[]): string[] { return data.map(e => e.toUpperCase()); }
  protected validate(data: string[]): boolean {
    return super.validate(data) && data.every(e => e.includes('@'));
  }
}

class ProductDataProcessor extends DataProcessor {
  protected fetch(): string[] { return ['Widget-A', 'Gadget-B', 'Tool-C']; }
  protected transform(data: string[]): string[] { return data.map(p => \`SKU-\${p}\`); }
  protected save(data: string[]): void { console.log('Products saved to catalog:', data); }
}

new UserDataProcessor().process();
new ProductDataProcessor().process();`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why should the template method be sealed (or non-virtual)?',
    options: [
      'To improve performance',
      'To prevent subclasses from changing the algorithm order — only designated steps are customisable',
      'To prevent memory leaks',
      'Because abstract methods cannot be in a sealed method',
    ],
    answer: 1,
    explanation: 'The template method defines the algorithm skeleton — its sequence of steps must be fixed. If subclasses can override the template method itself, they can change the order, add/remove steps, and break the algorithm contract.',
  },
  {
    q: 'What is the difference between abstract steps and hook methods in Template Method?',
    options: [
      'Abstract steps are optional; hooks are mandatory',
      'Abstract steps MUST be overridden; hook methods have defaults and MAY be overridden',
      'Hook methods are faster than abstract steps',
      'There is no difference — they are the same thing',
    ],
    answer: 1,
    explanation: 'Abstract steps have no implementation — subclasses must override them. Hook methods have a default implementation — subclasses may override them for customisation, but the algorithm still works without overriding.',
  },
  {
    q: 'DbMigration.Up() and Down() in EF Core are examples of:',
    options: ['Strategy pattern', 'Abstract Factory', 'Template Method pattern', 'Command pattern'],
    answer: 2,
    explanation: 'DbMigration is an abstract base class. The migration runner (EF Core) calls Up() to apply and Down() to rollback — developers only fill in the specific migration steps. The overall apply/rollback algorithm is fixed in the base class.',
  },
  { q: 'What is the Template Method pattern?', options: ['A pattern for generating code templates from UML diagrams', 'A behavioral pattern that defines the skeleton of an algorithm in a base class, deferring some steps to subclasses without changing the overall algorithm structure', 'A factory pattern for creating objects using a template', 'A pattern for generating HTML templates from data models'], answer: 1, explanation: 'Template Method defines the invariant parts of an algorithm in a base class (the template method) and lets subclasses override the variable parts (abstract or hook methods). The base class calls the hooks in the right sequence. Subclasses fill in the specifics without changing the overall flow. Example: DataProcessor.process() is the template: readData(), processData(), writeResult(). readData() is abstract (subclasses provide CSV, XML, or database reading). processData() has a default implementation that subclasses may override. writeResult() is abstract.' },
  { q: 'What is the difference between primitive operations and hook methods in Template Method?', options: ['Primitive operations are required; hooks are banned from template methods', 'Primitive operations are abstract methods that subclasses must implement; hook methods have default (often empty) implementations that subclasses may optionally override', 'Hooks call external libraries; primitive operations use internal logic only', 'They are synonyms; both terms refer to the same concept'], answer: 1, explanation: 'Primitive operations: declared abstract in the base class. Subclasses must override them to provide specific behavior. They represent required variation points. Hook methods: have a default implementation in the base class (often empty). Subclasses may override them but are not required to. They represent optional extension points. Example: a web request processor template: parseRequest() is abstract (must be overridden). beforeParsing() is a hook (empty by default — subclasses may add pre-processing). The template uses both in sequence: this.beforeParsing(); var data = this.parseRequest().' },
  { q: 'How does Template Method differ from Strategy for handling algorithm variation?', options: ['Template Method uses abstract methods; Strategy uses interfaces with identical effect', 'Template Method uses inheritance: subclasses override steps; Strategy uses composition: algorithms are encapsulated in separate strategy objects that are injected', 'Template Method is for data processing; Strategy is for behavioral selection', 'Strategy is always superior to Template Method; Template Method is a legacy pattern'], answer: 1, explanation: 'Template Method: variation via inheritance. The subclass IS the specific implementation. Cannot swap at runtime. The algorithm structure is tightly bound to the class hierarchy. Works well for stable algorithm structures with fixed variation points. Strategy: variation via composition. The algorithm is encapsulated in a separate class and injected. Can swap at runtime. The context is free from the algorithm hierarchy. Works well when the entire algorithm varies or when runtime swapping is needed. Prefer Strategy when you want runtime flexibility and to avoid deep inheritance hierarchies. Use Template Method when the algorithm structure is fixed and the variation is limited to specific steps.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use Template Method vs Strategy?',
    a: 'Template Method: use when the algorithm structure is fixed, variation is limited to specific steps, and compile-time binding is acceptable. Strategy: use when you need to swap the entire algorithm at runtime, or when the algorithm variations are numerous and independently reusable. Strategy is generally preferred in modern OOP for its flexibility (composition over inheritance).',
  },
  {
    q: 'What is the Hollywood Principle and how does it apply here?',
    a: '"Don\'t call us, we\'ll call you." In Template Method, the base class controls the algorithm and calls subclass methods (hooks/abstract steps) — not the other way around. Subclasses do not call the template method themselves; they only implement the steps the base class invokes. This prevents the chaos of subclasses controlling their own call sequence.',
  },
  { q: 'What is the Hollywood Principle and how does it relate to Template Method?', a: 'The Hollywood Principle: "Do not call us; we will call you." In Template Method: the framework (base class) defines when steps are called. Subclasses provide implementations for those steps but do not control the order or overall flow. The base class calls the subclass methods (primitive operations, hooks) at the right times. This inverts control: instead of the subclass driving the algorithm, the base class drives it using subclass-provided pieces. IoC frameworks use the same principle: you provide implementations (controllers, handlers) and the framework calls them at the appropriate lifecycle points.' },
  { q: 'How is Template Method used in testing frameworks?', a: 'JUnit and TestNG use Template Method for test lifecycle. The setUp/tearDown or @Before/@After annotations are hooks. The test framework template calls: beforeAll(), for each test: beforeEach(), testMethod(), afterEach(), afterAll(). Your test class provides the concrete step implementations. The framework controls the sequence and provides default no-op implementations for hooks not overridden. NUnit and xUnit have similar patterns: setup fixtures define template methods. The test runner acts as the context; test classes fill in the steps. This ensures consistent test lifecycle (setup, teardown, cleanup) without requiring each test class to remember the order.' },
  { q: 'What are the risks of deep inheritance hierarchies created by Template Method?', a: 'Template Method encourages subclassing, which can lead to deep inheritance hierarchies. Risks: the fragile base class problem — changes to the base class template method can break all subclasses unexpectedly. Tight coupling: subclasses are tightly coupled to the base class structure. Adding a step to the template method requires all subclasses to handle or acknowledge it. Difficulty testing: testing one subclass requires running the entire template, not just the overridden step in isolation. Many variations produce many subclasses. Mitigation: keep the inheritance depth shallow (two levels maximum). Prefer composition (Strategy) for complex variation. Consider making the base class final except for the specific override points.' },
  { q: 'How do you convert a Template Method to a Strategy-based design?', a: 'Conversion: identify each abstract or hook method in the template. Create a corresponding interface with that method. Extract each subclass into a separate class implementing only the variable step interface. Replace the abstract base class with a concrete class that accepts the step implementations via constructor injection (strategies). The template method becomes a regular method calling injected strategies in sequence. Example: DataProcessor abstract class with abstract readData() and abstract writeData() becomes DataProcessor with constructor(IReader reader, IWriter writer), and process() calls reader.read() and writer.write(). This eliminates the inheritance hierarchy and enables runtime step composition: mix a CsvReader with a DatabaseWriter without creating a CsvDatabaseProcessor subclass.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Template Method defines a fixed algorithm skeleton in a sealed base method, calling abstract steps (must override) and hook methods (may override) in a controlled sequence.',
  mustKnow: [
    'Template method is sealed — algorithm order cannot be changed by subclasses',
    'Abstract steps: mandatory overrides; hook methods: optional overrides with defaults',
    'Hollywood Principle: base calls subclass methods — not the reverse',
    'Template Method (inheritance) vs Strategy (composition) — compile vs runtime flexibility',
    '.NET: DbMigration.Up/Down, Controller action filters, Stream.Read()',
  ],
  interviewFocus: [
    'Template Method vs Strategy — when to choose each?',
    'Why seal the template method? What breaks if you don\'t?',
    'What is the Hollywood Principle?',
  ],
};

@Component({
  selector: 'app-dp-template-method',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './template-method.html',
  styleUrl: './template-method.scss',
})
export class DpTemplateMethod {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
