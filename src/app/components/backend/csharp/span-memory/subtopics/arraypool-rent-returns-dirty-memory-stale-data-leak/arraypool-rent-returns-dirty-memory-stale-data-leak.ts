import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-arraypool-rent-returns-dirty-memory-stale-data-leak-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './arraypool-rent-returns-dirty-memory-stale-data-leak.html',
  styleUrl: './arraypool-rent-returns-dirty-memory-stale-data-leak.scss',
})
export class ArraypoolRentReturnsDirtyMemoryStaleDataLeakSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own ArrayPool guidance covers length tracking — it does not mention the array\'s CONTENT can be stale',
      points: [
        'The main Span &amp; Memory page\'s ArrayPool section warns "the rented array may be larger than the length you requested — always track the actual length you need separately." A SEPARATE, security-relevant fact it does not mention: <code>ArrayPool&lt;T&gt;.Shared.Rent(...)</code> does NOT clear or zero the returned array by default — it can hand you back an array that was PREVIOUSLY used (and filled with real data) by a completely different, unrelated caller, and never cleaned before being returned to the pool.',
      ],
    },
    {
      heading: 'Any bytes your code does not explicitly overwrite can still contain the PREVIOUS renter\'s leftover data',
      points: [
        'If your code rents a buffer, writes to only PART of it (e.g. writes 50 bytes into a 256-byte rented array, tracking a separate "actual length = 50" value as the main page recommends), and then — through a bug — sends or exposes the FULL rented array length instead of just the tracked 50 bytes, the EXTRA 206 bytes are not zeros or garbage in the "uninitialized memory" sense; they are the ACTUAL, real leftover data from whatever the PREVIOUS renter of that same physical array wrote there. Depending on what that previous data was (a password, a session token, another user\'s request payload in a busy server), this is a genuine information-disclosure vulnerability, not merely a correctness bug.',
      ],
    },
    {
      heading: 'The fix: Rent(clearArray: true) when returning, or Clear() when it matters, applied deliberately and sparingly',
      points: [
        '<code>ArrayPool&lt;T&gt;.Shared.Return(array, clearArray: true)</code> zeros the array\'s CONTENT before it goes back into the pool for the NEXT renter — this is the targeted fix for the stale-data leak, applied at the point where the DATA genuinely might be sensitive (parsing user credentials, handling payment data, anything that should never leak between requests).',
        'This clearing has a real, deliberate performance cost — zeroing a large buffer on every return partially defeats the whole point of pooling (avoiding work on the hot path) — so the main page\'s own "only reach for advanced patterns when a benchmark proves it necessary" philosophy applies here too: clear rented arrays specifically when the DATA could be sensitive, not reflexively on every single rent/return cycle for buffers that only ever hold non-sensitive, throwaway data (e.g. purely numeric computation buffers).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving a rented array can contain stale data from a PREVIOUS, unrelated renter',
      language: 'csharp',
      code: `using System.Buffers;

var pool = ArrayPool<byte>.Shared;

// First "caller" — writes SENSITIVE data into a rented buffer, then
// returns it WITHOUT clearing (the default Return() behavior):
byte[] sensitiveBuffer = pool.Rent(256);
Encoding.UTF8.GetBytes("SuperSecretPassword123", sensitiveBuffer);
pool.Return(sensitiveBuffer); // clearArray defaults to FALSE —
                               // the password bytes are STILL there

// Second, COMPLETELY UNRELATED "caller" — rents a buffer for a
// totally different purpose (say, parsing a short numeric ID) and
// only writes a FEW bytes, never touching the rest:
byte[] idBuffer = pool.Rent(256);
Encoding.UTF8.GetBytes("42", idBuffer); // only writes 2 bytes!

// If the pool happens to hand back the SAME physical array instance
// (a real, common occurrence in ArrayPool's implementation under
// typical load), bytes BEYOND the 2 the second caller actually wrote
// can STILL contain the first caller's leftover password data:
string leaked = Encoding.UTF8.GetString(idBuffer, 2, 20); // reading
    // "extra" bytes beyond what this caller itself wrote can reveal
    // "SuperSecretPassword123" — data this caller never wrote and
    // has no business seeing at all`,
    },
    {
      label: 'The trap — sending the FULL array length instead of the tracked actual length',
      language: 'csharp',
      code: `// The main page's own recommended pattern — track actual length
// SEPARATELY from the rented array's full length:
byte[] rented = pool.Rent(256);
int actualLength = WriteRequestPayload(rented); // writes, say, 50 bytes,
                                                 // returns 50

try
{
    // CORRECT — sends only the bytes THIS caller actually wrote:
    await stream.WriteAsync(rented.AsMemory(0, actualLength));

    // BUG — sends the FULL rented array (256 bytes), including
    // whatever 206 bytes of potentially-sensitive leftover data
    // from a PREVIOUS renter happen to still be sitting there:
    // await stream.WriteAsync(rented.AsMemory(0, rented.Length));
}
finally
{
    pool.Return(rented);
}

static int WriteRequestPayload(byte[] buffer) => 50; // example`,
    },
    {
      label: 'The fix — clearArray: true specifically where data sensitivity genuinely matters',
      language: 'csharp',
      code: `using System.Buffers;

var pool = ArrayPool<byte>.Shared;

// For genuinely sensitive data (credentials, tokens, payment info):
byte[] sensitiveBuffer = pool.Rent(256);
try
{
    Encoding.UTF8.GetBytes("SuperSecretPassword123", sensitiveBuffer);
    // ... use sensitiveBuffer ...
}
finally
{
    // Explicitly zero the array's CONTENT before it re-enters the
    // pool — the NEXT renter of this same physical array can no
    // longer see this caller's data, regardless of what they do or
    // do not write themselves:
    pool.Return(sensitiveBuffer, clearArray: true);
}

// For ordinary, non-sensitive throwaway data (a numeric scratch
// buffer, temporary computation results) — the default, FASTER
// Return() without clearing remains the right choice, exactly per
// the main page's own "only reach for advanced/costly patterns when
// benchmarked as necessary" philosophy:
byte[] scratchBuffer = pool.Rent(256);
try
{
    ComputeSomething(scratchBuffer);
}
finally
{
    pool.Return(scratchBuffer); // no clearArray — fine here, nothing
                                 // sensitive was ever stored
}

static void ComputeSomething(byte[] buffer) { /* ... */ }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A method rents a buffer to build a JSON response body containing a user\'s session token, writes the token into the buffer, sends only the tracked actual-length slice to the client, then returns the buffer to the pool WITHOUT clearing it. Explain the specific residual risk this leaves, even though the tracked length was used correctly for THIS request.',
    hint: 'Consider what happens to the UNCLEARED bytes containing the session token after Return() is called — who might rent that same physical array next, and what they might read from it if THEIR code has a length-tracking bug of its own.',
    solution: `byte[] buffer = pool.Rent(512);
try
{
    int actualLength = WriteSessionTokenResponse(buffer); // writes the
                                                            // token,
                                                            // say 40 bytes
    await SendToClientAsync(buffer.AsMemory(0, actualLength)); // CORRECT
                                                                // for THIS
                                                                // request —
                                                                // only the
                                                                // 40 real
                                                                // bytes sent
}
finally
{
    pool.Return(buffer); // BUG: no clearArray — the session token's
                          // 40 bytes remain in the array's memory
}

// The residual risk: THIS specific request was handled correctly —
// no over-length data was sent to ITS client. But the array, still
// containing the session token bytes, goes back into the SHARED
// pool. The NEXT caller to rent this exact physical array — a
// completely different, unrelated request, possibly for a different
// user — inherits an array whose unused portion still holds this
// user's session token.
//
// If THAT next caller has the exact bug this topic warns about
// (sending the array's FULL length instead of its own tracked
// actual length — a mistake that is easy to make independently,
// in a totally different code path), the FIRST user's session token
// leaks to the SECOND user's response, entirely because of a bug in
// code that has nothing to do with the original request at all.
//
// The fix: pool.Return(buffer, clearArray: true) specifically for
// buffers that held sensitive data — this makes the residual risk
// structurally impossible, regardless of what bugs might exist
// elsewhere in the codebase's OTHER length-tracking logic.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ArrayPool<T>.Shared.Rent() always returns a freshly-zeroed array, similar to new T[size].',
      reality: 'Rent() does NOT clear the array by default — it can return an array previously used (and filled with real data) by a completely different caller, with that data still present in memory until explicitly cleared.',
    },
    {
      thought: 'tracking the "actual length" separately from the rented array\'s full length (as the main page recommends) is sufficient to prevent any data leakage from a pooled array.',
      reality: 'tracking actual length prevents THIS caller from reading garbage beyond what it wrote — it does nothing to prevent a DIFFERENT, later caller (who rents the SAME physical array) from seeing THIS caller\'s leftover data if it was never explicitly cleared on return.',
    },
    {
      thought: 'pool.Return(array, clearArray: true) should be used unconditionally on every ArrayPool return, to be safe.',
      reality: 'clearing has a real, measurable performance cost that partially defeats the point of pooling — it should be applied deliberately for buffers that held genuinely sensitive data, not reflexively for ordinary, non-sensitive throwaway buffers.',
    },
  ];
}
