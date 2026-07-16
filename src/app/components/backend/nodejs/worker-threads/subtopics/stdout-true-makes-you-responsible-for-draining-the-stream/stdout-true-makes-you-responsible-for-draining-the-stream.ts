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
  templateUrl: './stdout-true-makes-you-responsible-for-draining-the-stream.html',
  styleUrl: './stdout-true-makes-you-responsible-for-draining-the-stream.scss'
})
export class StdoutTrueMakesYouResponsibleForDrainingTheStreamSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'By default, a worker\'s console.log() output is auto-piped straight to the parent\'s own stdout',
      points: [
        'Node\'s own worker_threads documentation states that by default, a worker thread\'s stdout and stderr are automatically piped to the corresponding stdout/stderr of the main (parent) thread\'s process. This is why every code example elsewhere on this site that has a worker call console.log() "just works," with the output appearing in the same terminal as the main thread\'s own output, without any extra plumbing.',
        'The Worker constructor accepts a { stdout: true } option (and separately, { stderr: true }) that turns this default OFF. Once set, the worker\'s output is no longer auto-forwarded to the parent process\'s stdout — instead, it becomes available as a readable Node.js stream on worker.stdout, which the parent code must explicitly read from (e.g., worker.stdout.on("data", ...) or piping it elsewhere) to actually see or use that output at all.',
      ]
    },
    {
      heading: 'Why turning stdout auto-piping off shifts real responsibility onto the parent',
      points: [
        'This is a genuine behavior swap, not just an extra option: with the default, the worker\'s output stream is fully consumed automatically by the piping mechanism itself. With { stdout: true }, worker.stdout is exposed as a stream that exists in a "not being read" state until the parent code attaches a consumer to it — nothing else in Node reads it on the parent\'s behalf once this option is set.',
        'Node\'s own stream documentation separately warns, in its general discussion of synchronous stdio behavior, about the risks of unconsumed or improperly-handled stream output; the specific consequence for an unread worker.stdout stream — that written data could back up and eventually block the worker\'s own writes to it — is not a directly documented warning tied to this exact scenario, but follows as a reasonable inference from Node streams\' general backpressure model applied to this specific stream: a Writable side (the worker\'s own process.stdout) with no active Readable-side consumer accumulating data with nowhere to go.',
        'The safest posture: only opt into { stdout: true } / { stderr: true } when there is a genuine reason to capture a worker\'s output separately (e.g., routing it to a log aggregator, filtering it, or associating it with a specific task ID in a pool) — and if you do, always attach a real consumer (a "data" listener, a pipe() target, or similar) immediately, rather than leaving the stream unread.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default: worker output auto-appears on the parent\'s stdout',
      language: 'typescript',
      code: `import { Worker, isMainThread } from 'node:worker_threads';

if (isMainThread) {
  // No stdout option — this worker's console.log() output is
  // automatically piped to the parent process's own stdout.
  new Worker(new URL(import.meta.url));
} else {
  console.log('hello from the worker');
  // Appears directly in the parent's terminal, no extra code needed.
}`,
    },
    {
      label: '{ stdout: true } — now YOU must read worker.stdout yourself',
      language: 'typescript',
      code: `import { Worker, isMainThread } from 'node:worker_threads';

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url), { stdout: true });

  // Auto-piping is now OFF. Without this listener, the worker's
  // console.log() output would never appear anywhere — the stream
  // just sits there, unconsumed, instead of reaching the terminal.
  worker.stdout.on('data', (chunk) => {
    process.stdout.write(\`[worker] \${chunk}\`);
  });
} else {
  console.log('hello from the worker');
  // This still writes to the worker's own internal stdout stream —
  // it just no longer auto-forwards anywhere without a listener.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A worker pool is changed to pass { stdout: true } to every worker it creates, so that each task\'s console output can be tagged with a task ID and written to a structured log file instead of the shared terminal. After the change, none of the workers\' log output appears anywhere — not in the terminal, not in the log file. Explain what the change actually did to the workers\' output, and what is still missing.',
    hint: 'What does the default auto-piping behavior normally do with a worker\'s stdout, and what does passing { stdout: true } switch that behavior to instead? Is worker.stdout something that gets read automatically, or does something need to explicitly consume it?',
    solution: 'Passing { stdout: true } turned OFF the default auto-piping that normally forwards a worker\'s console output straight to the parent process\'s own stdout — per Node\'s documentation, this option specifically disables that default. What it did NOT do is set up any new destination for that output; it only exposed worker.stdout as a readable stream on the Worker instance for the parent to consume manually. Since the described change only added the { stdout: true } option and never attached anything to actually read from worker.stdout (no "data" listener, no .pipe() call to the log file), the worker\'s output has nowhere to go — it is written into the worker\'s own internal stdout stream, but nothing on the parent side is consuming it, so it never reaches the terminal or the intended log file. What is missing is the consumer: code that listens on each worker\'s worker.stdout (e.g., worker.stdout.on("data", chunk => ...)) and explicitly writes the tagged, task-ID-prefixed output to the structured log file — the { stdout: true } option only opened the door to doing that; it does not do it automatically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Passing { stdout: true } to a Worker is simply an extra flag that enables additional logging or metadata for a worker\'s console output, without changing where that output actually ends up.',
      reality: 'This subtopic\'s theory and second code example both show it is a genuine behavior swap — { stdout: true } disables Node\'s default auto-piping to the parent\'s stdout entirely, replacing it with a readable worker.stdout stream that produces no visible output at all until something explicitly reads from it.'
    },
    {
      thought: 'A worker\'s console.log() output always appears somewhere automatically, the same way it does by default, regardless of what Worker constructor options were passed.',
      reality: 'This subtopic\'s exercise shows the opposite — once { stdout: true } is set, the worker\'s output goes nowhere at all unless the parent explicitly attaches a consumer to worker.stdout; the previously-automatic forwarding to the parent\'s terminal is gone.'
    },
    {
      thought: 'Since worker.stdout is described as a stream you can read from, Node must be buffering and eventually delivering that data even if nothing reads it right away, similar to how the default auto-piped output always eventually shows up.',
      reality: 'This subtopic\'s theory explains this is not something to rely on — Node\'s general streams model treats an unconsumed Readable stream as having no active sink, and (by inference from Node\'s own documented general warnings about unconsumed stdio) data with nowhere to go risks backing up rather than being magically delivered later; the safe practice is to always attach a real consumer immediately once { stdout: true } is used.'
    }
  ];
}
