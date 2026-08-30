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
  { name: 'Intent',      type: 'keyword',   desc: 'Separate construction of a complex object from its representation so the same process can create different representations.' },
  { name: 'Builder',     type: 'interface', desc: 'Declares steps for building a product; each step corresponds to one part of construction.' },
  { name: 'Director',    type: 'class',     desc: 'Optional — orchestrates the build steps in a specific order. Can be skipped when clients drive the steps.' },
  { name: 'Product',     type: 'class',     desc: 'The complex object being built. Not necessarily implements an interface.' },
  { name: 'Fluent API',  type: 'method',    desc: 'Modern builders return `this` from each step to enable method chaining: builder.SetX().SetY().Build().' },
  { name: 'vs Constructor', type: 'keyword', desc: 'Solves the "telescoping constructor" problem — many optional parameters become named, readable builder calls.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Builder Pattern?',
    points: [
      'Builder separates the construction of a complex object from its representation.',
      'The client drives the build using a sequence of method calls — each configuring one part of the product.',
      'The final Build() call returns the fully constructed object.',
      'The same construction process can produce different objects depending on which Builder implementation is used.',
    ],
  },
  {
    heading: 'Solving the Telescoping Constructor Problem',
    points: [
      'A class with many optional parameters leads to overloaded constructors (telescoping): new Order(id, null, 0, true, null, "USD") — unreadable.',
      'Builder replaces this with named, intent-revealing method calls: builder.WithId(1).WithCurrency("USD").Expedited().Build().',
      'Only the properties actually needed are set — no need to pass nulls for optional parameters.',
      'Immutable products: build once, then the product can be made read-only.',
    ],
  },
  {
    heading: 'Director: Optional Orchestration',
    points: [
      'A Director encapsulates the sequence of builder calls for common build recipes.',
      'It is optional — clients can call builder steps directly without a Director.',
      'Use a Director when the same step sequence is needed in multiple places.',
      'Without a Director, the construction sequence lives in the calling code (more flexible, less reusable).',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'StringBuilder: Add(), AppendLine(), AppendFormat() — classic Builder for strings.',
      'WebApplicationBuilder in ASP.NET Core: builder.Services.Add…, builder.Configuration.Add…, builder.Build().',
      'HttpRequestMessage and HttpClient.CreateRequest() follow builder semantics.',
      'EF Core ModelBuilder and EntityTypeBuilder in OnModelCreating() are Director-driven builders.',
    ],
  },
  {
    heading: 'Builder vs. Telescoping Constructors',
    points: [
      'A "telescoping constructor" anti-pattern offers multiple overloaded constructors with increasing numbers of parameters to handle optional configuration — this becomes unreadable and error-prone once more than a few optional parameters exist, especially when several parameters share the same type.',
      'The Builder pattern replaces this with a fluent, step-by-step construction API where each optional parameter is set via a clearly-named method call — dramatically improving readability at the call site compared to guessing which positional argument in a long constructor call means what.',
      'Builder also enables constructing genuinely IMMUTABLE objects with many optional fields — the builder accumulates configuration across multiple calls, then produces a single, fully-formed immutable object via a final build() call, rather than requiring a mutable object with many public setters.',
      'Modern language features (named parameters, default parameter values in languages that support them) can reduce or eliminate the need for a full Builder pattern for simpler cases — Builder remains most valuable for genuinely complex construction logic involving validation or multi-step assembly, not just optional parameters alone.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Fluent Builder',
    language: 'csharp',
    code: `// Product
public sealed record HttpRequestOptions(
    string Url, string Method, int TimeoutSeconds,
    Dictionary<string, string> Headers, string? Body);

// Builder
public class HttpRequestBuilder
{
    private string _url = "";
    private string _method = "GET";
    private int _timeout = 30;
    private readonly Dictionary<string, string> _headers = new();
    private string? _body;

    public HttpRequestBuilder WithUrl(string url) { _url = url; return this; }
    public HttpRequestBuilder WithMethod(string method) { _method = method; return this; }
    public HttpRequestBuilder WithTimeout(int seconds) { _timeout = seconds; return this; }
    public HttpRequestBuilder WithHeader(string key, string value) { _headers[key] = value; return this; }
    public HttpRequestBuilder WithBody(string body) { _body = body; return this; }
    public HttpRequestBuilder AsPost() => WithMethod("POST");
    public HttpRequestBuilder WithJsonBody(string json) =>
        WithHeader("Content-Type", "application/json").WithBody(json);

    public HttpRequestOptions Build()
    {
        if (string.IsNullOrEmpty(_url))
            throw new InvalidOperationException("URL is required.");
        return new HttpRequestOptions(_url, _method, _timeout, _headers, _body);
    }
}

// Usage — reads like documentation
var request = new HttpRequestBuilder()
    .WithUrl("https://api.example.com/orders")
    .AsPost()
    .WithTimeout(60)
    .WithJsonBody("""{"item":"book","qty":2}""")
    .Build();`,
  },
  {
    label: 'Director Pattern',
    language: 'csharp',
    code: `public interface IEmailBuilder
{
    IEmailBuilder To(string address);
    IEmailBuilder Subject(string subject);
    IEmailBuilder HtmlBody(string html);
    IEmailBuilder PlainBody(string text);
    Email Build();
}

// Director encapsulates common construction sequences
public class EmailDirector
{
    public Email BuildWelcomeEmail(IEmailBuilder builder, string recipient) =>
        builder
            .To(recipient)
            .Subject("Welcome to DevHub!")
            .HtmlBody("<h1>Welcome!</h1><p>Get started at devhub.io</p>")
            .PlainBody("Welcome! Get started at devhub.io")
            .Build();

    public Email BuildPasswordResetEmail(IEmailBuilder builder, string recipient, string token) =>
        builder
            .To(recipient)
            .Subject("Reset your password")
            .HtmlBody($"<a href=\\"https://devhub.io/reset?t={token}\\">Reset password</a>")
            .Build();
}

// Director reused — concrete builder could be SMTP, SendGrid, etc.
var director = new EmailDirector();
var email = director.BuildWelcomeEmail(new SmtpEmailBuilder(), "user@example.com");`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Mutating the product after Build()',
    wrong: `var config = builder.Build();
config.Timeout = 60; // mutable after construction`,
    right: `var config = builder.WithTimeout(60).Build();
// Product is a sealed record or has init-only properties`,
    explanation: 'Builder is best paired with immutable products (records, init-only). Allowing mutation after Build() defeats the purpose — the construction contract becomes meaningless.',
  },
  {
    title: 'Forgetting to return `this` in fluent methods',
    wrong: `public void WithTimeout(int s) { _timeout = s; } // void — breaks chaining`,
    right: `public HttpRequestBuilder WithTimeout(int s) { _timeout = s; return this; }`,
    explanation: 'Every builder setter must return `this` (or the Builder type) to enable method chaining. Returning void forces callers to write separate assignment lines.',
  },
  {
    title: 'Validating in setters instead of Build()',
    wrong: `public HttpRequestBuilder WithTimeout(int s) {
    if (s <= 0) throw new Exception("invalid"); // too early
    _timeout = s; return this;
}`,
    right: `public HttpRequestOptions Build() {
    if (_timeout <= 0) throw new InvalidOperationException("Timeout must be positive.");
    // validate all at once before creating product
}`,
    explanation: 'Validate in Build(), not in setters. Setters may be called in any order; only Build() knows the complete configuration and can enforce cross-field invariants.',
  },
  {
    title: 'Using Builder for simple objects',
    wrong: `new PointBuilder().SetX(1).SetY(2).Build(); // overkill`,
    right: `new Point(1, 2); // just use a constructor`,
    explanation: 'Builder is for genuinely complex objects with many optional configurations. A simple data class with 2–3 fields is better served by a normal constructor or record.',
  },
];

