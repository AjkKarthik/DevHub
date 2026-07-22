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
  templateUrl: './for-update-lock-ordering-can-deadlock.html',
  styleUrl: './for-update-lock-ordering-can-deadlock.scss'
})
export class ForUpdateLockOrderingCanDeadlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own transferFunds example uses FOR UPDATE — without ever explaining what it locks or why',
      points: [
        'The main page\'s own Transactions code tab includes this exact line, with no accompanying theory bullet explaining it: SELECT balance FROM accounts WHERE id = $1 FOR UPDATE. FOR UPDATE is a row-level locking clause — it tells PostgreSQL to lock the specific row(s) the SELECT returns, for the remainder of the current transaction, blocking any OTHER transaction that tries to acquire a conflicting lock on those same rows until this one commits or rolls back.',
        'This is precisely why the main page\'s own transferFunds function uses it: without FOR UPDATE, two concurrent transfers reading the SAME account\'s balance at nearly the same moment could both read the pre-transfer balance, both deduct from it independently, and end up leaving the account with an incorrect final balance — a classic lost-update race condition. FOR UPDATE prevents this by making the second concurrent transaction WAIT for the first to finish before it can even read the balance.',
        'What the main page never mentions is the well-documented cost of this protection: PostgreSQL\'s own documentation describes exactly the scenario this subtopic explores using the SAME domain (bank account transfers) as its canonical deadlock example — two transactions, each successfully locking one row and then waiting on the OTHER transaction\'s already-locked row, produces "a deadlock condition."',
      ]
    },
    {
      heading: 'The main page\'s own transferFunds function has this exact latent risk — and the standard fix',
      points: [
        'Look closely at the main page\'s own transferFunds(ctx, pool, fromID, toID, amount) signature: it always locks fromID first (via the FOR UPDATE select), then updates toID afterward. Now consider two concurrent calls: transferFunds(ctx, pool, accountA, accountB, 50) running at the same time as transferFunds(ctx, pool, accountB, accountA, 30) — a transfer from A to B, and a simultaneous transfer from B to A.',
        'The first call locks A, then tries to update B. The second call locks B, then tries to update A. Each is now waiting on a lock the OTHER transaction already holds — exactly PostgreSQL\'s own documented deadlock shape. Per PostgreSQL\'s own documentation: "PostgreSQL automatically detects deadlock situations and resolves them by aborting one of the transactions involved... exactly which transaction will be aborted is difficult to predict and should not be relied upon."',
        'The standard, documented fix is consistent lock ordering: always acquire row locks in the SAME relative order across every transaction that might lock the same set of rows — for instance, always locking the account with the SMALLER numeric ID first, regardless of whether that account is the "from" or "to" side of a given transfer. This eliminates the deadlock shape entirely, since every concurrent transaction now competes for the first lock in the identical order, rather than two transactions approaching the same pair of rows from opposite directions.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern: locks in caller-determined order',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"

    "github.com/jackc/pgx/v5/pgxpool"
)

// This mirrors the main page's own transferFunds exactly: it always
// locks "fromID" FIRST via FOR UPDATE, then updates "toID" second --
// the LOCK ORDER is determined entirely by which argument the CALLER
// happened to pass as "from" vs "to", not by anything about the
// accounts themselves.
func transferFunds(ctx context.Context, pool *pgxpool.Pool, fromID, toID int, amount float64) error {
    tx, err := pool.Begin(ctx)
    if err != nil {
        return err
    }
    defer tx.Rollback(ctx)

    var balance float64
    err = tx.QueryRow(ctx,
        "SELECT balance FROM accounts WHERE id = $1 FOR UPDATE", fromID, // locks fromID FIRST
    ).Scan(&balance)
    if err != nil {
        return err
    }
    if balance < amount {
        return fmt.Errorf("insufficient funds")
    }

    if _, err = tx.Exec(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID); err != nil {
        return err
    }
    if _, err = tx.Exec(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID); err != nil {
        return err
    }
    return tx.Commit(ctx)
}

// DANGER: calling transferFunds(ctx, pool, 1, 2, 50) CONCURRENTLY
// with transferFunds(ctx, pool, 2, 1, 30) -- a transfer A->B racing
// a transfer B->A -- locks account 1 first in one call and account 2
// first in the OTHER call. Per this subtopic's theory, this is
// exactly PostgreSQL's own documented deadlock shape.`,
    },
    {
      label: 'The fix: always lock in a consistent order, regardless of direction',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"

    "github.com/jackc/pgx/v5/pgxpool"
)

