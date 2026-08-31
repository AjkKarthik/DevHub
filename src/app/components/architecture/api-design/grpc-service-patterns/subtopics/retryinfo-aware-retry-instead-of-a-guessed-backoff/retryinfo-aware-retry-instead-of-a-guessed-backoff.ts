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
    heading: 'A "Retryable" Status Code Alone Doesn’t Tell You How Long to Wait',
    points: [
      'The main page’s own QnA makes a precise point: knowing a status code like <code>UNAVAILABLE</code> is "generically retryable" is not enough on its own — "the <code>RetryInfo</code> detail message lets the SERVER tell the client exactly how long to wait before retrying... based on its own knowledge of the failure." No codeTab on the page shows a retry function that actually reads and respects this server-specified delay.',
      'The distinction the QnA draws matters: a client applying a FIXED or purely client-guessed backoff for every retryable status treats "I\'m rate-limiting you, retry in 30s" identically to "transient network blip, retry in 100ms" — even though the server explicitly told it the difference.',
      'A correct retry function needs to check TWO things before ever retrying: is this status code retryable at all (never retry <code>INVALID_ARGUMENT</code> — resending the identical malformed request will fail identically every time), and if so, what delay did the server actually specify via <code>RetryInfo</code> (falling back to a client-side default only when the server didn’t provide one).',
      'This is a genuinely different mechanism from this hub’s own Circuit Breaker topic (Architecture Patterns hub) — a circuit breaker decides whether to attempt a call AT ALL based on recent failure history; RetryInfo-aware retry decides HOW LONG TO WAIT before a specific already-failed call’s own next attempt, using information THAT call’s own error response provided.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'RetryInfo-Aware Retry',
    language: 'typescript',
    code: `interface RpcResult {
  code: 'OK' | 'UNAVAILABLE' | 'RESOURCE_EXHAUSTED' | 'INVALID_ARGUMENT';
  retryInfo?: { retryDelayMs: number }; // mirrors google.rpc.RetryInfo
}

// Only these codes are safe to retry at all -- INVALID_ARGUMENT and
// similar client-error codes will fail identically on every retry.
const RETRYABLE_CODES = new Set<RpcResult['code']>(['UNAVAILABLE', 'RESOURCE_EXHAUSTED']);

async function callWithRetry(
  fn: (attempt: number) => Promise<RpcResult>,
  maxAttempts = 3
): Promise<{ result: RpcResult; attempts: number; gaveUp?: string }> {
  let attempt = 0;
  while (true) {
    attempt++;
    const result = await fn(attempt);

    if (result.code === 'OK') return { result, attempts: attempt };
    if (!RETRYABLE_CODES.has(result.code)) {
      return { result, attempts: attempt, gaveUp: 'non-retryable status code' };
    }
    if (attempt >= maxAttempts) {
      return { result, attempts: attempt, gaveUp: 'max attempts reached' };
    }

    // Respect the SERVER-specified delay from RetryInfo -- never guess
    // a fixed backoff when the server told you exactly what it wants.
    const delayMs = result.retryInfo?.retryDelayMs ?? 1000; // client-side fallback only
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

// Case 1: server signals UNAVAILABLE with a 100ms retry delay; the
// second attempt succeeds.
let calls1 = 0;
callWithRetry(async () => {
  calls1++;
  if (calls1 === 1) return { code: 'UNAVAILABLE', retryInfo: { retryDelayMs: 100 } };
  return { code: 'OK' };
}).then(r => console.log('Case 1 (retryable, succeeds on retry):', r));
// { result: { code: 'OK' }, attempts: 2 }

// Case 2: INVALID_ARGUMENT -- never retried, regardless of maxAttempts.
callWithRetry(async () => ({ code: 'INVALID_ARGUMENT' }))
  .then(r => console.log('Case 2 (non-retryable, gives up immediately):', r));
// { result: { code: 'INVALID_ARGUMENT' }, attempts: 1, gaveUp: 'non-retryable status code' }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A server under heavy load returns <code>RESOURCE_EXHAUSTED</code> with <code>retryInfo: { retryDelayMs: 30000 }</code> (a 30-second rate-limit backoff) to a burst of 100 concurrent clients all calling the SAME endpoint at the SAME moment. If every one of those 100 clients faithfully waits exactly 30 seconds and retries, what real problem does that create — and what does <code>RetryInfo</code>’s own design NOT solve here?',
  hint: 'What happens to the server’s load at the exact instant, 30 seconds later, when all 100 clients that each independently and correctly followed the server’s instructions retry?',
  solution: `// RetryInfo solves the "how long should each INDIVIDUAL client wait"
// problem correctly -- every one of the 100 clients does exactly what
// the server asked. But it does NOT solve a coordination problem
// across clients: if all 100 clients received the identical
// retryDelayMs value and all started their wait at roughly the same
// moment, they ALL retry again at roughly the identical instant, 30
// seconds later -- recreating the exact overload spike RetryInfo's
// delay was meant to relieve, just shifted 30 seconds into the future
// (a "thundering herd" retry).

// A real client-side mitigation for this specific gap is to add
// JITTER -- a small random amount added to (or the retryDelayMs value
// scaled by a random factor around) the server-specified delay, so
// 100 clients spread their retries across a WINDOW around 30 seconds
// rather than all landing on the exact same instant. RetryInfo tells
// each client the right BASE delay; jitter is a client-side addition
// on top of it to avoid every client acting on that same information
// in perfect lockstep.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Any status code a retry function sees should be retried, as long as the client is willing to wait between attempts.',
    reality: 'The codeTab’s <code>RETRYABLE_CODES</code> set deliberately excludes codes like <code>INVALID_ARGUMENT</code> — Case 2 demonstrates this gives up on the FIRST attempt, with zero retries, regardless of how many attempts were allowed or how long a delay might have been specified. Retrying a malformed request produces the identical failure every time; waiting longer between attempts changes nothing about a request that will never succeed as written.',
  },
  {
    thought: 'A fixed exponential backoff (doubling the wait after each failed attempt) is always at least as good as respecting a server-specified <code>RetryInfo</code> delay.',
    reality: 'A fixed backoff strategy has no way to distinguish "the server wants a very SHORT wait because this was a transient blip" from "the server wants a very LONG wait because it\'s deliberately rate-limiting you" — both look identical to a purely client-side exponential curve. The main page’s own QnA states this directly: the server’s specified delay is based on information (its OWN knowledge of the failure cause) the client simply does not have access to any other way.',
  },
  {
    thought: 'Respecting the server’s exact <code>retryDelayMs</code> value is always sufficient on its own to avoid overloading a struggling server.',
    reality: 'The Try It above surfaces a real gap: when MANY clients all receive the same delay and retry in lockstep, respecting the delay precisely can recreate the same overload spike, just shifted in time. Client-side jitter on top of the server-specified delay is a real, necessary addition <code>RetryInfo</code> alone does not provide.',
  },
];

@Component({
  selector: 'app-api-grpc-retryinfo',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './retryinfo-aware-retry-instead-of-a-guessed-backoff.html',
  styleUrl: './retryinfo-aware-retry-instead-of-a-guessed-backoff.scss',
})
export class RetryinfoAwareRetryInsteadOfAGuessedBackoffSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
