import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-dapper',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './dapper.html',
  styleUrl: './dapper.scss',
})
export class AspnetDapper {

  prerequisites: Prerequisite[] = [
    { label: 'EF Core Basics', route: '/aspnet/ef-core-basics' },
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'QueryAsync<T>(sql, param)',          type: 'method', desc: 'Executes SQL and maps rows to a list of T.' },
    { name: 'QuerySingleAsync<T>(sql, param)',     type: 'method', desc: 'Returns exactly one row; throws if zero or multiple found.' },
    { name: 'QuerySingleOrDefaultAsync<T>()',      type: 'method', desc: 'Returns one row or default(T) — safe for "find by id" patterns.' },
    { name: 'ExecuteAsync(sql, param)',             type: 'method', desc: 'Runs INSERT, UPDATE, DELETE. Returns rows affected.' },
    { name: 'QueryMultipleAsync(sql, param)',       type: 'method', desc: 'Executes multiple result sets in one round-trip.' },
    { name: 'DynamicParameters',                   type: 'class',  desc: 'Builds parameter collections including output and return params.' },
    { name: 'SplitOn',                             type: 'keyword',desc: 'Column name that triggers switching to the next mapped type in a JOIN.' },
    { name: 'conn.BeginTransaction()',             type: 'method', desc: 'Creates a transaction; pass it as the transaction param in Dapper calls.' },
    { name: 'CommandDefinition',                   type: 'class',  desc: 'Wraps SQL + params + commandType + cancellation for fine-grained control.' },
    { name: 'SqlMapper.AddTypeHandler()',          type: 'method', desc: 'Registers custom serialization for types Dapper cannot map by default.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Dapper?',
      points: ['Dapper is a micro-ORM that extends IDbConnection with strongly typed query methods. Unlike EF Core, it does not track entities, generate migrations, or build SQL for you — you write raw SQL and Dapper maps the result set to C# types. This makes it ideal for performance-critical read paths, complex queries, or existing databases where EF Core migrations are not practical.'],
    },
    {
      heading: 'Safe Parameterisation',
      points: ['Always pass values as anonymous-object parameters (new { Id = id }) rather than string-interpolating them into SQL. Dapper sends these as proper ADO.NET parameters, eliminating SQL injection risk. Never build SQL by concatenating user input directly into the query string.'],
    },
    {
      heading: 'Connection Management',
      points: ['Register your IDbConnection (or SqlConnection) as Transient in DI — each request gets a fresh connection from the pool. Wrap in a using block so it is returned to the pool promptly. Dapper opens and closes the connection automatically if it is closed when a method is called.'],
    },
    {
      heading: 'Multi-Mapping (JOIN Queries)',
      points: ['QueryAsync<T1, T2, TResult> maps a single result row into multiple objects by splitting on a column name. Pass splitOn: "ColumnName" to tell Dapper where the second type starts. Use this for one-to-one relations; for one-to-many, fetch and group in C# or use QueryMultiple.'],
    },
    {
      heading: 'When to Use Dapper vs EF Core',
      points: ['Use EF Core for CRUD-heavy features, entity relationships, migrations, and change tracking. Use Dapper for complex analytical queries, reporting, high-throughput reads where you want the SQL to be explicit, or when using stored procedures that EF Core cannot cleanly model. Many production systems use both side-by-side.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Queries',
      language: 'csharp',
      code: `// Register connection in DI
builder.Services.AddTransient<IDbConnection>(sp =>
    new SqlConnection(builder.Configuration.GetConnectionString("Default")));

// Repository
public class ProductRepository(IDbConnection db)
{
    public Task<IEnumerable<Product>> GetAllAsync() =>
        db.QueryAsync<Product>("SELECT * FROM Products ORDER BY Name");

    public Task<Product?> GetByIdAsync(int id) =>
        db.QuerySingleOrDefaultAsync<Product>(
            "SELECT * FROM Products WHERE Id = @Id", new { Id = id });

    public Task<int> CreateAsync(Product p) =>
        db.ExecuteAsync(
            "INSERT INTO Products (Name, Price) VALUES (@Name, @Price)",
            new { p.Name, p.Price });
}`,
    },
    {
      label: 'Multi-Mapping',
      language: 'csharp',
      code: `// Map ORDER JOIN CUSTOMER to two types
const string sql = @"
    SELECT o.Id, o.Total, o.OrderDate,
           c.Id, c.Name, c.Email
    FROM   Orders o
    INNER  JOIN Customers c ON c.Id = o.CustomerId
    WHERE  o.Id = @Id";

var order = await db.QueryAsync<Order, Customer, Order>(
    sql,
    (order, customer) =>
    {
        order.Customer = customer;
        return order;
    },
    new { Id = orderId },
    splitOn: "Id");   // second "Id" column triggers Customer mapping

return order.FirstOrDefault();`,
    },
    {
      label: 'Multi-Result',
      language: 'csharp',
      code: `// Two queries in one round-trip
const string sql = @"
    SELECT * FROM Products WHERE CategoryId = @CategoryId;
    SELECT COUNT(*) FROM Products WHERE CategoryId = @CategoryId;";

using var multi = await db.QueryMultipleAsync(sql, new { CategoryId = id });

var products = (await multi.ReadAsync<Product>()).ToList();
var total    = await multi.ReadSingleAsync<int>();

return new PagedResult<Product>(products, total);`,
    },
    {
      label: 'Transactions',
      language: 'csharp',
      code: `public async Task TransferAsync(int fromId, int toId, decimal amount)
{
    db.Open();
    using var tx = db.BeginTransaction();
    try
    {
        await db.ExecuteAsync(
            "UPDATE Accounts SET Balance = Balance - @Amount WHERE Id = @Id",
            new { Amount = amount, Id = fromId }, tx);

        await db.ExecuteAsync(
            "UPDATE Accounts SET Balance = Balance + @Amount WHERE Id = @Id",
            new { Amount = amount, Id = toId }, tx);

        tx.Commit();
    }
    catch
    {
        tx.Rollback();
        throw;
    }
}`,
    },
    {
      label: 'Stored Procedure',
      language: 'csharp',
      code: `var parameters = new DynamicParameters();
parameters.Add("@CustomerId", customerId);
parameters.Add("@Year",       year);
parameters.Add("@TotalSales", dbType: DbType.Decimal,
               direction: ParameterDirection.Output);

await db.ExecuteAsync(
    "usp_GetCustomerSales",
    parameters,
    commandType: CommandType.StoredProcedure);

var totalSales = parameters.Get<decimal>("@TotalSales");`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'String-interpolating user input into SQL',
      wrong: `var rows = await db.QueryAsync<Product>(\`SELECT * FROM Products WHERE Name = '\${name}'\`);`,
      right: `var rows = await db.QueryAsync<Product>("SELECT * FROM Products WHERE Name = @Name", new { Name = name });`,
      explanation: 'String interpolation creates SQL injection vulnerabilities. Always use parameterized queries with an anonymous object or DynamicParameters.',
    },
    {
      title: 'Opening a connection that Dapper will also open',
      wrong: `db.Open();
var rows = await db.QueryAsync<Product>("SELECT * FROM Products");
// Dapper throws: connection already open`,
      right: `// Let Dapper manage connection state — only open if you need a transaction
var rows = await db.QueryAsync<Product>("SELECT * FROM Products");`,
      explanation: 'Dapper opens and closes the connection automatically. Only call db.Open() manually when starting a transaction.',
    },
    {
      title: 'Forgetting splitOn in multi-mapping',
      wrong: `db.QueryAsync<Order, Customer, Order>(sql, map); // splitOn defaults to "Id"`,
      right: `db.QueryAsync<Order, Customer, Order>(sql, map, splitOn: "CustomerId");`,
      explanation: 'The default splitOn is "Id", which works if both types have an "Id" column in order. When the split column has a different name, specify it explicitly.',
    },
    {
      title: 'Registering IDbConnection as Singleton',
      wrong: `builder.Services.AddSingleton<IDbConnection>(new SqlConnection(connStr));`,
      right: `builder.Services.AddTransient<IDbConnection>(_ => new SqlConnection(connStr));`,
      explanation: 'SQL connections are not thread-safe and must not be shared across requests. Register as Transient so each request gets a fresh connection from the pool.',
    },
  ];

