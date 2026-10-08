import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
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
  selector: 'app-rust-unsafe-ffi',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './unsafe-ffi.html',
  styleUrl: './unsafe-ffi.scss'
})
export class RustUnsafeFfi {
  readingTime = 22;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'advanced';
  since = "Rust 2024";
  route = 'rust-unsafe-ffi';
  nextRoute = '/rust/web-frameworks';
  nextLabel = "Web Frameworks";

  prerequisites: Prerequisite[] = [
    {
      "label": "Ownership & Borrowing",
      "route": "/rust/ownership-borrowing"
    },
    {
      "label": "Smart Pointers",
      "route": "/rust/smart-pointers"
    }
  ];

  quickRef: QuickRefItem[] = [
    {
      "name": "unsafe { ... }",
      "type": "keyword",
      "desc": "Block where the five unsafe operations are allowed; you promise the invariants hold"
    },
    {
      "name": "unsafe fn f()",
      "type": "keyword",
      "desc": "Callers must uphold documented preconditions; calling it requires an unsafe block"
    },
    {
      "name": "*const T / *mut T",
      "type": "type",
      "desc": "Raw pointers: can be null, dangling or aliased; dereferencing needs unsafe"
    },
    {
      "name": "&raw const x / &raw mut x",
      "type": "operator",
      "desc": "Create a raw pointer without first creating a reference (Rust 1.82+)"
    },
    {
      "name": "unsafe extern \"C\" { fn abs(x: i32) -> i32; }",
      "type": "syntax",
      "desc": "Declare foreign C functions (2024 edition requires unsafe extern)"
    },
    {
      "name": "#[unsafe(no_mangle)] pub extern \"C\" fn",
      "type": "decorator",
      "desc": "Export a Rust function with a stable C symbol name"
    },
    {
      "name": "CString::new(s) / CStr::from_ptr(p)",
      "type": "class",
      "desc": "Owned / borrowed NUL-terminated C strings"
    },
    {
      "name": "std::slice::from_raw_parts(ptr, len)",
      "type": "function",
      "desc": "Build a slice from a pointer and length you guarantee are valid"
    },
    {
      "name": "cargo miri test",
      "type": "function",
      "desc": "Interpret tests and detect undefined behaviour (nightly toolchain)"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "What unsafe allows",
      "points": [
        "Inside an <code>unsafe</code> block you may do exactly five additional things: dereference a raw pointer, call an <code>unsafe</code> function (including foreign functions), access or modify a mutable <code>static</code>, implement an <code>unsafe</code> trait (like <code>Send</code> or <code>Sync</code>), and read fields of a <code>union</code>.",
        "Everything else is still checked: borrowing rules for references, types, lifetimes. <code>unsafe</code> means \"the compiler cannot verify this; I have\".",
        "Undefined behaviour (UB) includes dereferencing dangling or misaligned pointers, creating two <code>&amp;mut</code> to the same data, producing an invalid value (a <code>bool</code> that is 2, an invalid <code>char</code>), and data races. The optimiser assumes UB never happens, so its effects can be arbitrary.",
        "The standard library is built on small amounts of carefully reviewed unsafe code (<code>Vec</code>, <code>String</code>, <code>Arc</code>) exposed through safe APIs — the same pattern you should follow."
      ]
    },
    {
      "heading": "Raw pointers and safe abstractions",
      "points": [
        "Raw pointers <code>*const T</code> and <code>*mut T</code> can be created in safe code (<code>&amp;raw const x</code>, <code>ptr as *const T</code>), but only dereferenced in <code>unsafe</code>.",
        "They may be null, dangling, unaligned, or alias each other, and they carry no lifetime — that is exactly what makes them flexible and dangerous.",
        "Build safe APIs around unsafe internals: check every precondition in safe code (bounds, alignment, non-null), then perform the unsafe operation once. <code>split_at_mut</code> in the standard library is the classic example.",
        "Since the 2024 edition the <code>unsafe_op_in_unsafe_fn</code> lint warns when an unsafe operation inside an <code>unsafe fn</code> is not in its own <code>unsafe</code> block, so each operation is justified individually.",
        "Mutable statics are a common source of UB; in the 2024 edition taking a reference to a <code>static mut</code> is denied. Prefer atomics, <code>Mutex</code> or <code>OnceLock</code>."
      ]
    },
    {
      "heading": "Calling C from Rust",
      "points": [
        "Declare foreign functions in an <code>unsafe extern \"C\" { ... }</code> block (2024 edition). Each item can be marked <code>safe fn</code> or <code>unsafe fn</code>; calling an unsafe one requires an <code>unsafe</code> block.",
        "Only C-compatible types cross the boundary: integers, floats, raw pointers, <code>#[repr(C)]</code> structs and enums, and function pointers. Rust <code>String</code>, <code>Vec</code> and references to non-<code>repr(C)</code> types are not FFI-safe.",
        "Strings: create an owned NUL-terminated <code>CString</code> (which fails if the input contains an interior NUL) and pass <code>.as_ptr()</code>. Keep the <code>CString</code> alive for as long as C uses the pointer.",
        "Memory must be freed by the allocator that allocated it: free C memory with the C function provided for it, and Rust memory by handing it back to Rust.",
        "Tools like <code>bindgen</code> generate declarations from C headers; <code>cc</code> compiles C sources in <code>build.rs</code>."
      ]
    },
    {
      "heading": "Calling Rust from C",
      "points": [
        "Export functions with <code>#[unsafe(no_mangle)] pub extern \"C\" fn name(...)</code> (the attribute is written as unsafe since the 2024 edition because a wrong symbol name can clash with another).",
        "Build a C-compatible library with <code>crate-type = [\"cdylib\"]</code> or <code>[\"staticlib\"]</code>; <code>cbindgen</code> can generate a C header.",
        "Never let a panic unwind across an <code>extern \"C\"</code> boundary into C: catch it with <code>std::panic::catch_unwind</code> and return an error code. (Since Rust 1.81 an unwinding panic out of an <code>extern \"C\"</code> function aborts the process.)",
        "Opaque handles (<code>Box::into_raw</code> to give a pointer to C, <code>Box::from_raw</code> in a matching <code>free</code> function) let C own Rust objects safely."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Raw pointers & safe wrappers",
      "code": "/// Split a mutable slice into two non-overlapping halves.\n/// (std already has split_at_mut; this shows how it is built.)\nfn split_halves(v: &mut [i32]) -> (&mut [i32], &mut [i32]) {\n    let len = v.len();\n    let mid = len / 2;\n    let ptr = v.as_mut_ptr();\n    // SAFETY: [0, mid) and [mid, len) are within the slice and do not\n    // overlap, so the two &mut slices never alias.\n    unsafe {\n        (\n            std::slice::from_raw_parts_mut(ptr, mid),\n            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),\n        )\n    }\n}\n\nfn main() {\n    let mut x = 10;\n    let p = &raw mut x;              // creating a raw pointer is safe\n    // SAFETY: p points to a live, aligned, initialised i32 with no other borrows.\n    unsafe { *p += 5; }\n    println!(\"x = {x}\");\n\n    let mut data = [1, 2, 3, 4, 5, 6];\n    let (a, b) = split_halves(&mut data);\n    a[0] = 100;\n    b[0] = 400;\n    println!(\"{data:?}\");\n}",
      "language": "rust"
    },
    {
      "label": "Calling C (libc)",
      "code": "use std::ffi::{CStr, CString};\nuse std::os::raw::{c_char, c_int};\n\n// 2024 edition: foreign blocks are `unsafe extern`.\n// Items can be declared `safe` when calling them can never cause UB.\nunsafe extern \"C\" {\n    safe fn abs(x: c_int) -> c_int;\n    fn strlen(s: *const c_char) -> usize;\n    fn getenv(name: *const c_char) -> *const c_char;\n}\n\nfn c_strlen(s: &str) -> Option<usize> {\n    let c = CString::new(s).ok()?;          // fails on interior NUL bytes\n    // SAFETY: c is a valid NUL-terminated string alive for this call.\n    Some(unsafe { strlen(c.as_ptr()) })\n}\n\nfn env_var(name: &str) -> Option<String> {\n    let key = CString::new(name).ok()?;\n    // SAFETY: key is valid; getenv returns null or a NUL-terminated string.\n    let ptr = unsafe { getenv(key.as_ptr()) };\n    if ptr.is_null() {\n        return None;\n    }\n    // SAFETY: non-null pointer to a NUL-terminated C string owned by libc.\n    Some(unsafe { CStr::from_ptr(ptr) }.to_string_lossy().into_owned())\n}\n\nfn main() {\n    println!(\"abs(-7) = {}\", abs(-7));      // declared safe: no unsafe block\n    println!(\"{:?} {:?}\", c_strlen(\"héllo\"), c_strlen(\"bad\\0string\"));\n    println!(\"PATH set? {}\", env_var(\"PATH\").is_some());\n}",
      "language": "rust"
    },
    {
      "label": "Exporting to C",
      "code": "use std::panic::catch_unwind;\n\npub struct Counter { value: u64 }\n\n/// Create a counter. C must release it with counter_free.\n#[unsafe(no_mangle)]\npub extern \"C\" fn counter_new(start: u64) -> *mut Counter {\n    Box::into_raw(Box::new(Counter { value: start }))\n}\n\n/// Returns the new value, or u64::MAX on a null pointer or panic.\n#[unsafe(no_mangle)]\npub extern \"C\" fn counter_inc(c: *mut Counter) -> u64 {\n    if c.is_null() { return u64::MAX; }\n    // Never unwind across the FFI boundary\n    catch_unwind(|| {\n        // SAFETY: non-null and created by counter_new; C does not share it across threads.\n        let c = unsafe { &mut *c };\n        c.value += 1;\n        c.value\n    })\n    .unwrap_or(u64::MAX)\n}\n\n#[unsafe(no_mangle)]\npub extern \"C\" fn counter_free(c: *mut Counter) {\n    if !c.is_null() {\n        // SAFETY: pointer came from Box::into_raw and is freed exactly once.\n        drop(unsafe { Box::from_raw(c) });\n    }\n}\n\nfn main() {\n    // Simulate the C caller\n    let c = counter_new(41);\n    println!(\"{}\", counter_inc(c));\n    println!(\"{}\", counter_inc(std::ptr::null_mut()));\n    counter_free(c);\n}",
      "language": "rust"
    }
  ];

  mistakes: CommonMistake[] = [
    {
      "title": "Dereferencing a raw pointer outside unsafe",
      "wrong": "let x = 5;\nlet p = &raw const x;\nlet y = *p;",
      "right": "let x = 5;\nlet p = &raw const x;\n// SAFETY: p points to x, which is alive and initialised.\nlet y = unsafe { *p };",
      "explanation": "Dereferencing a raw pointer is one of the operations that requires unsafe (E0133). The block marks the spot where you take responsibility for validity."
    },
    {
      "title": "Old-style extern block in the 2024 edition",
      "wrong": "extern \"C\" {\n    fn abs(x: i32) -> i32;\n}",
      "right": "unsafe extern \"C\" {\n    safe fn abs(x: i32) -> i32;\n}",
      "explanation": "Since the 2024 edition, extern blocks must be declared unsafe extern, because the declarations themselves are a promise about foreign code. Individual items can then be marked safe or unsafe."
    },
    {
      "title": "Passing a temporary CString pointer",
      "wrong": "let p = CString::new(\"hi\").unwrap().as_ptr(); // CString dropped here\nunsafe { strlen(p) };                          // dangling pointer",
      "right": "let s = CString::new(\"hi\").unwrap();\nlet n = unsafe { strlen(s.as_ptr()) };         // s alive during the call",
      "explanation": "as_ptr borrows from the CString; when the temporary is dropped at the end of the statement the pointer dangles. Bind the CString to a variable that outlives every use of the pointer."
    },
    {
      "title": "Creating aliasing &mut from raw pointers",
      "wrong": "let p = v.as_mut_ptr();\nlet a = unsafe { &mut *p };\nlet b = unsafe { &mut *p };   // two &mut to the same element: UB",
      "right": "let (a, b) = v.split_at_mut(1); // non-overlapping halves",
      "explanation": "Two live &mut references to the same location are undefined behaviour even if you never use them at the same time in practice. Use APIs that prove disjointness, or stay with raw pointers until you are done."
    },
    {
      "title": "Letting panics cross the FFI boundary",
      "wrong": "#[unsafe(no_mangle)]\npub extern \"C\" fn parse(s: *const c_char) -> i32 {\n    let s = unsafe { CStr::from_ptr(s) }.to_str().unwrap(); // may panic\n    s.parse().unwrap()\n}",
      "right": "#[unsafe(no_mangle)]\npub extern \"C\" fn parse(s: *const c_char) -> i32 {\n    std::panic::catch_unwind(|| {\n        let s = unsafe { CStr::from_ptr(s) }.to_str().ok()?;\n        s.parse().ok()\n    }).ok().flatten().unwrap_or(-1)\n}",
      "explanation": "A panic that tries to unwind out of an extern \"C\" function aborts the whole process (Rust 1.81+). Return error codes and catch panics at the boundary."
    }
  ];

  challenge: Challenge = {
    "title": "A safe wrapper over an unsafe buffer",
    "language": "rust",
    "description": "Implement struct RawBuf { ptr: *mut u8, len: usize } that allocates len zeroed bytes with std::alloc::alloc_zeroed and frees them in Drop. Provide safe methods get(&self, i: usize) -> Option<u8> and set(&mut self, i: usize, v: u8) -> bool that check bounds before touching the pointer, and as_slice(&self) -> &[u8]. Each unsafe block needs a // SAFETY: comment. Handle len == 0 without allocating.",
    "hints": [
      "Layout::array::<u8>(len).unwrap() gives the layout; alloc_zeroed may return null — call handle_alloc_error.",
      "For len == 0 use NonNull::dangling().as_ptr() and skip dealloc in Drop.",
      "std::slice::from_raw_parts(self.ptr, self.len) is valid for len 0 with a dangling, aligned pointer."
    ],
    "starterCode": "use std::alloc::{alloc_zeroed, dealloc, handle_alloc_error, Layout};\nuse std::ptr::NonNull;\n\nstruct RawBuf { ptr: *mut u8, len: usize }\n\nimpl RawBuf {\n    fn new(len: usize) -> Self { todo!() }\n    fn get(&self, i: usize) -> Option<u8> { todo!() }\n    fn set(&mut self, i: usize, v: u8) -> bool { todo!() }\n    fn as_slice(&self) -> &[u8] { todo!() }\n}\n\nimpl Drop for RawBuf {\n    fn drop(&mut self) { todo!() }\n}\n\nfn main() {}",
    "solution": "use std::alloc::{alloc_zeroed, dealloc, handle_alloc_error, Layout};\nuse std::ptr::NonNull;\n\nstruct RawBuf { ptr: *mut u8, len: usize }\n\nimpl RawBuf {\n    fn new(len: usize) -> Self {\n        if len == 0 {\n            return RawBuf { ptr: NonNull::dangling().as_ptr(), len: 0 };\n        }\n        let layout = Layout::array::<u8>(len).unwrap();\n        // SAFETY: layout has non-zero size.\n        let ptr = unsafe { alloc_zeroed(layout) };\n        if ptr.is_null() {\n            handle_alloc_error(layout);\n        }\n        RawBuf { ptr, len }\n    }\n\n    fn get(&self, i: usize) -> Option<u8> {\n        if i >= self.len { return None; }\n        // SAFETY: i < len, and the allocation holds len initialised bytes.\n        Some(unsafe { *self.ptr.add(i) })\n    }\n\n    fn set(&mut self, i: usize, v: u8) -> bool {\n        if i >= self.len { return false; }\n        // SAFETY: bounds checked above; &mut self guarantees exclusive access.\n        unsafe { *self.ptr.add(i) = v; }\n        true\n    }\n\n    fn as_slice(&self) -> &[u8] {\n        // SAFETY: ptr is valid (or dangling and aligned for len 0) for len bytes,\n        // and the returned slice borrows self, so it cannot outlive the buffer.\n        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }\n    }\n}\n\nimpl Drop for RawBuf {\n    fn drop(&mut self) {\n        if self.len > 0 {\n            // SAFETY: allocated in new with exactly this layout, freed once.\n            unsafe { dealloc(self.ptr, Layout::array::<u8>(self.len).unwrap()) }\n        }\n    }\n}\n\nfn main() {\n    let mut b = RawBuf::new(4);\n    println!(\"{} {}\", b.set(1, 42), b.set(9, 1));   // true false\n    println!(\"{:?} {:?} {:?}\", b.get(1), b.get(9), b.as_slice()); // Some(42) None [0, 42, 0, 0]\n    let empty = RawBuf::new(0);\n    println!(\"{:?}\", empty.as_slice());               // []\n}"
  };

  quiz: QuizQuestion[] = [
    {
      "q": "Which of these does unsafe NOT allow?",
      "options": [
        "Dereferencing a raw pointer",
        "Calling an unsafe function",
        "Ignoring the borrow checker for references",
        "Mutating a static mut"
      ],
      "answer": 2,
      "explanation": "unsafe adds five capabilities; it does not disable borrow checking of references, type checking or lifetimes."
    },
    {
      "q": "What is the 2024-edition syntax for declaring foreign C functions?",
      "options": [
        "extern \"C\" { ... }",
        "unsafe extern \"C\" { ... }",
        "ffi \"C\" { ... }",
        "#[extern(C)] mod c { ... }"
      ],
      "answer": 1,
      "explanation": "The 2024 edition requires unsafe extern blocks; items inside can be marked safe or unsafe."
    },
    {
      "q": "Why is CString::new(\"x\").unwrap().as_ptr() passed directly to C dangerous?",
      "options": [
        "CString is not FFI-safe",
        "The temporary CString is dropped at the end of the statement, leaving a dangling pointer",
        "as_ptr returns a Rust reference",
        "C strings must be UTF-16"
      ],
      "answer": 1,
      "explanation": "The pointer borrows the CString. Keep the CString in a variable for as long as the pointer is used."
    },
    {
      "q": "What happens if a panic unwinds out of an extern \"C\" function in modern Rust?",
      "options": [
        "C receives an exception",
        "The process aborts",
        "The panic is silently ignored",
        "It returns 0"
      ],
      "answer": 1,
      "explanation": "Since Rust 1.81, unwinding out of an extern \"C\" function aborts. Catch panics at the boundary and return an error code."
    },
    {
      "q": "What is a \"safe abstraction\" over unsafe code?",
      "options": [
        "Code that never uses unsafe",
        "A safe function or type whose implementation uses unsafe but checks every precondition so callers cannot trigger UB",
        "Marking a function unsafe",
        "Using Miri in CI"
      ],
      "answer": 1,
      "explanation": "Vec, String and split_at_mut are examples: internally unsafe, but their public API cannot be misused in a way that causes undefined behaviour."
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "What does unsafe actually mean in Rust?",
      "a": "It marks code where the programmer, not the compiler, guarantees certain invariants. Inside <code>unsafe</code> you can dereference raw pointers, call unsafe functions (including FFI), touch mutable statics, implement unsafe traits and read union fields. Everything else is still checked. An <code>unsafe fn</code> declares preconditions its callers must meet; an <code>unsafe</code> block is where someone asserts they are met."
    },
    {
      "q": "How do you write safe abstractions over unsafe code?",
      "a": "Keep the unsafe part as small as possible, encapsulate it in a module with private fields so invariants cannot be broken from outside, check every precondition (bounds, null, alignment, aliasing) in safe code before the unsafe operation, document each block with a <code>// SAFETY:</code> comment, and test it under Miri. The goal is that no sequence of calls to the public safe API can cause undefined behaviour."
    },
    {
      "q": "What types can cross an FFI boundary?",
      "a": "Primitive integers and floats, raw pointers, function pointers, and types with a defined layout: <code>#[repr(C)]</code> structs, <code>#[repr(C)]</code> or <code>#[repr(u8)]</code>-style enums, and <code>Option</code> of references or <code>NonNull</code> (null-pointer optimisation). Rust-specific types like <code>String</code>, <code>Vec</code>, slices, trait objects and normal references to non-<code>repr(C)</code> data have no stable layout and must be converted, e.g. a <code>&amp;str</code> to a <code>CString</code> or a pointer plus length."
    },
    {
      "q": "What is Miri?",
      "a": "Miri is an interpreter for Rust's mid-level IR that runs your tests while checking for undefined behaviour: out-of-bounds or dangling accesses, invalid values, aliasing violations under the Stacked/Tree Borrows model, data races and memory leaks. Run it with <code>cargo +nightly miri test</code>. It is slow, so it is used on the unit tests of crates that contain unsafe code rather than on everything."
    },
    {
      "q": "What changed for unsafe code in the 2024 edition?",
      "a": "Several rules became stricter to make unsafety explicit: extern blocks must be <code>unsafe extern</code> (with items optionally marked <code>safe</code>), attributes like <code>no_mangle</code>, <code>export_name</code> and <code>link_section</code> must be written as <code>#[unsafe(...)]</code>, the <code>unsafe_op_in_unsafe_fn</code> lint warns so each unsafe operation inside an <code>unsafe fn</code> needs its own block, and references to <code>static mut</code> are denied by default."
    }
  ];

  revision: RevisionSummary = {
    "oneLiner": "unsafe unlocks five operations the compiler cannot check; wrap them in small, documented safe abstractions, and treat the FFI boundary as a contract about types, ownership and panics.",
    "mustKnow": [
      "Five unsafe superpowers: raw deref, unsafe calls, <code>static mut</code>, unsafe traits, unions.",
      "UB includes dangling/aliased <code>&amp;mut</code>, invalid values and data races.",
      "Raw pointers are created safely but dereferenced in <code>unsafe</code>.",
      "2024 edition: <code>unsafe extern</code>, <code>#[unsafe(no_mangle)]</code>, <code>unsafe_op_in_unsafe_fn</code>.",
      "Use <code>CString</code>/<code>CStr</code> for C strings and keep owners alive.",
      "Never unwind across <code>extern \"C\"</code>; catch panics and return codes."
    ],
    "interviewFocus": [
      "List what unsafe allows and what it does not.",
      "Explain how Vec or split_at_mut provide safe APIs over unsafe code.",
      "Describe FFI-safe types and memory ownership across the boundary."
    ]
  };
}
