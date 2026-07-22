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
  templateUrl: './custom-is-as-methods.html',
  styleUrl: './custom-is-as-methods.scss'
})
export class CustomIsAsMethodsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'errors.Is does not only compare with == — it also asks the error itself',
      points: [
        'The main page\'s own mistake entry says to always prefer errors.Is over == because it "traverses the whole chain" — true, but that description only covers HALF of what errors.Is actually checks at each step. Per the errors package documentation, the precise rule is: "An error is considered to match a target if it is equal to that target or if it implements a method Is(error) bool such that Is(target) returns true."',
        'That second clause is a real, separate matching path: any error type can implement its own Is(error) bool method to declare that it should be treated as matching a target it is NOT literally == to. errors.Is checks this at every step of the chain it walks, not just at the top.',
        'The documented contract for that method is narrow and specific: an Is method "should only shallowly compare err and the target and not call Unwrap on either" — the chain-walking itself stays entirely errors.Is\'s own responsibility; the custom method\'s only job is answering "does target count as equivalent to me specifically," not participating in the traversal.',
      ]
    },
    {
      heading: 'errors.As works the same way, via an As(any) bool method — but with a bigger responsibility',
      points: [
        'errors.As has the same two-path structure. Per the documentation: "An error matches target if the error\'s concrete value is assignable to the value pointed to by target, or if the error has a method As(any) bool such that As(target) returns true. In the latter case, the As method is responsible for setting target."',
        'That last sentence is the key difference from Is: a custom As method does not just answer yes/no — it must itself populate target, the same way the default (no-custom-method) path performs a type assertion and assignment for you automatically. A custom As implementation has full control over what gets constructed and written into target, not just a decision about whether one already-existing value matches.',
        'This makes a custom As method strictly more powerful than a custom Is method: Is can only ever say "treat me as equivalent to this," while As can synthesize and hand back an entirely different, richer value than the error itself literally contains — useful when a low-level error needs to be reinterpreted as a different, more application-specific error type on the way out.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A custom Is() method matching several concrete values to one semantic check',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
    "os"
)

// osPermissionWrapper is a fictional low-level error type that wraps
// several different underlying OS-specific error codes, all of which
// mean "permission denied" in this application's own domain.
type osPermissionWrapper struct {
    code int
}

func (e *osPermissionWrapper) Error() string {
    return fmt.Sprintf("os error code %d", e.code)
}

// Is lets this type declare "treat me as os.ErrPermission" without
// ever actually being == to it -- errors.Is calls this automatically.
func (e *osPermissionWrapper) Is(target error) bool {
    return target == os.ErrPermission && (e.code == 13 || e.code == 5)
}

func main() {
    err := &osPermissionWrapper{code: 13}

    // err is NOT == os.ErrPermission -- they are different concrete
    // values entirely. But errors.Is calls err.Is(os.ErrPermission),
    // which returns true, so this still reports a match:
    fmt.Println(errors.Is(err, os.ErrPermission)) // true
    fmt.Println(err == os.ErrPermission)          // false`,
    },
    {
      label: 'A custom As() method that synthesizes a different type',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

type HTTPError struct {
    StatusCode int
    Message    string
}

func (e *HTTPError) Error() string {
    return fmt.Sprintf("http %d: %s", e.StatusCode, e.Message)
}

// dbTimeoutError is a low-level error that knows how to REINTERPRET
// itself as an HTTPError on demand, without ever holding one directly.
type dbTimeoutError struct {
    query string
}

func (e *dbTimeoutError) Error() string {
    return fmt.Sprintf("query timed out: %s", e.query)
}

// As is responsible for constructing AND assigning target itself --
// the default path only ever does a type assertion; this one builds
// a brand new value that never existed until this call.
func (e *dbTimeoutError) As(target any) bool {
    httpErr, ok := target.(**HTTPError)
    if !ok {
        return false
    }
    *httpErr = &HTTPError{StatusCode: 504, Message: "upstream query timed out"}
    return true
}

func main() {
    var err error = &dbTimeoutError{query: "SELECT * FROM orders"}

    var httpErr *HTTPError
    if errors.As(err, &httpErr) {
        // httpErr was synthesized by dbTimeoutError's own As method --
        // dbTimeoutError never held an *HTTPError field at all.
        fmt.Println(httpErr.StatusCode) // 504
        fmt.Println(httpErr.Error())    // http 504: upstream query timed out
    }`,
    },
    {
      label: 'The default path, for contrast: plain type-assignability, no custom method',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

type ValidationError struct {
    Field string
}

func (e *ValidationError) Error() string {
    return "invalid: " + e.Field
}

// No Is or As method defined here -- errors.Is/As fall back to their
// DEFAULT behavior: == for Is, plain type-assignability for As.

func main() {
    err := fmt.Errorf("request failed: %w", &ValidationError{Field: "email"})

    var ve *ValidationError
    // Default As path: errors.As walks the chain and performs an
    // ordinary type assertion for you -- err.(*ValidationError) --
    // no custom method involved, and target is set to the SAME
    // *ValidationError value the chain already contained.
    if errors.As(err, &ve) {
        fmt.Println(ve.Field) // email
    }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A caching layer defines its own cacheMissError type and wants callers elsewhere in the codebase — code that has never heard of cacheMissError and only checks errors.Is(err, sql.ErrNoRows) — to treat a cache miss exactly like a "no rows" database result, without cacheMissError literally being sql.ErrNoRows. Using this subtopic\'s theory, describe the minimal change to cacheMissError that achieves this, and explain precisely why it works.',
    hint: 'Does cacheMissError need to actually wrap or contain sql.ErrNoRows anywhere? What is the exact signature of the method errors.Is looks for, and what should that method\'s body compare against?',
    solution: 'cacheMissError does not need to wrap, contain, or construct sql.ErrNoRows anywhere at all — the minimal change is implementing one method: func (e *cacheMissError) Is(target error) bool { return target == sql.ErrNoRows }. This works because of the second matching path documented for errors.Is: "An error is considered to match a target if it is equal to that target or if it implements a method Is(error) bool such that Is(target) returns true." Once cacheMissError implements this exact signature, any call to errors.Is(err, sql.ErrNoRows) where err is (or wraps) a *cacheMissError will invoke this Is method with target set to sql.ErrNoRows, the method returns true, and errors.Is reports a match — even though the two values are never == and cacheMissError never held a reference to sql.ErrNoRows internally. Per this subtopic\'s theory, the Is method\'s job is narrowly "shallowly compare err and target," not manage any wrapping relationship — this is exactly what makes it possible for one error type to declare compatibility with an entirely unrelated sentinel value defined in a different package, with zero changes needed anywhere in the calling code that already does errors.Is(err, sql.ErrNoRows).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'errors.Is only ever works by comparing two error values with == (after walking the wrapping chain) — the main page\'s own advice to "use errors.Is instead of ==" is really just about repeating that same == check at every layer of the chain automatically.',
      reality: 'This subtopic\'s theory and first code example show errors.Is has a second, separate matching path beyond chain-walking-plus-==: any error type can implement Is(error) bool to declare a match against a target it is never literally equal to. errors.Is checks for and calls this method at every step, not just performing == repeatedly.'
    },
    {
      thought: 'A custom As(any) bool method works like Is — it just answers "does this error match," and errors.As handles extracting the value into target automatically either way, the same way it does for the default type-assignability path.',
      reality: 'This subtopic\'s theory and second code example show the documented contract is different for As: "the As method is responsible for setting target" itself — there is no automatic assignment happening after a custom As method runs. This is why a custom As implementation can synthesize and hand back a value the original error never actually held, unlike the default path\'s plain type assertion.'
    },
    {
      thought: 'Implementing a custom Is or As method is an advanced, rarely-needed escape hatch that ordinary application error types have no real reason to define — the main page\'s standard errors.New/fmt.Errorf/errors.Is/errors.As usage already covers everything most code needs.',
      reality: 'This subtopic\'s exercise shows a genuinely common, practical use case: bridging one package\'s own error type to a caller\'s existing errors.Is(err, someSentinel) check without requiring that caller to know or import the new type at all — a single small Is method accomplishes this cleanly, and is a real pattern used throughout the Go standard library and many third-party packages, not just a theoretical capability.'
    }
  ];
}
