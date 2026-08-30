import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Every codeTab Assumes EF Core — This QnA Doesn\'t',
    points: [
      'Every codeTab on the main page builds Unit of Work on top of EF Core\'s own <code>DbContext</code> — ' +
      'reasonable, since <code>DbContext</code> already IS a Unit of Work. The page\'s own QnA on implementing ' +
      'UoW "without Entity Framework" sketches the shape in prose (a connection, a transaction, repositories ' +
      'sharing both) but never shows the code, leaving readers using Dapper or raw ADO.NET with no worked ' +
      'example at all.',
      'The structural difference from every EF-based example on the page is real: without a change tracker ' +
      'doing automatic dirty-checking, EVERY write has to be an EXPLICIT SQL command issued against the SAME ' +
      'shared connection and transaction — there is no <code>SaveChangesAsync()</code> that magically knows ' +
      'what changed.',
    ],
  },
  {
    heading: 'What Has to Be Shared, and Why',
    points: [
      'A manual Unit of Work\'s core job is holding exactly ONE open <code>DbConnection</code> and ONE open ' +
      '<code>DbTransaction</code> for the whole business operation, and handing BOTH to every repository that ' +
      'participates — a repository issuing its own INSERT/UPDATE on a DIFFERENT connection or without the ' +
      'shared transaction would commit independently, breaking atomicity exactly the same way the main ' +
      'page\'s own "multiple DbContexts" mistake block warns about for the EF Core case.',
      '<code>CommitAsync()</code> and <code>RollbackAsync()</code> become the manual UoW\'s own explicit ' +
      'analogs of <code>SaveChangesAsync()</code> — but unlike EF Core, nothing tracks what changed ' +
      'automatically; the UoW\'s only real job is transaction LIFECYCLE (begin, commit, rollback), while every ' +
      'individual write still has to be issued by hand.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'SqlUnitOfWork (Dapper-style)',
    language: 'csharp',
    code: `public interface IUnitOfWork : IAsyncDisposable
{
    IOrderRepository Orders { get; }
    Task CommitAsync(CancellationToken ct = default);
}

public class SqlUnitOfWork : IUnitOfWork
{
    private readonly SqlConnection _connection;
    private readonly SqlTransaction _transaction;
    private IOrderRepository? _orders;

    private SqlUnitOfWork(SqlConnection connection, SqlTransaction transaction)
    {
        _connection  = connection;
        _transaction = transaction;
    }

    // Async factory — opening a connection and beginning a
    // transaction are both async operations, which a constructor
    // cannot await.
    public static async Task<SqlUnitOfWork> BeginAsync(string connectionString, CancellationToken ct = default)
    {
        var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(ct);
        var transaction = (SqlTransaction)await connection.BeginTransactionAsync(ct);
        return new SqlUnitOfWork(connection, transaction);
    }

    // Repositories receive the SAME connection + transaction every
    // Unit of Work instance holds — this is what makes their writes
    // participate in one atomic operation.
    public IOrderRepository Orders =>
        _orders ??= new SqlOrderRepository(_connection, _transaction);

    public async Task CommitAsync(CancellationToken ct = default) =>
        await _transaction.CommitAsync(ct);

    public async ValueTask DisposeAsync()
    {
        await _transaction.DisposeAsync();
        await _connection.DisposeAsync();
    }
}

// A repository using Dapper against the shared connection/transaction
// — every INSERT/UPDATE is explicit; nothing is tracked automatically.
public class SqlOrderRepository(SqlConnection connection, SqlTransaction transaction) : IOrderRepository
{
    public Task AddAsync(Order order) =>
        connection.ExecuteAsync(
            "INSERT INTO Orders (Id, CustomerId, Total) VALUES (@Id, @CustomerId, @Total)",
            order, transaction);
}

// Usage — explicit begin/commit, with rollback on failure via 'using'
// plus a catch (DisposeAsync alone does NOT roll back an uncommitted
// transaction that failed after some, but not all, writes).
await using var uow = await SqlUnitOfWork.BeginAsync(connectionString);
try
{
    await uow.Orders.AddAsync(new Order(customerId, total));
    // ... additional repository calls sharing the same uow ...
    await uow.CommitAsync(); // ONE explicit commit — all writes so far, together
}
catch
{
    // No explicit RollbackAsync() call needed here specifically:
    // disposing an UNCOMMITTED SqlTransaction rolls it back
    // automatically — but only because CommitAsync() was never
    // reached on this path.
    throw;
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If <code>SqlOrderRepository.AddAsync</code> were changed to open its OWN new ' +
    '<code>SqlConnection</code> instead of using the one passed in from <code>SqlUnitOfWork</code>, would ' +
    'the INSERT still succeed? Would it still be part of the SAME atomic transaction as other repository ' +
    'calls sharing that <code>SqlUnitOfWork</code> instance?',
  hint:
    'A SQL transaction is scoped to the SPECIFIC connection it was begun on — think about what "sharing a ' +
    'transaction" actually requires at the ADO.NET level.',
  solution:
    'The INSERT would likely still succeed on its own (a brand-new connection can run an INSERT fine), but it ' +
    'would NOT be part of the shared transaction at all — it would auto-commit immediately and independently, ' +
    'completely outside SqlUnitOfWork\'s own CommitAsync()/RollbackAsync() control. This is exactly the same ' +
    'root failure the main page\'s own "multiple DbContexts" mistake block describes for EF Core, just at the ' +
    'ADO.NET level instead: a SqlTransaction object is tied to the specific SqlConnection it was created ' +
    'from, so a repository bypassing the shared connection genuinely cannot participate in that transaction, ' +
    'no matter how correctly everything else about the UnitOfWork is wired.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Building a manual Unit of Work like this is strictly worse than using EF Core\'s DbContext, so ' +
      'there is no real reason a team would choose this approach today.',
    reality:
      'The main page\'s own QnA names the actual motivation directly: "useful with Dapper or raw SQL" — teams ' +
      'that specifically want Dapper\'s lighter-weight, closer-to-SQL query model (often for read-heavy or ' +
      'performance-sensitive paths) still need SOME way to coordinate multiple writes atomically across ' +
      'repositories, and EF Core\'s DbContext is not available to provide that if the project intentionally ' +
      'is not using EF Core at all.',
  },
  {
    thought: 'Since SqlUnitOfWork implements IAsyncDisposable, simply wrapping usage in an "await using" ' +
      'block is enough to guarantee correct rollback behavior on any failure — no try/catch is really needed.',
    reality:
      'Disposing an UNCOMMITTED transaction does roll it back automatically (as the code comment notes), but ' +
      'this only covers the "exception propagates past CommitAsync() without being caught" case. A real ' +
      'application usually still needs a catch block for OTHER reasons — logging the failure, translating a ' +
      'low-level database exception into a domain-meaningful one, or deciding whether to retry — the ' +
      'automatic-rollback-on-dispose behavior is a safety net underneath that handling, not a replacement for ' +
      'it.',
  },
];

@Component({
  selector: 'app-unit-of-work-a-manual-unit-of-work-without-entity-framework',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-manual-unit-of-work-without-entity-framework.html',
  styleUrl: './a-manual-unit-of-work-without-entity-framework.scss',
})
export class AManualUnitOfWorkWithoutEntityFrameworkSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
