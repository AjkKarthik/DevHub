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
  templateUrl: './sync-once-do-treats-a-panic-as-already-run.html',
  styleUrl: './sync-once-do-treats-a-panic-as-already-run.scss'
})
export class SyncOnceDoTreatsAPanicAsAlreadyRunSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own GetConfig() uses sync.Once but never explains what happens if the init logic fails',
      points: [
        'The main page\'s Singleton & Repository code tab defines configOnce.Do(func() { config = &Config{...} }) and its theory says only "sync.Once runs initialisation exactly once across goroutines — the idiomatic Go singleton." That description covers the happy path completely, but says nothing about what "exactly once" means when the function passed to Do does not finish normally.',
        'The official sync package documentation for Once.Do is explicit about this: "If f panics, Do considers it to have returned; future calls of Do return without calling f." A panic is treated identically to a normal return — the Once is marked done either way.',
        'Applied to GetConfig(): if the real init logic inside configOnce.Do (opening a file, dialing a database, parsing required config) panics on the very first call, that Once instance is permanently spent. Every later call to GetConfig() — from any goroutine, for the rest of the process\'s life — returns immediately without ever running the init logic again, since Do "returns without calling f."',
      ]
    },
    {
      heading: 'Recovering the panic elsewhere does not give the Once a second chance',
      points: [
        'A natural assumption is that if something further up the call stack recovers the panic (e.g. an HTTP middleware\'s recover()), the program can simply "try again later" by calling GetConfig() again. It cannot — recover() only stops the panic from crashing the goroutine; it has no visibility into, and no effect on, the Once\'s own internal completion flag, which was already set the moment Do decided f had "returned" (by panicking).',
        'The result in the failed-first-call case: config keeps whatever value it held when the panic occurred — nil, since the assignment config = &Config{...} in the main page\'s own code never completes if the panic happens before that line runs. GetConfig() then returns nil forever, with no error and no retry, to every caller in the process.',
        'This is not a concurrency bug and does not require multiple goroutines to reproduce — a single goroutine calling GetConfig() twice in a row, where the first call\'s init panics, sees the exact same permanent nil on the second call. sync.Once tracks whether f RAN, not whether it SUCCEEDED.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own GetConfig() — happy path only',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sync"
)

// This mirrors the main page's own Singleton pattern exactly.
type Config struct{ DSN string }

var (
    config     *Config
    configOnce sync.Once
)

func GetConfig() *Config {
    configOnce.Do(func() {
        config = &Config{DSN: "postgres://localhost/mydb"}
        // expensive init: read file, connect, etc.
    })
    return config
}

func main() {
    // Every call after the first is free -- Do just returns
    // immediately once the Once is marked done.
    c1 := GetConfig()
    c2 := GetConfig()
    fmt.Println(c1 == c2) // true -- same pointer, init ran once
}`,
    },
    {
      label: 'The gap the theory covers -- a panic inside Do permanently breaks GetConfig',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "os"
    "sync"
)

type Config struct{ DSN string }

var (
    config     *Config
    configOnce sync.Once
)

func GetConfig() *Config {
    configOnce.Do(func() {
        dsn := os.Getenv("DATABASE_DSN")
        if dsn == "" {
            // Simulates a real startup failure: a required env var
            // is missing. This panics BEFORE "config" is ever assigned.
            panic("DATABASE_DSN is not set")
        }
        config = &Config{DSN: dsn}
    })
    return config
}

func safeFirstCall() (c *Config, recovered bool) {
    defer func() {
        if r := recover(); r != nil {
            recovered = true // the panic was caught here...
        }
    }()
    c = GetConfig()
    return
}

func main() {
    // First call: DATABASE_DSN is unset, so the init panics.
    // The panic is recovered right here -- the process does not crash.
    _, wasRecovered := safeFirstCall()
    fmt.Println("first call recovered a panic:", wasRecovered) // true

    // Per Once.Do's own documented guarantee -- "Do considers it to
    // have returned; future calls of Do return without calling f" --
    // configOnce is now permanently marked done. Setting the env var
    // AFTER the fact changes nothing: Do will never call the init
    // function again for the life of this configOnce variable.
    os.Setenv("DATABASE_DSN", "postgres://localhost/mydb")

    c := GetConfig()
    fmt.Println(c == nil) // true -- still nil, forever, on this Once
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s GetConfig() wraps configOnce.Do(loadConfig), exactly like the main page\'s own pattern. During a canary deploy, the very FIRST request to hit a new pod calls GetConfig() before a required environment variable has propagated, so loadConfig panics. An HTTP middleware recovers the panic, so that one request just gets a 500 — the pod itself does not crash and keeps serving traffic. A minute later, the missing environment variable finally propagates. Using this subtopic\'s theory, predict what happens to every OTHER request that calls GetConfig() on that same pod after the environment variable is fixed, for as long as the pod keeps running.',
    hint: 'Per Once.Do\'s own documented guarantee quoted in this subtopic\'s theory, does the Once care WHY f "returned" (normal return vs. panic) when deciding whether to call f again on a future Do call? Does fixing the underlying cause of the panic (the missing env var) give configOnce a way to know it should retry?',
    solution: 'Every other request on that pod that calls GetConfig() continues to get the SAME broken result (config still nil, since the panic happened before config = &Config{...} could run) for the entire remaining lifetime of the process — even though the root cause (the missing environment variable) was fixed a minute later. This is the direct consequence of Once.Do\'s own documented guarantee from this subtopic\'s theory: "If f panics, Do considers it to have returned; future calls of Do return without calling f." The Once has no concept of "the cause of the failure was fixed, so retry" — it only tracks whether f already ran, and a panic counts as having run. The HTTP middleware\'s recover() only stopped that one request\'s panic from crashing the pod; it had no effect on configOnce\'s own internal completion flag, which was already permanently set the instant the panic occurred. The only way to actually recover from this in production is to restart the pod (which creates a fresh, unstarted configOnce) or to redesign GetConfig() to store an error alongside config and have every caller check it explicitly, rather than relying on sync.Once to represent "successfully initialized" instead of merely "attempted once."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'sync.Once.Do will automatically retry the function on the next call if the previous call panicked, since the init clearly "did not succeed."',
      reality: 'This subtopic\'s theory quotes the documentation directly: "If f panics, Do considers it to have returned; future calls of Do return without calling f." Once tracks whether f RAN to completion (including panicking), not whether it succeeded — there is no built-in retry behavior for a failed attempt.'
    },
    {
      thought: 'If a panic from inside Do(f) is recovered somewhere further up the call stack, that effectively "undoes" the failed attempt and resets the Once so the next call to Do runs f again.',
      reality: 'This subtopic\'s theory and second code example show recover() only stops the panic from propagating and crashing the goroutine — it has no access to, and no effect on, the Once\'s own internal "done" flag, which was already set the moment f panicked. The Once instance itself has no public way to be reset at all.'
    },
    {
      thought: 'This is a concurrency-only concern — since sync.Once exists to coordinate multiple goroutines, the panic-marks-it-done behavior only matters when several goroutines race to call Do at the same time.',
      reality: 'This subtopic\'s exercise shows the bug reproduces with a single goroutine making two sequential calls to GetConfig() — no concurrent callers are needed at all. The behavior is about what Do records after ONE call to f, not about how multiple goroutines are coordinated around that single call.'
    }
  ];
}
