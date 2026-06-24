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
            .HtmlBody(\`<a href="https://devhub.io/reset?t={token}">Reset password</a>\`)
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
    wrong: `public HttpRequestBuilder WithTimeout(int s) { _timeout = s; } // void — breaks chaining`,
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
