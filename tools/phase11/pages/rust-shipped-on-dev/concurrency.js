module.exports = {
  slug: 'concurrency-threads',
  subtitle: 'Fearless concurrency with OS threads: spawning and scoped threads, sharing state with Arc<Mutex<T>> and atomics, passing messages through channels, and the Send and Sync traits that make data races a compile error.',
  readingTime: 26,
  prerequisites: [{ label: 'Smart Pointers', route: '/rust/smart-pointers' }, { label: 'Lifetimes', route: '/rust/lifetimes' }],
  apis: ['thread::spawn / join', 'thread::scope', 'Arc<Mutex<T>>', 'RwLock<T>', 'mpsc::channel', 'AtomicUsize', 'Send / Sync'],
  tip: 'Keep lock scopes tiny: copy or compute what you need while holding the MutexGuard, then drop it before doing I/O or calling other code that might take another lock. Most deadlocks and contention problems start with a guard held for too long.',
  gotchas: [
    'Rust prevents data races, not deadlocks or race conditions in your logic — two locks taken in different orders can still deadlock.',
    'If a thread panics while holding a Mutex, the mutex becomes poisoned and later lock() calls return Err.',
    'A channel receiver loop ends only when every Sender is dropped — keep a stray clone alive and recv() blocks forever.',
  ],
  quickRef: [
    { name: 'thread::spawn(move || ...)', type: 'function', desc: 'Start an OS thread; the closure must be Send + \'static' },
    { name: 'handle.join()', type: 'method', desc: 'Wait for a thread; returns Err if the thread panicked' },
    { name: 'thread::scope(|s| { s.spawn(..); })', type: 'function', desc: 'Threads that may borrow local data; all are joined before scope returns' },
    { name: 'Arc<Mutex<T>>', type: 'type', desc: 'Shared ownership + exclusive access across threads' },
    { name: 'm.lock().unwrap()', type: 'method', desc: 'Block until the lock is free; returns a guard that unlocks on drop' },
    { name: 'RwLock<T>', type: 'type', desc: 'Many readers or one writer — good for read-mostly data' },
    { name: 'mpsc::channel() / sync_channel(n)', type: 'function', desc: 'Unbounded / bounded multi-producer, single-consumer channel' },
    { name: 'AtomicU64::fetch_add(1, Ordering::Relaxed)', type: 'method', desc: 'Lock-free counter update' },
    { name: 'Send / Sync', type: 'interface', desc: 'Send: may move to another thread. Sync: &T may be shared between threads' },
  ],
  theory: [
    { heading: 'Threads', points: [
      '`std::thread::spawn` starts an operating-system thread and returns a `JoinHandle`. `join()` waits for it and returns the closure\'s result, or `Err` if the thread panicked.',
      'The closure must be `\'static` because the thread can outlive the caller, so it typically uses `move` to take ownership of the data it needs.',
      'Scoped threads (`thread::scope`, Rust 1.63+) are joined automatically before `scope` returns, which lets them borrow local variables — no `Arc` or cloning needed for fork-join work.',
      'When the main thread returns, the process exits and other threads are killed without finishing. Join the handles you care about.',
      'For data parallelism over collections, the `rayon` crate turns `iter()` into `par_iter()` with a work-stealing thread pool.',
    ] },
    { heading: 'Sharing state', points: [
      '`Mutex<T>` wraps the data it protects: the only way to reach the `T` is `lock()`, which returns a `MutexGuard` that unlocks when dropped. You cannot forget to lock.',
      'To share a mutex between threads, wrap it in `Arc`: `Arc<Mutex<T>>`. Each thread gets its own `Arc::clone`.',
      'If a thread panics while holding the lock, the mutex is poisoned and future `lock()` calls return `Err(PoisonError)`; `into_inner()` on the error still gives access when the data is known to be consistent.',
      '`RwLock<T>` allows many concurrent readers or one writer; it helps for read-heavy data but has more overhead per operation than a `Mutex`.',
      'Atomics (`AtomicBool`, `AtomicUsize`, `AtomicU64`...) support lock-free counters and flags. `Ordering::Relaxed` is enough for a standalone counter; use `Acquire`/`Release` or `SeqCst` when the atomic guards other data.',
    ] },
    { heading: 'Message passing', points: [
      '"Do not communicate by sharing memory; share memory by communicating." `mpsc::channel()` returns a `Sender` and a `Receiver`; values are moved through the channel, so ownership transfers with the message.',
      '`Sender` can be cloned for multiple producers; there is a single consumer. `recv()` blocks until a message arrives or all senders are dropped (then it returns `Err`); `try_recv()` and `recv_timeout()` do not block indefinitely.',
      'Iterating `for msg in rx` ends cleanly once every sender is gone — drop the original sender after cloning it for workers.',
      '`sync_channel(n)` is bounded: `send` blocks when the buffer is full, which provides back-pressure on fast producers. `sync_channel(0)` is a rendezvous channel.',
      'Crates such as `crossbeam-channel` and `flume` add multi-consumer channels and `select!`.',
    ] },
    { heading: 'Send, Sync and what the compiler guarantees', points: [
      '`Send` means a value can be moved to another thread; `Sync` means `&T` can be shared between threads. Both are auto traits: a struct is `Send`/`Sync` when all its fields are.',
      '`Rc<T>` and `RefCell<T>` are not `Sync` (and `Rc` is not `Send`), so trying to use them across threads is a compile error. `Arc<Mutex<T>>` is the thread-safe counterpart.',
      'Together with ownership, these traits make data races impossible in safe Rust: you cannot get two threads holding `&mut` to the same data, or one writing while another reads without synchronisation.',
      'They do not prevent deadlocks (lock A then B in one thread, B then A in another), livelocks or logical race conditions. Use a consistent lock order and hold locks briefly.',
    ] },
  ],
  codeTabs: [
    { label: 'Spawn, join, scope', language: 'rust', code: `use std::thread;

fn main() {
    // Owned data moves into each thread
    let handles: Vec<_> = (1..=3)
        .map(|id| thread::spawn(move || {
            let sum: u64 = (1..=id * 1000).sum();
            (id, sum)
        }))
        .collect();
    for h in handles {
        let (id, sum) = h.join().expect("worker panicked");
        println!("worker {id}: {sum}");
    }

    // A panicking thread surfaces as Err from join
    let bad = thread::spawn(|| panic!("boom"));   // panic message goes to stderr
    println!("join ok? {}", bad.join().is_ok());

    // Scoped threads can borrow the stack: no Arc, no clone
    let words = vec!["alpha", "beta", "gamma", "delta"];
    let (left, right) = words.split_at(2);
    let total = thread::scope(|s| {
        let a = s.spawn(|| left.iter().map(|w| w.len()).sum::<usize>());
        let b = s.spawn(|| right.iter().map(|w| w.len()).sum::<usize>());
        a.join().unwrap() + b.join().unwrap()
    });
    println!("total letters: {total}, words still usable: {}", words.len());
}` },
    { label: 'Arc<Mutex> & atomics', language: 'rust', code: `use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, RwLock};
use std::thread;

fn main() {
    let hits = Arc::new(AtomicU64::new(0));
    let per_path = Arc::new(Mutex::new(HashMap::<String, u32>::new()));
    let config = Arc::new(RwLock::new(String::from("v1")));

    let mut handles = vec![];
    for i in 0..8 {
        let (hits, per_path, config) = (Arc::clone(&hits), Arc::clone(&per_path), Arc::clone(&config));
        handles.push(thread::spawn(move || {
            hits.fetch_add(1, Ordering::Relaxed);           // lock-free
            let path = format!("/page/{}", i % 3);
            {
                let mut map = per_path.lock().unwrap();      // guard
                *map.entry(path).or_insert(0) += 1;
            }                                                // unlocked here
            let version = config.read().unwrap().clone();    // many readers OK
            version
        }));
    }
    for h in handles { h.join().unwrap(); }

    *config.write().unwrap() = "v2".into();                  // one writer
    let map = per_path.lock().unwrap();
    let mut keys: Vec<_> = map.iter().collect();
    keys.sort();
    println!("hits={} {:?} config={}", hits.load(Ordering::Relaxed), keys, config.read().unwrap());
}` },
    { label: 'Channels', language: 'rust', code: `use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel::<(usize, String)>();

    for worker in 0..3 {
        let tx = tx.clone();                    // one Sender per producer
        thread::spawn(move || {
            for job in 0..2 {
                tx.send((worker, format!("job {job}"))).unwrap();
                thread::sleep(Duration::from_millis(5));
            }
        });                                     // this clone dropped at thread end
    }
    drop(tx);                                   // drop the original, or the loop never ends

    let mut results: Vec<_> = rx.into_iter().collect(); // ends when all senders are gone
    results.sort();
    println!("{} messages: {:?}", results.len(), &results[..2]);

    // Bounded channel: send blocks when full -> back-pressure
    let (btx, brx) = mpsc::sync_channel::<u32>(1);
    let producer = thread::spawn(move || {
        for n in 0..3 { btx.send(n).unwrap(); }
    });
    thread::sleep(Duration::from_millis(20));
    let got: Vec<u32> = brx.iter().collect();
    producer.join().unwrap();
    println!("{got:?}");
}` },
  ],
  mistakes: [
    { title: 'Sharing a Vec between threads without synchronisation', checkWrong: true, wrapFn: true, wrong: `let mut data = vec![1, 2, 3];
let h = std::thread::spawn(move || data.push(4));
data.push(5);
h.join().unwrap();`, right: `use std::sync::{Arc, Mutex};
let data = Arc::new(Mutex::new(vec![1, 2, 3]));
let d = Arc::clone(&data);
let h = std::thread::spawn(move || d.lock().unwrap().push(4));
data.lock().unwrap().push(5);
h.join().unwrap();`, explanation: 'The vector was moved into the thread, so the main thread cannot use it (E0382). The compiler is preventing a data race; share it explicitly with Arc<Mutex<T>>.' },
    { title: 'Holding a lock across slow work', wrong: `let mut cache = cache.lock().unwrap();
let value = fetch_from_network(key);   // other threads blocked meanwhile
cache.insert(key, value);`, right: `let value = fetch_from_network(key);    // no lock held
cache.lock().unwrap().insert(key, value);`, explanation: 'The guard stays alive until the end of its scope, serialising every thread behind a network call. Do the slow work first, then take the lock only for the update.' },
    { title: 'Forgetting to drop the original Sender', wrong: `let (tx, rx) = mpsc::channel();
for _ in 0..4 { let tx = tx.clone(); thread::spawn(move || tx.send(1).unwrap()); }
for v in rx { println!("{v}"); }   // hangs forever after 4 messages`, right: `let (tx, rx) = mpsc::channel();
for _ in 0..4 { let tx = tx.clone(); thread::spawn(move || tx.send(1).unwrap()); }
drop(tx);
for v in rx { println!("{v}"); }   // ends after the last sender is dropped`, explanation: 'The receiver only knows the channel is finished when every Sender has been dropped. The original tx in main keeps it open.' },
    { title: 'Taking two locks in different orders', wrong: `// thread 1: let a = A.lock(); let b = B.lock();
// thread 2: let b = B.lock(); let a = A.lock();   // deadlock`, right: `// every thread: lock A first, then B
// or combine the data into one Mutex<(A, B)>`, explanation: 'Rust\'s guarantees do not cover deadlocks. Establish a global lock order, merge data protected by multiple locks, or use channels instead.' },
    { title: 'Using Rc<RefCell<T>> with threads', checkWrong: true, wrapFn: true, wrong: `let shared = std::rc::Rc::new(std::cell::RefCell::new(0));
let s = shared.clone();
std::thread::spawn(move || *s.borrow_mut() += 1);`, right: `let shared = std::sync::Arc::new(std::sync::Mutex::new(0));
let s = shared.clone();
std::thread::spawn(move || *s.lock().unwrap() += 1);`, explanation: 'Rc is not Send and RefCell is not Sync, so the compiler rejects this (E0277). Arc<Mutex<T>> is the thread-safe equivalent.' },
  ],
  challenge: {
    title: 'Parallel word counter',
    language: 'rust',
    description: 'Write count_words_parallel(lines: &[&str], workers: usize) -> HashMap<String, usize>. Split the lines into roughly equal chunks, count words in each chunk on its own scoped thread (each with a local HashMap, no locking in the hot loop), then merge the partial maps on the main thread. Verify the result equals a single-threaded count.',
    hints: ['lines.chunks(n) splits a slice; use n = (lines.len() + workers - 1) / workers and guard against 0.', 'thread::scope lets the threads borrow lines directly.', 'Merge with *total.entry(k).or_insert(0) += v.'],
    starterCode: `use std::collections::HashMap;
use std::thread;

fn count_words_parallel(lines: &[&str], workers: usize) -> HashMap<String, usize> {
    todo!()
}

fn main() {
    let lines = vec!["a b c", "a b", "c c a", "d"];
    println!("{:?}", count_words_parallel(&lines, 2));
}`,
    solution: `use std::collections::HashMap;
use std::thread;

fn count_chunk(lines: &[&str]) -> HashMap<String, usize> {
    let mut m = HashMap::new();
    for line in lines {
        for w in line.split_whitespace() {
            *m.entry(w.to_lowercase()).or_insert(0) += 1;
        }
    }
    m
}

fn count_words_parallel(lines: &[&str], workers: usize) -> HashMap<String, usize> {
    let workers = workers.max(1);
    let chunk = ((lines.len() + workers - 1) / workers).max(1);
    let partials: Vec<HashMap<String, usize>> = thread::scope(|s| {
        let handles: Vec<_> = lines.chunks(chunk).map(|c| s.spawn(move || count_chunk(c))).collect();
        handles.into_iter().map(|h| h.join().unwrap()).collect()
    });
    let mut total = HashMap::new();
    for part in partials {
        for (k, v) in part {
            *total.entry(k).or_insert(0) += v;
        }
    }
    total
}

fn main() {
    let lines = vec!["a b c", "a b", "c c a", "d", "B"];
    let par = count_words_parallel(&lines, 3);
    let seq = count_chunk(&lines);
    assert_eq!(par, seq);
    let mut sorted: Vec<_> = par.into_iter().collect();
    sorted.sort();
    println!("{sorted:?}"); // [("a", 3), ("b", 3), ("c", 3), ("d", 1)]
}`,
  },
  quiz: [
    { q: 'What does JoinHandle::join return if the thread panicked?', options: ['The panic message as a String', 'Err containing the panic payload', 'It panics in the caller immediately', 'Ok(())'], answer: 1, explanation: 'join returns thread::Result<T>; a panic in the spawned thread becomes an Err that the caller can inspect or propagate.' },
    { q: 'Why can scoped threads borrow local variables while thread::spawn cannot?', options: ['Scoped threads run on the same core', 'All scoped threads are guaranteed to be joined before scope returns, so the borrows cannot outlive the data', 'Scoped threads copy the data', 'They use Rc internally'], answer: 1, explanation: 'thread::scope proves the threads finish before the borrowed data goes away, so the \'static requirement is lifted.' },
    { q: 'When does `for msg in rx` stop iterating?', options: ['After one message', 'When the channel buffer is empty', 'When every Sender has been dropped', 'After a timeout'], answer: 2, explanation: 'The receiver iterator ends once the channel is disconnected, i.e. all senders are gone.' },
    { q: 'What does a poisoned Mutex indicate?', options: ['The lock was taken twice by the same thread', 'A thread panicked while holding the lock, so the data might be inconsistent', 'The Mutex was dropped', 'Too many threads are waiting'], answer: 1, explanation: 'Poisoning warns that a panic interrupted a critical section. lock() returns Err; you can still recover the guard with into_inner() if the data is known to be valid.' },
    { q: 'Which statement is true about Rust\'s concurrency guarantees?', options: ['Safe Rust prevents data races and deadlocks', 'Safe Rust prevents data races but not deadlocks', 'Safe Rust prevents neither', 'Only async Rust prevents data races'], answer: 1, explanation: 'Ownership plus Send/Sync rule out data races at compile time. Deadlocks and logical race conditions are still possible.' },
  ],
  qna: [
    { q: 'What do Send and Sync mean?', a: '`Send` means ownership of a value can be transferred to another thread. `Sync` means it is safe to share `&T` between threads (equivalently, `&T` is `Send`). Most types are both; exceptions include `Rc` (neither, its counter is not atomic), `RefCell` and `Cell` (`Send` but not `Sync`), and raw pointers. They are auto traits derived from a type\'s fields, and the compiler uses them to reject unsafe sharing at compile time.' },
    { q: 'How does Rust prevent data races at compile time?', a: 'A data race needs two threads accessing the same memory concurrently, at least one writing, without synchronisation. Ownership and borrowing already forbid having a `&mut` alongside any other reference. Moving data into a thread requires `Send`, sharing it requires `Sync`, and the standard thread-safe wrappers (`Mutex`, `RwLock`, atomics) are the only `Sync` way to mutate shared data. So any program that could race fails to compile.' },
    { q: 'Shared state or message passing — which should you choose?', a: 'Message passing (channels) works well for pipelines and worker pools where each piece of data has one owner at a time; it avoids lock contention and makes ownership flow obvious. Shared state (`Arc<Mutex<T>>`, `RwLock`, atomics) fits caches, counters and data many threads read or update. Many programs mix both: workers receive jobs over a channel and update a shared metrics counter with atomics.' },
    { q: 'What is the difference between Mutex and RwLock?', a: 'A `Mutex` gives one thread at a time exclusive access, for reads and writes alike. An `RwLock` allows any number of simultaneous readers or one writer. `RwLock` helps when reads are frequent, long and rarely interrupted by writes; for short critical sections a `Mutex` is often faster because it has less bookkeeping. Writer starvation behaviour depends on the platform implementation.' },
    { q: 'When would you use atomics instead of a Mutex?', a: 'For single values such as counters, flags and sequence numbers, atomics avoid locking entirely and never block. `fetch_add` with `Ordering::Relaxed` is enough when the counter does not protect other data. When an atomic is used to publish other data (a "ready" flag), use `Release` when storing and `Acquire` when loading so the other writes become visible. For anything involving several related values, a `Mutex` is simpler and less error-prone.' },
  ],
  revision: {
    oneLiner: 'Threads take owned data (or borrow inside thread::scope), share state through Arc<Mutex<T>>, RwLock or atomics, or pass messages over channels — and Send/Sync make data races a compile error.',
    mustKnow: [
      '`thread::spawn` needs `move` and `\'static`; `join` returns `Err` if the thread panicked.',
      '`thread::scope` allows borrowing and joins automatically.',
      '`Arc<Mutex<T>>`: the guard unlocks on drop; keep critical sections short.',
      'Mutexes are poisoned by a panic while locked.',
      'Channels end when all senders are dropped; `sync_channel(n)` gives back-pressure.',
      '`Send`/`Sync` prevent data races, not deadlocks.',
    ],
    interviewFocus: [
      'Explain Send and Sync with examples of types that are not.',
      'Explain how Rust prevents data races and what it does not prevent.',
      'Compare Mutex, RwLock, atomics and channels.',
    ],
  },
};
