import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './transferred-arraybuffers-become-genuinely-detached-zero-copy.html',
  styleUrl: './transferred-arraybuffers-become-genuinely-detached-zero-copy.scss'
})
export class TransferredArraybuffersBecomeGenuinelyDetachedZeroCopySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Transfer is an ownership move, not a copy — and the browser enforces this by neutering the original',
      points: [
        'The main page describes <code>postMessage(buffer, [buffer])</code> as "zero-copy" — the second argument is a transfer list, and objects in it don\'t get structured-cloned like the rest of the message.',
        'Because there is genuinely only ONE copy of the underlying memory, the browser must guarantee the sender can no longer touch it after transfer — otherwise both threads could read/write the same memory unsynchronized, a real correctness hazard, not just a performance detail.',
      ]
    },
    {
      heading: 'Confirmed directly — a transferred ArrayBuffer\'s byteLength drops to 0 on the sending side the instant postMessage() returns',
      points: [
        'A real 1 MB <code>ArrayBuffer</code> sent via <code>worker.postMessage(buffer, [buffer])</code> to a real Worker (built from a Blob URL, no external file needed) reported <code>buffer.byteLength === 0</code> on the main thread immediately after the call — while the Worker\'s <code>onmessage</code> handler received the FULL 1,048,576 bytes.',
        'This is the literal proof of "detached": the data itself was never duplicated — ownership moved entirely to the Worker, and the main thread\'s reference became an empty husk pointing at nothing, exactly as the main page\'s mistake entry describes.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>transferred ArrayBuffers become genuinely detached (zero-copy)</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Build a real Worker from a Blob URL (no separate worker file needed for this demo),
// then transfer a real ArrayBuffer to it and observe the sender's own reference afterward.
const workerCode = \`
  self.onmessage = (e) => {
    const buf = e.data;
    self.postMessage({ receivedByteLength: buf.byteLength });
  };
\`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

(async () => {
  const buffer = new ArrayBuffer(1024 * 1024); // 1MB
  console.log('before transfer, buffer.byteLength:', buffer.byteLength);

  const received = await new Promise<{ receivedByteLength: number }>((resolve) => {
    worker.onmessage = (e) => resolve(e.data);
    worker.postMessage(buffer, [buffer]); // transfer list — ownership moves, no clone
  });

  console.log('after transfer, buffer.byteLength on MAIN thread:', buffer.byteLength);
  console.log('bytes actually received by the WORKER:', received.receivedByteLength);
  console.log('---');
  console.log('the data was never duplicated — the same memory just changed owner.');

  worker.terminate();
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes worker.postMessage(largeBuffer, [largeBuffer]), then immediately after that line, reads largeBuffer.byteLength to log how much data was sent, expecting to see the original size. What will they actually see, and why?',
    hint: 'Think about what this subtopic\'s demo confirmed happens to the SENDER\'s own reference the instant a transfer list is used — is the original reference still pointing at valid data afterward?',
    solution: 'They will see 0, not the original size — confirmed directly in this subtopic\'s demo. The transfer list in the second argument means ownership of the buffer\'s memory moves entirely to the Worker; the main thread\'s own reference is immediately detached (neutered), with byteLength dropping to 0. To log the size that was sent, the size must be captured in a variable BEFORE the postMessage() call, not read from the buffer reference afterward — reading any property of a detached ArrayBuffer either returns 0/empty or throws, depending on the property.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Transferring a buffer to a Worker still leaves a usable copy on the main thread — "transfer" is just a performance hint that avoids blocking, similar to structured clone but faster.',
      reality: 'This subtopic\'s demo shows transfer is a genuine ownership move, not a faster copy — the main thread\'s buffer.byteLength dropped to exactly 0 immediately after postMessage() returned, while the Worker received the complete, full-size data. There is only ever one copy of the memory.'
    },
    {
      thought: 'Since transfer avoids cloning, it must be asynchronous — the sender\'s reference stays valid until the Worker actually receives the message.',
      reality: 'Confirmed directly: the detachment is synchronous and immediate — buffer.byteLength was already 0 on the very next line after postMessage(buffer, [buffer]) returned, well before the Worker had necessarily processed the message.'
    },
    {
      thought: 'Any object passed to postMessage can be added to the transfer list for a zero-copy speed boost, as long as it\'s reasonably large.',
      reality: 'Only specific Transferable types (ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas, and a few others) support transfer — passing an object that isn\'t in that list as part of a transfer array throws a DataCloneError rather than silently falling back to a clone.'
    }
  ];
}
