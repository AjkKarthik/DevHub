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
  selector: 'app-go-channels',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './channels.html',
  styleUrl: './channels.scss'
})
export class GoChannels {
  readingTime = 26;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';
  route = 'go-channels';
  nextRoute = '/go/sync';
  nextLabel = 'sync & sync/atomic';

  quickRef: QuickRefItem[] = [
    { name: 'ch := make(chan T)', type: 'function', desc: 'Unbuffered channel — send blocks until receiver is ready' },
    { name: 'ch := make(chan T, n)', type: 'function', desc: 'Buffered channel — send blocks only when buffer is full' },
    { name: 'ch <- v', type: 'operator', desc: 'Send v to channel ch — blocks if full/no receiver' },
    { name: 'v := <-ch', type: 'operator', desc: 'Receive from ch — blocks until a value is available' },
    { name: 'v, ok := <-ch', type: 'syntax', desc: 'Receive with close check — ok=false means channel closed and drained' },
    { name: 'close(ch)', type: 'function', desc: 'Close a channel — signals no more values. Only sender closes.' },
    { name: 'for v := range ch { }', type: 'syntax', desc: 'Receive until channel is closed and drained' },
    { name: 'select { case v := <-ch: }', type: 'keyword', desc: 'Non-deterministic multi-channel wait — picks a ready case' },
    { name: 'select { default: }', type: 'keyword', desc: 'Non-blocking channel operation when no case is ready' },
    { name: 'chan<- T / <-chan T', type: 'type', desc: 'Send-only / receive-only channel — use in function signatures' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Unbuffered vs buffered channels',
      points: [
        'An unbuffered channel (`make(chan T)`) synchronises sender and receiver — send blocks until a receiver is ready and vice versa.',
        'A buffered channel (`make(chan T, n)`) has a queue of capacity n — send blocks only when the buffer is full.',
        'Unbuffered channels are the Go equivalent of a rendezvous — they guarantee the receiver has the value before the sender continues.',
        'Buffered channels decouple sender and receiver timing — useful for queuing work or bursty producers.',
        'Rule of thumb: start with unbuffered, add buffering only when you have measured a throughput bottleneck.',
      ]
    },
    {
      heading: 'Closing channels & range',
      points: [
        'Only the sender should close a channel. Closing signals: "no more values will be sent."',
        'Receiving from a closed channel immediately returns the zero value for the type with ok=false.',
        '`for v := range ch {}` loops until the channel is closed and drained — the canonical consumer pattern.',
        'Sending on a closed channel panics. Never close from the receiver side.',
        'A nil channel blocks forever on both send and receive — useful in select to disable a case dynamically.',
      ]
    },
    {
      heading: 'select statement',
      points: [
        '`select` waits on multiple channel operations simultaneously and runs the first one that is ready.',
        'If multiple cases are ready, Go picks one at random — no priority.',
        'A `default` case makes select non-blocking: it runs immediately if no channel case is ready.',
        'Use `select` with a done/context channel to implement timeouts and cancellation.',
        '`select {}` (empty select) blocks forever — occasionally used in main() to keep the program alive.',
      ]
    },
    {
      heading: 'Directional channels',
      points: [
        '`chan<- T` is send-only. `<-chan T` is receive-only. Use them in function signatures to enforce direction.',
        'A bidirectional `chan T` can be implicitly converted to a directional channel, but not vice versa.',
        'Directional channels prevent bugs: passing `chan<- T` to a function guarantees it cannot accidentally receive.',
        'Generators return `<-chan T` — the caller reads but cannot send or close.',
        'The go vet tool and compiler catch misuse of directional channels at compile time.',
      ]
    },
    {
      heading: 'Common channel patterns',
      points: [
        'Done channel: `done := make(chan struct{})` — close it to broadcast cancellation to all receivers.',
        'Pipeline: chain goroutines so each receives from one channel and sends to another.',
        'Fan-out: one goroutine reads from a source and distributes to multiple worker channels.',
        'Fan-in: merge multiple input channels into one — each input runs a goroutine that forwards to the output.',
        'Timeout with select: `case <-time.After(d):` — fire after duration d if the main case is not ready.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Channels',
      language: 'typescript',
      code: `package main

import "fmt"

func sum(nums []int, ch chan int) {
    total := 0
    for _, n := range nums { total += n }
    ch <- total // send result
}

func main() {
    nums := []int{1, 2, 3, 4, 5, 6, 7, 8, 9}

    ch := make(chan int)
    go sum(nums[:len(nums)/2], ch)
    go sum(nums[len(nums)/2:], ch)

    a, b := <-ch, <-ch  // receive two results
    fmt.Println(a, b, a+b) // order varies, sum = 45

    // Buffered — send without blocking
    buf := make(chan string, 2)
    buf <- "first"
    buf <- "second"
    fmt.Println(<-buf) // first
    fmt.Println(<-buf) // second
}`
    },
    {
      label: 'Close & Range',
      language: 'typescript',
      code: `package main

import "fmt"

func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out) // close when done — signals consumers
        for _, n := range nums {
            out <- n
        }
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            out <- n * n
        }
    }()
    return out
}

func main() {
    // Pipeline: generate -> square -> print
    c := generate(2, 3, 4, 5)
    out := square(c)

    for v := range out {
        fmt.Println(v) // 4 9 16 25
    }
}`
    },
    {
      label: 'select',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "time"
)

func slow(ch chan<- string, delay time.Duration, msg string) {
    time.Sleep(delay)
    ch <- msg
}

func main() {
    ch1 := make(chan string, 1)
    ch2 := make(chan string, 1)

    go slow(ch1, 50*time.Millisecond,  "from ch1")
    go slow(ch2, 100*time.Millisecond, "from ch2")

    // Wait for both
    for i := 0; i < 2; i++ {
        select {
        case msg := <-ch1:
            fmt.Println("ch1:", msg)
        case msg := <-ch2:
            fmt.Println("ch2:", msg)
        }
    }

    // Timeout pattern
    result := make(chan int, 1)
    go func() { time.Sleep(200 * time.Millisecond); result <- 42 }()
    select {
    case v := <-result:
        fmt.Println("got:", v)
    case <-time.After(150 * time.Millisecond):
        fmt.Println("timed out")
    }
}`
    },
    {
      label: 'Done Channel',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "time"
)

func ticker(done <-chan struct{}) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        i := 0
        for {
            select {
            case <-done:
                fmt.Println("ticker stopped")
                return
            case out <- i:
                i++
                time.Sleep(10 * time.Millisecond)
            }
        }
    }()
    return out
}

func main() {
    done := make(chan struct{})
    nums := ticker(done)

    for n := range nums {
        fmt.Println(n)
        if n == 5 {
            close(done) // broadcast stop to all listeners
            break
        }
    }
    time.Sleep(20 * time.Millisecond) // let goroutine exit
}`
    },
    {
      label: 'Fan-in Merge',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

func merge(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup

    forward := func(ch <-chan int) {
        defer wg.Done()
        for v := range ch { out <- v }
    }

    wg.Add(len(channels))
    for _, ch := range channels {
        go forward(ch)
    }

    go func() {
        wg.Wait()
        close(out) // close output when all inputs are drained
    }()

    return out
}

func source(vals ...int) <-chan int {
    ch := make(chan int, len(vals))
    for _, v := range vals { ch <- v }
    close(ch)
    return ch
}

func main() {
    merged := merge(
        source(1, 2, 3),
        source(10, 20, 30),
        source(100, 200),
    )
    for v := range merged {
        fmt.Print(v, " ")
    }
    // Output: (order varies) 1 2 3 10 20 30 100 200
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Sending on a closed channel',
      wrong: `close(ch)
ch <- "value" // panic: send on closed channel`,
      right: `ch <- "value" // send first
close(ch)     // then close when no more values`,
      explanation: 'Sending to a closed channel always panics. Only close a channel after you are done sending. The receiver uses ok := <-ch or range to detect closure.'
    },
    {
      title: 'Closing from the receiver side',
      wrong: `// Receiver closes — dangerous if another sender still exists
func consumer(ch chan int) {
    v := <-ch
    close(ch) // bad — sender may still be running
}`,
      right: `// Only the sender (or a coordinator) closes
func producer(ch chan<- int) {
    for _, v := range data { ch <- v }
    close(ch) // safe — we know no more sends
}`,
      explanation: 'The sender owns the channel\'s lifetime. If multiple goroutines send, use sync.Once or a coordinator goroutine to close exactly once after all senders finish.'
    },
    {
      title: 'Receiving from a nil channel',
      wrong: `var ch chan int
v := <-ch // blocks forever — nil channel never receives`,
      right: `ch := make(chan int)
// use ch correctly`,
      explanation: 'A nil channel blocks forever on both send and receive. This is actually useful inside a select to disable a case, but accidental nil channels cause goroutine leaks. Always initialise channels with make.'
    },
    {
      title: 'Forgetting to close — range loop hangs',
      wrong: `func produce(ch chan int) {
    for _, v := range data { ch <- v }
    // forgot close(ch) — range on consumer blocks forever
}`,
      right: `func produce(ch chan int) {
    defer close(ch)   // always close when done sending
    for _, v := range data { ch <- v }
}`,
      explanation: 'for v := range ch exits only when ch is closed and drained. If the sender never closes, the range loop blocks forever. Use defer close(ch) in the sender to ensure it always closes.'
    },
    {
      title: 'Deadlock — goroutine count mismatch',
      wrong: `ch := make(chan int)
ch <- 1  // blocks — nobody is receiving yet
v := <-ch`,
      right: `ch := make(chan int)
go func() { ch <- 1 }() // send in a goroutine
v := <-ch               // receive in main`,
      explanation: 'An unbuffered channel requires both sender and receiver to be ready simultaneously. Sending in main without a concurrent receiver deadlocks. Use a goroutine for the sender, or use a buffered channel of size 1.'
    },
    {
      title: 'Using buffered channels to mask races',
      wrong: `// "I added buffer 100 so sends won't block" — wrong solution
ch := make(chan int, 100)
// This just delays the deadlock when buffer fills up`,
      right: `// Fix the design: ensure a receiver goroutine always drains the channel
go func() {
    for v := range ch { process(v) }
}()`,
      explanation: 'Buffered channels reduce blocking but do not eliminate the need for a receiver. A buffer just delays a deadlock. Design the system so every channel has a receiver that runs for the channel\'s entire lifetime.'
    },
  ];

  challenge: Challenge = {
    title: 'Pipeline: Generate → Filter → Square',
    language: 'typescript',
    description: `Build a three-stage pipeline using channels:

1. \`generate(nums ...int) <-chan int\` — emits each number into a channel and closes it
2. \`filter(in <-chan int, pred func(int) bool) <-chan int\` — only forwards values where pred returns true
3. \`square(in <-chan int) <-chan int\` — squares each value

Chain them:
\`\`\`go
out := square(filter(generate(1,2,3,4,5,6,7,8,9,10), func(n int) bool { return n%2 == 0 }))
for v := range out { fmt.Print(v, " ") }
// 4 16 36 64 100
\`\`\`

Each stage should run its forwarding goroutine internally and close its output channel when done.`,
    hints: [
      'Each function creates an output channel, launches a goroutine, and returns the channel',
      'Use `defer close(out)` in each goroutine so callers can range over the output',
      'Use `for v := range in` to drain the input',
      'The pipeline composes naturally: each stage output is the next stage input',
    ],
    starterCode: `package main

import "fmt"

func generate(nums ...int) <-chan int {
    out := make(chan int)
    // TODO: launch goroutine, send nums, close
    return out
}

func filter(in <-chan int, pred func(int) bool) <-chan int {
    out := make(chan int)
    // TODO: launch goroutine, forward if pred(v), close
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    // TODO: launch goroutine, send v*v, close
    return out
}

func main() {
    out := square(filter(
        generate(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
        func(n int) bool { return n%2 == 0 },
    ))
    for v := range out {
        fmt.Print(v, " ")
    }
    fmt.Println()
}`,
    solution: `package main

import "fmt"

func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums { out <- n }
    }()
    return out
}

func filter(in <-chan int, pred func(int) bool) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for v := range in {
            if pred(v) { out <- v }
        }
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for v := range in { out <- v * v }
    }()
    return out
}

func main() {
    out := square(filter(
        generate(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
        func(n int) bool { return n%2 == 0 },
    ))
    for v := range out {
        fmt.Print(v, " ")
    }
    fmt.Println()
    // 4 16 36 64 100
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens when you send to an unbuffered channel with no receiver?',
      options: [
        'The goroutine blocks until a receiver is ready',
        'The value is dropped silently',
        'A panic occurs immediately',
        'The value is queued internally',
      ],
      answer: 0,
      explanation: 'An unbuffered channel has no internal buffer. Send blocks until another goroutine is ready to receive. If called in main without a concurrent goroutine, it causes a deadlock.'
    },
    {
      q: 'What does `v, ok := <-ch` mean when ok is false?',
      options: [
        'The channel is closed and all values have been drained',
        'The channel has no pending values but is still open',
        'The receive timed out',
        'v is invalid and should be discarded',
      ],
      answer: 0,
      explanation: 'ok=false means the channel has been closed and there are no more values to receive. v will be the zero value for the channel\'s type. This is the mechanism used by range ch under the hood.'
    },
    {
      q: 'What does select do when multiple cases are ready simultaneously?',
      options: [
        'Picks one at random',
        'Executes all ready cases in order',
        'Executes the first ready case listed',
        'Panics with ambiguous channel error',
      ],
      answer: 0,
      explanation: 'When multiple cases in a select are ready, Go picks one at random. This prevents starvation of any particular channel. If you need priority, use nested selects or check channels in explicit order.'
    },
    {
      q: 'What is the zero value of a channel type?',
      options: [
        'nil',
        'An empty unbuffered channel',
        '0',
        'A closed channel',
      ],
      answer: 0,
      explanation: 'The zero value of any channel type is nil. A nil channel blocks forever on send and receive. This is intentionally used in select statements to dynamically disable a case by setting it to nil.'
    },
    {
      q: 'Which side of a channel should call close()?',
      options: [
        'The sender — only it knows when no more values will be sent',
        'The receiver — it signals it no longer needs data',
        'Either side — close() is safe from both',
        'Neither — channels close automatically when garbage collected',
      ],
      answer: 0,
      explanation: 'Only the sender should close a channel. Closing signals "no more values will be sent." Closing from the receiver is dangerous if another sender goroutine still exists — it would panic when it tries to send. Channels are garbage collected when unreachable; no explicit close is needed for GC.'
    },
    {
      q: 'A select statement has one case reading from a high-throughput channel and another reading from a rarely-used shutdown channel. Over many iterations of a loop containing this select, is the shutdown case guaranteed to eventually be picked even while the busy channel is almost always also ready?',
      options: ['No — if the busy channel is ready far more often, random per-iteration selection means the shutdown case could theoretically be starved for a very long time if both happen to be ready together repeatedly', 'Yes, Go guarantees round-robin fairness across all cases over time', 'The shutdown case is always prioritized since it appears with `<-ctx.Done()`', 'select processes cases in declaration order when multiple are ready'],
      answer: 0,
      explanation: 'Each individual select evaluation is an independent uniform-random choice among the currently-ready cases — Go makes no long-run fairness guarantee across many iterations. In practice, if the busy channel is ready on essentially every iteration and the shutdown channel becomes ready only once, that one iteration where both are ready still has just a 50% chance of picking shutdown (with two ready cases), so shutdown responsiveness is probabilistic, not instant. For guaranteed-prompt shutdown handling, check ctx.Done() with a dedicated, unbuffered non-blocking select before or in addition to the main select, rather than relying on random tie-breaking alone.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a channel vs a mutex?',
      a: 'Use a channel when passing ownership of data between goroutines (producer/consumer, pipeline, fan-out/in). Use a mutex (sync.Mutex) when protecting shared state that multiple goroutines read and write without transferring ownership — a cache, a counter, a shared data structure. Channels make the data flow explicit in the code; mutexes make the exclusion explicit. A common mistake is over-using channels where a simple mutex would be clearer.'
    },
    {
      q: 'What is a pipeline in Go?',
      a: 'A pipeline is a chain of goroutines connected by channels where each stage receives from the upstream channel, processes the data, and sends results to the downstream channel. Each stage runs concurrently. Data flows through the stages: `source → transform → sink`. The upstream stage closes its output channel when done, causing downstream stages\' range loops to exit naturally. Pipelines are composable and easy to test each stage in isolation.'
    },
    {
      q: 'How do I stop a pipeline early (before the source is exhausted)?',
      a: 'Pass a done channel (or context.Context) through all stages. When the consumer wants to stop, it closes the done channel or cancels the context. Each stage\'s goroutine uses select to check done: `select { case out <- v: case <-done: return }`. The source stage also checks done so it stops producing. This prevents goroutine leaks from abandoned pipeline stages that are still blocked sending.'
    },
    {
      q: 'What is the difference between a buffered and unbuffered channel?',
      a: 'An unbuffered channel (`make(chan T)`) synchronises sender and receiver — both must be ready simultaneously. It is a "rendezvous point." A buffered channel (`make(chan T, n)`) has an internal queue of size n — the sender blocks only when the buffer is full, and the receiver blocks only when the buffer is empty. Buffered channels decouple timing between goroutines and smooth bursts, but can hide design flaws if used to paper over missing receivers.'
    },
    {
      q: 'How can I use a nil channel in a select to disable a case?',
      a: 'A nil channel blocks forever. In a select, a case on a nil channel is never selected. You can use this to "disable" a case: `if condition { ch = nil }`. Practical example: a fan-in that merges two channels — when one is exhausted (closed), set it to nil so the select ignores it and only reads from the remaining channel. This avoids the "receive on closed channel returns zero value forever" problem.'
    },
    {
      q: 'Can I range over a channel that is never closed?',
      a: 'Yes, but the range loop will block forever waiting for the next value — it never exits because it does not know the channel is "done." You must either close the channel (if you have one sender) or use a done channel with select inside a regular for loop. In practice: if you cannot control when close happens, use `for { select { case v := <-ch: ...; case <-done: return } }` instead of range.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Channels are typed conduits for goroutine communication — unbuffered channels synchronise, select multiplexes, and closing signals completion.',
    mustKnow: [
      'Unbuffered: send blocks until receiver ready. Buffered: send blocks only when full.',
      'Only the sender closes a channel. Sending to a closed channel panics.',
      '`for v := range ch` exits when ch is closed and drained — always defer close in the sender.',
      '`select` waits on multiple channels; picks a ready case at random; `default` makes it non-blocking.',
      'Nil channel blocks forever — use this in select to dynamically disable a case.',
      'Directional channels `chan<- T` / `<-chan T` enforce direction in function signatures.',
      'Done channel or context cancellation gives goroutines an exit path — prevents leaks.',
    ],
    interviewFocus: [
      'Explain the difference between buffered and unbuffered channels.',
      'Why should only the sender close a channel?',
      'What does select do with multiple ready cases?',
      'How do you implement a timeout using channels?',
      'How do you use a nil channel to disable a select case?',
    ],
  };
}
