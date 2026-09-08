import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-getrange-setrange-fixed-width-records-at-byte-offsets',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './getrange-setrange-fixed-width-records-at-byte-offsets.html',
  styleUrl: './getrange-setrange-fixed-width-records-at-byte-offsets.scss',
})
export class GetrangeSetrangeFixedWidthRecordsAtByteOffsetsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page names but never shows',
      points: [
        'The main page\'s own quiz explains <code>GETRANGE</code> precisely ("returns a substring... 0-indexed, negative indices from end") and its own explanation names <code>SETRANGE key offset value</code> as the write-side counterpart -- but no codeTab on the page ever builds anything with either command.',
        'The main page\'s own bit-operations section already demonstrates one compact-storage pattern -- one BIT per user, via <code>SETBIT</code>/<code>BITCOUNT</code>, for a yes/no flag (active today or not). <code>GETRANGE</code>/<code>SETRANGE</code> generalize that same idea to fixed-width numeric or binary FIELDS, not just single bits.',
        'The pattern: pick a fixed record width (say, 4 bytes for a 32-bit integer), compute each record\'s byte offset as <code>id * recordWidth</code>, and write/read it directly with <code>SETRANGE</code>/<code>GETRANGE</code> -- one Redis string acts as a dense, flat array of fixed-size records.',
      ],
    },
    {
      heading: 'When this beats a hash or a JSON blob',
      points: [
        '<code>SETRANGE</code> writes exactly the bytes you give it at exactly the offset you give it -- Redis automatically grows the underlying string (zero-filling any gap) if the offset is past the current length, so records can be written in any order.',
        'A hash field or a JSON-serialized value both carry real per-entry overhead (a field name string, JSON punctuation, key/value pointers) -- a fixed-width record stored this way costs exactly its declared width, with zero per-record naming overhead at all.',
        'The tradeoff: this only works cleanly for FIXED-WIDTH data (a fixed-size integer, a fixed-size struct) -- a variable-length value (like a name) cannot be updated in place this way without either padding it to a fixed width or accepting that a shorter new value leaves stale trailing bytes from the old one.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fixed-width record store',
      language: 'typescript',
      code: `// A dense array of 4-byte big-endian uint32 scores, one per user ID,
// stored as ONE Redis string via SETRANGE/GETRANGE at computed offsets.
const RECORD_SIZE = 4;

function offsetFor(userId: number): number {
  return userId * RECORD_SIZE;
}

function encodeUint32BE(n: number): Buffer {
  const buf = Buffer.alloc(RECORD_SIZE);
  buf.writeUInt32BE(n, 0);
  return buf;
}

function decodeUint32BE(buf: Buffer): number {
  return buf.readUInt32BE(0);
}

// A minimal in-memory stand-in reproducing SETRANGE's own auto-grow
// (zero-fill) behaviour and GETRANGE's inclusive [start, end] range.
class FakeBinaryStore {
  private data = Buffer.alloc(0);

  setrange(offset: number, value: Buffer): void {
    const needed = offset + value.length;
    if (this.data.length < needed) {
      const grown = Buffer.alloc(needed); // zero-filled
      this.data.copy(grown);
      this.data = grown;
    }
    value.copy(this.data, offset);
  }
  getrange(start: number, end: number): Buffer {
    return this.data.subarray(start, end + 1); // Redis's end is inclusive
  }
  get sizeInBytes(): number {
    return this.data.length;
  }
}

const scores = new FakeBinaryStore();
scores.setrange(offsetFor(1001), encodeUint32BE(4200));
scores.setrange(offsetFor(1002), encodeUint32BE(50));
scores.setrange(offsetFor(2000), encodeUint32BE(99999)); // sparse -- id 2000 written directly

function readScore(userId: number): number {
  const off = offsetFor(userId);
  return decodeUint32BE(scores.getrange(off, off + RECORD_SIZE - 1));
}

console.log('user 1001:', readScore(1001));
console.log('user 1002:', readScore(1002));
console.log('user 2000:', readScore(2000));
console.log('total store size (bytes):', scores.sizeInBytes);
// user 1001: 4200
// user 1002: 50
// user 2000: 99999
// total store size (bytes): 8004`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A colleague suggests storing each user\'s DISPLAY NAME (a variable-length string) the same way -- one fixed 16-byte slot per user ID, written with <code>SETRANGE</code>. What breaks if a user renames from a 15-character name to a 4-character one?',
    hint: 'Trace exactly what <code>SETRANGE</code> writes: does it ever touch bytes AFTER the length of the value you give it?',
    solution: `SETRANGE only overwrites the bytes covered by the new value's own length, starting at the given offset -- it never touches or clears any bytes beyond that. Renaming from a 15-character name down to a 4-character one only overwrites the first 4 bytes of the 16-byte slot; bytes 5 through 16 still hold whatever the OLD 15-character name left there.

Reading the slot back with a naive GETRANGE over the full 16 bytes and treating it as a string would produce the new 4-character name immediately followed by 11 leftover bytes from the old name -- a real, silent data-corruption bug, not a crash.

The fix has to be one of: (a) always write the FULL fixed width, padding short values with null bytes (0x00) up to the slot size, and strip trailing nulls on read; or (b) store an explicit length prefix inside each slot (e.g. the first byte records how many of the following bytes are meaningful) and only read that many bytes back. Fixed-width SETRANGE storage genuinely only fits data whose own encoding is either always-exactly-that-width (like a 4-byte integer) or self-describing its own length -- never a bare variable-length string with no padding discipline.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"SETRANGE at a far-out offset will fail if the string does not exist yet or is too short."',
      reality: 'Redis auto-grows the string, zero-filling any gap between its current length and the new offset -- writing at offset 2000 on an empty key succeeds immediately, leaving 2000 zero bytes before the new data. No pre-allocation step is needed, only the byte-offset math shown above.',
    },
    {
      thought: '"This is basically the same technique as the SETBIT/BITCOUNT daily-active-users pattern already on the main page, just with bigger numbers."',
      reality: 'They share the same underlying idea (packing many small values densely into one string), but SETBIT addresses individual BITS (2 possible values per position: 0 or 1), while SETRANGE addresses whole BYTES at a time -- letting each "slot" hold an arbitrary fixed-width value (a counter, a timestamp, a small struct), not just a single flag.',
    },
  ];

  topicLabel = 'Strings';
  topicRoute = '/redis/strings';
  prev: SubtopicLink | null = {
    label: 'MSETNX Is All-or-Nothing; a Loop of SETNX Calls Is Not',
    route: '/redis/strings/msetnx-all-or-nothing-vs-a-loop-of-setnx-calls',
  };
  next: SubtopicLink | null = null;
}
