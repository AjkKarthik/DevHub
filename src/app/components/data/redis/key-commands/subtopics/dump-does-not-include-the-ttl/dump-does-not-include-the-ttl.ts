import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dump-does-not-include-the-ttl',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dump-does-not-include-the-ttl.html',
  styleUrl: './dump-does-not-include-the-ttl.scss',
})
export class DumpDoesNotIncludeTheTtlSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page never quite states',
      points: [
        'The main page\'s theory says "DUMP key produces a Redis-serialised RDB payload. RESTORE destkey ttl payload recreates the key" — <code>ttl</code> is listed as a RESTORE parameter, but the page never says outright that this value has to come from somewhere OTHER than the DUMP payload itself.',
        'Verified directly against DUMP\'s own official docs: the serialised payload contains only the value, an RDB version marker, and a CRC64 checksum for integrity — no expiry information is included at all.',
        'RESTORE\'s <code>ttl</code> argument is in MILLISECONDS, and a value of <code>0</code> means "no expiry, ever" — not "keep whatever the source had." If you genuinely want the same expiry as the source key, you must read it yourself (typically via PTTL) BEFORE calling DUMP, and pass that value to RESTORE explicitly.',
      ],
    },
    {
      heading: 'A correct migration needs three steps, not two',
      points: [
        'The natural mental model is "DUMP, then RESTORE" — two steps. The correct model for preserving TTL is "PTTL, then DUMP, then RESTORE" — three steps, with the PTTL read happening before or alongside the DUMP call.',
        'This mirrors the MIGRATE command\'s own documented internals: MIGRATE itself is implemented as a DUMP + DEL on the source followed by a RESTORE on the destination — and it is MIGRATE\'s own job, not DUMP\'s, to carry the TTL across as part of that combined operation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Naive migration (loses the TTL)',
      language: 'typescript',
      code: `class FakeRedis {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  set(key: string, value: string): 'OK' { this.store.set(key, { value, expiresAt: null }); return 'OK'; }
  pexpire(key: string, ms: number): 1 { this.store.get(key)!.expiresAt = Date.now() + ms; return 1; }
  pttl(key: string): number {
    const e = this.store.get(key);
    if (!e) return -2;
    if (e.expiresAt === null) return -1;
    return Math.max(0, e.expiresAt - Date.now());
  }
  dump(key: string): string | null {
    const e = this.store.get(key);
    // Real DUMP payload contains ONLY the value + RDB version + CRC -- no TTL, ever.
    return e ? JSON.stringify({ value: e.value }) : null;
  }
  restore(destKey: string, ttlMs: number, payload: string): 'OK' {
    const { value } = JSON.parse(payload);
    this.store.set(destKey, { value, expiresAt: ttlMs === 0 ? null : Date.now() + ttlMs });
    return 'OK';
  }
}

const redis = new FakeRedis();
redis.set('session:abc', 'user-data');
redis.pexpire('session:abc', 60000); // 60-second TTL

const payload = redis.dump('session:abc')!;
redis.restore('session:abc:copy', 0, payload); // <-- 0 = "no expiry", not "keep the source's TTL"

console.log('Source TTL (ms):', redis.pttl('session:abc'));
console.log('Copy TTL after naive restore:', redis.pttl('session:abc:copy'));
// Source TTL (ms): 59998
// Copy TTL after naive restore: -1   <-- the copy now NEVER expires, silently`,
    },
    {
      label: 'Correct migration (reads PTTL first)',
      language: 'typescript',
      code: `// Same FakeRedis class as above, reused here.
const redis = new FakeRedis();
redis.set('session:abc', 'user-data');
redis.pexpire('session:abc', 60000);

// Read the TTL BEFORE (or alongside) dumping -- it has to come from PTTL, never from the payload.
const originalTtl = redis.pttl('session:abc');
const payload = redis.dump('session:abc')!;
redis.restore('session:abc:copy', originalTtl, payload);

console.log('Original TTL (ms):', originalTtl);
console.log('Correctly-restored copy TTL (ms):', redis.pttl('session:abc:copy'));
// Original TTL (ms): 59998
// Correctly-restored copy TTL (ms): 59998   <-- matches, because we read and passed it explicitly`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A key has NO expiry set at all (<code>PTTL</code> returns <code>-1</code>). You DUMP it and RESTORE it elsewhere. What <code>ttl</code> argument should you pass to RESTORE to correctly preserve "never expires"?',
    hint: 'Re-read what a <code>ttl</code> of exactly 0 means to RESTORE — is that the same thing as "-1" from PTTL, or something different?',
    solution: `Pass 0. RESTORE's own documented rule is "if ttl is 0 the key is created without any expire" -- which is exactly what a source PTTL of -1 (no expiry) should map to on the destination.

The subtlety worth internalizing: PTTL's "-1" and RESTORE's "0" are DIFFERENT NUMBERS representing the SAME real-world condition (no expiry) in two different commands' own vocabularies -- you cannot pass PTTL's raw return value straight through to RESTORE in every case. The one place they DO happen to line up is the missing-key case: PTTL's "-2" (key does not exist) has no RESTORE equivalent at all, since RESTORE only ever runs against a real, already-DUMPed payload.

A correct helper function has to translate explicitly:
  const ttl = redis.pttl(sourceKey);
  const restoreTtl = ttl === -1 ? 0 : ttl;   // -1 (no expiry) -> 0 (no expiry), everything else passes through`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"DUMP captures everything about a key, including its expiry, so RESTORE will bring it all back automatically."',
      reality: 'Verified directly against DUMP\'s own official docs: the payload contains only the value, an RDB version marker, and a checksum. The TTL is a completely separate piece of state you must read yourself (via PTTL) and pass explicitly to RESTORE — it never travels inside the DUMP payload.',
    },
    {
      thought: '"Passing PTTL\'s return value straight through to RESTORE\'s ttl argument always works."',
      reality: 'It works for a positive remaining-TTL value, but PTTL\'s "-1" (no expiry) is NOT a valid RESTORE ttl argument in the same sense — RESTORE\'s own "no expiry" value is 0, not -1. A correct migration helper has to translate -1 to 0 explicitly, as demonstrated in the Try It above.',
    },
  ];

  topicLabel = 'Key Commands & Expiry';
  topicRoute = '/redis/key-commands';
  prev: SubtopicLink | null = {
    label: '--memkeys Is Redis 6.0, Not 7 — and What It Actually Does',
    route: '/redis/key-commands/memkeys-is-redis-6-not-7-and-what-it-does',
  };
  next: SubtopicLink | null = null;
}
