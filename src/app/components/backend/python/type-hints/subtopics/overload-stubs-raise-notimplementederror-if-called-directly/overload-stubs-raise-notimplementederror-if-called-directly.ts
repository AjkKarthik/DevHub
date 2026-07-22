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
  templateUrl: './overload-stubs-raise-notimplementederror-if-called-directly.html',
  styleUrl: './overload-stubs-raise-notimplementederror-if-called-directly.scss'
})
export class OverloadStubsRaiseNotimplementederrorIfCalledDirectlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Forgetting the real implementation after @overload stubs raises NotImplementedError, not a silent bug',
      points: [
        'The main page\'s own @overload example shows three stub signatures (each ending in ...) followed by a fourth, non-decorated def parse_number(value: str | int | None) -> int | None: — the actual, real implementation that runs at call time. It\'s easy to assume the stubs themselves are inert, ordinary function definitions that simply get overwritten by whichever def statement runs last, the way any repeated function name normally works in Python.',
        'That is not what actually happens. Python\'s own typing documentation states directly: "@overload-decorated definitions are for the benefit of the type checker only, since they will be overwritten by the non-@overload-decorated definition... At runtime, calling an @overload-decorated function directly will raise NotImplementedError." The @overload decorator doesn\'t just leave the stub\'s own ... body in place for ordinary name-rebinding to eventually replace — it actively replaces the stub with a special placeholder object whose entire purpose is to raise NotImplementedError if anything ever calls it.',
        'So if a developer forgets to write the final, non-@overload real implementation entirely — leaving only the @overload-decorated stubs — the name in the module namespace resolves to the LAST stub\'s dummy placeholder, and calling it raises NotImplementedError immediately, not a silent no-op returning None the way a bare ... expression statement would if it were genuinely still callable.',
      ]
    },
    {
      heading: 'Why this is a deliberate, useful guard, not an accident',
      points: [
        'This is actually a helpful safety net rather than a limitation to work around: since @overload signatures exist purely to describe TYPE information to mypy/pyright, and the real work always has to live in the final undecorated implementation, silently letting a stub run (doing nothing, returning None) would be a much harder bug to notice than a loud, immediate NotImplementedError the moment the missing implementation is actually exercised.',
        'This means a genuinely broken @overload setup (missing the real implementation) fails LOUDLY the first time the function is called at runtime — even though nothing about the omission is caught by Python\'s import-time parsing, since defining three @overload-decorated functions with no final implementation is syntactically completely valid; only a type checker (mypy/pyright) or an actual runtime call would ever reveal the mistake.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Missing the real implementation — NotImplementedError, not a silent no-op',
      language: 'typescript',
      code: `from typing import overload

@overload
def parse_number(value: str) -> int: ...
@overload
def parse_number(value: int) -> int: ...
@overload
def parse_number(value: None) -> None: ...

# The real implementation was accidentally never written — the
# module ends here with only @overload stubs, no undecorated def.

result = parse_number("42")
# NotImplementedError
# — NOT a silent None return. Python's own typing module replaces
#   every @overload-decorated function with a dummy object whose
#   sole body raises this error if ever actually called.`,
    },
    {
      label: 'The correct, complete pattern (matching the main page\'s own example)',
      language: 'typescript',
      code: `from typing import overload

@overload
def parse_number(value: str) -> int: ...
@overload
def parse_number(value: int) -> int: ...
@overload
def parse_number(value: None) -> None: ...

# The REAL implementation — undecorated, with the actual logic.
# This is what "overwrites" the stubs in the module namespace,
# per Python's own typing docs.
def parse_number(value: str | int | None) -> int | None:
    if value is None:
        return None
    return int(value)

parse_number("42")   # 42 — calls the real implementation, works fine
parse_number(None)   # None — also works fine

# mypy uses the @overload stubs' signatures for precise type
# checking at call sites; Python itself only ever executes the
# final, undecorated function body.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A library author writes three @overload stub signatures for a serialize() function, intending to add the real implementation "later," but the pull request is merged and released without it — the module ends with only the three @overload-decorated stubs, no undecorated def serialize(...). A consumer of the library reports that calling serialize(my_object) raises NotImplementedError, and assumes this is a deliberate "not yet implemented" marker the library author left in place intentionally. Evaluate this assumption, using what this subtopic covers.',
    hint: 'Per Python\'s own typing documentation, what specifically happens to an @overload-decorated function definition\'s own body at runtime — is it left as ordinary, callable code, or replaced with something else entirely? Would a genuinely intentional "not implemented yet" marker look any different from this?',
    solution: 'The consumer\'s assumption is understandable but incorrect — the NotImplementedError is not a deliberate "not yet implemented" marker the library author intentionally left in place; it is the automatic, unavoidable consequence of every @overload-decorated function being replaced with a special dummy object at decoration time, per Python\'s own typing documentation: "at runtime, calling an @overload-decorated function directly will raise NotImplementedError." This happens for ANY @overload-only setup missing its final implementation, regardless of whether the author intended it as a deliberate stub or, as described here, simply forgot to add the real implementation before merging. There is no way to distinguish "intentionally left unimplemented" from "accidentally forgot the implementation" just by observing the NotImplementedError at the call site — both produce the exact same error, from the exact same mechanism. The actual bug here is almost certainly the missing implementation, not a deliberate design choice — the fix on the library\'s side is adding the real, undecorated def serialize(...) function with actual logic, which is what "overwrites" the @overload stubs in the module namespace and makes the function genuinely callable; nothing about the @overload stubs\' signatures themselves needs to change.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The @overload decorator leaves each stub function\'s own body (the ... expression) intact and callable — if the real implementation is accidentally omitted, calling the function would just silently execute the last stub\'s ... body and return None, the same way any bare ... statement would.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own typing documentation confirms @overload-decorated functions are replaced with a special dummy object specifically designed to raise NotImplementedError if called directly, not left as ordinary, silently-returning-None callables.'
    },
    {
      thought: 'Since defining multiple @overload-decorated functions with the same name, with no final undecorated implementation, is syntactically valid Python that runs without any import-time error, this must mean the resulting function works correctly at runtime too.',
      reality: 'This subtopic\'s first code example shows the opposite — the code imports and defines successfully with no error at all, but the very first actual CALL to the function raises NotImplementedError, since nothing about @overload stub definitions is checked or validated until the function is genuinely invoked.'
    },
    {
      thought: 'A NotImplementedError raised from a function using @overload always indicates the library author deliberately marked that function as an intentional placeholder for future work, similar to how NotImplementedError is sometimes used explicitly in abstract base classes.',
      reality: 'This subtopic\'s exercise shows this cannot be assumed — the identical NotImplementedError is raised automatically by Python\'s own typing machinery whenever the final, real implementation is missing after a set of @overload stubs, regardless of whether that omission was intentional or simply an oversight.'
    }
  ];
}
