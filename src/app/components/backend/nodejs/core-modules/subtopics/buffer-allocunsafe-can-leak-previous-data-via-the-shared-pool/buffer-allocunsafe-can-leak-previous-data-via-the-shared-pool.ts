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
  templateUrl: './buffer-allocunsafe-can-leak-previous-data-via-the-shared-pool.html',
  styleUrl: './buffer-allocunsafe-can-leak-previous-data-via-the-shared-pool.scss'
})
export class BufferAllocunsafeCanLeakPreviousDataViaTheSharedPoolSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page already warns Buffer.allocUnsafe() "may contain old, potentially sensitive data" — the exact mechanism behind that warning is worth naming precisely',
      points: [
        'Buffer.allocUnsafe(size) is fast specifically because it skips zero-filling the allocated memory — but for smaller allocations (size at or under half of Buffer.poolSize, which defaults to 8KB, so allocations up to 4KB), it doesn\'t even allocate fresh memory from the OS at all. It slices a chunk out of a single, pre-allocated, internally-managed memory pool that Node reuses across MANY separate allocUnsafe() calls over the process\'s lifetime.',
        'Because this pool is never cleared between reuses, a freshly-returned unsafe buffer can genuinely contain leftover bytes from a PREVIOUS, completely unrelated call to Buffer.allocUnsafe() that happened to use the same slice of the pool earlier — until your own code explicitly overwrites every byte, the buffer\'s initial contents are whatever was left over from that prior, unrelated use.',
      ]
    },
    {
      heading: 'Why this is a genuine, documented security concern in server applications specifically',
      points: [
        'In a long-running Node.js server handling many requests, the internal buffer pool is shared across ALL of them over the process\'s lifetime — if one request\'s handler creates an unsafe buffer, partially fills it with sensitive data (a token, a password fragment, part of another user\'s payload), and that buffer is later garbage collected without every byte being overwritten, a LATER, completely unrelated request\'s own Buffer.allocUnsafe() call can receive a pool slice still containing those leftover bytes — genuinely leaking one user\'s data into a different user\'s buffer.',
        'The fix is straightforward and directly stated in Node\'s own documentation: use Buffer.alloc(size) (which explicitly zero-fills, at a small performance cost) whenever the buffer\'s FULL contents won\'t be immediately, completely overwritten before being read or sent anywhere — reserve allocUnsafe() specifically for the case where you are about to write to every single byte before any of it is exposed (e.g., immediately filling it from a stream read that always fills the requested length).',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The risk — allocUnsafe() can expose leftover pool data',
      language: 'typescript',
      code: `// A handler that builds a small response buffer
function buildResponse(statusCode) {
  // BUG: allocUnsafe(16) is sliced from the shared internal pool,
  // NOT zero-filled. If this buffer is only PARTIALLY written
  // below, the remaining bytes are whatever was left over from
  // some earlier, unrelated allocUnsafe() call elsewhere in the
  // app — potentially another request's data.
  const buf = Buffer.allocUnsafe(16);
  buf.write(statusCode.toString()); // only writes a few bytes!

  return buf; // the UNWRITTEN remainder still contains old,
              // unrelated leftover data from the shared pool
}

// If this buffer is sent over the network or logged, whatever
// leftover bytes are in the unwritten portion leak out too.`,
    },
    {
      label: 'The fix — Buffer.alloc() when the buffer isn\'t fully overwritten',
      language: 'typescript',
      code: `function buildResponse(statusCode) {
  // Buffer.alloc(16) explicitly zero-fills every byte first —
  // slightly slower, but any unwritten remainder is guaranteed
  // to be zeros, never leftover data from an unrelated allocation.
  const buf = Buffer.alloc(16);
  buf.write(statusCode.toString());

  return buf; // unwritten bytes are safely 0x00, not leftover data
}

// allocUnsafe() is still the right choice when you're about to
// fill EVERY byte immediately — e.g. reading a known-length chunk
// from a stream that always returns exactly the requested size:
const chunk = Buffer.allocUnsafe(1024);
const bytesRead = fs.readSync(fd, chunk, 0, 1024, null);
// Safe IF bytesRead === 1024 every time — otherwise the
// unwritten tail still has the same leftover-data risk.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A server handler builds a small buffer with Buffer.allocUnsafe(32), writes a 10-byte session ID into it, and sends the buffer directly over the network as part of a response, assuming the "unused" remaining 22 bytes are just empty/zero space. A security review flags this as a potential data-leak vulnerability, even though nothing in the code appears to explicitly copy or expose any other user\'s data. Explain precisely what the reviewer is concerned about, and why "the code never explicitly touches another user\'s data" doesn\'t make this safe.',
    hint: 'Where does the memory backing a small Buffer.allocUnsafe() call actually come from — is it always freshly zeroed memory from the OS, or can it be a reused slice of something Node has handed out before?',
    solution: 'The reviewer is correctly concerned that Buffer.allocUnsafe(32) does NOT guarantee the unwritten 22 bytes are zero or empty — for allocations at or under half of Buffer.poolSize (4KB by default), Node slices the buffer from an internal, pre-allocated memory pool that gets reused across many separate allocUnsafe() calls throughout the process\'s lifetime, without ever being cleared between reuses. The unwritten 22 bytes could genuinely contain leftover data from some EARLIER, completely unrelated Buffer.allocUnsafe() call elsewhere in the same server process — potentially including fragments of a different user\'s request data, if that earlier buffer happened to use the same pool slice and wasn\'t fully overwritten before being garbage collected. "The code never explicitly touches another user\'s data" is true and also irrelevant — the leak doesn\'t happen through explicit code referencing another user\'s variable, it happens implicitly through shared, uncleared memory that Node\'s own allocator recycles under the hood, entirely outside the application\'s own logic. The fix is using Buffer.alloc(32) instead, which explicitly zero-fills every byte, guaranteeing the unwritten remainder is safely empty rather than an unknown leftover.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Buffer.allocUnsafe() and Buffer.alloc() both return memory that starts out empty/zeroed — the only difference is that allocUnsafe() skips a validation step, making it faster.',
      reality: 'This subtopic\'s theory clarifies the actual difference is zero-filling itself — allocUnsafe() explicitly skips it, and for smaller sizes, slices memory from a reused internal pool that can genuinely contain leftover bytes from a prior, unrelated allocation.'
    },
    {
      thought: 'A buffer leak risk from Buffer.allocUnsafe() only matters if your code explicitly reads or copies data from another part of the application into the buffer.',
      reality: 'This subtopic\'s exercise shows the leak happens implicitly, through Node\'s own memory pool reuse mechanism, completely independent of anything the application\'s own code explicitly does — no explicit cross-reference to another user\'s data is needed for the vulnerability to exist.'
    },
    {
      thought: 'Buffer.allocUnsafe() should generally be avoided entirely in favor of Buffer.alloc() for safety, since the performance difference rarely matters in practice.',
      reality: 'This subtopic\'s theory shows allocUnsafe() is still the documented, correct, safe choice specifically when every byte of the buffer will be immediately and completely overwritten before being read or exposed — the risk is specific to buffers left PARTIALLY unwritten, not to using allocUnsafe() at all.'
    }
  ];
}
