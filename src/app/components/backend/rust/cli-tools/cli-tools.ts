import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-rust-cli-tools',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cli-tools.html',
  styleUrl: './cli-tools.scss'
})
export class RustCliTools {
  readingTime = 22;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = "Rust 2024";
  route = 'rust-cli-tools';
  nextRoute = '/rust/wasm';
  nextLabel = "WASM with Rust";

  quickRef: QuickRefItem[] = [
    {
      "name": "#[derive(Parser)] struct Cli",
      "type": "decorator",
      "desc": "Turn a struct into an argument parser with generated --help and --version"
    },
    {
      "name": "Cli::parse()",
      "type": "function",
      "desc": "Parse std::env::args, printing help or errors and exiting on failure"
    },
    {
      "name": "#[arg(short, long)]",
      "type": "decorator",
      "desc": "Accept -v / --verbose; long names come from the field name"
    },
    {
      "name": "#[arg(default_value_t = 10)]",
      "type": "decorator",
      "desc": "Default for a typed option"
    },
    {
      "name": "#[command(subcommand)] + #[derive(Subcommand)] enum",
      "type": "decorator",
      "desc": "git-style subcommands, one enum variant each"
    },
    {
      "name": "#[arg(value_enum)] + #[derive(ValueEnum)]",
      "type": "decorator",
      "desc": "Restrict an option to a fixed set of values"
    },
    {
      "name": "std::io::stdin().lines()",
      "type": "method",
      "desc": "Iterate input lines (Result<String> each)"
    },
    {
      "name": "BufWriter::new(stdout.lock())",
      "type": "class",
      "desc": "Buffered, locked output for many writes"
    },
    {
      "name": "fn main() -> ExitCode",
      "type": "function",
      "desc": "Return a specific process exit status"
    },
    {
      "name": ".with_context(|| format!(...))?",
      "type": "method",
      "desc": "anyhow: attach a human-readable cause to an error"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "Arguments with clap",
      "points": [
        "clap 4 with the <code>derive</code> feature generates a full parser from a struct: field types decide the parsing (<code>u32</code>, <code>PathBuf</code>, <code>bool</code> flags, <code>Option&lt;T&gt;</code> for optional values, <code>Vec&lt;T&gt;</code> for repeated values) and doc comments become <code>--help</code> text.",
        "Positional arguments are plain fields; <code>#[arg(short, long)]</code> makes an option. <code>#[command(version, about)]</code> on the struct reads the version and description from <code>Cargo.toml</code>.",
        "Subcommands are an enum deriving <code>Subcommand</code>, with each variant holding its own arguments — the same shape as <code>git commit -m</code> or <code>cargo build --release</code>.",
        "Validation happens before your code runs: a non-numeric <code>--count</code>, a missing required argument or an unknown flag prints a clear error and exits with code 2.",
        "<code>Cli::try_parse_from([\"prog\", \"--count\", \"3\"])</code> parses from any iterator — that is how you unit-test the argument definitions."
      ]
    },
    {
      "heading": "Input and output",
      "points": [
        "Follow the Unix conventions: read from stdin when no file is given (or when the file is <code>-</code>), write results to stdout, and write diagnostics to stderr with <code>eprintln!</code>.",
        "<code>std::io::stdin().lines()</code> yields <code>io::Result&lt;String&gt;</code> per line. Read whole files with <code>std::fs::read_to_string</code> or stream large ones with <code>BufReader::new(File::open(path)?)</code>.",
        "<code>println!</code> locks stdout for every call. For many lines, take <code>let mut out = BufWriter::new(io::stdout().lock())</code> once and use <code>writeln!(out, ...)?</code> — often several times faster.",
        "When the reader of a pipe exits early, writes fail with <code>BrokenPipe</code>. Rust ignores SIGPIPE, so a <code>println!</code> panics there; returning the <code>io::Error</code> and treating <code>BrokenPipe</code> as a normal exit keeps the tool quiet."
      ]
    },
    {
      "heading": "Errors and exit codes",
      "points": [
        "Application code commonly uses <code>anyhow::Result&lt;T&gt;</code> and <code>.with_context(|| format!(\"reading {path:?}\"))?</code>, so an error message reads like \"reading config.toml: No such file or directory\".",
        "<code>fn main() -&gt; anyhow::Result&lt;()&gt;</code> prints <code>Error: ...</code> with the context chain and exits with code 1. For more control return <code>std::process::ExitCode</code> and print the error yourself.",
        "Use distinct exit codes when scripts need to react: 0 for success, 1 for general failure, 2 for usage errors (clap's choice), and documented codes like <code>grep</code>'s \"1 = no match\".",
        "<code>std::process::exit</code> skips destructors, so buffered writers may not flush. Prefer returning an <code>ExitCode</code> from <code>main</code>."
      ]
    },
    {
      "heading": "Shipping a CLI",
      "points": [
        "<code>cargo install --path .</code> installs your binary locally; <code>cargo install &lt;crate&gt;</code> installs from crates.io. Build release binaries with <code>cargo build --release</code> for real performance.",
        "Static single-file binaries are a major reason Rust is popular for CLIs (ripgrep, fd, bat, uv). Cross-compile with <code>rustup target add</code> plus a linker, or tools like <code>cross</code> and <code>cargo-dist</code>.",
        "Test the binary end to end with <code>std::process::Command</code> in <code>tests/</code> (or crates like <code>assert_cmd</code>), and keep the core logic in a library function that unit tests call directly.",
        "Helpful extras: <code>indicatif</code> progress bars, <code>colored</code>/<code>anstream</code> for colour (respecting <code>NO_COLOR</code>), <code>dialoguer</code> prompts and <code>clap_complete</code> for shell completions."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "clap derive",
      "code": "use clap::{Parser, Subcommand, ValueEnum};\nuse std::path::PathBuf;\n\n/// A tiny task manager\n#[derive(Parser, Debug)]\n#[command(version, about)]\nstruct Cli {\n    /// Path to the task file\n    #[arg(short, long, default_value = \"tasks.json\")]\n    file: PathBuf,\n\n    /// Print extra information\n    #[arg(short, long)]\n    verbose: bool,\n\n    #[command(subcommand)]\n    command: Command,\n}\n\n#[derive(Subcommand, Debug)]\nenum Command {\n    /// Add a task\n    Add { title: String, #[arg(long, value_enum, default_value_t = Priority::Normal)] priority: Priority },\n    /// List tasks\n    List { #[arg(long, default_value_t = 10)] limit: usize },\n    /// Mark a task done\n    Done { id: u32 },\n}\n\n#[derive(ValueEnum, Clone, Debug)]\nenum Priority { Low, Normal, High }\n\nfn main() {\n    // In a real program: let cli = Cli::parse();\n    let cli = Cli::try_parse_from([\"todo\", \"-v\", \"add\", \"write docs\", \"--priority\", \"high\"]).unwrap();\n    println!(\"{cli:?}\");\n\n    let err = Cli::try_parse_from([\"todo\", \"list\", \"--limit\", \"ten\"]).unwrap_err();\n    println!(\"exit code {}: {}\", err.exit_code(), err.kind());\n}",
      "language": "rust"
    },
    {
      "label": "stdin, stdout, exit codes",
      "code": "use std::io::{self, BufRead, BufWriter, Write};\nuse std::process::ExitCode;\n\n// A grep-like filter: prints matching lines, exit 0 if any matched, 1 if none, 2 on error\nfn run(pattern: &str) -> io::Result<bool> {\n    let stdin = io::stdin();\n    let mut out = BufWriter::new(io::stdout().lock());\n    let mut found = false;\n    for line in stdin.lock().lines() {\n        let line = line?;\n        if line.contains(pattern) {\n            found = true;\n            writeln!(out, \"{line}\")?;\n        }\n    }\n    out.flush()?;\n    Ok(found)\n}\n\nfn main() -> ExitCode {\n    let Some(pattern) = std::env::args().nth(1) else {\n        eprintln!(\"usage: minigrep PATTERN < input\");\n        return ExitCode::from(2);\n    };\n    match run(&pattern) {\n        Ok(true) => ExitCode::SUCCESS,\n        Ok(false) => ExitCode::from(1),\n        Err(e) if e.kind() == io::ErrorKind::BrokenPipe => ExitCode::SUCCESS, // reader went away\n        Err(e) => {\n            eprintln!(\"minigrep: {e}\");\n            ExitCode::from(2)\n        }\n    }\n}",
      "language": "rust"
    },
    {
      "label": "anyhow context",
      "code": "use anyhow::{Context, Result, bail};\nuse std::fs;\n\n#[derive(Debug)]\nstruct Config { port: u16 }\n\nfn load_config(path: &str) -> Result<Config> {\n    let text = fs::read_to_string(path)\n        .with_context(|| format!(\"reading config file {path}\"))?;\n    let port: u16 = text.trim().strip_prefix(\"port=\")\n        .context(\"expected a line like port=8080\")?\n        .parse()\n        .context(\"port must be a number between 0 and 65535\")?;\n    if port < 1024 {\n        bail!(\"port {port} needs root; use 1024 or higher\");\n    }\n    Ok(Config { port })\n}\n\nfn main() {\n    let dir = std::env::temp_dir();\n    let good = dir.join(\"cli_demo_good.conf\");\n    let bad = dir.join(\"cli_demo_bad.conf\");\n    fs::write(&good, \"port=8080\").unwrap();\n    fs::write(&bad, \"port=eighty\").unwrap();\n\n    println!(\"{:?}\", load_config(good.to_str().unwrap()).unwrap());\n    for p in [bad.to_str().unwrap(), \"/no/such/file.conf\"] {\n        // {:#} prints the whole context chain on one line\n        println!(\"error: {:#}\", load_config(p).unwrap_err());\n    }\n}",
      "language": "rust"
    }
  ];

  mistakes: CommonMistake[] = [
    {
      "title": "Writing errors to stdout",
      "wrong": "if !path.exists() {\n    println!(\"error: {path:?} not found\");   // ends up in the piped data\n    std::process::exit(1);\n}",
      "right": "if !path.exists() {\n    eprintln!(\"error: {path:?} not found\");\n    return ExitCode::FAILURE;\n}",
      "explanation": "stdout is the data channel other programs consume (tool | jq). Errors and progress belong on stderr, and returning ExitCode lets destructors such as BufWriter flush."
    },
    {
      "title": "println! in a hot loop",
      "wrong": "for line in lines {\n    println!(\"{line}\");        // locks and may flush stdout every line\n}",
      "right": "let mut out = BufWriter::new(io::stdout().lock());\nfor line in lines {\n    writeln!(out, \"{line}\")?;\n}\nout.flush()?;",
      "explanation": "println! locks stdout and, when the output is a terminal, line-buffers each write. A locked BufWriter batches writes and is dramatically faster for large outputs."
    },
    {
      "title": "Parsing std::env::args by hand",
      "wrong": "let args: Vec<String> = std::env::args().collect();\nlet count: usize = args[2].parse().unwrap();  // panics on a missing or bad argument",
      "right": "#[derive(clap::Parser)]\nstruct Cli { #[arg(short, long, default_value_t = 1)] count: usize }\nlet cli = Cli::parse();   // help, errors and exit code 2 for free",
      "explanation": "Hand-rolled parsing panics on bad input and has no --help. clap validates types, reports friendly errors and documents the interface from the struct."
    },
    {
      "title": "Using process::exit after buffered writes",
      "wrong": "let mut out = BufWriter::new(io::stdout());\nwriteln!(out, \"result\")?;\nstd::process::exit(0);   // destructors skipped: output may never be flushed",
      "right": "let mut out = BufWriter::new(io::stdout());\nwriteln!(out, \"result\")?;\nout.flush()?;\nreturn Ok(());           // or return ExitCode from main",
      "explanation": "process::exit terminates immediately without running destructors, so data still in the BufWriter is lost. Return from main instead."
    },
    {
      "title": "Errors without context",
      "wrong": "let text = fs::read_to_string(path)?;\n// Error: No such file or directory (os error 2)   -- which file?",
      "right": "let text = fs::read_to_string(&path)\n    .with_context(|| format!(\"reading {}\", path.display()))?;\n// Error: reading ./tasks.json: No such file or directory (os error 2)",
      "explanation": "io::Error does not include the path. Attaching context with anyhow tells the user exactly which operation failed on which file."
    }
  ];

  challenge: Challenge = {
    "title": "A word-count CLI core",
    "language": "rust",
    "description": "Define a clap Cli with an optional positional FILE (read stdin when absent), and flags -l/--lines, -w/--words and -c/--chars; when no flag is given, report all three. Write fn count(text: &str, cli: &Cli) -> String that returns the selected counts separated by spaces in the order lines, words, chars. Test it in main with Cli::try_parse_from instead of real arguments.",
    "hints": [
      "file: Option<PathBuf> as a positional field; lines/words/chars: bool with #[arg(short, long)].",
      "If none of the flags is set, treat all three as set.",
      "chars() counts Unicode scalar values; lines() ignores a trailing newline."
    ],
    "starterCode": "use clap::Parser;\nuse std::path::PathBuf;\n\n#[derive(Parser, Debug)]\nstruct Cli {\n    // TODO\n}\n\nfn count(text: &str, cli: &Cli) -> String {\n    todo!()\n}\n\nfn main() {\n    let text = \"hello wörld\\nsecond line\\n\";\n    let cli = Cli::try_parse_from([\"wc\", \"-w\"]).unwrap();\n    println!(\"{}\", count(text, &cli));\n}",
    "solution": "use clap::Parser;\nuse std::path::PathBuf;\n\n/// Count lines, words and characters\n#[derive(Parser, Debug)]\nstruct Cli {\n    /// File to read (stdin if omitted)\n    file: Option<PathBuf>,\n    #[arg(short, long)]\n    lines: bool,\n    #[arg(short, long)]\n    words: bool,\n    #[arg(short, long)]\n    chars: bool,\n}\n\nfn count(text: &str, cli: &Cli) -> String {\n    let all = !cli.lines && !cli.words && !cli.chars;\n    let mut parts = Vec::new();\n    if all || cli.lines { parts.push(text.lines().count().to_string()); }\n    if all || cli.words { parts.push(text.split_whitespace().count().to_string()); }\n    if all || cli.chars { parts.push(text.chars().count().to_string()); }\n    parts.join(\" \")\n}\n\nfn main() {\n    let text = \"hello wörld\\nsecond line\\n\";\n    for args in [vec![\"wc\"], vec![\"wc\", \"-w\"], vec![\"wc\", \"-l\", \"-c\", \"notes.txt\"]] {\n        let cli = Cli::try_parse_from(args).unwrap();\n        println!(\"{:?} -> {}\", cli.file, count(text, &cli));\n    }\n    // None -> 2 4 24\n    // None -> 4\n    // Some(\"notes.txt\") -> 2 24\n}"
  };

  quiz: QuizQuestion[] = [
    {
      "q": "What does Cli::parse() do when the user passes an invalid value?",
      "options": [
        "Returns Err",
        "Panics",
        "Prints a usage error and exits with code 2",
        "Uses the default value"
      ],
      "answer": 2,
      "explanation": "parse() handles errors itself: it prints the message to stderr and exits (code 2 for usage errors, 0 for --help/--version). Use try_parse to handle them yourself."
    },
    {
      "q": "Where should a CLI write error messages?",
      "options": [
        "stdout",
        "stderr",
        "A log file only",
        "Both stdout and stderr"
      ],
      "answer": 1,
      "explanation": "stderr keeps errors out of the data stream that pipes and redirects capture from stdout."
    },
    {
      "q": "Why is std::process::exit risky after writing to a BufWriter?",
      "options": [
        "It returns the wrong code",
        "Destructors do not run, so buffered output may be lost",
        "It panics",
        "It closes stdin"
      ],
      "answer": 1,
      "explanation": "exit terminates the process immediately; the BufWriter drop that would flush the buffer never runs."
    },
    {
      "q": "How are git-style subcommands modelled with clap derive?",
      "options": [
        "A Vec<String> field",
        "An enum deriving Subcommand, referenced with #[command(subcommand)]",
        "A HashMap of handlers",
        "Separate binaries only"
      ],
      "answer": 1,
      "explanation": "Each enum variant is a subcommand and holds that subcommand's own arguments."
    },
    {
      "q": "What happens to println! when the reading end of a pipe closes early?",
      "options": [
        "Output is silently dropped",
        "It panics with a broken pipe error",
        "It blocks forever",
        "It retries"
      ],
      "answer": 1,
      "explanation": "Rust ignores SIGPIPE, so the write fails with BrokenPipe and println! panics. Use writeln! and treat BrokenPipe as a normal end."
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "Why is Rust a popular choice for CLI tools?",
      "a": "Rust produces a single fast native binary with no runtime to install, starts instantly, and catches whole classes of bugs at compile time. Libraries like <code>clap</code>, <code>serde</code>, <code>anyhow</code> and <code>indicatif</code> make the developer experience pleasant, and tools such as ripgrep, fd, bat, starship and uv show it scales to widely used software."
    },
    {
      "q": "How do you test a CLI built with clap?",
      "a": "Three layers. Test argument definitions with <code>Cli::try_parse_from([...])</code> and <code>Cli::command().debug_assert()</code>. Keep the logic in plain functions that take parsed arguments and readers/writers (<code>impl BufRead</code>, <code>impl Write</code>) so unit tests pass in-memory data. Finally, add a few end-to-end tests in <code>tests/</code> that run the built binary with <code>std::process::Command</code> (or <code>assert_cmd</code>) and check stdout, stderr and the exit code."
    },
    {
      "q": "How should a CLI report errors and exit codes?",
      "a": "Print human-readable errors to stderr with enough context (which file, which operation) — <code>anyhow</code>'s <code>.context()</code> makes this easy — and return a non-zero exit code. Keep 0 for success, use 1 for general failure and 2 for usage errors, and document any special codes scripts rely on. Return <code>ExitCode</code> from <code>main</code> rather than calling <code>process::exit</code> so buffers flush."
    },
    {
      "q": "What is the difference between anyhow and thiserror for a CLI?",
      "a": "<code>thiserror</code> derives <code>std::error::Error</code> for your own error enums — good for library code whose callers need to match on variants. <code>anyhow</code> is a single boxed error type with context chaining — ideal for the application layer of a CLI, where errors are ultimately printed for a human. Many CLIs use thiserror in their core library crate and anyhow in <code>main</code>."
    }
  ];

  revision: RevisionSummary = {
    "oneLiner": "A good Rust CLI parses arguments with clap derive, streams stdin/stdout, prints errors with context to stderr, and returns meaningful exit codes.",
    "mustKnow": [
      "<code>#[derive(Parser)]</code> + doc comments = arguments, validation and --help.",
      "Subcommands are an enum deriving <code>Subcommand</code>.",
      "Results to stdout, diagnostics to stderr (<code>eprintln!</code>).",
      "Use a locked <code>BufWriter</code> for heavy output; handle <code>BrokenPipe</code>.",
      "Return <code>ExitCode</code> from main; avoid <code>process::exit</code> with unflushed buffers.",
      "<code>anyhow::Context</code> gives errors a readable cause chain."
    ],
    "interviewFocus": [
      "Structure a CLI so its logic is unit-testable.",
      "Explain stdout vs stderr and exit-code conventions.",
      "Compare anyhow and thiserror."
    ]
  };
}
