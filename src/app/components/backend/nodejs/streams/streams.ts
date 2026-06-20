import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-streams',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './streams.html',
  styleUrl: './streams.scss'
})
export class NodeStreams {
  quickRef: QuickRefItem[] = [
    { name: 'Readable', type: 'class', desc: 'Source of data: fs.createReadStream, http.IncomingMessage, process.stdin.' },
    { name: 'Writable', type: 'class', desc: 'Sink for data: fs.createWriteStream, http.ServerResponse, process.stdout.' },
    { name: 'Transform', type: 'class', desc: 'Readable + Writable: modifies data as it passes through (gzip, cipher, CSV parse).' },
    { name: 'Duplex', type: 'class', desc: 'Simultaneously Readable and Writable but not connected (TCP socket).' },
    { name: 'stream.pipeline()', type: 'function', desc: 'Connect streams with automatic error propagation and cleanup. Prefer over pipe().' },
    { name: 'stream.finished()', type: 'function', desc: 'Callback when a stream finishes, errors, or is destroyed.' },
    { name: 'Backpressure', type: 'keyword', desc: 'Consumer signals producer to slow down when its buffer is full. pipe() handles this.' },
    { name: 'highWaterMark', type: 'keyword', desc: 'Internal buffer size. Readable: 16KB default. Writable: 16KB default.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Streams?',
      points: [
        'Without streams, processing a 1GB file means loading it entirely into memory first. With streams, data flows in chunks — memory usage stays constant regardless of file size.',
        'Streams are event-driven: a Readable emits "data" events when chunks are available, and "end" when done. A Writable accepts write() calls and emits "drain" when its buffer frees up.',
        'Streaming also enables pipelining: start processing a chunk before the previous one is fully written. Compression can start before the file is fully read — true streaming end-to-end.',
        'Node.js uses streams everywhere internally: HTTP request bodies, response bodies, stdin/stdout, fs.createReadStream, zlib, crypto.createCipher, child_process stdin/stdout.',
      ]
    },
    {
      heading: 'Backpressure',
      points: [
        'Backpressure prevents a fast producer overwhelming a slow consumer. When a Writable\'s buffer fills up, writable.write() returns false. The producer should stop and wait for the "drain" event.',
        'pipe() and pipeline() handle backpressure automatically — you get it for free. When rolling manual stream handling with "data" events, you must implement backpressure yourself by pausing the readable.',
        'highWaterMark controls the internal buffer size. Lower values reduce memory usage but increase the frequency of pause/resume cycles. Higher values reduce pauses but use more memory.',
        'Ignoring backpressure causes memory spikes: a fast readable and slow writable (network upload) will buffer all data in Node.js process memory, potentially crashing the server.',
      ]
    },
    {
      heading: 'Transform Streams and pipeline()',
      points: [
        'A Transform stream is a Duplex where the readable side is the processed output of the writable side. Examples: zlib.createGzip() (compress), crypto.createCipheriv() (encrypt), csv-parse (parse CSV lines to objects).',
        'stream.pipeline(src, ...transforms, dest) connects a chain with automatic error propagation. If any stream in the chain errors, pipeline cleans up all streams and calls the callback with the error. Use pipeline over pipe().',
        'The promisified version: const pipelineAsync = promisify(pipeline). In Node 10+: import { pipeline } from "node:stream/promises" — async/await compatible.',
        'Custom Transform: extend Transform and implement _transform(chunk, encoding, callback). Call callback() when done processing, push() to emit output, or callback(err) to signal an error.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'stream.pipeline()',
      language: 'typescript',
      code: `import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

// Compress a large file — constant memory usage regardless of file size
await pipeline(
  createReadStream('input.log'),         // Readable
  createGzip(),                          // Transform (compress)
  createWriteStream('input.log.gz')      // Writable
);
// Error in any step automatically cleans up all streams

// Process CSV line-by-line
import { createInterface } from 'node:readline';
const rl = createInterface({ input: createReadStream('data.csv') });
for await (const line of rl) {
  const [name, email] = line.split(',');
  await processRecord({ name, email });
}

// Stream HTTP response to file
import https from 'node:https';
const download = (url, dest) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    pipeline(res, createWriteStream(dest)).then(resolve).catch(reject);
  });
});`
    },
    {
      label: 'Custom Transform stream',
      language: 'typescript',
      code: `import { Transform } from 'node:stream';

// Transform stream: uppercase each chunk
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback(); // signal done processing this chunk
  }
}

// Usage
await pipeline(
  createReadStream('input.txt'),
  new UpperCaseTransform(),
  createWriteStream('output.txt')
);

// Object mode Transform: CSV lines → JS objects
class CsvParser extends Transform {
  constructor() {
    super({ objectMode: true }); // emit JS objects, not Buffers
    this._header = null;
    this._buffer = '';
  }
  _transform(chunk, enc, cb) {
    this._buffer += chunk.toString();
    const lines = this._buffer.split('\\n');
    this._buffer = lines.pop(); // incomplete last line
    for (const line of lines) {
      if (!this._header) { this._header = line.split(','); }
      else {
        const obj = Object.fromEntries(
          line.split(',').map((v, i) => [this._header[i], v.trim()])
        );
        this.push(obj);
      }
    }
    cb();
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using pipe() instead of pipeline()',
      wrong: 'readable.pipe(transform).pipe(writable); // errors not propagated',
      right: 'await pipeline(readable, transform, writable); // automatic cleanup on error',
      explanation: 'pipe() does not propagate errors and does not destroy streams on failure. An error in the middle of the chain leaves streams open (file handles, network connections). pipeline() handles all of this correctly.'
    },
    {
      title: 'Buffering the entire stream with concat-stream',
      wrong: 'stream.on("data", d => chunks.push(d)); stream.on("end", () => Buffer.concat(chunks))',
      right: '// Use pipeline() to process chunks incrementally, or use fs.promises.readFile for small files',
      explanation: 'Collecting all chunks defeats the purpose of streaming. For a 10GB file, you collect 10GB in memory. Either process chunks as they arrive or use readFile() for small files where memory is not a concern.'
    },
    {
      title: 'Ignoring backpressure in manual stream handling',
      wrong: 'readable.on("data", chunk => { writable.write(chunk); }); // ignores write() return value',
      right: 'readable.on("data", chunk => { if (!writable.write(chunk)) readable.pause(); }); writable.on("drain", () => readable.resume());',
      explanation: 'writable.write() returns false when the internal buffer is full. Ignoring this causes all data to pile up in memory. Use pipe()/pipeline() which handle this automatically.'
    },
    {
      title: 'Not destroying streams on error',
      wrong: 'stream.on("error", err => console.error(err)); // stream stays open',
      right: 'stream.on("error", err => { console.error(err); stream.destroy(); });',
      explanation: 'An errored stream is not automatically closed. Call stream.destroy() to clean up file handles and network connections. pipeline() does this automatically — another reason to prefer it.'
    },
  ];

  challenge: Challenge = {
    title: 'Line Counter Transform Stream',
    language: 'typescript',
    description: 'Build a LineCounter class that extends Transform. It should pass all data through unchanged (like a passthrough), but also count the number of newlines seen. After the stream finishes, expose a lineCount property. Use it in a pipeline to count lines in a large file while simultaneously writing it to another location.',
    hints: [
      'In _transform, count \\n characters, then push(chunk) unchanged.',
      'Expose this.lineCount as a property on the instance.',
      'pipeline() runs the transform; after it resolves, read counter.lineCount.',
    ],
    starterCode: `import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';

class LineCounter extends Transform {
  lineCount = 0;
  // TODO: _transform that counts newlines and passes data through
}

const counter = new LineCounter();
await pipeline(
  createReadStream('input.txt'),
  counter,
  createWriteStream('output.txt')
);
console.log(\`Lines: \${counter.lineCount}\`);`,
    solution: `import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';

class LineCounter extends Transform {
  lineCount = 0;
  _buffer = '';

  _transform(chunk, enc, callback) {
    const text = chunk.toString();
    for (const ch of text) if (ch === '\\n') this.lineCount++;
    this.push(chunk); // pass through unchanged
    callback();
  }

  _flush(callback) {
    // Count last line if file doesn't end with newline
    // (already counted via \n — nothing special needed here)
    callback();
  }
}

const counter = new LineCounter();
await pipeline(
  createReadStream('input.txt'),
  counter,
  createWriteStream('output.txt')
);
console.log(\`Lines: \${counter.lineCount}\`);`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is backpressure in Node.js streams?', options: ['Network throttling', 'Consumer signalling producer to slow down when its buffer is full', 'Error propagation between streams', 'Stream compression'], answer: 1, explanation: 'Backpressure prevents a fast producer from overwhelming a slow consumer. writable.write() returns false when the buffer is full. The producer should pause until the "drain" event fires. pipe()/pipeline() handle this automatically.' },
    { q: 'What advantage does stream.pipeline() have over .pipe()?', options: ['pipeline() is synchronous', 'pipeline() automatically propagates errors and destroys all streams', 'pipeline() supports compression', 'pipeline() is only for file streams'], answer: 1, explanation: 'pipe() does not propagate errors and does not destroy streams on failure, leaving file handles and connections open. pipeline() handles error propagation and cleanup for the entire chain.' },
    { q: 'When should you use objectMode: true in a Transform stream?', options: ['When transforming strings', 'When emitting JavaScript objects instead of Buffers/strings', 'When the stream reads from files', 'When you need higher throughput'], answer: 1, explanation: 'Object mode streams emit arbitrary JavaScript objects (not Buffers or strings). Use it for CSV parsers, JSON line parsers, or any transform that converts binary/text input to structured objects.' },
    { q: 'What does a Transform stream do?', options: ['Only reads data', 'Only writes data', 'Reads data, transforms it, and makes the result available for reading', 'Connects two readable streams'], answer: 2, explanation: 'A Transform stream is both Readable and Writable. Data written to it is transformed and becomes available to read from it. Examples: zlib.createGzip() (compress), crypto cipher (encrypt).' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I use streams instead of readFile/writeFile?', a: 'Use streams for: files larger than ~100MB (to avoid memory pressure), real-time processing of data as it arrives, piping between sources and destinations (HTTP response to file), and building processing pipelines. Use readFile/writeFile for: small config files, JSON data, any file that must be fully loaded before processing.' },
    { q: 'How do I add a timeout to a stream operation?', a: 'Use AbortController with stream.pipeline: const ac = new AbortController(); setTimeout(() => ac.abort(), 30000); await pipeline(src, dest, { signal: ac.signal }). When aborted, pipeline() destroys all streams and rejects with AbortError.' },
    { q: 'What is the difference between Duplex and Transform?', a: 'Duplex: both readable and writable, but the two sides are independent (like a TCP socket — you read from the network and write to it independently). Transform: a special Duplex where the writable input is connected to the readable output — data written in comes out transformed. You subclass Transform to build processing steps; Duplex for independent bidirectional channels.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Streams process data in chunks — constant memory regardless of file size. Use pipeline() over pipe() for automatic error handling and cleanup.',
    mustKnow: [
      'Streams: Readable (source), Writable (sink), Transform (modify), Duplex (both).',
      'Backpressure: writable.write() returns false when full; producer must pause.',
      'pipeline() propagates errors and destroys streams — always prefer over pipe().',
      'highWaterMark: buffer size per stream (16KB default).',
      'objectMode: true for streams that emit JS objects instead of Buffers.',
      'for await...of works on Readable streams (node:stream/promises).',
    ],
    interviewFocus: [
      'What is backpressure and how do you handle it?',
      'Why prefer pipeline() over pipe()?',
      'How would you process a 50GB CSV file in Node.js without running out of memory?',
    ]
  };
}
