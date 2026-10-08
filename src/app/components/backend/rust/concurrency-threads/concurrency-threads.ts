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
  selector: 'app-rust-concurrency-threads',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './concurrency-threads.html',
  styleUrl: './concurrency-threads.scss'
})
export class RustConcurrencyThreads {
  readingTime = 30;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Rust 2021+';
  route = 'rust-concurrency-threads';

  quickRef: QuickRefItem[] = [
    { name: 'thread::spawn(closure)', type: 'function', desc: 'Starts a new OS thread running the closure and returns a JoinHandle' },
    { name: 'handle.join()', type: 'method', desc: 'Waits for the thread to finish; returns Err if the thread panicked' },
    { name: 'move || { ... }', type: 'syntax', desc: 'A closure that takes ownership of the variables it uses — required to send data into a spawned thread' },
    { name: 'thread::scope(|s| { ... })', type: 'function', desc: 'Spawns threads that may borrow local data, all guaranteed to finish before the scope returns' },
    { name: 'mpsc::channel()', type: 'function', desc: 'Creates a multi-producer, single-consumer channel and returns a sender and a receiver' },
    { name: 'tx.send(v) / rx.recv()', type: 'method', desc: 'Send moves a value into the channel; recv blocks until a value arrives or every sender is gone' },
    { name: 'Mutex<T>', type: 'type', desc: 'Mutual exclusion — lock() gives one thread at a time exclusive access to the data inside' },
    { name: 'Arc<Mutex<T>>', type: 'type', desc: 'The standard pattern for shared, mutable state across threads' },
    { name: 'Send / Sync', type: 'interface', desc: 'Marker traits: Send means a value can move to another thread, Sync means a reference to it can be shared' },
    { name: 'AtomicUsize', type: 'type', desc: 'A lock-free integer with atomic operations such as fetch_add, for simple shared counters' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Spawning threads',
      points: [
        '<code>std::thread::spawn</code> starts a new operating-system thread running a closure and returns a <code>JoinHandle</code>. Rust threads map one-to-one onto OS threads, so they are real threads that run in parallel across cores.',
        'Call <code>join()</code> on the handle to wait for the thread and collect its return value. It returns a Result, and the Err case means the thread panicked. When main returns, the process ends and any threads still running are stopped.',
        'A spawned thread may outlive the function that created it, so its closure cannot borrow local variables. Use a <code>move</code> closure to transfer ownership into the thread; without it you get error E0373 (closure may outlive the current function).',
        'After a value has been moved into a thread it is gone from the original scope, which is the borrow checker preventing you from touching data another thread now owns.',
        '<code>thread::scope</code> (stable since Rust 1.63) is the alternative when threads only need to borrow local data. Every thread spawned inside the scope is guaranteed to finish before the scope ends, so borrowing is safe.',
      ]
    },
    {
      heading: 'Message passing with channels',
      points: [
        'A channel moves values between threads. <code>mpsc::channel()</code> returns a transmitter and a receiver; mpsc stands for multiple producer, single consumer, so you can clone the sender but there is only one receiver.',
        '<code>tx.send(value)</code> MOVES the value into the channel, so the sending thread can no longer use it. That is how Rust turns "do not share memory by mutating it from two places" into a compiler rule.',
        '<code>rx.recv()</code> blocks until a message arrives and returns an Err once every sender has been dropped. You can also iterate with <code>for msg in rx</code>, which ends automatically when all senders are gone; <code>try_recv</code> does not block.',
        'Clone the sender with <code>tx.clone()</code> for each producer thread, and drop the original sender before looping on the receiver, or the loop will wait forever for a message that can never come.',
        '<code>mpsc::sync_channel(n)</code> creates a bounded channel that makes senders wait when it is full, which is a simple way to apply backpressure.',
      ]
    },
    {
      heading: 'Shared state with Mutex and Arc',
      points: [
        '<code>Mutex&lt;T&gt;</code> guarantees only one thread accesses the data at a time. <code>lock()</code> blocks until it can hand you a guard, and the lock is released automatically when the guard goes out of scope — there is no separate unlock call to forget.',
        'To share a Mutex between threads you also need shared ownership, so the standard pattern is <code>Arc&lt;Mutex&lt;T&gt;&gt;</code>: Arc lets several threads own the Mutex, and the Mutex controls access to the data inside.',
        'Keep the guard alive for as short a time as possible. Holding it while doing slow work blocks every other thread, so wrap the locked section in its own block or drop the guard explicitly.',
        'If a thread panics while holding a lock, the Mutex becomes POISONED and later lock() calls return an Err. Most code simply unwraps, but you can recover the data with <code>into_inner()</code> on the error.',
        '<code>RwLock&lt;T&gt;</code> allows many simultaneous readers or one writer, which suits data that is read far more often than it is written. Rust does NOT prevent deadlocks: locking in inconsistent order can still hang your program.',
      ]
    },
    {
      heading: 'Send and Sync — compile-time data-race freedom',
      points: [
        '<code>Send</code> and <code>Sync</code> are marker traits that describe thread safety. A type is Send if ownership of it can be moved to another thread, and Sync if a shared reference to it can be used from several threads at once.',
        'The compiler implements them automatically for types built from Send and Sync parts, and refuses to compile code that would break the rules. Rc is not Send, and RefCell is not Sync, which is why neither can be shared across threads.',
        'This is why the standard tools fit together: <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> is both Send and Sync when T is Send, so it may cross threads, while an unsynchronised shared mutable value is rejected at compile time.',
        'The result is often called fearless concurrency: DATA RACES, where two threads access the same memory with at least one writing and no synchronisation, are impossible in safe Rust.',
        'Implementing Send or Sync by hand requires <code>unsafe</code> because you are promising the compiler something it cannot check. You almost never need to.',
      ]
    },
    {
      heading: 'Atomics, and what Rust does not prevent',
      points: [
        'For a single shared number, atomic types such as <code>AtomicUsize</code> avoid a lock entirely. <code>fetch_add(1, Ordering::SeqCst)</code> increments it safely from any thread; SeqCst is the simplest and safest memory ordering to start with.',
        'Rust prevents data races but not every concurrency bug. Deadlocks, race CONDITIONS in your program logic, and lost updates from a check-then-act sequence across two separate locks are all still possible.',
        'Choose the simplest tool that fits: channels when work flows from producers to consumers, <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> when several threads update shared state, atomics for counters and flags, and <code>thread::scope</code> when threads just borrow input.',
        'For data-parallel CPU work such as mapping over a large collection, the popular rayon crate provides parallel iterators with almost no code change. It is a third-party crate rather than part of the standard library.',
        'Threads suit CPU-bound work and blocking tasks. For handling many thousands of mostly-idle network connections, the async model in the next topic is usually a better fit.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Spawn & Join',
      language: 'rust',
      code: `use std::thread;
use std::time::Duration;

fn main() {
    // The output of the two loops interleaves differently from run to run
    let handle = thread::spawn(|| {
        for i in 1..=3 {
            println!("worker {i}");
            thread::sleep(Duration::from_millis(10));
        }
        42 // the closure's return value comes back through join
    });

    for i in 1..=2 {
        println!("main {i}");
        thread::sleep(Duration::from_millis(10));
    }

    let result = handle.join().unwrap();
    println!("worker returned {result}");

    // A move closure transfers ownership of v into the thread
    let v = vec![1, 2, 3];
    let h = thread::spawn(move || {
        println!("{:?}", v);
    });
    h.join().unwrap();
    // println!("{:?}", v); // error[E0382]: borrow of moved value: v
    // Without move: error[E0373]: closure may outlive the current function,
    //               but it borrows v

    // Scoped threads may borrow local data safely
    let data = vec![10, 20, 30];
    thread::scope(|s| {
        s.spawn(|| println!("scoped thread A sees {:?}", data));
        s.spawn(|| println!("scoped thread B sees length {}", data.len()));
    }); // both threads are guaranteed to be finished here
    println!("{:?}", data); // still usable
}`
    },
    {
      label: 'Channels',
      language: 'rust',
      code: `use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    let mut handles = Vec::new();

    for id in 0..3 {
        let tx = tx.clone(); // one sender per producer thread
        handles.push(thread::spawn(move || {
            tx.send(format!("hello from worker {id}")).unwrap();
        }));
    }

    // Drop the original sender, otherwise the loop below never ends
    drop(tx);

    // The loop ends when every sender has been dropped.
    // The arrival order of the messages varies between runs.
    for msg in rx {
        println!("{msg}");
    }

    for h in handles {
        h.join().unwrap();
    }

    // send moves the value, so it cannot be used afterwards:
    //   let s = String::from("x");
    //   tx.send(s).unwrap();
    //   println!("{s}");   // error[E0382]: borrow of moved value: s
}`
    },
    {
      label: 'Arc<Mutex<T>>',
      language: 'rust',
      code: `use std::sync::{Arc, Mutex, RwLock};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();

    for _ in 0..8 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                // the guard unlocks the mutex when it goes out of scope
                let mut n = counter.lock().unwrap();
                *n += 1;
            }
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
    println!("total = {}", *counter.lock().unwrap()); // 8000

    // RwLock: many readers OR one writer
    let config = RwLock::new(String::from("v1"));
    {
        let r1 = config.read().unwrap();
        let r2 = config.read().unwrap(); // several readers at once is fine
        println!("{r1} {r2}");
    }
    {
        let mut w = config.write().unwrap();
        w.push_str("-updated");
    }
    println!("{}", config.read().unwrap()); // v1-updated
}`
    },
    {
      label: 'Send & Sync',
      language: 'rust',
      code: `use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Rc is not Send: it cannot move to another thread
    //   let rc = std::rc::Rc::new(5);
    //   thread::spawn(move || println!("{rc}"));
    //   error[E0277]: Rc<i32> cannot be sent between threads safely

    // RefCell is Send but not Sync: a reference to it cannot be shared
    //   let cell = std::cell::RefCell::new(0);
    //   thread::scope(|s| { s.spawn(|| { *cell.borrow_mut() += 1; }); });
    //   error[E0277]: RefCell<i32> cannot be shared between threads safely

    // Arc<Mutex<T>> is both Send and Sync, so it is accepted
    let shared = Arc::new(Mutex::new(0));
    let for_thread = Arc::clone(&shared);

    thread::spawn(move || {
        *for_thread.lock().unwrap() += 1;
    })
    .join()
    .unwrap();

    println!("{}", shared.lock().unwrap()); // 1
}`
    },
    {
      label: 'Atomics & Poisoning',
      language: 'rust',
      code: `use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // A lock-free shared counter
    let hits = Arc::new(AtomicUsize::new(0));
    let handles: Vec<_> = (0..4)
        .map(|_| {
            let hits = Arc::clone(&hits);
            thread::spawn(move || {
                for _ in 0..500 {
                    hits.fetch_add(1, Ordering::SeqCst);
                }
            })
        })
        .collect();
    for h in handles {
        h.join().unwrap();
    }
    println!("{}", hits.load(Ordering::SeqCst)); // 2000

    // Poisoning: a thread panics while holding the lock
    let m = Arc::new(Mutex::new(0));
    let m2 = Arc::clone(&m);
    let _ = thread::spawn(move || {
        let _guard = m2.lock().unwrap();
        panic!("oops while holding the lock");
    })
    .join(); // Err, because the thread panicked

    match m.lock() {
        Ok(_) => println!("lock is fine"),
        Err(poisoned) => {
            println!("lock was poisoned");
            let value = poisoned.into_inner(); // recover the data anyway
            println!("value = {}", *value);
        }
    }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Spawning a thread whose closure borrows a local variable',
      wrong: `let v = vec![1, 2, 3];
let handle = std::thread::spawn(|| {
    println!("{:?}", v);
});
handle.join().unwrap();
// error[E0373]: closure may outlive the current function, but it borrows v`,
      right: `let v = vec![1, 2, 3];
let handle = std::thread::spawn(move || {
    println!("{:?}", v);
});
handle.join().unwrap();`,
      explanation: 'A spawned thread can outlive the function that created it, so it cannot hold a reference to a local variable. The move keyword hands ownership to the thread. If you only need to borrow, use thread::scope instead.'
    },
    {
      title: 'Using a value after sending it through a channel',
      wrong: `let (tx, rx) = std::sync::mpsc::channel();
let msg = String::from("hello");
tx.send(msg).unwrap();
println!("{msg}");
// error[E0382]: borrow of moved value: msg`,
      right: `let (tx, rx) = std::sync::mpsc::channel();
let msg = String::from("hello");
tx.send(msg.clone()).unwrap(); // send a copy if you still need it
println!("{msg}");`,
      explanation: 'A channel transfers ownership, so after the send the value belongs to the receiver. That is precisely what makes message passing safe: only one thread owns the data at any time.'
    },
    {
      title: 'Locking the same Mutex twice in one thread',
      wrong: `let m = Mutex::new(0);
let a = m.lock().unwrap();
let b = m.lock().unwrap(); // deadlock: waiting for a lock this thread already holds
println!("{a} {b}");`,
      right: `let m = Mutex::new(0);
{
    let mut a = m.lock().unwrap();
    *a += 1;
} // guard dropped, lock released
let b = m.lock().unwrap();
println!("{b}");`,
      explanation: 'A Mutex is not reentrant, so a thread that locks it a second time while still holding a guard will hang (or panic on some platforms). Rust prevents data races but NOT deadlocks, so scope your guards tightly and lock multiple mutexes in a consistent order.'
    },
    {
      title: 'Holding a lock guard across slow work',
      wrong: `let data = shared.lock().unwrap();
expensive_computation(&data);   // every other thread waits the whole time
send_over_network(&data);`,
      right: `let snapshot = {
    let data = shared.lock().unwrap();
    data.clone()
}; // lock released here
expensive_computation(&snapshot);
send_over_network(&snapshot);`,
      explanation: 'While a guard is alive, no other thread can take the lock. Copy out what you need inside a small block, let the guard drop, and then do the slow work with your own copy so the other threads keep making progress.'
    },
    {
      title: 'Forgetting to join a spawned thread',
      wrong: `std::thread::spawn(|| {
    println!("doing important work");
});
// main returns immediately; the thread may never get to print`,
      right: `let handle = std::thread::spawn(|| {
    println!("doing important work");
});
handle.join().unwrap(); // wait for it to finish`,
      explanation: 'When main returns, the process exits and all other threads are stopped mid-flight. Keep the JoinHandle and call join when the result or completion matters.'
    },
    {
      title: 'Trying to mutate through a bare Arc',
      wrong: `let counter = Arc::new(0);
let c = Arc::clone(&counter);
std::thread::spawn(move || {
    *c += 1;
});
// error[E0594]: cannot assign to data in an Arc`,
      right: `let counter = Arc::new(Mutex::new(0));
let c = Arc::clone(&counter);
std::thread::spawn(move || {
    *c.lock().unwrap() += 1;
});`,
      explanation: 'Arc provides shared ownership but only read access, since several threads mutating at once would be a data race. Put the value inside a Mutex (or RwLock, or use an atomic type) to get safe shared mutation.'
    },
  ];

  challenge: Challenge = {
    title: 'Parallel Sum',
    language: 'rust',
    description: `Write \`fn parallel_sum(data: &[u64], threads: usize) -> u64\` that adds up a slice using several threads.

Rules:
- Split \`data\` into chunks of size \`ceil(len / threads)\` and sum each chunk on its own thread.
- Add the partial sums together and return the total.
- If \`data\` is empty or \`threads\` is 0, return 0.
- The threads must borrow from \`data\` (no cloning the whole slice), so use \`std::thread::scope\`.

Example:
\`\`\`
let data: Vec<u64> = (1..=1000).collect();
parallel_sum(&data, 4)   // 500500
parallel_sum(&[], 4)     // 0
parallel_sum(&[5], 8)    // 5
\`\`\``,
    hints: [
      'thread::scope lets spawned threads borrow from the enclosing function, and joins them all before returning.',
      'The chunk size is (data.len() + threads - 1) / threads, which rounds up; then data.chunks(chunk_size) gives an iterator of slices.',
      'Inside the scope, map each chunk to s.spawn(move || chunk.iter().sum::<u64>()) and collect the handles into a Vec.',
      'Then join each handle with h.join().unwrap() and sum the results.',
    ],
    starterCode: `use std::thread;

fn parallel_sum(data: &[u64], threads: usize) -> u64 {
    // TODO: split into chunks, sum each chunk in a scoped thread, add the results
    0
}

fn main() {
    let data: Vec<u64> = (1..=1000).collect();
    println!("{}", parallel_sum(&data, 4)); // 500500
    println!("{}", parallel_sum(&[], 4));   // 0
    println!("{}", parallel_sum(&[5], 8));  // 5
}`,
    solution: `use std::thread;

fn parallel_sum(data: &[u64], threads: usize) -> u64 {
    if data.is_empty() || threads == 0 {
        return 0;
    }
    let chunk_size = (data.len() + threads - 1) / threads;

    thread::scope(|s| {
        let handles: Vec<_> = data
            .chunks(chunk_size)
            .map(|chunk| s.spawn(move || chunk.iter().sum::<u64>()))
            .collect();

        handles
            .into_iter()
            .map(|h| h.join().unwrap())
            .sum::<u64>()
    })
}

fn main() {
    let data: Vec<u64> = (1..=1000).collect();
    println!("{}", parallel_sum(&data, 4)); // 500500
    println!("{}", parallel_sum(&[], 4));   // 0
    println!("{}", parallel_sum(&[5], 8));  // 5
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why does thread::spawn(|| println!("{:?}", v)) fail to compile when v is a local Vec?',
      options: [
        'println cannot be used in threads',
        'The closure borrows v, but the thread may outlive the function, so it needs a move closure to take ownership',
        'Vec is not thread-safe',
        'Threads cannot print',
      ],
      answer: 1,
      explanation: 'A spawned thread can run longer than the function that created it, so it cannot hold a borrow of a local. The move keyword transfers ownership into the closure (error E0373 otherwise).'
    },
    {
      q: 'What does the ownership rule mean for tx.send(value)?',
      options: [
        'The value is shared by reference',
        'The value is dropped',
        'The value is copied, so the sender can keep using it',
        'The value is moved into the channel, so the sender can no longer use it',
      ],
      answer: 3,
      explanation: 'send takes ownership. After the call, the value belongs to whoever receives it, which prevents two threads from holding the same data at once.'
    },
    {
      q: 'Which type combination is the standard way to share mutable state across threads?',
      options: ['Rc<RefCell<T>>', 'Box<T>', 'Arc<Mutex<T>>', '&mut T'],
      answer: 2,
      explanation: 'Arc gives thread-safe shared ownership and Mutex provides exclusive access to the data inside. Rc and RefCell are not thread-safe, so the compiler rejects them across threads.'
    },
    {
      q: 'What guarantee does Rust give about concurrency in safe code?',
      options: [
        'Data races are impossible, though deadlocks and logic races still are possible',
        'All race conditions are impossible',
        'Threads always run in order',
        'Deadlocks are impossible',
      ],
      answer: 0,
      explanation: 'The Send and Sync rules eliminate data races at compile time. Deadlocks, lost updates from separate locks, and other logic-level races remain the programmer\'s responsibility.'
    },
    {
      q: 'What does it mean when a Mutex is poisoned?',
      options: [
        'It was created with the wrong type',
        'It has been locked for too long',
        'A thread panicked while holding the lock, so later lock() calls return an Err',
        'It contains invalid data',
      ],
      answer: 2,
      explanation: 'Poisoning is a signal that the protected data may be in an inconsistent state because a holder panicked. You can still recover the data with into_inner if you decide it is safe.'
    },
    {
      q: 'Why is Rc not allowed across threads?',
      options: [
        'It can only hold integers',
        'It cannot be cloned',
        'It is too slow',
        'Its reference counts are not atomic, so it is not Send',
      ],
      answer: 3,
      explanation: 'Rc updates its counts with ordinary, non-atomic operations, which would race if two threads cloned or dropped it at once. Arc uses atomic counts and is the thread-safe alternative.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Are Rust threads green threads?',
      a: 'No. Each std::thread is a real operating-system thread, scheduled by the OS across cores. That makes them good for CPU-bound work and blocking calls, but each thread has a stack and creation cost, so spawning hundreds of thousands is not practical. For massive numbers of concurrent I/O tasks, the async model is better suited.'
    },
    {
      q: 'What is the difference between Send and Sync?',
      a: 'Send means a value can be moved to another thread. Sync means a shared reference to the value can be used by several threads at once; formally a type is Sync when a reference to it is Send. For example RefCell is Send but not Sync, and Rc is neither.'
    },
    {
      q: 'Should I use channels or shared state?',
      a: 'Channels suit pipelines where work flows from producers to consumers, and they avoid shared mutable data altogether. Shared state with Arc and Mutex suits data that many threads must read and update, such as a cache or a counter. Many programs use both. Start with whichever makes ownership simplest to explain.'
    },
    {
      q: 'Does Rust prevent deadlocks?',
      a: 'No. Rust prevents data races, but a deadlock is a logic problem that the type system cannot see: two threads each waiting for a lock the other holds, or one thread locking the same Mutex twice. Avoid them by keeping lock scopes small, never holding one lock while waiting for another where possible, and always taking multiple locks in the same order.'
    },
    {
      q: 'When would I use an atomic instead of a Mutex?',
      a: 'For a single small value, such as a counter or a boolean flag, an atomic is simpler and faster because it needs no lock. As soon as you must keep several values consistent with each other, or update a larger structure, use a Mutex, because atomics protect individual operations, not groups of them.'
    },
    {
      q: 'What is thread::scope for?',
      a: 'It creates a scope in which spawned threads are allowed to borrow data from the surrounding function, because the scope waits for every thread to finish before it returns. That removes the need for Arc and move closures when you just want to fan work out over borrowed input, such as processing chunks of a slice.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Rust threads are real OS threads made safe by ownership: move closures hand data to threads, channels transfer values, Arc and Mutex share state, and Send and Sync rule out data races at compile time.',
    mustKnow: [
      '<code>thread::spawn</code> needs a <code>move</code> closure, and <code>join()</code> waits and returns a Result',
      '<code>thread::scope</code> allows threads to borrow local data and joins them all automatically',
      'Channels move values with <code>send</code>; the sender cannot use the value afterwards',
      '<code>Arc&lt;Mutex&lt;T&gt;&gt;</code> is the standard shared-mutable-state pattern; the guard unlocks on drop',
      'A panic while holding a Mutex poisons it; keep guards short-lived',
      'Rc is not Send and RefCell is not Sync, so the compiler stops unsafe sharing',
      'Rust prevents data races, not deadlocks or logic races',
    ],
    interviewFocus: [
      'Explain how Send and Sync let the compiler prevent data races',
      'What is the difference between message passing and shared state, and when do you use each?',
      'Why does a spawned thread need a move closure, and what does thread::scope change?',
      'Can Rust deadlock? How would you avoid it?',
      'When is an atomic type better than a Mutex?',
    ],
  };
}
