import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './context-cancel-closes-the-connection.html',
  styleUrl: './context-cancel-closes-the-connection.scss'
})
export class ContextCancelClosesTheConnectionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"The pool cleans up the connection automatically" is accurate — but "cleans up" specifically means closing it, not returning it',
      points: [
        'The main page\'s own theory states: "context.DeadlineExceeded from a cancelled context propagates correctly — the pool cleans up the connection automatically." That sentence is reassuring and correct as far as it goes, but "cleans up" is doing a lot of unexplained work — it is easy to read this as "the connection goes back to the pool normally, just like after any other finished query," which is not quite what happens.',
        'pgconn\'s own documentation (the lower-level package pgx itself is built on) states the actual default behavior directly: "All potentially blocking operations take a context.Context. The default behavior when a context is canceled is for the method to immediately return. In most circumstances, this will also close the underlying connection." The default reaction to a cancelled context is not a graceful, resumable stop — it is closing the connection outright.',
        'This makes sense once you consider the alternative: a query that is still running on the PostgreSQL server when the Go side gives up has no simple way to be "un-run" or safely resumed later on the same connection — the connection\'s own protocol state is left mid-query, in a condition pgx cannot guarantee is safe to reuse for a completely different, later query. Closing it outright is the safe default, at the cost of that connection being unusable going forward.',
      ]
    },
    {
      heading: 'Why this matters for latency, and the customization pgx offers',
      points: [
        'The practical consequence: a query that is cancelled via context (a deadline that fired, or an explicit cancel() call) does not just fail that one query — it also costs the pool one of its established connections, which pgxpool must then re-establish (a fresh TCP handshake and PostgreSQL authentication) the next time a connection is needed. Under a workload with frequent, expected cancellations (e.g., a search-as-you-type endpoint that deliberately cancels a stale in-flight query when a newer request supersedes it), this default behavior can mean the pool is constantly tearing down and rebuilding connections rather than settling into a genuinely reused, warm pool.',
        'pgconn\'s own documentation names the customization point directly: "This behavior can be customized by using BuildContextWatcherHandler on the Config to create a ctxwatch.Handler with different behavior... CancelRequestContextWatcherHandler can be used to introduce a delay before interrupting the query in such a way as to close the connection." There is a dedicated CancelRequest mechanism that sends an actual PostgreSQL wire-protocol cancellation message to the server, as an alternative to unconditionally closing the local connection.',
        'This is a real, deliberate tradeoff to reason about, not a bug to "fix" blindly: the default (immediate return, connection closed) is the SAFE choice with no ambiguity about connection state; CancelRequestContextWatcherHandler is the PERFORMANCE-oriented choice for workloads with frequent, expected cancellations, at the cost of the added complexity and edge cases (per pgx\'s own CancelRequest docs: "lack of an error does not ensure that the query was canceled... there is no way to be sure a query was canceled") that come with attempting a genuine server-side cancellation instead of simply discarding the connection.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Observing a cancelled query close its own connection',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
)

func main() {
    ctx := context.Background()
    pool, _ := pgxpool.New(ctx, "postgres://user:pass@localhost/mydb")
    defer pool.Close()

    statsBefore := pool.Stat()
    fmt.Println("total conns before:", statsBefore.TotalConns())

    // A deliberately-too-short deadline for a deliberately slow
    // query -- this WILL be cancelled mid-execution.
    queryCtx, cancel := context.WithTimeout(ctx, 5*time.Millisecond)
    defer cancel()

    var result int
    err := pool.QueryRow(queryCtx, "SELECT pg_sleep(1), 1").Scan(&result)
    fmt.Println("query error (expected):", err)

    // Give the pool a moment to notice the connection needs
    // replacing, then check its stats again.
    time.Sleep(100 * time.Millisecond)
    statsAfter := pool.Stat()

    // Per this subtopic's theory, the connection this query used was
    // CLOSED (not returned) as the default reaction to cancellation --
    // the pool's own NewConnsCount (or a similar "had to establish a
    // new connection" signal) reflects that a fresh connection was
    // needed, rather than the SAME warm connection being reused
    // immediately for the next query.
    fmt.Println("total conns after:", statsAfter.TotalConns())
}`,
    },
    {
      label: 'Opting into the CancelRequest-based handler for frequent cancellations',
      language: 'typescript',
      code: `package main

import (
    "context"

    "github.com/jackc/pgx/v5/pgconn"
    "github.com/jackc/pgx/v5/pgconn/ctxwatch"
    "github.com/jackc/pgx/v5/pgxpool"
)

// newSearchPool is tuned for a workload with FREQUENT, EXPECTED
// cancellations -- e.g. a search-as-you-type endpoint that cancels
// the previous in-flight query every time a newer keystroke arrives.
// Opting into CancelRequestContextWatcherHandler avoids paying a
// fresh-connection cost on every single cancellation.
func newSearchPool(ctx context.Context, connString string) (*pgxpool.Pool, error) {
    config, err := pgxpool.ParseConfig(connString)
    if err != nil {
        return nil, err
    }

    // Per pgconn's own docs, this sends a real PostgreSQL wire-level
    // cancel request instead of unconditionally closing the local
    // connection on every context cancellation.
    config.ConnConfig.BuildContextWatcherHandler = func(conn *pgconn.PgConn) ctxwatch.Handler {
        return &ctxwatch.CancelRequestContextWatcherHandler{
            Conn: conn,
        }
    }

    return pgxpool.NewWithConfig(ctx, config)
}

// NOTE: this is the deliberate PERFORMANCE tradeoff this subtopic's
// theory describes -- pgx's own docs are explicit that "lack of an
// error does not ensure that the query was canceled," so this
// handler trades some cancellation-certainty for avoiding constant
// connection churn under a workload that cancels often and expects
// most in-flight queries to simply be short-lived and superseded.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team builds a typeahead search endpoint that, on every new keystroke, cancels the context of the PREVIOUS in-flight search query before starting a new one — a deliberate, expected, high-frequency cancellation pattern. After shipping, they notice their pgxpool\'s connection count metric is unexpectedly volatile, frequently dropping and climbing back up, and Postgres server logs show a steady stream of new connection/authentication events. Using this subtopic\'s theory, diagnose the cause, and describe the fix.',
    hint: 'Per this subtopic\'s theory, what is pgx\'s DEFAULT reaction to a context cancellation happening mid-query — does the connection get returned to the pool for reuse, or closed outright? Given how FREQUENTLY this endpoint deliberately cancels in-flight queries, what would repeatedly triggering that default reaction look like in pool and server-connection metrics?',
    solution: 'The cause is exactly the default behavior this subtopic\'s theory describes: "the default behavior when a context is canceled is for the method to immediately return. In most circumstances, this will also close the underlying connection." Because this endpoint is DELIBERATELY and FREQUENTLY cancelling in-flight queries (every keystroke cancels the previous search), it is repeatedly triggering pgx\'s default connection-closing reaction — each cancelled search query destroys the connection it was using, forcing pgxpool to establish a brand-new connection (a fresh TCP handshake and PostgreSQL authentication) the next time a connection is needed, exactly matching the "steady stream of new connection/authentication events" observed in the Postgres server logs and the volatile pool connection-count metric. The fix, per this subtopic\'s theory and second code example, is to configure the pool\'s ConnConfig with a BuildContextWatcherHandler that returns a CancelRequestContextWatcherHandler, switching from the default "close the connection outright" reaction to sending a genuine PostgreSQL wire-protocol CancelRequest instead — this asks PostgreSQL to stop the in-progress query on the SERVER side while leaving the LOCAL connection intact and reusable, avoiding the constant connection churn this workload\'s cancellation-heavy pattern was triggering under the default behavior. This is precisely the scenario this subtopic\'s theory identifies as the deliberate use case for that handler: "a workload with frequent, expected cancellations," which a keystroke-driven typeahead search endpoint is a textbook example of.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own theory statement — "the pool cleans up the connection automatically" after a context cancellation — means the connection is returned to the pool in a clean, immediately-reusable state, similar to what happens after any normal, successfully-completed query.',
      reality: 'This subtopic\'s theory quotes pgconn\'s own documentation directly to show "cleans up" specifically means CLOSING the connection by default, not gracefully returning it for reuse: "the default behavior when a context is canceled is for the method to immediately return. In most circumstances, this will also close the underlying connection." The main page\'s own phrasing is accurate but easy to misread as describing a cheaper, more graceful outcome than what actually happens.'
    },
    {
      thought: 'A query cancelled via context is stopped immediately on BOTH the Go client side and the PostgreSQL server side at the same moment — cancelling the context in Go code directly halts the query\'s execution on the database server too.',
      reality: 'This subtopic\'s theory distinguishes these as two SEPARATE things by default: cancelling a Go context only controls whether the Go-side method call stops waiting and returns — it does NOT, by default, tell PostgreSQL to actually stop running that query on the server. The query may continue executing on the server after the Go side has already given up and closed the connection, unless the CancelRequestContextWatcherHandler this subtopic\'s second code example describes is explicitly configured to send a real server-side cancellation.'
    },
    {
      thought: 'Since pgx offers CancelRequestContextWatcherHandler as an alternative to the default connection-closing behavior, and it avoids the connection-churn cost this subtopic describes, it is a strictly better configuration that every pgx application should switch to by default.',
      reality: 'This subtopic\'s theory frames this as a genuine tradeoff, not a strict improvement: the default (close-the-connection) behavior is the SAFE choice with no ambiguity about connection state after a cancellation, while CancelRequestContextWatcherHandler trades some certainty for performance — pgx\'s own documentation is explicit that "lack of an error does not ensure that the query was canceled... there is no way to be sure a query was canceled." The right choice depends on whether an application\'s workload genuinely has frequent, expected cancellations (like the typeahead search in this subtopic\'s exercise) or only rare, unexpected ones, where the default\'s simplicity and safety may be preferable.'
    }
  ];
}
