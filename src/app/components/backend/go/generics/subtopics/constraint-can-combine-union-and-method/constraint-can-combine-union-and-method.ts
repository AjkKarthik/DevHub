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
  templateUrl: './constraint-can-combine-union-and-method.html',
  styleUrl: './constraint-can-combine-union-and-method.scss'
})
export class ConstraintCanCombineUnionAndMethodSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Every constraint on the main page is a PURE type union, or a PURE method requirement — never both together',
      points: [
        'The main page\'s own Ordered and Number constraints are pure type unions: interface { ~int | ~int8 | ... }, with no method requirements at all. Its comparable constraint is a pure method-like requirement (built-in equality) with no type union. Nowhere does the main page show a constraint that combines the two — requiring BOTH a specific underlying type AND a specific method — even though this is valid, documented Go syntax.',
        'Go\'s own language specification confirms this directly with a worked example: an interface combining a type union element with a method element is completely valid — "an interface representing all types with underlying type int that implement the String method" is written as interface { ~int; String() string }. A type argument must satisfy BOTH conditions simultaneously: its underlying type must be int, AND it must implement String() string.',
        'This is a genuinely different, more expressive constraint than anything on the main page shows. The main page\'s own ~int-style unions only restrict WHAT KIND of type T can be; the main page\'s own comparable/Ordered constraints only restrict WHAT OPERATIONS are available. A combined constraint restricts both at once — useful when a generic function needs a type that is BOTH a specific kind of number (or string, etc.) AND capable of describing itself.',
      ]
    },
    {
      heading: 'The one syntax restriction, and why it exists',
      points: [
        'There is a real, documented limit on how far this combination can go: per the Go spec, "a union (with more than one term) cannot contain the predeclared identifier comparable or interfaces that specify methods." This means the UNION ELEMENT ITSELF (the ~int | ~float64 part) can never directly contain a method requirement inside one of its own union terms — methods must be listed as a SEPARATE element of the same interface, alongside the union, not folded into it.',
        'This restriction exists because a union describes a TYPE SET (a menu of acceptable underlying types) — mixing method requirements INTO that same union would create ambiguity about whether the method applies to just one term of the union or all of them. Keeping methods as a structurally separate interface element (still combinable with a union in the SAME overall constraint, just not merged into it) avoids that ambiguity entirely while still allowing both kinds of restriction together.',
        'Practically, this means the pattern always has the same two-part shape: a union element (which terms are allowed) written on one line or with |, and method elements (what must be implemented) written as ordinary interface method signatures alongside it — exactly the shape of the spec\'s own ~int; String() string example, never methods folded inside the union\'s own | list.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A combined constraint: underlying type AND a required method',
      language: 'typescript',
      code: `package main

import "fmt"

// StringableNumber requires BOTH conditions at once: the type's
// underlying type must be int, AND it must implement String()
// string -- a genuinely different, more expressive constraint than
// the main page's own pure-union Number/Ordered constraints.
type StringableNumber interface {
    ~int
    String() string
}

type Priority int

func (p Priority) String() string {
    switch p {
    case 1:
        return "low"
    case 2:
        return "medium"
    case 3:
        return "high"
    default:
        return "unknown"
    }
}

// Describe requires T to satisfy BOTH the underlying-type union AND
// the method requirement -- it can freely use both int-style
// operations (implied by ~int) and call .String().
func Describe[T StringableNumber](v T) string {
    return fmt.Sprintf("value %d is %s", int(v), v.String())
}

func main() {
    p := Priority(2)
    fmt.Println(Describe(p)) // value 2 is medium

    // Describe(42) would NOT compile: plain int satisfies ~int, but
    // does not implement String() string -- it fails the SECOND
    // half of the combined constraint.
}`,
    },
    {
      label: 'The restriction: methods cannot be folded INSIDE a multi-term union',
      language: 'typescript',
      code: `package main

// This demonstrates the ONE real restriction this subtopic's theory
// describes -- shown as comments since it does not compile.

// INVALID: a method requirement cannot be merged into a
// multi-term union's own | list.
// type Bad interface {
//     ~int | ~float64 | String() string
// }
// COMPILE ERROR (conceptually): methods cannot appear as a term
// inside a union with more than one type term.

// VALID: the union and the method stay as SEPARATE elements of the
// same interface -- exactly the shape this subtopic's theory
// describes, and the only way to combine them correctly.
type Good interface {
    ~int | ~float64 // union element: which underlying types qualify
    String() string  // separate method element: what must be implemented
}

// A single-term "union" (just one type, no |) CAN appear alongside
// a method without this restriction applying -- the restriction is
// specifically about a union that actually has multiple | terms.
type AlsoValid interface {
    ~int
    String() string
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants a generic function Sum[T Numeric](items []T) T that only accepts types whose underlying type is int, int64, or float64, AND additionally requires the type to implement a Validate() error method so Sum can skip invalid entries. A developer proposes writing the constraint as type Numeric interface { ~int | ~int64 | ~float64 | Validate() error }. Using this subtopic\'s theory, explain why this specific syntax is invalid, and show the corrected version.',
    hint: 'This subtopic\'s theory quotes the exact restriction from the Go spec about what a union "with more than one term" cannot contain. Does the proposed Numeric interface have a union with more than one term? Is Validate() error being placed AS ONE OF those union terms, or as a genuinely separate interface element?',
    solution: 'The proposed syntax is invalid because it folds the Validate() error method requirement directly INSIDE the union\'s own | list, as if it were just another alternative type alongside ~int, ~int64, and ~float64 — but per this subtopic\'s theory, quoting the Go spec directly, "a union (with more than one term) cannot contain... interfaces that specify methods." The union ~int | ~int64 | ~float64 | Validate() error has more than one term (three type terms), and Validate() error is exactly the kind of method-specifying element the spec prohibits from being merged into such a union. The corrected version keeps the union and the method as two SEPARATE elements of the same interface, exactly matching this subtopic\'s second code example\'s "Good" pattern: type Numeric interface { ~int | ~int64 | ~float64; Validate() error } — the union (which underlying types qualify) and the method requirement (what must be implemented) sit alongside each other as distinct interface elements, rather than the method being one of the union\'s own alternatives. This corrected version compiles and gives Sum exactly the combined constraint the team wants: T\'s underlying type must be one of the three numeric types, AND T must implement Validate() error, both conditions required simultaneously.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since Go generic constraints support type unions (like the main page\'s own ~int | ~float64) and separately support method requirements (like the main page\'s own comparable constraint), a single constraint can only ever use ONE of these two mechanisms — combining a union with a method requirement in the same constraint is not valid Go syntax.',
      reality: 'This subtopic\'s theory and first code example show combining them is genuinely valid, spec-documented syntax — the Go language specification itself gives a worked example of exactly this combination, requiring both a specific underlying type union AND a specific method implementation in a single constraint interface, used in the main page\'s own hub for the very first time in this subtopic.'
    },
    {
      thought: 'A method requirement can be added as just another term inside a type union\'s own | list, similar to how ~int | ~float64 lists two acceptable types — writing ~int | String() string as one union should work the same way, just mixing a type term with a method term.',
      reality: 'This subtopic\'s theory and second code example show this specific form is exactly what Go\'s own specification prohibits: "a union (with more than one term) cannot contain... interfaces that specify methods." A method requirement must be written as a structurally SEPARATE element of the constraint interface, never merged into the union\'s own | list — this is the one real restriction on an otherwise flexible combination.'
    },
    {
      thought: 'A combined constraint (union plus method) is a rarely-needed, exotic feature — most real Go generic code only ever needs a pure type union OR a pure method requirement, never genuinely both at once, so this combination is mostly a theoretical curiosity.',
      reality: 'This subtopic\'s exercise shows a realistic, practical motivation: a generic numeric function that needs to restrict T to specific numeric underlying types WHILE also requiring a domain-specific capability (like validation) is a genuinely common shape once generic code grows beyond the simplest cases — exactly the kind of requirement that arises naturally once a generic function needs to do more than one thing with its type parameter.'
    }
  ];
}
