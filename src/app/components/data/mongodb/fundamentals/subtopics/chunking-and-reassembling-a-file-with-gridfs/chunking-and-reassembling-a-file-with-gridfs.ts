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
    heading: 'What "255 KB Chunks" Actually Means',
    points: [
      'The main page\'s own QnA on the document size limit names GridFS in passing: it "splits files into 255 KB chunks stored in a fs.files / fs.chunks collection pair." Verified the exact figure directly: GridFS\'s real default chunk size is 255 <em>KiB</em> — 261,120 bytes exactly (255 × 1024), not a round 255,000 or 256,000.',
      'In real usage, the driver\'s <code>GridFSBucket</code> class handles chunking transparently — <code>openUploadStream()</code> writes chunk documents to <code>fs.chunks</code> as data streams in, and <code>openDownloadStream()</code> reads them back in order and concatenates them. The pure logic underneath is straightforward enough to verify directly without a live database: split the buffer into fixed-size pieces, tag each with its own sequence number, then read them back in that order and concatenate.',
      'Verified via a direct round-trip: chunking a 20 MB buffer (comfortably over the page\'s own cited 16 MB document limit) at the real 261,120-byte default produces exactly 81 chunks — 80 full 261,120-byte chunks plus one 81,920-byte remainder — and reassembling those chunks back in order reproduces the original buffer byte-for-byte.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Chunking Mechanism, Verified',
    language: 'typescript',
    code: `const DEFAULT_CHUNK_SIZE_BYTES = 261120; // 255 KiB -- GridFS's real default

interface FileChunk {
  files_id: string;
  n: number;      // chunk sequence number, starting at 0
  data: Buffer;
}

function chunkFile(
  buffer: Buffer,
  fileId: string,
  chunkSizeBytes = DEFAULT_CHUNK_SIZE_BYTES
): FileChunk[] {
  const chunks: FileChunk[] = [];
  for (let offset = 0, n = 0; offset < buffer.length; offset += chunkSizeBytes, n++) {
    chunks.push({
      files_id: fileId,
      n,
      data: buffer.slice(offset, Math.min(offset + chunkSizeBytes, buffer.length)),
    });
  }
  return chunks;
}

function reassembleFile(chunks: FileChunk[]): Buffer {
  // fs.chunks has no guaranteed read order -- always sort by n first
  const sorted = [...chunks].sort((a, b) => a.n - b.n);
  return Buffer.concat(sorted.map(c => c.data));
}

// A 20 MB file, comfortably over the 16 MB BSON document limit
const originalFile = Buffer.alloc(20 * 1024 * 1024, 7);

const chunks = chunkFile(originalFile, 'file-1');
console.log('chunk count:', chunks.length);                    // 81
console.log('full chunk size:', chunks[0].data.length);         // 261120
console.log('last chunk size:', chunks[chunks.length - 1].data.length); // 81920

const reassembled = reassembleFile(chunks);
console.log('sizes match:', reassembled.length === originalFile.length);       // true
console.log('bytes match:', Buffer.compare(reassembled, originalFile) === 0);  // true

// The real GridFSBucket API hides all of this behind two streams:
//   const bucket = new GridFSBucket(db);
//   const uploadStream = bucket.openUploadStream('report.pdf');
//   fs.createReadStream('report.pdf').pipe(uploadStream);
//   bucket.openDownloadStream(fileId).pipe(res); // e.g. streamed to an HTTP response`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A file is exactly 522,240 bytes — precisely 2 × 261,120, an exact multiple of the default chunk size. How many chunks does <code>chunkFile()</code> produce, and is the LAST chunk a full 261,120 bytes or a smaller remainder?',
  hint: 'Trace the loop\'s own condition (<code>offset < buffer.length</code>) for an offset that lands EXACTLY on the buffer\'s own length — does the loop run one more time for a tiny leftover chunk, or stop cleanly?',
  solution: `// Exactly 2 chunks, and the SECOND (last) chunk is a full 261,120 bytes --
// not a small remainder.
//
// Tracing the loop: offset starts at 0 (chunk 0, full 261,120 bytes),
// then offset becomes 261,120 (chunk 1, full 261,120 bytes -- this reaches
// exactly buffer.length), then offset becomes 522,240. At that point the
// loop condition "offset < buffer.length" is 522240 < 522240, which is
// FALSE -- the loop stops cleanly with no third, empty chunk.
//
// This confirms the chunking logic never produces a trailing zero-byte
// chunk for an exact-multiple file size, verified directly:
// chunkFile(Buffer.alloc(261120 * 2)) -> [{ n: 0, size: 261120 }, { n: 1, size: 261120 }].`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'GridFS is a different storage engine or a special MongoDB feature outside the normal document model — it must work fundamentally differently from a regular collection.',
    reality: 'GridFS is just a CONVENTION built entirely on top of two ordinary collections, <code>fs.files</code> (one document per file, holding metadata) and <code>fs.chunks</code> (many documents per file, each an ordinary BSON document holding one chunk\'s binary data). There is no special engine involved — every one of the same querying, indexing, and replication rules that apply to any other MongoDB collection apply here too. The 16 MB document limit that makes GridFS necessary in the first place is what GridFS itself works around, simply by never storing a whole file in one document.',
  },
  {
    thought: '255 KB is a hard, fixed constant every GridFS bucket uses — the same chunk size on every deployment.',
    reality: 'The default chunk size (255 KiB) is a configurable constructor option on <code>GridFSBucket</code>, not a fixed constant baked into the format. A bucket handling many SMALL files (each far under 255 KiB) can raise the chunk size to store each file in a single chunk document, cutting down the total number of <code>fs.chunks</code> documents and their associated index overhead — the right choice depends on the typical file size a given bucket actually stores, not a one-size-fits-all default.',
  },
];

@Component({
  selector: 'app-mongo-fundamentals-gridfs-chunking',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './chunking-and-reassembling-a-file-with-gridfs.html',
  styleUrl: './chunking-and-reassembling-a-file-with-gridfs.scss',
})
export class ChunkingAndReassemblingAFileWithGridfsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
