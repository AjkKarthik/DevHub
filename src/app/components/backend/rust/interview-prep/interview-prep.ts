import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-rust-interview-prep',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, QnaBlockComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss'
})
export class RustInterviewPrep {
  readingTime = 35;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = "Rust 2024";

  quickRef: QuickRefItem[] = [
    {
      "name": "Ownership",
      "type": "keyword",
      "desc": "One owner, moves on assignment, drop at end of scope"
    },
    {
      "name": "Borrowing",
      "type": "keyword",
      "desc": "Many &T or one &mut T; references never dangle"
    },
    {
      "name": "Lifetimes",
      "type": "keyword",
      "desc": "Compile-time relationships between reference validity"
    },
    {
      "name": "Traits",
      "type": "interface",
      "desc": "Shared behaviour; static (generics) or dynamic (dyn) dispatch"
    },
    {
      "name": "Result / Option / ?",
      "type": "type",
      "desc": "Errors and absence as values, propagated with ?"
    },
    {
      "name": "Send / Sync",
      "type": "interface",
      "desc": "Marker traits that make data races a compile error"
    },
    {
      "name": "Future / async / await",
      "type": "keyword",
      "desc": "Lazy state machines driven by an executor such as Tokio"
    },
    {
      "name": "unsafe",
      "type": "keyword",
      "desc": "Raw pointers, FFI, unsafe fns, mutable statics, unsafe trait impls"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "How to use this page",
      "points": [
        "Questions are grouped from fundamentals to advanced. Read the answer, then say it in your own words with an example — interviewers probe with \"why?\" and \"show me\".",
        "Common follow-ups: write the code that triggers the error you described, explain the fix, and name the cost of the alternative (runtime check, allocation, indirection).",
        "For system-design style questions, pair Rust specifics (ownership of shared state, error types, async runtime choice) with ordinary engineering concerns (observability, testing, deployment)."
      ]
    },
    {
      "heading": "Topics interviewers weight most",
      "points": [
        "Ownership, borrowing and lifetimes — nearly every Rust interview opens here.",
        "Traits, generics, <code>impl Trait</code> vs <code>dyn Trait</code>, and the orphan rule.",
        "Error handling design: <code>Result</code>, <code>?</code>, <code>thiserror</code> vs <code>anyhow</code>, and when panicking is acceptable.",
        "Smart pointers and interior mutability, then <code>Send</code>/<code>Sync</code>, <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> and async with Tokio.",
        "Practical engineering: Cargo workspaces, testing strategy, performance (clones, allocations), and when <code>unsafe</code> is justified."
      ]
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "Ownership: why does Rust not need a garbage collector?",
      "a": "Every value has exactly one owner, and the compiler inserts the <code>drop</code> call where the owner goes out of scope. Moves transfer ownership instead of copying pointers, and the borrow checker guarantees references never outlive their data. Memory is therefore freed deterministically at compile-time-known points, with no runtime tracing, while still preventing use-after-free and double free."
    },
    {
      "q": "Ownership: what is the difference between a move, a copy and a clone?",
      "a": "A move transfers ownership with a bitwise copy of the stack part and invalidates the source (the default for types like <code>String</code> and <code>Vec</code>). A copy happens implicitly for types that implement <code>Copy</code> (integers, <code>bool</code>, <code>char</code>, <code>&amp;T</code>), leaving the source usable. A clone is an explicit, possibly expensive deep copy via <code>Clone::clone</code>, e.g. allocating a new heap buffer for a <code>String</code>."
    },
    {
      "q": "Borrowing: state the borrowing rules and the bug they prevent.",
      "a": "At any time a value may have either any number of shared references <code>&amp;T</code> or exactly one mutable reference <code>&amp;mut T</code>, and references must always be valid. This \"aliasing XOR mutation\" rule prevents data races, iterator invalidation (pushing into a <code>Vec</code> while iterating it) and use-after-free, all at compile time."
    },
    {
      "q": "Borrowing: what are non-lexical lifetimes?",
      "a": "Since the 2018 edition, a borrow lasts until its last use rather than until the end of its lexical scope. Code that takes <code>&amp;v[0]</code>, uses it, and then calls <code>v.push(1)</code> compiles, because the shared borrow has already ended. Older compilers rejected such code."
    },
    {
      "q": "Borrowing: why is it fine to take &mut to two different struct fields but not to two elements of a Vec via indexing?",
      "a": "The borrow checker understands disjoint field borrows (<code>&amp;mut s.a</code> and <code>&amp;mut s.b</code>) because fields are statically distinct. Indexing goes through <code>IndexMut::index_mut(&amp;mut self, i)</code>, which borrows the whole vector, so two indexed mutable borrows conflict. Use <code>split_at_mut</code>, <code>get_disjoint_mut</code> or iterators to borrow disjoint elements."
    },
    {
      "q": "Lifetimes: what does fn longest<'a>(x: &'a str, y: &'a str) -> &'a str actually promise?",
      "a": "That the returned reference is valid for at most the shorter of the two input lifetimes. The annotation does not change how long anything lives; it lets the compiler check at each call site that the result is not used after either input is gone."
    },
    {
      "q": "Lifetimes: what are the elision rules?",
      "a": "Each elided input reference gets its own lifetime; if there is exactly one input lifetime it is assigned to all output references; and if there is a <code>&amp;self</code> or <code>&amp;mut self</code> parameter, its lifetime is assigned to the outputs. If none of these rules determine the output lifetime, you must annotate explicitly."
    },
    {
      "q": "Lifetimes: what does 'static mean, and is T: 'static the same as a static variable?",
      "a": "<code>&amp;'static T</code> is a reference valid for the entire program, like a string literal. The bound <code>T: 'static</code> means <code>T</code> contains no non-static borrows — an owned <code>String</code> satisfies it even though it is dropped later. That is why <code>thread::spawn</code> and <code>tokio::spawn</code> require <code>'static</code>: the task must not borrow from a stack frame that could end first."
    },
    {
      "q": "Types: what is the difference between String and &str?",
      "a": "<code>String</code> owns a growable, heap-allocated UTF-8 buffer (pointer, length, capacity). <code>&amp;str</code> is a borrowed view (pointer and length) into UTF-8 data that may live in a <code>String</code>, a literal in the binary or elsewhere. Functions usually accept <code>&amp;str</code> for flexibility and store <code>String</code> when they need ownership."
    },
    {
      "q": "Types: why can you not index a String with s[0]?",
      "a": "Strings are UTF-8, where characters take 1–4 bytes. A byte index could split a character, and a character index would be O(n). Rust makes the choice explicit: <code>chars()</code>, <code>bytes()</code>, <code>char_indices()</code> or byte-range slices that panic (or <code>get</code> returns <code>None</code>) on non-boundaries."
    },
    {
      "q": "Traits: compare generics with trait bounds to trait objects.",
      "a": "Generics (<code>fn f&lt;T: Shape&gt;(t: T)</code> or <code>impl Shape</code>) are monomorphised: the compiler generates a copy per concrete type, enabling inlining and zero-cost static dispatch at the price of code size. Trait objects (<code>&amp;dyn Shape</code>, <code>Box&lt;dyn Shape&gt;</code>) use a vtable for dynamic dispatch, allowing heterogeneous collections and smaller binaries at the cost of an indirect call and no inlining."
    },
    {
      "q": "Traits: what is the orphan rule?",
      "a": "You can implement a trait for a type only if the trait or the type is defined in your crate. This prevents two crates from providing conflicting implementations. The usual workaround is the newtype pattern: wrap the foreign type in a local struct and implement the trait on the wrapper."
    },
    {
      "q": "Traits: what makes a trait dyn-compatible (object safe)?",
      "a": "Methods must be callable through a vtable: no generic methods, no <code>Self</code> in argument or return position (except behind references like <code>&amp;self</code>), and no <code>Self: Sized</code> requirement on the trait. Methods that break these rules can be excluded with <code>where Self: Sized</code>. Otherwise using <code>dyn Trait</code> fails with E0038."
    },
    {
      "q": "Traits: what are associated types and when do you use them instead of generic parameters?",
      "a": "An associated type (<code>type Item;</code> in <code>Iterator</code>) is chosen once per implementation, so a type implements the trait only one way and callers do not repeat the type. A generic parameter (<code>trait From&lt;T&gt;</code>) allows several implementations for the same type. Use associated types when there is one natural choice per implementor."
    },
    {
      "q": "Error handling: when should you panic instead of returning Result?",
      "a": "Panic for bugs and broken invariants that the caller cannot reasonably recover from — an out-of-bounds index in your own logic, a violated precondition, or impossible states. Return <code>Result</code> for expected failures: I/O, parsing user input, network errors. Libraries should almost never panic on bad input; binaries may <code>expect</code> during startup configuration."
    },
    {
      "q": "Error handling: how does the ? operator work?",
      "a": "On <code>Result</code>, <code>expr?</code> evaluates to the <code>Ok</code> value or returns early with <code>Err(From::from(e))</code>, converting the error into the function's error type. On <code>Option</code>, it returns <code>None</code> early. It only works in functions (or closures/blocks) whose return type supports it, and conversion requires a <code>From</code> impl, often generated by <code>thiserror</code>'s <code>#[from]</code>."
    },
    {
      "q": "Error handling: thiserror or anyhow?",
      "a": "<code>thiserror</code> derives <code>std::error::Error</code> for your own enums, keeping variants matchable — ideal for libraries and for code paths where callers react differently to different errors. <code>anyhow::Error</code> is a boxed catch-all with context chaining, ideal for applications and binaries where errors are mainly reported to humans. Many projects combine both."
    },
    {
      "q": "Memory: what problem does Box<T> solve?",
      "a": "It puts a value on the heap with a single owner. Needed for recursive types (<code>enum List { Cons(i32, Box&lt;List&gt;), Nil }</code>), which otherwise have infinite size (E0072); for trait objects (<code>Box&lt;dyn Error&gt;</code>); and to move large values cheaply by pointer."
    },
    {
      "q": "Memory: Rc vs Arc — and what happens if you use Rc across threads?",
      "a": "Both provide shared ownership through reference counting. <code>Rc</code> uses non-atomic counters and is <code>!Send</code>, so sending it to another thread is a compile error. <code>Arc</code> uses atomic counters (slightly slower) and is <code>Send + Sync</code> when its content is. Choose <code>Rc</code> for single-threaded graphs and <code>Arc</code> for shared state across threads or tasks."
    },
    {
      "q": "Memory: what is interior mutability, and what does RefCell cost?",
      "a": "Interior mutability lets you mutate data through a shared reference. <code>Cell</code> swaps <code>Copy</code> values; <code>RefCell</code> tracks borrows at runtime and panics on a conflicting borrow (\"already borrowed\"). The cost is a runtime check and the possibility of panics instead of compile errors. Thread-safe equivalents are <code>Mutex</code>, <code>RwLock</code> and atomics."
    },
    {
      "q": "Memory: how can you leak memory in safe Rust?",
      "a": "Rust guarantees memory safety, not freedom from leaks. A reference cycle of <code>Rc</code>s (or <code>Arc</code>s) never reaches a count of zero; break cycles with <code>Weak</code> for back-pointers. <code>std::mem::forget</code> and <code>Box::leak</code> also leak deliberately, and both are safe."
    },
    {
      "q": "Concurrency: what are Send and Sync?",
      "a": "<code>Send</code> means a value can be moved to another thread; <code>Sync</code> means <code>&amp;T</code> can be shared between threads (<code>T: Sync</code> iff <code>&amp;T: Send</code>). They are auto traits implemented when all components implement them. <code>thread::spawn</code> requires <code>Send + 'static</code>, so attempts to share an <code>Rc</code> or a <code>RefCell</code> across threads fail to compile — this is how Rust rules out data races."
    },
    {
      "q": "Concurrency: how do you share mutable state between threads?",
      "a": "Wrap it in <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> (or <code>Arc&lt;RwLock&lt;T&gt;&gt;</code> for read-heavy data), clone the <code>Arc</code> into each thread and lock to access. For simple counters use atomics. Alternatively avoid sharing with message passing over channels. Keep critical sections short and never hold a lock while doing slow I/O."
    },
    {
      "q": "Concurrency: does Rust prevent deadlocks?",
      "a": "No. Safe Rust prevents data races, but two threads locking two mutexes in opposite order, or a thread locking the same <code>Mutex</code> twice, can still deadlock. Mitigations are consistent lock ordering, short scopes, <code>try_lock</code> with timeouts, or designs based on message passing."
    },
    {
      "q": "Async: how is async Rust different from threads?",
      "a": "An <code>async fn</code> compiles to a state machine implementing <code>Future</code>; it does nothing until polled. An executor such as Tokio polls many futures on a few OS threads, switching at <code>.await</code> points. This scales to huge numbers of mostly-waiting tasks (network I/O) with low memory, while threads suit CPU-bound work. Blocking inside async code stalls the executor thread."
    },
    {
      "q": "Async: why does tokio::spawn sometimes reject a future as not Send?",
      "a": "On the multi-threaded runtime a task may resume on a different thread after any <code>.await</code>, so everything held across an await point must be <code>Send</code>. Holding an <code>Rc</code>, a <code>RefCell</code> borrow or a <code>std::sync::MutexGuard</code> across <code>.await</code> makes the future <code>!Send</code>. Fix it by scoping such values to end before the await, or by using <code>Arc</code>/<code>tokio::sync::Mutex</code>."
    },
    {
      "q": "Async: what does Pin do?",
      "a": "Some futures are self-referential: a reference stored in the state machine may point into the same struct. Moving such a future would invalidate the pointer. <code>Pin&lt;P&gt;</code> guarantees the pointee will not be moved again (unless it is <code>Unpin</code>), which is what <code>Future::poll(self: Pin&lt;&amp;mut Self&gt;, ...)</code> relies on. Day to day you meet it as <code>Box::pin(fut)</code> or <code>tokio::pin!</code>."
    },
    {
      "q": "Async: join! vs select! vs spawn?",
      "a": "<code>join!</code> runs futures concurrently within the current task and waits for all; <code>select!</code> waits for the first to complete and drops the others (cancellation); <code>tokio::spawn</code> creates an independent task that runs in parallel on the runtime and returns a <code>JoinHandle</code>. Spawned tasks need <code>Send + 'static</code>; joined futures can borrow local data."
    },
    {
      "q": "Unsafe: what does unsafe allow?",
      "a": "Five extra abilities: dereferencing raw pointers, calling <code>unsafe</code> functions (including FFI), accessing or modifying mutable statics, implementing <code>unsafe</code> traits (such as <code>Send</code>/<code>Sync</code> manually), and accessing union fields. Everything else — borrow checking, type checking — still applies. The goal is to wrap unsafe code in small, audited, safe abstractions and test them (e.g. with Miri)."
    },
    {
      "q": "Tooling: what is the difference between cargo check, build and clippy?",
      "a": "<code>cargo check</code> type-checks without generating code, so it is the fastest feedback loop. <code>cargo build</code> produces binaries (<code>--release</code> for optimised ones). <code>cargo clippy</code> runs hundreds of extra lints for correctness, performance and style. CI usually runs <code>cargo fmt --check</code>, <code>cargo clippy -- -D warnings</code> and <code>cargo test</code>."
    },
    {
      "q": "Tooling: how do you organise a large Rust codebase?",
      "a": "A Cargo workspace with several crates sharing one <code>Cargo.lock</code> and <code>target/</code>: a domain/core library with no I/O, adapter crates for the database and HTTP, and thin binary crates. Keep modules private by default and expose a small public API. This speeds incremental builds and keeps dependencies pointing inwards."
    },
    {
      "q": "Design: how would you structure errors in a web service?",
      "a": "Define a domain error enum with <code>thiserror</code>, convert infrastructure errors with <code>#[from]</code>, and implement the framework's response trait (<code>IntoResponse</code> in axum) to map each variant to a status code and JSON body. Log internal errors with context and return generic 500 bodies. Handlers return <code>Result&lt;_, AppError&gt;</code> and use <code>?</code> throughout."
    },
    {
      "q": "Design: when would you choose Rust over Go or Java for a service?",
      "a": "When you need predictable low latency without GC pauses, tight memory usage, high throughput per core, or correctness guarantees around concurrency and memory — proxies, databases, data pipelines, embedded and WebAssembly targets. Go or Java may win on hiring pool, compile times and simplicity for typical CRUD services. A good answer weighs team skills and ecosystem, not just speed."
    },
    {
      "q": "Performance: name three common performance mistakes in Rust code.",
      "a": "Benchmarking debug builds; cloning <code>String</code>/<code>Vec</code> values (often to appease the borrow checker) instead of borrowing; and repeated small allocations — building strings with <code>format!</code> in loops, <code>Vec::new()</code> without capacity, or collecting intermediate vectors. Also: blocking calls inside async tasks and holding locks across slow work."
    }
  ];
}
