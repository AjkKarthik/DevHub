module.exports = {
  slug: 'pattern-matching',
  subtitle: 'match, if let, let else, while let and let chains: destructure structs, tuples, enums and slices, add guards and @ bindings, and let the compiler prove every case is handled.',
  readingTime: 18,
  apis: ['match', 'if let / else', 'let ... else', 'while let', 'matches!()', '@ bindings', 'let chains (2024)'],
  tip: 'Avoid a catch-all _ arm on enums you own. Listing every variant means that when someone adds a new variant, the compiler points at every match that needs updating — a wildcard silently swallows the new case.',
  gotchas: [
    'Patterns are checked top to bottom; a broad pattern placed first makes later arms unreachable (the compiler warns).',
    'Matching on a reference binds fields by reference automatically (default binding modes), so you do not need ref or & in most patterns.',
    'let chains (if let ... && ...) are only available in the 2024 edition, Rust 1.88+.',
  ],
  quickRef: [
    { name: 'match value { pat => expr, _ => expr }', type: 'syntax', desc: 'Exhaustive branching; every possible value must be covered' },
    { name: 'A | B', type: 'syntax', desc: 'Or-pattern: one arm for several alternatives' },
    { name: '1..=9', type: 'syntax', desc: 'Inclusive range pattern for integers and chars' },
    { name: 'Some(x) if x > 10', type: 'syntax', desc: 'Match guard: extra boolean condition on an arm' },
    { name: 'n @ 1..=9', type: 'syntax', desc: 'Bind the matched value to a name while also testing it' },
    { name: 'Point { x, .. }', type: 'syntax', desc: 'Destructure some fields and ignore the rest' },
    { name: '[first, .., last]', type: 'syntax', desc: 'Slice patterns, including rest patterns' },
    { name: 'let Some(v) = opt else { return; };', type: 'syntax', desc: 'let-else: bind or diverge, keeping the happy path unindented' },
    { name: 'matches!(v, Pat if cond)', type: 'function', desc: 'Macro returning bool for "does it match this pattern?"' },
    { name: 'if let Some(a) = x && a > 0', type: 'syntax', desc: 'Let chain: combine patterns and conditions (2024 edition, Rust 1.88+)' },
  ],
  theory: [
    { heading: 'match is exhaustive', points: [
      'A `match` compares a value against patterns in order and runs the first arm that fits. Every possible value must be covered, otherwise it fails with E0004 "non-exhaustive patterns".',
      'Exhaustiveness is the reason enums are safe to extend: adding a variant makes every incomplete `match` a compile error that shows you exactly what to update.',
      '`match` is an expression; all arms must produce the same type (or diverge with `return`, `panic!`, `continue`).',
      'Library enums marked `#[non_exhaustive]` force external crates to include a wildcard arm, so the library can add variants without breaking users.',
    ] },
    { heading: 'Destructuring', points: [
      'Tuples: `let (a, b) = pair;`. Structs: `let User { name, age } = user;` or `User { name: n, .. }` to rename and ignore.',
      'Enums: `Shape::Rect { w, h }` or `Message::Write(text)`. Nested patterns work at any depth: `Some(Shape::Circle(r))`.',
      'Slices: `[]`, `[x]`, `[first, rest @ ..]`, `[.., last]` let you branch on length and contents at once.',
      'When you match on a reference (`&value` or `match &opt`), default binding modes bind the inner fields as references, so you rarely need `ref` or explicit `&` in patterns.',
      'Function parameters and `for` loops take patterns too: `for (i, item) in v.iter().enumerate()` and `fn area(&(w, h): &(u32, u32))`.',
    ] },
    { heading: 'Guards, ranges and bindings', points: [
      'A guard adds a condition: `Some(n) if n % 2 == 0 =>`. Guards are not considered for exhaustiveness, so you usually still need a fallback arm.',
      'Range patterns (`0..=9`, `\'a\'..=\'z\'`) and or-patterns (`1 | 2 | 3`) keep arms compact.',
      'The `@` operator binds a value while testing it: `age @ 13..=19 => println!("teen {age}")`.',
      '`_` ignores a value without binding; `_name` binds but silences the unused warning; `..` ignores the remaining fields or elements.',
    ] },
    { heading: 'Lighter forms: if let, let else, while let, let chains', points: [
      '`if let Some(x) = opt { ... } else { ... }` handles one interesting case without writing a full match.',
      '`let Some(x) = opt else { return Err(..); };` (Rust 1.65+) binds on success and requires the else block to diverge. It keeps validation at the top of a function without nesting.',
      '`while let Some(top) = stack.pop()` loops for as long as the pattern matches — the idiomatic way to drain a stack or a channel.',
      'In the 2024 edition (Rust 1.88+) let chains combine patterns and conditions: `if let Some(u) = user && u.is_admin() && let Some(t) = token { ... }`.',
      '`matches!(value, Pattern)` returns a bool and accepts guards, which is handy inside `filter` or assertions.',
    ] },
  ],
  codeTabs: [
    { label: 'match & destructuring', language: 'rust', code: `#[derive(Debug)]
enum Shape {
    Circle { r: f64 },
    Rect { w: f64, h: f64 },
    Triangle(f64, f64, f64),
}

fn area(s: &Shape) -> f64 {
    match s {                                   // s is &Shape: fields bind as &f64
        Shape::Circle { r } => std::f64::consts::PI * r * r,
        Shape::Rect { w, h } if w == h => w * w, // guard: squares
        Shape::Rect { w, h } => w * h,
        Shape::Triangle(a, b, c) => {
            let p = (a + b + c) / 2.0;            // Heron's formula
            (p * (p - a) * (p - b) * (p - c)).sqrt()
        }
    }
}

fn classify(n: i32) -> &'static str {
    match n {
        i32::MIN..=-1 => "negative",
        0 => "zero",
        1 | 2 | 3 => "small",
        x if x % 2 == 0 => "even",
        _ => "odd",
    }
}

fn main() {
    let shapes = [Shape::Circle { r: 1.0 }, Shape::Rect { w: 2.0, h: 2.0 }, Shape::Triangle(3.0, 4.0, 5.0)];
    for s in &shapes {
        println!("{:?} -> {:.2}", s, area(s));
    }
    for n in [-5, 0, 2, 10, 11] {
        print!("{} ", classify(n));
    }
    println!();
}` },
    { label: 'Slices, @ and nesting', language: 'rust', code: `fn describe(v: &[i32]) -> String {
    match v {
        [] => "empty".into(),
        [x] => format!("one: {x}"),
        [first, .., last] if first == last => format!("same ends: {first}"),
        [first, rest @ ..] => format!("starts {first}, then {} more", rest.len()),
    }
}

fn age_group(age: u8) -> String {
    match age {
        0..=12 => "child".to_string(),
        teen @ 13..=19 => format!("teen ({teen})"),
        _ => "adult".to_string(),
    }
}

fn main() {
    println!("{}", describe(&[]));
    println!("{}", describe(&[7]));
    println!("{}", describe(&[4, 9, 4]));
    println!("{}", describe(&[1, 2, 3]));
    println!("{} | {}", age_group(15), age_group(40));

    // Nested patterns
    let pair: (Option<i32>, Result<&str, String>) = (Some(3), Ok("done"));
    if let (Some(n), Ok(msg)) = pair {
        println!("{n} {msg}");
    }
}` },
    { label: 'let else, while let, let chains', language: 'rust', code: `fn parse_port(input: &str) -> Result<u16, String> {
    // let-else: bind or bail out early
    let Some((_, port)) = input.split_once(':') else {
        return Err(format!("no port in {input:?}"));
    };
    let Ok(port) = port.parse::<u16>() else {
        return Err(format!("bad port {port:?}"));
    };
    Ok(port)
}

fn main() {
    println!("{:?}", parse_port("localhost:8080"));
    println!("{:?}", parse_port("localhost"));
    println!("{:?}", parse_port("host:99999"));

    // while let drains until the pattern stops matching
    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() {
        print!("{top} ");
    }
    println!();

    // let chains (edition 2024, Rust 1.88+)
    let user: Option<(&str, bool)> = Some(("ada", true));
    if let Some((name, is_admin)) = user && is_admin && name.len() > 2 {
        println!("admin {name}");
    }

    let codes = [200, 404, 500, 302];
    let errors = codes.iter().filter(|c| matches!(c, 400..=599)).count();
    println!("{errors} errors");
}` },
  ],
  mistakes: [
    { title: 'Non-exhaustive match', checkWrong: true, prelude: 'enum Status { Active, Suspended, Deleted }', wrapFn: '-> &\'static str ', wrong: `let s = Status::Active;
match s {
    Status::Active => "ok",
    Status::Suspended => "paused",
}`, right: `let s = Status::Active;
match s {
    Status::Active => "ok",
    Status::Suspended => "paused",
    Status::Deleted => "gone",
}`, explanation: 'A match must cover every value; the compiler reports E0004 and names the missing variant. Add the arm rather than a wildcard so future variants are caught too.' },
    { title: 'Wildcard arm hiding new variants', wrong: `match event {
    Event::Click => handle_click(),
    _ => {} // a new Event::Purchase is silently ignored
}`, right: `match event {
    Event::Click => handle_click(),
    Event::Hover | Event::Scroll => {} // explicitly ignored
}`, explanation: 'A _ arm compiles today and keeps compiling when someone adds Event::Purchase, which then does nothing. Listing variants explicitly turns that into a compile error you will notice.' },
    { title: 'Binding a name when you meant to compare against a constant', wrong: `let expected = 3;
match n {
    expected => println!("match!"), // binds a NEW variable, matches everything
    _ => println!("no"),
}`, right: `const EXPECTED: i32 = 3;
match n {
    EXPECTED => println!("match!"),
    _ => println!("no"),
}
// or: x if x == expected => ...`, explanation: 'A lowercase identifier in a pattern is a new binding, so the first arm always matches (the compiler warns about an unreachable pattern). Use a const in UPPER_CASE or a guard to compare against a value.' },
    { title: 'Deep nesting instead of let else', wrong: `if let Some(user) = find_user(id) {
    if let Some(email) = user.email {
        send(email);
    }
}`, right: `let Some(user) = find_user(id) else { return };
let Some(email) = user.email else { return };
send(email);`, explanation: 'Each if let adds a level of indentation. let-else handles the failure case immediately and keeps the main logic flat.' },
  ],
  challenge: {
    title: 'Parse simple commands',
    language: 'rust',
    description: 'Write parse(line: &str) -> Command where enum Command { Quit, Move { dx: i32, dy: i32 }, Say(String), Unknown(String) }. Split the line into words and match on the slice: ["quit"] → Quit, ["move", dx, dy] with both parsing as i32 → Move, ["say", rest @ ..] with at least one word → Say(words joined by spaces), anything else → Unknown(line). Use slice patterns and let-else or a guard.',
    hints: ['let words: Vec<&str> = line.split_whitespace().collect(); then match words.as_slice().', 'For move, a guard can check dx.parse::<i32>().is_ok() — or parse inside the arm with if let.', 'rest.join(" ") turns a slice of &str into a String.'],
    starterCode: `#[derive(Debug, PartialEq)]
enum Command { Quit, Move { dx: i32, dy: i32 }, Say(String), Unknown(String) }

fn parse(line: &str) -> Command {
    todo!()
}

fn main() {
    for l in ["quit", "move 3 -2", "say hello world", "move x 1", "jump"] {
        println!("{:?}", parse(l));
    }
}`,
    solution: `#[derive(Debug, PartialEq)]
enum Command { Quit, Move { dx: i32, dy: i32 }, Say(String), Unknown(String) }

fn parse(line: &str) -> Command {
    let words: Vec<&str> = line.split_whitespace().collect();
    match words.as_slice() {
        ["quit"] => Command::Quit,
        ["move", dx, dy] => {
            if let (Ok(dx), Ok(dy)) = (dx.parse(), dy.parse()) {
                Command::Move { dx, dy }
            } else {
                Command::Unknown(line.to_string())
            }
        }
        ["say", rest @ ..] if !rest.is_empty() => Command::Say(rest.join(" ")),
        _ => Command::Unknown(line.to_string()),
    }
}

fn main() {
    for l in ["quit", "move 3 -2", "say hello world", "move x 1", "jump"] {
        println!("{:?}", parse(l));
    }
    assert_eq!(parse("move 1 2"), Command::Move { dx: 1, dy: 2 });
    assert_eq!(parse("say"), Command::Unknown("say".into()));
}`,
  },
  quiz: [
    { q: 'What happens if a match does not cover every possible value?', options: ['It panics at runtime when the value is missing', 'Compile error E0004 non-exhaustive patterns', 'The missing case returns ()', 'A warning only'], answer: 1, explanation: 'match must be exhaustive. The error names the uncovered patterns so you can add them.' },
    { q: 'In `match n { x => ..., _ => ... }`, what does x do?', options: ['Compares n with a variable x', 'Binds n to a new variable x and always matches', 'Is a syntax error', 'Matches only if n is zero'], answer: 1, explanation: 'Lowercase identifiers in patterns create bindings, so the arm matches every value and the _ arm becomes unreachable.' },
    { q: 'What must the else block of a let-else statement do?', options: ['Return a default value for the binding', 'Diverge — return, break, continue or panic', 'Nothing, it is optional', 'Re-assign the variable'], answer: 1, explanation: 'The else block runs when the pattern fails and must not fall through, because there would be no value for the binding.' },
    { q: 'Which pattern matches a slice with at least two elements and binds the last one?', options: ['[.., last]', '[_, .., last]', '[first, last]', '[last @ ..]'], answer: 1, explanation: '[_, .., last] needs one element before the rest pattern and one after, so it requires length ≥ 2. [.., last] matches length 1 too.' },
    { q: 'Do match guards count towards exhaustiveness?', options: ['Yes, always', 'No, the compiler does not use guard conditions to prove coverage', 'Only for integers', 'Only for enums'], answer: 1, explanation: 'Guards are arbitrary boolean expressions, so the compiler ignores them for exhaustiveness. You still need an arm that covers the remaining values.' },
  ],
  qna: [
    { q: 'Why is exhaustive matching valuable?', a: 'It turns "forgot to handle a case" into a compile error. When an enum gains a variant, every `match` without a wildcard fails to compile until it handles the new case, which is far cheaper than finding the bug in production. It also documents intent: a reader sees every case the code expects.' },
    { q: 'When should you use if let instead of match?', a: 'Use `if let` when you care about one pattern and want to ignore (or briefly handle) everything else — for example acting only on `Some`. Use `match` when several cases need different handling or when you want the compiler to check exhaustiveness. `let ... else` is the better choice when the non-matching case should exit early.' },
    { q: 'What are default binding modes?', a: 'When you match a reference against a non-reference pattern, Rust automatically dereferences and binds the inner fields by reference. So `match &opt { Some(s) => ... }` gives `s: &String` without writing `&Some(ref s)`. This was introduced in the 2018 edition to remove most uses of `ref` and explicit `&` in patterns.' },
    { q: 'What do let chains add in the 2024 edition?', a: 'They let you join `let` patterns and boolean conditions with `&&` inside `if` and `while`: `if let Some(u) = user && u.active && let Some(t) = u.token { ... }`. Previously this needed nested `if let` blocks or a `match` on a tuple. They are stable from Rust 1.88 and require edition 2024 because the drop order of temporaries changed in that edition.' },
  ],
  revision: {
    oneLiner: 'Patterns destructure data and select code paths; match is exhaustive, and if let, let else, while let and let chains cover the lighter cases.',
    mustKnow: [
      '`match` must cover every value (E0004 otherwise) and is an expression.',
      'Patterns destructure tuples, structs, enums and slices; `..` ignores the rest.',
      'Guards (`if cond`) are not used for exhaustiveness.',
      '`@` binds while testing; ranges and `|` keep arms compact.',
      '`let else` binds or diverges; `while let` loops while matching.',
      'Let chains need edition 2024 / Rust 1.88+.',
    ],
    interviewFocus: [
      'Explain why avoiding wildcard arms makes refactoring safer.',
      'Show slice patterns and @ bindings.',
      'Compare match, if let and let else.',
    ],
  },
};
