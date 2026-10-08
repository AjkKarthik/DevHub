module.exports = {
  slug: 'error-handling',
  subtitle: 'Recoverable errors with Result and Option, the ? operator and From conversions, custom error enums, and when to reach for thiserror, anyhow or a panic.',
  readingTime: 24,
  prerequisites: [{ label: 'Structs & Enums', route: '/rust/structs-enums' }, { label: 'Pattern Matching', route: '/rust/pattern-matching' }],
  apis: ['Result<T, E>', '? operator', 'impl From<E>', 'std::error::Error', 'thiserror::Error', 'anyhow::Context'],
  tip: 'Libraries should return precise error enums (thiserror makes them cheap to write) so callers can match on them; applications usually just need to report errors well, which is what anyhow and .context() are for.',
  gotchas: [
    '? only converts errors through From — if there is no From impl from the inner error to your function\'s error type, it will not compile.',
    'unwrap() and expect() panic; in library code they turn a recoverable problem into a crash for every caller.',
    'You cannot use ? on an Option inside a function returning Result (or vice versa) without converting, e.g. opt.ok_or(MyError::Missing)?.',
  ],
  quickRef: [
    { name: 'Result<T, E>', type: 'type', desc: 'Ok(T) on success, Err(E) on failure — the standard return type for fallible functions' },
    { name: 'expr?', type: 'operator', desc: 'Unwrap Ok/Some or return the Err/None early, converting the error with From::from' },
    { name: 'panic!() / unwrap() / expect()', type: 'function', desc: 'Unrecoverable failure: unwinds (or aborts) the current thread' },
    { name: 'map_err(|e| ...)', type: 'method', desc: 'Transform the error type of a Result' },
    { name: 'ok_or(err) / ok_or_else(f)', type: 'method', desc: 'Turn an Option into a Result' },
    { name: 'impl From<io::Error> for MyError', type: 'syntax', desc: 'Lets ? convert io::Error into your error type automatically' },
    { name: '#[derive(thiserror::Error)]', type: 'decorator', desc: 'Derive Display, Error and From for library error enums' },
    { name: 'anyhow::Result<T>', type: 'type', desc: 'Result<T, anyhow::Error>: any error type, with context chains — for applications' },
    { name: '.context("reading config")', type: 'method', desc: 'anyhow: attach a human-readable layer to an error' },
    { name: 'fn main() -> Result<(), E>', type: 'syntax', desc: 'main may return Result; an Err is printed with Debug and the exit code is non-zero' },
  ],
  theory: [
    { heading: 'Two kinds of failure', points: [
      'Recoverable errors — a missing file, invalid input, a timed-out request — are values of type `Result<T, E>`. The caller decides what to do.',
      'Unrecoverable errors — a broken invariant, a bug — use `panic!`. A panic unwinds the current thread, running destructors, or aborts the process if `panic = "abort"` is set in the profile.',
      '`unwrap()` and `expect("why")` convert a `None`/`Err` into a panic. They are fine in tests, prototypes and for conditions that are truly impossible; prefer `expect` with a message explaining why it cannot fail.',
      'Indexing out of bounds, integer division by zero and debug-mode overflow also panic. Panics are not exceptions: do not use them for control flow.',
    ] },
    { heading: 'The ? operator', points: [
      '`let file = File::open(path)?;` returns early with the error if the expression is `Err`, otherwise it unwraps the `Ok` value.',
      'Before returning, `?` calls `From::from` on the error, so a function returning `Result<T, MyError>` can use `?` on any error type that `MyError` implements `From` for.',
      '`?` also works on `Option` in functions that return `Option`. To mix them, convert explicitly: `opt.ok_or(MyError::NotFound)?` or `result.ok()?`.',
      '`main` and tests can return `Result<(), E>` where `E: Debug`, so `?` works there too. An `Err` from `main` is printed and the process exits with a non-zero code.',
    ] },
    { heading: 'Designing error types', points: [
      'A library should expose an error enum that callers can match on: `enum ConfigError { Io(io::Error), Parse { line: usize, msg: String }, MissingKey(String) }`.',
      'Implement `Display` (human message), `std::error::Error` (with `source()` returning the underlying cause) and `From` conversions for wrapped errors.',
      'The `thiserror` crate derives all of that: `#[error("missing key {0}")]` generates `Display`, and `#[from]` generates `From` and `source()`.',
      'Keep the original error as the source instead of formatting it into a string, so callers and reporters can walk the whole chain.',
      '`Box<dyn std::error::Error + Send + Sync>` is a quick catch-all when callers will never need to distinguish errors.',
    ] },
    { heading: 'Application errors with anyhow', points: [
      'Applications mostly need to propagate errors to a top level and report them clearly. `anyhow::Result<T>` accepts any error type that implements `std::error::Error`.',
      '`.context("loading user 42")` and `.with_context(|| format!(...))` wrap an error with a message describing what was being attempted. `{:#}` prints the whole chain on one line; `{:?}` prints it with a "Caused by" list.',
      '`anyhow::bail!("...")` returns an error immediately; `anyhow::ensure!(cond, "...")` is an assert that returns an error instead of panicking.',
      'A common split: `thiserror` in library crates (precise, matchable) and `anyhow` in the binary crate that calls them.',
    ] },
  ],
  codeTabs: [
    { label: 'Result & ?', language: 'rust', code: `use std::num::ParseIntError;

#[derive(Debug)]
enum AgeError {
    NotANumber(ParseIntError),
    OutOfRange(i64),
}

// Lets ? turn a ParseIntError into an AgeError automatically
impl From<ParseIntError> for AgeError {
    fn from(e: ParseIntError) -> Self { AgeError::NotANumber(e) }
}

fn parse_age(input: &str) -> Result<u8, AgeError> {
    let n: i64 = input.trim().parse()?;          // ? + From
    if !(0..=150).contains(&n) {
        return Err(AgeError::OutOfRange(n));
    }
    Ok(n as u8)
}

fn first_even(v: &[i32]) -> Option<i32> {
    let first = *v.first()?;                      // ? on Option
    if first % 2 == 0 { Some(first) } else { None }
}

fn main() {
    println!("{:?}", parse_age(" 42 "));
    println!("{:?}", parse_age("forty"));
    println!("{:?}", parse_age("200"));
    println!("{:?} {:?}", first_even(&[4, 1]), first_even(&[]));

    // Mixing Option and Result: convert explicitly
    let config_value: Option<&str> = None;
    let r: Result<&str, String> = config_value.ok_or("missing key".to_string());
    println!("{r:?}");
}` },
    { label: 'thiserror (library)', language: 'rust', code: `use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("could not read config file")]
    Io(#[from] std::io::Error),
    #[error("line {line}: {msg}")]
    Parse { line: usize, msg: String },
    #[error("missing required key \`{0}\`")]
    MissingKey(String),
}

pub fn parse_config(text: &str) -> Result<Vec<(String, String)>, ConfigError> {
    let mut out = Vec::new();
    for (i, line) in text.lines().enumerate() {
        if line.trim().is_empty() { continue; }
        let (k, v) = line.split_once('=').ok_or_else(|| ConfigError::Parse {
            line: i + 1,
            msg: format!("expected key=value, got {line:?}"),
        })?;
        out.push((k.trim().to_string(), v.trim().to_string()));
    }
    if !out.iter().any(|(k, _)| k == "name") {
        return Err(ConfigError::MissingKey("name".into()));
    }
    Ok(out)
}

fn main() {
    println!("{:?}", parse_config("name = demo\\nport = 80").map(|v| v.len()));
    match parse_config("port 80") {
        Err(e) => println!("error: {e}"),          // uses #[error] Display
        Ok(_) => unreachable!(),
    }
    let err = parse_config("port = 80").unwrap_err();
    println!("{err}");
    let io: ConfigError = std::io::Error::other("disk gone").into(); // #[from]
    println!("{io} / source: {:?}", std::error::Error::source(&io).map(|s| s.to_string()));
}` },
    { label: 'anyhow (application)', language: 'rust', code: `use anyhow::{bail, ensure, Context, Result};

fn read_port(raw: &str) -> Result<u16> {
    let port: u16 = raw
        .trim()
        .parse()
        .with_context(|| format!("PORT must be a number, got {raw:?}"))?;
    ensure!(port >= 1024, "PORT {port} is privileged; use 1024 or above");
    Ok(port)
}

fn load(env: &[(&str, &str)]) -> Result<u16> {
    let Some((_, raw)) = env.iter().find(|(k, _)| *k == "PORT") else {
        bail!("PORT is not set");
    };
    read_port(raw).context("loading server configuration")
}

fn main() {
    println!("{:?}", load(&[("PORT", "8080")]));
    for env in [vec![], vec![("PORT", "80")], vec![("PORT", "abc")]] {
        if let Err(e) = load(&env) {
            println!("{e:#}");   // whole chain on one line
        }
    }
}` },
  ],
  mistakes: [
    { title: 'unwrap() in library code', wrong: `pub fn load_user(id: u64) -> User {
    let row = db_query(id).unwrap(); // crashes every caller on a DB hiccup
    User::from(row)
}`, right: `pub fn load_user(id: u64) -> Result<User, DbError> {
    let row = db_query(id)?;
    Ok(User::from(row))
}`, explanation: 'A panic in a library takes the decision away from the caller and can bring down a whole server thread. Return a Result and let the application decide whether to retry, report or abort.' },
    { title: 'Using ? without a From conversion', checkWrong: true, prelude: '#[derive(Debug)] enum AppError { Bad }', wrong: `fn parse(s: &str) -> Result<i32, AppError> {
    let n = s.parse::<i32>()?;
    Ok(n)
}`, right: `fn parse(s: &str) -> Result<i32, AppError> {
    let n = s.parse::<i32>().map_err(|_| AppError::Bad)?;
    Ok(n)
}
// or: impl From<std::num::ParseIntError> for AppError`, explanation: '? needs From<ParseIntError> for AppError to convert the error (E0277 "? couldn\'t convert the error"). Add a From impl (or #[from] with thiserror), or map the error explicitly.' },
    { title: 'Flattening errors into strings too early', wrong: `fn load() -> Result<Config, String> {
    let text = std::fs::read_to_string("app.toml").map_err(|e| e.to_string())?;
    // callers can no longer tell "not found" from "permission denied"
}`, right: `#[derive(Debug, thiserror::Error)]
enum LoadError {
    #[error("reading app.toml")]
    Io(#[from] std::io::Error),
}
fn load() -> Result<Config, LoadError> { /* ... */ }`, explanation: 'Strings lose the error kind and the source chain. Keep typed errors in libraries; convert to text only at the edge where you display them.' },
    { title: 'Panicking for expected failures', wrong: `let port: u16 = env::var("PORT").expect("PORT").parse().expect("number");`, right: `let port: u16 = env::var("PORT")
    .context("PORT is not set")?
    .parse()
    .context("PORT must be a number")?;`, explanation: 'Missing or invalid configuration is an expected, user-facing failure. Returning an error with context produces a clear message instead of a panic backtrace.' },
    { title: 'Ignoring a Result', wrong: `std::fs::remove_file("tmp.lock"); // warning: unused Result`, right: `if let Err(e) = std::fs::remove_file("tmp.lock") {
    eprintln!("could not remove lock: {e}");
}`, explanation: 'Result is marked #[must_use], so ignoring it triggers a warning. Silently dropping errors hides real problems; handle them, propagate them with ?, or explicitly discard with let _ = when that is truly intended.' },
  ],
  challenge: {
    title: 'Validated money transfer',
    language: 'rust',
    description: 'Define enum TransferError { InsufficientFunds { needed: u64, available: u64 }, SameAccount, AccountNotFound(String) } with a Display implementation (by hand or via thiserror). Write transfer(accounts: &mut HashMap<String, u64>, from: &str, to: &str, amount: u64) -> Result<(), TransferError> that validates in this order: same account, both accounts exist, enough balance — and only then moves the money. Use ? and ok_or where they help.',
    hints: ['accounts.get(from).copied().ok_or_else(|| TransferError::AccountNotFound(from.to_string()))? gives the balance or returns early.', 'Check every condition before mutating anything, so a failure leaves balances unchanged.', 'thiserror: #[error("insufficient funds: need {needed}, have {available}")].'],
    starterCode: `use std::collections::HashMap;

#[derive(Debug, PartialEq)]
enum TransferError {
    InsufficientFunds { needed: u64, available: u64 },
    SameAccount,
    AccountNotFound(String),
}

fn transfer(accounts: &mut HashMap<String, u64>, from: &str, to: &str, amount: u64) -> Result<(), TransferError> {
    todo!()
}

fn main() {
    let mut accounts = HashMap::from([("alice".to_string(), 100), ("bob".to_string(), 20)]);
    println!("{:?}", transfer(&mut accounts, "alice", "bob", 30));
}`,
    solution: `use std::collections::HashMap;
use thiserror::Error;

#[derive(Debug, PartialEq, Error)]
enum TransferError {
    #[error("insufficient funds: need {needed}, have {available}")]
    InsufficientFunds { needed: u64, available: u64 },
    #[error("cannot transfer to the same account")]
    SameAccount,
    #[error("account {0} not found")]
    AccountNotFound(String),
}

fn transfer(accounts: &mut HashMap<String, u64>, from: &str, to: &str, amount: u64) -> Result<(), TransferError> {
    if from == to {
        return Err(TransferError::SameAccount);
    }
    let available = accounts
        .get(from)
        .copied()
        .ok_or_else(|| TransferError::AccountNotFound(from.to_string()))?;
    if !accounts.contains_key(to) {
        return Err(TransferError::AccountNotFound(to.to_string()));
    }
    if available < amount {
        return Err(TransferError::InsufficientFunds { needed: amount, available });
    }
    *accounts.get_mut(from).unwrap() -= amount;   // both keys verified above
    *accounts.get_mut(to).unwrap() += amount;
    Ok(())
}

fn main() {
    let mut accounts = HashMap::from([("alice".to_string(), 100), ("bob".to_string(), 20)]);
    println!("{:?}", transfer(&mut accounts, "alice", "bob", 30));     // Ok(())
    for (f, t, a) in [("bob", "alice", 500), ("alice", "alice", 1), ("carol", "bob", 1)] {
        match transfer(&mut accounts, f, t, a) {
            Ok(()) => println!("ok"),
            Err(e) => println!("error: {e}"),
        }
    }
    println!("alice={} bob={}", accounts["alice"], accounts["bob"]);  // alice=70 bob=50
}`,
  },
  quiz: [
    { q: 'What does the ? operator do when applied to an Err(e) inside a function returning Result<T, MyError>?', options: ['Panics with e', 'Returns Err(From::from(e)) from the function', 'Ignores the error and continues', 'Converts it into None'], answer: 1, explanation: '? returns early, converting the error with From::from, which is why a From impl (or #[from]) is required.' },
    { q: 'Which is the usual split between thiserror and anyhow?', options: ['thiserror for applications, anyhow for libraries', 'thiserror for libraries (typed errors), anyhow for applications (reporting with context)', 'They are interchangeable', 'anyhow is only for async code'], answer: 1, explanation: 'Libraries expose matchable error enums; applications mostly propagate and report, which anyhow makes easy with context chains.' },
    { q: 'What happens if main returns Err?', options: ['Nothing — the error is ignored', 'The error is printed (Debug) and the process exits with a non-zero code', 'The program panics with a backtrace', 'It does not compile'], answer: 1, explanation: 'fn main() -> Result<(), E> where E: Debug is supported; an Err is reported and the exit status indicates failure.' },
    { q: 'How do you use ? on an Option inside a function that returns Result?', options: ['You cannot', 'Convert it first, e.g. opt.ok_or(MyError::Missing)?', 'Wrap it in Some', 'Use unwrap_or_default()?'], answer: 1, explanation: 'The ? operator needs the same "family". ok_or / ok_or_else turn an Option into a Result with your error.' },
    { q: 'When is unwrap() acceptable?', options: ['Never', 'In tests, prototypes, or when failure is truly impossible (ideally use expect with a reason)', 'Whenever the error is unlikely', 'In library public APIs'], answer: 1, explanation: 'unwrap panics on failure. It is fine where a panic is the right outcome (tests) or provably cannot happen; prefer expect("reason") to document why.' },
  ],
  qna: [
    { q: 'How does Rust error handling differ from exceptions?', a: 'Errors are ordinary values in the return type (`Result<T, E>`), so the signature tells you a function can fail and the compiler makes you deal with it — you cannot forget a `Result` without a warning. Propagation is explicit but short thanks to `?`. There is no hidden control flow: a function either returns its value or returns an error. Panics exist, but are for bugs and unrecoverable states, not for normal error handling.' },
    { q: 'What does ? do under the hood?', a: 'For a `Result`, `expr?` is roughly `match expr { Ok(v) => v, Err(e) => return Err(From::from(e)) }`. The `From::from` call is what allows different error types to be converted into the function\'s error type. For `Option` it returns `None` early. Formally it is implemented through the `Try` trait.' },
    { q: 'How do you design an error type for a library?', a: 'Use an enum with one variant per failure the caller might want to handle differently, carrying the relevant data (`Parse { line, msg }`) and wrapping underlying errors as sources (`Io(io::Error)`). Implement `Display`, `std::error::Error` (with `source()`) and `From` for the wrapped errors — `thiserror` derives all three. Consider `#[non_exhaustive]` so you can add variants later without a breaking change.' },
    { q: 'What is the difference between panic and returning an error?', a: 'Returning an error says "this can happen and the caller should decide what to do". A panic says "this is a bug or an unrecoverable situation"; it unwinds the thread (or aborts) and can only be caught at thread boundaries or with `catch_unwind`, which is not meant for normal error handling. Use panics for violated invariants and impossible states, `Result` for everything that depends on input or the environment.' },
    { q: 'How does anyhow::Context improve error messages?', a: '`.context("what I was doing")` wraps the error in a new layer that records the operation that failed while keeping the original as its source. When printed with `{:#}` or `{:?}`, you see the full chain, such as "loading server configuration: PORT must be a number: invalid digit found in string". That tells the user both what failed and why, without losing the low-level cause.' },
  ],
  revision: {
    oneLiner: 'Use Result for expected failures and panic only for bugs; ? propagates and converts errors through From, thiserror builds library error types and anyhow adds context in applications.',
    mustKnow: [
      '`Result<T, E>` for recoverable errors; `panic!`/`unwrap` for bugs and impossible states.',
      '`?` returns early and converts the error with `From::from`.',
      'Convert between Option and Result with `ok_or`, `ok_or_else` and `.ok()`.',
      'Library errors: enums with `Display`, `Error::source`, `From` — derive with thiserror.',
      'Applications: `anyhow::Result` with `.context()`, `bail!` and `ensure!`.',
      '`main` can return `Result`; `Result` is `#[must_use]`.',
    ],
    interviewFocus: [
      'Explain what ? expands to and why From matters.',
      'Compare Rust errors with exceptions.',
      'Design an error enum for a library and justify thiserror vs anyhow.',
      'Explain when panicking is appropriate.',
    ],
  },
};
