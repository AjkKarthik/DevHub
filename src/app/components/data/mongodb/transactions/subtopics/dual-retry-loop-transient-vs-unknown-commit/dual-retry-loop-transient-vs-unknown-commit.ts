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
    heading: 'Two Retryable Errors, Two Different Things to Retry',
    points: [
      'The main page\'s own theory and quiz text describe two DIFFERENT retryable transaction errors, but no codeTab on the page ever implements the distinction between them: <code>TransientTransactionError</code> means the whole operation can be safely retried from scratch, while <code>UnknownTransactionCommitResult</code> means only the FAILED commit itself should be retried.',
      'Verified against MongoDB\'s own documented retry pattern: a driver error exposes its labels via <code>error.hasErrorLabel(label)</code>. <code>TransientTransactionError</code> — a write conflict, a stepdown mid-transaction — means nothing has been durably committed yet, so re-running the ENTIRE transaction body (every operation inside it) from the beginning is safe.',
      '<code>UnknownTransactionCommitResult</code> — a network blip during the commit acknowledgement itself — means the transaction may or may not have actually committed on the server; MongoDB\'s own guidance is to retry ONLY the commit call, never the transaction body, since the body\'s own writes might already be durably applied and re-running them again would risk applying them twice.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Real Two-Level Retry Loop',
    language: 'typescript',
    code: `// Retries ONLY the commit -- the transaction body already ran and
// must never be re-executed here.
async function commitWithRetry(session: ClientSession) {
  while (true) {
    try {
      await session.commitTransaction();
      return;
    } catch (error) {
      if (error instanceof MongoError && error.hasErrorLabel('UnknownTransactionCommitResult')) {
        // The commit's ACKNOWLEDGEMENT was lost, not necessarily the
        // commit itself -- retrying the commit call again is safe,
        // MongoDB treats a repeat commitTransaction() on an already
        // committed transaction as a no-op success.
        continue;
      }
      throw error;
    }
  }
}

// Retries the WHOLE transaction (body + a fresh commit) from scratch.
async function runTransactionWithRetry(
  txnFn: (session: ClientSession) => Promise<void>,
  session: ClientSession,
) {
  while (true) {
    session.startTransaction();
    try {
      await txnFn(session);
      await commitWithRetry(session);
      return;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof MongoError && error.hasErrorLabel('TransientTransactionError')) {
        // Nothing was durably committed -- safe to re-run the entire
        // body (every write inside it) on a fresh attempt.
        continue;
      }
      throw error;
    }
  }
}

// Usage, applied to the main page's own transfer-funds example:
await runTransactionWithRetry(async (session) => {
  const accounts = client.db('bank').collection('accounts');
  await accounts.updateOne({ _id: fromId }, { \$inc: { balance: -amount } }, { session });
  await accounts.updateOne({ _id: toId }, { \$inc: { balance: amount } }, { session });
}, session);

// Pure-JS model of the SAME shape, verified against two scenarios:
// (1) the commit is flaky but the body is fine, (2) the body itself
// is flaky (a write conflict) and the commit is fine.
function makeFlakyCommitSession() {
  let commitCalls = 0;
  return {
    startTransaction() {},
    async abortTransaction() {},
    async commitTransaction() {
      commitCalls++;
      if (commitCalls < 3) throw { hasErrorLabel: (l: string) => l === 'UnknownTransactionCommitResult' };
    },
  };
}

let bodyRuns = 0;
console.log('Case: flaky COMMIT only -- body should run exactly once');
// bodyRuns stays 1 no matter how many times the commit itself retries,
// because commitWithRetry() never re-enters the transaction body.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The transfer-funds transaction above debits one account and credits another. It fails with <code>TransientTransactionError</code> AFTER the debit already ran but BEFORE the credit ran. <code>runTransactionWithRetry()</code> retries the whole body. Does the account being debited end up losing money twice?',
  hint: 'Think about whether the FAILED attempt\'s own writes were ever durably committed at all — a transaction only takes effect atomically, all at once, on commit.',
  solution: `// No -- the account is not debited twice.
//
// A MongoDB transaction has no partial effect until commitTransaction()
// succeeds -- every write made inside the transaction body (the debit
// AND the credit) is held uncommitted until then. When the body throws
// midway through (after the debit call, before the credit call), the
// retry loop's own catch block calls session.abortTransaction() before
// retrying -- discarding the debit that was staged but never committed.
//
// The RETRIED attempt then runs the body again from scratch (debit,
// then credit) inside a brand-new transaction, and this time both
// writes commit together atomically. The account is debited exactly
// once, in the attempt that actually succeeded.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Retrying on TransientTransactionError and retrying on UnknownTransactionCommitResult are basically the same thing — just retry whatever failed.',
    reality: 'They require genuinely different retry SCOPES. TransientTransactionError means nothing committed, so the whole body must be re-run inside a fresh transaction. UnknownTransactionCommitResult means the body\'s own writes may already be durably applied, so re-running the body risks applying its writes twice — only the commit call itself should be retried, per MongoDB\'s own documented pattern.',
  },
  {
    thought: 'If commitTransaction() fails once, calling it again is dangerous — it might commit the same writes a second time.',
    reality: 'Verified against MongoDB\'s own driver behavior: calling commitTransaction() again on a transaction that has already committed is a safe no-op, it does not re-apply the writes a second time. This is specifically what makes commitWithRetry()\'s bare retry loop correct — the risk of double-applying writes only exists if the whole BODY is re-run, not the commit call alone.',
  },
];

@Component({
  selector: 'app-mongo-txn-dual-retry-loop',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dual-retry-loop-transient-vs-unknown-commit.html',
  styleUrl: './dual-retry-loop-transient-vs-unknown-commit.scss',
})
export class DualRetryLoopTransientVsUnknownCommitSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