const challenge: Challenge = {
  title: 'Query Builder',
  language: 'typescript',
  description: `Implement a fluent SQL query builder.
The builder should support: table(), select(), where(), orderBy(), limit().
Calling build() returns a SQL string.
Chaining methods should work: builder.table('users').select('name','email').where('age > 18').limit(10).build()`,
  hints: [
    'Each method returns `this` for chaining',
    'Build validates that table() was called',
    'select() with no args defaults to SELECT *',
  ],
  starterCode: `class QueryBuilder {
  private _table = '';
  private _columns: string[] = [];
  private _where = '';
  private _orderBy = '';
  private _limit = 0;

  // TODO: implement table(), select(), where(), orderBy(), limit(), build()
}

const sql = new QueryBuilder()
  .table('users')
  .select('name', 'email')
  .where('age > 18')
  .orderBy('name')
  .limit(10)
  .build();
console.log(sql);`,
  solution: `class QueryBuilder {
  private _table = '';
  private _columns: string[] = [];
  private _where = '';
  private _orderBy = '';
  private _limit = 0;

  table(name: string): this { this._table = name; return this; }
  select(...cols: string[]): this { this._columns = cols; return this; }
  where(condition: string): this { this._where = condition; return this; }
  orderBy(col: string): this { this._orderBy = col; return this; }
  limit(n: number): this { this._limit = n; return this; }

  build(): string {
    if (!this._table) throw new Error('table() is required');
    const cols = this._columns.length ? this._columns.join(', ') : '*';
    let sql = \`SELECT \${cols} FROM \${this._table}\`;
    if (this._where)   sql += \` WHERE \${this._where}\`;
    if (this._orderBy) sql += \` ORDER BY \${this._orderBy}\`;
    if (this._limit)   sql += \` LIMIT \${this._limit}\`;
    return sql;
  }
}

const sql = new QueryBuilder()
  .table('users')
  .select('name', 'email')
  .where('age > 18')
  .orderBy('name')
  .limit(10)
  .build();
console.log(sql); // SELECT name, email FROM users WHERE age > 18 ORDER BY name LIMIT 10`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What problem does the Builder pattern primarily solve?',
    options: [
      'Ensuring only one instance is created',
      'The telescoping constructor problem — many optional parameters making construction unreadable',
      'Allowing objects to change type at runtime',
      'Deferring object creation to subclasses',
    ],
    answer: 1,
    explanation: 'Builder replaces overloaded constructors with many parameters (telescoping) by providing named, chainable methods for each optional part — making construction intent-revealing and readable.',
  },
  {
    q: 'In ASP.NET Core, `WebApplicationBuilder` follows the Builder pattern. Which call corresponds to `Build()`?',
    options: ['builder.Services.AddControllers()', 'app.Run()', 'builder.Build()', 'builder.Configuration.AddJsonFile()'],
    answer: 2,
    explanation: '`builder.Build()` finalizes configuration and returns the constructed `WebApplication`. All the `builder.Services.*` and `builder.Configuration.*` calls are the builder step methods.',
  },
  {
    q: 'A Director in the Builder pattern:',
    options: [
      'Is required for the pattern to work',
      'Creates the concrete Builder instances',
      'Is optional — it encapsulates common build sequences so they can be reused',
      'Replaces the Build() method',
    ],
    answer: 2,
    explanation: 'The Director is optional. It encapsulates a known sequence of builder steps for reuse across client code. Without a Director, clients call builder steps directly — which is also valid.',
  },
  { q: 'What is the Builder pattern and what problem does it solve?', options: ['A pattern for building database schemas from domain models', 'A creational pattern that constructs complex objects step by step, allowing the same construction process to create different representations or avoid telescoping constructors', 'A pattern for building test fixtures with minimal code', 'A structural pattern for assembling composite object hierarchies'], answer: 1, explanation: 'Builder separates the construction of a complex object from its representation. Without Builder: either a constructor with many parameters (telescoping constructor anti-pattern) or many setters leaving the object in invalid intermediate states. Builder provides a fluent interface for setting optional fields one by one, with a terminal build() method that validates and creates the final immutable object. Using Builder: new EmailBuilder().to(addr).subject(subj).body(body).build(). The same builder can produce different types of finished objects based on the steps called.' },
  { q: 'What is the telescoping constructor anti-pattern and how does Builder solve it?', options: ['A constructor that calls itself recursively to initialize fields', 'A class with many overloaded constructors to handle different combinations of optional parameters, leading to confusing and error-prone constructor calls', 'A constructor that grows longer with each inheritance level', 'A constructor that initializes fields in the wrong order'], answer: 1, explanation: 'Telescoping constructor: as optional parameters increase, you add overloaded constructors for each combination: User(name), User(name, email), User(name, email, phone), User(name, email, phone, address), etc. Callers must know which overload to use and may confuse parameter order for same-type parameters. Builder solves this by providing named setter methods: new UserBuilder().name(n).email(e).phone(p).build(). Parameters are set by name, not position. Optional fields can be omitted. The build() method validates required fields and creates the object.' },
  { q: 'What is the difference between Builder and Fluent Interface?', options: ['They are identical; Builder always uses a fluent interface', 'Fluent Interface is a general API design where methods return this for chaining; Builder is a specific pattern with a director, builder, and product where the builder returns itself for chaining', 'Builder creates immutable objects; Fluent Interface modifies the object in place', 'Fluent Interface is a design pattern; Builder is only a coding style'], answer: 1, explanation: 'Fluent Interface is a general API design style where methods return the same object or builder to allow method chaining. Builder is a creational design pattern that may or may not use a fluent interface for its API. A Builder typically includes a build() or create() terminal method that validates and returns the final product. A Fluent Interface might not create a new object at all; it might configure an existing one. All Builders can use Fluent Interface but not all Fluent Interfaces implement the Builder pattern.' },
];

