import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-dapper-connection-close-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-dapper-decides-whether-to-close-the-connection-it-used.html',
  styleUrl: './how-dapper-decides-whether-to-close-the-connection-it-used.scss',
})
export class HowDapperDecidesWhetherToCloseTheConnectionItUsedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Dapper Only Manages a Connection It Finds Closed',
      points: [
        'The main page\'s own "Opening a connection that Dapper will also open" mistake states "Dapper opens and closes the connection automatically" — but only demonstrates the case where the injected connection starts CLOSED. The actual rule: at the moment a call runs, Dapper checks the connection\'s State. If it is Closed, Dapper opens it, runs the command, and closes it again when done. If the connection is ALREADY Open, Dapper leaves it open afterward too — ownership of closing it stays with whoever opened it.',
        'This single rule is exactly why the page\'s OWN "Transactions" code tab calls db.Open() manually before BeginTransaction(): a transaction must span multiple Dapper calls against the SAME open connection, so the code deliberately puts the connection into the "already open" state first, opting OUT of Dapper\'s auto-close behavior for the duration of the transaction.',
      ],
    },
    {
      heading: 'Why a Transaction Can\'t Rely on the Auto-Close Path',
      points: [
        'If db were left closed and each ExecuteAsync call in TransferAsync auto-opened-and-closed independently, a transaction started with BeginTransaction() would be tied to a connection that closes between calls — ADO.NET transactions do not survive a connection close. This is precisely why BeginTransaction() itself requires an already-open connection (it throws InvalidOperationException otherwise), and why Dapper\'s "only manage a connection found closed" rule matters: it is what lets a caller take manual control for exactly this multi-call, must-share-a-connection scenario.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving the rule with an in-memory SQLite connection',
      language: 'csharp',
      code: `[Fact]
public async Task Dapper_Closes_A_Connection_It_Found_Closed()
{
    using var connection = new SqliteConnection("Data Source=:memory:");
    Assert.Equal(ConnectionState.Closed, connection.State);   // never opened manually

    await connection.ExecuteAsync("CREATE TABLE Widgets (Id INTEGER PRIMARY KEY);");

    Assert.Equal(ConnectionState.Closed, connection.State);   // Dapper opened AND closed it
}

[Fact]
public async Task Dapper_Leaves_An_Already_Open_Connection_Open()
{
    using var connection = new SqliteConnection("Data Source=:memory:");
    await connection.OpenAsync();                              // caller opens it first
    Assert.Equal(ConnectionState.Open, connection.State);

    await connection.ExecuteAsync("CREATE TABLE Widgets (Id INTEGER PRIMARY KEY);");

    Assert.Equal(ConnectionState.Open, connection.State);      // still open — Dapper didn't touch it
}`,
    },
    {
      label: 'Why BeginTransaction() needs the connection already open',
      language: 'csharp',
      code: `// Skip db.Open() and go straight to BeginTransaction() on a closed connection:
using var connection = new SqliteConnection("Data Source=:memory:");
// connection.State is Closed here

using var tx = connection.BeginTransaction();
// System.InvalidOperationException: BeginTransaction requires an open
// and available Connection. The connection's current state is Closed.

// This is exactly why the main page's Transactions example calls
// db.Open() BEFORE BeginTransaction() — there is no auto-open path here.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Using the two test methods above as a model, what would you expect if you called <code>connection.ExecuteAsync(...)</code> TWICE in a row on the SAME closed connection, back to back, with no manual <code>Open()</code> in between?',
    hint: 'Each Dapper call independently checks the connection\'s state at the moment IT runs — there is no shared memory of what a PREVIOUS call did.',
    solution: `Each call independently repeats the exact same "check state, open if
closed, run, close if it was closed" cycle: the first ExecuteAsync
finds the connection Closed, opens it, runs, and closes it again. The
second ExecuteAsync then ALSO finds the connection Closed — because
the first call already closed it back down — and repeats the identical
open-run-close cycle itself.

Two closed-connection calls in a row are NOT more efficient than one;
each pays its own connection-open cost independently, since Dapper has
no memory across separate calls of what a previous call left the
connection in. This is exactly why a transaction (or any sequence of
calls that must share connection or transaction state) has to take
manual control by calling db.Open() itself first — otherwise every
individual call gets its own isolated open-close cycle with no
continuity between them.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Dapper opens and closes the connection automatically," as the main page states, means Dapper closes ANY connection after every call, regardless of what state it found the connection in.',
      reality: 'Dapper only closes a connection it found CLOSED at the moment of the call. A connection that was already open when the call ran is left open afterward — Dapper never closes something it didn\'t open itself.',
    },
    {
      thought: 'calling BeginTransaction() on a connection Dapper hasn\'t been used with yet will open the connection for you, the same way ExecuteAsync does.',
      reality: 'BeginTransaction() throws InvalidOperationException on a Closed connection — it has no auto-open behavior of its own. The caller must open the connection manually before starting a transaction, exactly as the main page\'s own Transactions example does.',
    },
    {
      thought: 'two consecutive Dapper calls on the same connection object, with no manual Open() between them, are more efficient than opening it yourself, since Dapper "remembers" the connection was just used.',
      reality: 'each call independently checks and manages the connection\'s state with no memory of a prior call — two closed-connection calls in a row each pay their own full open-and-close cost, exactly as if they were unrelated. Manual db.Open() removes that repeated cost when multiple calls need to share one connection or transaction.',
    },
  ];
}
