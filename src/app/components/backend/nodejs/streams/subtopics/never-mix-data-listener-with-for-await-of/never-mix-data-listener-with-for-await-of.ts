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
  templateUrl: './never-mix-data-listener-with-for-await-of.html',
  styleUrl: './never-mix-data-listener-with-for-await-of.scss'
})
export class NeverMixDataListenerWithForAwaitOfSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s theory says a Readable "emits \'data\' events when chunks are available" and separately shows for await...of consuming a readline interface — worth knowing these are TWO DIFFERENT consumption mechanisms that must never be combined on the same stream',
      points: [
        'Per Node\'s own documentation, every Readable stream starts in PAUSED mode. It switches to FLOWING mode — where data is pushed out as soon as it\'s available — in one of several ways: attaching a \'data\' event handler, calling .resume(), or calling .pipe(). While paused, data simply accumulates in the internal buffer until something pulls it.',
        'for await...of async iteration is a genuinely separate consumption mechanism, built on the stream\'s own async iterator protocol — it is not simply "another way to trigger flowing mode," it competes for the same underlying chunks a \'data\' listener or .pipe() call would also be consuming.',
        'Node\'s own documentation states this directly: developers "should choose one of the methods of consuming data and should never use multiple methods to consume data from a single stream." It specifically names combining on(\'data\'), on(\'readable\'), pipe(), or async iterators together as something that "could lead to unintuitive behavior" — this is a documented incompatibility, not just a stylistic inefficiency.',
      ]
    },
    {
      heading: 'What "unintuitive behavior" actually looks like, and why it happens',
      points: [
        'If a \'data\' listener is attached to a stream FIRST (switching it into flowing mode), and code later tries for await...of on that same stream instance, the async iterator effectively has nothing left to consume — the \'data\' listener has already been pulling chunks out as they arrive, so the iteration can appear to hang, skip data, or receive only whatever chunks happened to arrive after both consumers were attached, depending on exact timing.',
        'This is easy to introduce accidentally in larger codebases: one part of the code (e.g. a logging or metrics utility) attaches a \'data\' listener to inspect a stream\'s traffic, while another part of the code — written independently, unaware of the first — tries to for await...of the same stream instance for its own processing. Neither piece of code is wrong in isolation; the conflict only exists because they share one stream.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The conflict: a \'data\' listener silently starves for-await-of',
      language: 'typescript',
      code: `import { createReadStream } from 'node:fs';

const readable = createReadStream('large-file.txt');

// Some OTHER part of the codebase (e.g. a metrics/logging utility)
// attaches a 'data' listener — this switches the stream into
// FLOWING mode immediately.
readable.on('data', (chunk) => {
  metrics.recordBytesRead(chunk.length);
});

// Later, unrelated code tries to process the SAME stream with
// async iteration — but flowing mode is already pulling chunks
// out via the 'data' listener above. This loop gets little or
// nothing, depending on exact timing — a real, documented conflict,
// not a bug in either piece of code individually.
for await (const chunk of readable) {
  await processChunk(chunk); // unreliable — chunks already consumed
}`,
    },
    {
      label: 'The fix: pick exactly one consumption style per stream',
      language: 'typescript',
      code: `import { createReadStream } from 'node:fs';

const readable = createReadStream('large-file.txt');

// Consolidate ALL consumption through ONE mechanism — here,
// for await...of — and do metrics/logging INSIDE that same loop
// instead of via a separate, competing 'data' listener.
let bytesRead = 0;
for await (const chunk of readable) {
  bytesRead += chunk.length;
  metrics.recordBytesRead(chunk.length); // moved inside the loop
  await processChunk(chunk);
}
console.log(\`Total bytes: \${bytesRead}\`);

// If two genuinely independent consumers both need the same data,
// don't attach two consumers to one stream — instead, pipe the
// source into a PassThrough (or another duplicated stream) per
// consumer, so each has its own, non-competing stream instance.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer\'s code does: `readable.pipe(logStream);` to tee traffic to a log file, and then separately does `for await (const chunk of readable) { ... }` on that SAME readable to process the data. They report the processing loop only ever receives a handful of chunks, or none at all, seemingly at random. Using Node\'s documented stream consumption rules, explain what\'s happening.',
    hint: 'What does calling .pipe() do to a Readable stream\'s mode? Once that has happened, is there anything left over for a separate for await...of loop on that same stream instance to consume?',
    solution: 'Calling readable.pipe(logStream) switches the readable into FLOWING mode — per Node\'s own documentation, this is one of the specific actions (alongside attaching a \'data\' listener or calling .resume()) that does so. Once in flowing mode, data is actively pulled out and delivered to whatever is consuming it — in this case, logStream via the pipe. The SEPARATE for await...of loop on that same readable instance is a second, independent consumption mechanism trying to pull from the SAME underlying stream, and per Node\'s explicit guidance, developers "should never use multiple methods to consume data from a single stream" — combining pipe() with async iteration on one stream is exactly the kind of combination the documentation warns produces "unintuitive behavior," which explains the inconsistent, seemingly-random chunk delivery the developer is seeing. The fix is to consolidate to ONE consumption mechanism for this stream — either do the logging AND the processing inside the same for await...of loop (writing each chunk to logStream manually inside the loop instead of using .pipe()), or restructure so each consumer gets its own separate stream instance rather than sharing one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'for await...of is just a more modern, async/await-friendly syntax for doing the same thing as attaching a \'data\' event listener — the two are interchangeable ways of expressing the same underlying stream consumption.',
      reality: 'This subtopic\'s theory shows these are genuinely separate consumption mechanisms that compete for the same data — Node\'s own documentation explicitly warns against combining them on the same stream instance, naming this exact combination as one that produces "unintuitive behavior."'
    },
    {
      thought: 'It is safe to attach a \'data\' listener to a stream for one purpose (like logging or metrics) while a completely separate part of the code processes that same stream with for await...of, as long as neither piece of code modifies the data.',
      reality: 'This subtopic\'s code example and exercise both show this is exactly the scenario that breaks — both consumers pull from the same underlying buffered chunks, so the \'data\' listener starves the async iteration (or vice versa) regardless of whether either one modifies anything.'
    },
    {
      thought: 'A Readable stream is always in "flowing" mode by default, immediately emitting data as soon as it\'s available, unless something explicitly pauses it.',
      reality: 'This subtopic\'s theory clarifies the opposite — every Readable stream STARTS in paused mode, and only switches to flowing mode when something explicitly triggers it (a \'data\' listener, .resume(), or .pipe()) — data simply accumulates in the buffer until then.'
    }
  ];
}
