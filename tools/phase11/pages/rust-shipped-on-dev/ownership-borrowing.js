module.exports = {
  slug: 'ownership-borrowing',
  subtitle: 'How Rust manages memory without a garbage collector: one owner per value, moves, Copy vs Clone, and the borrowing rules the borrow checker enforces.',
  readingTime: 25,
  apis: ['move semantics', 'Copy / Clone', '&T shared borrow', '&mut T exclusive borrow', 'String / &str', 'Drop'],
  tip: 'When the borrow checker complains, ask "who owns this, and who is only looking at it?" Most fixes are one of three moves: borrow instead of taking ownership, shorten a borrow by moving code, or clone deliberately when two owners genuinely need their own copy.',
  gotchas: [
    'Passing a String to a function moves it; the caller can no longer use it unless the function returns it or you pass &String / &str instead.',
    'A mutable borrow is exclusive: while it is alive you cannot read the value through any other path, not even println!.',
    'Borrows end at their last use (non-lexical lifetimes), not at the end of the block — reordering lines often fixes an error.',
  ],
  quickRef: [
    { name: 'let b = a;', type: 'syntax', desc: 'For non-Copy types (String, Vec, Box) this MOVES ownership; a is no longer usable' },
    { name: '#[derive(Clone, Copy)]', type: 'decorator', desc: 'Copy types are duplicated bit-for-bit on assignment; only possible when every field is Copy' },
    { name: 'a.clone()', type: 'method', desc: 'Explicit deep copy; costs an allocation for heap data, so it is visible in code reviews' },
    { name: '&value', type: 'operator', desc: 'Shared (immutable) borrow — any number may coexist' },
    { name: '&mut value', type: 'operator', desc: 'Exclusive (mutable) borrow — only one, and no shared borrows at the same time' },
    { name: '*r', type: 'operator', desc: 'Dereference a reference to reach the value it points to' },
    { name: '&str / &[T]', type: 'type', desc: 'Borrowed slices: a view into a String or Vec without owning it' },
    { name: 'drop(value)', type: 'function', desc: 'Move a value into std::mem::drop to free it before the end of scope' },
    { name: 'std::mem::take(&mut v)', type: 'function', desc: 'Move a value out of a &mut place, leaving Default::default() behind' },
  ],
  theory: [
    { heading: 'The three ownership rules', points: [
      'Each value has exactly one owner — a variable, a struct field, a collection slot.',
      'There can only be one owner at a time; assigning or passing a non-`Copy` value moves ownership to the new place.',
      'When the owner goes out of scope the value is dropped: its `Drop` implementation runs and its heap memory is freed. No garbage collector and no manual `free`.',
      'Because ownership is tracked at compile time, the checks cost nothing at runtime — the generated code is the same as hand-written C that frees memory at the right point.',
    ] },
    { heading: 'Moves, Copy and Clone', points: [
      'A move copies the small stack part of a value (a `String` is pointer, length and capacity) and marks the source as unusable, so the heap buffer is never freed twice.',
      'Using a moved-from variable is a compile error: "borrow of moved value". You can re-assign a moved-from `let mut` variable and use it again.',
      'Types that are cheap to duplicate and own no resources implement `Copy`: integers, floats, `bool`, `char`, shared references `&T`, and tuples/arrays of `Copy` types. Assignment copies them and the source stays valid.',
      '`Clone` is an explicit, possibly expensive duplicate (`s.clone()`). A type cannot be `Copy` if it implements `Drop` or contains a non-`Copy` field like `String`.',
      'Closures and function calls follow the same rules: passing `String` by value moves it; passing `&String` or `&str` lends it.',
    ] },
    { heading: 'Borrowing rules', points: [
      'A reference borrows a value without taking ownership. At any moment you may have either any number of shared references `&T` or exactly one mutable reference `&mut T` — never both.',
      'References must always be valid: the compiler rejects any code where a reference could outlive the value it points to (a dangling reference).',
      'These two rules rule out data races at compile time: a data race needs two accesses, at least one a write, at the same time — which shared-xor-mutable forbids.',
      'Since Rust 2018 borrows use non-lexical lifetimes: a borrow lasts until its last use, not until the end of the block. Moving the last use earlier is a common fix.',
      'You cannot move a value out from behind a reference (`let s = *r;` for a `String`); clone it, borrow it, or use `std::mem::take`/`replace` on a `&mut`.',
    ] },
    { heading: 'Strings and slices', points: [
      '`String` owns a growable UTF-8 buffer on the heap; `&str` is a borrowed view of UTF-8 bytes (a pointer and a length). String literals are `&\'static str`.',
      'Prefer `&str` for function parameters: a `&String` coerces to `&str` automatically (deref coercion), so the function accepts both owned strings and literals.',
      'Slices (`&v[1..3]`, `&s[0..5]`) borrow part of a collection. String slice indices are byte offsets and must fall on character boundaries or the slice panics.',
      'Return owned data (`String`, `Vec<T>`) when the caller should own the result; return a borrowed slice only when it points into one of the inputs.',
    ] },
    { heading: 'Working with the borrow checker', points: [
      'Many errors disappear when you narrow a borrow: compute what you need, let the borrow end, then mutate.',
      'Iterating with `for x in &v` borrows `v`; you cannot push to `v` inside that loop because that needs `&mut v` while `&v` is alive.',
      'Struct fields can be borrowed independently: `&mut s.a` and `&s.b` may coexist, but a method taking `&mut self` borrows the whole struct.',
      'When ownership must be shared (graphs, caches, callbacks), reach for `Rc`/`Arc` with interior mutability — covered in Smart Pointers — rather than fighting lifetimes.',
    ] },
  ],
  codeTabs: [
    { label: 'Moves & clones', language: 'rust', code: `fn take(s: String) -> usize {
    s.len()           // s is dropped at the end of this function
}

fn main() {
    let a = String::from("hello");
    let b = a;                    // move: a is no longer valid
    // println!("{a}");           // error[E0382]: borrow of moved value: \`a\`
    println!("{b}");

    let c = b.clone();            // explicit deep copy
    let n = take(b);              // b moved into the function
    println!("{c} has {n} bytes");

    // Copy types are duplicated, the source stays usable
    let x = 5;
    let y = x;
    println!("{x} {y}");

    // A moved-from mut variable can be re-initialised
    let mut s = String::from("one");
    let moved = s;
    s = String::from("two");
    println!("{moved} {s}");
}` },
    { label: 'Borrowing', language: 'rust', code: `fn count_words(text: &str) -> usize {     // borrows, does not own
    text.split_whitespace().count()
}

fn shout(text: &mut String) {               // exclusive borrow
    text.make_ascii_uppercase();
    text.push('!');
}

fn main() {
    let mut msg = String::from("hello borrow checker");
    let words = count_words(&msg);          // &String coerces to &str
    println!("{words} words");

    let r1 = &msg;
    let r2 = &msg;                          // many shared borrows: fine
    println!("{r1} / {r2}");                // last use of r1 and r2

    shout(&mut msg);                        // OK: shared borrows already ended
    println!("{msg}");

    // Slices borrow part of a value
    let first = &msg[0..5];
    println!("{first}");
}` },
    { label: 'Fixing borrow errors', language: 'rust', code: `fn main() {
    let mut scores = vec![10, 20, 30];

    // Compute first, then mutate: the shared borrow ends before the push
    let max = *scores.iter().max().unwrap();
    scores.push(max + 1);

    // Mutating while iterating: collect what to add, then extend
    let doubled: Vec<i32> = scores.iter().map(|s| s * 2).collect();
    scores.extend(doubled);

    // Disjoint field borrows are allowed
    struct Pair { left: Vec<i32>, right: Vec<i32> }
    let mut p = Pair { left: vec![1], right: vec![2] };
    let l = &mut p.left;
    let r = &p.right;
    l.push(r[0]);

    // Move a value out of a &mut without leaving it uninitialised
    let mut buffer = vec![1, 2, 3];
    let taken = std::mem::take(&mut buffer);   // buffer is now empty
    println!("{scores:?} {:?} {taken:?} {}", p.left, buffer.len());
}` },
  ],
  mistakes: [
    { title: 'Using a value after moving it', checkWrong: true, wrapFn: true, wrong: `let name = String::from("Ada");
let greeting = name;
println!("{name}");`, right: `let name = String::from("Ada");
let greeting = name.clone(); // or borrow: let greeting = &name;
println!("{name} {greeting}");`, explanation: 'Assigning a String moves it, so name is no longer valid (E0382). Borrow it if you only need to read it, or clone when two independent owners are required.' },
    { title: 'Pushing to a Vec while iterating over it', checkWrong: true, wrapFn: true, wrong: `let mut v = vec![1, 2, 3];
for x in &v {
    if *x > 1 { v.push(*x * 10); }
}`, right: `let mut v = vec![1, 2, 3];
let extra: Vec<i32> = v.iter().filter(|x| **x > 1).map(|x| x * 10).collect();
v.extend(extra);`, explanation: 'The loop holds a shared borrow of v for its whole duration, so v.push (which needs &mut v) is rejected (E0502). Pushing could reallocate the buffer and leave the iterator pointing at freed memory.' },
    { title: 'Returning a reference to a local', checkWrong: true, wrong: `fn make_greeting() -> &str {
    let s = String::from("hi");
    &s
}`, right: `fn make_greeting() -> String {
    String::from("hi")
}`, explanation: 'The local String is dropped when the function returns, so a reference to it would dangle. Rust rejects this (missing lifetime specifier / returns a value referencing data owned by the current function). Return the owned value instead.' },
    { title: 'Taking String when &str would do', wrong: `fn is_valid(email: String) -> bool { email.contains('@') }
// caller: is_valid(user.email.clone())`, right: `fn is_valid(email: &str) -> bool { email.contains('@') }
// caller: is_valid(&user.email) or is_valid("a@b.c")`, explanation: 'Taking ownership forces callers to give up or clone their String. Accept &str for read-only parameters; both &String and literals coerce to it.' },
    { title: 'Cloning everything to silence the borrow checker', wrong: `let snapshot = big_vec.clone(); // just to read it once
total(&snapshot)`, right: `total(&big_vec)`, explanation: 'Clone copies the whole heap buffer. It is fine when you truly need a second owner, but if a borrow works, borrow. Restructuring the code (shorter borrows) is usually the real fix.' },
  ],
  challenge: {
    title: 'Longest word without extra allocations',
    language: 'rust',
    description: 'Write longest_word(text: &str) -> &str returning the longest whitespace-separated word (the first one on ties) as a slice of the input — no String allocations. Then write make_title(words: &[&str]) -> String that capitalises the first letter of each word and joins them with spaces, returning an owned String. Call both from main without cloning the input.',
    hints: ['split_whitespace() yields &str slices that borrow from the input.', 'Track the best slice in a variable; compare lengths with .len().', 'For make_title, take the first char with chars().next(), uppercase it with to_uppercase(), and push the rest with &w[c.len_utf8()..].'],
    starterCode: `fn longest_word(text: &str) -> &str {
    todo!()
}

fn make_title(words: &[&str]) -> String {
    todo!()
}

fn main() {
    let text = String::from("ownership makes memory safety automatic");
    println!("{}", longest_word(&text));
    println!("{}", make_title(&["rust", "is", "fun"]));
}`,
    solution: `fn longest_word(text: &str) -> &str {
    let mut best = "";
    for w in text.split_whitespace() {
        if w.len() > best.len() {
            best = w;
        }
    }
    best
}

fn make_title(words: &[&str]) -> String {
    let mut out = String::new();
    for (i, w) in words.iter().enumerate() {
        if i > 0 {
            out.push(' ');
        }
        let mut chars = w.chars();
        if let Some(c) = chars.next() {
            out.extend(c.to_uppercase());
            out.push_str(chars.as_str());
        }
    }
    out
}

fn main() {
    let text = String::from("ownership makes memory safety automatic");
    println!("{}", longest_word(&text));            // ownership
    println!("{}", make_title(&["rust", "is", "fun"])); // Rust Is Fun
    println!("text still usable: {}", text.len());
}`,
  },
  quiz: [
    { q: 'After `let b = a;` where a is a String, what can you do with a?', options: ['Read it normally', 'Nothing — it has been moved and using it is a compile error', 'Only read it through a reference', 'Use it until b is dropped'], answer: 1, explanation: 'String is not Copy, so the assignment moves ownership to b. Any later use of a is error E0382 "borrow of moved value" (unless a is re-assigned first).' },
    { q: 'Which combination of borrows can exist at the same time?', options: ['One &mut and one &', 'Two &mut', 'Any number of &, and no &mut', 'One &mut and any number of &'], answer: 2, explanation: 'The rule is shared XOR mutable: many shared references, or exactly one mutable reference.' },
    { q: 'Why can a type that implements Drop not also be Copy?', options: ['Copy types are always on the heap', 'A bitwise copy would make Drop run twice on the same resource', 'Drop requires &mut self', 'It can — the compiler allows both'], answer: 1, explanation: 'Copy duplicates the value implicitly; if both copies ran a destructor for the same resource (e.g. a file handle) it would be freed twice. The compiler forbids implementing both.' },
    { q: 'What does non-lexical lifetimes (NLL) change?', options: ['References live until the end of the function', 'A borrow ends at its last use rather than the end of the block', 'Lifetimes no longer need checking', 'Mutable borrows can be shared'], answer: 1, explanation: 'Since Rust 2018 the borrow checker tracks where a reference is last used, so code that mutates after the last read of a shared borrow compiles.' },
    { q: 'What is the best parameter type for a function that only reads text?', options: ['String', '&String', '&str', 'Box<str>'], answer: 2, explanation: '&str accepts string literals and, through deref coercion, &String too, without taking ownership or forcing a clone.' },
    { q: 'How do you move a Vec out of a field you only have &mut access to?', options: ['let v = *field;', 'std::mem::take(&mut field) leaving an empty Vec', 'field.drop()', 'It is impossible'], answer: 1, explanation: 'You cannot move out from behind a reference, because that would leave the field uninitialised. mem::take swaps in Default::default() and returns the old value; mem::replace lets you choose the replacement.' },
  ],
  qna: [
    { q: 'How does Rust guarantee memory safety without a garbage collector?', a: 'Through ownership and borrowing checked at compile time. Every value has one owner and is freed exactly once when that owner goes out of scope, so there are no double frees or leaks from forgetting `free`. References are checked so they can never outlive their data (no use-after-free) and so mutation is exclusive (no data races or iterator invalidation). Because the checks happen at compile time, there is no runtime cost or GC pause.' },
    { q: 'What is the difference between Copy and Clone?', a: '`Copy` is an implicit, bitwise duplicate used for small, plain values like integers and `&T`; after `let b = a;` both are usable. `Clone` is an explicit `.clone()` call that may do arbitrary work such as allocating a new heap buffer. Every `Copy` type is also `Clone`. A type can only be `Copy` if all its fields are `Copy` and it does not implement `Drop`.' },
    { q: 'Explain the borrowing rules and the problem they solve.', a: 'At any time you can have many shared references (`&T`) or one mutable reference (`&mut T`), and every reference must be valid for as long as it is used. This prevents aliasing plus mutation, which is the root of data races, iterator invalidation (pushing to a vector while iterating can reallocate it) and many use-after-free bugs. Rust enforces the rules statically, so violating code does not compile.' },
    { q: 'Why does `for x in &v { v.push(1); }` fail to compile?', a: 'The loop iterates through a shared borrow of `v` that lasts for the whole loop. `push` needs `&mut v`, and a mutable borrow cannot coexist with the shared one (E0502). The rule exists because `push` may reallocate the buffer, leaving the iterator pointing at freed memory. Collect the changes first and apply them after the loop, or iterate by index if you really need to.' },
    { q: 'When should a function return String vs &str?', a: 'Return `&str` only when the result borrows from one of the inputs (e.g. returning a slice of the text you were given) — then the caller keeps owning the data. Return `String` when the function creates new text, because a reference to a local would dangle. Lifetimes connect the returned `&str` to the input it borrows from.' },
  ],
  revision: {
    oneLiner: 'One owner per value, moves transfer ownership, and borrows are either many shared or one mutable — all enforced at compile time with zero runtime cost.',
    mustKnow: [
      'Each value has one owner; it is dropped when the owner goes out of scope.',
      'Assignment and by-value calls move non-`Copy` types; using the old binding is E0382.',
      '`Copy` = implicit bitwise copy for plain values; `Clone` = explicit and possibly expensive.',
      'Shared XOR mutable: many `&T` or one `&mut T` at a time.',
      'Borrows end at their last use (NLL); reordering often fixes errors.',
      'Take `&str`/`&[T]` for read-only parameters; return owned data when you create it.',
    ],
    interviewFocus: [
      'Explain how ownership replaces garbage collection and manual memory management.',
      'Explain why pushing to a Vec while iterating over it is rejected.',
      'Compare Copy and Clone and when a type cannot be Copy.',
      'Show two or three ways to fix a borrow-checker error without cloning.',
    ],
  },
};
