import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-hexpire-real-per-field-ttl-since-redis-7-4',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './hexpire-real-per-field-ttl-since-redis-7-4.html',
  styleUrl: './hexpire-real-per-field-ttl-since-redis-7-4.scss',
})
export class HexpireRealPerFieldTtlSinceRedis74Subtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page originally got wrong',
      points: [
        'The main page\'s own mistake block and QnA both stated, unconditionally: "Redis TTLs apply to the entire key. You cannot expire individual hash fields." That was true for every Redis version before 7.4 — but it stopped being true in 2024.',
        'Verified directly against the <code>HEXPIRE</code> command\'s own official docs (<code>"since": "7.4.0"</code>): Redis 7.4 added <code>HEXPIRE</code>/<code>HPEXPIRE</code>/<code>HEXPIREAT</code>/<code>HPEXPIREAT</code> for setting a genuine, independent TTL per hash field, plus <code>HTTL</code>/<code>HPTTL</code> to read it back and <code>HPERSIST</code> to clear it.',
        'A field\'s own TTL is cleared ONLY by <code>HDEL</code> or an <code>HSET</code> that overwrites that field — any operation that merely alters a field\'s value without replacing it (like <code>HINCRBY</code>) leaves an existing field TTL untouched.',
      ],
    },
    {
      heading: 'How it interacts with the key\'s own TTL',
      points: [
        'If the hash KEY itself also has a TTL (set via plain <code>EXPIRE</code>), the key expiring takes precedence over every field — the entire hash disappears at that point regardless of whether some fields still had a longer field-level TTL remaining.',
        '<code>HTTL</code> returns -2 if the field or key does not exist at all, and -1 if the field exists but has no TTL set (a "persistent" field) — distinguishing "no such field" from "this field never expires" the same way plain <code>TTL</code> distinguishes a missing key from a persistent one.',
        '<code>HEXPIRE</code> also supports <code>NX</code>/<code>XX</code>/<code>GT</code>/<code>LT</code> conditions, mirroring the conditional semantics <code>SET</code> already has for whole keys — e.g. <code>HEXPIRE key 60 GT FIELDS 1 field</code> only updates the TTL if the new value is actually greater than what is already set.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HEXPIRE / HTTL / HPERSIST',
      language: 'typescript',
      code: `// Reproduces Redis's own documented per-field return codes exactly:
// -2 = no such field/key, -1 = field exists but has no TTL,
// a positive number = seconds remaining, 1/2 = HEXPIRE's own set/delete codes.
class FakeRedisHash {
  private fields = new Map<string, string>();
  private fieldTtls = new Map<string, number>();

  hset(field: string, value: string): void {
    this.fields.set(field, value);
    this.fieldTtls.delete(field); // HSET clears any existing field TTL
  }

  hexpire(seconds: number, ...fieldNames: string[]): number[] {
    return fieldNames.map(f => {
      if (!this.fields.has(f)) return -2;
      if (seconds <= 0) {
        this.fields.delete(f);
        this.fieldTtls.delete(f);
        return 2; // deleted immediately, per HEXPIRE's own documented behaviour
      }
      this.fieldTtls.set(f, seconds);
      return 1;
    });
  }

  httl(...fieldNames: string[]): number[] {
    return fieldNames.map(f => {
      if (!this.fields.has(f)) return -2;
      return this.fieldTtls.has(f) ? this.fieldTtls.get(f)! : -1;
    });
  }

  hpersist(...fieldNames: string[]): number[] {
    return fieldNames.map(f => {
      if (!this.fields.has(f)) return -2;
      if (!this.fieldTtls.has(f)) return -1;
      this.fieldTtls.delete(f);
      return 1;
    });
  }
}

const session = new FakeRedisHash();
session.hset('userId', 'u42');
session.hset('csrfToken', 'a1b2c3'); // this one should expire, the user ID shouldn't

console.log('httl before any hexpire:', session.httl('csrfToken'));
console.log('hexpire csrfToken 10s:', session.hexpire(10, 'csrfToken'));
console.log('httl right after:', session.httl('csrfToken'));
console.log('hexpire a field that does not exist:', session.hexpire(10, 'phone'));
console.log('hpersist clears it:', session.hpersist('csrfToken'));
console.log('httl after hpersist:', session.httl('csrfToken'));
// httl before any hexpire: [ -1 ]
// hexpire csrfToken 10s: [ 1 ]
// httl right after: [ 10 ]
// hexpire a field that does not exist: [ -2 ]
// hpersist clears it: [ 1 ]
// httl after hpersist: [ -1 ]`,
    },
    {
      label: 'HSET clears a field\'s own TTL',
      language: 'typescript',
      code: `// Confirms the documented rule: HSET overwriting a field clears its TTL,
// but the same TTL is NOT cleared by an operation that merely alters the
// value without replacing it (HEXPIRE itself, or -- outside this demo --
// HINCRBY on a numeric field).
class FakeRedisHash {
  private fields = new Map<string, string>();
  private fieldTtls = new Map<string, number>();

  hset(field: string, value: string): void {
    this.fields.set(field, value);
    this.fieldTtls.delete(field);
  }
  hexpire(seconds: number, field: string): number {
    if (!this.fields.has(field)) return -2;
    this.fieldTtls.set(field, seconds);
    return 1;
  }
  httl(field: string): number {
    if (!this.fields.has(field)) return -2;
    return this.fieldTtls.has(field) ? this.fieldTtls.get(field)! : -1;
  }
}

const hash = new FakeRedisHash();
hash.hset('sessionToken', 'tok-1');
hash.hexpire(300, 'sessionToken');
console.log('ttl right after HEXPIRE:', hash.httl('sessionToken'));

// A caller rotates the token by calling HSET again -- this silently
// clears the TTL that was just set, unless the caller re-applies HEXPIRE.
hash.hset('sessionToken', 'tok-2');
console.log('ttl after HSET overwrites the field:', hash.httl('sessionToken'));
// ttl right after HEXPIRE: 300
// ttl after HSET overwrites the field: -1  <-- rotated token is now persistent!`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A session hash has both a key-level TTL (<code>EXPIRE session:abc 3600</code> — 1 hour) AND a field-level TTL on its <code>csrfToken</code> field set via <code>HEXPIRE session:abc 7200 FIELDS 1 csrfToken</code> — 2 hours, LONGER than the key\'s own TTL. What happens to <code>csrfToken</code> after 1 hour?',
    hint: 'Re-read the "How it interacts with the key\'s own TTL" theory point above — which one actually wins when the two disagree?',
    solution: `The entire session:abc key is deleted at the 1-hour mark, taking csrfToken (and every other field) down with it -- the field's own longer 2-hour TTL never gets a chance to matter.

This is the documented precedence rule: the KEY's TTL is the hard outer boundary. A field-level TTL can only ever make a field expire SOONER than the key would on its own; it can never keep a field alive past the point where the whole key itself expires. Setting a field TTL longer than the key's own TTL is not an error, but it's also functionally pointless -- the key's own expiration will always remove that field first.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Since Redis has always applied TTLs at the key level only, that must still be true today — the main page\'s original mistake block was correct when it was written and nothing changed."',
      reality: 'It WAS correct for every Redis version before 7.4 — but Redis 7.4 (released 2024) genuinely added HEXPIRE and the whole per-field-TTL command family. A fact being true for years does not mean it stays true forever; this is exactly the kind of claim worth re-verifying against current docs rather than assuming.',
    },
    {
      thought: '"HINCRBY on a field with an existing TTL will reset or clear that TTL, the same way HSET does."',
      reality: 'Per Redis\'s own documented rule, only operations that DELETE or REPLACE a field\'s contents (HDEL, HSET) clear its TTL. HINCRBY conceptually alters the existing value in place rather than replacing it, so a field TTL survives an HINCRBY call untouched.',
    },
  ];

  topicLabel = 'Hashes';
  topicRoute = '/redis/hashes';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'The Shopping Cart Challenge Leaves Phantom Zero-Quantity Items',
    route: '/redis/hashes/shopping-cart-phantom-zero-quantity-items',
  };
}