// transferFundsSafe fixes the deadlock risk by determining lock
// order from the ACCOUNT IDs themselves (always lower ID first),
// completely independent of which account is logically "from" and
// which is "to" -- eliminating the two-transactions-approaching-
// from-opposite-directions shape entirely.
func transferFundsSafe(ctx context.Context, pool *pgxpool.Pool, fromID, toID int, amount float64) error {
    tx, err := pool.Begin(ctx)
    if err != nil {
        return err
    }
    defer tx.Rollback(ctx)

    // Determine lock order independent of "from"/"to" semantics --
    // ALWAYS lock the lower ID first, regardless of transfer
    // direction.
    firstLockID, secondLockID := fromID, toID
    if secondLockID < firstLockID {
        firstLockID, secondLockID = secondLockID, firstLockID
    }

    // Lock BOTH rows up front, in the consistent order -- any
    // concurrent transferFundsSafe call between these same two
    // accounts, in EITHER direction, will lock them in this exact
    // same order too, so the deadlock shape (each transaction
    // holding what the other wants) can no longer occur.
    if _, err := tx.Exec(ctx, "SELECT 1 FROM accounts WHERE id = $1 FOR UPDATE", firstLockID); err != nil {
        return err
    }
    if _, err := tx.Exec(ctx, "SELECT 1 FROM accounts WHERE id = $1 FOR UPDATE", secondLockID); err != nil {
        return err
    }

    var balance float64
    if err := tx.QueryRow(ctx, "SELECT balance FROM accounts WHERE id = $1", fromID).Scan(&balance); err != nil {
        return err
    }
    if balance < amount {
        return fmt.Errorf("insufficient funds")
    }

    if _, err = tx.Exec(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID); err != nil {
        return err
    }
    if _, err = tx.Exec(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID); err != nil {
        return err
    }
    return tx.Commit(ctx)
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team using the main page\'s own transferFunds function (locking fromID first, then updating toID) runs a load test simulating many concurrent transfers between random pairs of accounts, in both directions. Occasionally, a transfer fails with a PostgreSQL "deadlock detected" error, and retrying the exact same transfer immediately afterward always succeeds. Using this subtopic\'s theory, explain precisely why this specific failure pattern occurs, and why simply retrying happens to work.',
    hint: 'Per this subtopic\'s theory, what specific combination of two concurrent transferFunds calls reproduces PostgreSQL\'s own documented deadlock shape? Once PostgreSQL detects and resolves a deadlock by aborting one transaction, does the underlying data or lock state remain in a way that would make a RETRY of that same aborted transaction fail again for the same reason?',
    solution: 'This failure pattern occurs precisely when two concurrent transferFunds calls happen to involve the SAME two accounts in OPPOSITE directions at nearly the same moment — for example, one call transferring from account A to account B while another, concurrent call transfers from account B to account A. Per this subtopic\'s theory and first code example, each call locks its own "fromID" first via FOR UPDATE: the A→B call locks A first, and the concurrent B→A call locks B first. Each transaction then tries to update the OTHER account, which requires acquiring a lock the other transaction already holds — exactly PostgreSQL\'s own documented deadlock condition, where "PostgreSQL automatically detects deadlock situations and resolves them by aborting one of the transactions involved." This is why the failure is occasional rather than constant: it only manifests when the timing of two SPECIFIC, opposite-direction concurrent transfers between the SAME account pair happens to overlap closely enough for both to have already acquired their own first lock before either reaches its second. Retrying the aborted transfer succeeds because PostgreSQL\'s deadlock resolution works by rolling back ONE of the two conflicting transactions entirely — once that rollback completes, the row locks it was holding are released, so a retry of that same transfer starts fresh with no pre-existing conflicting lock state to collide with (unless, by unlucky timing, it collides with a NEW concurrent opposite-direction transfer, which is possible but statistically much less likely than the retry simply succeeding cleanly). The durable fix, per this subtopic\'s theory and second code example, is not to rely on retry-after-deadlock as the strategy, but to eliminate the deadlock SHAPE entirely by always acquiring locks in a consistent order (e.g., lower account ID first) regardless of transfer direction — removing the "two transactions approaching from opposite directions" pattern that makes the deadlock possible in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own transferFunds function is already fully correct as written — the FOR UPDATE clause exists specifically to prevent race conditions during concurrent transfers, and since it correctly locks the account before reading its balance, no further concurrency concern remains.',
      reality: 'This subtopic\'s theory and first code example show FOR UPDATE solves ONE specific race condition (the lost-update problem, where two concurrent transactions might both read a stale balance) while leaving a SEPARATE, genuine risk unaddressed: a deadlock between two concurrent transfers that lock the same two accounts in opposite orders. FOR UPDATE being present does not automatically mean the surrounding code is deadlock-safe — the ORDER in which multiple FOR UPDATE locks are acquired matters independently.'
    },
    {
      thought: 'A PostgreSQL deadlock, when it occurs, indicates a genuine bug or data corruption risk that requires careful manual intervention to resolve — the database might be left in an inconsistent state until an operator investigates.',
      reality: 'This subtopic\'s theory and exercise show PostgreSQL handles deadlocks automatically and safely by design: it detects the situation and aborts ONE of the two conflicting transactions (rolling it back completely, per PostgreSQL\'s own documentation), leaving the database in a fully consistent state with no partial updates from the aborted transaction. The problem is not data corruption — it is that the aborted transaction\'s own operation simply did not happen and needs to be retried or handled by the application.'
    },
    {
      thought: 'Since PostgreSQL automatically detects and resolves deadlocks by aborting one of the transactions, an application never strictly NEEDS to worry about lock ordering — as long as the application correctly retries any transaction that fails with a "deadlock detected" error, the system will still function correctly over time.',
      reality: 'This subtopic\'s exercise shows retry-after-deadlock does work as a stopgap, but it is not the recommended, durable fix — consistent lock ordering (shown in this subtopic\'s second code example) eliminates the deadlock shape ENTIRELY rather than merely tolerating and recovering from it. Relying purely on retries means every deadlock occurrence still costs a wasted transaction attempt, added latency, and (under high concurrency) can compound into cascading retry storms that a properly-ordered locking scheme avoids from the start.'
    }
  ];
}
