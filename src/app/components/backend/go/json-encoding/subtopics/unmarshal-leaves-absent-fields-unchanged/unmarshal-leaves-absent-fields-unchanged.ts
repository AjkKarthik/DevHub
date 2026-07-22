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
  templateUrl: './unmarshal-leaves-absent-fields-unchanged.html',
  styleUrl: './unmarshal-leaves-absent-fields-unchanged.scss'
})
export class UnmarshalLeavesAbsentFieldsUnchangedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'json.Unmarshal merges into the target — it does not reset it first',
      points: [
        'Every one of the main page\'s own Unmarshal examples decodes into a FRESH, zero-valued variable — var p2 Product, var u User — so there is never any pre-existing data for Unmarshal to interact with. This leaves an easy, reasonable assumption unaddressed: that Unmarshal first clears/resets the target before populating it, the same way many other "decode into" operations in other languages do.',
        'It does not. encoding/json documents this behavior for maps directly and explicitly: "Otherwise Unmarshal reuses the existing map, keeping existing entries." The same merge philosophy extends to struct fields — Unmarshal only OVERWRITES the specific fields that have a corresponding key present in the JSON input; any field on the target struct that has NO corresponding key in the incoming JSON is left completely untouched, retaining whatever value it already held before the Unmarshal call.',
        'This is a genuinely different behavior model from "decode always produces a value purely determined by the JSON input" — the OUTPUT of json.Unmarshal(data, &target) depends on BOTH the JSON data AND whatever target already contained before the call, for any fields the JSON doesn\'t mention.',
      ]
    },
    {
      heading: 'Why this is useful, and the specific risk it creates',
      points: [
        'This merge behavior is precisely what makes json.Unmarshal a natural fit for implementing PATCH-style partial updates: load an existing record into a struct, Unmarshal a client\'s partial JSON payload directly into that same struct, and every field the client\'s payload omitted simply retains its already-loaded value — no separate "apply only the provided fields" merging logic needs to be written by hand.',
        'The corresponding risk is the mirror image of that convenience: reusing a struct variable across multiple, unrelated Unmarshal calls without resetting it first means stale data from a PREVIOUS decode can silently persist into fields the CURRENT JSON payload doesn\'t happen to mention — a bug that is easy to miss precisely because it only manifests when a field is genuinely absent from one particular payload, not on every call.',
        'The main page\'s own "Not checking Unmarshal errors" mistake entry warns that an unchecked error "leaves the struct partially zero-valued" — that framing implicitly assumes the struct STARTED at zero-valued. This subtopic\'s own merge behavior means the more general, precise statement is: a failed or partial Unmarshal leaves untouched fields at WHATEVER VALUE THEY ALREADY HAD, which is the zero value only if the target itself started zero-valued — not a universal guarantee independent of the target\'s starting state.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fields absent from the JSON keep their existing values',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
)

type Product struct {
    ID    string  \`json:"id"\`
    Name  string  \`json:"name"\`
    Price float64 \`json:"price"\`
}

func main() {
    // Start with a fully-populated struct -- NOT a fresh zero value.
    p := Product{ID: "p1", Name: "Widget", Price: 9.99}

    // This JSON only mentions "price" -- "id" and "name" are absent.
    partial := []byte(\`{"price": 12.99}\`)

    if err := json.Unmarshal(partial, &p); err != nil {
        panic(err)
    }

    // "id" and "name" retain their PRE-EXISTING values -- Unmarshal
    // never reset them to "" just because the JSON didn't mention
    // them. Only "price" (the one field actually present in the
    // JSON) was overwritten.
    fmt.Printf("%+v\\n", p)
    // {ID:p1 Name:Widget Price:12.99}
}`,
    },
    {
      label: 'The useful case: PATCH-style partial updates for free',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
)

type Product struct {
    ID    string  \`json:"id"\`
    Name  string  \`json:"name"\`
    Price float64 \`json:"price"\`
}

// applyPatch demonstrates the natural PATCH pattern this subtopic's
// theory describes: load the existing record, Unmarshal the
// client's partial payload directly onto it -- no manual "only
// apply fields that were provided" logic needed at all.
func applyPatch(existing Product, patchJSON []byte) (Product, error) {
    updated := existing // start from the EXISTING record, not zero
    if err := json.Unmarshal(patchJSON, &updated); err != nil {
        return Product{}, err
    }
    return updated, nil
}

func main() {
    existing := Product{ID: "p1", Name: "Widget", Price: 9.99}

    // Client only wants to update the name -- nothing else.
    patch := []byte(\`{"name": "Deluxe Widget"}\`)

    updated, _ := applyPatch(existing, patch)
    fmt.Printf("%+v\\n", updated)
    // {ID:p1 Name:Deluxe Widget Price:9.99} -- ID and Price
    // survived, exactly as this subtopic's theory describes, with
    // zero extra merging code written by hand.
}`,
    },
    {
      label: 'The risk: stale data leaking across reused struct variables',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
)

type Product struct {
    ID    string  \`json:"id"\`
    Name  string  \`json:"name"\`
    Price float64 \`json:"price"\`
}

func main() {
    var p Product // reused across a loop -- NOT redeclared each time

    payloads := [][]byte{
        []byte(\`{"id":"p1","name":"Widget","price":9.99}\`),
        []byte(\`{"id":"p2","price":19.99}\`), // "name" is MISSING here
    }

    for _, payload := range payloads {
        // BUG: "p" is reused, not reset, across iterations. For the
        // second payload, "name" is absent -- so per this subtopic's
        // theory, p.Name silently KEEPS "Widget" from the FIRST
        // payload's decode, even though product p2 was never
        // actually given that name by anyone.
        json.Unmarshal(payload, &p)
        fmt.Printf("%+v\\n", p)
    }
    // {ID:p1 Name:Widget Price:9.99}
    // {ID:p2 Name:Widget Price:19.99} -- "Widget" leaked in from the
    //                                     PREVIOUS iteration's decode
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A batch-import job reads a JSON array of product updates and decodes each element into the SAME pre-declared Product struct variable inside a for loop, reusing it across iterations for what the original author assumed was a minor efficiency win ("avoids redeclaring the struct every iteration"). Some elements in the array omit the "price" field entirely, since those specific products\' prices are not changing in this batch. After the job runs, several products end up with the WRONG price in the database — specifically, the price belonging to whichever OTHER product was processed most recently before them in the same batch that DID specify a price. Using this subtopic\'s theory, diagnose the root cause.',
    hint: 'This subtopic\'s theory says a field absent from the JSON keeps whatever value the target struct ALREADY had before that specific Unmarshal call. If the struct variable is reused (not reset) across loop iterations, what value would an absent "price" field in payload N actually retain — a fresh zero value, or something left over from payload N-1?',
    solution: 'The root cause is precisely the risk this subtopic\'s theory and third code example describe: reusing the same struct variable across loop iterations without resetting it means a field absent from one JSON payload (here, "price" on products whose price is not changing) does not decode to a fresh zero value — per json.Unmarshal\'s own merge behavior, it retains whatever value that SAME struct variable already held from the PREVIOUS iteration\'s decode. Since the loop processes each array element by decoding directly into the one shared, reused Product variable, any product entry that omits "price" silently inherits the price left over from whichever earlier entry in the same batch most recently DID specify one — exactly the "wrong price, belonging to a different product" symptom described. The original author\'s "avoids redeclaring the struct every iteration" reasoning treated the reuse as a harmless efficiency optimization, without accounting for Unmarshal\'s own merge-into-existing-value behavior making that reuse semantically significant, not just a performance detail. The fix is to declare a FRESH, zero-valued Product variable inside the loop body for each iteration (var p Product, or p := Product{}, redeclared every pass) rather than reusing one variable across iterations — ensuring any field absent from a given payload correctly decodes to its actual zero value instead of inheriting a stale value from a completely unrelated, previously-processed product.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'json.Unmarshal always produces a result purely determined by its JSON input — decoding the same JSON bytes into a struct variable should always produce the same resulting struct, regardless of whatever that variable happened to contain before the call.',
      reality: 'This subtopic\'s theory and first code example show the actual output depends on BOTH the JSON input AND the target\'s pre-existing state — fields absent from the JSON retain whatever value the target already held. Decoding the identical JSON bytes into two DIFFERENT starting structs can produce two DIFFERENT results, specifically for whichever fields that JSON payload happens to omit.'
    },
    {
      thought: 'The main page\'s own mistake entry — an unchecked Unmarshal error "leaves the struct partially zero-valued" — is a complete, general description of what happens to a struct after a failed or partial decode, regardless of what that struct contained beforehand.',
      reality: 'This subtopic\'s theory shows that description is only accurate when the target struct STARTED at its zero value (exactly the case in every one of the main page\'s own examples, which all decode into freshly-declared variables) — the more general, precise statement is that untouched fields retain whatever value they ALREADY had, which is the zero value only incidentally, because that is what a fresh variable starts as.'
    },
    {
      thought: 'The stale-data risk this subtopic describes (a reused struct variable retaining values from a previous decode) is a rare, unusual edge case that would only occur with contrived, obviously-suspicious code patterns unlikely to appear in a real, reviewed codebase.',
      reality: 'This subtopic\'s exercise shows the risk arises from a genuinely reasonable-looking, common micro-optimization — reusing one struct variable across loop iterations "to avoid redeclaring it every time" — that many developers would not immediately recognize as unsafe, precisely because the bug only manifests for JSON payloads that happen to omit a field, not for every iteration, making it easy to miss in casual testing or code review.'
    }
  ];
}
