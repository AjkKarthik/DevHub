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
  templateUrl: './marshal-sorts-map-keys.html',
  styleUrl: './marshal-sorts-map-keys.scss'
})
export class MarshalSortsMapKeysSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Map iteration is randomized in Go — but json.Marshal output for a map is not',
      points: [
        'Every hub in this project\'s own Go coverage — including this hub\'s own Slices & Maps topic — establishes as a core fact that "Go deliberately randomises map iteration order" specifically to prevent code from depending on it. The main page\'s own theory here never touches maps directly (every example marshals a struct), leaving an easy, reasonable-sounding assumption unaddressed: that json.Marshal on a map would inherit that same randomness in its output key order.',
        'It does not. encoding/json\'s own documentation states the actual behavior directly: "The map keys are sorted and used as JSON object keys." Marshalling the exact same map value twice, even across separate program runs, produces JSON with keys in the identical, deterministic (alphabetically sorted) order every time — a completely different guarantee from the explicitly-randomized behavior of a plain for k := range m loop over that same map.',
        'This is not an incidental implementation detail — it is a deliberate design choice serving a real purpose: deterministic JSON output makes marshalled maps diffable, cacheable by content hash, and reproducible in tests and logs, none of which would be possible if the key order varied randomly from one Marshal call to the next the way map iteration does.',
      ]
    },
    {
      heading: 'Why this distinction matters, and where it stops applying',
      points: [
        'This means code that reasons "I can\'t rely on map key order because Go randomizes it" is only correct about DIRECT map iteration (range m) — that same reasoning does NOT transfer to json.Marshal(m)\'s own output, which is deterministically sorted regardless of the map\'s internal iteration order. Treating the two as equivalent is a natural but incorrect generalization from one true fact about Go maps to a related but different one about JSON encoding specifically.',
        'A practical consequence: two structurally-identical maps built through DIFFERENT sequences of insertions (which could iterate in different orders via range) still produce byte-for-byte identical JSON output via json.Marshal, since the sort happens at marshal time based on the KEYS\' VALUES, not on any insertion or iteration order. This makes json.Marshal(map[string]T{...}) output safe to compare directly (e.g., in a test assertion, or for content-addressable caching) in a way that would be unsafe for two maps\' RANGE iteration output.',
        'This guarantee is specific to json.Marshal\'s own map-encoding behavior — it says nothing about the ORDER of struct fields (which follows declaration order, not sorting, as every one of the main page\'s own code examples already demonstrates) or about any other Go data structure. The sorting rule applies narrowly, to map keys specifically, not as a general "JSON output from Go is always sorted" principle.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'range iteration is randomized — json.Marshal output is not',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    m := map[string]int{"zebra": 1, "apple": 2, "mango": 3}

    // range order is intentionally randomized by Go -- printed
    // order varies from run to run, exactly per this hub's own
    // Slices & Maps coverage.
    fmt.Print("range order (varies): ")
    for k := range m {
        fmt.Print(k, " ")
    }
    fmt.Println()

    // json.Marshal on the SAME map is deterministically sorted --
    // this ALWAYS prints in alphabetical key order, every run,
    // regardless of how range would have iterated it.
    data, _ := json.Marshal(m)
    fmt.Println("Marshal output (always sorted):", string(data))
    // {"apple":2,"mango":3,"zebra":1} -- every single time
}`,
    },
    {
      label: 'Two maps built differently still marshal identically',
      language: 'typescript',
      code: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
)

func main() {
    // Built with keys inserted in one order...
    m1 := map[string]int{}
    m1["zebra"] = 1
    m1["apple"] = 2
    m1["mango"] = 3

    // ...built with the SAME final keys/values, but a DIFFERENT
    // insertion order.
    m2 := map[string]int{}
    m2["mango"] = 3
    m2["zebra"] = 1
    m2["apple"] = 2

    data1, _ := json.Marshal(m1)
    data2, _ := json.Marshal(m2)

    // Byte-for-byte identical, despite different construction order
    // AND despite range iteration itself being randomized for both --
    // json.Marshal's own sort makes the two outputs directly
    // comparable, something range iteration output never guarantees.
    fmt.Println(bytes.Equal(data1, data2)) // true
    fmt.Println(string(data1))              // {"apple":2,"mango":3,"zebra":1}
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements a content-addressable cache: they compute a SHA-256 hash of json.Marshal(configMap) (where configMap is a map[string]string) and use that hash as the cache key, reasoning "identical config content should always produce the identical hash." A teammate raises a concern: "isn\'t this broken, since Go\'s map iteration order is randomized — won\'t the JSON bytes (and therefore the hash) differ between runs even for the same config content?" Using this subtopic\'s theory, determine whether the concern is valid.',
    hint: 'This subtopic distinguishes two separate things: the order a plain range loop visits a map\'s keys in (randomized), and the order json.Marshal writes a map\'s keys in (sorted). Which of these two determines the byte content that actually gets hashed here?',
    solution: 'The teammate\'s concern is not valid, and the caching scheme is actually sound on this specific point, per this subtopic\'s theory. The bytes being hashed come from json.Marshal(configMap), not from iterating the map directly with range — and per encoding/json\'s own documentation, "the map keys are sorted and used as JSON object keys" when marshalling. This means the actual JSON byte sequence produced for a given map\'s CONTENT (its set of key-value pairs) is deterministic and identical every time, completely independent of the RANDOMIZED order any particular range loop over that same map would visit its keys in — exactly as demonstrated in this subtopic\'s second code example, where two maps built via different insertion sequences still produced byte-for-byte identical Marshal output. The teammate is correctly recalling a true fact about Go maps (range iteration order is randomized) but incorrectly applying it to a different operation (json.Marshal\'s own key ordering) that does not inherit that randomness. As long as configMap\'s actual key-value CONTENT is the same across two calls — regardless of how each map was built or how range would iterate it — json.Marshal(configMap) produces identical bytes, and therefore an identical hash, making this caching scheme correct.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since Go\'s own map iteration order is deliberately randomized specifically to prevent code from depending on it, json.Marshal on a map must inherit that same randomness in its JSON output key order — the two are the same underlying operation, just with different formatting.',
      reality: 'This subtopic\'s theory and first code example show these are genuinely different operations with different guarantees: plain range iteration is randomized (confirmed by this hub\'s own Slices & Maps topic), but json.Marshal explicitly SORTS map keys before writing them — "the map keys are sorted and used as JSON object keys," per encoding/json\'s own documentation. Marshal output is deterministic even though the underlying map\'s own iteration order is not.'
    },
    {
      thought: 'Because map key order in JSON output IS deterministic (sorted), it should be safe to assume JSON marshalling of ANY Go value produces a fully deterministic, sorted representation — including struct fields, which one might also expect to come out in some sorted or otherwise deterministic order.',
      reality: 'This subtopic\'s theory clarifies the sorting guarantee is narrow and specific to MAP keys — struct field order in JSON output follows DECLARATION order (the order fields are written in the struct definition), not alphabetical sorting, exactly as every one of the main page\'s own struct-based code examples already demonstrates. The two data structures (maps and structs) have different, unrelated ordering rules in JSON output.'
    },
    {
      thought: 'The deterministic sorted output of json.Marshal on a map is a minor, cosmetic detail — mostly relevant for making printed JSON output look tidy or consistent in logs, without much practical significance beyond readability.',
      reality: 'This subtopic\'s exercise shows a genuine, practical use case that depends on this guarantee for CORRECTNESS, not just readability: content-addressable caching or hashing of marshalled map data relies specifically on identical map content always producing byte-for-byte identical JSON output, which would be impossible to rely on if Marshal inherited map iteration\'s own randomized order instead of sorting keys deterministically.'
    }
  ];
}
