module.exports = {
  slug: 'smart-pointers',
  subtitle: 'Box for heap allocation and recursive types, Rc and Arc for shared ownership, Cell and RefCell for interior mutability, Weak to break cycles, and the Deref and Drop traits behind them.',
  readingTime: 24,
  prerequisites: [{ label: 'Ownership & Borrowing', route: '/rust/ownership-borrowing' }, { label: 'Traits & Generics', route: '/rust/traits-generics' }],
  apis: ['Box<T>', 'Rc<T> / Arc<T>', 'RefCell<T> / Cell<T>', 'Weak<T>', 'Deref / Drop', 'Cow<str>'],
  tip: 'Rc<RefCell<T>> is a legitimate tool for graphs and shared UI state, but it moves borrow checking to runtime. If you find it spreading through a codebase, consider indices into a Vec (an arena) or message passing instead.',
  gotchas: [
    'RefCell panics at runtime if you call borrow_mut() while another borrow is alive — the rules still apply, they are just checked later.',
    'Reference cycles of Rc (a parent and child pointing at each other) are never freed; make the back-pointer a Weak.',
    'Rc and RefCell are not thread-safe (not Send/Sync); across threads use Arc with Mutex, RwLock or atomics.',
  ],
  quickRef: [
    { name: 'Box::new(value)', type: 'function', desc: 'Own a value on the heap; size is known (a pointer) so recursive types become possible' },
    { name: 'Rc::new(v) / Rc::clone(&rc)', type: 'function', desc: 'Reference-counted shared ownership in one thread; clone only bumps a counter' },
    { name: 'Arc<T>', type: 'type', desc: 'Atomically reference-counted Rc that can be shared across threads' },
    { name: 'RefCell::borrow() / borrow_mut()', type: 'method', desc: 'Borrow rules checked at runtime; violations panic' },
    { name: 'Cell::get() / set()', type: 'method', desc: 'Interior mutability for Copy values with no borrows handed out' },
    { name: 'Rc::downgrade(&rc) -> Weak<T>', type: 'function', desc: 'Non-owning pointer; upgrade() returns Option<Rc<T>>' },
    { name: 'Rc::strong_count(&rc)', type: 'function', desc: 'How many owners currently hold the value' },
    { name: 'impl Deref for T', type: 'interface', desc: 'Makes *x and method calls auto-dereference to the target type' },
    { name: 'impl Drop for T', type: 'interface', desc: 'Custom cleanup that runs when the value goes out of scope' },
    { name: 'Cow<\'a, str>', type: 'type', desc: 'Clone-on-write: borrow when possible, allocate only when you modify' },
  ],
  theory: [
    { heading: 'Box<T>', points: [
      '`Box<T>` puts a value on the heap and owns it; dropping the box frees the memory. The box itself is just a pointer on the stack.',
      'Recursive types need indirection: `enum List { Cons(i32, List), Nil }` has infinite size (E0072), while `Cons(i32, Box<List>)` has a known size.',
      '`Box<dyn Trait>` stores values of different concrete types behind one pointer type — the basis of trait-object collections.',
      'Boxing a large value moves it off the stack, which can avoid expensive copies or stack overflows for very large arrays.',
    ] },
    { heading: 'Shared ownership: Rc and Arc', points: [
      '`Rc<T>` lets several owners hold the same value. `Rc::clone(&a)` increments a counter (it does not deep-copy); the value is dropped when the last `Rc` goes away.',
      '`Rc` gives shared, read-only access: you cannot get `&mut T` from an `Rc` while other clones exist. Combine it with `RefCell` (or `Cell`) to mutate.',
      '`Arc<T>` is the thread-safe version using atomic counter updates. It is slightly slower than `Rc`, so use `Rc` within one thread and `Arc` across threads.',
      'Writing `Rc::clone(&x)` rather than `x.clone()` is a convention that makes cheap reference-count bumps easy to tell apart from deep copies.',
    ] },
    { heading: 'Interior mutability: Cell and RefCell', points: [
      'Interior mutability lets you mutate data through a shared reference, with the safety check moved from compile time to runtime (or avoided entirely for `Cell`).',
      '`Cell<T>` works with `get`/`set`/`replace` and never hands out references, so it needs no runtime tracking — ideal for counters and flags of `Copy` types.',
      '`RefCell<T>` tracks borrows at runtime: `borrow()` returns a `Ref`, `borrow_mut()` a `RefMut`. Violating "many readers or one writer" panics with `RefCell already borrowed` / `RefCell already mutably borrowed`. `try_borrow_mut()` returns a `Result` instead.',
      'Keep `RefCell` borrows short: do not hold a `borrow_mut()` guard across a call that might borrow the same cell again.',
      'The thread-safe equivalents are `Mutex<T>`, `RwLock<T>`, atomics, and `OnceLock`/`LazyLock` (Rust 1.80+) for lazily initialised globals.',
    ] },
    { heading: 'Weak, Deref and Drop', points: [
      '`Rc` cycles leak because neither count reaches zero. Make one direction non-owning with `Weak<T>` (from `Rc::downgrade`); `weak.upgrade()` returns `None` once the value is gone.',
      'Typical use: in a tree, parents own their children (`Vec<Rc<Node>>`) and each child holds a `Weak` back-pointer to its parent.',
      '`Deref` makes a smart pointer behave like a reference: `*b`, method calls on `b`, and deref coercion (`&Box<String>` → `&String` → `&str`).',
      '`Drop::drop` runs automatically at the end of scope. Locals drop in reverse declaration order; struct fields drop in declaration order. Call `drop(x)` to release early (for example a lock guard).',
      '`Cow<\'a, str>` returns borrowed data on the fast path and owned data only when a change was needed — useful for normalising input.',
    ] },
  ],
  codeTabs: [
    { label: 'Box & recursive types', language: 'rust', code: `#[derive(Debug)]
enum Expr {
    Num(f64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

fn eval(e: &Expr) -> f64 {
    match e {
        Expr::Num(n) => *n,
        Expr::Add(a, b) => eval(a) + eval(b),   // &Box<Expr> derefs to &Expr
        Expr::Mul(a, b) => eval(a) * eval(b),
    }
}

fn main() {
    use Expr::*;
    // (2 + 3) * 4
    let tree = Mul(Box::new(Add(Box::new(Num(2.0)), Box::new(Num(3.0)))), Box::new(Num(4.0)));
    println!("{} = {}", "(2 + 3) * 4", eval(&tree));
    println!("Box<Expr> is {} bytes on the stack", std::mem::size_of::<Box<Expr>>());
}` },
    { label: 'Rc + RefCell', language: 'rust', code: `use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct Account { owner: String, balance: i64 }

fn main() {
    let shared = Rc::new(RefCell::new(Account { owner: "ada".into(), balance: 100 }));

    // Two "owners" of the same account
    let wallet = Rc::clone(&shared);
    let audit = Rc::clone(&shared);
    println!("owners: {}", Rc::strong_count(&shared)); // 3

    wallet.borrow_mut().balance -= 30;            // runtime-checked &mut
    println!("{} has {}", audit.borrow().owner, audit.borrow().balance);

    // Breaking the rule is a panic, not a compile error.
    let reader = shared.borrow();
    let attempt = shared.try_borrow_mut();        // safe check instead of panic
    println!("can mutate while reading? {}", attempt.is_ok()); // false
    drop(reader);
    println!("after drop? {}", shared.try_borrow_mut().is_ok()); // true
}` },
    { label: 'Weak back-pointers', language: 'rust', code: `use std::cell::RefCell;
use std::rc::{Rc, Weak};

#[derive(Debug)]
struct Node {
    name: String,
    parent: RefCell<Weak<Node>>,        // non-owning
    children: RefCell<Vec<Rc<Node>>>,   // owning
}

fn node(name: &str) -> Rc<Node> {
    Rc::new(Node { name: name.into(), parent: RefCell::new(Weak::new()), children: RefCell::new(vec![]) })
}

fn main() {
    let root = node("root");
    let leaf = node("leaf");
    *leaf.parent.borrow_mut() = Rc::downgrade(&root);
    root.children.borrow_mut().push(Rc::clone(&leaf));

    let parent_name = leaf.parent.borrow().upgrade().map(|p| p.name.clone());
    println!("leaf's parent: {parent_name:?}");
    println!("root strong={} weak={}", Rc::strong_count(&root), Rc::weak_count(&root));

    drop(root);   // no cycle of strong refs, so root is freed
    println!("parent after drop: {:?}", leaf.parent.borrow().upgrade().map(|p| p.name.clone()));
}` },
    { label: 'Drop, Cell & Cow', language: 'rust', code: `use std::borrow::Cow;
use std::cell::Cell;

struct Guard(&'static str);
impl Drop for Guard {
    fn drop(&mut self) { println!("drop {}", self.0); }
}

struct Counter { hits: Cell<u32> }
impl Counter {
    fn hit(&self) { self.hits.set(self.hits.get() + 1); } // &self, still mutates
}

fn normalise(input: &str) -> Cow<'_, str> {
    if input.contains(' ') {
        Cow::Owned(input.replace(' ', "_"))   // allocate only when needed
    } else {
        Cow::Borrowed(input)
    }
}

fn main() {
    {
        let _a = Guard("a");
        let _b = Guard("b");
        println!("end of scope");
    } // prints drop b, then drop a (reverse order)

    let c = Counter { hits: Cell::new(0) };
    c.hit(); c.hit();
    println!("hits = {}", c.hits.get());

    for s in ["plain", "has space"] {
        let n = normalise(s);
        let kind = if matches!(n, Cow::Borrowed(_)) { "borrowed" } else { "owned" };
        println!("{n} ({kind})");
    }
}` },
  ],
  mistakes: [
    { title: 'Recursive type without indirection', checkWrong: true, wrong: `enum List {
    Cons(i32, List),
    Nil,
}`, right: `enum List {
    Cons(i32, Box<List>),
    Nil,
}`, explanation: 'A type cannot contain itself directly because its size would be infinite (E0072). A Box has a fixed pointer size, so the recursion moves to the heap.' },
    { title: 'Holding a RefCell borrow too long', wrong: `let items = cell.borrow();
for i in items.iter() {
    cell.borrow_mut().push(*i); // panics: RefCell already borrowed
}`, right: `let snapshot: Vec<i32> = cell.borrow().clone();
cell.borrow_mut().extend(snapshot);`, explanation: 'The Ref guard lives until the end of the loop, so the inner borrow_mut panics at runtime. Copy out what you need and let the guard drop before mutating.' },
    { title: 'Creating an Rc cycle', wrong: `struct Node { next: RefCell<Option<Rc<Node>>> }
// a.next = Some(b.clone()); b.next = Some(a.clone()); // leaks`, right: `struct Node { next: RefCell<Option<Weak<Node>>> }
// at least one direction must be Weak`, explanation: 'Each Rc keeps the other alive, so their counts never reach zero and the memory is never freed. Use Weak for back-references or ownership cycles.' },
    { title: 'Using Rc across threads', checkWrong: true, wrapFn: true, wrong: `let data = std::rc::Rc::new(5);
let d = std::rc::Rc::clone(&data);
std::thread::spawn(move || println!("{d}"));`, right: `let data = std::sync::Arc::new(5);
let d = std::sync::Arc::clone(&data);
std::thread::spawn(move || println!("{d}"));`, explanation: 'Rc uses a non-atomic counter, so it is not Send and the compiler rejects moving it to another thread (E0277). Use Arc, plus Mutex or RwLock if the value must change.' },
  ],
  challenge: {
    title: 'Shared, observable counter',
    language: 'rust',
    description: 'Build a struct Hub { listeners: RefCell<Vec<Weak<Listener>>> } and struct Listener { name: String, received: Cell<u32> }. Hub::subscribe(&self, l: &Rc<Listener>) stores a Weak; Hub::publish(&self) increments received on every listener that is still alive and removes dead ones, returning how many were notified. Show that dropping a listener stops it being notified and that the Hub does not keep listeners alive.',
    hints: ['Store Rc::downgrade(l) in the vector.', 'retain lets you drop entries whose upgrade() returns None in the same pass.', 'Cell::set/get updates received through &self.'],
    starterCode: `use std::cell::{Cell, RefCell};
use std::rc::{Rc, Weak};

struct Listener { name: String, received: Cell<u32> }
struct Hub { listeners: RefCell<Vec<Weak<Listener>>> }

impl Hub {
    fn subscribe(&self, l: &Rc<Listener>) { todo!() }
    fn publish(&self) -> usize { todo!() }
}

fn main() {}`,
    solution: `use std::cell::{Cell, RefCell};
use std::rc::{Rc, Weak};

struct Listener { name: String, received: Cell<u32> }
struct Hub { listeners: RefCell<Vec<Weak<Listener>>> }

impl Hub {
    fn subscribe(&self, l: &Rc<Listener>) {
        self.listeners.borrow_mut().push(Rc::downgrade(l));
    }

    fn publish(&self) -> usize {
        let mut notified = 0;
        self.listeners.borrow_mut().retain(|w| match w.upgrade() {
            Some(l) => {
                l.received.set(l.received.get() + 1);
                notified += 1;
                true
            }
            None => false, // listener was dropped: forget it
        });
        notified
    }
}

fn main() {
    let hub = Hub { listeners: RefCell::new(Vec::new()) };
    let a = Rc::new(Listener { name: "a".into(), received: Cell::new(0) });
    let b = Rc::new(Listener { name: "b".into(), received: Cell::new(0) });
    hub.subscribe(&a);
    hub.subscribe(&b);

    println!("notified {}", hub.publish());      // 2
    drop(b);                                      // hub held only a Weak
    println!("notified {}", hub.publish());      // 1
    println!("{} received {}", a.name, a.received.get()); // a received 2
    println!("stored listeners: {}", hub.listeners.borrow().len()); // 1
}`,
  },
  quiz: [
    { q: 'Why does enum List { Cons(i32, List), Nil } fail to compile?', options: ['Enums cannot hold integers', 'The type would have infinite size; it needs indirection such as Box', 'Nil is a reserved word', 'Cons must be a struct'], answer: 1, explanation: 'E0072: recursive type has infinite size. Box<List> has a fixed pointer size.' },
    { q: 'What does Rc::clone(&rc) do?', options: ['Deep-copies the value', 'Increments the reference count and returns another pointer to the same value', 'Moves the value', 'Creates a Weak pointer'], answer: 1, explanation: 'Cloning an Rc is cheap: it bumps the strong count. The value is shared, not copied.' },
    { q: 'What happens if you call borrow_mut() on a RefCell that is already borrowed?', options: ['Compile error', 'It returns None', 'The thread panics with "RefCell already borrowed"', 'It waits until the borrow ends'], answer: 2, explanation: 'RefCell enforces the borrowing rules at runtime by panicking. try_borrow_mut returns a Result instead.' },
    { q: 'How do you prevent a memory leak between a parent and child that reference each other?', options: ['Use Box in both directions', 'Make one direction a Weak reference', 'Call drop twice', 'Use Arc instead of Rc'], answer: 1, explanation: 'Strong cycles keep counts above zero forever. Weak references do not contribute to the strong count.' },
    { q: 'Which type should you use to share mutable state between threads?', options: ['Rc<RefCell<T>>', 'Arc<Mutex<T>>', 'Box<Cell<T>>', 'Rc<Mutex<T>>'], answer: 1, explanation: 'Arc provides thread-safe reference counting and Mutex provides exclusive access across threads. Rc and RefCell are single-threaded.' },
  ],
  qna: [
    { q: 'When do you need Box<T>?', a: 'For recursive types (trees, linked lists, expression ASTs) that need a known size; for trait objects (`Box<dyn Trait>`) holding values of different concrete types; to move a large value to the heap to avoid big stack copies; and to transfer ownership of heap data cheaply by moving a pointer. If none of these apply, a plain value on the stack is usually better.' },
    { q: 'Explain interior mutability.', a: 'Normally mutation requires `&mut T`, which is exclusive. Interior mutability types (`Cell`, `RefCell`, `Mutex`, `RwLock`, atomics, `OnceCell`) let you mutate through a shared `&T` while still upholding the "one writer or many readers" rule — either by never handing out references (`Cell`), by checking at runtime (`RefCell` panics, `Mutex` blocks), or by using atomic hardware operations. It is how caches, counters and shared state work behind shared references.' },
    { q: 'What is the difference between Rc and Arc?', a: 'Both provide shared ownership through reference counting. `Rc` updates its counter with ordinary instructions, so it is fast but not thread-safe (it is neither `Send` nor `Sync`). `Arc` uses atomic operations so it can be shared and cloned across threads, at a small extra cost. Neither allows mutation by itself; pair them with `RefCell` (single thread) or `Mutex`/`RwLock` (multi-thread).' },
    { q: 'How can Rc leak memory if Rust is memory safe?', a: 'Memory safety means no use-after-free, double free or data races — it does not guarantee that memory is freed. Two `Rc` values that point to each other keep each other\'s strong count above zero, so neither is dropped. Leaks are considered safe in Rust (`std::mem::forget` and `Box::leak` are safe functions). Avoid cycles with `Weak` references or a different data layout such as an arena with indices.' },
    { q: 'In what order are values dropped?', a: 'Local variables are dropped in reverse order of declaration when the scope ends. Struct fields are dropped in the order they are declared, after the struct\'s own `Drop::drop` runs. Elements of a `Vec` are dropped in order. You can end a value\'s life early with `drop(x)`, which is common for releasing a `MutexGuard` or `RefMut` before doing more work.' },
  ],
  revision: {
    oneLiner: 'Box owns heap data, Rc/Arc share ownership by counting references, Cell/RefCell move borrow checks to runtime, and Weak breaks reference cycles.',
    mustKnow: [
      '`Box<T>` enables recursive types and trait objects.',
      '`Rc::clone` bumps a counter; `Rc` is single-threaded, `Arc` is thread-safe.',
      '`RefCell` checks borrows at runtime and panics on violations; `Cell` swaps `Copy` values.',
      '`Rc<RefCell<T>>` = shared mutable state in one thread; `Arc<Mutex<T>>` across threads.',
      'Cycles leak; use `Weak` for back-pointers.',
      '`Deref` enables auto-deref; `Drop` runs cleanup in reverse declaration order.',
    ],
    interviewFocus: [
      'Explain interior mutability and when RefCell panics.',
      'Explain how an Rc cycle leaks and how Weak fixes it.',
      'Compare Rc and Arc, RefCell and Mutex.',
    ],
  },
};
