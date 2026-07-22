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
  templateUrl: './panic-recover-goroutine-scoped.html',
  styleUrl: './panic-recover-goroutine-scoped.scss'
})
export class PanicRecoverGoroutineScopedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'recover() only ever sees a panic within its own goroutine\'s own call stack',
      points: [
        'The main page\'s own Panic & Recover example (safeDiv) recovers a panic that happens synchronously, inside the very same function call, on the very same goroutine that set up the deferred recover(). That is the only situation recover() was ever designed to handle.',
        'Each goroutine Go runs has its own, entirely independent panic/recover mechanism — there is no shared or global panic state. A deferred recover() written in one goroutine (say, the goroutine that called go worker()) has absolutely no visibility into a panic happening inside worker itself, running on its own separate goroutine, even though the two goroutines share the same process and the same memory.',
        'To recover a panic that might occur inside a goroutine launched with the go statement, the deferred recover() must be set up INSIDE that goroutine\'s own function body — as the very first thing it does, typically as defer func with a recover call inside it, placed at the top of the launched function itself, not anywhere in the caller.',
      ]
    },
    {
      heading: 'An unrecovered panic does not just kill that one goroutine — it crashes the entire program',
      points: [
        'A common, reasonable-sounding guess is that an unhandled panic in some background goroutine only terminates that one goroutine, while the rest of the program — including main and every other goroutine — keeps running normally. This is incorrect.',
        'The Go team\'s own article on defer, panic, and recover states the mechanism directly: "The process continues up the stack until all functions in the current goroutine have returned, at which point the program crashes." This is not scoped to just that goroutine\'s own cleanup — an unrecovered panic reaching the top of ANY goroutine\'s call stack terminates the entire process immediately, printing the panic value and a full stack trace, regardless of what any other goroutine happens to be doing at that moment.',
        'This is exactly why any goroutine whose body might panic — especially one handling work that was not fully validated ahead of time, like a per-request handler or a worker-pool job — needs its OWN deferred recover if a single failure must not be allowed to take the entire program down. This is a genuinely common, practical pattern in real Go server code, not just a theoretical edge case.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A recover() in the caller cannot catch a spawned goroutine\'s panic',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "time"
)

func main() {
    // This defer/recover lives in main's own goroutine.
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("recovered:", r)
        }
    }()

    go func() {
        panic("boom: something went wrong in the background")
        // This panic happens on a DIFFERENT goroutine than main's.
        // main's own deferred recover() above cannot see it at all --
        // each goroutine has its own, independent panic/recover chain.
    }()

    time.Sleep(100 * time.Millisecond)
    fmt.Println("main is still running...")
    // In reality, this program CRASHES before this line ever prints --
    // the spawned goroutine's unrecovered panic terminates the whole
    // process, taking main's own goroutine down with it, even though
    // main itself never panicked and its own recover() never fired.
}`,
    },
    {
      label: 'The fix: recover() set up inside the goroutine itself',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "time"
)

func main() {
    go func() {
        // The deferred recover() must be set up INSIDE the goroutine
        // that might panic -- not in main, not anywhere else.
        defer func() {
            if r := recover(); r != nil {
                fmt.Println("recovered inside the goroutine:", r)
            }
        }()
        panic("boom: something went wrong in the background")
    }()

    time.Sleep(100 * time.Millisecond)
    fmt.Println("main is still running -- the panic never reached it")
    // Output:
    // recovered inside the goroutine: boom: something went wrong in the background
    // main is still running -- the panic never reached it`,
    },
    {
      label: 'Real-world pattern: a worker pool that isolates each job',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

// runJob executes a single job with its OWN recover, so one bad job
// can never bring down the whole worker pool -- or the whole server.
func runJob(id int, job func()) (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("job %d panicked: %v", id, r)
        }
    }()
    job()
    return nil
}

