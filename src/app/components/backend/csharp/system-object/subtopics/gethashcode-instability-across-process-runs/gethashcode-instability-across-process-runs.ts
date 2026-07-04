import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-gethashcode-instability-across-process-runs-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './gethashcode-instability-across-process-runs.html',
  styleUrl: './gethashcode-instability-across-process-runs.scss',
})
export class GetHashCodeInstabilityAcrossProcessRunsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page covers WITHIN-process stability — never ACROSS-process stability',
      points: [
        'The main System.Object page\'s "golden rule" and Common Mistake both focus on hash codes staying CONSTANT while an object lives inside a single collection during ONE program run — genuinely correct, but incomplete. It never addresses whether the SAME logical value produces the SAME hash code the NEXT time you run the program, or on a DIFFERENT machine, or after a .NET runtime upgrade.',
      ],
    },
    {
      heading: 'The answer — NO, and this is by design, not a bug',
      points: [
        'The DEFAULT <code>object.GetHashCode()</code> (identity-based, used when a type does not override it) is NOT guaranteed to produce the same value across different PROCESS RUNS of the identical program, across different MACHINES, or across different .NET RUNTIME VERSIONS — .NET explicitly reserves the right to change hashing internals between versions specifically so it CAN improve hash quality/performance without being locked into backward compatibility.',
        'Even for a properly overridden <code>GetHashCode()</code> using <code>HashCode.Combine(...)</code> (the main page\'s own recommended approach), the RESULT depends on an internal seed that .NET randomizes PER PROCESS specifically as a security hardening measure — this randomization exists to prevent "hash flooding" denial-of-service attacks where an attacker could otherwise predict hash collisions to degrade a server\'s dictionary/hashset performance deliberately.',
      ],
    },
    {
      heading: 'The concrete consequence — never persist a hash code as a stable identifier',
      points: [
        'Because of this per-process randomization, storing an object\'s <code>GetHashCode()</code> value in a DATABASE, a CACHE FILE, or transmitting it to ANOTHER PROCESS/MACHINE as an "identifier" is fundamentally broken — the exact same logical object can (and, due to hash randomization, WILL) produce a DIFFERENT hash code the next time the program restarts, making any previously stored hash-based identifier meaningless the moment the process is recycled.',
        'This is a genuinely different, more severe consequence than the main page\'s own "mutable field breaks the current HashSet" mistake — that bug at least stays CONTAINED within one still-running process. Persisting a hash code across process boundaries breaks correctness IMMEDIATELY, on the very first restart, for every single stored value simultaneously.',
      ],
    },
    {
      heading: 'The correct alternative — a genuinely stable identity requires a DIFFERENT mechanism entirely',
      points: [
        'For anything that needs a STABLE, PERSISTABLE identifier — a database primary key, a distributed cache key, a value transmitted between processes — use an explicit, deterministic identity mechanism instead: a GUID generated once and stored, an auto-incrementing database ID, or a well-defined cryptographic hash function (like SHA-256) applied EXPLICITLY to the object\'s own stable field VALUES — never the CLR\'s own <code>GetHashCode()</code>, which was never designed or guaranteed to serve this purpose.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Demonstrating the randomization — same logical value, different hash, different runs',
      language: 'csharp',
      code: `// Run this SAME program multiple times (or imagine running it on a
// fresh process each time) — the printed hash code for the IDENTICAL
// logical string value will typically DIFFER between runs, because
// .NET randomizes its internal string hash seed PER PROCESS by design:

string value = "hello world";
Console.WriteLine(value.GetHashCode());

// Possible output on run #1: 1844306753
// Possible output on run #2: -892034561
// Possible output on run #3: 302847195
// (exact numbers vary — the point is they are NOT guaranteed consistent
// across separate process executions, even for the identical string)

// This is DELIBERATE — .NET randomizes the string hashing seed
// specifically to prevent "hash flooding" denial-of-service attacks,
// where a malicious actor who can PREDICT hash values could craft
// inputs that all collide into the same bucket, degrading a server's
// Dictionary/HashSet performance from O(1) to O(n) deliberately.`,
    },
    {
      label: 'The broken pattern — persisting a hash code as if it were a stable ID',
      language: 'csharp',
      code: `// BROKEN — using GetHashCode() as a "unique identifier" stored in a
// database or cache, expecting it to mean the same thing on next lookup:
public class UserSession
{
    public string Username { get; }
    public UserSession(string username) => Username = username;

    // WRONG: treating GetHashCode() as a stable session key
    public int SessionKey => GetHashCode();
}

var session = new UserSession("alice");
int keyToStore = session.SessionKey;
// Imagine this integer is written to a database column, or a
// distributed cache, as "the identifier for this user's session."

// SomeExternalStore.Save(keyToStore, sessionData);  // <- conceptual

// After the APPLICATION PROCESS RESTARTS (a deployment, a crash
// recovery, a scale-out to a new server instance), re-computing:
var newSession = new UserSession("alice"); // SAME logical username
int keyOnLookup = newSession.SessionKey;

// keyOnLookup is NOT guaranteed to equal keyToStore, even though
// "alice" is the exact same logical value — the hash seed randomized
// per-process means this "identifier" scheme is fundamentally broken
// the moment the process restarts. Every previously stored session
// becomes unrecoverable simultaneously.`,
    },
    {
      label: 'The fix — use a genuinely stable, explicit identity mechanism',
      language: 'csharp',
      code: `using System.Security.Cryptography;
using System.Text;

public class UserSession
{
    public string Username { get; }
    // A genuinely STABLE identifier — generated explicitly, stored
    // alongside the object, never derived from GetHashCode():
    public Guid SessionId { get; }

    public UserSession(string username)
    {
        Username  = username;
        SessionId = Guid.NewGuid(); // stable for the lifetime of this
                                     // session, persistable safely
    }
}

// For a DETERMINISTIC identifier derived from the object's own data
// (e.g. deduplication, content-addressable storage), use an EXPLICIT
// cryptographic hash function — never GetHashCode(), which was never
// designed to be deterministic across processes:
public static string StableContentKey(string content)
{
    var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(content));
    return Convert.ToHexString(bytes);
    // SHA-256 (unlike object.GetHashCode()) is explicitly specified to
    // produce the SAME output for the SAME input, on ANY machine, ANY
    // process, ANY .NET version — genuinely suitable for persistence.
}

Console.WriteLine(StableContentKey("hello world"));
// Same output EVERY time, on EVERY machine, EVERY process — unlike
// "hello world".GetHashCode()`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues: "We override GetHashCode() with HashCode.Combine(...) exactly as the main topic recommends, so our hash codes ARE stable and safe to persist." Explain the gap in this reasoning.',
    hint: 'Think about WHERE the randomization actually happens — is it in YOUR override\'s logic (HashCode.Combine\'s own combining algorithm), or somewhere UNDERNEATH it, in the individual field hash codes your override calls INTO? Consider what HashCode.Combine(field1, field2) actually does internally — it still needs each field\'s OWN GetHashCode() as an input, and if any of those fields is a string (or another type relying on the same randomized hashing), the randomization propagates upward regardless of how carefully you wrote the combining logic.',
    solution: `// The gap: overriding GetHashCode() with HashCode.Combine(...) controls
// HOW you COMBINE your fields' hash codes — it does nothing to make
// the UNDERLYING field hash codes themselves stable. If any field
// passed into HashCode.Combine is a string (or another type whose own
// GetHashCode() is subject to the same per-process randomization), that
// randomization propagates straight through your "well-implemented"
// override:

public class Money : IEquatable<Money>
{
    public decimal Amount   { get; }
    public string  Currency { get; } // <- a string field

    public override int GetHashCode() =>
        HashCode.Combine(Amount, Currency);
    // Combine's OWN algorithm is deterministic GIVEN its inputs — but
    // Currency.GetHashCode() (a string) is STILL subject to the same
    // per-process randomization as any other string hash in .NET.
    // The overall result is therefore JUST AS UNSTABLE across process
    // runs as a bare string.GetHashCode() would be.
}

// Following HashCode.Combine correctly (as the main topic recommends)
// solves an ENTIRELY DIFFERENT problem — producing a well-DISTRIBUTED
// hash with good avalanche properties WITHIN a single process run, so
// Dictionary/HashSet lookups are fast and collision-resistant. It says
// NOTHING about cross-process stability, which was never HashCode.Combine's
// (or GetHashCode()'s) design goal in the first place. The two properties
// — "good distribution within a run" and "stable across runs" — are
// completely independent, and achieving the first does not imply the
// second at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a properly overridden GetHashCode() (e.g. using HashCode.Combine as the main topic recommends) produces a stable value that will be the same the next time the application runs.',
      reality: '.NET randomizes hash seeds per PROCESS specifically to prevent hash-flooding denial-of-service attacks — this randomization affects string hashing (and anything built on top of it via HashCode.Combine) regardless of how well the combining logic itself is written, making the overall result just as unstable across process runs as a bare hash.',
    },
    {
      thought: 'GetHashCode() instability across process runs is a bug or an oversight in .NET\'s implementation.',
      reality: 'this is a deliberate design decision — .NET explicitly reserves the right to change hashing internals between versions and randomizes hash seeds per process as a genuine security hardening measure against hash-flooding attacks, not an accident to be worked around.',
    },
    {
      thought: 'the fix for needing a stable, persistable identifier is to find a way to make GetHashCode() deterministic, e.g. by avoiding string fields or using a custom combining algorithm.',
      reality: 'GetHashCode() was never designed to serve as a stable, persistable identifier under any implementation — the correct fix is an entirely different mechanism (a GUID, a database auto-increment ID, or an explicit cryptographic hash function like SHA-256) that is specifically designed and guaranteed to produce consistent output across processes and machines.',
    },
  ];
}
