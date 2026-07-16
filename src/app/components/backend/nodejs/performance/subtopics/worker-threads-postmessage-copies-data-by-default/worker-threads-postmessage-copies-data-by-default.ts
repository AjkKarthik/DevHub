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
  templateUrl: './worker-threads-postmessage-copies-data-by-default.html',
  styleUrl: './worker-threads-postmessage-copies-data-by-default.scss'
})
export class WorkerThreadsPostmessageCopiesDataByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake-fix offloads CPU work to a Worker via new Worker(\'./heavy-worker.js\', { workerData: req.body.data }) — correct advice, but worth knowing exactly what that workerData hand-off actually costs, since it is not free for large payloads',
      points: [
        'Per Node\'s own worker_threads documentation, postMessage() (and, internally, the workerData hand-off, which uses the same underlying mechanism) transfers data "in a way which is compatible with the HTML structured clone algorithm" — meaning the data is COPIED, not shared. For large objects, arrays, or buffers, this copy has a real, non-trivial CPU and memory cost proportional to the data\'s size, incurred on every single message.',
        'This has a direct consequence for the main page\'s own pattern: cluster mode\'s own theory section correctly says "Workers share nothing by default" for cluster\'s separate PROCESSES — but it\'s easy to assume worker_threads (running in the SAME process) behaves differently by default. It does share the same PROCESS, but postMessage()/workerData still default to copying, not sharing, unless you explicitly opt into one of two different mechanisms.',
        'Two documented ways to avoid the copy: a SharedArrayBuffer instance passed in the message is NOT cloned — Node\'s docs state it is "accessible from either thread," meaning both the main thread and worker read/write the SAME underlying memory. Separately, passing a plain ArrayBuffer (or MessagePort/FileHandle) in the transferList argument TRANSFERS OWNERSHIP without copying — but the docs are explicit that "after transferring, they are not usable on the sending side of the channel anymore." The original object becomes inert in whichever thread gave it up.',
      ]
    },
    {
      heading: 'Choosing correctly between the three options',
      points: [
        'Plain postMessage()/workerData copying is the right default for small-to-moderate data — the simplicity and safety (no risk of one side mutating data the other side is still using) usually outweighs the copy cost, and it is what most worker_threads code should keep using without a second thought.',
        'SharedArrayBuffer is the right choice when BOTH threads need concurrent read/write access to the SAME data over time (e.g., a shared counter, a ring buffer for streaming results) — but it reintroduces the exact class of race-condition risk Node\'s single-threaded model normally avoids, typically requiring Atomics operations for safe concurrent access.',
        'transferList is the right choice for large, one-shot data being HANDED OFF (not shared) — e.g., sending a large buffer of input data TO a worker to process, where the main thread genuinely has no further use for that specific buffer afterward. It gets the zero-copy performance benefit without SharedArrayBuffer\'s concurrency complexity, at the cost of the original reference becoming unusable.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern — a real copy on every message',
      language: 'typescript',
      code: `import { Worker } from 'node:worker_threads';

app.post('/process', (req, res) => {
  // workerData undergoes the SAME structured-clone COPY as
  // postMessage() — for a large req.body.data payload, this copy's
  // cost scales with data size, on every single request.
  const worker = new Worker('./heavy-worker.js', {
    workerData: req.body.data, // COPIED into the worker's own memory
  });
  worker.once('message', result => res.json(result));
  // The result coming BACK also gets copied, a second time.
});`,
    },
    {
      label: 'transferList — zero-copy hand-off, original becomes unusable',
      language: 'typescript',
      code: `import { Worker } from 'node:worker_threads';

app.post('/process-large-buffer', (req, res) => {
  // Suppose req-derived data is already an ArrayBuffer (e.g. from
  // a binary upload) — large enough that copying it is measurably
  // expensive on every request.
  const inputBuffer = getLargeArrayBuffer(req);

  const worker = new Worker('./heavy-worker.js', {
    workerData: { buffer: inputBuffer },
    // transferList: OWNERSHIP moves to the worker — no copy at all.
    transferList: [inputBuffer],
  });

  // inputBuffer is now DETACHED in this thread — per Node's own
  // docs, "not usable on the sending side... anymore":
  console.log(inputBuffer.byteLength); // 0 — the buffer is neutered

  worker.once('message', result => res.json(result));
});

// SharedArrayBuffer — both threads read/write the SAME memory,
// for genuinely ongoing shared state (needs Atomics for safety):
const shared = new SharedArrayBuffer(1024);
const worker = new Worker('./counter-worker.js', { workerData: { shared } });
// "shared" is NOT copied — the worker sees the exact same bytes,
// and mutations from either side are visible to the other.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team offloads image-processing work to a worker_threads pool, passing each image\'s raw pixel data (a large ArrayBuffer, often several MB) via workerData for every request. Under load, they notice CPU usage and latency both increase noticeably even though the actual image-processing algorithm running INSIDE each worker hasn\'t changed. Using the documented behavior of workerData, what is a likely, easily-overlooked contributor to this overhead, and what change would address it?',
    hint: 'Does passing a large ArrayBuffer via workerData share that memory with the worker, or does it copy the entire buffer\'s contents first? Does that copying cost scale with how large the buffer is?',
    solution: 'A likely, easily-overlooked contributor is the structured-clone COPY that workerData performs by default — since each image\'s raw pixel data is a large ArrayBuffer (often several MB), every single request pays the real CPU and memory cost of copying that entire buffer into the worker\'s own memory space before any actual image processing even begins, and this copy cost scales directly with the data\'s size. This overhead is easy to overlook because it happens transparently — there\'s no error, no warning, just steadily elevated CPU usage and latency that doesn\'t show up as time spent inside the image-processing algorithm itself, since the copy happens in Node\'s own internal message-passing machinery. The fix, given that each buffer is being handed off to a worker for one-shot processing (not accessed concurrently by both threads afterward), is passing the ArrayBuffer through the transferList option instead of relying on the default copy: new Worker(path, { workerData: { buffer }, transferList: [buffer] }) — this transfers ownership of the buffer\'s underlying memory to the worker with no copy at all, at the cost of the buffer becoming unusable (zero-length) in the main thread afterward, which is an acceptable tradeoff here since the main thread has no further use for that specific buffer once it\'s been handed off.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since worker_threads run in the same process (unlike cluster\'s separate processes), passing data via workerData or postMessage() shares that memory directly with the worker by default, with no copying involved.',
      reality: 'This subtopic\'s theory and first code example both show the opposite — Node\'s own docs confirm postMessage()/workerData use the structured clone algorithm by default, genuinely COPYING the data, with sharing only available via the explicit SharedArrayBuffer or transferList mechanisms.'
    },
    {
      thought: 'Using transferList to pass an ArrayBuffer to a worker is purely a performance optimization with no other consequence — the original buffer reference in the sending thread continues to work normally afterward.',
      reality: 'This subtopic\'s code example shows the opposite — Node\'s own docs state transferred objects "are not usable on the sending side of the channel anymore," and the exercise confirms the original ArrayBuffer becomes detached (zero-length) in the thread that gave it up.'
    },
    {
      thought: 'SharedArrayBuffer and transferList solve the same problem and are interchangeable — either one avoids the default copy, so the choice between them is arbitrary.',
      reality: 'This subtopic\'s theory clarifies these solve genuinely different problems — SharedArrayBuffer is for data BOTH threads need ongoing concurrent access to (requiring Atomics for safety), while transferList is for a one-shot HAND-OFF where the sending thread has no further use for that specific data afterward.'
    }
  ];
}
