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
  selector: 'app-rust-pattern-matching',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './pattern-matching.html',
  styleUrl: './pattern-matching.scss'
})
export class RustPatternMatching {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = 'Rust 2021+';
  route = 'rust-pattern-matching';

  quickRef: QuickRefItem[] = [
    { name: 'match value { pat => expr, ... }', type: 'keyword', desc: 'Compares a value against patterns in order and runs the first arm that matches — must be exhaustive' },
    { name: '_', type: 'syntax', desc: 'The wildcard pattern — matches anything and binds nothing, usually the last arm' },
    { name: 'if let PATTERN = value { ... }', type: 'syntax', desc: 'Runs the block only when one specific pattern matches — a match with a single arm of interest' },
    { name: 'while let Some(x) = stack.pop()', type: 'syntax', desc: 'Loops for as long as the pattern keeps matching, ending on the first mismatch' },
    { name: 'let PATTERN = value else { ... };', type: 'syntax', desc: 'Binds on a match; the else block must diverge (return, break, continue or panic)' },
    { name: '1 | 2 | 3', type: 'operator', desc: 'An or-pattern — matches if any of the alternatives matches' },
    { name: '1..=5', type: 'operator', desc: 'An inclusive range pattern, usable with integers and chars' },
    { name: 'n @ 1..=5', type: 'operator', desc: 'Binds the matched value to n while also testing it against a sub-pattern' },
    { name: 'Some(n) if n > 0', type: 'syntax', desc: 'A match guard — an extra boolean condition that must also hold for the arm to run' },
    { name: 'matches!(value, pattern)', type: 'function', desc: 'A macro that returns true or false for whether a value matches a pattern' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'match — exhaustive branching',
      points: [
        '<code>match</code> compares a value against a series of patterns, top to bottom, and runs the arm of the FIRST pattern that matches. It is an expression, so every arm must produce the same type.',
        'A match must be EXHAUSTIVE: every possible value has to be covered by some arm. If you forget a variant, the compiler stops with error E0004 (non-exhaustive patterns) and tells you which case is missing.',
        'This is what makes adding a new enum variant safe. Every match on that enum that has no wildcard arm fails to compile until you decide how to handle the new case.',
        'The wildcard <code>_</code> matches anything and binds nothing. Use it as the last arm for "everything else" — but remember it also silently swallows any variant you add later.',
        'Matching on a value moves it if the pattern binds by value and the type is not Copy. Match on a reference (<code>match &amp;value</code>) when you still need the original afterwards.',
      ]
    },
    {
      heading: 'The pattern language',
      points: [
        'Literal patterns match exact values: <code>0</code>, <code>\'a\'</code>, <code>"quit"</code>. A plain identifier like <code>n</code> is different — it matches anything and BINDS the value to a new variable named n.',
        'Or-patterns use a pipe: <code>1 | 2 | 3</code> matches any of the three. Range patterns use <code>..=</code>: <code>4..=99</code> matches 4 through 99 inclusive, for integers and chars.',
        'The <code>@</code> operator binds a value while also testing it: <code>n @ 1..=5</code> matches a value in that range and gives it the name n so you can use it inside the arm.',
        'The <code>..</code> pattern ignores the remaining fields or elements, as in <code>Point { x, .. }</code> or <code>[first, .., last]</code>. A leading underscore in a name, like <code>_unused</code>, binds but silences the unused-variable warning.',
        'Patterns come in two kinds: irrefutable patterns that can never fail (used by plain <code>let</code> and function parameters) and refutable patterns that might not match (used by match arms, <code>if let</code> and <code>while let</code>).',
      ]
    },
    {
      heading: 'Destructuring structs, tuples, enums and references',
      points: [
        'Patterns can take a value apart. <code>let Point { x, y } = p;</code> pulls both fields out, and <code>let (a, b) = pair;</code> does the same for a tuple.',
        'Enum variants destructure the same way, and patterns nest to any depth: <code>Shape::Circle { center: Point { x, y }, radius }</code> reaches straight through to the inner fields.',
        'Fields can be matched against literals while others are bound: <code>Point { x: 0, y }</code> matches only points on the y axis and binds their y coordinate.',
        'Function parameters are patterns too, so <code>fn print(&amp;(x, y): &amp;(i32, i32))</code> destructures its argument right in the signature.',
        'Slice patterns match arrays and slices by shape: <code>[first, .., last]</code>, <code>[only]</code>, or <code>["say", rest @ ..]</code> to capture the tail. This is excellent for parsing simple commands.',
      ]
    },
    {
      heading: 'Guards and binding modes',
      points: [
        'A match guard adds an extra condition after a pattern: <code>Some(n) if n &lt; 0 =&gt; ...</code>. The arm runs only if the pattern matches AND the guard is true; otherwise matching moves on to the next arm.',
        'The compiler does NOT reason about guards when checking exhaustiveness. Two guarded arms that together cover every number are still rejected, so you still need an unguarded final arm.',
        'When you match on a reference such as <code>&amp;Option&lt;String&gt;</code>, "match ergonomics" automatically binds the inner values as references, so <code>Some(n)</code> gives you an <code>&amp;String</code> and nothing is moved.',
        'When you match on the value itself, a non-Copy inner value is moved into the binding. The original becomes partially moved and cannot be used afterwards.',
        'To match on a String you compare against string literals through a slice: <code>match s.as_str() { "start" =&gt; ..., _ =&gt; ... }</code>, because the patterns are string slices, not owned Strings.',
      ]
    },
    {
      heading: 'if let, while let, let-else and matches!',
      points: [
        '<code>if let Some(x) = opt { ... }</code> is shorthand for a match with one interesting arm and an ignored catch-all. It reads better when you only care about one case, at the price of giving up exhaustiveness checking.',
        '<code>while let Some(top) = stack.pop()</code> repeats a block for as long as the pattern matches, and stops the first time it does not — a natural fit for draining a stack or an iterator.',
        '<code>let Some(x) = opt else { return; };</code> (let-else, stable since Rust 1.65) binds on success and runs a diverging else block on failure. It keeps the happy path unindented, unlike nested if-let.',
        '<code>matches!(value, pattern)</code> is a macro that evaluates to a bool, and accepts a guard: <code>matches!(cfg, Some(n) if n &gt; 1024)</code>. Use it for conditions where you do not need the bound values.',
        'Choose match when you want the compiler to force you to handle every case, and the shorter forms when exactly one case matters. If you find yourself chaining many if-let branches, that is usually a match wanting to happen.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'match Basics',
      language: 'rust',
      code: `#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents(coin: Coin) -> u32 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {state:?}!");
            25
        }
    }
}

// Range patterns, or-patterns and a final catch-all
fn describe(n: i32) -> &'static str {
    match n {
        i32::MIN..=-1 => "negative",
        0 => "zero",
        1 | 2 | 3 => "small",
        4..=99 => "medium",
        _ => "large",
    }
}

fn main() {
    println!("{}", value_in_cents(Coin::Penny));                 // 1
    println!("{}", value_in_cents(Coin::Quarter(UsState::Alaska))); // prints the message, then 25
    println!("{}", describe(-5));  // negative
    println!("{}", describe(2));   // small
    println!("{}", describe(500)); // large
    let _unused = UsState::Alabama;
    let _ = (Coin::Nickel, Coin::Dime);
}`
    },
    {
      label: 'Destructuring',
      language: 'rust',
      code: `struct Point {
    x: i32,
    y: i32,
}

enum Shape {
    Circle { center: Point, radius: u32 },
    Rect(Point, Point),
}

// A function parameter is a pattern too
fn print_coords(&(x, y): &(i32, i32)) {
    println!("({x}, {y})");
}

fn main() {
    let p = Point { x: 3, y: -7 };

    // Nested tuple destructuring
    let (a, (b, c)) = (1, (2, 3));
    println!("{a} {b} {c}");

    // Literals in a pattern test the value; bare names bind it
    match p {
        Point { x: 0, y } => println!("on the y axis at {y}"),
        Point { x, y: 0 } => println!("on the x axis at {x}"),
        Point { x, y } => println!("at ({x}, {y})"),
    }

    // Patterns nest as deeply as the data does
    let shape = Shape::Rect(Point { x: 0, y: 0 }, Point { x: 4, y: 3 });
    match shape {
        Shape::Circle { center: Point { x, y }, radius } => {
            println!("circle at {x},{y} with radius {radius}");
        }
        Shape::Rect(Point { x: x1, y: y1 }, Point { x: x2, y: y2 }) => {
            println!("rect {} wide, {} tall", x2 - x1, y2 - y1);
        }
    }

    print_coords(&(10, 20));
}`
    },
    {
      label: 'Guards, @ and Binding',
      language: 'rust',
      code: `fn classify(opt: Option<i32>) -> String {
    match opt {
        None => "nothing".to_string(),
        Some(n) if n < 0 => format!("negative {n}"),
        Some(n @ 0..=9) => format!("single digit {n}"),
        Some(n) => format!("big {n}"),
    }
}

fn main() {
    println!("{}", classify(None));      // nothing
    println!("{}", classify(Some(-3)));  // negative -3
    println!("{}", classify(Some(7)));   // single digit 7
    println!("{}", classify(Some(250))); // big 250

    let name: Option<String> = Some(String::from("ana"));

    // Matching a REFERENCE: n is a &String and nothing is moved
    match &name {
        Some(n) => println!("hello {n}"),
        None => println!("nobody"),
    }
    println!("{:?}", name); // still usable

    // Matching the VALUE would move the String out of name:
    // match name {
    //     Some(n) => println!("hello {n}"),
    //     None => println!("nobody"),
    // }
    // println!("{:?}", name);
    // error[E0382]: borrow of partially moved value: name

    // String patterns need a &str, not a String
    let command = String::from("start");
    match command.as_str() {
        "start" => println!("starting"),
        "stop" => println!("stopping"),
        _ => println!("unknown"),
    }
}`
    },
    {
      label: 'if let / while let / let-else',
      language: 'rust',
      code: `fn parse_port(s: &str) -> Option<u16> {
    // let-else: bind on success, diverge on failure
    let Some((host, port)) = s.split_once(':') else {
        return None;
    };
    if host.is_empty() {
        return None;
    }
    port.parse().ok()
}

fn main() {
    let config = Some(8080);

    // if let: only one case matters
    if let Some(p) = config {
        println!("port {p}");
    } else {
        println!("using the default port");
    }

    // while let: keep going until the pattern stops matching
    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() {
        println!("popped {top}");
    }

    // matches!: a boolean test of a pattern (guards allowed)
    println!("{}", matches!(config, Some(n) if n > 1024)); // true

    println!("{:?}", parse_port("localhost:80")); // Some(80)
    println!("{:?}", parse_port(":80"));          // None
    println!("{:?}", parse_port("nohost"));       // None
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting a variant in a match',
      wrong: `enum Light { Red, Yellow, Green }

fn action(l: Light) -> &'static str {
    match l {
        Light::Red => "stop",
        Light::Green => "go",
    }
}
// error[E0004]: non-exhaustive patterns: Light::Yellow not covered`,
      right: `fn action(l: Light) -> &'static str {
    match l {
        Light::Red => "stop",
        Light::Yellow => "slow down",
        Light::Green => "go",
    }
}`,
      explanation: 'Exhaustiveness is the point of match. Prefer listing every variant explicitly for your own enums, so that adding a variant later produces a compile error at each match that needs updating, rather than silently falling into a wildcard arm.'
    },
    {
      title: 'Putting the catch-all arm before the specific ones',
      wrong: `match n {
    _ => "other",
    0 => "zero",
    1 => "one",
}
// warning: unreachable pattern — the arms after _ can never run`,
      right: `match n {
    0 => "zero",
    1 => "one",
    _ => "other",
}`,
      explanation: 'Arms are tried strictly from top to bottom and the first match wins. A wildcard matches everything, so anything written after it is dead code. Order arms from most specific to most general.'
    },
    {
      title: 'Using a variable name in a pattern expecting it to compare',
      wrong: `let target = 5;
match n {
    target => println!("hit the target"),
    _ => println!("miss"),
}
// warning: unreachable pattern — target is a NEW binding that matches anything`,
      right: `const TARGET: i32 = 5;
match n {
    TARGET => println!("hit the target"),
    _ => println!("miss"),
}
// or use a guard with a normal variable:
// x if x == target => ...`,
      explanation: 'A lowercase identifier in a pattern is a fresh binding that matches every value, and it shadows the outer variable inside the arm. To compare against a value, use a constant, a literal, or a guard.'
    },
    {
      title: 'Matching a field behind a reference by value',
      wrong: `struct User { name: Option<String> }

impl User {
    fn greeting(&self) -> String {
        match self.name {
            Some(n) => format!("hello {n}"),
            None => "hello stranger".to_string(),
        }
    }
}
// error[E0507]: cannot move out of self.name which is behind a shared reference`,
      right: `impl User {
    fn greeting(&self) -> String {
        match &self.name {
            Some(n) => format!("hello {n}"),
            None => "hello stranger".to_string(),
        }
    }
}`,
      explanation: 'Binding n by value would move the String out of a struct you only borrowed. Match on a reference (or use as_ref()) so the binding becomes a borrow instead, and the original is left intact.'
    },
    {
      title: 'Relying on guards to prove a match is exhaustive',
      wrong: `match n {
    x if x >= 0 => "non-negative",
    x if x < 0 => "negative",
}
// error[E0004]: non-exhaustive patterns: i32::MIN..=i32::MAX not covered`,
      right: `match n {
    x if x >= 0 => "non-negative",
    _ => "negative",
}`,
      explanation: 'The compiler treats a guarded arm as if it might not match, because it cannot reason about arbitrary conditions. Always finish with an unguarded arm that covers the remaining cases.'
    },
    {
      title: 'Chaining if let branches over a whole enum',
      wrong: `if let Shape::Circle { radius } = s {
    println!("circle {radius}");
} else if let Shape::Rect(w, h) = s {
    println!("rect {w} by {h}");
}
// Add a Shape::Triangle later and nothing warns you`,
      right: `match s {
    Shape::Circle { radius } => println!("circle {radius}"),
    Shape::Rect(w, h) => println!("rect {w} by {h}"),
}
// A new variant is now a compile error here`,
      explanation: 'if let deliberately gives up exhaustiveness checking. That is fine when exactly one case matters, but when you are really branching over every variant, a match keeps the compiler on your side as the enum evolves.'
    },
  ];

