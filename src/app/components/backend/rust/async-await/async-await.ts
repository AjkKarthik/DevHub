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
  selector: 'app-rust-async-await',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './async-await.html',
  styleUrl: './async-await.scss'
})
export class RustAsyncAwait {
  readingTime = 30;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'advanced';
  since = 'Rust 2021+';
  route = 'rust-async-await';

  quickRef: QuickRefItem[] = [
    { name: 'async fn f() -> T', type: 'keyword', desc: 'Declares a function that returns a Future of T — calling it does nothing until the future is awaited or polled' },
    { name: 'expr.await', type: 'operator', desc: 'Suspends the current task until the future completes, letting the runtime run other tasks meanwhile' },
    { name: '#[tokio::main]', type: 'decorator', desc: 'A macro that turns async fn main into a normal main that starts the Tokio runtime' },
    { name: 'tokio::spawn(fut)', type: 'function', desc: 'Runs a future as an independent task; returns a JoinHandle. The future must be Send and static' },
    { name: 'tokio::join!(a, b)', type: 'function', desc: 'Runs several futures concurrently in the same task and waits for all of them' },
    { name: 'tokio::select! { ... }', type: 'function', desc: 'Waits on several futures and continues with the first to finish, dropping the rest' },
    { name: 'tokio::time::sleep(d)', type: 'function', desc: 'An async sleep that yields to the runtime instead of blocking the thread' },
    { name: 'tokio::task::spawn_blocking', type: 'function', desc: 'Runs blocking or CPU-heavy code on a separate pool so async tasks are not stalled' },
    { name: 'tokio::sync::mpsc', type: 'function', desc: 'Async multi-producer channels — send and recv are awaited rather than blocking' },
    { name: 'async move { ... }', type: 'syntax', desc: 'An async block that takes ownership of the variables it uses, usually needed for spawned tasks' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Futures and async fn',
      points: [
        'An <code>async fn</code> does not run when you call it. It returns a <code>Future</code>, a value describing work that has not happened yet. The work runs only when the future is awaited or polled by an executor.',
        'Futures are LAZY. Forgetting to write <code>.await</code> means the code simply never runs; the compiler warns you with an unused-Future message, but it is an easy mistake to make.',
        'Inside an async function, <code>.await</code> suspends the current task until the awaited future is ready, handing the thread back to the runtime so it can run other tasks in the meantime. You can only use await inside async functions and blocks.',
        'The compiler turns each async function into a state machine that remembers where it paused. There is no garbage collector and no separate stack per task, which is why async tasks are very cheap compared to operating-system threads.',
        'Async shines for I/O-bound work: thousands of connections spending most of their time waiting on the network. For CPU-bound work, ordinary threads or a parallel library are the better tool.',
      ]
    },
    {
      heading: 'The runtime — Rust ships none',
      points: [
        'The standard library defines the Future trait and the async and await syntax, but it does NOT include an executor to run futures. You must add a runtime crate yourself.',
        '<strong>Tokio</strong> is the de-facto standard runtime. Add it with something like <code>tokio = { version = "1", features = ["full"] }</code> in Cargo.toml. Other runtimes, such as smol, exist, but most of the ecosystem (Axum, reqwest, sqlx) is built around Tokio.',
        'The <code>#[tokio::main]</code> attribute wraps an <code>async fn main</code> so that it creates the runtime and blocks on your future. By default Tokio uses a multi-threaded, work-stealing scheduler that spreads tasks across worker threads.',
        'A TASK is a future that has been handed to the runtime with <code>tokio::spawn</code>. Tasks are lightweight, so spawning tens of thousands of them is normal.',
        'Libraries that perform I/O usually depend on a specific runtime, so pick one early and use its timers, channels and I/O types consistently throughout your program.',
      ]
    },
    {
      heading: 'Running things concurrently',
      points: [
        'Awaiting two futures one after the other runs them SEQUENTIALLY: <code>let a = f().await; let b = g().await;</code> takes the sum of both times, even though each await yields to the runtime.',
        '<code>tokio::join!(a, b)</code> polls several futures concurrently inside the current task and finishes when all are done, so the total time is roughly the slowest one, not the sum.',
        '<code>tokio::spawn</code> starts an independent task, which may run on a different worker thread. It returns a JoinHandle; awaiting the handle gives a Result that is an Err if the task panicked.',
        'A spawned future must be <code>Send</code> and <code>\'static</code>: it cannot borrow local variables, so use <code>async move</code> blocks and owned or Arc-wrapped data.',
        '<code>tokio::select!</code> waits on several futures and continues with whichever finishes first. The others are DROPPED, which cancels them at their most recent await point — a common way to implement timeouts and shutdown signals.',
      ]
    },
    {
      heading: 'Common pitfalls',
      points: [
        'Never block inside async code. A call like <code>std::thread::sleep</code>, a heavy computation or a synchronous file read occupies a runtime worker thread and stalls every task scheduled on it. Use <code>tokio::time::sleep</code> for waiting and <code>spawn_blocking</code> for unavoidable blocking work.',
        'Holding a <code>std::sync::MutexGuard</code> across an <code>.await</code> makes the future not Send, so <code>tokio::spawn</code> rejects it. Release the guard before awaiting, or use <code>tokio::sync::Mutex</code> when the lock genuinely has to be held across awaits.',
        'Dropping a future cancels it. Work after the last completed await never happens, so code that must not be interrupted halfway needs to be designed for cancellation, for example by spawning it as its own task.',
        'Using <code>.await</code> in a non-async function is error E0728. The usual fix is to make the caller async as well, which is why async tends to spread upward through a call chain.',
        'Compile errors from async code, especially about Send bounds, can be long. Read the note at the end of the message, which usually names the exact variable held across an await that is not Send.',
      ]
    },
    {
      heading: 'Channels, timeouts and async traits',
      points: [
        '<code>tokio::sync</code> provides async-aware tools: <code>mpsc</code> for many producers and one consumer, <code>oneshot</code> for a single reply, <code>broadcast</code> for fan-out, <code>watch</code> for the latest value, and an async <code>Mutex</code> and <code>RwLock</code>.',
        'An async channel\'s <code>send</code> and <code>recv</code> are awaited, and a bounded channel makes senders wait when it is full, giving natural backpressure. <code>recv</code> returns None once every sender has been dropped.',
        '<code>tokio::time::timeout(duration, future)</code> wraps any future and returns an Err if it does not complete in time, dropping the future so that it is cancelled.',
        'Async functions in traits have been stable since Rust 1.75, so you can now declare <code>async fn</code> directly in a trait without reaching for a helper crate, although there are still details around Send bounds for generic code.',
        'Next, the web framework topics build on everything here: an Axum handler is an async function, and every request runs as a task on the Tokio runtime.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'async fn & await',
      language: 'rust',
      code: `use std::time::Duration;
use tokio::time::sleep;

async fn fetch_user(id: u32) -> String {
    sleep(Duration::from_millis(100)).await; // pretend this is a network call
    format!("user-{id}")
}

#[tokio::main]
async fn main() {
    // Calling an async fn does NOTHING yet: it only builds a future
    let future = fetch_user(1);
    println!("future created, nothing has run");

    let user = future.await; // NOW it runs
    println!("{user}");

    // Two awaits in a row are sequential: about 200ms in total
    let a = fetch_user(2).await;
    let b = fetch_user(3).await;
    println!("{a} {b}");

    // Forgetting .await is a silent bug (the compiler only warns):
    //   fetch_user(4);
    //   warning: unused implementer of Future that must be used
}`
    },
    {
      label: 'join!, spawn, select!',
      language: 'rust',
      code: `use std::time::Duration;
use tokio::time::sleep;

async fn work(name: &str, ms: u64) -> String {
    sleep(Duration::from_millis(ms)).await;
    format!("{name} done after {ms}ms")
}

#[tokio::main]
async fn main() {
    // join!: run concurrently and wait for ALL — about 200ms, not 300ms
    let (a, b) = tokio::join!(work("a", 100), work("b", 200));
    println!("{a}");
    println!("{b}");

    // spawn: independent tasks that may run on other worker threads
    let handles: Vec<_> = (1..=3)
        .map(|i| tokio::spawn(async move { work("task", i * 50).await }))
        .collect();
    for handle in handles {
        // a JoinHandle resolves to a Result (Err if the task panicked)
        println!("{}", handle.await.unwrap());
    }

    // select!: the first future to finish wins, the other is dropped
    tokio::select! {
        r = work("fast", 50) => println!("{r}"),
        r = work("slow", 500) => println!("{r}"),
    }
}`
    },
    {
      label: 'Blocking Pitfalls',
      language: 'rust',
      code: `use std::time::Duration;

#[tokio::main]
async fn main() {
    // BAD: blocks a runtime worker thread, stalling every task scheduled on it
    // std::thread::sleep(Duration::from_secs(1));

    // GOOD: yields to the runtime while waiting
    tokio::time::sleep(Duration::from_secs(1)).await;

    // CPU-heavy or blocking-library work belongs on the blocking pool
    let total = tokio::task::spawn_blocking(|| {
        (1..=5_000_000u64).sum::<u64>()
    })
    .await
    .unwrap();
    println!("{total}"); // 12500002500000

    // Holding a std MutexGuard across an .await makes the future not Send:
    //   tokio::spawn(async {
    //       let guard = std_mutex.lock().unwrap();
    //       tokio::time::sleep(Duration::from_millis(10)).await;
    //   });
    //   error: future cannot be sent between threads safely
}`
    },
    {
      label: 'Shared State & Channels',
      language: 'rust',
      code: `use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};

#[tokio::main]
async fn main() {
    // tokio::sync::Mutex may be held across .await points
    let counter = Arc::new(Mutex::new(0u32));
    let mut handles = Vec::new();

    for _ in 0..5 {
        let counter = Arc::clone(&counter);
        handles.push(tokio::spawn(async move {
            let mut n = counter.lock().await; // .await, not .unwrap()
            *n += 1;
        }));
    }
    for handle in handles {
        handle.await.unwrap();
    }
    println!("count = {}", *counter.lock().await); // 5

    // A bounded async channel: senders wait when it is full
    let (tx, mut rx) = mpsc::channel::<String>(8);

    let producer = tokio::spawn(async move {
        for i in 0..3 {
            tx.send(format!("message {i}")).await.unwrap();
        }
        // tx is dropped here, which lets the receiver loop end
    });

    while let Some(msg) = rx.recv().await {
        println!("{msg}");
    }
    producer.await.unwrap();
}`
    },
    {
      label: 'Timeouts',
      language: 'rust',
      code: `// Cargo.toml:
//   tokio = { version = "1", features = ["full"] }

use std::time::Duration;
use tokio::time::{sleep, timeout};

#[tokio::main]
async fn main() {
    let slow = async {
        sleep(Duration::from_secs(5)).await;
        "finished"
    };

    // timeout wraps any future; if it is not done in time, it is dropped
    match timeout(Duration::from_millis(200), slow).await {
        Ok(value) => println!("{value}"),
        Err(_) => println!("timed out"), // this branch runs
    }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting .await, so the work never runs',
      wrong: `async fn save(data: &str) { /* write to a database */ }

async fn handler() {
    save("hello");
    // warning: unused implementer of Future that must be used
    // nothing was saved: the future was created and thrown away
}`,
      right: `async fn handler() {
    save("hello").await;
}`,
      explanation: 'Calling an async function only builds a future, and futures are lazy. Nothing happens until it is awaited (or spawned). Treat the unused-future warning as an error.'
    },
    {
      title: 'Awaiting independent operations one after another',
      wrong: `let user = fetch_user(1).await;    // 100ms
let orders = fetch_orders(1).await; // 100ms
// total: about 200ms, although the two calls do not depend on each other`,
      right: `let (user, orders) = tokio::join!(fetch_user(1), fetch_orders(1));
// total: about 100ms`,
      explanation: 'A sequence of awaits is sequential. When the operations are independent, join! (or spawning tasks) lets them overlap so total time is close to the slowest one instead of the sum.'
    },
    {
      title: 'Blocking the runtime with synchronous code',
      wrong: `async fn handler() {
    std::thread::sleep(std::time::Duration::from_secs(2));
    let text = std::fs::read_to_string("big.txt").unwrap();
    // every other task on this worker thread is frozen meanwhile
}`,
      right: `async fn handler() {
    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
    let text = tokio::fs::read_to_string("big.txt").await.unwrap();
    // or: tokio::task::spawn_blocking(|| heavy_sync_work()).await
}`,
      explanation: 'Async tasks share a small number of worker threads. A blocking call holds a thread hostage and stops all its tasks, which shows up as mysterious latency spikes. Use the async equivalents, or spawn_blocking for code you cannot change.'
    },
    {
      title: 'Holding a std Mutex guard across an await',
      wrong: `let shared = Arc::new(std::sync::Mutex::new(0));
tokio::spawn(async move {
    let mut n = shared.lock().unwrap();
    *n += 1;
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
});
// error: future cannot be sent between threads safely
// the MutexGuard is held across an await point`,
      right: `tokio::spawn(async move {
    {
        let mut n = shared.lock().unwrap();
        *n += 1;
    } // guard dropped before the await
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
});`,
      explanation: 'A std MutexGuard is not Send, and a future that holds one across an await is not Send either, so tokio::spawn refuses it. Shorten the guard\'s scope so it ends before the await, or use tokio::sync::Mutex if the lock must span the await.'
    },
    {
      title: 'Using await in a function that is not async',
      wrong: `fn load() -> String {
    fetch_user(1).await
}
// error[E0728]: await is only allowed inside async functions and blocks`,
      right: `async fn load() -> String {
    fetch_user(1).await
}`,
      explanation: 'Await needs somewhere to suspend to. Make the function async (and its callers await it), or block on the future at the very top of your program with a runtime such as #[tokio::main].'
    },
    {
      title: 'Spawning a task that borrows a local variable',
      wrong: `let name = String::from("ana");
tokio::spawn(async {
    println!("{name}");
});
// error[E0373]: async block may outlive the current function, but it borrows name`,
      right: `let name = String::from("ana");
tokio::spawn(async move {
    println!("{name}");
});`,
      explanation: 'A spawned task can run after the current function returns, so its future must own everything it uses. Add move to transfer ownership, or wrap shared data in an Arc.'
    },
  ];

  challenge: Challenge = {
    title: 'Concurrent Fetch',
    language: 'rust',
    description: `Write \`async fn fetch_all(ids: Vec<u32>) -> Vec<String>\` that fetches every id CONCURRENTLY and returns the results in the same order as the input.

You are given a simulated fetch:

\`\`\`
async fn fetch(id: u32) -> String {
    tokio::time::sleep(Duration::from_millis(id as u64 * 10)).await;
    format!("item-{id}")
}
\`\`\`

Rules:
- Start all the fetches at once so the total time is about the SLOWEST fetch, not the sum of all of them.
- The output order must match the input order, regardless of which fetch finishes first.

Example:
\`\`\`
fetch_all(vec![3, 1, 2]).await   // ["item-3", "item-1", "item-2"]
// takes roughly 30ms, not 60ms
\`\`\``,
    hints: [
      'Map each id to tokio::spawn(fetch(id)) and collect the JoinHandles into a Vec BEFORE awaiting any of them.',
      'Awaiting a JoinHandle gives a Result, so call unwrap() on it.',
      'Then await the handles in order, pushing each result into the output Vec, which preserves the input order.',
      'The future passed to spawn owns everything it needs, because fetch takes its argument by value.',
    ],
    starterCode: `use std::time::{Duration, Instant};

async fn fetch(id: u32) -> String {
    tokio::time::sleep(Duration::from_millis(id as u64 * 10)).await;
    format!("item-{id}")
}

async fn fetch_all(ids: Vec<u32>) -> Vec<String> {
    // TODO: start every fetch first, then collect the results in order
    Vec::new()
}

#[tokio::main]
async fn main() {
    let start = Instant::now();
    let out = fetch_all(vec![3, 1, 2]).await;
    println!("{:?}", out); // ["item-3", "item-1", "item-2"]
    println!("concurrent: {}", start.elapsed() < Duration::from_millis(55));
}`,
    solution: `use std::time::{Duration, Instant};

async fn fetch(id: u32) -> String {
    tokio::time::sleep(Duration::from_millis(id as u64 * 10)).await;
    format!("item-{id}")
}

async fn fetch_all(ids: Vec<u32>) -> Vec<String> {
    // Start every fetch before awaiting any of them
    let handles: Vec<_> = ids
        .into_iter()
        .map(|id| tokio::spawn(fetch(id)))
        .collect();

    // Awaiting in order keeps the results in input order
    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await.unwrap());
    }
    results
}

#[tokio::main]
async fn main() {
    let start = Instant::now();
    let out = fetch_all(vec![3, 1, 2]).await;
    println!("{:?}", out); // ["item-3", "item-1", "item-2"]
    println!("concurrent: {}", start.elapsed() < Duration::from_millis(55)); // true
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens when you call an async fn but never await or spawn the result?',
      options: [
        'It runs in the background automatically',
        'Nothing runs: the future is lazy, and the compiler only warns about the unused future',
        'It runs once on the main thread',
        'It panics',
      ],
      answer: 1,
      explanation: 'An async function returns a future that does nothing until it is polled by an executor. Dropping it without awaiting means the work is never performed.'
    },
    {
      q: 'Why does Rust code need a crate like Tokio to use async?',
      options: [
        'Because Tokio provides the await keyword',
        'Because threads are not available otherwise',
        'Because async is not part of the language',
        'Because the standard library defines futures and the syntax but ships no executor to run them',
      ],
      answer: 3,
      explanation: 'The language provides async, await and the Future trait. Running futures requires an executor and I/O drivers, which the ecosystem provides through runtimes such as Tokio.'
    },
    {
      q: 'What is the difference between two sequential awaits and tokio::join!?',
      options: [
        'join! runs the futures concurrently, so the total time is about the slowest one, not the sum',
        'join! runs them on separate operating system threads always',
        'Sequential awaits run concurrently',
        'There is no difference',
      ],
      answer: 0,
      explanation: 'await on one future finishes it before the next line starts. join! drives several futures at once within the same task, so their waiting overlaps.'
    },
    {
      q: 'Why is std::thread::sleep a problem inside an async function?',
      options: [
        'It cancels the runtime',
        'It does not compile',
        'It blocks the worker thread, stalling every other task scheduled on it',
        'It sleeps for twice as long',
      ],
      answer: 2,
      explanation: 'Async runtimes multiplex many tasks onto a few threads. A blocking call keeps its thread busy and prevents those tasks from making progress. Use tokio::time::sleep, or spawn_blocking for work that must block.'
    },
    {
      q: 'What does dropping a future do?',
      options: [
        'Runs it to completion',
        'Moves it to another thread',
        'Nothing at all',
        'Cancels it: work after its last completed await never happens',
      ],
      answer: 3,
      explanation: 'Futures make progress only while being polled. Dropping one, as select! does with the losing branches, stops it at the most recent await point.'
    },
    {
      q: 'Why does tokio::spawn typically require an async move block?',
      options: [
        'A spawned task may outlive the current function, so its future must own its data rather than borrow locals',
        'Spawn only accepts numbers',
        'It is optional and has no effect',
        'move makes the code faster',
      ],
      answer: 0,
      explanation: 'The future given to spawn must be static and Send, so it cannot hold references to local variables. Moving owned data (or an Arc) into the block satisfies that.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How is async different from threads?',
      a: 'A thread is an operating-system resource with its own stack, scheduled preemptively by the OS. An async task is a state machine scheduled cooperatively by a runtime: it only yields at await points. Tasks are far cheaper, so you can run vast numbers of them, but they are suited to I/O-bound work; long CPU-bound computation should use threads or spawn_blocking.'
    },
    {
      q: 'Do I always need Tokio?',
      a: 'You need some runtime to run futures, and Tokio is the most widely used, with the largest ecosystem, including Axum, reqwest, sqlx and tonic. Other runtimes such as smol exist and can be a good fit for smaller or specialised programs. Mixing runtimes in one program is possible but awkward, so choose one and stay with it.'
    },
    {
      q: 'What is the difference between tokio::spawn and tokio::join!?',
      a: 'join! runs several futures concurrently within the SAME task and waits for them all, and the futures may borrow local data. spawn creates a separate task that the scheduler can move to another worker thread and that keeps running even if you never await its handle, but it must own its data and be Send. Use join! for a fixed set of related operations and spawn for independent work.'
    },
    {
      q: 'What does it mean for a future to be Send?',
      a: 'The future, including every value it holds across an await, can be moved to another thread. Tokio\'s default runtime moves tasks between workers, so spawn requires Send. A value such as an Rc, or a std MutexGuard held across an await, makes the future not Send. The compiler error names the offending variable.'
    },
    {
      q: 'What is cancellation safety?',
      a: 'Because dropping a future cancels it at its last await point, an operation interrupted halfway may leave state inconsistent, for example after reading part of a message from a stream. A cancellation-safe operation can be dropped and retried without losing data. The Tokio documentation states which methods are cancellation safe, and this matters most inside select!.'
    },
    {
      q: 'How do I call async code from ordinary blocking code?',
      a: 'Create a runtime and block on the future: tokio::runtime::Runtime::new().unwrap().block_on(my_async_fn()). The #[tokio::main] macro does exactly this for main. Avoid calling block_on from inside an async context, because it can deadlock or panic; use spawn_blocking to go the other way.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'An async fn returns a lazy future; a runtime such as Tokio polls it, .await yields while waiting, and spawn, join! and select! control how tasks run concurrently.',
    mustKnow: [
      'Futures are lazy: nothing runs until you <code>.await</code> or spawn them',
      'Rust ships no runtime; Tokio is the de-facto standard, started with <code>#[tokio::main]</code>',
      'Sequential awaits are sequential; <code>tokio::join!</code> overlaps independent work',
      '<code>tokio::spawn</code> needs a Send, static future — use <code>async move</code> and owned or Arc data',
      'Never block the runtime: use <code>tokio::time::sleep</code>, async I/O, or <code>spawn_blocking</code>',
      'A std MutexGuard held across an await makes the future not Send',
      'Dropping a future cancels it; <code>select!</code> drops the losers',
    ],
    interviewFocus: [
      'Explain why async functions are lazy and what actually runs them',
      'When would you choose async over threads, and when the reverse?',
      'What is the difference between join! and spawn?',
      'Why is blocking inside an async function harmful, and how do you avoid it?',
      'What does it mean for a future to be Send, and what commonly breaks it?',
    ],
  };
}
