import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-transferasync-connection-hold-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './transferasync-example-holds-its-connection-open-far-too-long.html',
  styleUrl: './transferasync-example-holds-its-connection-open-far-too-long.scss',
})
export class TransferasyncExampleHoldsItsConnectionOpenFarTooLongSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own TransferAsync Never Closes Its Connection',
      points: [
        'Look again at the main page\'s Transactions example: db.Open() runs, using var tx = db.BeginTransaction() disposes only the TRANSACTION object on tx.Commit() or tx.Rollback() — nothing in that method ever calls db.Close(). Per the previous subtopic\'s own-already-open rule, Dapper will not close a connection it found already open, so this connection stays checked out from the ADO.NET pool for as long as the injected IDbConnection instance itself stays alive.',
      ],
    },
    {
      heading: 'Not a Permanent Leak — But Held Far Longer Than Necessary',
      points: [
        'IDbConnection is registered Transient per the main page\'s own DI guidance, and SqlConnection implements IDisposable — ASP.NET Core\'s built-in DI container tracks and disposes ALL IDisposable services it creates, including Transient ones, at the end of the owning scope (the HTTP request). So this connection IS eventually closed — just not the moment TransferAsync itself returns, only when the whole request ends.',
        'If the same request handler goes on to do unrelated work afterward — call other services, render a response, log, await other I/O — the pooled SQL connection stays checked out for that entire remaining duration, for no reason. Under concurrent load, many simultaneous requests each holding a connection open longer than necessary brings the app measurably closer to exhausting the pool — a real, measurable cost, even though "leak" (in the sense of never being reclaimed at all) is the wrong word for it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own example — connection never closed',
      language: 'csharp',
      code: `// Reproduced from the main page's "Transactions" tab.
public async Task TransferAsync(int fromId, int toId, decimal amount)
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
    // db is still OPEN here — nothing in this method ever calls db.Close().
}`,
    },
    {
      label: 'Fixed — return the connection to the pool as soon as the work is done',
      language: 'csharp',
      code: `public async Task TransferAsync(int fromId, int toId, decimal amount)
{
    db.Open();
    try
    {
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
    }
    finally
    {
        db.Close();   // hand the connection back to the pool the instant this
                       // method's real work is done — don't wait for the DI
                       // container to dispose it at end-of-request.
    }
}`,
    },
    {
      label: 'Proving the difference with in-memory SQLite',
      language: 'csharp',
      code: `[Fact]
public async Task Original_TransferAsync_Leaves_Connection_Open_After_Returning()
{
    using var connection = new SqliteConnection("Data Source=:memory:");
    await connection.OpenAsync();
    await connection.ExecuteAsync(
        "CREATE TABLE Accounts (Id INTEGER PRIMARY KEY, Balance DECIMAL);");
    await connection.ExecuteAsync(
        "INSERT INTO Accounts (Id, Balance) VALUES (1, 100), (2, 50);");

    await OriginalTransferAsync(connection, fromId: 1, toId: 2, amount: 25);

    // Still open after returning — OriginalTransferAsync never calls Close(),
    // matching the main page's own example exactly.
    Assert.Equal(ConnectionState.Open, connection.State);
}

[Fact]
public async Task Fixed_TransferAsync_Returns_The_Connection_To_A_Closed_State()
{
    using var connection = new SqliteConnection("Data Source=:memory:");
    // Starts CLOSED here — FixedTransferAsync opens and closes it itself.
    await connection.ExecuteAsync(
        "CREATE TABLE Accounts (Id INTEGER PRIMARY KEY, Balance DECIMAL);");
    await connection.ExecuteAsync(
        "INSERT INTO Accounts (Id, Balance) VALUES (1, 100), (2, 50);");

    await FixedTransferAsync(connection, fromId: 1, toId: 2, amount: 25);

    Assert.Equal(ConnectionState.Closed, connection.State);   // handed back immediately
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues the fixed version\'s <code>db.Close()</code> in a finally block is unnecessary, since IDbConnection is registered Transient and SqlConnection is IDisposable — the ASP.NET Core DI container will dispose it automatically at the end of the request anyway. Is adding an explicit Close() still worth it?',
    hint: 'Distinguish "will eventually be cleaned up" from "is available for reuse the moment this method\'s real work is finished" — think about what else might run in the SAME request after TransferAsync returns.',
    solution: `Yes, and the teammate's premise is only half right. The DI container
WILL eventually dispose the Transient SqlConnection — so this is not
a permanent leak, and the connection is not lost forever. But
"eventually" means at the END of the HTTP request's scope, not the
moment TransferAsync returns.

If the same handler goes on to call other services, render a response,
write logs, or await anything else after TransferAsync completes, the
connection stays checked out from the ADO.NET pool for that ENTIRE
remaining duration — for no reason, since the transfer itself is
already done. Under concurrent load, with many simultaneous requests
each holding a connection open longer than necessary, this brings the
app measurably closer to exhausting the connection pool.

Adding db.Close() in a finally block returns the connection to the pool
the instant the transactional work is actually finished, rather than
riding out the rest of the request holding a resource it no longer
needs.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own TransferAsync method has no connection-management bug, since using var tx = db.BeginTransaction() ensures everything gets cleaned up.',
      reality: 'using var tx only disposes the TRANSACTION object — it does not close the underlying connection that db.Open() opened. Nothing in that method ever calls db.Close(), so per Dapper\'s own already-open rule, the connection stays checked out until something else disposes it.',
    },
    {
      thought: 'forgetting to explicitly close a manually-opened connection is a genuine, permanent connection leak — the connection is lost until the process restarts.',
      reality: 'because IDbConnection is registered Transient and SqlConnection is IDisposable, ASP.NET Core\'s DI container will dispose it — just at the end of the whole request\'s scope, not the moment the method returns. It is held longer than necessary, not lost forever.',
    },
    {
      thought: 'holding a pooled connection open for the rest of a request, after its actual database work is done, has no real cost as long as it is eventually disposed.',
      reality: 'under concurrent load, every request holding a connection open longer than it needs to brings the app measurably closer to exhausting the ADO.NET connection pool — the cost is real even though it isn\'t a permanent leak.',
    },
  ];
}