  challenge: Challenge = {
    title: 'Order Summary with Multi-Mapping',
    language: 'csharp',
    description: `Write a Dapper query that fetches an order with its customer in a single JOIN query.
- Table Orders: Id, Total, CustomerId
- Table Customers: Id, Name, Email
- Map the result to Order { Id, Total, Customer } and Customer { Id, Name, Email }.
- Use QueryAsync with multi-mapping and splitOn.`,
    hints: [
      'SELECT o.Id, o.Total, c.Id, c.Name, c.Email FROM Orders o JOIN Customers c ON c.Id = o.CustomerId',
      'splitOn should target the first column of the Customer type',
      'The lambda receives (order, customer) — assign order.Customer = customer',
    ],
    starterCode: `public class Order    { public int Id; public decimal Total; public Customer? Customer; }
public class Customer { public int Id; public string Name = ""; public string Email = ""; }

public async Task<Order?> GetOrderWithCustomerAsync(int orderId)
{
    // TODO: write JOIN query with multi-mapping
}`,
    solution: `public async Task<Order?> GetOrderWithCustomerAsync(int orderId)
{
    const string sql = @"
        SELECT o.Id, o.Total,
               c.Id, c.Name, c.Email
        FROM   Orders o
        JOIN   Customers c ON c.Id = o.CustomerId
        WHERE  o.Id = @OrderId";

    var results = await db.QueryAsync<Order, Customer, Order>(
        sql,
        (order, customer) => { order.Customer = customer; return order; },
        new { OrderId = orderId },
        splitOn: "Id");

    return results.FirstOrDefault();
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which Dapper method executes INSERT/UPDATE/DELETE and returns rows affected?',
      options: ['QueryAsync()', 'ExecuteAsync()', 'ExecuteScalarAsync()', 'QuerySingleAsync()'],
      answer: 1,
      explanation: 'ExecuteAsync() runs non-query SQL and returns the number of rows affected.',
    },
    {
      q: 'How should you pass user-supplied values to Dapper to avoid SQL injection?',
      options: [
        'Use string interpolation inside the SQL string',
        'Escape the input with SqlEscape() first',
        'Pass an anonymous object or DynamicParameters as the param argument',
        'Use QUOTENAME() in the query',
      ],
      answer: 2,
      explanation: 'Passing parameters as an anonymous object (new { Id = id }) causes Dapper to use ADO.NET parameters, which are safe from SQL injection.',
    },
    {
      q: 'What does splitOn do in a multi-mapping query?',
      options: [
        'Splits the result set into pages',
        'Marks the column where Dapper switches to mapping the next type',
        'Divides rows across multiple threads',
        'Splits a JSON column into separate properties',
      ],
      answer: 1,
      explanation: 'splitOn specifies the column name at which Dapper starts populating the next generic type argument in a multi-mapping call.',
    },
    {
      q: 'What lifetime should IDbConnection be registered with in DI?',
      options: ['Singleton', 'Scoped', 'Transient', 'Any — connections are thread-safe'],
      answer: 2,
      explanation: 'SQL connections are not thread-safe. Register as Transient to get a fresh connection per injection, relying on ADO.NET connection pooling for efficiency.',
    },
    {
      q: 'Which method executes two SELECT queries and reads both result sets?',
      options: ['QueryAsync()', 'ExecuteReaderAsync()', 'QueryMultipleAsync()', 'QueryFirstAsync()'],
      answer: 2,
      explanation: 'QueryMultipleAsync() runs a batch SQL with multiple statements, returning a GridReader. Call multi.ReadAsync<T>() for each result set.',
    },
    {
      q: 'How do you wrap multiple Dapper operations in a transaction?',
      options: [
        'Pass TransactionScope to the Dapper method',
        'Begin a transaction with connection.BeginTransaction() and pass it as the transaction parameter to each Dapper call',
        'Use Dapper.TransactionAsync() which wraps all operations automatically',
        'Dapper does not support transactions — use EF Core for that',
      ],
      answer: 1,
      explanation: 'Every Dapper extension method accepts an optional IDbTransaction parameter. Begin one with connection.BeginTransaction() (or BeginTransactionAsync in .NET 7+), pass it to each QueryAsync/ExecuteAsync call, then commit or rollback. Dapper relies on ADO.NET transactions — no extra abstraction is added.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use Dapper and EF Core in the same application?',
      a: 'Yes, and this is a common pattern. Use EF Core for entity management, migrations, and CRUD, and Dapper for complex analytical queries, reporting, or stored procedures that EF Core would model awkwardly. Both can share the same database connection string.',
    },
    {
      q: 'How do I map a SQL result to a nested list (one-to-many)?',
      a: 'Dapper does not natively handle one-to-many JOIN flattening. Use QueryAsync to fetch the flat JOIN results, then group in C# using LINQ (GroupBy + Select). Alternatively, use QueryMultiple with two queries — one for the parent, one for children — and join in memory.',
    },
    {
      q: 'Does Dapper support async all the way through?',
      a: 'Yes. All Dapper extension methods have async variants: QueryAsync, ExecuteAsync, QuerySingleAsync, QueryMultipleAsync etc. Always use the async versions in ASP.NET Core to avoid blocking the thread pool.',
    },
    {
      q: 'How do I map a column with a different name to a C# property?',
      a: 'Dapper maps by column name (case-insensitive) to property name. Use a SQL alias (SELECT created_at AS CreatedAt) to match the property name. Alternatively, register a custom SqlMapper.ITypeMap if you need a global convention such as snake_case to PascalCase.',
    },
    {
      q: 'How do I call a stored procedure with Dapper?',
      a: 'Pass the procedure name and commandType: CommandType.StoredProcedure: await conn.QueryAsync<Order>("sp_GetOrders", new { CustomerId = id }, commandType: CommandType.StoredProcedure). For output parameters, use DynamicParameters: var p = new DynamicParameters(); p.Add("@Count", dbType: DbType.Int32, direction: ParameterDirection.Output); then read with p.Get<int>("@Count").',
    },
    {
      q: 'How can I process a very large result set without loading all rows into memory at once?',
      a: 'Pass buffered: false to QueryAsync: await conn.QueryAsync<Row>(sql, params, buffered: false). This returns an IEnumerable<T> backed by a live DataReader — rows are streamed one at a time. Process them in a foreach loop without calling .ToList(). The connection must stay open for the duration. This approach is essential for bulk exports or reports returning millions of rows.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Dapper extends IDbConnection with typed query methods — write raw SQL, pass parameters safely, and map results directly to C# types.',
    mustKnow: [
      'QueryAsync<T>() maps rows to a list; QuerySingleOrDefaultAsync<T>() for nullable single-row lookup',
      'Always pass values as anonymous objects or DynamicParameters — never string-interpolate user input',
      'Register IDbConnection as Transient in DI; Dapper opens/closes connections automatically',
      'Multi-mapping: QueryAsync<T1, T2, TResult> with splitOn to map JOINs to nested types',
      'QueryMultipleAsync() for multiple result sets in one round-trip',
      'For transactions: call db.Open() manually, then db.BeginTransaction() and pass tx to each call',
    ],
    interviewFocus: [
      'Dapper vs EF Core — when to choose each and why they can coexist',
      'How Dapper prevents SQL injection (ADO.NET parameterization)',
      'Multi-mapping with splitOn — the column that triggers type switching',
      'Connection lifetime and pool management in ASP.NET Core DI',
    ],
  };
}
