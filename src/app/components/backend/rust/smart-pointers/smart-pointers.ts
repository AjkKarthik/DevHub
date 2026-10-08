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
  selector: 'app-rust-smart-pointers',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './smart-pointers.html',
  styleUrl: './smart-pointers.scss'
})
export class RustSmartPointers {
  readingTime = 28;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Rust 2021+';
  route = 'rust-smart-pointers';

  quickRef: QuickRefItem[] = [
    { name: 'Box<T>', type: 'type', desc: 'Allocates a value on the heap with a single owner — needed for recursive types and trait objects' },
    { name: 'Rc<T>', type: 'type', desc: 'Reference-counted shared ownership for single-threaded code — read-only access to the inner value' },
    { name: 'Arc<T>', type: 'type', desc: 'The thread-safe twin of Rc, using atomic reference counts' },
    { name: 'RefCell<T>', type: 'type', desc: 'Interior mutability — borrow rules are checked at runtime and a violation panics' },
    { name: 'Rc::clone(&a)', type: 'function', desc: 'Adds another owner by bumping the count — a cheap pointer copy, not a deep copy of the data' },
    { name: 'Rc::strong_count(&a)', type: 'function', desc: 'Returns how many Rc pointers currently share the value' },
    { name: 'Rc::downgrade(&a)', type: 'function', desc: 'Creates a Weak pointer that does not keep the value alive' },
    { name: 'weak.upgrade()', type: 'method', desc: 'Tries to turn a Weak back into an Rc; returns None if the value has already been dropped' },
    { name: 'cell.borrow() / borrow_mut()', type: 'method', desc: 'Runtime-checked shared or exclusive access to the value inside a RefCell' },
    { name: 'impl Drop for T', type: 'syntax', desc: 'Runs custom cleanup code when a value goes out of scope' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What smart pointers are',
      points: [
        'A regular reference only borrows data. A SMART POINTER is a struct that acts like a pointer but also owns the data it points to and carries extra behaviour or metadata.',
        'Smart pointers implement two traits. <code>Deref</code> lets the pointer be used like a reference (the <code>*</code> operator and method calls reach the inner value), and <code>Drop</code> runs cleanup code when the pointer goes out of scope.',
        'You have already used smart pointers: <code>String</code> and <code>Vec&lt;T&gt;</code> own heap buffers and free them when dropped. The ones in this topic add heap allocation, shared ownership and interior mutability.',
        'Deref coercion means the compiler automatically converts a reference to a smart pointer into a reference to its contents where needed, such as <code>&amp;Box&lt;T&gt;</code> to <code>&amp;T</code> or <code>&amp;String</code> to <code>&amp;str</code>.',
        'Choosing a smart pointer is choosing who owns the data and when its rules are checked: at compile time (Box) or at runtime (RefCell), by one owner (Box) or many (Rc and Arc).',
      ]
    },
    {
      heading: 'Box — one owner on the heap',
      points: [
        '<code>Box&lt;T&gt;</code> stores a value on the heap and keeps only a pointer on the stack. It has a single owner and frees the heap memory when it is dropped, with no runtime overhead beyond the allocation.',
        'A recursive type needs Box. <code>enum List { Cons(i32, List), Nil }</code> is rejected with error E0072 because it would have infinite size; <code>Cons(i32, Box&lt;List&gt;)</code> works because a Box has a fixed size.',
        'Box is also how you make a trait object: <code>Box&lt;dyn Shape&gt;</code> holds any type implementing Shape behind a fixed-size pointer, which is what the earlier traits topic used for dynamic dispatch.',
        'Moving a large struct copies all of its bytes on the stack. Putting it in a Box means only the pointer moves, which can be cheaper for very large values.',
        'Use <code>*</code> to dereference a Box and get the value, as in <code>*b + 1</code>. Method calls dereference automatically, so you rarely write the star by hand.',
      ]
    },
    {
      heading: 'Rc and Arc — shared ownership',
      points: [
        'Sometimes a value genuinely has several owners, such as a node in a graph that several parents point to. <code>Rc&lt;T&gt;</code> keeps a reference count and drops the value only when the last owner is gone.',
        'Create another owner with <code>Rc::clone(&amp;a)</code>. It only increments a counter and copies the pointer, which is why the convention is to write Rc::clone rather than a.clone(): it signals that the operation is cheap and not a deep copy.',
        'An Rc gives only SHARED, read-only access to the value, because several owners mutating it at once would break the borrowing rules. To mutate shared data you combine it with RefCell or, across threads, with a Mutex.',
        '<code>Rc</code> uses ordinary counters and is not thread-safe, so the compiler refuses to send it to another thread (error E0277). <code>Arc&lt;T&gt;</code> uses atomic counters and is safe to share across threads, at a small extra cost per clone and drop.',
        'Reference counting cannot free a CYCLE: two values that hold strong references to each other never reach a count of zero, so their memory leaks. Break cycles with Weak pointers.',
      ]
    },
    {
      heading: 'RefCell — interior mutability',
      points: [
        'Normally the borrow rules are checked at compile time. <code>RefCell&lt;T&gt;</code> moves the same checking to RUNTIME, letting you mutate a value through a shared reference. This is called interior mutability.',
        'Call <code>borrow()</code> for shared access and <code>borrow_mut()</code> for exclusive access. The rule is unchanged — many readers or one writer — but breaking it now PANICS at runtime instead of failing to compile.',
        'The common pattern <code>Rc&lt;RefCell&lt;T&gt;&gt;</code> gives several owners the ability to read and mutate one value, in single-threaded code. Its thread-safe counterpart is <code>Arc&lt;Mutex&lt;T&gt;&gt;</code>.',
        '<code>try_borrow_mut</code> returns a Result instead of panicking, which is useful when you cannot be sure the value is free. For small Copy values, <code>Cell&lt;T&gt;</code> lets you get and set without any borrow at all.',
        'Treat RefCell as a tool for cases the compiler cannot verify, not as a way to avoid thinking about ownership. Every RefCell moves a compile-time guarantee into a possible runtime panic.',
      ]
    },
    {
      heading: 'Weak pointers and Drop',
      points: [
        '<code>Rc::downgrade(&amp;rc)</code> creates a <code>Weak&lt;T&gt;</code>, a non-owning pointer that does not keep the value alive. Calling <code>upgrade()</code> returns an Option: Some(Rc) if the value still exists, None if it has been dropped.',
        'The classic use is a tree where a parent owns its children strongly while each child points back to its parent weakly. Otherwise parent and child would reference each other strongly and neither would ever be freed.',
        '<code>Rc::strong_count</code> and <code>Rc::weak_count</code> let you inspect the counts. The value is dropped when the strong count reaches zero, even if Weak pointers remain.',
        'Implementing <code>Drop</code> lets a type run code when it goes out of scope, for example to close a file or release a lock. Values are dropped in reverse order of their declaration.',
        'You cannot call the drop method directly, but you can drop a value early by passing it to <code>std::mem::drop</code>, usually written just <code>drop(x)</code>, which takes ownership and lets it go out of scope immediately.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Box',
      language: 'rust',
      code: `#[derive(Debug)]
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

// &Box<List> coerces to &List thanks to Deref
fn sum(list: &List) -> i32 {
    match list {
        Cons(value, rest) => value + sum(rest),
        Nil => 0,
    }
}

fn main() {
    let b = Box::new(5);
    println!("{}", *b + 1); // 6

    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
    println!("{}", sum(&list));   // 6
    println!("{:?}", list);       // Cons(1, Cons(2, Cons(3, Nil)))

    // enum Bad { Cons(i32, Bad), Nil }
    // error[E0072]: recursive type Bad has infinite size
    // The fix is exactly what List does: put the recursive part behind a Box.
}`
    },
    {
      label: 'Rc & Arc',
      language: 'rust',
      code: `use std::rc::Rc;
use std::sync::Arc;
use std::thread;

fn main() {
    // Rc: shared ownership on ONE thread
    let a = Rc::new(String::from("shared"));
    println!("count = {}", Rc::strong_count(&a)); // 1
    let b = Rc::clone(&a);
    {
        let c = Rc::clone(&a);
        println!("count = {}", Rc::strong_count(&a)); // 3
        println!("{c}");
    } // c is dropped here
    println!("count = {}", Rc::strong_count(&a)); // 2
    println!("{a} {b}");

    // *a = String::from("x");
    // error: cannot assign to data in an Rc — Rc gives shared, read-only access
    //
    // thread::spawn(move || println!("{a}"));
    // error[E0277]: Rc<String> cannot be sent between threads safely

    // Arc: the same idea, safe to share across threads
    let shared = Arc::new(vec![1, 2, 3]);
    let mut handles = Vec::new();
    for i in 0..3 {
        let data = Arc::clone(&shared);
        handles.push(thread::spawn(move || {
            println!("thread {i} sees {:?}", data); // thread order varies between runs
        }));
    }
    for h in handles {
        h.join().unwrap();
    }
}`
    },
    {
      label: 'RefCell',
      language: 'rust',
      code: `use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct Account {
    balance: i32,
}

fn main() {
    // Several owners, each able to mutate: Rc<RefCell<T>>
    let shared = Rc::new(RefCell::new(Account { balance: 100 }));
    let a = Rc::clone(&shared);
    let b = Rc::clone(&shared);

    a.borrow_mut().balance -= 30;
    b.borrow_mut().balance += 5;
    println!("{:?}", shared.borrow()); // Account { balance: 75 }

    // Any number of shared borrows is fine at the same time
    let r1 = shared.borrow();
    let r2 = shared.borrow();
    println!("{} {}", r1.balance, r2.balance);

    // let w = shared.borrow_mut();
    // panics at RUNTIME: already borrowed (BorrowMutError)
    // The same mistake with plain references would not have compiled at all.

    drop(r1);
    drop(r2);

    // try_borrow_mut returns a Result instead of panicking
    let attempt = shared.try_borrow_mut();
    println!("{}", attempt.is_ok()); // true
}`
    },
    {
      label: 'Weak & Trees',
      language: 'rust',
      code: `use std::cell::RefCell;
use std::rc::{Rc, Weak};

struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,        // weak: does not keep the parent alive
    children: RefCell<Vec<Rc<Node>>>,   // strong: the parent owns its children
}

fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });
    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade().map(|p| p.value)); // None

    let branch = Rc::new(Node {
        value: 5,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![Rc::clone(&leaf)]),
    });

    // Point the leaf back at its parent with a Weak pointer
    *leaf.parent.borrow_mut() = Rc::downgrade(&branch);
    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade().map(|p| p.value)); // Some(5)

    println!("branch strong={} weak={}", Rc::strong_count(&branch), Rc::weak_count(&branch)); // 1 1
    println!("leaf   strong={} weak={}", Rc::strong_count(&leaf), Rc::weak_count(&leaf));     // 2 0
}`
    },
    {
      label: 'Drop',
      language: 'rust',
      code: `struct Guard(&'static str);

impl Drop for Guard {
    fn drop(&mut self) {
        println!("dropping {}", self.0);
    }
}

fn main() {
    let _a = Guard("a");
    let b = Guard("b");

    drop(b); // drop early: prints "dropping b" immediately
    println!("end of main");
} // _a is dropped here: prints "dropping a"

// Output:
//   dropping b
//   end of main
//   dropping a`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Defining a recursive type without a Box',
      wrong: `enum List {
    Cons(i32, List),
    Nil,
}
// error[E0072]: recursive type List has infinite size`,
      right: `enum List {
    Cons(i32, Box<List>),
    Nil,
}`,
      explanation: 'The compiler must know a type\'s size, and a List that contains a List directly would be infinitely large. A Box has a fixed size regardless of what it points to, so it breaks the recursion.'
    },
    {
      title: 'Trying to mutate the value inside an Rc',
      wrong: `let shared = Rc::new(5);
*shared += 1;
// error[E0594]: cannot assign to data in an Rc`,
      right: `let shared = Rc::new(RefCell::new(5));
*shared.borrow_mut() += 1;`,
      explanation: 'Several owners mutating at once would break the borrowing rules, so Rc only gives read access. Wrap the value in a RefCell for single-threaded interior mutability, or a Mutex when threads are involved.'
    },
    {
      title: 'Sharing an Rc across threads',
      wrong: `let data = Rc::new(vec![1, 2, 3]);
std::thread::spawn(move || println!("{:?}", data));
// error[E0277]: Rc<Vec<i32>> cannot be sent between threads safely`,
      right: `let data = Arc::new(vec![1, 2, 3]);
let d = Arc::clone(&data);
std::thread::spawn(move || println!("{:?}", d));`,
      explanation: 'Rc uses non-atomic counters, so two threads updating the count at once could corrupt it. The compiler prevents that by marking Rc as not Send. Arc uses atomic counters and is the correct choice across threads.'
    },
    {
      title: 'Borrowing a RefCell mutably while it is already borrowed',
      wrong: `let cell = RefCell::new(vec![1, 2, 3]);
let first = cell.borrow();
cell.borrow_mut().push(4);
println!("{}", first[0]);
// panics at runtime: already borrowed (BorrowMutError)`,
      right: `let cell = RefCell::new(vec![1, 2, 3]);
let first = cell.borrow()[0]; // copy the value out; the borrow ends at the semicolon
cell.borrow_mut().push(4);
println!("{first}");`,
      explanation: 'RefCell enforces the one-writer-or-many-readers rule at runtime, so a violation is a panic rather than a compile error. Keep borrows short-lived by copying out what you need, and use try_borrow_mut when a conflict is possible.'
    },
    {
      title: 'Creating a reference cycle with Rc',
      wrong: `struct Node {
    next: RefCell<Option<Rc<Node>>>,
}
// a.next = Some(b.clone()); b.next = Some(a.clone());
// each node keeps the other alive, so neither is ever freed: a memory leak`,
      right: `struct Node {
    next: RefCell<Option<Rc<Node>>>,
    prev: RefCell<Option<Weak<Node>>>, // backward links are weak
}`,
      explanation: 'Reference counting frees a value only when its strong count reaches zero, and two values pointing at each other never do. Make one direction of the relationship a Weak pointer so it does not keep the target alive.'
    },
    {
      title: 'Reaching for Rc<RefCell<T>> to silence the borrow checker',
      wrong: `// A shared, mutable graph of Rc<RefCell<Node>> everywhere,
// used because passing references around felt awkward`,
      right: `// Prefer plain ownership and borrowing first: pass &mut where one
// place mutates, or restructure the data so a single owner holds it.
// Use Rc<RefCell<T>> only when several owners genuinely need to mutate.`,
      explanation: 'Every RefCell turns a compile-time guarantee into a possible runtime panic. It is the right tool for graphs, observers and similar shapes, but if a change in ownership structure removes the need for it, the result is usually simpler and safer.'
    },
  ];

  challenge: Challenge = {
    title: 'Shared Counter',
    language: 'rust',
    description: `Build two counters that increment the SAME underlying number, using shared ownership with interior mutability.

Define \`struct Counter { count: Rc<RefCell<u32>> }\` with:
- \`fn new(count: &Rc<RefCell<u32>>) -> Counter\` — stores a new owner of the shared cell (do not deep-copy the number).
- \`fn increment(&self)\` — adds one to the shared value.
- \`fn get(&self) -> u32\` — reads the shared value.

Example:
\`\`\`
let shared = Rc::new(RefCell::new(0));
let c1 = Counter::new(&shared);
let c2 = Counter::new(&shared);
c1.increment(); c1.increment(); c2.increment();
c1.get()                    // 3
c2.get()                    // 3
Rc::strong_count(&shared)   // 3
\`\`\`

After \`drop(c2)\`, the strong count goes back down to 2.`,
    hints: [
      'Rc::clone(count) increments the reference count and gives you a new owner of the same allocation.',
      'increment takes &self, not &mut self, because RefCell lets you mutate through a shared reference.',
      'Use *self.count.borrow_mut() += 1 to change the value and *self.count.borrow() to read it.',
      'Dropping a Counter drops its Rc field, which decrements the strong count automatically.',
    ],
    starterCode: `use std::cell::RefCell;
use std::rc::Rc;

struct Counter {
    count: Rc<RefCell<u32>>,
}

impl Counter {
    // TODO: new, increment, get
}

fn main() {
    // let shared = Rc::new(RefCell::new(0));
    // let c1 = Counter::new(&shared);
    // let c2 = Counter::new(&shared);
    // c1.increment(); c1.increment(); c2.increment();
    // println!("{} {}", c1.get(), c2.get());       // 3 3
    // println!("{}", Rc::strong_count(&shared));   // 3
    // drop(c2);
    // println!("{}", Rc::strong_count(&shared));   // 2
}`,
    solution: `use std::cell::RefCell;
use std::rc::Rc;

struct Counter {
    count: Rc<RefCell<u32>>,
}

impl Counter {
    fn new(count: &Rc<RefCell<u32>>) -> Counter {
        Counter { count: Rc::clone(count) }
    }

    fn increment(&self) {
        *self.count.borrow_mut() += 1;
    }

    fn get(&self) -> u32 {
        *self.count.borrow()
    }
}

fn main() {
    let shared = Rc::new(RefCell::new(0));
    let c1 = Counter::new(&shared);
    let c2 = Counter::new(&shared);

    c1.increment();
    c1.increment();
    c2.increment();

    println!("{} {}", c1.get(), c2.get());       // 3 3
    println!("{}", Rc::strong_count(&shared));   // 3
    drop(c2);
    println!("{}", Rc::strong_count(&shared));   // 2
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why does enum List { Cons(i32, List), Nil } fail to compile?',
      options: [
        'Enums cannot hold integers',
        'The type contains itself directly, so it would have infinite size; the recursive part needs a Box',
        'Nil is a reserved word',
        'Enums cannot be recursive in any way',
      ],
      answer: 1,
      explanation: 'The compiler has to know how many bytes a List takes. A List containing a List directly has no finite size, whereas a Box is one pointer wide, so Cons(i32, Box of List) works.'
    },
    {
      q: 'What does Rc::clone(&a) do?',
      options: [
        'Moves the value out of a',
        'Creates a Weak pointer',
        'Makes a deep copy of the inner value',
        'Increments the reference count and returns another pointer to the same value',
      ],
      answer: 3,
      explanation: 'Cloning an Rc is cheap: it adds another owner of the same allocation by bumping a counter. The inner data is never copied, which is why the Rc::clone form is preferred.'
    },
    {
      q: 'Which smart pointer would you use to share a read-only value between threads?',
      options: ['Box<T>', 'Rc<T>', 'Arc<T>', 'RefCell<T>'],
      answer: 2,
      explanation: 'Arc uses atomic reference counts so it is safe to share between threads. Rc is not Send, so the compiler rejects it, and RefCell is not safe for concurrent access either.'
    },
    {
      q: 'What happens when you call borrow_mut() on a RefCell that already has an active borrow()?',
      options: [
        'It panics at runtime',
        'It silently returns a copy',
        'A compile error',
        'It waits until the first borrow ends',
      ],
      answer: 0,
      explanation: 'RefCell enforces the borrowing rules at runtime, so violating them panics with a BorrowMutError. Use try_borrow_mut to get a Result instead of a panic.'
    },
    {
      q: 'Why use Weak for a child\'s pointer back to its parent?',
      options: [
        'It is required by the Drop trait',
        'Weak pointers are faster',
        'A strong parent-to-child and child-to-parent pair would form a cycle and never be freed',
        'Rc does not allow parents',
      ],
      answer: 2,
      explanation: 'Reference counting cannot free a cycle of strong pointers. A Weak pointer does not add to the strong count, so the parent can be dropped and children can check with upgrade whether it still exists.'
    },
    {
      q: 'In what order are local variables dropped at the end of a scope?',
      options: [
        'In random order',
        'Alphabetically',
        'In the order they were declared',
        'In the reverse of the order they were declared',
      ],
      answer: 3,
      explanation: 'Rust drops locals in reverse order of declaration, so a value declared later, which may depend on an earlier one, is cleaned up first.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'If ownership is single by default, why do Rc and Arc exist?',
      a: 'Some data shapes have no single natural owner, such as a graph node with several parents or a cache entry referenced from many places. Rc and Arc relax the rule explicitly: they count owners at runtime and drop the value when the last one goes away. That shared ownership is opt-in, not the silent default.'
    },
    {
      q: 'What is the difference between Rc and Arc?',
      a: 'Both provide shared ownership through reference counting. Rc uses plain counters and is cheaper but is only valid within one thread, so the compiler refuses to send it to another. Arc uses atomic counters and can be shared across threads, at a small extra cost. Use Rc by default in single-threaded code and Arc when threads are involved.'
    },
    {
      q: 'What is interior mutability?',
      a: 'It is the ability to mutate a value through a shared reference. Normally the compiler forbids that, but types such as Cell and RefCell allow it by checking the rules in a different place: Cell by only allowing whole-value get and set, and RefCell by tracking borrows at runtime and panicking on a violation.'
    },
    {
      q: 'When should I use Box rather than putting a value on the stack?',
      a: 'Use Box when a type is recursive and needs a fixed size, when you need a trait object such as <code>Box&lt;dyn Trait&gt;</code>, or when a value is very large and you want to move a pointer rather than copy all of its bytes. Otherwise stack values are simpler and faster.'
    },
    {
      q: 'Can a reference cycle really leak memory in safe Rust?',
      a: 'Yes. Safe Rust guarantees memory safety, not the absence of leaks. Two Rc values that hold each other never reach a strong count of zero, so neither is dropped. It is not undefined behaviour, but it is a leak, and Weak pointers are the standard way to avoid it.'
    },
    {
      q: 'What does Deref coercion do?',
      a: 'When a function expects a reference to type A and you pass a reference to a smart pointer that dereferences to A, the compiler inserts the conversion for you. That is why you can pass &String where &str is expected, and &Box of T where &T is expected, without writing any explicit dereferencing.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Smart pointers own their data and add behaviour: Box for a single heap owner, Rc and Arc for shared ownership, RefCell for runtime-checked mutation, and Weak to break cycles.',
    mustKnow: [
      '<code>Box&lt;T&gt;</code> is one owner on the heap; it is required for recursive types and trait objects',
      '<code>Rc::clone</code> bumps a count and never copies the data; Rc gives read-only access',
      'Rc is single-threaded and not Send; <code>Arc&lt;T&gt;</code> is the thread-safe version',
      '<code>RefCell&lt;T&gt;</code> checks borrow rules at runtime, so a violation panics',
      '<code>Rc&lt;RefCell&lt;T&gt;&gt;</code> gives shared, mutable data on one thread; <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> does it across threads',
      'Strong Rc cycles leak memory; use <code>Weak</code> and <code>upgrade()</code> for back-pointers',
      'Drop runs cleanup at end of scope in reverse declaration order; <code>drop(x)</code> drops early',
    ],
    interviewFocus: [
      'Explain when you would use Box, Rc and Arc, and what each costs',
      'What is interior mutability, and what do you give up when using RefCell?',
      'How can a memory leak happen in safe Rust, and how do you prevent it?',
      'Why is Rc not Send but Arc is?',
      'What do the Deref and Drop traits provide for smart pointers?',
    ],
  };
}
