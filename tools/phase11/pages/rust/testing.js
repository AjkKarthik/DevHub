module.exports = {
  slug: 'testing',
  subtitle: 'cargo test runs unit tests, integration tests in tests/ and the examples in your doc comments. Add should_panic and Result-returning tests, trait-based test doubles instead of mocking frameworks, async tests, and property-based testing with proptest.',
  readingTime: 24,
  prerequisites: [
    { label: 'Modules & Cargo', route: '/rust/modules-cargo' },
    { label: 'Traits & Generics', route: '/rust/traits-generics' },
  ],
  apis: ['#[test] / #[cfg(test)]', 'assert! / assert_eq! / assert_ne!', '#[should_panic(expected = "...")]', 'tests/ directory', '/// ``` doc tests', 'proptest!'],
  tip: 'Write a failing test before fixing a bug, and make assertions say what they mean: assert_eq!(left, right, "context {x}") prints both values and your message, which is usually all you need to diagnose a failure in CI.',
  gotchas: [
    'Tests run in parallel threads by default. Tests that share a file, port or environment variable can interfere — give each its own temp path or run with -- --test-threads=1.',
    'println! output from passing tests is captured and hidden. Use cargo test -- --nocapture (or --show-output) to see it.',
    'Integration tests in tests/ can only use the public API of a library crate. A binary-only crate has nothing to import — move logic into src/lib.rs.',
  ],
  quickRef: [
    { name: '#[cfg(test)] mod tests { use super::*; }', type: 'syntax', desc: 'Unit tests next to the code, compiled only for cargo test' },
    { name: '#[test] fn name() { ... }', type: 'decorator', desc: 'Mark a function as a test; a panic means failure' },
    { name: 'assert_eq!(a, b, "msg {x}")', type: 'function', desc: 'Compare with Debug output of both sides on failure' },
    { name: '#[should_panic(expected = "...")]', type: 'decorator', desc: 'Pass only if the code panics with that message' },
    { name: 'fn t() -> Result<(), E>', type: 'function', desc: 'Use ? inside tests; an Err fails the test' },
    { name: '#[ignore]', type: 'decorator', desc: 'Skip slow tests unless run with -- --ignored' },
    { name: 'tests/api.rs', type: 'syntax', desc: 'Integration test: a separate crate using only the public API' },
    { name: '/// ``` assert_eq!(add(1, 2), 3); ```', type: 'syntax', desc: 'Doc test: an example in docs, compiled and run by cargo test' },
    { name: '#[tokio::test]', type: 'decorator', desc: 'Async test with its own runtime' },
    { name: 'proptest! { fn p(x in 0..100i32) { ... } }', type: 'function', desc: 'Property-based test with generated inputs and shrinking' },
  ],
  theory: [
    { heading: 'Three kinds of test', points: [
      'Unit tests live in a `#[cfg(test)] mod tests` inside the file they test. Because the module is a child, `use super::*;` gives access to private functions too.',
      'Integration tests are files in the top-level `tests/` directory. Each file is compiled as its own crate that imports your library like any outside user would, so they can only reach the public API. Shared helpers go in `tests/common/mod.rs`.',
      'Doc tests are the code blocks in `///` comments. `cargo test` compiles and runs them, so examples in your documentation cannot silently go stale. Mark a block `no_run`, `ignore` or `should_panic` when it should not run normally.',
      '`cargo test` runs all three; filter with `cargo test parse` (name substring), `--lib`, `--test api` or `--doc`. Arguments after `--` go to the test binary: `--nocapture`, `--test-threads=1`, `--ignored`.',
    ] },
    { heading: 'Writing assertions', points: [
      'A test fails by panicking. `assert!`, `assert_eq!` and `assert_ne!` panic with a message showing the values, so the compared types must implement `Debug` (and `PartialEq` for the equality forms).',
      'A test can return `Result<(), E>`: then `?` works inside, and returning `Err` fails the test. This keeps setup code free of `unwrap()` noise.',
      '`#[should_panic(expected = "divide by zero")]` asserts that a panic happens and that its message contains the given text — checking the message avoids passing because of an unrelated panic.',
      'Floating-point values rarely compare equal; assert with a tolerance: `assert!((a - b).abs() < 1e-9)`.',
    ] },
    { heading: 'Test doubles without a framework', points: [
      'Rust has no runtime reflection, so classic mocking frameworks are less central. Instead, depend on a trait and pass in a fake implementation in tests (the same dependency inversion you would use in any language).',
      'Generic parameters (`fn new(clock: C) where C: Clock`) keep production code zero-cost; `Box<dyn Clock>` or `Arc<dyn Clock>` is simpler when the dependency is chosen at runtime.',
      'For recording calls in a fake, use interior mutability (`RefCell<Vec<String>>` or a `Mutex`) because trait methods usually take `&self`.',
      'When you do want generated mocks, the `mockall` crate derives them from a trait with `#[automock]`, including expectations on arguments and call counts.',
    ] },
    { heading: 'Async and property-based tests', points: [
      '`#[tokio::test]` creates a runtime per test so you can `.await` inside. `#[tokio::test(start_paused = true)]` (requires tokio\'s `test-util` feature, usually as a dev-dependency) pauses the clock so `tokio::time` timeouts and retry delays elapse instantly.',
      'Property-based testing states a rule that must hold for all inputs — "decode(encode(x)) == x", "sorting is idempotent", "the output length never exceeds the input" — and lets `proptest` generate hundreds of inputs.',
      'When a property fails, proptest shrinks the input to a minimal failing case and saves it in `proptest-regressions/` so it is re-tested every run. Commit that directory.',
      'Coverage and quality tooling: `cargo llvm-cov` for coverage, `cargo nextest` as a faster test runner with better output, and `cargo mutants` for mutation testing.',
    ] },
  ],
  codeTabs: [
    { label: 'Unit tests', language: 'rust', test: true, code: `pub fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("divide by zero");
    }
    a / b
}

fn parse_port(s: &str) -> Result<u16, String> {
    s.parse::<u16>().map_err(|e| format!("bad port {s:?}: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*; // includes the private parse_port

    #[test]
    fn divides() {
        assert_eq!(divide(10, 3), 3, "integer division truncates");
    }

    #[test]
    #[should_panic(expected = "divide by zero")]
    fn panics_on_zero() {
        divide(1, 0);
    }

    #[test]
    fn parses_ports() -> Result<(), String> {
        assert_eq!(parse_port("8080")?, 8080);
        assert!(parse_port("99999").is_err());
        Ok(())
    }

    #[test]
    #[ignore = "slow: run with cargo test -- --ignored"]
    fn exhaustive_check() {
        for p in 0..=u16::MAX { assert_eq!(parse_port(&p.to_string()), Ok(p)); }
    }
}

fn main() {}` },
    { label: 'Integration & doc tests', language: 'bash', code: `# Project layout
my_crate/
├── src/
│   └── lib.rs          # pub fn slugify(..)  with a /// doc test
└── tests/
    ├── common/
    │   └── mod.rs      # shared helpers (not a test file itself)
    └── slugify.rs      # integration test: uses my_crate::slugify

# src/lib.rs
/// Turns a title into a URL slug.
///
/// \`\`\`
/// assert_eq!(my_crate::slugify("Hello, World!"), "hello-world");
/// \`\`\`
pub fn slugify(s: &str) -> String { /* ... */ }

# tests/slugify.rs
mod common;
use my_crate::slugify;

#[test]
fn collapses_separators() {
    assert_eq!(slugify("a  --  b"), "a-b");
}

# Commands
cargo test                    # unit + integration + doc tests
cargo test --test slugify     # one integration test file
cargo test --doc              # only doc tests
cargo test slug -- --nocapture  # name filter, show println! output` },
    { label: 'Trait-based test double', language: 'rust', test: true, code: `use std::cell::RefCell;

pub trait Mailer {
    fn send(&self, to: &str, body: &str) -> Result<(), String>;
}

pub struct Signup<M: Mailer> { mailer: M }

impl<M: Mailer> Signup<M> {
    pub fn new(mailer: M) -> Self { Signup { mailer } }

    pub fn register(&self, email: &str) -> Result<(), String> {
        if !email.contains('@') {
            return Err("invalid email".into());
        }
        self.mailer.send(email, "Welcome!")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Default)]
    struct FakeMailer { sent: RefCell<Vec<String>>, fail: bool }

    impl Mailer for FakeMailer {
        fn send(&self, to: &str, _body: &str) -> Result<(), String> {
            if self.fail { return Err("smtp down".into()); }
            self.sent.borrow_mut().push(to.to_string());
            Ok(())
        }
    }

    #[test]
    fn sends_welcome_mail() {
        let signup = Signup::new(FakeMailer::default());
        signup.register("ada@example.com").unwrap();
        assert_eq!(*signup.mailer.sent.borrow(), vec!["ada@example.com"]);
    }

    #[test]
    fn invalid_email_sends_nothing() {
        let signup = Signup::new(FakeMailer::default());
        assert!(signup.register("nope").is_err());
        assert!(signup.mailer.sent.borrow().is_empty());
    }

    #[test]
    fn mailer_failure_is_reported() {
        let signup = Signup::new(FakeMailer { fail: true, ..Default::default() });
        assert_eq!(signup.register("ada@example.com"), Err("smtp down".to_string()));
    }
}

fn main() {}` },
    { label: 'proptest & async', language: 'rust', test: true, code: `pub fn encode(s: &str) -> String {
    s.chars().map(|c| match c {
        '%' => "%25".to_string(),
        ' ' => "%20".to_string(),
        c => c.to_string(),
    }).collect()
}

pub fn decode(s: &str) -> String {
    s.replace("%20", " ").replace("%25", "%")
}

pub async fn fetch_with_timeout() -> Result<u32, &'static str> {
    tokio::time::timeout(std::time::Duration::from_secs(5), async {
        tokio::time::sleep(std::time::Duration::from_secs(60)).await;
        42
    })
    .await
    .map_err(|_| "timed out")
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    proptest! {
        // For ANY string, decoding an encoded value gives it back
        #[test]
        fn roundtrip(s in ".*") {
            prop_assert_eq!(decode(&encode(&s)), s);
        }

        #[test]
        fn encoded_has_no_spaces(s in "[a-z %]{0,40}") {
            prop_assert!(!encode(&s).contains(' '));
        }
    }

    // Paused clock (tokio feature "test-util"): the 5 s timeout elapses instantly
    #[tokio::test(start_paused = true)]
    async fn times_out() {
        assert_eq!(fetch_with_timeout().await, Err("timed out"));
    }
}

fn main() {}` },
  ],
  mistakes: [
    { title: 'should_panic without an expected message', wrong: `#[test]
#[should_panic]
fn rejects_negative() {
    let v: Vec<i32> = vec![];
    let _first = v[0];          // panics for the WRONG reason
    validate(-1);
}`, right: `#[test]
#[should_panic(expected = "must be positive")]
fn rejects_negative() {
    validate(-1);
}`, explanation: 'A bare should_panic passes on any panic, including an index-out-of-bounds in your setup. expected = "..." checks that the panic message contains the text you mean.' },
    { title: 'Tests sharing global state', wrong: `#[test] fn a() { std::fs::write("/tmp/state.txt", "a").unwrap(); /* ... */ }
#[test] fn b() { std::fs::write("/tmp/state.txt", "b").unwrap(); /* ... */ }
// flaky: tests run in parallel and overwrite each other's file`, right: `#[test] fn a() {
    let dir = std::env::temp_dir().join(format!("a-{}", std::process::id()));
    // or use the tempfile crate: tempfile::tempdir()
}`, explanation: 'cargo test runs tests concurrently in one process. Give each test its own temporary directory, port or database, or serialize only the tests that truly must share.' },
    { title: 'Integration tests for a binary-only crate', wrong: `// src/main.rs contains all the logic
// tests/cli.rs:
use my_tool::parse;   // error[E0432]: unresolved import — there is no library`, right: `// src/lib.rs   -> pub fn parse(..)  (all logic)
// src/main.rs  -> fn main() { my_tool::run() }
// tests/cli.rs -> use my_tool::parse;`, explanation: 'Integration tests import a library crate. Put the logic in src/lib.rs and keep main.rs as a thin wrapper; then both unit and integration tests can reach it.' },
    { title: 'Comparing floats with assert_eq!', wrong: `assert_eq!(0.1 + 0.2, 0.3);   // fails: 0.30000000000000004 != 0.3`, right: `let got = 0.1_f64 + 0.2;
assert!((got - 0.3).abs() < 1e-12, "got {got}");`, explanation: 'Floating-point arithmetic is inexact. Compare against a tolerance (or use a crate such as approx) instead of exact equality.' },
    { title: 'unwrap everywhere in test setup', wrong: `#[test]
fn loads() {
    let text = std::fs::read_to_string("fixtures/a.json").unwrap();
    let cfg: Config = serde_json::from_str(&text).unwrap();
    assert_eq!(cfg.port, 80);
}`, right: `#[test]
fn loads() -> Result<(), Box<dyn std::error::Error>> {
    let text = std::fs::read_to_string("fixtures/a.json")?;
    let cfg: Config = serde_json::from_str(&text)?;
    assert_eq!(cfg.port, 80);
    Ok(())
}`, explanation: 'Returning Result lets ? propagate setup failures with their real error message, which reads better than a chain of unwrap panics.' },
  ],
  challenge: {
    title: 'Test a rate limiter with a fake clock',
    language: 'rust',
    test: true,
    description: 'A RateLimiter allows at most `max` calls per `window_secs` seconds. It depends on a Clock trait (fn now(&self) -> u64, seconds). Implement allow(&mut self) -> bool, then write unit tests using a FakeClock whose time you can advance: calls within the limit pass, the next one is rejected, and calls pass again after the window. No real sleeping.',
    hints: ['Store the timestamps of allowed calls in a VecDeque<u64>; drop entries older than now - window_secs.', 'FakeClock can hold a Cell<u64> so tests can change the time through &self.', 'Pass the clock by reference or Rc so the test keeps a handle to advance it.'],
    starterCode: `use std::collections::VecDeque;

pub trait Clock { fn now(&self) -> u64; }

pub struct RateLimiter<C: Clock> { clock: C, max: usize, window_secs: u64, hits: VecDeque<u64> }

impl<C: Clock> RateLimiter<C> {
    pub fn new(clock: C, max: usize, window_secs: u64) -> Self {
        RateLimiter { clock, max, window_secs, hits: VecDeque::new() }
    }
    pub fn allow(&mut self) -> bool {
        todo!()
    }
}

#[cfg(test)]
mod tests {
    // TODO: FakeClock + tests
}

fn main() {}`,
    solution: `use std::collections::VecDeque;

pub trait Clock { fn now(&self) -> u64; }

pub struct RateLimiter<C: Clock> { clock: C, max: usize, window_secs: u64, hits: VecDeque<u64> }

impl<C: Clock> RateLimiter<C> {
    pub fn new(clock: C, max: usize, window_secs: u64) -> Self {
        RateLimiter { clock, max, window_secs, hits: VecDeque::new() }
    }

    pub fn allow(&mut self) -> bool {
        let now = self.clock.now();
        while let Some(&t) = self.hits.front() {
            if now - t >= self.window_secs { self.hits.pop_front(); } else { break; }
        }
        if self.hits.len() < self.max {
            self.hits.push_back(now);
            true
        } else {
            false
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::Cell;

    struct FakeClock(Cell<u64>);
    impl Clock for &FakeClock {
        fn now(&self) -> u64 { self.0.get() }
    }

    #[test]
    fn allows_up_to_max_then_rejects() {
        let clock = FakeClock(Cell::new(100));
        let mut rl = RateLimiter::new(&clock, 2, 10);
        assert!(rl.allow());
        assert!(rl.allow());
        assert!(!rl.allow(), "third call in the window must be rejected");
    }

    #[test]
    fn allows_again_after_window() {
        let clock = FakeClock(Cell::new(100));
        let mut rl = RateLimiter::new(&clock, 1, 10);
        assert!(rl.allow());
        clock.0.set(109);
        assert!(!rl.allow());
        clock.0.set(110);              // exactly one window later
        assert!(rl.allow());
    }
}

fn main() {}`,
  },
  quiz: [
    { q: 'Where do integration tests live and what can they access?', options: ['In src/ with access to private items', 'In tests/, compiled as separate crates using only the public API', 'In benches/', 'Inside main.rs'], answer: 1, explanation: 'Each file in tests/ is its own crate that imports your library from the outside, so only pub items are reachable.' },
    { q: 'What does #[should_panic(expected = "overflow")] check?', options: ['That the test panics at least once', 'That the test panics with a message containing "overflow"', 'That no panic occurs', 'That the function returns Err'], answer: 1, explanation: 'expected matches a substring of the panic message, so an unrelated panic does not count as a pass.' },
    { q: 'How do you see println! output from a passing test?', options: ['It is always shown', 'cargo test -- --nocapture', 'cargo test --verbose', 'RUST_LOG=debug'], answer: 1, explanation: 'Output of passing tests is captured; --nocapture (or --show-output) prints it.' },
    { q: 'What happens when a proptest property fails?', options: ['It reports the first random input', 'It shrinks the input to a minimal failing case and records it for future runs', 'It retries until it passes', 'It panics without details'], answer: 1, explanation: 'proptest shrinks toward the simplest failing input and saves it in proptest-regressions/ so the case is always re-checked.' },
    { q: 'Doc tests are...', options: ['Comments ignored by the compiler', 'Code blocks in /// comments that cargo test compiles and runs', 'Markdown files in docs/', 'Only run on nightly'], answer: 1, explanation: 'cargo test runs examples in doc comments, keeping documentation correct.' },
    { q: 'What is the idiomatic way to replace a dependency (like an email sender) in a unit test?', options: ['Monkey-patch the function', 'Depend on a trait and pass a fake implementation', 'Use unsafe to swap the function pointer', 'Set an environment variable'], answer: 1, explanation: 'Rust has no runtime patching; depending on a trait (generic or dyn) lets tests supply a fake. mockall can generate such fakes.' },
  ],
  qna: [
    { q: 'How are unit, integration and doc tests different in Rust?', a: 'Unit tests sit in a `#[cfg(test)]` module inside the source file and can test private functions. Integration tests live in `tests/`, each file compiled as a separate crate that sees only the public API — they test the crate the way users will. Doc tests are code examples in `///` comments, compiled and run by `cargo test`, so documentation stays correct. `cargo test` runs all three.' },
    { q: 'How do you mock dependencies in Rust?', a: 'Design for it: depend on a trait rather than a concrete type, and inject the implementation (via a generic parameter or `Box<dyn Trait>`/`Arc<dyn Trait>`). Tests pass a hand-written fake that records calls or returns canned results, typically using `RefCell` or `Mutex` for state behind `&self`. For larger traits, `mockall`\'s `#[automock]` generates mocks with expectations. Time and randomness are handled the same way, or with tools like tokio\'s paused clock.' },
    { q: 'What is property-based testing and when is it worth it?', a: 'Instead of hand-picked examples you state invariants that must hold for every input — round-trips, idempotence, ordering, "never panics" — and a library like `proptest` generates many random inputs, then shrinks any failure to a minimal case. It shines for parsers, encoders, data structures and numeric code, where hand-written examples miss edge cases such as empty strings, unicode, huge values or duplicates.' },
    { q: 'Why might tests pass alone but fail together?', a: 'cargo test runs tests in parallel threads within one process. Tests that share a file path, port, database, environment variable or global static can race. Fix it by isolating resources per test (temp dirs, random ports, transactions rolled back at the end), or serialize the few tests that must share state (for example with the `serial_test` crate) rather than forcing `--test-threads=1` for everything.' },
  ],
  revision: {
    oneLiner: 'cargo test runs unit tests (#[cfg(test)]), integration tests (tests/) and doc tests; inject traits for fakes and add proptest for invariants.',
    mustKnow: [
      'Unit tests can reach private items via `use super::*`.',
      'Integration tests in `tests/` use only the public API — needs a lib crate.',
      'Doc-comment examples are compiled and run.',
      'Use `should_panic(expected = ...)` and Result-returning tests.',
      'Tests run in parallel; isolate files, ports and env vars.',
      'Trait-based fakes replace mocking frameworks; mockall when needed.',
      'proptest shrinks failures and stores regressions.',
    ],
    interviewFocus: [
      'Explain the three kinds of Rust tests and where each lives.',
      'Show how you would test code that depends on time or an external service.',
      'Explain property-based testing with an example invariant.',
    ],
  },
};