func main() {
    jobs := []func(){
        func() { fmt.Println("job 0 ok") },
        func() { panic("job 1 hit a nil map write") },
        func() { fmt.Println("job 2 ok") },
    }

    var wg sync.WaitGroup
    for i, job := range jobs {
        wg.Add(1)
        go func(id int, j func()) {
            defer wg.Done()
            if err := runJob(id, j); err != nil {
                fmt.Println("recovered:", err)
            }
        }(i, job)
    }
    wg.Wait()
    fmt.Println("all jobs finished -- job 1's panic never reached main")`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An HTTP server launches go handleConnection(conn) for every incoming connection, with no recover() anywhere inside handleConnection itself — only a single defer/recover wrapping the whole main() function, set up once at startup. A bug in one client\'s request triggers a nil-pointer panic deep inside handleConnection for that one connection. What actually happens to the server, and why does main\'s own top-level recover() not save it?',
    hint: 'Which goroutine is handleConnection running on relative to main\'s own goroutine? Does a deferred recover() in main\'s goroutine have any visibility into a panic on a goroutine started with go handleConnection(conn)?',
    solution: 'The entire server process crashes immediately — not just the one connection that triggered the bug, and not just that one goroutine. Per this subtopic\'s theory, each goroutine has its own independent panic/recover mechanism; main\'s own deferred recover() only ever has visibility into a panic that occurs within main\'s OWN goroutine\'s call stack. handleConnection is running on a SEPARATE goroutine (the one created by go handleConnection(conn)), so a panic inside it is entirely invisible to main\'s recover, no matter how that defer is written or where it is placed within main. Since handleConnection itself has no deferred recover of its own, the panic propagates all the way to the top of ITS OWN goroutine\'s stack unrecovered — and per the documented behavior ("the program crashes" once an unrecovered panic reaches the top of a goroutine\'s stack), this terminates the entire process immediately, taking down every other in-flight connection along with it. The actual fix is the pattern shown in this subtopic\'s second and third code examples: handleConnection itself needs its own deferred recover as the first thing it does, so a bug triggered by one malformed client request is contained to that one connection\'s goroutine and reported (e.g., closing that connection with an error) instead of crashing the whole server for every other connected client.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own safeDiv example shows recover() catching a panic reliably, so wrapping ANY function call with a deferred recover() — including one that launches a goroutine with go — is enough to make that call panic-safe.',
      reality: 'This subtopic\'s theory and first code example show recover() only ever catches a panic on its OWN goroutine\'s call stack. A defer/recover written around a go someFunc() statement protects the goroutine that CALLED go — it has no effect whatsoever on a panic happening inside someFunc itself, which now runs on an entirely separate goroutine with its own independent panic/recover chain.'
    },
    {
      thought: 'If a background goroutine panics and nothing recovers it, that is unfortunate for whatever that goroutine was doing, but the rest of the program — main, and every other goroutine — keeps running normally, since goroutines are supposed to be independent.',
      reality: 'This subtopic\'s theory and exercise show the opposite: an unrecovered panic reaching the top of ANY goroutine\'s call stack crashes the ENTIRE process immediately, per the Go team\'s own documentation ("the program crashes"). Goroutines share fault-tolerance boundaries at the process level for unrecovered panics specifically — independence applies to scheduling and memory, not to what happens after an unhandled panic.'
    },
    {
      thought: 'Placing one single defer/recover at the very top of main() is a reasonable, sufficient safety net for a whole Go program, the same way a top-level try/catch might be treated as a last-resort safety net in other languages.',
      reality: 'This subtopic\'s exercise shows a top-level recover in main() only protects panics that occur within main\'s OWN goroutine — it provides zero protection for panics inside any goroutine launched with go, which is precisely where most real-world unexpected panics in a concurrent Go program (e.g., a per-connection or per-request handler) actually occur. Each such goroutine needs its own recover if it must not be allowed to crash the whole process.'
    }
  ];
}
