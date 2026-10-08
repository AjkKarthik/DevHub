import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Memory & Concurrency': 'concurrency',
  'Building Things': 'http', 'Craft & Ops': 'tooling', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Memory & Concurrency', 'Building Things', 'Craft & Ops', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Rust Fundamentals',        route: '/rust/fundamentals', badge: 'Foundations', available: true,
    description: 'Cargo, rustc, variables, mutability, scalar/compound types, and control flow.',
    keyPoints: ['let is immutable by default — let mut opts in to mutation', 'cargo new/build/run/test: the toolchain wraps rustc for you', 'Scalar types: i32/u32/f64/bool/char; compound: tuples and arrays are fixed-size'] },
  { title: 'Ownership & Borrowing',    route: '/rust/ownership-borrowing', badge: 'Foundations', available: true,
    description: 'Move semantics, the borrow checker, and the borrowing rules that make Rust memory-safe without a GC.',
    keyPoints: ['A value has exactly one owner — assigning it elsewhere moves it, invalidating the original', 'Either one &mut reference OR any number of & references, never both at once', 'References must never outlive the value they point to'] },
  { title: 'Lifetimes',                route: '/rust/lifetimes', badge: 'Foundations', available: true,
    description: 'Lifetime annotations, elision rules, and the compiler errors that teach you to read them.',
    keyPoints: ["'a annotations describe a relationship between reference lifetimes, they don't change how long anything lives", 'Elision rules let the compiler infer lifetimes in the common cases automatically', "'static means the reference can live for the whole program, not that the value is global"] },
  { title: 'Structs & Enums',          route: '/rust/structs-enums', badge: 'Foundations', available: true,
    description: 'Struct types, enum variants, impl blocks, and the difference between methods and associated functions.',
    keyPoints: ['Enum variants can each carry their own different data — a real sum type, not just named constants', 'impl blocks attach behaviour to a type without inheritance', 'Associated functions (like new) take no self; methods do'] },
  { title: 'Pattern Matching',         route: '/rust/pattern-matching', badge: 'Foundations', available: true,
    description: 'match, if let, while let, and destructuring patterns.',
    keyPoints: ['match must be exhaustive — the compiler rejects an unhandled variant', 'if let is sugar for a match with one arm plus a catch-all', 'Destructuring in a let binding pulls fields straight out of a struct or tuple'] },
  { title: 'Error Handling',           route: '/rust/error-handling', badge: 'Foundations', available: true,
    description: 'Result<T, E>, Option<T>, the ? operator, custom error types, and panic vs. recoverable errors.',
    keyPoints: ['Result and Option are ordinary enums — no exceptions, no hidden control flow', '? propagates an Err (or None) up to the caller immediately', 'panic! is for bugs and unrecoverable states, not for ordinary expected failures'] },
  { title: 'Traits & Generics',        route: '/rust/traits-generics', badge: 'Foundations', available: true,
    description: 'Trait definitions, trait bounds, generic functions/structs, and default implementations.',
    keyPoints: ['A trait is Rust\'s interface — implemented for a type, not inherited from a base class', 'Trait bounds (T: Display) constrain which types a generic function accepts', 'A trait method can have a default body that an impl is free to override'] },
  { title: 'Collections',              route: '/rust/collections', badge: 'Foundations', available: true,
    description: 'Vec, HashMap, HashSet, String vs. &str, and iterators/iterator adapters.',
    keyPoints: ['String is an owned, growable buffer; &str is a borrowed view into one', 'Iterators are lazy — nothing runs until you call collect(), for, or another consuming method', 'HashMap iteration order is unspecified, same as Go\'s maps'] },
  { title: 'Modules & Cargo',          route: '/rust/modules-cargo', badge: 'Foundations', available: true,
    description: 'The module system, visibility, workspaces, Cargo.toml, and crates.io.',
    keyPoints: ['Everything is private by default — pub opts a specific item into visibility', 'Cargo.toml declares dependencies; Cargo.lock pins the exact resolved versions', 'A workspace lets several crates share one target/ build directory and one Cargo.lock'] },
  { title: 'Smart Pointers',           route: '/rust/smart-pointers', badge: 'Memory & Concurrency', available: true,
    description: 'Box, Rc, Arc, RefCell, Weak, and interior mutability.',
    keyPoints: ['Box<T> heap-allocates a single-owner value — needed for recursive types', 'Rc<T> is reference-counted shared ownership, single-threaded only; Arc<T> is its thread-safe twin', 'RefCell<T> moves borrow checking from compile time to runtime, panicking on a violation'] },
  { title: 'Concurrency & Threads',    route: '/rust/concurrency-threads', badge: 'Memory & Concurrency', available: true,
    description: 'std::thread, Mutex, Arc<Mutex<T>>, and message passing with channels.',
    keyPoints: ['Arc<Mutex<T>> is the standard pattern for sharing mutable state safely across threads', 'The Send and Sync marker traits are what let the compiler reject unsafe cross-thread sharing at compile time', 'mpsc channels move ownership of a value from sender to receiver, no copying needed'] },
  { title: 'Async/Await',              route: '/rust/async-await', badge: 'Memory & Concurrency', available: true,
    description: 'The Tokio runtime, futures, async fn, and spawning/awaiting tasks.',
    keyPoints: ['An async fn returns a Future that does nothing until it is polled by an executor', 'Rust ships no built-in async runtime — Tokio is the de-facto standard you add yourself', 'tokio::spawn runs a task concurrently; .await suspends the current task until it resolves'] },
  { title: 'Unsafe Rust & FFI',        route: '/rust/unsafe-ffi', badge: 'Memory & Concurrency', available: true,
    description: 'unsafe blocks, raw pointers, and calling into C.',
    keyPoints: ['unsafe does not turn off the borrow checker — it just unlocks a small set of extra operations you must uphold the invariants of yourself', 'Raw pointers (*const T / *mut T) can be null or dangling with no compiler protection', 'extern "C" blocks declare the signature of a foreign function for the linker to resolve'] },
  { title: 'Web Frameworks',           route: '/rust/web-frameworks', badge: 'Building Things', available: true,
    description: 'Axum and Actix-web — routing, extractors, and middleware.',
    keyPoints: ['Axum is built directly on Tower and Tokio, and has become the pragmatic default for new services', 'An extractor pulls one piece of the request (path, JSON body, headers) into a handler argument by its type', 'Actix-web still edges out Axum on raw throughput, but the gap rarely matters at real-world scale'] },
  { title: 'Building REST APIs',       route: '/rust/rest-apis', badge: 'Building Things', available: true,
    description: 'Request/response handling and JSON with Serde.',
    keyPoints: ['#[derive(Serialize, Deserialize)] generates the JSON (de)serialization code at compile time', 'A handler\'s return type implementing IntoResponse is what makes it usable as a route target', 'Validation errors should map to a proper 4xx status, not a generic 500'] },
  { title: 'Serialization',            route: '/rust/serialization', badge: 'Building Things', available: true,
    description: 'Serde derive macros and custom (de)serialization.',
    keyPoints: ['Serde separates the data MODEL (your struct) from the FORMAT (JSON, YAML, bincode, ...)', '#[serde(rename = "...")] and #[serde(skip)] adjust field-level behaviour without touching the struct shape', 'Implementing Serialize/Deserialize by hand is rare — needed only for formats derive can\'t express'] },
  { title: 'CLI Tools',                route: '/rust/cli-tools', badge: 'Building Things', available: true,
    description: 'clap, argument parsing, and building a real command-line app.',
    keyPoints: ['clap\'s derive API turns a plain struct into a full --help-generating argument parser', 'Subcommands are just enum variants under the hood', 'clap validates and reports argument errors before your own code ever runs'] },
  { title: 'WASM with Rust',           route: '/rust/wasm', badge: 'Building Things', available: true,
    description: 'Compiling to WebAssembly and wasm-bindgen.',
    keyPoints: ['wasm-bindgen generates the glue code that lets JS call Rust functions and vice versa', 'A wasm binary has no direct DOM access — every browser interaction goes through bound JS calls', 'wasm-pack packages a crate for npm consumption in one command'] },
  { title: 'Testing in Rust',          route: '/rust/testing', badge: 'Craft & Ops', available: true,
    description: '#[test], integration tests (tests/), mocking, and property-based testing.',
    keyPoints: ['#[test] functions live right beside the code they test, inside a #[cfg(test)] module', 'tests/ is for integration tests that exercise the crate\'s public API like an outside consumer would', 'proptest/quickcheck generate randomized inputs to find edge cases you would never think to write by hand'] },
  { title: 'Macros',                   route: '/rust/macros', badge: 'Craft & Ops', available: true,
    description: 'Declarative macros (macro_rules!) and an introduction to procedural macros.',
    keyPoints: ['macro_rules! pattern-matches on token trees, not values — it operates before type checking', '#[derive(...)] is the most common procedural macro you already use every day', 'Macros trade compile-time cost and debuggability for eliminating real boilerplate'] },
  { title: 'Performance & Profiling',  route: '/rust/performance-profiling', badge: 'Craft & Ops', available: true,
    description: 'Benchmarking, flamegraphs, and avoiding unnecessary clones/allocations.',
    keyPoints: ['.clone() is a real, measurable cost — a reference or a Cow<T> often avoids it entirely', 'criterion gives statistically sound benchmarks, unlike a hand-rolled timing loop', 'A flamegraph makes it obvious which function is actually eating your CPU time, not just which one you suspect'] },
  { title: 'Rust Cheat Sheet',         route: '/rust/cheatsheet', badge: 'Reference', available: true,
    description: 'Ownership rules, syntax, and common patterns on one page.',
    keyPoints: ['Ownership rule of thumb: one owner, move on assignment, borrow when you just need to read', 'Result<T, E> and Option<T> method chaining: map, and_then, unwrap_or, ?', 'Common trait derives: Debug, Clone, PartialEq, Default'] },
  { title: 'Rust Interview Prep',      route: '/rust/interview-prep', badge: 'Reference', available: true,
    description: '30+ Rust interview questions across ownership, lifetimes, traits, concurrency, and error handling.',
    keyPoints: ['Why does Rust not need a garbage collector?', 'What is the difference between Rc<T> and Arc<T>, and when would each panic or fail to compile?', 'Explain how the ? operator interacts with a function\'s return type'] },
];

@Component({
  selector: 'app-rust-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class RustHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
