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
  templateUrl: './max-old-space-size-does-not-cap-total-process-memory.html',
  styleUrl: './max-old-space-size-does-not-cap-total-process-memory.scss'
})
export class MaxOldSpaceSizeDoesNotCapTotalProcessMemorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz answer correctly explains --max-old-space-size sets "the V8 old generation heap limit" — worth being precise about what that actually leaves OUT, since a container memory limit set with only this flag in mind is a real, easy way to get an unexplained OOM kill',
      points: [
        'Per Node\'s own Buffer documentation, "Instances of the Buffer class correspond to fixed-sized, raw memory allocations outside the V8 heap." This is stated plainly, not a subtle implication — Buffer memory (and by extension, a lot of binary data handling: file reads, network payloads, image/video processing, TypedArrays backed by ArrayBuffers) simply does not count against --max-old-space-size at all, no matter how that flag is configured.',
        'process.memoryUsage() exposes this distinction directly in its own output shape: heapUsed/heapTotal report ONLY the V8 heap (what --max-old-space-size actually bounds), external reports memory used by things like Buffer/TypedArray backing stores and C++ bindings, and rss (resident set size) is the TOTAL memory the OS considers the process to be using — heap plus external plus the process\'s own baseline overhead. rss is typically, and can be substantially, larger than heapUsed alone.',
        'The conclusion that follows from these confirmed facts (this specific consequence is not itself a sentence quoted from Node\'s own docs, but follows directly and unavoidably from them): a process can be killed by the OS or a container orchestrator (Docker\'s OOM killer, Kubernetes evicting a pod that exceeds its memory limit) for exceeding a TOTAL memory ceiling, even while --max-old-space-size is configured well below that same ceiling and V8 itself never throws its own "JavaScript heap out of memory" error — because the thing that killed the process (rss) and the thing --max-old-space-size actually limits (old-generation heap) are measuring genuinely different things.',
      ]
    },
    {
      heading: 'Why this specific gap catches teams off guard in containerized deployments',
      points: [
        'A common, reasonable-sounding but incomplete mental model: "set --max-old-space-size to comfortably below the container\'s memory limit, and the process will safely error out with a catchable heap-exhaustion message before the container gets OOM-killed." This mental model only accounts for V8 heap growth — a Buffer-heavy workload (streaming large files, image processing, high-throughput network buffering) can push RSS well past the container limit through external/Buffer memory growth alone, with heapUsed staying comfortably low the entire time, triggering an abrupt, uncatchable SIGKILL from the container runtime instead of a graceful, catchable V8 error.',
        'The practical mitigation is monitoring and alerting on rss (or the container orchestrator\'s own memory metric) directly, in addition to — not instead of — V8 heap metrics, and setting the container\'s actual memory limit with real headroom above --max-old-space-size specifically to account for external/Buffer memory, native addon overhead, and process baseline cost, rather than treating the flag as if it were a total-memory ceiling.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Watching the gap between heap and total memory directly',
      language: 'typescript',
      code: `// node --max-old-space-size=512 app.js
// A 512MB V8 heap limit — but this is NOT the same as "this process
// will never use more than 512MB total."

setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    heapUsed:  \`\${(mem.heapUsed  / 1024 / 1024).toFixed(0)}MB\`, // bounded by --max-old-space-size
    heapTotal: \`\${(mem.heapTotal / 1024 / 1024).toFixed(0)}MB\`, // bounded by --max-old-space-size
    external:  \`\${(mem.external  / 1024 / 1024).toFixed(0)}MB\`, // Buffers, C++ bindings — NOT bounded
    rss:       \`\${(mem.rss       / 1024 / 1024).toFixed(0)}MB\`, // TOTAL — what the OS/container actually sees
  });
}, 5000);

// A Buffer-heavy workload (streaming/processing large files) can
// grow "external" and "rss" substantially while "heapUsed" stays
// low and comfortable the entire time — the flag never gets close
// to being exceeded, yet total memory usage climbs regardless.`,
    },
    {
      label: 'The container-limit mismatch that causes a silent, uncatchable kill',
      language: 'typescript',
      code: `// A Dockerfile / Kubernetes deployment setting memory limits
// WITHOUT accounting for the gap between V8 heap and total RSS:

// CMD ["node", "--max-old-space-size=900", "app.js"]
// containers: resources: limits: memory: "1Gi"  (~1024MB)

// The reasoning: "900MB heap limit, 1024MB container limit — 124MB
// of headroom, should be safe." This headroom only covers V8's OWN
// overhead beyond the heap limit (young generation, V8 internals)
// — it does NOT account for Buffer/external memory a real workload
// might use, which can easily exceed 124MB for anything doing
// meaningful file/network/image processing.

// Symptom: the container gets SIGKILLed by the OOM killer with NO
// "JavaScript heap out of memory" error in the application logs at
// all — V8 never hit ITS limit; the container's separate, TOTAL
// memory limit was exceeded by external/Buffer growth instead.

// A more defensive config gives real headroom for external memory,
// and monitors rss directly rather than trusting heap metrics alone:
// CMD ["node", "--max-old-space-size=600", "app.js"]
// containers: resources: limits: memory: "1Gi"
// + alerting on process.memoryUsage().rss / container memory metrics`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s containerized Node.js service, processing large file uploads via Buffer-heavy streaming logic, is periodically killed by Kubernetes with an OOMKilled status — but the application\'s own logs never show a "JavaScript heap out of memory" error anywhere, and their monitoring dashboard for heapUsed/heapTotal shows those metrics staying comfortably under the configured --max-old-space-size the entire time, right up until the kill. What is the most likely explanation, and what should the team monitor instead to catch this in advance?',
    hint: 'Does --max-old-space-size limit the TOTAL memory a Node.js process can use, or specifically the V8 heap\'s old generation? Is Buffer memory (heavily used by a file-streaming workload) counted as part of the V8 heap that flag limits?',
    solution: 'The most likely explanation is that this workload\'s memory growth is happening in Buffer/external memory, not the V8 heap — since Buffer instances are allocated outside the V8 heap entirely (per Node\'s own Buffer documentation), a Buffer-heavy file-streaming workload can grow the process\'s total memory footprint substantially through external allocations that --max-old-space-size has no bearing on whatsoever, while heapUsed/heapTotal stay low and unremarkable the entire time — exactly matching what the team is observing. Since V8 itself never approaches ITS OWN limit, it never throws the catchable "JavaScript heap out of memory" error; instead, the process\'s TOTAL memory (rss) eventually exceeds Kubernetes\'s container memory limit, and the container runtime issues an abrupt, uncatchable SIGKILL — which is exactly why nothing appears in the application\'s own logs explaining the kill. The team should monitor process.memoryUsage().rss directly (or the equivalent container-level memory metric Kubernetes itself reports for the pod) rather than relying on heapUsed/heapTotal alone, since rss is the figure that actually determines whether the container gets OOM-killed — heap metrics staying healthy provides no guarantee about total process memory, precisely because Buffer/external memory sits entirely outside what those heap metrics (and --max-old-space-size) account for.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '--max-old-space-size sets an upper bound on a Node.js process\'s TOTAL memory usage — configuring it below a container\'s memory limit guarantees the process will never be OOM-killed by that container.',
      reality: 'This subtopic\'s theory and both code examples show the opposite — this flag only bounds the V8 heap\'s old generation; Buffer instances and other external memory are allocated outside the V8 heap entirely and are not subject to this limit at all, so total process memory (rss) can still exceed a container\'s limit regardless of this flag\'s setting.'
    },
    {
      thought: 'A Node.js process that gets killed for exceeding a container\'s memory limit will always produce a "JavaScript heap out of memory" error in the application logs first, giving some warning before the kill.',
      reality: 'This subtopic\'s exercise shows the opposite is a real, documented failure mode — if the memory growth causing the OOM kill is happening in Buffer/external memory rather than the V8 heap, V8 never approaches its own limit and never throws that error at all; the container runtime\'s SIGKILL arrives abruptly with no corresponding application-level warning.'
    },
    {
      thought: 'Monitoring heapUsed and heapTotal via process.memoryUsage() is sufficient to catch a Node.js process approaching a dangerous total memory level before it gets OOM-killed.',
      reality: 'This subtopic\'s theory and exercise both clarify rss (not heapUsed/heapTotal) is the figure that actually corresponds to what an OS or container orchestrator measures against a memory limit — a workload can have low, healthy heap metrics while rss climbs toward the actual limit through external/Buffer memory growth the heap metrics never reflect.'
    }
  ];
}
