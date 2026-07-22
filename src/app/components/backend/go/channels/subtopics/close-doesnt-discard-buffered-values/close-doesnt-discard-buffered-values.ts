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
  templateUrl: './close-doesnt-discard-buffered-values.html',
  styleUrl: './close-doesnt-discard-buffered-values.scss'
})
export class CloseDoesntDiscardBufferedValuesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'close() stops future sends — it does not clear out values already sitting in the buffer',
      points: [
        'The main page\'s own quick reference describes close(ch) simply as signaling "no more values" — and its theory adds "receiving from a closed channel immediately returns the zero value for the type with ok=false." Read quickly, that second sentence could be misread as "closing makes every future receive immediately return the zero value" — but that is only true once the buffer is fully drained, and the main page never states that qualifier explicitly.',
        'Go\'s own builtin package documentation for close is precise about the actual sequencing: close "has the effect of shutting down the channel after the last sent value is received." The phrase "after the last sent value is received" is the key detail — closing a buffered channel that still holds unreceived values does NOT discard them. Every value already sent before the close() call remains fully receivable, in the same FIFO order as always.',
        'Only once every previously-buffered value has actually been received does the channel begin returning the zero value with ok=false on every subsequent receive. Until that point, a receive on a closed-but-not-yet-drained channel behaves completely normally — it returns the next real value, with ok=true, exactly as if the channel were still open.',
      ]
    },
    {
      heading: 'Why this distinction matters for the exact patterns the main page teaches',
      points: [
        'This is precisely why for v := range ch — the canonical consumer pattern the main page\'s own theory calls out — is safe to use unconditionally with defer close(ch) in the sender: range does not stop early or skip remaining buffered values the instant close() executes elsewhere. It keeps draining every value that was already sent, in order, and only exits the loop once the buffer is empty AND the channel is closed.',
        'This also clarifies exactly why the main page\'s own "Forgetting to close — range loop hangs" mistake entry is really about a MISSING close, not a mistimed one: calling close(ch) as soon as the sender is logically done sending (even if some already-sent values are still sitting unreceived in the buffer) is always safe and correct — there is no risk of the consumer losing data by the sender closing "too early" relative to the buffer still holding values, since the buffer\'s contents are preserved regardless of when close() is called, as long as it happens after the LAST send.',
        'The one operation this protection does not extend to is a new send AFTER close — that unconditionally panics with send on closed channel regardless of buffer state, exactly as the main page\'s own first mistake entry already covers. The guarantee this subtopic describes is specifically about RECEIVING previously-sent values, not about being able to send more after closing.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Buffered values survive close() — receivers drain them all first',
      language: 'typescript',
      code: `package main

import "fmt"

func main() {
    ch := make(chan int, 3)
    ch <- 1
    ch <- 2
    ch <- 3

    close(ch) // closed -- but 3 values are still SITTING in the buffer

    // Every one of these three receives returns a REAL value with
    // ok == true, exactly as if the channel were still open --
    // close() did not discard anything already sent.
    v1, ok1 := <-ch
    v2, ok2 := <-ch
    v3, ok3 := <-ch
    fmt.Println(v1, ok1) // 1 true
    fmt.Println(v2, ok2) // 2 true
    fmt.Println(v3, ok3) // 3 true

    // Only NOW, after the buffer is fully drained, does the closed
    // state actually take effect on receives:
    v4, ok4 := <-ch
    fmt.Println(v4, ok4) // 0 false -- zero value, channel exhausted
}`,
    },
    {
      label: 'range drains everything buffered before close, then exits cleanly',
      language: 'typescript',
      code: `package main

import "fmt"

func produceThenClose() <-chan int {
    out := make(chan int, 5)
    for i := 1; i <= 5; i++ {
        out <- i // all 5 values buffered BEFORE close
    }
    close(out) // closing does not discard any of the 5 values
    return out
}

func main() {
    // range keeps draining every buffered value in order -- it does
    // NOT stop early or skip anything just because the channel was
    // already closed by the time range starts reading.
    for v := range produceThenClose() {
        fmt.Println(v) // 1 2 3 4 5 -- all five, in order
    }
    fmt.Println("range exited cleanly after the buffer was drained")
}`,
    },
    {
      label: 'What is NOT protected: sending after close still panics regardless of buffer state',
      language: 'typescript',
      code: `package main

import "fmt"

func main() {
    ch := make(chan int, 5) // plenty of free buffer capacity
    ch <- 1
    close(ch) // closed -- but the buffer still has room for 4 more

    // This is the ONE thing close() does NOT tolerate, no matter how
    // much free buffer capacity remains: a send after close always
    // panics, unconditionally.
    // ch <- 2
    // panic: send on closed channel

    v, ok := <-ch
    fmt.Println(v, ok) // 1 true -- the one value sent BEFORE close
                         // is still perfectly receivable
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a producer that sends 100 items into a buffered channel of capacity 100, then immediately calls close(ch), reasoning "the buffer is full and the channel is closed, so any consumer that hasn\'t started reading yet will just see an empty, closed channel and get nothing." A consumer goroutine that starts reading a full second later still successfully receives all 100 items. Using this subtopic\'s theory, explain why the developer\'s reasoning was wrong.',
    hint: 'Per this subtopic\'s theory, what does close() actually do to values already sitting in the buffer at the moment close() is called — does it clear them, or preserve them? When does a receive actually start returning the zero value with ok=false?',
    solution: 'The developer\'s reasoning is wrong because it assumes close() immediately transitions the channel to an "empty, exhausted" state the moment it is called — but per this subtopic\'s theory, quoting Go\'s own builtin documentation directly, close() "has the effect of shutting down the channel after the last sent value is received," not immediately upon the close() call itself. The 100 items sent before close() remains fully intact and receivable in the buffer regardless of how much time passes before a consumer starts reading — close() only prevents FUTURE sends and marks the channel to eventually report exhaustion, but it does not discard or invalidate anything already buffered. A consumer starting a full second later is not "too late" in any sense that matters here: it simply receives the same 100 real values, in the same order, with ok=true each time, exactly as it would if it had started reading immediately after the sends — precisely the behavior demonstrated in this subtopic\'s first and second code examples. Only after all 100 values have actually been received would a 101st receive attempt correctly return the zero value with ok=false.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own theory statement — "receiving from a closed channel immediately returns the zero value for the type with ok=false" — means that as soon as close(ch) executes anywhere in the program, every subsequent receive on ch immediately starts returning the zero value, regardless of whether the channel still has buffered values.',
      reality: 'This subtopic\'s theory and first code example show that statement is only accurate once the buffer is FULLY drained — close() "has the effect of shutting down the channel after the last sent value is received," per Go\'s own documentation. Any values sent before the close() call remain fully receivable with ok=true; the zero-value/ok=false behavior only begins after every one of them has actually been received.'
    },
    {
      thought: 'Calling close(ch) while a buffered channel still has unreceived values sitting in it is a timing mistake — the "safe" way to close is to wait until the buffer is confirmed empty first, otherwise data might be lost.',
      reality: 'This subtopic\'s theory and second code example show the opposite is true: it is always safe to close a channel as soon as the sender is logically done sending, regardless of how many values are still sitting unreceived in the buffer at that moment — nothing is discarded, and every buffered value remains fully receivable afterward. There is no need to wait for the buffer to empty before closing.'
    },
    {
      thought: 'Since values already sent survive a close() call and remain receivable, sending is also somewhat forgiving around close() — for instance, sending into remaining free buffer capacity right after close() might be allowed if the buffer isn\'t actually full yet.',
      reality: 'This subtopic\'s third code example shows sending is NOT forgiving in any way, regardless of buffer state — a send after close() always panics with send on closed channel, even when the buffer has plenty of unused free capacity remaining. The protection this subtopic describes applies specifically to RECEIVING previously-sent values, never to sending additional ones after close.'
    }
  ];
}
