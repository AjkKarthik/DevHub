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
  templateUrl: './embedded-json-tag-disables-promotion.html',
  styleUrl: './embedded-json-tag-disables-promotion.scss'
})
export class EmbeddedJsonTagDisablesPromotionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An embedded struct\'s fields are flattened into the outer JSON object by default',
      points: [
        'The main page\'s own theory covers the "Alias trick" for adding fields via MarshalJSON — embedding a type inside an anonymous struct specifically to avoid infinite recursion. That is a deliberate, custom-marshalling technique. What the main page never covers is what happens with plain struct embedding, no custom MarshalJSON involved at all, which behaves in a way that surprises many developers coming from languages where "nested struct" always means "nested JSON object."',
        'encoding/json\'s own documentation states the default behavior directly: "Embedded struct fields are usually marshaled as if their inner exported fields were fields in the outer struct." An embedded (anonymous) field\'s own exported fields get PROMOTED — flattened directly into the outer JSON object at the same level as the outer struct\'s own fields — rather than nested under a key matching the embedded type\'s name.',
        'This mirrors Go\'s own field/method promotion rules for embedding in general (already covered elsewhere in this hub\'s own Structs & Interfaces topic) — JSON marshalling follows the same "the embedded type\'s own members become directly accessible on the outer type" philosophy, just applied to JSON output shape instead of to Go code access.',
      ]
    },
    {
      heading: 'The exception: giving the embedded field its own json tag disables promotion entirely',
      points: [
        'This default is not unconditional. The same documentation states the exact override: "An anonymous struct field with a name given in its JSON tag is treated as having that name, rather than being anonymous." Adding a json tag to the embedded field — even just to give it an explicit name — switches its behavior from "flatten into the outer object" to "nest under this specific key," identical to how any ordinary named struct field of struct type would already behave.',
        'This gives a real, practical lever for API design: the SAME Go embedding relationship (one struct embedding another for code reuse — shared fields, shared methods) can produce EITHER a flat JSON shape or a nested one, purely by choosing whether the embedded field carries its own json tag. No change to the embedded type itself, no custom MarshalJSON, no Alias trick needed — just the presence or absence of one struct tag on the embedding field.',
        'This distinction matters most when a Go codebase embeds a shared "base" type (common fields like ID, CreatedAt, UpdatedAt reused across many domain types) purely for Go-side code reuse, but the API contract requires those shared fields to appear either flattened alongside the domain-specific fields (the common REST convention) or nested under their own key (common in APIs that model a base/audit-metadata relationship explicitly) — the same Go struct embedding serves both API shapes depending entirely on this one tag choice.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default: embedded fields are promoted (flattened)',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
)

type Base struct {
    ID        string \`json:"id"\`
    CreatedAt string \`json:"created_at"\`
}

type Product struct {
    Base            // embedded, NO json tag on this field itself
    Name  string \`json:"name"\`
    Price float64 \`json:"price"\`
}

func main() {
    p := Product{
        Base:  Base{ID: "p1", CreatedAt: "2024-01-15"},
        Name:  "Widget",
        Price: 9.99,
    }

    data, _ := json.Marshal(p)
    fmt.Println(string(data))
    // {"id":"p1","created_at":"2024-01-15","name":"Widget","price":9.99}
    //
    // Base's own fields (id, created_at) are FLATTENED directly into
    // the outer object -- there is no "base" key wrapping them, even
    // though Base is a genuinely separate, embedded Go type.
}`,
    },
    {
      label: 'Adding a json tag to the embedded field disables promotion',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
)

type Base struct {
    ID        string \`json:"id"\`
    CreatedAt string \`json:"created_at"\`
}

type Product struct {
    Base    Base \`json:"base"\` // SAME embedding -- but now with a
                                  // json tag on the embedded field
    Name    string  \`json:"name"\`
    Price   float64 \`json:"price"\`
}

func main() {
    p := Product{
        Base:  Base{ID: "p1", CreatedAt: "2024-01-15"},
        Name:  "Widget",
        Price: 9.99,
    }

    data, _ := json.Marshal(p)
    fmt.Println(string(data))
    // {"base":{"id":"p1","created_at":"2024-01-15"},"name":"Widget","price":9.99}
    //
    // The IDENTICAL Go embedding relationship (Product still embeds
    // Base, still gets its promoted FIELD ACCESS in Go code -- p.ID
    // still works) -- but the JSON shape is now NESTED under "base",
    // purely because of the one json tag added to the embedded field.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has a Go codebase where every domain type (Product, Order, Customer) embeds a shared AuditInfo struct (CreatedAt, UpdatedAt, CreatedBy) purely for Go-side code reuse — so p.CreatedAt works directly on a Product value. Their REST API currently returns these fields flattened at the top level of each JSON response (matching most REST conventions), but a new API consumer requests that audit fields instead be grouped under a nested "audit" key in the response, without wanting the underlying Go embedding relationship (and the convenient p.CreatedAt-style field access it provides) to change at all. Using this subtopic\'s theory, describe the minimal change needed.',
    hint: 'This subtopic\'s theory distinguishes what determines JSON SHAPE (promoted/flat vs. nested) from what determines Go-code FIELD ACCESS (the embedding relationship itself). Does adding a json tag to the embedded field change the embedding relationship, or just the JSON shape?',
    solution: 'The minimal change is to add a json tag to the embedded AuditInfo field itself — for example, changing type Product struct { AuditInfo; Name string } to type Product struct { AuditInfo \`json:"audit"\`; Name string } (and identically for Order and Customer). Per this subtopic\'s theory, this one change is sufficient on its own: "an anonymous struct field with a name given in its JSON tag is treated as having that name, rather than being anonymous," which switches the JSON output from flattened/promoted fields to a nested object under the "audit" key — exactly the shape the new API consumer is requesting. Critically, per this subtopic\'s second code example, this change does NOT affect the underlying Go embedding relationship at all: Product still embeds AuditInfo, and p.CreatedAt (the promoted FIELD ACCESS in Go code, a completely separate mechanism from JSON field promotion) continues to work exactly as before — the team\'s own Go code throughout the codebase that relies on that convenient direct field access needs zero changes. Only the JSON tag on the embedding declaration itself needs to change, in exactly the three struct type definitions (Product, Order, Customer) that embed AuditInfo — nothing about AuditInfo\'s own definition, nor any of the Go-side code that reads or writes p.CreatedAt, p.UpdatedAt, or p.CreatedBy directly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Go struct embedding another struct should always produce a nested JSON object matching that embedded relationship — since Product genuinely "has a" Base as a distinct, embedded type, the natural, expected JSON shape would nest Base\'s fields under their own key, the same way a NAMED field of struct type would.',
      reality: 'This subtopic\'s theory and first code example show the actual DEFAULT behavior is the opposite: an embedded (anonymous) struct field\'s own exported fields are PROMOTED — flattened directly into the outer JSON object — unless the embedded field is given its own json tag. Nesting is the exception that must be explicitly requested via a tag, not the default outcome of embedding.'
    },
    {
      thought: 'Adding a json tag to an embedded struct field, purely to change its JSON output shape from flat to nested, would also change how that embedded type\'s fields are accessed in Go code — for instance, breaking the promoted p.ID-style direct field access that embedding normally provides.',
      reality: 'This subtopic\'s exercise and second code example show these are two entirely separate mechanisms that a json tag does not conflate: Go\'s own field-promotion rules for embedding (which govern p.ID-style direct access in Go CODE) are completely unaffected by a json tag, which only controls the JSON MARSHALLING shape specifically. The embedding relationship, and everything it provides in ordinary Go code, is untouched by adding or removing a json tag on the embedded field.'
    },
    {
      thought: 'Changing an API\'s JSON shape from flattened audit fields to a nested "audit" object, as described in this subtopic\'s exercise, would require either a custom MarshalJSON implementation (the Alias-trick pattern the main page\'s own theory covers) or restructuring the underlying Go types to use a genuinely separate, non-embedded named field instead of embedding.',
      reality: 'This subtopic\'s theory and exercise show a much smaller, more surgical fix is sufficient: adding a single json tag to the EXISTING embedded field achieves the desired nested JSON shape with no custom MarshalJSON needed at all, and without giving up the embedding relationship (and its Go-side field-promotion convenience) that motivated using embedding in the first place.'
    }
  ];
}
