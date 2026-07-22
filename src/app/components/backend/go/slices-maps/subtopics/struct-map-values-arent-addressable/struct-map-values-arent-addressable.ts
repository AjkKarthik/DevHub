import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './struct-map-values-arent-addressable.html',
  styleUrl: './struct-map-values-arent-addressable.scss'
})
export class StructMapValuesArentAddressableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A struct stored directly as a map value cannot have one of its fields assigned to in place',
      points: [
        'Look closely at every one of the main page\'s own patterns that touch a map value: grouping appends to the WHOLE slice value (groups[key] = append(groups[key], w)), the word-count example increments the WHOLE int value (wordCount[w]++), and every struct example either stores the struct by value and reassigns it wholesale, or stores a pointer. None of them ever writes m[key].SomeField = x directly. That is not a stylistic coincidence — it would not compile.',
        'Go\'s map values are not addressable, unlike array and slice elements. arr[i].Field = x and &arr[i] are both fine, because array/slice elements ARE addressable — but the equivalent m[key].Field = x fails to compile, and &m[key] fails to compile too. The compiler\'s own diagnostic for the assignment form is direct: "cannot assign to struct field m[key].Field in map".',
        'The underlying reason is that a map\'s internal storage can move entries around during growth and rehashing — Go never hands out a stable memory address for one logical map entry the way it safely can for a slice/array element sitting at a fixed offset in a contiguous backing array. Since there is no stable address to hand out, the language simply disallows every operation that would require one, including reaching in to assign a single field of a stored struct.',
      ]
    },
    {
      heading: 'Two real fixes, with a real, meaningful tradeoff between them',
      points: [
        'Fix 1 — store pointers instead of values: map[K]*T. m[key].Field = x now compiles and works, because m[key] itself yields a *T (a pointer VALUE, which is perfectly addressable-independent — dereferencing through it to reach a field never needed the pointer\'s own storage location to be stable). This also means every caller/goroutine holding a copy of that same *T pointer observes the mutation.',
        'Fix 2 — read, modify, write back: temp := m[key]; temp.Field = x; m[key] = temp. This copies the whole struct value OUT of the map into a local variable, mutates the independent local copy, then writes the ENTIRE modified copy back into the map as one single assignment — the map itself is never asked to hand out an address at any point.',
        'These two fixes are not interchangeable stylistic preferences — they have a genuine semantic difference. Pointer values create shared, aliased state: every holder of that same pointer sees every mutation, with all the same aliasing consequences any pointer-shared data has elsewhere in Go. The read-modify-write pattern preserves true value semantics: nothing is shared, and every future m[key] read returns an independent copy of whatever was most recently explicitly written back in.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The compile error, and why arrays/slices don\'t have it',
      language: 'typescript',
      code: `package main

import "fmt"

type Counter struct {
    Hits int
}

func main() {
    // Arrays and slices: element access IS addressable.
    counters := []Counter{{Hits: 0}, {Hits: 0}}
    counters[0].Hits++          // fine -- &counters[0] is a stable address
    fmt.Println(counters[0].Hits) // 1

    // Maps: this section exists to show the CONTRAST -- the two
    // lines below do NOT compile if uncommented:
    m := map[string]Counter{"a": {Hits: 0}}

    // m["a"].Hits++
    // COMPILE ERROR: cannot assign to struct field m["a"].Hits in map

    // ptr := &m["a"]
    // COMPILE ERROR: cannot take the address of m["a"]

    fmt.Println(m["a"].Hits) // reading a field IS fine -- 0
    // only WRITING to a field, or taking an address, requires
    // addressability that a map index expression does not have.
}`,
    },
    {
      label: 'Fix 1: store pointers — shared, mutable state',
      language: 'typescript',
      code: `package main

import "fmt"

type Counter struct {
    Hits int
}

func main() {
    // map[K]*T -- the map holds POINTERS, not the structs themselves.
    m := map[string]*Counter{"a": {Hits: 0}}

    m["a"].Hits++ // works: m["a"] yields a *Counter, and dereferencing
                   // through a pointer to reach a field never needed
                   // the pointer's OWN storage location to be stable.
    fmt.Println(m["a"].Hits) // 1

    // Aliasing consequence: any other variable holding the SAME
    // *Counter sees this mutation too.
    same := m["a"]
    same.Hits++
    fmt.Println(m["a"].Hits) // 2 -- mutated through a completely
                              // different variable than m itself.
}`,
    },
    {
      label: 'Fix 2: read-modify-write — genuine value semantics',
      language: 'typescript',
      code: `package main

import "fmt"

type Counter struct {
    Hits int
}

func main() {
    // map[K]T -- the map holds the structs directly, by value.
    m := map[string]Counter{"a": {Hits: 0}}

    // Read the whole struct value out, mutate the independent LOCAL
    // copy, then write the ENTIRE modified copy back as one
    // assignment -- the map is never asked for an address.
    temp := m["a"]
    temp.Hits++
    m["a"] = temp
    fmt.Println(m["a"].Hits) // 1

    // No aliasing: a separate read produces an INDEPENDENT copy --
    // mutating it has zero effect on what's stored in the map.
    other := m["a"]
    other.Hits++
    fmt.Println(m["a"].Hits) // still 1 -- other was its own copy
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer defines type Session struct { LastSeen time.Time } and a sessions map[string]Session, then writes sessions[id].LastSeen = time.Now() inside a request handler to update the timestamp for an existing session. The code fails to compile. Using this subtopic\'s theory, explain exactly why, and describe both ways to fix it along with one real consideration for choosing between them in this specific scenario.',
    hint: 'Is sessions[id] an addressable expression? What does this subtopic say the two available fixes are, and which one would let multiple goroutines handling different requests for the SAME session see a consistent, shared LastSeen value?',
    solution: 'The code fails to compile with a diagnostic to the effect of "cannot assign to struct field sessions[id].LastSeen in map" because sessions[id] is a map index expression, and per this subtopic\'s theory, map index expressions are not addressable in Go — assigning to a field requires the language to obtain a stable address for that field\'s location, which a map cannot safely provide since its internal storage can move entries during growth and rehashing. This is exactly the same restriction demonstrated in this subtopic\'s first code example. There are two fixes: (1) change the map to map[string]*Session, storing pointers, so sessions[id].LastSeen = time.Now() compiles and works directly, since dereferencing a pointer to reach a field does not require the pointer\'s OWN storage location to be stable; or (2) keep map[string]Session and use the read-modify-write pattern: sess := sessions[id]; sess.LastSeen = time.Now(); sessions[id] = sess. For this specific scenario — a session store likely accessed concurrently across multiple request-handling goroutines for the same session ID — the pointer approach (option 1) is usually the more natural fit: it lets every goroutine holding that same *Session see the updated LastSeen immediately without needing to re-read from the map, matching the "one shared session record" mental model a session store usually implies. The read-modify-write approach would still work correctly, but every access pattern would need to be careful to always write the modified copy back through the map explicitly, or updates from concurrent requests to the same session could be silently lost by overwriting each other with stale copies — a genuine risk this subtopic\'s theory flags as the real tradeoff between the two fixes, independent of the addressability compile error itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a struct stored as a map value works fine for READING a field (m[key].Field is a valid expression that returns the field\'s current value), assigning to that same field (m[key].Field = x) should work the same way — reading and writing a field are symmetric operations.',
      reality: 'This subtopic\'s theory and first code example show reading and writing have fundamentally different requirements: reading a field only needs the field\'s CURRENT VALUE, which the map can copy out on demand, while writing to a field needs a stable ADDRESS to write through — and a map index expression never provides one, precisely because the map\'s internal storage can move entries around during growth and rehashing.'
    },
    {
      thought: 'The fix for "cannot assign to struct field in map" is always to switch the map\'s value type to a pointer (map[K]*T) — that is the standard, universally-preferred solution any time this compile error appears.',
      reality: 'This subtopic\'s theory and exercise show there are two genuinely valid fixes with a real tradeoff, not one universally-correct answer: switching to pointer values introduces shared, aliased mutable state (every holder of the same pointer sees every mutation), while the read-modify-write pattern preserves independent value semantics at the cost of needing every caller to explicitly write modified copies back. Which one is appropriate depends on whether shared mutation across multiple references is actually the desired behavior for that specific map.'
    },
    {
      thought: 'This addressability restriction is specific to structs — a map holding a primitive value type like map[string]int can always be incremented in place with m[key]++, so the restriction must not really be about map index expressions being unaddressable in general.',
      reality: 'The main page\'s own word-count example, wordCount[w]++, is actually a compound assignment that Go itself rewrites as wordCount[w] = wordCount[w] + 1 — a full VALUE reassignment of the entire map entry, not an in-place mutation through an address. It works precisely because it avoids ever needing an address, exactly the same underlying restriction this subtopic\'s theory describes — it just doesn\'t look like a workaround because compound assignment operators hide the read-modify-write happening underneath them for any map value type, not just structs.'
    }
  ];
}