  challenge: Challenge = {
    title: 'Command Parser',
    language: 'rust',
    description: `Parse a line of text into a command using pattern matching.

Define \`enum Command { Move { x: i32, y: i32 }, Say(String), Quit, Unknown }\` deriving Debug and PartialEq, and \`fn parse(input: &str) -> Command\`.

Rules:
- \`"quit"\` gives \`Command::Quit\`.
- \`"move X Y"\` with two valid integers gives \`Command::Move { x, y }\`. If either number does not parse, the result is \`Command::Unknown\`.
- \`"say ..."\` gives \`Command::Say\` holding the rest of the words joined by single spaces. \`"say"\` on its own, with nothing after it, is \`Command::Unknown\`.
- Anything else is \`Command::Unknown\`.

Example:
\`\`\`
parse("move 3 -4")       // Move { x: 3, y: -4 }
parse("say hello world") // Say("hello world")
parse("quit")            // Quit
parse("move a b")        // Unknown
parse("say")             // Unknown
\`\`\``,
    hints: [
      'Split the input into a Vec of &str with split_whitespace().collect(), then match on parts.as_slice() using slice patterns.',
      'A slice pattern like ["move", x, y] matches exactly three words whose first is the literal "move" and binds the other two.',
      '["say", rest @ ..] binds all remaining words as a slice; add a guard "if !rest.is_empty()" to reject a bare "say".',
      'Parse the numbers with x.parse::<i32>() and match on the pair of results: (Ok(x), Ok(y)) => ..., _ => Command::Unknown.',
    ],
    starterCode: `#[derive(Debug, PartialEq)]
enum Command {
    Move { x: i32, y: i32 },
    Say(String),
    Quit,
    Unknown,
}

fn parse(input: &str) -> Command {
    // TODO: split into words and match on the slice of words
    Command::Unknown
}

fn main() {
    println!("{:?}", parse("move 3 -4"));
    println!("{:?}", parse("say hello world"));
    println!("{:?}", parse("quit"));
    println!("{:?}", parse("move a b"));
    println!("{:?}", parse("say"));
}`,
    solution: `#[derive(Debug, PartialEq)]
enum Command {
    Move { x: i32, y: i32 },
    Say(String),
    Quit,
    Unknown,
}

fn parse(input: &str) -> Command {
    let parts: Vec<&str> = input.split_whitespace().collect();
    match parts.as_slice() {
        ["quit"] => Command::Quit,
        ["move", x, y] => match (x.parse::<i32>(), y.parse::<i32>()) {
            (Ok(x), Ok(y)) => Command::Move { x, y },
            _ => Command::Unknown,
        },
        ["say", rest @ ..] if !rest.is_empty() => Command::Say(rest.join(" ")),
        _ => Command::Unknown,
    }
}

fn main() {
    println!("{:?}", parse("move 3 -4"));        // Move { x: 3, y: -4 }
    println!("{:?}", parse("say hello world")); // Say("hello world")
    println!("{:?}", parse("quit"));            // Quit
    println!("{:?}", parse("move a b"));        // Unknown
    println!("{:?}", parse("say"));             // Unknown
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What must be true of every match expression?',
      options: [
        'It must end with a wildcard arm',
        'It must be exhaustive — every possible value must be covered by some arm',
        'It may only match on enums',
        'Each arm must return a different type',
      ],
      answer: 1,
      explanation: 'The compiler requires every possible value to be handled. A wildcard is one way to achieve that, but not the only one — listing every enum variant is also exhaustive, and usually the better choice.'
    },
    {
      q: 'Which value does the pattern 4..=99 match?',
      options: ['3', '4', '100', 'Only 99'],
      answer: 1,
      explanation: 'The ..= operator makes an INCLUSIVE range, so both 4 and 99 match, along with everything between them. 3 and 100 fall outside it.'
    },
    {
      q: 'Two arms, Some(x) if x >= 0 and Some(x) if x < 0, are followed by None. Does the match compile for Option of i32?',
      options: [
        'Yes, but only in release builds',
        'No, because None must come first',
        'Yes, because the two guards cover every number',
        'No, because the compiler does not reason about guards, so the Some case is not proven covered',
      ],
      answer: 3,
      explanation: 'Guards are treated as possibly failing, so the compiler cannot conclude that all Some values are handled. Replace the last guarded arm with an unguarded Some(_) or Some(x).'
    },
    {
      q: 'You write match name with name: Option of String and an arm Some(n). What happens to name afterwards?',
      options: [
        'The String is moved into n, so name is partially moved and cannot be used again',
        'The String is cloned automatically',
        'The code fails to compile at the match',
        'Nothing — it is unchanged',
      ],
      answer: 0,
      explanation: 'Matching the value itself binds by value, moving the non-Copy String. Match on &name instead when you need the original afterwards; the binding then becomes a &String.'
    },
    {
      q: 'What does the pattern n @ 1..=5 do?',
      options: [
        'Compares n to 5 only',
        'Tests that n equals the range object',
        'Binds the matched value to n and also requires it to be in the range 1 to 5',
        'Creates a new range from 1 to n',
      ],
      answer: 2,
      explanation: 'The @ operator gives a name to the whole matched value while a sub-pattern (here a range) tests it. Without @ you could test the range but would have no name for the value.'
    },
    {
      q: 'What must the else block of let Some(x) = opt else { ... }; do?',
      options: [
        'Assign x a fallback',
        'Nothing in particular',
        'Return a default value for x',
        'Diverge — return, break, continue or panic — so control never falls through',
      ],
      answer: 3,
      explanation: 'If the pattern fails there is no x, so the else block must not complete normally. That guarantee is what allows the code after the let to use x with no further checks.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between match and if let?',
      a: 'They use the same pattern machinery. match checks that every case is handled and can have many arms. if let handles one pattern and ignores everything else, which is shorter when only one case matters but gives up the exhaustiveness check. Use match when you are branching over all variants, and if let when you are asking one question.'
    },
    {
      q: 'Is match slower than a chain of if statements?',
      a: 'No. The compiler turns patterns into efficient decision logic, and for simple integer or enum matches it commonly generates a jump table or a series of comparisons at least as fast as hand-written ifs. Because the compiler sees the whole match, it can also optimise across arms.'
    },
    {
      q: 'What is the difference between _ and _name in a pattern?',
      a: 'A bare underscore is a wildcard that does not bind anything, so the matched value is not moved. A name starting with an underscore, such as _unused, is a real binding that only suppresses the unused-variable warning, so it can still move a non-Copy value. This matters for ownership.'
    },
    {
      q: 'What are irrefutable and refutable patterns?',
      a: 'An irrefutable pattern always matches, such as the x in let x = 5 or the tuple in let (a, b) = pair. A refutable pattern might fail, such as Some(x). Plain let and function parameters require irrefutable patterns; match arms, if let and while let accept refutable ones. Let-else exists to allow a refutable pattern in a let.'
    },
    {
      q: 'How do I match on a String?',
      a: 'Patterns are written with string literals, which are string slices, so convert first: match s.as_str() { "start" => ..., _ => ... }. Matching directly on an owned String against a literal does not compile, because the types differ.'
    },
    {
      q: 'Can I match on several values at once?',
      a: 'Yes, by matching on a tuple: match (a, b) { (0, 0) => ..., (x, 0) => ..., (_, _) => ... }. The tuple is built on the spot and the patterns take it apart again, which is a compact way to express a decision table over two inputs.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'match compares a value against patterns from top to bottom, must cover every possibility, and the same pattern language powers destructuring, if let, while let, let-else and matches!.',
    mustKnow: [
      'A match is an expression and must be exhaustive; error E0004 names the missing case',
      'Arms are tried in order and the first match wins — put the wildcard last',
      'A lowercase identifier in a pattern binds a new variable; use a const, literal or guard to compare',
      'Or-patterns <code>1 | 2</code>, inclusive ranges <code>1..=5</code> and bindings <code>n @ 1..=5</code> extend what a pattern can express',
      'Guards do not count toward exhaustiveness — finish with an unguarded arm',
      'Match on <code>&amp;value</code> to avoid moving non-Copy data out of the original',
      'if let and while let match one pattern, and let-else needs a diverging else block',
    ],
    interviewFocus: [
      'Why is exhaustiveness checking valuable when an enum gains a new variant?',
      'What is the difference between matching a value and matching a reference to it?',
      'Explain refutable versus irrefutable patterns and where each is allowed',
      'When would you use if let rather than match, and what do you lose?',
      'What does a slice pattern such as ["say", rest @ ..] do?',
    ],
  };
}
