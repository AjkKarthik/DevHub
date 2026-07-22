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
  templateUrl: './pgx-batch-sends-queries-in-one-round-trip.html',
  styleUrl: './pgx-batch-sends-queries-in-one-round-trip.scss'
})
export class PgxBatchSendsQueriesInOneRoundTripSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names pgx.Batch as the fix for N+1 queries — but never actually codes it',
      points: [
        'The main page\'s own quiz asks directly "what is pgx batch querying and when should you use it," with the answer describing it as "sending multiple queries to PostgreSQL in a single network round-trip — useful for N+1 query elimination or bulk inserts." That is an accurate summary, but none of the main page\'s own five code tabs ever actually construct or send a Batch — this subtopic fills exactly that gap.',
        'Queries are queued with Batch.Queue(query, arguments...), per pgx\'s own documentation: "Queue queues a query to batch b." Multiple Queue calls accumulate queries on the same Batch value without sending anything yet — nothing touches the network until the whole batch is sent together.',
        'The actual send happens via Conn.SendBatch(ctx, batch) (or pool.SendBatch on a pgxpool.Pool), which pgx\'s own docs describe precisely: "SendBatch sends all queued queries to the server at once. All queries are run in an implicit transaction unless explicit transaction control statements are executed." This single round-trip is the entire performance benefit — instead of N separate network round-trips for N queries, there is exactly one.',
      ]
    },
    {
      heading: 'Reading results back, and the one rule that is easy to miss',
      points: [
        'SendBatch returns a BatchResults value, which exposes Query/QueryRow/Exec methods that must be called in the SAME order the corresponding queries were queued — each call reads the next queued query\'s own result off the wire, sequentially, matching how the server processes and returns them in the exact order they were sent.',
        'pgx\'s own documentation states a requirement about BatchResults that is easy to overlook: "The returned BatchResults must be closed before the connection is used again... Close must be called before the underlying connection can be used again." Forgetting br.Close() leaves the connection in a state pgx will not let be reused for anything else — a direct parallel to the main page\'s own "always defer rows.Close()" advice for ordinary Query calls, just for a different type.',
        'The consequence of an error partway through a batch is more severe than an ordinary query error: per pgx\'s own docs, "any error that occurred during a batch operation may have made it impossible to resynchronize the connection with the server. In this case the underlying connection will have been closed." A failed batch does not just fail gracefully and return the connection to the pool for reuse — pgx may need to discard the connection ENTIRELY, closing it rather than returning it, precisely because the batch protocol has no reliable way to skip past a failure mid-stream and resynchronize.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The N+1 problem Batch is meant to solve',
      language: 'typescript',
      code: `package main

import (
    "context"

    "github.com/jackc/pgx/v5/pgxpool"
)

// getOrderTotals makes ONE round-trip PER order ID -- for 50 order
// IDs, this is 50 separate network round-trips to Postgres, each
// paying the full network latency cost individually.
func getOrderTotalsNPlusOne(ctx context.Context, pool *pgxpool.Pool, orderIDs []int) (map[int]float64, error) {
    totals := make(map[int]float64)
    for _, id := range orderIDs {
        var total float64
        err := pool.QueryRow(ctx,
            "SELECT SUM(price * qty) FROM order_items WHERE order_id = $1", id,
        ).Scan(&total)
        if err != nil {
            return nil, err
        }
        totals[id] = total
    }
    return totals, nil // correct, but N separate round-trips
}`,
    },
    {
      label: 'The fix: queue all queries, send them in one round-trip',
      language: 'typescript',
      code: `package main

import (
    "context"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

// getOrderTotalsBatched queues all N queries on ONE Batch, then sends
// them together via SendBatch -- exactly ONE round-trip regardless
// of how many order IDs are in the list.
func getOrderTotalsBatched(ctx context.Context, pool *pgxpool.Pool, orderIDs []int) (map[int]float64, error) {
    batch := &pgx.Batch{}
    for _, id := range orderIDs {
        batch.Queue("SELECT SUM(price * qty) FROM order_items WHERE order_id = $1", id)
    }

    br := pool.SendBatch(ctx, batch)
    // MUST be closed before the connection can be used again -- per
    // pgx's own documented requirement, exactly like rows.Close()
    // for an ordinary Query.
    defer br.Close()

    totals := make(map[int]float64)
    for _, id := range orderIDs {
        // Results MUST be read in the SAME order queries were
        // queued -- this QueryRow call reads the NEXT queued
        // query's result, not one matched by id explicitly.
        var total float64
        if err := br.QueryRow().Scan(&total); err != nil {
            return nil, err
        }
        totals[id] = total
    }
    return totals, nil // one round-trip total, not N
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer batches 10 INSERT statements using pgx.Batch and pool.SendBatch, but forgets to call br.Close() on the returned BatchResults, moving straight on to make ANOTHER query using the same pool.QueryRow(...) call right after. Using this subtopic\'s theory, predict what happens, and explain the underlying reason.',
    hint: 'Per this subtopic\'s theory, what does pgx\'s own documentation say is required "before the underlying connection can be used again" after SendBatch? What connection does the very next pool.QueryRow call in this scenario end up trying to use?',
    solution: 'The most likely outcome is that the subsequent pool.QueryRow call either hangs, errors, or (if pgx/the pool detects the issue) the connection ends up being discarded rather than reused correctly — because per this subtopic\'s theory, pgx\'s own documentation states directly: "The returned BatchResults must be closed before the connection is used again... Close must be called before the underlying connection can be used again." The underlying connection the batch was sent on is left in an intermediate, not-fully-synchronized protocol state until br.Close() runs — the server may still have unread results queued up for that connection, or the client-side connection object may not know the batch protocol exchange has fully concluded. If the pool then hands that SAME still-mid-batch connection to the next pool.QueryRow call (since, from the pool\'s perspective, nothing has told it the connection is unusable yet), that call is operating on a connection whose protocol state does not match what a fresh QueryRow expects, which can produce a hang waiting for data that will never arrive in the expected shape, a confusing protocol-level error, or corrupted/misaligned results — exactly the kind of connection-state bug this subtopic\'s theory\'s emphasis on "must be closed before the connection is used again" exists to prevent. The fix is the same discipline already established for ordinary rows.Close() on the main page: defer br.Close() immediately after SendBatch returns, exactly as shown in this subtopic\'s second code example, so the connection is always properly resynchronized (or correctly discarded, per pgx\'s own error-handling behavior) before anything else attempts to reuse it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'pgx.Batch is mainly useful for running several genuinely UNRELATED queries concurrently, similar to launching several goroutines that each run their own query — the main benefit is parallelism.',
      reality: 'This subtopic\'s theory and first two code examples show the actual benefit is the opposite of parallelism — it is reducing MULTIPLE SEQUENTIAL round-trips down to exactly ONE round-trip, by queuing every query first and sending them together. The queries still execute sequentially on the server side ("all queries are run in an implicit transaction," per pgx\'s own docs) — the win is eliminating N separate network latency costs, not running things concurrently.'
    },
    {
      thought: 'BatchResults results can be read back in any order using br.Query()/br.QueryRow()/br.Exec() as needed, similar to how a map or a slice with known indices could be accessed in any order — the caller just needs to know which result corresponds to which queued query.',
      reality: 'This subtopic\'s theory and second code example show results must be read strictly in the SAME order the queries were originally queued — each call to br.QueryRow() (or Query()/Exec()) consumes the NEXT result in the sequence, not a result selected by any kind of index or lookup key. The getOrderTotalsBatched example relies entirely on iterating orderIDs in the identical order the batch queries were queued in, specifically because there is no other way to correlate a result back to its originating query.'
    },
    {
      thought: 'Forgetting to call br.Close() after SendBatch is a minor oversight, similar to a small resource leak that might slow things down slightly over time but would not cause an immediately broken query or connection.',
      reality: 'This subtopic\'s exercise and theory show the consequence is more severe and more immediate than a typical leak: per pgx\'s own documentation, the connection is genuinely unusable for anything else "before the underlying connection can be used again" — a subsequent query attempted on the same still-open-batch connection risks a hang, a protocol-level error, or corrupted results, not merely a slow resource drain over time.'
    }
  ];
}
