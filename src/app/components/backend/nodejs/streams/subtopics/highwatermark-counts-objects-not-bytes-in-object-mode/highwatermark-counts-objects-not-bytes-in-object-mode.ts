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
  templateUrl: './highwatermark-counts-objects-not-bytes-in-object-mode.html',
  styleUrl: './highwatermark-counts-objects-not-bytes-in-object-mode.scss'
})
export class HighwatermarkCountsObjectsNotBytesInObjectModeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s quick-ref says highWaterMark is "16KB default" for both Readable and Writable — accurate for ordinary binary/text streams, but the main page\'s own CSV-parser example (which uses objectMode: true) is silently governed by a completely different default and unit',
      points: [
        'Per Node\'s own stream documentation, the default highWaterMark is "16384 (16 KB), or 16 for objectMode streams" — the exact same constructor option name covers two entirely different units depending on whether the stream is in object mode.',
        'Node\'s documentation states this explicitly: "For streams operating in object mode, the highWaterMark specifies a total number of objects." This is not a byte count scaled differently — it genuinely counts individual objects/chunks pushed through the stream, regardless of how large or small each one is.',
        'The practical consequence: a highWaterMark of 16 on an object-mode stream means "buffer up to 16 objects before backpressure kicks in" — whether each object is a tiny { id: 1 } or a multi-megabyte parsed record makes no difference to when the buffer is considered "full." This is a completely different memory-behavior model than the byte-based default.',
      ]
    },
    {
      heading: 'Why this is easy to get wrong when tuning a stream\'s buffer size',
      points: [
        'A developer used to reasoning about highWaterMark in bytes (as the main page\'s own default binary-stream examples do) who sets { objectMode: true, highWaterMark: 16384 } thinking they\'re preserving "the same 16KB buffer size" has actually configured the stream to buffer up to 16,384 OBJECTS before backpressure applies — a value 1,024× larger than the object-mode default, and one whose actual memory footprint depends entirely on how large each individual object happens to be.',
        'This matters most for object-mode Transform streams processing large, memory-heavy objects (e.g. parsed records containing nested data, or buffers wrapped in a metadata object) — the default of 16 objects can allow a surprisingly large amount of memory to be buffered if each object itself is large, since the count-based limit has no awareness of per-object size at all.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same option name, two different units',
      language: 'typescript',
      code: `import { Transform } from 'node:stream';

// Binary/text mode (default) — highWaterMark counts BYTES.
// Default: 16384 (16 KB) if not specified.
const textTransform = new Transform({
  highWaterMark: 32 * 1024, // buffer up to 32KB of bytes
  transform(chunk, enc, cb) { this.push(chunk); cb(); },
});

// Object mode — highWaterMark counts OBJECTS, not bytes.
// Default: 16 objects if not specified.
const objectTransform = new Transform({
  objectMode: true,
  highWaterMark: 32, // buffer up to 32 OBJECTS, regardless of their size
  transform(obj, enc, cb) { this.push(obj); cb(); },
});

// A mistake: thinking this preserves "the same 16KB" for an
// object-mode stream — it does NOT. This actually configures
// buffering up to 16384 OBJECTS, not 16384 bytes worth of them.
const misconfigured = new Transform({
  objectMode: true,
  highWaterMark: 16384, // 1,024x larger than the object-mode default!
  transform(obj, enc, cb) { this.push(obj); cb(); },
});`,
    },
    {
      label: 'Object size, not just count, determines real memory usage',
      language: 'typescript',
      code: `// The main page's own CsvParser example uses objectMode: true with
// no explicit highWaterMark — so it inherits the default of 16.
class CsvParser extends Transform {
  constructor() {
    super({ objectMode: true }); // highWaterMark defaults to 16 OBJECTS
  }
  // ...
}

// If each parsed CSV row is small (a few fields, short strings),
// buffering 16 of them uses negligible memory — the default is fine.

// But if each "object" is actually large — e.g. a parsed record that
// embeds a full nested document, or wraps a multi-MB Buffer — the
// SAME default of 16 objects could mean buffering tens of megabytes,
// since highWaterMark has no per-object size awareness in object
// mode. Tuning highWaterMark lower (e.g. 4 or 8) is the correct fix
// for large-object streams — not switching back to a byte-based
// mental model, which doesn't apply here at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer is building an object-mode Transform stream that processes large parsed JSON documents (each object averaging ~2MB). They want roughly the same "16KB-ish" buffering behavior they\'re used to from binary streams, so they set { objectMode: true, highWaterMark: 16384 }. What actually happens, and why is this not equivalent to what they intended?',
    hint: 'In object mode, does highWaterMark measure bytes at all — or does it measure something else entirely, regardless of the numeric value chosen?',
    solution: 'This does not produce anything resembling "16KB-ish" buffering — since the stream is in object mode, highWaterMark: 16384 configures the stream to buffer up to 16,384 INDIVIDUAL OBJECTS before backpressure kicks in, completely independent of each object\'s actual size. Given that each object in this scenario averages ~2MB, buffering up to 16,384 of them could mean holding roughly 32 GIGABYTES of data in memory before the stream\'s internal buffer is even considered "full" — wildly more than the developer intended, and almost certainly enough to crash the process well before that theoretical limit is reached. The root misunderstanding is treating highWaterMark as if it always measures bytes; in object mode, per Node\'s own documentation, it "specifies a total number of objects," with no awareness of individual object size at all. The correct fix for large-object streams is to set a MUCH LOWER numeric highWaterMark (e.g. 4 or 8), reasoning in terms of "how many of these large objects am I comfortable buffering at once," not attempting to reuse a byte-oriented number from binary-stream tuning.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'highWaterMark always measures a buffer size in bytes, regardless of whether a stream is in object mode or not — objectMode only changes what TYPE of data flows through the stream, not how highWaterMark is interpreted.',
      reality: 'This subtopic\'s theory shows the opposite, confirmed verbatim from Node\'s own docs — in object mode, highWaterMark "specifies a total number of objects," a completely different unit and default (16) than the byte-based default (16384) used otherwise.'
    },
    {
      thought: 'Setting highWaterMark: 16384 on an object-mode stream preserves roughly the same buffering behavior as the 16KB byte-based default used by ordinary binary/text streams.',
      reality: 'This subtopic\'s code example and exercise both show this configures buffering up to 16,384 OBJECTS (not bytes) — a value 1,024 times larger than the object-mode default of 16, with a real memory footprint that depends entirely on how large each individual object happens to be.'
    },
    {
      thought: 'The default highWaterMark value is the same (16384, i.e. 16KB) regardless of whether a stream is constructed with objectMode: true or left in its default binary/text mode.',
      reality: 'This subtopic\'s theory clarifies Node\'s own documented default is explicitly different per mode — "16384 (16 KB), or 16 for objectMode streams" — the object-mode default is 16 OBJECTS, not 16 kilobytes reinterpreted.'
    }
  ];
}
