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
  templateUrl: './transfer-idempotency-check-then-act.html',
  styleUrl: './transfer-idempotency-check-then-act.scss'
})
export class TransferSolutionUsedTheRaceConditionItsOwnQuizWarnsAboutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page\'s own quiz names this exact anti-pattern — the Challenge solution originally used it anyway',
      points: [
        'The main page\'s own quiz (question 4) explicitly explains a race condition in idempotency handling: a plain "SELECT to check, then INSERT the result after processing" is unsafe, because two nearly-simultaneous requests can both pass the check before either has written its result, causing duplicate processing. The quiz explanation states the fix requires "a database uniqueness constraint or equivalent atomic claim, not a naive check-then-act pattern."',
        'The SAME page\'s Challenge solution (a wallet-to-wallet transfer function) originally implemented exactly the pattern the quiz warns against: const existing = await db.query(\'SELECT * FROM transfers WHERE id = ?\', [transferId]); if (existing) return existing; — a bare read-then-later-write, with real work (balance checks, ledger writes, balance updates) happening in between the check and the eventual INSERT into transfers. The page has been corrected to add a try/catch around the transaction that treats a unique-constraint violation on transfers.id as "lost the race — return the winner\'s result" instead of letting the error surface to the caller.',
      ]
    },
    {
      heading: 'Why this specific gap matters even though the money itself was still protected',
      points: [
        'Because transferId is inserted as the transfers table\'s own id (implicitly its primary key, going by the SELECT ... WHERE id = ? lookup), a genuine primary-key uniqueness violation WOULD occur if two concurrent requests both reached the final INSERT — the database itself would reject the second one, and since that INSERT happens inside a db.transaction(...) block, the whole losing transaction (including its balance updates and ledger writes) would roll back. So the underlying MONEY-SAFETY property (no double-spend) was actually preserved by the schema even before this fix.',
        'What was NOT correct is what the LOSING concurrent request received back: an uncaught database error (a unique constraint violation), rather than the successful transfer result the idempotency contract promises on a retry. A caller retrying a request that had, in fact, already succeeded (via the other concurrent attempt) would see an error instead of getting back the same success response — which breaks the actual meaning of "idempotent": retrying should be safe and return the same result, not sometimes return an error for what is actually a successful, already-completed operation.',
        'The fix wraps the transaction attempt in a try/catch: on a unique-constraint violation for transfers.id, it re-fetches and returns the WINNING transaction\'s result instead of propagating the error — turning a "money-safe but response-incorrect" implementation into one that\'s both money-safe and correctly idempotent from the caller\'s point of view.',
      ]
    },
    {
      heading: 'Comparing this to the page\'s OWN correct example, just above it',
      points: [
        'The page\'s earlier "Idempotent Payment" code sample (a single-payment charge, not the transfer Challenge) handles this correctly: it acquires a distributed lock (redlock.acquire) BEFORE doing any work, re-checks the idempotency cache after acquiring the lock, and only then proceeds — a genuine atomic claim, not a bare check-then-act.',
        'This makes the Challenge solution\'s original gap more notable: the page already demonstrates the correct pattern once, explains the failure mode a second time in the quiz explanation, and then the Challenge\'s own "reference" solution didn\'t apply either — worth catching specifically BECAUSE the correct pattern and the explicit warning were both already present elsewhere on the same page.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Check-then-act vs. claim-with-fallback',
      language: 'typescript',
      code: `// The ORIGINAL gap: a bare check, with no atomic claim, before
// real work happens.
async function transferUnsafe(transferId: string /* ...other args */) {
  const existing = await db.query('SELECT * FROM transfers WHERE id = ?', [transferId]);
  if (existing) return existing;

  // Two concurrent calls with the SAME transferId can BOTH pass the
  // check above (neither has written yet), then both do real work:
  return await db.transaction(async tx => {
    // ... balance check, ledger writes, balance updates ...
    await tx.run('INSERT INTO transfers (id, ...) VALUES (?, ...)', [transferId /*...*/]);
    // If transfers.id is a PRIMARY KEY, the SECOND concurrent call's
    // INSERT throws a unique-violation here -- but with no catch,
    // that error propagates straight to the caller as a failure,
    // even though the transfer itself actually succeeded (via the
    // OTHER concurrent call).
  });
}

// The fix: treat a unique-violation on transfers.id as "I lost the
// race" and return the WINNER's result instead of surfacing an error.
async function transferSafe(transferId: string /* ...other args */) {
  const existing = await db.query('SELECT * FROM transfers WHERE id = ?', [transferId]);
  if (existing) return existing;

  try {
    return await db.transaction(async tx => {
      // ... balance check, ledger writes, balance updates ...
      await tx.run('INSERT INTO transfers (id, ...) VALUES (?, ...)', [transferId /*...*/]);
      return { id: transferId, status: 'completed' /* ... */ };
    });
  } catch (err) {
    if (isUniqueViolation(err, 'transfers.id')) {
      // Someone else already committed this transferId -- return
      // THEIR result, so the caller sees the same success response
      // regardless of which concurrent attempt actually "won."
      return await db.query('SELECT * FROM transfers WHERE id = ?', [transferId]);
    }
    throw err;
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A wallet transfer function checks for an existing transfer with SELECT ... WHERE id = ?, and if not found, proceeds to do balance checks, ledger writes, and finally INSERTs a row into transfers using the same id as its primary key. Two requests with the same transferId arrive nearly simultaneously. Is money at risk? Is the function correctly idempotent from the caller\'s perspective?',
    hint: 'If transfers.id is a primary key, what happens to the SECOND concurrent request\'s INSERT once the first has already committed -- and does that failure get handled, or does it propagate as an error to whoever called the function?',
    solution: 'Money is NOT at risk, assuming transfers.id is a primary key: the second concurrent request\'s INSERT fails with a unique-constraint violation, and since it happens inside a database transaction, that failure rolls back the SECOND request\'s balance updates and ledger writes along with it -- only one transfer actually completes. However, the function is NOT correctly idempotent from the caller\'s perspective UNLESS that unique-violation is caught: without a try/catch, the losing request receives an uncaught database error instead of the successful transfer result that a proper idempotency contract promises on retry. The fix catches the unique-violation specifically and re-fetches/returns the WINNING request\'s result instead of letting the error propagate -- preserving both money-safety (already true) and correct idempotent behavior (the actual gap).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If two concurrent requests with the same idempotency key both reach a database INSERT protected by a primary-key/unique constraint, the system is automatically both money-safe AND correctly idempotent, since the constraint prevents the duplicate.',
      reality: 'Per this subtopic\'s theory, the constraint alone only prevents the DUPLICATE DATA (money-safety) — it does NOT automatically make the LOSING request\'s caller receive the expected success response; without an explicit catch that re-fetches and returns the winner\'s result, the loser sees an error instead, which breaks the idempotency contract even though no money was actually at risk.'
    },
    {
      thought: 'A code sample labeled as the "solution" to a Challenge on the same page that already explains a specific race-condition anti-pattern (via its own quiz) is unlikely to contain that exact anti-pattern itself.',
      reality: 'Per this subtopic\'s theory, this is precisely what happened here — the page\'s own quiz (question 4) explicitly describes and warns against a check-then-act idempotency race, and the Challenge solution elsewhere on the SAME page originally implemented exactly that pattern, showing that even content that correctly explains a pitfall in one section can still exhibit it in another.'
    },
    {
      thought: 'Since the earlier "Idempotent Payment" code sample on the same page correctly uses a distributed lock before doing any work, every OTHER code sample on the page dealing with idempotency can be assumed to follow the same correct pattern.',
      reality: 'Per this subtopic\'s theory, each code sample needs to be checked independently — the Challenge solution\'s transfer function, despite being on the same page as the correct "Idempotent Payment" example, originally used a different and less safe pattern (bare check-then-act) for its own idempotency handling.'
    }
  ];
}
