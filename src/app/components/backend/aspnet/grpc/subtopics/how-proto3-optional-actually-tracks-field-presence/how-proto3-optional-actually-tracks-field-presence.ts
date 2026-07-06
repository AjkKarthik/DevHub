import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-proto3-optional-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-proto3-optional-actually-tracks-field-presence.html',
  styleUrl: './how-proto3-optional-actually-tracks-field-presence.scss',
})
export class HowProto3OptionalActuallyTracksFieldPresenceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the fact — "optional int32 value = 1 explicitly represents field was set to zero vs field was absent" — without explaining the MECHANISM that makes this possible',
      points: [
        'The main gRPC page\'s Contract-First section says: "Protobuf 3 removed required fields and default values are zero/empty for all types... use <code>optional int32 value = 1;</code> (proto3 optional syntax) to explicitly represent \'field was set to zero\' vs \'field was absent\'." A reasonable question this leaves unanswered: HOW does adding one keyword suddenly give a plain <code>int32</code> — a value type with no room for a "null" state — the ability to distinguish "zero" from "never set"?',
      ],
    },
    {
      heading: 'The protoc compiler implements proto3 "optional" by silently wrapping the field in a synthetic single-field "oneof" — and generates a HasXxx property/method specifically because oneof membership itself already tracks "is this specific field the one that was set"',
      points: [
        'A regular (non-optional) proto3 <code>oneof</code> group works by construction: only ONE field among several alternatives can be set at a time, and the runtime already needs to track WHICH one (if any) is currently active — that tracking mechanism is exactly what a "presence" check needs. proto3\'s <code>optional</code> keyword is implemented by generating a HIDDEN, single-member <code>oneof</code> wrapping just that ONE field — reusing the oneof mechanism\'s existing "which member is set" tracking to give a SINGLE scalar field genuine presence information, without needing a language change to the wire format itself.',
        'This is why the C# code generator produces a <code>HasValue</code> property (e.g., <code>request.HasValue</code>) alongside an <code>optional</code> field, but NOT for an ordinary scalar field of the same type — the generator is reading the underlying "synthetic oneof" metadata the protoc compiler produced, and surfacing it as a convenient boolean property specifically because that metadata now genuinely exists for THAT field, unlike a plain <code>int32 value = 1;</code> declaration which has no such tracking at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A regular scalar field vs a proto3 optional field — the generated C# API difference reveals the underlying mechanism',
      language: 'csharp',
      code: `// products.proto

message ProductRequest {
    int32 id = 1;                    // ORDINARY scalar field
    optional int32 discount_id = 2;  // proto3 OPTIONAL field
}

// The GENERATED C# code for these two fields looks meaningfully
// different — this difference is the actual evidence of the
// underlying mechanism:

public sealed partial class ProductRequest
{
    // ORDINARY field: a plain property, defaulting to 0. There is NO
    // way to ask "was Id ever explicitly set to 0, or did it just
    // start at its default?" — the generated code has no concept of
    // 'Id' presence at all, only its current value:
    public int Id { get; set; }

    // OPTIONAL field: not just a property — the generator ALSO emits
    // a 'HasDiscountId' property, PLUS 'ClearDiscountId()':
    public int DiscountId { get; set; }
    public bool HasDiscountId { get; }        // <-- this is the tell
    public void ClearDiscountId();

    // WHY does DiscountId get this extra API surface but Id does not?
    // Because 'optional int32 discount_id = 2;' compiles down to a
    // hidden, single-member oneof — and 'HasDiscountId' is really
    // "is the synthetic oneof's active member currently
    // 'discount_id'?", reusing the SAME underlying mechanism a
    // regular multi-member oneof already needs for its own
    // "which alternative is currently set" tracking.
}`,
    },
    {
      label: 'Proving the mechanism directly — an EXPLICIT oneof produces the exact same "Has" pattern, for the exact same reason',
      language: 'csharp',
      code: `// A REGULAR, explicit oneof with multiple alternatives — the kind of
// construct proto3 optional's hidden implementation borrows from:

message SearchFilter {
    oneof filter_type {
        string by_name = 1;
        int32  by_id    = 2;
        bool   by_active = 3;
    }
}

// Generated C# for an EXPLICIT oneof — notice the SAME shape of
// "which one is active" tracking that optional's hidden oneof reuses:

public sealed partial class SearchFilter
{
    public enum FilterTypeOneofCase { None = 0, ByName = 1, ById = 2, ByActive = 3 }

    // This ENUM is the oneof's own "which member is currently set"
    // tracking — the exact mechanism proto3's hidden single-member
    // oneof (for a plain 'optional' scalar field) borrows, just
    // reduced to a boolean (since there is only ONE possible
    // alternative to be "set" or "not set" instead of several):
    public FilterTypeOneofCase FilterTypeCase { get; }

    public string ByName { get; set; }
    public int ById { get; set; }
    public bool ByActive { get; set; }
}

// THE DIRECT PARALLEL:
//   'optional int32 discount_id = 2;'  compiles roughly like a HIDDEN,
//   single-member oneof — as if you had written:
//
//     oneof _discount_id { int32 discount_id = 2; }
//
//   ...and 'HasDiscountId' is exactly '_discount_idCase != None',
//   simplified to a bool since there's only one possible member.
// This is WHY the presence-tracking mechanism 'just works' for
// optional scalar fields without any wire-format changes at all — it
// is literally the SAME oneof machinery Protobuf already had, applied
// to a group of exactly one field.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that proto3 optional is implemented as a hidden single-member oneof, predict what happens if a .proto file declares TWO SEPARATE optional fields that a developer INTENDS to be mutually exclusive alternatives (only one should ever be set) — does the compiler enforce that mutual exclusivity the way an explicit oneof would?',
    hint: 'Consider that each "optional" field gets its OWN separate hidden oneof wrapper (one PER field, not one shared across multiple optional fields) — does setting one optional field automatically clear or affect a DIFFERENT optional field\'s own presence state?',
    solution: `No — the compiler does NOT enforce mutual exclusivity between two
SEPARATE optional fields, and this is a genuinely useful distinction to
understand. Each "optional" field gets its OWN INDEPENDENT hidden
single-member oneof — NOT one shared oneof across multiple optional
fields. This means:

message ProductRequest {
    optional int32 discount_id = 2;
    optional string promo_code = 3;
}

Setting 'discount_id' has ZERO effect on 'promo_code's own presence
state — a caller can set BOTH 'discount_id' AND 'promo_code'
simultaneously, and both 'HasDiscountId' and 'HasPromoCode' would
report true at the same time. There is no automatic "setting one
clears the other" behavior, because each field's hidden oneof wrapper
is entirely separate and unaware of the other field's existence.

If a developer's actual INTENT is genuine mutual exclusivity (exactly
one of several fields should ever be set, and setting one should
automatically clear the others), the correct tool is an EXPLICIT,
SHARED oneof grouping BOTH fields together:

message ProductRequest {
    oneof discount_selector {
        int32  discount_id = 2;
        string promo_code  = 3;
    }
}

With this explicit oneof, setting 'promo_code' DOES automatically clear
'discount_id' (and vice versa), because both fields now share the SAME
underlying "which member is active" tracking — exactly the mechanism
individual 'optional' fields deliberately do NOT share with each
other, since each gets its own independent single-member wrapper.

The key lesson: 'optional' on a scalar field solves ONLY the "zero vs
unset" presence problem for THAT one field in isolation — it is not a
substitute for an explicit oneof when the actual requirement is
mutual exclusivity ACROSS multiple fields.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'proto3\'s "optional" keyword changes the underlying WIRE FORMAT to add a null/nullable representation for scalar types.',
      reality: 'the wire format itself is unchanged — "optional" is implemented entirely at the compiler/code-generation level, by wrapping the field in a hidden single-member oneof that reuses Protobuf\'s existing "which member is set" tracking mechanism to provide presence information.',
    },
    {
      thought: 'two separate "optional" fields in the same message automatically behave as mutually exclusive alternatives — setting one clears the other.',
      reality: 'each "optional" field gets its OWN independent hidden oneof wrapper — there is no shared tracking between separate optional fields, so multiple optional fields can all be simultaneously "set" with no automatic exclusivity; an explicit shared oneof is required for genuine mutual exclusivity across multiple fields.',
    },
    {
      thought: 'the generated HasXxx property/method on an optional field is a special, dedicated feature built specifically for the optional keyword, unrelated to Protobuf\'s regular oneof support.',
      reality: 'HasXxx is generated because the field genuinely IS a hidden, single-member oneof under the hood — the exact same underlying mechanism (and generated-code pattern) that produces a FooCase enum property for an ordinary, explicit multi-member oneof, just simplified to a boolean since there is only one possible member.',
    },
  ];
}
