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
  selector: 'app-rust-error-handling',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './error-handling.html',
  styleUrl: './error-handling.scss'
})
export class RustErrorHandling {
  readingTime = 26;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Rust 2021+';
  route = 'rust-error-handling';

  quickRef: QuickRefItem[] = [
    { name: 'Result<T, E>', type: 'type', desc: 'An enum with variants Ok(T) for success and Err(E) for failure — the standard way to report recoverable errors' },
    { name: 'Option<T>', type: 'type', desc: 'An enum with variants Some(T) and None — for a value that may legitimately be absent' },
    { name: 'expr?', type: 'operator', desc: 'On an Err (or None) returns early from the function; on Ok (or Some) unwraps the value' },
    { name: '.unwrap()', type: 'method', desc: 'Returns the Ok value or panics on Err — fine in tests and prototypes, risky in real code' },
    { name: '.expect("msg")', type: 'method', desc: 'Like unwrap but panics with your message, documenting the assumption you are making' },
    { name: '.unwrap_or(default)', type: 'method', desc: 'Returns the Ok value, or the supplied default when the result is an Err' },
    { name: '.map_err(f)', type: 'method', desc: 'Transforms the error inside an Err, leaving an Ok untouched — useful to convert error types' },
    { name: '.ok_or(err)', type: 'method', desc: 'Turns an Option into a Result, using the given error for the None case' },
    { name: 'impl From<A> for B', type: 'syntax', desc: 'Tells the ? operator how to convert an error of type A into your error type B automatically' },
    { name: 'panic!("msg")', type: 'function', desc: 'Aborts the current thread with a message — for bugs and impossible states, not expected failures' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Two kinds of failure, two mechanisms',
      points: [
        'Rust has no exceptions. Failures you can reasonably recover from are returned as values of the type <code>Result&lt;T, E&gt;</code>; failures that mean a bug or an impossible state use <code>panic!</code>.',
        '<code>Result</code> is an ordinary enum: <code>enum Result&lt;T, E&gt; { Ok(T), Err(E) }</code>. Because failure is part of the return type, the compiler forces callers to acknowledge it — you cannot accidentally ignore an error path.',
        'A panic unwinds the stack of the current thread and prints a message. By default it unwinds and runs destructors, though a release profile can be configured to abort immediately instead.',
        'Missing files, invalid user input and network failures are EXPECTED and belong in a Result. An out-of-bounds index or a broken internal invariant is a bug and is a reasonable panic.',
        'There is no hidden control flow: every place an error can leave a function is visible in the code, either as a match, a method call or a question mark.',
      ]
    },
    {
      heading: 'Working with Result and Option',
      points: [
        'The most explicit way to handle a Result is <code>match</code> with an arm for Ok and an arm for Err. <code>if let Err(e) = result</code> handles just the failure case.',
        '<code>unwrap()</code> returns the Ok value or panics; <code>expect("message")</code> does the same but with your message. Both are appropriate in tests, examples and quick prototypes, and when a failure genuinely cannot happen.',
        '<code>unwrap_or(default)</code> and <code>unwrap_or_else(|| ...)</code> supply a fallback instead of panicking. The closure form only computes the fallback when it is actually needed.',
        'Combinators transform values without unpacking them: <code>map</code> changes the Ok value, <code>map_err</code> changes the error, and <code>and_then</code> chains a second fallible step.',
        '<code>ok_or(err)</code> converts an Option into a Result, and <code>.ok()</code> converts a Result into an Option, discarding the error. Together they let you move between the two types.',
      ]
    },
    {
      heading: 'The ? operator',
      points: [
        'Writing <code>?</code> after a Result expression means: if it is Ok, unwrap the value and continue; if it is Err, return that error from the current function immediately.',
        'It replaces a block of boilerplate match code with a single character, so a chain of fallible steps reads as straight-line code while still propagating every error.',
        'The error is converted on the way out using the <code>From</code> trait. If the function returns <code>Result&lt;T, MyError&gt;</code> and you implement <code>From&lt;ParseIntError&gt; for MyError</code>, then <code>?</code> converts automatically.',
        '<code>?</code> also works on Option, returning None early, but you cannot mix the two in one function without converting with ok_or.',
        'The question mark can only be used in a function whose return type can hold the failure. Using it in a function returning <code>()</code> is error E0277. The <code>main</code> function is allowed to return <code>Result&lt;(), E&gt;</code> so you can use ? there too.',
      ]
    },
    {
      heading: 'Designing your own error types',
      points: [
        'A good library error is usually an enum with one variant per kind of failure. Callers can match on it to react differently, which they cannot do with a plain String.',
        'To be a proper error type, implement <code>std::fmt::Display</code> for the human-readable message and the <code>std::error::Error</code> trait (often just an empty impl). Then it works with <code>Box&lt;dyn Error&gt;</code> and the wider ecosystem.',
        'Implement <code>From</code> for each underlying error you want to convert with ?, wrapping it in one of your variants. That single impl lets every ? in your code convert automatically.',
        'For a quick application or script, returning <code>Result&lt;T, Box&lt;dyn Error&gt;&gt;</code> lets ? accept any error type, at the cost of callers not being able to match on specific variants.',
        'The ecosystem offers helper crates: thiserror derives Display and Error for library error enums, and anyhow provides a convenient catch-all error type for applications. They are not part of the standard library but are extremely common.',
      ]
    },
    {
      heading: 'When to panic',
      points: [
        'Panic when continuing would be wrong or unsafe: a violated invariant, an impossible state, or a programming mistake such as an index out of bounds. These are bugs to fix, not conditions to handle.',
        'In tests, examples and prototypes, <code>unwrap</code> and <code>expect</code> are fine, because a failure there should stop everything and show up loudly.',
        'A library should almost never panic on bad input from its caller. Return a Result and let the application decide what to do.',
        'When you do use <code>expect</code>, phrase the message as the reason the operation should never fail, such as "config file is embedded at build time", so a panic explains itself.',
        'Set the environment variable RUST_BACKTRACE=1 to see the call stack when a panic occurs. If main itself returns an Err, the program prints Error: followed by the Debug form of the error and exits with a non-zero status.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Result Basics',
      language: 'rust',
      code: `use std::num::ParseIntError;

fn parse_age(s: &str) -> Result<u8, ParseIntError> {
    s.trim().parse::<u8>()
}

fn main() {
    // Explicit handling with match
    match parse_age("42") {
        Ok(age) => println!("age is {age}"),
        Err(e) => println!("bad age: {e}"),
    }
    match parse_age("abc") {
        Ok(age) => println!("age is {age}"),
        Err(e) => println!("bad age: {e}"), // invalid digit found in string
    }
    match parse_age("300") {
        Ok(age) => println!("age is {age}"),
        Err(e) => println!("bad age: {e}"), // number too large to fit in target type
    }

    // Fallbacks and combinators
    let a = parse_age("x").unwrap_or(0);
    let b = parse_age("7").map(|n| n * 2);
    println!("{a} {:?}", b); // 0 Ok(14)

    // expect documents the assumption; it panics with your message on Err
    let c = parse_age("21").expect("hard-coded age must be valid");
    println!("{c}");
}`
    },
    {
      label: 'The ? Operator',
      language: 'rust',
      code: `use std::fs;
use std::io;

// On Err, ? returns the error from read_username immediately
fn read_username(path: &str) -> Result<String, io::Error> {
    let text = fs::read_to_string(path)?;
    Ok(text.trim().to_string())
}

// ? also works on Option: None is returned early
fn first_char_upper(s: &str) -> Option<char> {
    let c = s.chars().next()?;
    Some(c.to_ascii_uppercase())
}

fn main() {
    match read_username("missing.txt") {
        Ok(name) => println!("user: {name}"),
        Err(e) => println!("could not read the file: {e}"),
    }

    println!("{:?}", first_char_upper("rust")); // Some('R')
    println!("{:?}", first_char_upper(""));      // None
}`
    },
    {
      label: 'Custom Error Types',
      language: 'rust',
      code: `use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
enum ConfigError {
    Missing(String),
    BadNumber(ParseIntError),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::Missing(key) => write!(f, "missing key: {key}"),
            ConfigError::BadNumber(e) => write!(f, "bad number: {e}"),
        }
    }
}

impl Error for ConfigError {}

// This impl is what lets ? convert a ParseIntError into a ConfigError
impl From<ParseIntError> for ConfigError {
    fn from(e: ParseIntError) -> Self {
        ConfigError::BadNumber(e)
    }
}

fn get_port(value: Option<&str>) -> Result<u16, ConfigError> {
    let raw = value.ok_or_else(|| ConfigError::Missing("port".to_string()))?;
    let port = raw.parse::<u16>()?; // ParseIntError -> ConfigError via From
    Ok(port)
}

// Box<dyn Error> accepts any error type, handy in applications
fn run() -> Result<(), Box<dyn Error>> {
    let port = get_port(Some("80"))?;
    println!("listening on {port}");
    Ok(())
}

fn main() {
    println!("{}", get_port(Some("8080")).unwrap()); // 8080
    if let Err(e) = get_port(None) {
        println!("{e}"); // missing key: port
    }
    if let Err(e) = get_port(Some("abc")) {
        println!("{e}"); // bad number: invalid digit found in string
    }
    run().unwrap();
}`
    },
    {
      label: 'panic vs Result',
      language: 'rust',
      code: `use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let v = vec![1, 2, 3];

    // Indexing panics on a bad index (a bug)...
    // let x = v[99];
    // thread main panicked: index out of bounds: the len is 3 but the index is 99

    // ...while get returns an Option you are forced to handle
    println!("{:?}", v.get(99)); // None

    let r: Result<i32, String> = Err("boom".to_string());
    // r.unwrap();
    // panics: called Result::unwrap() on an Err value: "boom"
    println!("{}", r.unwrap_or(-1)); // -1

    // main can return a Result. If this were an Err, the program would
    // print "Error: ..." (the Debug form) and exit with a non-zero status.
    let n: i32 = "42".parse()?;
    println!("{n}");
    Ok(())
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Sprinkling unwrap() through code that handles real input',
      wrong: `fn load_port() -> u16 {
    let text = std::fs::read_to_string("port.txt").unwrap();
    text.trim().parse().unwrap()
}
// A missing file or bad contents crashes the whole program`,
      right: `fn load_port() -> Result<u16, Box<dyn std::error::Error>> {
    let text = std::fs::read_to_string("port.txt")?;
    Ok(text.trim().parse()?)
}`,
      explanation: 'unwrap turns an expected, recoverable failure into a crash. Return a Result and let the caller decide, reserving unwrap and expect for tests, prototypes and cases that truly cannot fail.'
    },
    {
      title: 'Using ? in a function that returns ()',
      wrong: `fn main() {
    let n: i32 = "42".parse()?;
    println!("{n}");
}
// error[E0277]: the ? operator can only be used in a function that returns Result or Option`,
      right: `fn main() -> Result<(), Box<dyn std::error::Error>> {
    let n: i32 = "42".parse()?;
    println!("{n}");
    Ok(())
}`,
      explanation: 'The question mark has to return the error to someone, so the function must have a return type that can hold it. Change the signature to return a Result, or handle the error locally with match.'
    },
    {
      title: 'Silently ignoring a Result',
      wrong: `std::fs::remove_file("old.log");
// warning: unused Result that must be used
// the deletion may have failed and nobody will ever know`,
      right: `if let Err(e) = std::fs::remove_file("old.log") {
    eprintln!("could not delete old.log: {e}");
}`,
      explanation: 'Result is marked must_use, so the compiler warns when you drop one on the floor. Either handle the error, propagate it with ?, or, if you truly do not care, discard it explicitly with let _ = so the decision is visible.'
    },
    {
      title: 'Using ? across error types with no conversion',
      wrong: `fn parse(s: &str) -> Result<i32, String> {
    let n = s.parse::<i32>()?;
    Ok(n)
}
// error[E0277]: ? couldn't convert the error to String`,
      right: `fn parse(s: &str) -> Result<i32, String> {
    let n = s.parse::<i32>().map_err(|e| e.to_string())?;
    Ok(n)
}`,
      explanation: 'The question mark converts errors through the From trait, and String has no From impl for ParseIntError. Convert explicitly with map_err, or define a proper error type with a From impl so the conversion is automatic.'
    },
    {
      title: 'Panicking on input that users can legitimately get wrong',
      wrong: `fn set_age(age: i32) -> u8 {
    if age < 0 || age > 150 {
        panic!("invalid age");
    }
    age as u8
}`,
      right: `fn set_age(age: i32) -> Result<u8, String> {
    if !(0..=150).contains(&age) {
        return Err(format!("age {age} is out of range"));
    }
    Ok(age as u8)
}`,
      explanation: 'Bad input from a user, a file or the network is normal and expected, not a bug in your program. Report it as a Result so the caller can show a message or retry, instead of taking the whole thread down.'
    },
    {
      title: 'Returning a boxed error from a library',
      wrong: `pub fn load(path: &str) -> Result<Config, Box<dyn std::error::Error>> {
    // callers cannot tell a missing file from a syntax error
}`,
      right: `pub enum LoadError {
    Io(std::io::Error),
    Syntax(String),
}

pub fn load(path: &str) -> Result<Config, LoadError> {
    // callers can match on the variant
}`,
      explanation: 'Box of dyn Error is perfect for applications where you just want to report a message. A library should expose a concrete error enum so that callers can react differently to different failures.'
    },
  ];

  challenge: Challenge = {
    title: 'Sum a Comma-Separated List',
    language: 'rust',
    description: `Write a function that adds up a comma-separated list of integers and reports errors as values.

Define \`enum SumError { Empty, BadNumber(String) }\` deriving Debug and PartialEq, and \`fn sum_numbers(input: &str) -> Result<i64, SumError>\`.

Rules:
- If \`input\` is empty or only whitespace, return \`Err(SumError::Empty)\`.
- Split on commas and trim each part. If a part is not a valid integer, return \`Err(SumError::BadNumber(part))\` holding that trimmed text.
- Otherwise return \`Ok(total)\`.

Example:
\`\`\`
sum_numbers("1, 2, 3")  // Ok(6)
sum_numbers("10,-4")    // Ok(6)
sum_numbers("")         // Err(Empty)
sum_numbers("1, x, 3")  // Err(BadNumber("x"))
\`\`\``,
    hints: [
      'Check for emptiness first with input.trim().is_empty() and return early.',
      'Loop over input.split(\',\'), trimming each part before parsing.',
      'part.parse() returns a Result with ParseIntError, so use map_err to turn it into SumError::BadNumber(part.to_string()).',
      'Put the ? after map_err so the loop returns the error immediately; annotate the variable as i64 so parse knows what to produce.',
    ],
    starterCode: `#[derive(Debug, PartialEq)]
enum SumError {
    Empty,
    BadNumber(String),
}

fn sum_numbers(input: &str) -> Result<i64, SumError> {
    // TODO
    Ok(0)
}

fn main() {
    println!("{:?}", sum_numbers("1, 2, 3"));
    println!("{:?}", sum_numbers("10,-4"));
    println!("{:?}", sum_numbers(""));
    println!("{:?}", sum_numbers("1, x, 3"));
}`,
    solution: `#[derive(Debug, PartialEq)]
enum SumError {
    Empty,
    BadNumber(String),
}

fn sum_numbers(input: &str) -> Result<i64, SumError> {
    if input.trim().is_empty() {
        return Err(SumError::Empty);
    }
    let mut total = 0i64;
    for part in input.split(',') {
        let part = part.trim();
        let n: i64 = part
            .parse()
            .map_err(|_| SumError::BadNumber(part.to_string()))?;
        total += n;
    }
    Ok(total)
}

fn main() {
    println!("{:?}", sum_numbers("1, 2, 3"));  // Ok(6)
    println!("{:?}", sum_numbers("10,-4"));    // Ok(6)
    println!("{:?}", sum_numbers(""));         // Err(Empty)
    println!("{:?}", sum_numbers("1, x, 3"));  // Err(BadNumber("x"))
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is Result<T, E> in Rust?',
      options: [
        'A special keyword that throws exceptions',
        'An ordinary enum with variants Ok(T) and Err(E)',
        'A pointer type',
        'A trait',
      ],
      answer: 1,
      explanation: 'Result is a normal enum from the standard library. Because success and failure are both part of the return type, the compiler forces callers to deal with the error case.'
    },
    {
      q: 'What does the ? operator do when applied to an Err value?',
      options: [
        'Converts it to None',
        'Panics with the error message',
        'Ignores the error and continues',
        'Returns the error from the enclosing function immediately (converting it with From)',
      ],
      answer: 3,
      explanation: 'On Err it performs an early return of that error, converting it to the function\'s error type through the From trait. On Ok it simply unwraps the value and execution continues.'
    },
    {
      q: 'Why does using ? inside fn main() with no return type fail to compile?',
      options: [
        'The function has nowhere to return the error, because its return type is ()',
        '? only works on Option',
        '? requires unsafe',
        'main cannot use operators',
      ],
      answer: 0,
      explanation: 'The question mark returns the error to the caller, so the function needs a return type such as Result. Changing main to return Result of unit and a boxed error fixes it.'
    },
    {
      q: 'What does unwrap() do on an Err value?',
      options: [
        'Returns the error as a String',
        'Returns a default value',
        'Panics',
        'Retries the operation',
      ],
      answer: 2,
      explanation: 'unwrap returns the Ok value or panics on Err. It is convenient in tests and prototypes but turns a recoverable failure into a crash in production code.'
    },
    {
      q: 'Which situation is a good fit for panic! rather than returning a Result?',
      options: [
        'A network request timed out',
        'A user typed an invalid number',
        'A configuration file is missing',
        'An internal invariant that must always hold has been violated (a bug)',
      ],
      answer: 3,
      explanation: 'Expected failures caused by the outside world belong in a Result. A panic is for bugs, where the program has reached a state it should never be in.'
    },
    {
      q: 'What makes ? convert a ParseIntError into your own error enum automatically?',
      options: [
        'A From<ParseIntError> implementation for your enum',
        'The derive Debug attribute',
        'The unwrap_or method',
        'Nothing — it always fails',
      ],
      answer: 0,
      explanation: 'The question mark calls From::from on the error. Implementing From for each underlying error type you want to convert lets every ? in your code wrap it into the right variant.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why does Rust use Result instead of exceptions?',
      a: 'Because errors become part of the type system. A function that can fail says so in its signature, callers cannot forget to handle the failure, and there is no hidden control flow where an exception flies past several stack frames. Errors are ordinary values you can store, transform, and pass around like any other data.'
    },
    {
      q: 'What is the difference between unwrap and expect?',
      a: 'Both return the inner value or panic. expect lets you supply a message, so a panic explains what assumption was broken instead of just saying the value was None or Err. Prefer expect over unwrap outside throwaway code, and word the message as the reason the operation should never fail.'
    },
    {
      q: 'When should I use Box<dyn Error> and when a custom error enum?',
      a: 'Use Box of dyn Error in applications and scripts, where you mostly want to propagate anything and print a message. Use a custom enum in libraries, or wherever callers need to react differently to different failures, because they can match on the variants. Crates such as anyhow and thiserror automate each of these styles.'
    },
    {
      q: 'What happens when a panic occurs?',
      a: 'By default the thread unwinds: it prints the message, runs destructors while the stack unwinds, and then ends. If it is the main thread, the process exits with a non-zero status. A release profile can set panic to abort, which skips unwinding for smaller binaries. Panics in other threads can be observed through the join result.'
    },
    {
      q: 'Can I use ? with Option and Result together?',
      a: 'Not directly, because the early return type must match the function. Convert one to the other first: ok_or or ok_or_else turns an Option into a Result, and .ok() turns a Result into an Option. After that the question mark works within a single function return type.'
    },
    {
      q: 'What does it mean that Result is must_use?',
      a: 'The Result type is annotated so that the compiler warns whenever a value of that type is created and then dropped without being used. It stops you silently ignoring a failure. If you intentionally do not care, write let _ = the_call(); so the choice is explicit.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Recoverable failures are returned as Result values and propagated with ?, while panic! is reserved for bugs and impossible states.',
    mustKnow: [
      '<code>Result&lt;T, E&gt;</code> and <code>Option&lt;T&gt;</code> are ordinary enums — there are no exceptions',
      '? unwraps Ok/Some or returns the Err/None early, converting the error with <code>From</code>',
      'The question mark needs a compatible return type; main may return <code>Result&lt;(), E&gt;</code>',
      'unwrap and expect panic on failure — fine in tests and prototypes, avoid them for real input',
      'Custom errors implement Display and Error, plus From for each error they wrap',
      'Use <code>Box&lt;dyn Error&gt;</code> in applications and an error enum in libraries',
      'Panic for bugs and broken invariants; return Result for expected failures',
    ],
    interviewFocus: [
      'Explain how the ? operator works and which trait powers the error conversion',
      'When is unwrap acceptable and when is it a code smell?',
      'How would you design the error type for a library versus an application?',
      'What is the difference between a recoverable error and a panic?',
      'How do you convert between Option and Result?',
    ],
  };
}
