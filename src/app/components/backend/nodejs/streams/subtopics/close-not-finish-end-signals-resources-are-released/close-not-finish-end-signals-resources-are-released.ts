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
  templateUrl: './close-not-finish-end-signals-resources-are-released.html',
  styleUrl: './close-not-finish-end-signals-resources-are-released.scss'
})
export class CloseNotFinishEndSignalsResourcesAreReleasedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s mistake entry says an errored stream needs stream.destroy() to "clean up file handles" — worth knowing exactly which EVENT confirms that cleanup actually happened, since it is not the event most people reach for first',
      points: [
        'Per Node\'s own stream documentation, \'finish\' on a Writable "is emitted after the stream.end() method has been called, and all data has been flushed to the underlying system" — this confirms your application DATA has been handed off, but says nothing about whether the underlying resource (a file descriptor, a socket) has actually been released.',
        '\'end\' on a Readable is the read-side equivalent — it fires once all data has been consumed. Same limitation: it tells you data flow is complete, not that any underlying resource has been closed.',
        '\'close\' is the event actually tied to resource release: Node\'s documentation states it "is emitted when the stream and any of its underlying resources (a file descriptor, for example) have been closed... no further computation will occur." If your code specifically needs to know a file descriptor or socket has actually been released — for example, before trying to delete or rename the file that was just written — \'close\' is the correct event to wait for, not \'finish\'.',
      ]
    },
    {
      heading: 'One conditional detail: \'close\' is not unconditionally guaranteed to fire',
      points: [
        'Whether \'close\' actually fires after \'finish\'/\'end\' depends on two stream options that both default to true in current Node.js versions: autoDestroy (which automatically calls .destroy() once the stream finishes) and emitClose (which controls whether \'close\' is emitted at all). With their defaults, \'close\' reliably follows shortly after \'finish\'/\'end\' for the vast majority of everyday code.',
        'If a stream is explicitly constructed with autoDestroy: false, .destroy() is never called automatically, meaning \'close\' will NOT fire on its own after \'finish\'/\'end\' — the application would need to call .destroy() manually to trigger it. This is an edge case most code never encounters, but worth knowing if a codebase (or a library it depends on) has explicitly overridden these constructor options.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Waiting for \'finish\' is not the same as waiting for cleanup',
      language: 'typescript',
      code: `import { createWriteStream } from 'node:fs';
import { rename } from 'node:fs/promises';

const ws = createWriteStream('report.tmp');
ws.write('some data');
ws.end();

// 'finish' only confirms the DATA has been flushed to the
// underlying system — it does NOT guarantee the file descriptor
// has actually been closed yet.
ws.on('finish', async () => {
  // Renaming immediately here has, in practice, worked in many
  // simple cases — but it is relying on timing that 'finish' does
  // not actually guarantee. The doc-correct signal is 'close'.
  try {
    await rename('report.tmp', 'report.txt');
  } catch (err) {
    // On some platforms/filesystems, an fd that hasn't fully closed
    // yet can cause this kind of operation to behave unexpectedly.
  }
});`,
    },
    {
      label: 'Waiting for \'close\' — the documented resource-release signal',
      language: 'typescript',
      code: `import { createWriteStream } from 'node:fs';
import { rename } from 'node:fs/promises';

const ws = createWriteStream('report.tmp');
ws.write('some data');
ws.end();

// 'close' is Node's documented signal that "the stream and any of
// its underlying resources... have been closed." This is the
// correct event to wait for before an operation that specifically
// depends on the file descriptor actually being released.
ws.on('close', async () => {
  await rename('report.tmp', 'report.txt'); // safe: fd is released
});

// Relies on autoDestroy (default true) triggering destroy() after
// 'finish', which is what causes 'close' to follow. If this stream
// were constructed with { autoDestroy: false }, 'close' would not
// fire automatically at all — destroy() would need to be called
// manually first.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a script that creates a write stream to a log file, writes some data, calls .end(), and — inside the \'finish\' event handler — immediately tries to read back the same file\'s contents to verify what was written. Occasionally, on certain platforms, the read returns incomplete or unexpected data. Using the documented distinction between \'finish\' and \'close\', explain the most likely cause.',
    hint: 'Does \'finish\' guarantee the underlying file descriptor has actually been released and all OS-level buffers flushed to disk, or does it only guarantee the stream\'s own internal buffering of application data is done?',
    solution: 'The most likely cause is that the developer is treating \'finish\' as if it guarantees the underlying file resource is fully released and safe to reopen/reread, when Node\'s documentation only defines \'finish\' as confirming application data "has been flushed to the underlying system" — it says nothing about the underlying file descriptor actually having been closed. On some platforms and filesystems, there can be a small gap between "data handed off to the OS" (\'finish\') and "file descriptor actually closed / OS-level buffers fully synced" (\'close\'), and reading the file back before that gap closes can occasionally observe an inconsistent state. The documented, resource-release-guaranteeing event is \'close\', not \'finish\' — switching the verification read to run inside a \'close\' handler instead (relying on the default autoDestroy/emitClose behavior to fire it shortly after \'finish\') is the fix, since \'close\' is specifically the event Node\'s docs tie to "the stream and any of its underlying resources... have been closed."'
  };

  misconceptions: Misconception[] = [
    {
      thought: '\'finish\' (Writable) and \'end\' (Readable) are the correct events to wait for when code needs to know that a stream\'s underlying resources — like a file descriptor — have actually been released.',
      reality: 'This subtopic\'s theory shows both events only confirm DATA FLOW completion — Node\'s own documentation ties resource release specifically to the \'close\' event, which is a separate, later signal.'
    },
    {
      thought: '\'close\' always fires automatically and unconditionally shortly after \'finish\' or \'end\', so it can be relied on in every case without checking a stream\'s configuration.',
      reality: 'This subtopic\'s theory notes \'close\' firing depends on the autoDestroy and emitClose options, which default to true but can be explicitly disabled — a stream constructed with autoDestroy: false will not emit \'close\' automatically at all.'
    },
    {
      thought: 'Since \'finish\' means the stream has finished writing and \'close\' means the stream is closed, these are just two different names for essentially the same moment in a stream\'s lifecycle.',
      reality: 'This subtopic\'s code examples and exercise all show these are documented as genuinely DIFFERENT moments — \'finish\' confirms data was flushed to the underlying system, while \'close\' specifically confirms the underlying resource (file descriptor, socket) has been released, and code that depends on the latter should wait for \'close\', not \'finish\'.'
    }
  ];
}
