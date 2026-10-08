module.exports = {
  slug: 'cli-tools',
  subtitle: 'Build real command-line programs: clap derive for arguments and subcommands, reading stdin and files, writing to stdout and stderr, exit codes, and anyhow for errors with context.',
  readingTime: 22,
  apis: ['#[derive(Parser)]', '#[derive(Subcommand)]', '#[arg(short, long, default_value_t)]', 'std::io::stdin().lines()', 'std::process::ExitCode', 'anyhow::Context'],
  tip: 'Keep main thin: parse arguments, call a run(args) -> anyhow::Result<()> function, and map the result to an exit code. Everything except argument parsing is then an ordinary, testable function.',
  gotchas: [
    'println! panics if stdout is closed (for example `mytool | head -1` once head exits). Long-running output loops should use writeln!(stdout.lock(), ...) and handle the BrokenPipe error.',
    'Use eprintln! for diagnostics and errors so they do not pollute stdout, which other programs may be piping.',
    'clap reports parse errors and --help itself and exits with code 2 for usage errors; Parser::parse() never returns on failure. Use try_parse when you need to handle it yourself.',
  ],
  quickRef: [
    { name: '#[derive(Parser)] struct Cli', type: 'decorator', desc: 'Turn a struct into an argument parser with generated --help and --version' },
    { name: 'Cli::parse()', type: 'function', desc: 'Parse std::env::args, printing help or errors and exiting on failure' },
    { name: '#[arg(short, long)]', type: 'decorator', desc: 'Accept -v / --verbose; long names come from the field name' },
    { name: '#[arg(default_value_t = 10)]', type: 'decorator', desc: 'Default for a typed option' },
    { name: '#[command(subcommand)] + #[derive(Subcommand)] enum', type: 'decorator', desc: 'git-style subcommands, one enum variant each' },
    { name: '#[arg(value_enum)] + #[derive(ValueEnum)]', type: 'decorator', desc: 'Restrict an option to a fixed set of values' },
    { name: 'std::io::stdin().lines()', type: 'method', desc: 'Iterate input lines (Result<String> each)' },
    { name: 'BufWriter::new(stdout.lock())', type: 'class', desc: 'Buffered, locked output for many writes' },
    { name: 'fn main() -> ExitCode', type: 'function', desc: 'Return a specific process exit status' },
    { name: '.with_context(|| format!(...))?', type: 'method', desc: 'anyhow: attach a human-readable cause to an error' },
  ],
  theory: [
    { heading: 'Arguments with clap', points: [
      'clap 4 with the `derive` feature generates a full parser from a struct: field types decide the parsing (`u32`, `PathBuf`, `bool` flags, `Option<T>` for optional values, `Vec<T>` for repeated values) and doc comments become `--help` text.',
      'Positional arguments are plain fields; `#[arg(short, long)]` makes an option. `#[command(version, about)]` on the struct reads the version and description from `Cargo.toml`.',
      'Subcommands are an enum deriving `Subcommand`, with each variant holding its own arguments — the same shape as `git commit -m` or `cargo build --release`.',
      'Validation happens before your code runs: a non-numeric `--count`, a missing required argument or an unknown flag prints a clear error and exits with code 2.',
      '`Cli::try_parse_from(["prog", "--count", "3"])` parses from any iterator — that is how you unit-test the argument definitions.',
    ] },
    { heading: 'Input and output', points: [
      'Follow the Unix conventions: read from stdin when no file is given (or when the file is `-`), write results to stdout, and write diagnostics to stderr with `eprintln!`.',
      '`std::io::stdin().lines()` yields `io::Result<String>` per line. Read whole files with `std::fs::read_to_string` or stream large ones with `BufReader::new(File::open(path)?)`.',
      '`println!` locks stdout for every call. For many lines, take `let mut out = BufWriter::new(io::stdout().lock())` once and use `writeln!(out, ...)?` — often several times faster.',
      'When the reader of a pipe exits early, writes fail with `BrokenPipe`. Rust ignores SIGPIPE, so a `println!` panics there; returning the `io::Error` and treating `BrokenPipe` as a normal exit keeps the tool quiet.',
    ] },
    { heading: 'Errors and exit codes', points: [
      'Application code commonly uses `anyhow::Result<T>` and `.with_context(|| format!("reading {path:?}"))?`, so an error message reads like "reading config.toml: No such file or directory".',
      '`fn main() -> anyhow::Result<()>` prints `Error: ...` with the context chain and exits with code 1. For more control return `std::process::ExitCode` and print the error yourself.',
      'Use distinct exit codes when scripts need to react: 0 for success, 1 for general failure, 2 for usage errors (clap\'s choice), and documented codes like `grep`\'s "1 = no match".',
      '`std::process::exit` skips destructors, so buffered writers may not flush. Prefer returning an `ExitCode` from `main`.',
    ] },
    { heading: 'Shipping a CLI', points: [
      '`cargo install --path .` installs your binary locally; `cargo install <crate>` installs from crates.io. Build release binaries with `cargo build --release` for real performance.',
      'Static single-file binaries are a major reason Rust is popular for CLIs (ripgrep, fd, bat, uv). Cross-compile with `rustup target add` plus a linker, or tools like `cross` and `cargo-dist`.',
      'Test the binary end to end with `std::process::Command` in `tests/` (or crates like `assert_cmd`), and keep the core logic in a library function that unit tests call directly.',
      'Helpful extras: `indicatif` progress bars, `colored`/`anstream` for colour (respecting `NO_COLOR`), `dialoguer` prompts and `clap_complete` for shell completions.',
    ] },
  ],
  codeTabs: [
    { label: 'clap derive', language: 'rust', code: `use clap::{Parser, Subcommand, ValueEnum};
use std::path::PathBuf;

/// A tiny task manager
#[derive(Parser, Debug)]
#[command(version, about)]
struct Cli {
    /// Path to the task file
    #[arg(short, long, default_value = "tasks.json")]
    file: PathBuf,

    /// Print extra information
    #[arg(short, long)]
    verbose: bool,

    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
enum Command {
    /// Add a task
    Add { title: String, #[arg(long, value_enum, default_value_t = Priority::Normal)] priority: Priority },
    /// List tasks
    List { #[arg(long, default_value_t = 10)] limit: usize },
    /// Mark a task done
    Done { id: u32 },
}

#[derive(ValueEnum, Clone, Debug)]
enum Priority { Low, Normal, High }

fn main() {
    // In a real program: let cli = Cli::parse();
    let cli = Cli::try_parse_from(["todo", "-v", "add", "write docs", "--priority", "high"]).unwrap();
    println!("{cli:?}");

    let err = Cli::try_parse_from(["todo", "list", "--limit", "ten"]).unwrap_err();
    println!("exit code {}: {}", err.exit_code(), err.kind());
}` },
    { label: 'stdin, stdout, exit codes', language: 'rust', run: false, code: `use std::io::{self, BufRead, BufWriter, Write};
use std::process::ExitCode;

// A grep-like filter: prints matching lines, exit 0 if any matched, 1 if none, 2 on error
fn run(pattern: &str) -> io::Result<bool> {
    let stdin = io::stdin();
    let mut out = BufWriter::new(io::stdout().lock());
    let mut found = false;
    for line in stdin.lock().lines() {
        let line = line?;
        if line.contains(pattern) {
            found = true;
            writeln!(out, "{line}")?;
        }
    }
    out.flush()?;
    Ok(found)
}

fn main() -> ExitCode {
    let Some(pattern) = std::env::args().nth(1) else {
        eprintln!("usage: minigrep PATTERN < input");
        return ExitCode::from(2);
    };
    match run(&pattern) {
        Ok(true) => ExitCode::SUCCESS,
        Ok(false) => ExitCode::from(1),
        Err(e) if e.kind() == io::ErrorKind::BrokenPipe => ExitCode::SUCCESS, // reader went away
        Err(e) => {
            eprintln!("minigrep: {e}");
            ExitCode::from(2)
        }
    }
}` },
    { label: 'anyhow context', language: 'rust', code: `use anyhow::{Context, Result, bail};
use std::fs;

#[derive(Debug)]
struct Config { port: u16 }

fn load_config(path: &str) -> Result<Config> {
    let text = fs::read_to_string(path)
        .with_context(|| format!("reading config file {path}"))?;
    let port: u16 = text.trim().strip_prefix("port=")
        .context("expected a line like port=8080")?
        .parse()
        .context("port must be a number between 0 and 65535")?;
    if port < 1024 {
        bail!("port {port} needs root; use 1024 or higher");
    }
    Ok(Config { port })
}

fn main() {
    let dir = std::env::temp_dir();
    let good = dir.join("cli_demo_good.conf");
    let bad = dir.join("cli_demo_bad.conf");
    fs::write(&good, "port=8080").unwrap();
    fs::write(&bad, "port=eighty").unwrap();

    println!("{:?}", load_config(good.to_str().unwrap()).unwrap());
    for p in [bad.to_str().unwrap(), "/no/such/file.conf"] {
        // {:#} prints the whole context chain on one line
        println!("error: {:#}", load_config(p).unwrap_err());
    }
}` },
  ],
  mistakes: [
    { title: 'Writing errors to stdout', wrong: `if !path.exists() {
    println!("error: {path:?} not found");   // ends up in the piped data
    std::process::exit(1);
}`, right: `if !path.exists() {
    eprintln!("error: {path:?} not found");
    return ExitCode::FAILURE;
}`, explanation: 'stdout is the data channel other programs consume (tool | jq). Errors and progress belong on stderr, and returning ExitCode lets destructors such as BufWriter flush.' },
    { title: 'println! in a hot loop', wrong: `for line in lines {
    println!("{line}");        // locks and may flush stdout every line
}`, right: `let mut out = BufWriter::new(io::stdout().lock());
for line in lines {
    writeln!(out, "{line}")?;
}
out.flush()?;`, explanation: 'println! locks stdout and, when the output is a terminal, line-buffers each write. A locked BufWriter batches writes and is dramatically faster for large outputs.' },
    { title: 'Parsing std::env::args by hand', wrong: `let args: Vec<String> = std::env::args().collect();
let count: usize = args[2].parse().unwrap();  // panics on a missing or bad argument`, right: `#[derive(clap::Parser)]
struct Cli { #[arg(short, long, default_value_t = 1)] count: usize }
let cli = Cli::parse();   // help, errors and exit code 2 for free`, explanation: 'Hand-rolled parsing panics on bad input and has no --help. clap validates types, reports friendly errors and documents the interface from the struct.' },
    { title: 'Using process::exit after buffered writes', wrong: `let mut out = BufWriter::new(io::stdout());
writeln!(out, "result")?;
std::process::exit(0);   // destructors skipped: output may never be flushed`, right: `let mut out = BufWriter::new(io::stdout());
writeln!(out, "result")?;
out.flush()?;
return Ok(());           // or return ExitCode from main`, explanation: 'process::exit terminates immediately without running destructors, so data still in the BufWriter is lost. Return from main instead.' },
    { title: 'Errors without context', wrong: `let text = fs::read_to_string(path)?;
// Error: No such file or directory (os error 2)   -- which file?`, right: `let text = fs::read_to_string(&path)
    .with_context(|| format!("reading {}", path.display()))?;
// Error: reading ./tasks.json: No such file or directory (os error 2)`, explanation: 'io::Error does not include the path. Attaching context with anyhow tells the user exactly which operation failed on which file.' },
  ],
  challenge: {
    title: 'A word-count CLI core',
    language: 'rust',
    description: 'Define a clap Cli with an optional positional FILE (read stdin when absent), and flags -l/--lines, -w/--words and -c/--chars; when no flag is given, report all three. Write fn count(text: &str, cli: &Cli) -> String that returns the selected counts separated by spaces in the order lines, words, chars. Test it in main with Cli::try_parse_from instead of real arguments.',
    hints: ['file: Option<PathBuf> as a positional field; lines/words/chars: bool with #[arg(short, long)].', 'If none of the flags is set, treat all three as set.', 'chars() counts Unicode scalar values; lines() ignores a trailing newline.'],
    starterCode: `use clap::Parser;
use std::path::PathBuf;

#[derive(Parser, Debug)]
struct Cli {
    // TODO
}

fn count(text: &str, cli: &Cli) -> String {
    todo!()
}

fn main() {
    let text = "hello wörld\\nsecond line\\n";
    let cli = Cli::try_parse_from(["wc", "-w"]).unwrap();
    println!("{}", count(text, &cli));
}`,
    solution: `use clap::Parser;
use std::path::PathBuf;

/// Count lines, words and characters
#[derive(Parser, Debug)]
struct Cli {
    /// File to read (stdin if omitted)
    file: Option<PathBuf>,
    #[arg(short, long)]
    lines: bool,
    #[arg(short, long)]
    words: bool,
    #[arg(short, long)]
    chars: bool,
}

fn count(text: &str, cli: &Cli) -> String {
    let all = !cli.lines && !cli.words && !cli.chars;
    let mut parts = Vec::new();
    if all || cli.lines { parts.push(text.lines().count().to_string()); }
    if all || cli.words { parts.push(text.split_whitespace().count().to_string()); }
    if all || cli.chars { parts.push(text.chars().count().to_string()); }
    parts.join(" ")
}

fn main() {
    let text = "hello wörld\\nsecond line\\n";
    for args in [vec!["wc"], vec!["wc", "-w"], vec!["wc", "-l", "-c", "notes.txt"]] {
        let cli = Cli::try_parse_from(args).unwrap();
        println!("{:?} -> {}", cli.file, count(text, &cli));
    }
    // None -> 2 4 24
    // None -> 4
    // Some("notes.txt") -> 2 24
}`,
  },
  quiz: [
    { q: 'What does Cli::parse() do when the user passes an invalid value?', options: ['Returns Err', 'Panics', 'Prints a usage error and exits with code 2', 'Uses the default value'], answer: 2, explanation: 'parse() handles errors itself: it prints the message to stderr and exits (code 2 for usage errors, 0 for --help/--version). Use try_parse to handle them yourself.' },
    { q: 'Where should a CLI write error messages?', options: ['stdout', 'stderr', 'A log file only', 'Both stdout and stderr'], answer: 1, explanation: 'stderr keeps errors out of the data stream that pipes and redirects capture from stdout.' },
    { q: 'Why is std::process::exit risky after writing to a BufWriter?', options: ['It returns the wrong code', 'Destructors do not run, so buffered output may be lost', 'It panics', 'It closes stdin'], answer: 1, explanation: 'exit terminates the process immediately; the BufWriter drop that would flush the buffer never runs.' },
    { q: 'How are git-style subcommands modelled with clap derive?', options: ['A Vec<String> field', 'An enum deriving Subcommand, referenced with #[command(subcommand)]', 'A HashMap of handlers', 'Separate binaries only'], answer: 1, explanation: 'Each enum variant is a subcommand and holds that subcommand\'s own arguments.' },
    { q: 'What happens to `println!` when the reading end of a pipe closes early?', options: ['Output is silently dropped', 'It panics with a broken pipe error', 'It blocks forever', 'It retries'], answer: 1, explanation: 'Rust ignores SIGPIPE, so the write fails with BrokenPipe and println! panics. Use writeln! and treat BrokenPipe as a normal end.' },
  ],
  qna: [
    { q: 'Why is Rust a popular choice for CLI tools?', a: 'Rust produces a single fast native binary with no runtime to install, starts instantly, and catches whole classes of bugs at compile time. Libraries like `clap`, `serde`, `anyhow` and `indicatif` make the developer experience pleasant, and tools such as ripgrep, fd, bat, starship and uv show it scales to widely used software.' },
    { q: 'How do you test a CLI built with clap?', a: 'Three layers. Test argument definitions with `Cli::try_parse_from([...])` and `Cli::command().debug_assert()`. Keep the logic in plain functions that take parsed arguments and readers/writers (`impl BufRead`, `impl Write`) so unit tests pass in-memory data. Finally, add a few end-to-end tests in `tests/` that run the built binary with `std::process::Command` (or `assert_cmd`) and check stdout, stderr and the exit code.' },
    { q: 'How should a CLI report errors and exit codes?', a: 'Print human-readable errors to stderr with enough context (which file, which operation) — `anyhow`\'s `.context()` makes this easy — and return a non-zero exit code. Keep 0 for success, use 1 for general failure and 2 for usage errors, and document any special codes scripts rely on. Return `ExitCode` from `main` rather than calling `process::exit` so buffers flush.' },
    { q: 'What is the difference between anyhow and thiserror for a CLI?', a: '`thiserror` derives `std::error::Error` for your own error enums — good for library code whose callers need to match on variants. `anyhow` is a single boxed error type with context chaining — ideal for the application layer of a CLI, where errors are ultimately printed for a human. Many CLIs use thiserror in their core library crate and anyhow in `main`.' },
  ],
  revision: {
    oneLiner: 'A good Rust CLI parses arguments with clap derive, streams stdin/stdout, prints errors with context to stderr, and returns meaningful exit codes.',
    mustKnow: [
      '`#[derive(Parser)]` + doc comments = arguments, validation and --help.',
      'Subcommands are an enum deriving `Subcommand`.',
      'Results to stdout, diagnostics to stderr (`eprintln!`).',
      'Use a locked `BufWriter` for heavy output; handle `BrokenPipe`.',
      'Return `ExitCode` from main; avoid `process::exit` with unflushed buffers.',
      '`anyhow::Context` gives errors a readable cause chain.',
    ],
    interviewFocus: [
      'Structure a CLI so its logic is unit-testable.',
      'Explain stdout vs stderr and exit-code conventions.',
      'Compare anyhow and thiserror.',
    ],
  },
};
