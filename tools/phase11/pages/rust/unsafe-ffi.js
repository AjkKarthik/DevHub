module.exports = {
  slug: 'unsafe-ffi',
  subtitle: 'What the unsafe keyword actually unlocks, raw pointers, wrapping unsafe code in safe APIs, the 2024-edition rules for extern blocks and attributes, and calling C from Rust (and Rust from C).',
  readingTime: 22,
  prerequisites: [{ label: 'Ownership & Borrowing', route: '/rust/ownership-borrowing' }, { label: 'Smart Pointers', route: '/rust/smart-pointers' }],
  apis: ['unsafe { }', '*const T / *mut T', 'unsafe extern "C"', '#[unsafe(no_mangle)]', 'CString / CStr', 'std::slice::from_raw_parts'],
  tip: 'Every unsafe block should carry a // SAFETY: comment explaining which invariant makes it sound, and should be wrapped in the smallest safe function that can uphold that invariant. Reviewers check the comment; clippy can enforce it with undocumented_unsafe_blocks.',
  gotchas: [
    'unsafe does not turn off the borrow checker or type checking — it only allows five extra operations; the rest of the language rules still apply.',
    'Undefined behaviour in an unsafe block can corrupt safe code far away; a bug may only appear in release builds or on another platform.',
    'In the 2024 edition extern blocks must be written unsafe extern and no_mangle/export_name must be wrapped as #[unsafe(...)].',
  ],
  quickRef: [
    { name: 'unsafe { ... }', type: 'keyword', desc: 'Block where the five unsafe operations are allowed; you promise the invariants hold' },
    { name: 'unsafe fn f()', type: 'keyword', desc: 'Callers must uphold documented preconditions; calling it requires an unsafe block' },
    { name: '*const T / *mut T', type: 'type', desc: 'Raw pointers: can be null, dangling or aliased; dereferencing needs unsafe' },
    { name: '&raw const x / &raw mut x', type: 'operator', desc: 'Create a raw pointer without first creating a reference (Rust 1.82+)' },
    { name: 'unsafe extern "C" { fn abs(x: i32) -> i32; }', type: 'syntax', desc: 'Declare foreign C functions (2024 edition requires unsafe extern)' },
    { name: '#[unsafe(no_mangle)] pub extern "C" fn', type: 'decorator', desc: 'Export a Rust function with a stable C symbol name' },
    { name: 'CString::new(s) / CStr::from_ptr(p)', type: 'class', desc: 'Owned / borrowed NUL-terminated C strings' },
    { name: 'std::slice::from_raw_parts(ptr, len)', type: 'function', desc: 'Build a slice from a pointer and length you guarantee are valid' },
    { name: 'cargo miri test', type: 'function', desc: 'Interpret tests and detect undefined behaviour (nightly toolchain)' },
  ],
  theory: [
    { heading: 'What unsafe allows', points: [
      'Inside an `unsafe` block you may do exactly five additional things: dereference a raw pointer, call an `unsafe` function (including foreign functions), access or modify a mutable `static`, implement an `unsafe` trait (like `Send` or `Sync`), and read fields of a `union`.',
      'Everything else is still checked: borrowing rules for references, types, lifetimes. `unsafe` means "the compiler cannot verify this; I have".',
      'Undefined behaviour (UB) includes dereferencing dangling or misaligned pointers, creating two `&mut` to the same data, producing an invalid value (a `bool` that is 2, an invalid `char`), and data races. The optimiser assumes UB never happens, so its effects can be arbitrary.',
      'The standard library is built on small amounts of carefully reviewed unsafe code (`Vec`, `String`, `Arc`) exposed through safe APIs — the same pattern you should follow.',
    ] },
    { heading: 'Raw pointers and safe abstractions', points: [
      'Raw pointers `*const T` and `*mut T` can be created in safe code (`&raw const x`, `ptr as *const T`), but only dereferenced in `unsafe`.',
      'They may be null, dangling, unaligned, or alias each other, and they carry no lifetime — that is exactly what makes them flexible and dangerous.',
      'Build safe APIs around unsafe internals: check every precondition in safe code (bounds, alignment, non-null), then perform the unsafe operation once. `split_at_mut` in the standard library is the classic example.',
      'Since the 2024 edition the `unsafe_op_in_unsafe_fn` lint warns when an unsafe operation inside an `unsafe fn` is not in its own `unsafe` block, so each operation is justified individually.',
      'Mutable statics are a common source of UB; in the 2024 edition taking a reference to a `static mut` is denied. Prefer atomics, `Mutex` or `OnceLock`.',
    ] },
    { heading: 'Calling C from Rust', points: [
      'Declare foreign functions in an `unsafe extern "C" { ... }` block (2024 edition). Each item can be marked `safe fn` or `unsafe fn`; calling an unsafe one requires an `unsafe` block.',
      'Only C-compatible types cross the boundary: integers, floats, raw pointers, `#[repr(C)]` structs and enums, and function pointers. Rust `String`, `Vec` and references to non-`repr(C)` types are not FFI-safe.',
      'Strings: create an owned NUL-terminated `CString` (which fails if the input contains an interior NUL) and pass `.as_ptr()`. Keep the `CString` alive for as long as C uses the pointer.',
      'Memory must be freed by the allocator that allocated it: free C memory with the C function provided for it, and Rust memory by handing it back to Rust.',
      'Tools like `bindgen` generate declarations from C headers; `cc` compiles C sources in `build.rs`.',
    ] },
    { heading: 'Calling Rust from C', points: [
      'Export functions with `#[unsafe(no_mangle)] pub extern "C" fn name(...)` (the attribute is written as unsafe since the 2024 edition because a wrong symbol name can clash with another).',
      'Build a C-compatible library with `crate-type = ["cdylib"]` or `["staticlib"]`; `cbindgen` can generate a C header.',
      'Never let a panic unwind across an `extern "C"` boundary into C: catch it with `std::panic::catch_unwind` and return an error code. (Since Rust 1.81 an unwinding panic out of an `extern "C"` function aborts the process.)',
      'Opaque handles (`Box::into_raw` to give a pointer to C, `Box::from_raw` in a matching `free` function) let C own Rust objects safely.',
    ] },
  ],
  codeTabs: [
    { label: 'Raw pointers & safe wrappers', language: 'rust', code: `/// Split a mutable slice into two non-overlapping halves.
/// (std already has split_at_mut; this shows how it is built.)
fn split_halves(v: &mut [i32]) -> (&mut [i32], &mut [i32]) {
    let len = v.len();
    let mid = len / 2;
    let ptr = v.as_mut_ptr();
    // SAFETY: [0, mid) and [mid, len) are within the slice and do not
    // overlap, so the two &mut slices never alias.
    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut x = 10;
    let p = &raw mut x;              // creating a raw pointer is safe
    // SAFETY: p points to a live, aligned, initialised i32 with no other borrows.
    unsafe { *p += 5; }
    println!("x = {x}");

    let mut data = [1, 2, 3, 4, 5, 6];
    let (a, b) = split_halves(&mut data);
    a[0] = 100;
    b[0] = 400;
    println!("{data:?}");
}` },
    { label: 'Calling C (libc)', language: 'rust', code: `use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};

// 2024 edition: foreign blocks are \`unsafe extern\`.
// Items can be declared \`safe\` when calling them can never cause UB.
unsafe extern "C" {
    safe fn abs(x: c_int) -> c_int;
    fn strlen(s: *const c_char) -> usize;
    fn getenv(name: *const c_char) -> *const c_char;
}

fn c_strlen(s: &str) -> Option<usize> {
    let c = CString::new(s).ok()?;          // fails on interior NUL bytes
    // SAFETY: c is a valid NUL-terminated string alive for this call.
    Some(unsafe { strlen(c.as_ptr()) })
}

fn env_var(name: &str) -> Option<String> {
    let key = CString::new(name).ok()?;
    // SAFETY: key is valid; getenv returns null or a NUL-terminated string.
    let ptr = unsafe { getenv(key.as_ptr()) };
    if ptr.is_null() {
        return None;
    }
    // SAFETY: non-null pointer to a NUL-terminated C string owned by libc.
    Some(unsafe { CStr::from_ptr(ptr) }.to_string_lossy().into_owned())
}

fn main() {
    println!("abs(-7) = {}", abs(-7));      // declared safe: no unsafe block
    println!("{:?} {:?}", c_strlen("héllo"), c_strlen("bad\\0string"));
    println!("PATH set? {}", env_var("PATH").is_some());
}` },
    { label: 'Exporting to C', language: 'rust', code: `use std::panic::catch_unwind;

pub struct Counter { value: u64 }

/// Create a counter. C must release it with counter_free.
#[unsafe(no_mangle)]
pub extern "C" fn counter_new(start: u64) -> *mut Counter {
    Box::into_raw(Box::new(Counter { value: start }))
}

/// Returns the new value, or u64::MAX on a null pointer or panic.
#[unsafe(no_mangle)]
pub extern "C" fn counter_inc(c: *mut Counter) -> u64 {
    if c.is_null() { return u64::MAX; }
    // Never unwind across the FFI boundary
    catch_unwind(|| {
        // SAFETY: non-null and created by counter_new; C does not share it across threads.
        let c = unsafe { &mut *c };
        c.value += 1;
        c.value
    })
    .unwrap_or(u64::MAX)
}

#[unsafe(no_mangle)]
pub extern "C" fn counter_free(c: *mut Counter) {
    if !c.is_null() {
        // SAFETY: pointer came from Box::into_raw and is freed exactly once.
        drop(unsafe { Box::from_raw(c) });
    }
}

fn main() {
    // Simulate the C caller
    let c = counter_new(41);
    println!("{}", counter_inc(c));
    println!("{}", counter_inc(std::ptr::null_mut()));
    counter_free(c);
}` },
  ],
  mistakes: [
    { title: 'Dereferencing a raw pointer outside unsafe', checkWrong: true, wrapFn: true, wrong: `let x = 5;
let p = &raw const x;
let y = *p;`, right: `let x = 5;
let p = &raw const x;
// SAFETY: p points to x, which is alive and initialised.
let y = unsafe { *p };`, explanation: 'Dereferencing a raw pointer is one of the operations that requires unsafe (E0133). The block marks the spot where you take responsibility for validity.' },
    { title: 'Old-style extern block in the 2024 edition', checkWrong: true, wrong: `extern "C" {
    fn abs(x: i32) -> i32;
}`, right: `unsafe extern "C" {
    safe fn abs(x: i32) -> i32;
}`, explanation: 'Since the 2024 edition, extern blocks must be declared unsafe extern, because the declarations themselves are a promise about foreign code. Individual items can then be marked safe or unsafe.' },
    { title: 'Passing a temporary CString pointer', wrong: `let p = CString::new("hi").unwrap().as_ptr(); // CString dropped here
unsafe { strlen(p) };                          // dangling pointer`, right: `let s = CString::new("hi").unwrap();
let n = unsafe { strlen(s.as_ptr()) };         // s alive during the call`, explanation: 'as_ptr borrows from the CString; when the temporary is dropped at the end of the statement the pointer dangles. Bind the CString to a variable that outlives every use of the pointer.' },
    { title: 'Creating aliasing &mut from raw pointers', wrong: `let p = v.as_mut_ptr();
let a = unsafe { &mut *p };
let b = unsafe { &mut *p };   // two &mut to the same element: UB`, right: `let (a, b) = v.split_at_mut(1); // non-overlapping halves`, explanation: 'Two live &mut references to the same location are undefined behaviour even if you never use them at the same time in practice. Use APIs that prove disjointness, or stay with raw pointers until you are done.' },
    { title: 'Letting panics cross the FFI boundary', wrong: `#[unsafe(no_mangle)]
pub extern "C" fn parse(s: *const c_char) -> i32 {
    let s = unsafe { CStr::from_ptr(s) }.to_str().unwrap(); // may panic
    s.parse().unwrap()
}`, right: `#[unsafe(no_mangle)]
pub extern "C" fn parse(s: *const c_char) -> i32 {
    std::panic::catch_unwind(|| {
        let s = unsafe { CStr::from_ptr(s) }.to_str().ok()?;
        s.parse().ok()
    }).ok().flatten().unwrap_or(-1)
}`, explanation: 'A panic that tries to unwind out of an extern "C" function aborts the whole process (Rust 1.81+). Return error codes and catch panics at the boundary.' },
  ],
  challenge: {
    title: 'A safe wrapper over an unsafe buffer',
    language: 'rust',
    description: 'Implement struct RawBuf { ptr: *mut u8, len: usize } that allocates len zeroed bytes with std::alloc::alloc_zeroed and frees them in Drop. Provide safe methods get(&self, i: usize) -> Option<u8> and set(&mut self, i: usize, v: u8) -> bool that check bounds before touching the pointer, and as_slice(&self) -> &[u8]. Each unsafe block needs a // SAFETY: comment. Handle len == 0 without allocating.',
    hints: ['Layout::array::<u8>(len).unwrap() gives the layout; alloc_zeroed may return null — call handle_alloc_error.', 'For len == 0 use NonNull::dangling().as_ptr() and skip dealloc in Drop.', 'std::slice::from_raw_parts(self.ptr, self.len) is valid for len 0 with a dangling, aligned pointer.'],
    starterCode: `use std::alloc::{alloc_zeroed, dealloc, handle_alloc_error, Layout};
use std::ptr::NonNull;

struct RawBuf { ptr: *mut u8, len: usize }

impl RawBuf {
    fn new(len: usize) -> Self { todo!() }
    fn get(&self, i: usize) -> Option<u8> { todo!() }
    fn set(&mut self, i: usize, v: u8) -> bool { todo!() }
    fn as_slice(&self) -> &[u8] { todo!() }
}

impl Drop for RawBuf {
    fn drop(&mut self) { todo!() }
}

fn main() {}`,
    solution: `use std::alloc::{alloc_zeroed, dealloc, handle_alloc_error, Layout};
use std::ptr::NonNull;

struct RawBuf { ptr: *mut u8, len: usize }

impl RawBuf {
    fn new(len: usize) -> Self {
        if len == 0 {
            return RawBuf { ptr: NonNull::dangling().as_ptr(), len: 0 };
        }
        let layout = Layout::array::<u8>(len).unwrap();
        // SAFETY: layout has non-zero size.
        let ptr = unsafe { alloc_zeroed(layout) };
        if ptr.is_null() {
            handle_alloc_error(layout);
        }
        RawBuf { ptr, len }
    }

    fn get(&self, i: usize) -> Option<u8> {
        if i >= self.len { return None; }
        // SAFETY: i < len, and the allocation holds len initialised bytes.
        Some(unsafe { *self.ptr.add(i) })
    }

    fn set(&mut self, i: usize, v: u8) -> bool {
        if i >= self.len { return false; }
        // SAFETY: bounds checked above; &mut self guarantees exclusive access.
        unsafe { *self.ptr.add(i) = v; }
        true
    }

    fn as_slice(&self) -> &[u8] {
        // SAFETY: ptr is valid (or dangling and aligned for len 0) for len bytes,
        // and the returned slice borrows self, so it cannot outlive the buffer.
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }
}

impl Drop for RawBuf {
    fn drop(&mut self) {
        if self.len > 0 {
            // SAFETY: allocated in new with exactly this layout, freed once.
            unsafe { dealloc(self.ptr, Layout::array::<u8>(self.len).unwrap()) }
        }
    }
}

fn main() {
    let mut b = RawBuf::new(4);
    println!("{} {}", b.set(1, 42), b.set(9, 1));   // true false
    println!("{:?} {:?} {:?}", b.get(1), b.get(9), b.as_slice()); // Some(42) None [0, 42, 0, 0]
    let empty = RawBuf::new(0);
    println!("{:?}", empty.as_slice());               // []
}`,
  },
  quiz: [
    { q: 'Which of these does unsafe NOT allow?', options: ['Dereferencing a raw pointer', 'Calling an unsafe function', 'Ignoring the borrow checker for references', 'Mutating a static mut'], answer: 2, explanation: 'unsafe adds five capabilities; it does not disable borrow checking of references, type checking or lifetimes.' },
    { q: 'What is the 2024-edition syntax for declaring foreign C functions?', options: ['extern "C" { ... }', 'unsafe extern "C" { ... }', 'ffi "C" { ... }', '#[extern(C)] mod c { ... }'], answer: 1, explanation: 'The 2024 edition requires unsafe extern blocks; items inside can be marked safe or unsafe.' },
    { q: 'Why is CString::new("x").unwrap().as_ptr() passed directly to C dangerous?', options: ['CString is not FFI-safe', 'The temporary CString is dropped at the end of the statement, leaving a dangling pointer', 'as_ptr returns a Rust reference', 'C strings must be UTF-16'], answer: 1, explanation: 'The pointer borrows the CString. Keep the CString in a variable for as long as the pointer is used.' },
    { q: 'What happens if a panic unwinds out of an extern "C" function in modern Rust?', options: ['C receives an exception', 'The process aborts', 'The panic is silently ignored', 'It returns 0'], answer: 1, explanation: 'Since Rust 1.81, unwinding out of an extern "C" function aborts. Catch panics at the boundary and return an error code.' },
    { q: 'What is a "safe abstraction" over unsafe code?', options: ['Code that never uses unsafe', 'A safe function or type whose implementation uses unsafe but checks every precondition so callers cannot trigger UB', 'Marking a function unsafe', 'Using Miri in CI'], answer: 1, explanation: 'Vec, String and split_at_mut are examples: internally unsafe, but their public API cannot be misused in a way that causes undefined behaviour.' },
  ],
  qna: [
    { q: 'What does unsafe actually mean in Rust?', a: 'It marks code where the programmer, not the compiler, guarantees certain invariants. Inside `unsafe` you can dereference raw pointers, call unsafe functions (including FFI), touch mutable statics, implement unsafe traits and read union fields. Everything else is still checked. An `unsafe fn` declares preconditions its callers must meet; an `unsafe` block is where someone asserts they are met.' },
    { q: 'How do you write safe abstractions over unsafe code?', a: 'Keep the unsafe part as small as possible, encapsulate it in a module with private fields so invariants cannot be broken from outside, check every precondition (bounds, null, alignment, aliasing) in safe code before the unsafe operation, document each block with a `// SAFETY:` comment, and test it under Miri. The goal is that no sequence of calls to the public safe API can cause undefined behaviour.' },
    { q: 'What types can cross an FFI boundary?', a: 'Primitive integers and floats, raw pointers, function pointers, and types with a defined layout: `#[repr(C)]` structs, `#[repr(C)]` or `#[repr(u8)]`-style enums, and `Option` of references or `NonNull` (null-pointer optimisation). Rust-specific types like `String`, `Vec`, slices, trait objects and normal references to non-`repr(C)` data have no stable layout and must be converted, e.g. a `&str` to a `CString` or a pointer plus length.' },
    { q: 'What is Miri?', a: 'Miri is an interpreter for Rust\'s mid-level IR that runs your tests while checking for undefined behaviour: out-of-bounds or dangling accesses, invalid values, aliasing violations under the Stacked/Tree Borrows model, data races and memory leaks. Run it with `cargo +nightly miri test`. It is slow, so it is used on the unit tests of crates that contain unsafe code rather than on everything.' },
    { q: 'What changed for unsafe code in the 2024 edition?', a: 'Several rules became stricter to make unsafety explicit: extern blocks must be `unsafe extern` (with items optionally marked `safe`), attributes like `no_mangle`, `export_name` and `link_section` must be written as `#[unsafe(...)]`, the `unsafe_op_in_unsafe_fn` lint warns so each unsafe operation inside an `unsafe fn` needs its own block, and references to `static mut` are denied by default.' },
  ],
  revision: {
    oneLiner: 'unsafe unlocks five operations the compiler cannot check; wrap them in small, documented safe abstractions, and treat the FFI boundary as a contract about types, ownership and panics.',
    mustKnow: [
      'Five unsafe superpowers: raw deref, unsafe calls, `static mut`, unsafe traits, unions.',
      'UB includes dangling/aliased `&mut`, invalid values and data races.',
      'Raw pointers are created safely but dereferenced in `unsafe`.',
      '2024 edition: `unsafe extern`, `#[unsafe(no_mangle)]`, `unsafe_op_in_unsafe_fn`.',
      'Use `CString`/`CStr` for C strings and keep owners alive.',
      'Never unwind across `extern "C"`; catch panics and return codes.',
    ],
    interviewFocus: [
      'List what unsafe allows and what it does not.',
      'Explain how Vec or split_at_mut provide safe APIs over unsafe code.',
      'Describe FFI-safe types and memory ownership across the boundary.',
    ],
  },
};
