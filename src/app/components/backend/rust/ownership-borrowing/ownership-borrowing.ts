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
  selector: 'app-rust-ownership-borrowing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ownership-borrowing.html',
  styleUrl: './ownership-borrowing.scss'
})
export class RustOwnershipBorrowing {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = 'Rust 2021+';
  route = 'rust-ownership-borrowing';

  quickRef: QuickRefItem[] = [
    { name: 'let s2 = s1;', type: 'syntax', desc: 'Move — a heap-owning value like String is moved, not copied; s1 is no longer valid afterward' },
    { name: 'let s2 = s1.clone();', type: 'method', desc: 'Deep copy — both s1 and s2 remain valid, each owning independent heap data' },
    { name: 'fn f(s: String)', type: 'function', desc: 'Passing by value moves the argument into the function — the caller loses it' },
    { name: '&T', type: 'type', desc: 'Shared reference — borrows a value for reading without taking ownership' },
    { name: '&mut T', type: 'type', desc: 'Mutable reference — the only reference allowed to a value while it exists' },
    { name: '*r', type: 'operator', desc: 'Dereference — follow a reference to read or write the value it points to' },
    { name: 'Copy', type: 'interface', desc: 'A marker trait — types implementing it are duplicated on assignment instead of moved' },
    { name: 'drop(x)', type: 'function', desc: 'Explicitly ends x\'s scope early, running its Drop implementation right there' },
    { name: 'fn f() -> String', type: 'function', desc: 'Returning a value transfers ownership out of the function to the caller' },
    { name: '{ ... }', type: 'syntax', desc: 'A value is dropped the moment its owner\'s scope ends' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The three ownership rules',
      points: [
        'Every value in Rust has exactly one owner at any given time.',
        'When the owner goes out of scope, the value is dropped — its memory is freed immediately and deterministically, with no garbage collector involved.',
        'Ownership can be transferred (moved) to another binding, a function, or a returned value — after a move, the ORIGINAL owner can no longer be used.',
        'These three rules alone are what let Rust free memory at exactly the right moment, at compile time, with zero runtime overhead — no GC pauses, no manual free() to forget.',
        'This is checked entirely by the compiler\'s "borrow checker" before your code ever runs — there is no runtime ownership tracking at all.',
      ]
    },
    {
      heading: 'Move semantics in practice',
      points: [
        '`let s2 = s1;` for a `String` MOVES the data — s1\'s pointer, length, and capacity are copied into s2, and s1 is marked invalid. Using s1 afterward is a compile error (E0382, "use of moved value").',
        'Passing a value to a function by its plain type (not a reference) moves it — the function now owns the argument, and the caller cannot use it after the call.',
        'A function can transfer ownership back out by returning the value — `fn f(s: String) -> String { s }` takes ownership and gives it right back to whoever calls it.',
        'A move is a cheap, fixed-size copy of the STACK part of the value (pointer, length, capacity) — the heap data itself is never touched or re-allocated, which is why moving is fast regardless of how much heap data is behind it.',
        'The rule only bites for types that own heap data (String, <code>Vec&lt;T&gt;</code>, <code>Box&lt;T&gt;</code>, and most user-defined structs) — plain stack-only values like integers are handled differently, covered next.',
      ]
    },
    {
      heading: 'The Copy trait — when assignment copies instead of moving',
      points: [
        'Simple, fixed-size, stack-only types implement the `Copy` trait: every integer type, `f32`/`f64`, `bool`, `char`, and tuples/arrays made entirely of Copy types.',
        'For a Copy type, `let n2 = n1;` duplicates the value bit-for-bit — both n1 and n2 remain independently valid afterward. There is no "moved value" error to worry about.',
        '`String`, <code>Vec&lt;T&gt;</code>, and <code>Box&lt;T&gt;</code> do NOT implement Copy, precisely because they own heap data — a bitwise copy would leave two owners pointing at the same heap allocation, which Rust\'s single-owner rule forbids outright.',
        'A type can opt into Copy for its own struct with `#[derive(Copy, Clone)]`, but ONLY if every field is itself Copy — the compiler rejects the derive otherwise.',
        'Copy and Clone are related but distinct: every Copy type must also implement Clone (a copy IS a valid clone), but plenty of Clone types (String, Vec) are explicitly not Copy, since cloning them is an explicit, potentially expensive operation you opt into by calling `.clone()`.',
      ]
    },
    {
      heading: 'References and the borrowing rules',
      points: [
        '`&value` creates a reference — it borrows the value without taking ownership, so the original owner is still valid and usable after the borrow ends.',
        'A function parameter typed `&T` borrows its argument: `fn print_len(s: &String)` can read s but the caller keeps ownership and can use their String again right after the call.',
        '`&mut T` is a mutable reference — the ONLY way to modify a value you don\'t own, and Rust enforces it is the ONLY reference to that value while it exists.',
        'The core borrowing rule, checked at compile time: at any given point you may have either exactly one `&mut T`, OR any number of `&T` references, but never both kinds at the same time.',
        'This single rule is what prevents data races at compile time — two immutable readers can never observe a value changing underneath them, because a writer can never coexist with a reader.',
      ]
    },
    {
      heading: 'Non-Lexical Lifetimes and dangling references',
      points: [
        'A borrow\'s scope ends at its LAST USE, not at the end of the enclosing `{ }` block — this is Non-Lexical Lifetimes (NLL), stable since the Rust 2018 edition.',
        'Because of NLL, code that superficially "looks like" two conflicting borrows in the same block can compile fine, as long as the earlier reference is never read again after the later one is created.',
        'The borrow checker also statically forbids a "dangling reference" — a reference that would outlive the value it points to — something C and C++ let you write and then crash or corrupt memory on at runtime.',
        'A function returning `&String` for a `String` created INSIDE that same function is rejected at compile time: the value is dropped when the function returns, so no reference to it can legally escape.',
        'The full mechanics of how the compiler tracks how long a reference is allowed to live — via explicit `\'a` annotations when elision can\'t infer it — is the next topic, Lifetimes; for now, the key idea is just that a reference can never outlive its source.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Move Semantics',
      language: 'rust',
      code: `fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 is MOVED into s2 — not copied

    // println!("{s1}"); // error[E0382]: borrow of moved value: \`s1\`
    println!("{s2}");     // fine — s2 owns the data now

    // .clone() makes an independent deep copy instead of moving
    let s3 = String::from("world");
    let s4 = s3.clone();
    println!("{s3} {s4}"); // both valid — separate heap allocations

    // Passing to a function moves it too
    takes_ownership(s2);
    // println!("{s2}"); // error — s2 was moved into the function

    // Returning gives ownership back to the caller
    let s5 = gives_ownership();
    println!("{s5}");
}

fn takes_ownership(s: String) {
    println!("took: {s}");
} // s goes out of scope here and is dropped

fn gives_ownership() -> String {
    String::from("a new string") // moved out to the caller
}`
    },
    {
      label: 'The Copy Trait',
      language: 'rust',
      code: `fn main() {
    // i32 implements Copy — assignment duplicates it
    let n1 = 5;
    let n2 = n1;
    println!("{n1} {n2}"); // both still valid — no move happened

    // Same for tuples made entirely of Copy types
    let p1 = (3, 4.0);
    let p2 = p1;
    println!("{:?} {:?}", p1, p2); // both valid

    // char, bool are Copy too
    let c1 = 'x';
    let c2 = c1;
    println!("{c1} {c2}");

    // A tuple containing a String is NOT Copy — the String forces a move
    let mixed1 = (1, String::from("hi"));
    let mixed2 = mixed1;
    // println!("{:?}", mixed1); // error — moved

    println!("{:?}", mixed2);
}

// A custom struct can opt in, but ONLY if every field is Copy
#[derive(Copy, Clone, Debug)]
struct Point {
    x: i32,
    y: i32,
}

#[allow(dead_code)]
fn demo_struct() {
    let a = Point { x: 1, y: 2 };
    let b = a; // copied, not moved — Point derives Copy
    println!("{:?} {:?}", a, b); // both valid
}`
    },
    {
      label: 'References & Borrowing',
      language: 'rust',
      code: `fn main() {
    let s = String::from("hello");

    // & borrows — the caller keeps ownership
    let len = calculate_length(&s);
    println!("'{s}' is {len} bytes long"); // s is still usable here

    // &mut lets a function modify a value it doesn't own
    let mut s2 = String::from("hello");
    append_world(&mut s2);
    println!("{s2}"); // "hello world"

    // The core rule: one &mut, OR many &, never both at once
    let mut value = 5;
    let r1 = &value;
    let r2 = &value;       // fine — multiple immutable borrows allowed
    println!("{r1} {r2}");
    // r1, r2 are done being used above (NLL ends their borrow here)

    let r3 = &mut value;   // fine now — no active immutable borrows remain
    *r3 += 1;
    println!("{value}");

    // let bad1 = &value;
    // let bad2 = &mut value; // error[E0502]: cannot borrow as mutable
    //                        // because it is also borrowed as immutable
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s (the reference) goes out of scope — but it never owned the data, so nothing is dropped

fn append_world(s: &mut String) {
    s.push_str(" world");
}`
    },
    {
      label: 'Dangling References',
      language: 'rust',
      code: `// This function will NOT compile — kept here deliberately, commented out,
// to show exactly what the borrow checker rejects and why.

// fn dangle() -> &String {
//     let s = String::from("hello");
//     &s
// } // s is dropped here — the reference we tried to return would point
//   // at freed memory. error[E0106]: missing lifetime specifier
//   // (the real problem: no valid lifetime exists for this reference at all)

// The fix: return the OWNED value itself, transferring ownership out —
// there is no reference left dangling because nothing is borrowed.
fn no_dangle() -> String {
    let s = String::from("hello");
    s // moved out, not borrowed
}

// Or: accept a reference to data the CALLER owns, and return a reference
// borrowed FROM that same data — its lifetime is tied to the caller's value.
fn first_word(s: &str) -> &str {
    match s.split_whitespace().next() {
        Some(word) => word,
        None => "",
    }
}

fn main() {
    let owned = no_dangle();
    println!("{owned}");

    let sentence = String::from("the quick brown fox");
    let word = first_word(&sentence); // word borrows FROM sentence
    println!("{word}");               // fine — sentence is still alive here
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using a value after it has been moved',
      wrong: `let s1 = String::from("hello");
let s2 = s1;
println!("{s1}"); // error[E0382]: borrow of moved value: \`s1\``,
      right: `let s1 = String::from("hello");
let s2 = s1.clone(); // deep copy — s1 stays valid
println!("{s1}");    // fine — s1 was never moved`,
      explanation: 'Assigning a String (or any non-Copy type) moves it by default. If you genuinely need both the original and the new binding to remain valid, call .clone() explicitly — this makes the cost of the deep copy visible in the source, rather than happening silently.'
    },
    {
      title: 'Trying to hold two mutable references at once',
      wrong: `let mut s = String::from("hello");
let r1 = &mut s;
let r2 = &mut s; // error[E0499]: cannot borrow \`s\` as mutable more than once at a time
println!("{r1} {r2}");`,
      right: `let mut s = String::from("hello");
{
    let r1 = &mut s;
    r1.push_str(" world");
} // r1's borrow ends here (NLL — last use, not end of block)
let r2 = &mut s; // fine — r1 is no longer active
r2.push_str("!");`,
      explanation: 'The compiler enforces at most one &mut reference to a value at a time, specifically to prevent two pieces of code from mutating the same data unexpectedly. Scoping the first mutable borrow so it ends before the second one begins (or simply not using r1 again, thanks to NLL) resolves this.'
    },
    {
      title: 'Mixing a mutable and an immutable reference to the same value',
      wrong: `let mut s = String::from("hello");
let r1 = &s;       // immutable borrow
let r2 = &mut s;    // error[E0502]: cannot borrow as mutable because it is also borrowed as immutable
println!("{r1}");`,
      right: `let mut s = String::from("hello");
let r1 = &s;
println!("{r1}");   // r1's last use — its borrow ends here under NLL
let r2 = &mut s;     // fine now — no immutable borrows are still active
r2.push_str(" world");`,
      explanation: 'A &mut reference must be the ONLY reference to a value while it exists — readers cannot coexist with a writer. This is what makes it impossible for one part of the code to read a value while another mutates it underneath it, a whole category of bug the compiler eliminates entirely.'
    },
    {
      title: 'Returning a reference to a value the function itself created',
      wrong: `fn make_and_borrow() -> &String {
    let s = String::from("hello");
    &s // error[E0106]: missing lifetime specifier — s is dropped
       // at the end of this function; the reference would dangle
}`,
      right: `fn make_and_return() -> String {
    let s = String::from("hello");
    s // ownership moves out — nothing is left dangling
}`,
      explanation: 'A reference can never legally outlive the value it points to. Since a locally-created value is dropped the moment the function returns, no reference to it can be handed back to the caller. Return the owned value itself instead — the fix is almost always to stop borrowing and start transferring ownership.'
    },
    {
      title: 'Not realizing a plain function call consumes (moves) its argument',
      wrong: `let names = vec![String::from("Ana"), String::from("Bo")];
for name in names { // names is moved into the for loop's iterator
    println!("{name}");
}
println!("{}", names.len()); // error — names was moved by the loop above`,
      right: `let names = vec![String::from("Ana"), String::from("Bo")];
for name in &names { // borrows each element instead of taking ownership
    println!("{name}");
}
println!("{}", names.len()); // fine — names was only ever borrowed`,
      explanation: 'for x in collection consumes the collection by value (it calls .into_iter()), moving it — while for x in &collection borrows it and yields references. Reach for the & form whenever you still need the collection afterward; this trips up people who assume a loop always just "reads" what it iterates over.'
    },
    {
      title: 'Reflexively calling .clone() to silence a borrow-checker error',
      wrong: `fn process(items: &Vec<String>) -> Vec<String> {
    items.clone() // "fixes" the error, but now copies the ENTIRE vector
                   // on every call, for no reason other than convenience
}`,
      right: `fn process(items: &Vec<String>) -> &Vec<String> {
    items // no allocation at all — just hand back the same borrow
}
// Or, if the caller genuinely needs an OWNED copy, that intent
// should be visible at the CALL SITE, not hidden inside this function:
// let owned = process(&data).clone();`,
      explanation: '.clone()-ing your way past a borrow-checker error is a real, well-known anti-pattern — it compiles, but it silently reintroduces the runtime allocation cost Rust\'s ownership model exists to let you avoid. When the checker complains, the better fix is almost always to restructure which side borrows and which side owns, not to paper over it with a copy.'
    },
  ];

  challenge: Challenge = {
    title: 'Longest Word',
    language: 'rust',
    description: `Write a function \`longest_word(text: &str) -> &str\` that borrows a string slice and returns a slice of its longest whitespace-separated word — without allocating a new \`String\`.

Rules:
- Split \`text\` on whitespace.
- Return the FIRST word that reaches the maximum length seen so far (ties go to whichever word appeared earlier).
- If \`text\` is empty (or contains only whitespace), return an empty string slice \`""\`.

Example:
\`\`\`
longest_word("the quick brown fox") // "quick" — quick and brown are both 5 chars, quick came first
longest_word("hello")               // "hello"
longest_word("")                    // ""
\`\`\`

The returned slice must borrow directly from \`text\` — no \`String\`, no \`.to_string()\`, no \`.clone()\`.`,
    hints: [
      'str::split_whitespace() returns an iterator of &str slices, each already borrowed from the original text.',
      'Track the longest word seen so far in a plain &str variable, starting from "" (which has length 0, so the very first real word will always beat it).',
      'Compare with a STRICT greater-than (word.len() > longest.len()) so the first word at a given max length wins any tie, not the last.',
      'Because everything returned is a slice of the original text, the function needs no lifetime annotation of its own — elision infers that the output borrows from the input.',
    ],
    starterCode: `fn longest_word(text: &str) -> &str {
    // TODO: return the first word that reaches the max length seen so far
    ""
}

fn main() {
    println!("{}", longest_word("the quick brown fox")); // quick
    println!("{}", longest_word("hello"));                // hello
    println!("{}", longest_word(""));                     // (empty)
}`,
    solution: `fn longest_word(text: &str) -> &str {
    let mut longest = "";
    for word in text.split_whitespace() {
        if word.len() > longest.len() {
            longest = word;
        }
    }
    longest
}

fn main() {
    println!("{}", longest_word("the quick brown fox")); // quick
    println!("{}", longest_word("hello"));                // hello
    println!("{}", longest_word(""));                     // (empty)
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'After `let s1 = String::from("hi"); let s2 = s1;`, what is the state of `s1`?',
      options: ['s1 and s2 both hold independent copies of "hi"', 's1 has been moved into s2 and can no longer be used', 's1 is now an empty string', 's1 and s2 both point at the same live data and both remain usable'],
      answer: 1,
      explanation: 'String does not implement Copy, so assignment moves ownership from s1 to s2. Using s1 afterward is a compile-time error (E0382, "use of moved value"), not a runtime bug — the compiler catches it before the program ever runs.'
    },
    {
      q: 'Why does `let n2 = n1;` NOT invalidate `n1` when `n1` is an `i32`?',
      options: ['Integers are a special case hardcoded into the compiler with no general rule', 'i32 implements the Copy trait, so assignment duplicates the value instead of moving it', 'Because n1 was declared with let mut', 'It actually does invalidate n1, but the compiler only warns instead of erroring'],
      answer: 1,
      explanation: 'i32, along with every other fixed-size, stack-only primitive (integers, floats, bool, char, and Copy-only tuples/arrays), implements the Copy trait. Assignment for a Copy type is a bitwise duplication — both bindings remain fully valid afterward.'
    },
    {
      q: 'Can you hold a `&mut T` reference and a `&T` reference to the same value at the same time?',
      options: ['Yes, always', 'No — Rust allows either exactly one &mut T, or any number of &T, but never both kinds simultaneously', 'Only inside an unsafe block', 'Only if the value implements Copy'],
      answer: 1,
      explanation: 'This is the core borrowing rule, enforced entirely at compile time: a mutable reference must be the sole reference to a value while it exists. It is precisely what prevents a reader from observing a value change underneath it, eliminating a whole class of data race at compile time rather than at runtime.'
    },
    {
      q: 'What does the compiler do with a function that tries to return a reference to a `String` it created locally inside itself?',
      options: ['It compiles fine — the String simply lives on after the function returns', 'It rejects it at compile time (missing lifetime specifier / dangling reference)', 'It compiles but panics the first time the function is called', 'It silently converts the reference into an owned String'],
      answer: 1,
      explanation: 'A locally-created value is dropped the instant the function returns. Any reference to it would therefore point at freed memory the moment the caller received it — the borrow checker rejects this at compile time rather than letting a dangling pointer exist, which is exactly what languages without a borrow checker (like C) do NOT catch for you.'
    },
    {
      q: 'What does `.clone()` actually do when called on a `String`?',
      options: ['Nothing — it is a free, zero-cost no-op', 'It performs a real deep copy, allocating new heap memory independent of the original', 'It converts the String into a &str', 'It moves the String into a new binding'],
      answer: 1,
      explanation: '.clone() is an explicit, real operation with a real cost — it allocates fresh heap memory and copies the string\'s bytes into it, producing a value that is fully independent of the original. Rust makes this cost visible in the source (you have to write .clone()) rather than letting it happen invisibly on every assignment.'
    },
    {
      q: 'Under Non-Lexical Lifetimes (NLL), when does an immutable borrow\'s "scope" actually end?',
      options: ['At the closing brace of the enclosing block, always', 'At the borrow\'s LAST use, which can be well before the end of the block', 'Only when the variable itself goes out of scope', 'NLL only affects mutable references, never immutable ones'],
      answer: 1,
      explanation: 'Before NLL (stable since the Rust 2018 edition), a borrow was considered active until the end of its lexical block, which made some perfectly safe patterns fail to compile. NLL narrows a borrow\'s effective scope down to its actual last use — so a later, otherwise-conflicting borrow can compile fine as long as the earlier one is never read again.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why doesn\'t Rust need a garbage collector to manage memory safely?',
      a: 'Ownership gives every value exactly one owner whose scope determines exactly when it is freed — the compiler inserts the deallocation code at compile time, at the precise point where the owner goes out of scope. There is no need to scan the heap at runtime looking for unreachable memory (what a GC does), because the compiler already proved, ahead of time, exactly when each value\'s lifetime ends. The trade-off is that the RULES for ownership and borrowing have to be learned and satisfied at compile time — the payoff is predictable, GC-pause-free performance with the same safety guarantees.'
    },
    {
      q: 'What is the actual difference between moving a value and borrowing it?',
      a: 'A move transfers OWNERSHIP — the new binding becomes fully responsible for the value, and the old binding becomes permanently invalid. A borrow (a reference, &T or &mut T) never transfers ownership at all — it grants temporary access (read-only or exclusive-write) to a value someone else still owns, and that access automatically ends when the reference itself goes out of scope, at which point the original owner is exactly as usable as before.'
    },
    {
      q: 'If moving is cheap (just copying a pointer/length/capacity), why does Rust bother distinguishing Copy types at all?',
      a: 'For a genuinely cheap, fixed-size, stack-only value like an i32, forcing every assignment to "invalidate" the original binding would be needless ceremony with zero safety benefit — there is no heap allocation to worry about two owners sharing. The Copy trait exists specifically to opt simple types OUT of move semantics for exactly this reason: it lets `let n2 = n1;` behave the way assignment intuitively should for small, self-contained values, while still enforcing move semantics for anything that owns a heap allocation, where sharing ownership really would be dangerous.'
    },
    {
      q: 'What exactly does "use of moved value" (E0382) mean, and how do you fix it?',
      a: 'It means the value bound to that variable was transferred elsewhere — into another variable, into a function call, or out via a return — and the compiler is refusing to let you read a binding that no longer owns anything. The fix depends on the intent: if you genuinely need two independent copies, call .clone() before the move happens; if the original code only ever needed read access, change the consuming side to take a reference (&T) instead of taking ownership, so nothing is moved at all.'
    },
    {
      q: 'Can a function take ownership of a value and hand it back to the caller?',
      a: 'Yes — a function can accept a value by type (taking ownership) and then return that same value (or a new one) at the end, transferring ownership right back out to whoever called it. This "take it, do something, give it back" pattern shows up constantly in idiomatic Rust, but it is also exactly the pattern borrowing (&mut T) exists to make unnecessary in the common case — passing a mutable reference lets a function modify a value in place without the ceremony of moving it out and back on every call.'
    },
    {
      q: 'What is a "dangling reference," and how does Rust prevent it without a runtime check?',
      a: 'A dangling reference is a pointer that outlives the data it points to — it still "looks" valid but actually refers to memory that has already been freed, a classic source of crashes and memory corruption in languages like C. Rust\'s borrow checker proves, entirely at COMPILE time, that every reference\'s lifetime is fully contained within the lifetime of the value it borrows from — a function that tries to return a reference to data it created locally simply fails to compile, since the compiler can see the data will be dropped before the reference could ever be used by the caller.'
    },
    {
      q: 'If ownership already prevents memory bugs, why does Rust also have Rc<T> and Arc<T> for "shared ownership" — isn\'t one owner supposed to be enough?',
      a: 'The single-owner rule is the DEFAULT, and it covers the vast majority of real code cleanly. But some genuine data shapes — a graph node with multiple parents, a cache entry referenced from several places — don\'t have one obvious sole owner at all. <code>Rc&lt;T&gt;</code> (and its thread-safe twin <code>Arc&lt;T&gt;</code>) relax the rule in a controlled way: they track a reference COUNT at runtime and only drop the underlying value once every Rc/Arc pointing at it has itself been dropped, giving you shared ownership as an explicit, opt-in escape hatch rather than the silent default every value gets. This is covered in full once Smart Pointers is reached.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Every value has exactly one owner; assignment either moves that ownership or, for Copy types, duplicates the value — and a reference can borrow access without ever taking ownership, subject to the one-writer-or-many-readers rule.',
    mustKnow: [
      'Every value has exactly one owner; it is dropped when that owner\'s scope ends — no garbage collector needed',
      'Assigning a non-Copy value (String, Vec, Box, most structs) MOVES it — the original binding becomes invalid',
      'Copy types (integers, floats, bool, char, Copy-only tuples/arrays) are duplicated on assignment instead of moved',
      '&T borrows for reading without taking ownership; &mut T borrows for exclusive read-write access',
      'The borrowing rule: either exactly one &mut T, or any number of &T, never both at once — enforced at compile time',
      'Non-Lexical Lifetimes end a borrow at its LAST USE, not at the end of the enclosing block',
      'A reference can never outlive the value it borrows from — the compiler rejects any dangling reference at compile time',
    ],
    interviewFocus: [
      'Walk through exactly what happens in memory when a String is moved vs. when an i32 is copied',
      'Explain the borrowing rule and why it is what prevents data races at compile time',
      'What compile error do you get from using a value after it\'s moved, and what are the two ways to fix it?',
      'Why can\'t a function return a reference to a value it created locally?',
      'What is Non-Lexical Lifetimes, and how did it change what code the borrow checker accepts?',
    ],
  };
}
