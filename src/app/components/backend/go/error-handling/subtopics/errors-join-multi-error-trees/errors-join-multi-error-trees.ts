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
  templateUrl: './errors-join-multi-error-trees.html',
  styleUrl: './errors-join-multi-error-trees.scss'
})
export class ErrorsJoinMultiErrorTreesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'errors.Join (Go 1.20+) collects several errors into one — via a plural Unwrap',
      points: [
        'The main page\'s own theory only covers the singular wrapping chain built by fmt.Errorf("%w", err) — one error wraps at most one other error, and errors.Unwrap(err) walks that chain one link at a time. errors.Join(errs...) is a separate, later addition (Go 1.20) for a different shape entirely: combining several INDEPENDENT errors — none of which wraps any other — into a single error value.',
        'Per the errors package documentation: Join "returns an error that wraps the given errors," discarding any nil values passed in, and returning nil itself if every argument was nil. Its Error() string is "the concatenation of the strings obtained by calling the Error method of each element of errs, with a newline between each string" — so printing a joined error shows every underlying message, one per line.',
        'The mechanism behind this is a second, DIFFERENT unwrap shape: a non-nil error returned by Join implements Unwrap() []error — returning a SLICE of errors — rather than the singular Unwrap() error every %w-wrapped error implements. This plural form is what lets one error value represent many peers at once instead of a single linear predecessor.',
      ]
    },
    {
      heading: 'errors.Is and errors.As traverse the whole tree — but the plain errors.Unwrap function cannot see into a Join at all',
      points: [
        'errors.Is and errors.As both understand the plural Unwrap() []error shape: when their traversal reaches a joined error, they recurse into EVERY element of that slice in turn (depth-first), checking each one — and anything IT further wraps — before moving to the next. This means errors.Is(joined, target) returns true if target matches ANY error anywhere in the tree, not just a single linear predecessor.',
        'The plain errors.Unwrap(err) FUNCTION is a different piece of machinery from the Is/As traversal internals, and it is documented with a sharp, explicit limitation: "Unwrap only calls a method of the form \'Unwrap() error\'. In particular Unwrap does not unwrap errors returned by Join." Calling errors.Unwrap() directly on a value returned by errors.Join always returns nil — not the first joined error, not any of them — even though errors.Is and errors.As both work correctly on that exact same value.',
        'This is a real, documented asymmetry worth internalizing precisely because errors.Unwrap looks like the "manual" version of what errors.Is/As do automatically — the main page\'s own Error Wrapping Chain example uses a for loop calling errors.Unwrap(e) repeatedly to walk a chain by hand. That exact pattern silently stops working (returns nil immediately) the moment any link in the chain was produced by errors.Join instead of fmt.Errorf.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Joining independent validation errors',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

func validate(name string, age int) error {
    var errs []error
    if name == "" {
        errs = append(errs, errors.New("name is required"))
    }
    if age < 0 {
        errs = append(errs, errors.New("age must be non-negative"))
    }
    if age > 150 {
        errs = append(errs, errors.New("age is unrealistically large"))
    }
    return errors.Join(errs...) // nil if errs is empty -- no wasted allocation
}

func main() {
    err := validate("", -3)
    if err != nil {
        fmt.Println(err)
        // name is required
        // age must be non-negative
    }

    // A fully valid input produces a genuinely nil error --
    // errors.Join(nothing...) collapses back to nil, not an
    // "empty but non-nil" joined error.
    fmt.Println(validate("Alice", 30) == nil) // true
}`,
    },
    {
      label: 'errors.Is finds a target anywhere in the tree',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

var ErrTimeout = errors.New("operation timed out")
var ErrClosed = errors.New("connection closed")

func fetchAll() error {
    var results []error
    results = append(results, fmt.Errorf("worker 1: %w", ErrTimeout))
    results = append(results, errors.New("worker 2: bad response"))
    results = append(results, fmt.Errorf("worker 3: %w", ErrClosed))
    return errors.Join(results...)
}

func main() {
    err := fetchAll()

    // ErrTimeout is buried two layers deep: Join -> worker 1's
    // own %w wrap -> ErrTimeout. errors.Is still finds it by
    // recursing depth-first into every joined branch.
    fmt.Println(errors.Is(err, ErrTimeout)) // true
    fmt.Println(errors.Is(err, ErrClosed))  // true -- a different branch entirely

    var notPresent = errors.New("never joined")
    fmt.Println(errors.Is(err, notPresent)) // false`,
    },
    {
      label: 'The errors.Unwrap() function gotcha',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

func main() {
    e1 := errors.New("disk full")
    e2 := errors.New("network unreachable")
    joined := errors.Join(e1, e2)

    // errors.Is/As traverse the whole plural tree correctly:
    fmt.Println(errors.Is(joined, e1)) // true
    fmt.Println(errors.Is(joined, e2)) // true

    // But the plain errors.Unwrap() FUNCTION only ever calls a
    // method literally named "Unwrap() error" (singular). Join's
    // own error implements the PLURAL "Unwrap() []error" instead --
    // a different method signature entirely -- so this returns nil,
    // not e1, not e2, and not a usable list of anything.
    next := errors.Unwrap(joined)
    fmt.Println(next == nil) // true

    // To get the underlying errors back out manually, you need the
    // plural interface directly, not the errors.Unwrap function:
    if j, ok := joined.(interface{ Unwrap() []error }); ok {
        fmt.Println(j.Unwrap()) // [disk full network unreachable]
    }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes a retry helper that collects every attempt\'s error with errs = append(errs, err) and returns errors.Join(errs...) if all attempts failed. Later, another function tries to inspect that returned error with a manual loop: for e := returnedErr; e != nil; e = errors.Unwrap(e) { fmt.Println(e) }. The loop prints the joined error\'s own combined message once, then stops immediately — it never prints the individual attempt errors separately. Explain exactly why, using what this subtopic covers.',
    hint: 'What method name does the plain errors.Unwrap() function look for — singular or plural? Which one does a value from errors.Join actually implement? What does errors.Unwrap() return when the method it is looking for is not present?',
    solution: 'The loop stops after one iteration because errors.Unwrap(e) returns nil on its very first call against the joined error, ending the for loop immediately after printing that one combined message. Per this subtopic\'s theory, the errors.Unwrap() FUNCTION only ever calls a method with the exact signature "Unwrap() error" (singular, returning one error) -- but a value returned by errors.Join implements a different, plural method instead: "Unwrap() []error" (returning a slice). Since the joined error does not have a method matching the singular signature errors.Unwrap is looking for, the function correctly returns nil, and the manual loop -- which was written assuming every error in this codebase follows the single-predecessor %w chain shown on the main page -- has no way to continue. This is not a bug in errors.Unwrap; it is documented, intentional behavior ("Unwrap does not unwrap errors returned by Join"). The fix is not to change the loop\'s condition, but to stop assuming errors.Unwrap can walk every kind of wrapped error: to inspect a joined error\'s own contents, the caller needs either errors.Is/errors.As (which DO understand the plural shape and traverse it correctly), or a manual type assertion to interface{ Unwrap() []error } to retrieve the underlying slice directly, as shown in this subtopic\'s third code example.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'errors.Join produces the same kind of linear wrapping chain as fmt.Errorf("%w", err) — just with more than one error stuffed into it — so any code that already walks a chain with errors.Unwrap() will keep working unchanged on a joined error.',
      reality: 'This subtopic\'s theory and third code example show these are two genuinely different mechanisms with different method signatures: fmt.Errorf\'s %w produces a value implementing the singular Unwrap() error; errors.Join produces a value implementing the plural Unwrap() []error instead. The plain errors.Unwrap() function only recognizes the singular form, so it returns nil immediately on anything Join produced — existing manual-unwrap-loop code silently stops working the moment a joined error reaches it.'
    },
    {
      thought: 'Since the plain errors.Unwrap() function cannot see into a joined error, errors.Is and errors.As probably cannot either — you have to manually type-assert to interface{ Unwrap() []error } to check for a target anywhere inside a joined error.',
      reality: 'This subtopic\'s theory and second code example show the opposite: errors.Is and errors.As have their OWN traversal logic (separate from the plain errors.Unwrap function) that explicitly understands and recurses into the plural Unwrap() []error shape, depth-first, across every joined branch. The manual type assertion is only needed if you want the raw slice of underlying errors back yourself — not for ordinary Is/As matching, which already works correctly on a joined error with zero extra code.'
    },
    {
      thought: 'errors.Join(errs...) always returns a non-nil error value, since you called it explicitly — so it is safe to check the result with if joined != nil without first filtering out nil entries from errs.',
      reality: 'This subtopic\'s first code example and theory confirm errors.Join discards any nil values it receives and, per the documented behavior, "returns nil if every value in errs is nil." Calling errors.Join(errs...) when every collected attempt actually succeeded (errs is empty, or contains only nils) correctly produces a genuinely nil error, not an empty-but-non-nil wrapper — so the ordinary if err != nil check still works exactly as expected, with no special-casing needed.'
    }
  ];
}