const qna: QnaItem[] = [
  {
    q: 'Should Builder produce immutable objects?',
    a: 'Yes, in most cases. The builder collects configuration, then Build() produces a fully initialized, immutable product (sealed record, init-only properties). Immutability is not required by the pattern but is considered best practice — it makes the product safe to share across threads.',
  },
  {
    q: 'When should I validate inputs — in setters or in Build()?',
    a: 'Validate in Build(), not in setters. Setters may be called in any order, and cross-field validation (e.g., "if method is POST, body is required") requires seeing the full configuration. Build() is the only place with the complete picture.',
  },
  { q: 'How do you implement validation in a Builder pattern?', a: 'Validation can occur in two places: at each setter method (immediate feedback on invalid values), or in the build() terminal method (validate all constraints together). Build-time validation is preferable for constraints that depend on combinations of fields: if address is provided then country is required. At each setter, validate only simple field constraints like not-null or format. In the build() method, check all mandatory fields are set and all cross-field constraints are satisfied. Throw an IllegalStateException or domain-specific exception with a clear message identifying which validation failed. Some builders return Optional or Result types from build() instead of throwing, requiring callers to handle the failure case explicitly.' },
  { q: 'What is the role of the Director class in the Builder pattern?', a: 'The Director class orchestrates the construction process using a builder, defining the sequence of build steps for a specific configuration. The client provides a concrete builder to the Director; the Director calls the builder steps in the right order without knowing the specific builder implementation. Example: an HtmlReportDirector calls builder.addHeader(), builder.addBody(), builder.addFooter() in order. The same Director can use an HtmlBuilder to produce an HTML report or a PdfBuilder to produce a PDF, using the same step sequence. Directors are optional; clients can call builder steps directly when the construction sequence is simple or varies per call.' },
  { q: 'How is Builder used in test data construction?', a: 'Builder is extremely useful for constructing test data objects (Test Data Builders pattern). A UserBuilder with sensible defaults for all optional fields allows tests to specify only the fields relevant to the test scenario, ignoring irrelevant fields. Each test calls new UserBuilder().withEmail(testEmail).build() and gets a fully formed User with default values for every other field. This avoids test setup code full of null values and makes tests focus on the field being tested. The builder defaults communicate what the common case looks like. When the User class adds a new required field, only the builder default needs to be updated, not every test that creates a User.' },
  { q: 'How do you use Builder pattern for building complex query objects?', a: 'Query builders construct database or API query objects step by step, adding filters, sorts, and pagination without complex constructor parameters. Example: OrderQueryBuilder.forUser(userId).withStatus(SHIPPED).after(date).orderBy(createdAt).limit(50).build(). Each method returns the builder (fluent interface) and the terminal build() creates the query object or executes the query. Advantages: complex queries are readable; optional filter conditions can be omitted; reuse common query configurations by storing intermediate builder state. ORM frameworks like LINQ (C#), QueryDSL (Java), and Eloquent (Laravel) implement this pattern for dynamic query construction.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Builder separates complex object construction into chainable steps, solving the telescoping constructor problem and enabling readable, flexible object creation.',
  mustKnow: [
    'Each builder method configures one part of the product and returns `this` for chaining',
    'Build() validates and produces the final immutable product',
    'Director (optional): encapsulates common step sequences for reuse',
    '.NET: StringBuilder, WebApplicationBuilder, EF Core ModelBuilder',
    'Best paired with immutable products (sealed records, init-only properties)',
  ],
  interviewFocus: [
    'What is the "telescoping constructor" problem and how does Builder solve it?',
    'Why validate in Build() rather than in individual setter methods?',
    'When is a Director useful vs. having clients call builder steps directly?',
  ],
};

@Component({
  selector: 'app-dp-builder',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './builder.html',
  styleUrl: './builder.scss',
})
export class DpBuilder {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
