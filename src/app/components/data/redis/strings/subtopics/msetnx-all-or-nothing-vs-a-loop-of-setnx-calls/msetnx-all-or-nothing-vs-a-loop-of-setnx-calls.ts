import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-msetnx-all-or-nothing-vs-a-loop-of-setnx-calls',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './msetnx-all-or-nothing-vs-a-loop-of-setnx-calls.html',
  styleUrl: './msetnx-all-or-nothing-vs-a-loop-of-setnx-calls.scss',
})
export class MsetnxAllOrNothingVsALoopOfSetnxCallsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page names but never demonstrates',
      points: [
        'The main page\'s own QnA states: "MSETNX sets all keys only if none of them exist (all-or-nothing)." That is correct — but no codeTab on the page ever shows what this actually protects against, or what happens if you approximate it with a loop of individual <code>SETNX</code> calls instead.',
        'Verified directly against Redis\'s own documentation: MSETNX "will not perform any operation at all even if just a single key already exists" — it checks every key FIRST, and only writes if the entire set is free. "It is not possible for clients to see that some of the keys were updated while others are unchanged."',
        'Each individual <code>SETNX</code> call IS atomic on its own — but a sequence of two or more separate <code>SETNX</code> calls, one per key, is NOT atomic as a group. A concurrent client can act in the gap between your calls.',
      ],
    },
    {
      heading: 'The real, demonstrable difference',
      points: [
        'Reserving a username AND an email together for a new signup is a textbook MSETNX use case — the two keys represent one logical object, and you never want to end up with the username reserved but the email still free (or the reverse).',
        'A naive loop calling <code>SETNX</code> once per key can leave exactly that half-reserved state: the first key\'s SETNX can fail (already taken) while the second key\'s SETNX still runs and succeeds, reserving something on behalf of a signup attempt the caller believes failed entirely.',
        'MSETNX rules this out structurally: it checks the existence of every key in the set BEFORE writing any of them, and either all writes happen or none do — there is no code path where only some of the keys end up reserved.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The naive loop\'s partial-write bug',
      language: 'typescript',
      code: `// Reserving a username AND an email as one logical signup step.
// This loop calls SETNX once per key -- each call is individually
// atomic, but the pair of calls together is not.
class FakeRedis {
  private store = new Map<string, string>();

  setnx(key: string, value: string): 0 | 1 {
    if (this.store.has(key)) return 0;
    this.store.set(key, value);
    return 1;
  }
  keys(): string[] {
    return [...this.store.keys()];
  }
}

function reserveProfileNaive(redis: FakeRedis, username: string, email: string): boolean {
  const r1 = redis.setnx(\`username:\${username}\`, '1');
  // <-- nothing stops the second call from running even if r1 failed
  const r2 = redis.setnx(\`email:\${email}\`, '1');
  return r1 === 1 && r2 === 1;
}

const redis = new FakeRedis();
reserveProfileNaive(redis, 'alice', 'alice@example.com'); // first signup succeeds

// A second attempt reusing the taken username with a DIFFERENT email:
const secondAttemptOk = reserveProfileNaive(redis, 'alice', 'alice2@example.com');
console.log('second attempt reports success:', secondAttemptOk);
console.log('keys actually reserved:', redis.keys());
// second attempt reports success: false
// keys actually reserved: [ 'username:alice', 'email:alice@example.com', 'email:alice2@example.com' ]
// -- "alice2@example.com" got reserved even though the overall
//    reservation reported failure. Nobody can ever sign up with it now.`,
    },
    {
      label: 'MSETNX: the real fix',
      language: 'typescript',
      code: `// Real MSETNX semantics: check every key FIRST, write only if ALL
// are free. No partial write is possible.
class FakeRedis {
  private store = new Map<string, string>();

  msetnx(pairs: [string, string][]): 0 | 1 {
    const anyExists = pairs.some(([k]) => this.store.has(k));
    if (anyExists) return 0;
    for (const [k, v] of pairs) this.store.set(k, v);
    return 1;
  }
  keys(): string[] {
    return [...this.store.keys()];
  }
}

function reserveProfileAtomic(redis: FakeRedis, username: string, email: string): boolean {
  return redis.msetnx([[\`username:\${username}\`, '1'], [\`email:\${email}\`, '1']]) === 1;
}

const redis = new FakeRedis();
reserveProfileAtomic(redis, 'bob', 'bob@example.com'); // first signup succeeds

const secondAttemptOk = reserveProfileAtomic(redis, 'bob', 'newemail@example.com');
console.log('second attempt reports success:', secondAttemptOk);
console.log('keys actually reserved:', redis.keys());
// second attempt reports success: false
// keys actually reserved: [ 'username:bob', 'email:bob@example.com' ]
// -- "newemail@example.com" was never touched. All-or-nothing held.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A colleague argues: "I will just check both keys with EXISTS before calling SETNX on either one — that gives me the same safety as MSETNX." Using what MSETNX actually guarantees, is this equivalent?',
    hint: 'Think about how many separate round trips this check-then-act version needs, and what a concurrent client could do in between any two of them.',
    solution: `Not equivalent -- this is a check-then-act pattern, and it reintroduces exactly the race MSETNX exists to close.

The sequence is: EXISTS username check, EXISTS email check, SETNX username, SETNX email -- four separate round trips. Between the two EXISTS checks and the two SETNX calls, a completely different concurrent client could reserve either key. Your code observed both keys as free during the EXISTS checks, then one of your own SETNX calls can still fail moments later because someone else grabbed it in between -- and your code is back to needing exactly the same "what if only one SETNX succeeds" handling this subtopic just showed is buggy when done naively.

MSETNX is not "check both, then act" -- it's a single atomic server-side operation with no client-visible steps in between at all. There is no way for the count of exists-checks to substitute for that, no matter how many of them you add: any command sequence with more than one round trip has a gap a concurrent client can land in.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Each SETNX call is atomic, so a loop of SETNX calls covering multiple keys must be atomic too."',
      reality: 'Atomicity does not compose across separate commands. Each individual SETNX genuinely cannot be interrupted mid-call — but nothing stops a SECOND client\'s command from running in the gap between your first SETNX call finishing and your second one starting. Only MSETNX (or a Lua script) makes the WHOLE group atomic.',
    },
    {
      thought: '"If the overall function returns false, nothing was actually written — the caller can safely retry with different values."',
      reality: 'Demonstrated directly above: the naive loop can write ONE of the two keys even while the overall function returns false, because it never checks the first result before attempting the second write. A caller retrying with a different email has no way to know their first attempt already, permanently, reserved that email address.',
    },
  ];

  topicLabel = 'Strings';
  topicRoute = '/redis/strings';
  prev: SubtopicLink | null = {
    label: 'Atomic INCR + EXPIRE Fixes the Rate Limiter TTL Leak',
    route: '/redis/strings/atomic-incr-expire-fixes-the-rate-limiter-ttl-leak',
  };
  next: SubtopicLink | null = {
    label: 'GETRANGE/SETRANGE: Fixed-Width Records at Byte Offsets',
    route: '/redis/strings/getrange-setrange-fixed-width-records-at-byte-offsets',
  };
}
