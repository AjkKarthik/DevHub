import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-readallasync-detects-completion-waittoreadasync-tryread-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-readallasync-detects-completion-waittoreadasync-tryread.html',
  styleUrl: './how-readallasync-detects-completion-waittoreadasync-tryread.scss',
})
export class HowReadallasyncDetectsCompletionWaittoreadasyncTryreadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes WHAT ReadAllAsync does — this is exactly HOW it does it',
      points: [
        'The main Channels page states <code>ReadAllAsync</code> "ends gracefully after Complete() + drain." Under the hood, <code>ReadAllAsync</code> is itself an <code>async IAsyncEnumerable&lt;T&gt;</code> iterator method built from exactly TWO lower-level <code>ChannelReader&lt;T&gt;</code> primitives you can call directly: <code>WaitToReadAsync(ct)</code> and <code>TryRead(out T item)</code>. Understanding this two-step protocol demystifies exactly when and why the <code>await foreach</code> loop actually stops.',
      ],
    },
    {
      heading: 'The protocol: WaitToReadAsync answers "is there (or will there be) something to read", TryRead actually takes it',
      points: [
        '<code>WaitToReadAsync(ct)</code> returns a <code>ValueTask&lt;bool&gt;</code> that completes with <code>true</code> as soon as an item becomes available to read, OR completes with <code>false</code> if the channel has been completed AND is fully drained (meaning no more items will EVER become available). This single boolean is the exact signal that decides whether the loop continues or exits.',
        '<code>TryRead(out item)</code> is the SYNCHRONOUS, non-blocking attempt to actually dequeue one item — it can fail (return false) even right after <code>WaitToReadAsync</code> returned true, because another concurrent reader might have taken the item first in a multi-reader scenario. This is exactly why a hand-written consumer loop must call <code>WaitToReadAsync</code> again after a failed <code>TryRead</code>, rather than assuming one <code>WaitToReadAsync</code> guarantees exactly one successful <code>TryRead</code>.',
      ],
    },
    {
      heading: 'This is precisely the loop the compiler generates for you when you write await foreach (ReadAllAsync())',
      points: [
        'Writing <code>await foreach (var item in channel.Reader.ReadAllAsync(ct)) { Process(item); }</code> is exactly equivalent, in terms of the underlying protocol, to a manual <code>while (await reader.WaitToReadAsync(ct)) { while (reader.TryRead(out var item)) { Process(item); } }</code> — the OUTER loop waits for "something is available or the channel is truly done," and the INNER loop drains everything CURRENTLY available before going back to wait again, which is more efficient than waiting once per single item when many items have already arrived in a burst.',
        'This explains the main page\'s own completion claim precisely: the outer <code>WaitToReadAsync</code> loop terminates ONLY when it returns <code>false</code> — which the <code>ChannelReader&lt;T&gt;</code> implementation guarantees happens if and only if <code>writer.Complete()</code> has been called AND every previously-written item has already been consumed via <code>TryRead</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What await foreach (ReadAllAsync()) is functionally equivalent to',
      language: 'csharp',
      code: `var channel = Channel.CreateUnbounded<string>();

// The convenient, high-level form from the main page:
await foreach (var item in channel.Reader.ReadAllAsync())
{
    Process(item);
}

// Is functionally equivalent, protocol-wise, to this hand-written
// loop using the two lower-level primitives directly:
while (await channel.Reader.WaitToReadAsync())
{
    // INNER loop drains everything CURRENTLY buffered before going
    // back to wait again — more efficient than one WaitToReadAsync
    // call per single item when a burst of items has already arrived:
    while (channel.Reader.TryRead(out var item))
    {
        Process(item);
    }
}
// The OUTER while condition is exactly what decides termination:
// WaitToReadAsync returns false ONLY when the channel is BOTH
// completed AND fully drained — precisely the main page's own
// completion contract, made explicit.

static void Process(string item) => Console.WriteLine(item);`,
    },
    {
      label: 'Why TryRead can fail even right after WaitToReadAsync returns true — the multi-reader case',
      language: 'csharp',
      code: `var channel = Channel.CreateUnbounded<int>();
channel.Writer.TryWrite(42);

// TWO competing readers, both waiting on the SAME channel:
var readerTaskA = Task.Run(async () =>
{
    if (await channel.Reader.WaitToReadAsync())
    {
        // Even though WaitToReadAsync just returned true — meaning
        // AT LEAST one item was available — THIS specific TryRead
        // call might still fail, if reader B's TryRead call won the
        // race and already took the only item:
        if (channel.Reader.TryRead(out var item))
            Console.WriteLine($"Reader A got: {item}");
        else
            Console.WriteLine("Reader A: TryRead failed — B got it first");
    }
});

var readerTaskB = Task.Run(async () =>
{
    if (await channel.Reader.WaitToReadAsync())
    {
        if (channel.Reader.TryRead(out var item))
            Console.WriteLine($"Reader B got: {item}");
        else
            Console.WriteLine("Reader B: TryRead failed — A got it first");
    }
});

await Task.WhenAll(readerTaskA, readerTaskB);
// EXACTLY one of A or B prints "got: 42" — the other prints the
// "TryRead failed" branch. This is WHY a correct manual consumer loop
// must be structured as "while WaitToReadAsync, then while TryRead"
// (retrying WaitToReadAsync after a failed inner TryRead), rather
// than assuming one WaitToReadAsync guarantees one successful TryRead.`,
    },
    {
      label: 'Proving the exact moment WaitToReadAsync flips to false',
      language: 'csharp',
      code: `var channel = Channel.CreateUnbounded<string>();
channel.Writer.TryWrite("only-item");

// First call: an item IS available — returns true immediately:
bool first = await channel.Reader.WaitToReadAsync();
Console.WriteLine(first); // True

channel.Reader.TryRead(out var taken);
Console.WriteLine(taken); // "only-item" — buffer now empty

// writer.Complete() has NOT been called yet — WaitToReadAsync would
// currently SUSPEND here, waiting for either a new write or Complete():
var pending = channel.Reader.WaitToReadAsync();
Console.WriteLine(pending.IsCompleted); // False — genuinely waiting

// NOW complete the writer — this is the exact trigger that makes the
// PENDING WaitToReadAsync call resolve, specifically to false, since
// there is nothing left to read and nothing more will ever arrive:
channel.Writer.Complete();

bool second = await pending;
Console.WriteLine(second); // False — precisely the signal that ends
                            // the outer loop in ReadAllAsync's own
                            // generated implementation`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a manual consumer loop (using WaitToReadAsync and TryRead directly, NOT ReadAllAsync) that processes items from a channel and prints "done" exactly once when the channel is genuinely completed and drained.',
    hint: 'Structure it as: while (await reader.WaitToReadAsync(ct)) { while (reader.TryRead(out var item)) { process it } } then print "done" after the outer loop exits — the outer loop only exits when WaitToReadAsync returns false.',
    solution: `async Task ConsumeManuallyAsync(ChannelReader<string> reader, CancellationToken ct)
{
    // Outer loop: waits for "something available OR channel is
    // genuinely done" — returns false only when BOTH writer.Complete()
    // has been called AND every item has already been read:
    while (await reader.WaitToReadAsync(ct))
    {
        // Inner loop: drains everything CURRENTLY buffered before
        // going back to wait again — handles bursts efficiently and
        // correctly retries after a TryRead race in multi-reader
        // scenarios:
        while (reader.TryRead(out var item))
        {
            Console.WriteLine($"processing: {item}");
        }
    }

    // Reached ONLY when WaitToReadAsync returned false — i.e. the
    // channel is genuinely completed and fully drained, exactly the
    // same guarantee reader.Completion and ReadAllAsync's own
    // termination rely on:
    Console.WriteLine("done");
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a single WaitToReadAsync() call that returns true guarantees the very next TryRead call will succeed.',
      reality: 'in a multi-reader scenario, another reader can take the item between WaitToReadAsync returning true and this reader\'s own TryRead call — a correct consumer loop must handle a failed TryRead by looping back to WaitToReadAsync again, not assume a one-to-one pairing.',
    },
    {
      thought: 'ReadAllAsync is a fundamentally different, more magical mechanism than anything you could write by hand.',
      reality: 'ReadAllAsync is functionally equivalent to a straightforward "while WaitToReadAsync, then while TryRead" loop built from two public, directly-callable ChannelReader<T> methods — there is no hidden mechanism beyond that two-step protocol.',
    },
    {
      thought: 'WaitToReadAsync only returns false due to an error or cancellation — it has no other meaning.',
      reality: 'WaitToReadAsync returning false is the NORMAL, expected signal that the channel is genuinely completed and fully drained — it is precisely how ReadAllAsync (and reader.Completion) know the pipeline is truly finished, not an error condition.',
    },
  ];
}
