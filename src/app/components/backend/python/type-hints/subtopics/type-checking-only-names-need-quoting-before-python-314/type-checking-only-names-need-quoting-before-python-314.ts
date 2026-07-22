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
  templateUrl: './type-checking-only-names-need-quoting-before-python-314.html',
  styleUrl: './type-checking-only-names-need-quoting-before-python-314.scss'
})
export class TypeCheckingOnlyNamesNeedQuotingBeforePython314Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'On Python ≤3.13, a bare TYPE_CHECKING-only name in an annotation raises NameError at DEFINITION time',
      points: [
        'The main page\'s own TYPE_CHECKING example writes if TYPE_CHECKING: from some_heavy_module import HeavyClass followed directly by def process(obj: HeavyClass) -> None: ... with HeavyClass used completely unquoted in the annotation. Without more context, this looks safe and complete — but whether it actually works as written depends entirely on which Python version is running it.',
        'On Python 3.13 and earlier, annotations are evaluated EAGERLY by default the moment the def statement runs — this is the behavior the main page\'s own earlier "from __future__ import annotations" section describes as needing to be explicitly opted into via PEP 563 to defer. Without that opt-in (or without quoting the name as a string, "HeavyClass"), referencing HeavyClass directly in the annotation raises NameError the instant Python parses the def process(...) line — at IMPORT time, not when process() is later called — because HeavyClass was only ever imported inside the if TYPE_CHECKING: block, which never actually runs.',
        'Python 3.14 changed this default. PEP 649 made deferred (lazy) evaluation of annotations the DEFAULT behavior for the whole language, and the current typing documentation\'s own TYPE_CHECKING example is written with an unquoted annotation specifically because, per the docs: "annotations aren\'t eagerly evaluated (see PEP 649) so using undefined symbols in annotations is harmless—as long as you don\'t later examine them." On 3.14+, the exact same unquoted def process(obj: HeavyClass) -> None: ... genuinely works without any NameError, with no __future__ import or quoting needed at all.',
      ]
    },
    {
      heading: 'What this means for code that needs to work correctly across versions',
      points: [
        'Code specifically targeting Python 3.13 or earlier (or code that needs to run correctly across a MIX of pre-3.14 and 3.14+ environments) still needs one of the two established workarounds for a TYPE_CHECKING-only name used in an annotation: either quote it as a string literal ("HeavyClass") at that specific occurrence, or add from __future__ import annotations at the top of the file to defer ALL annotations in that file to lazy strings, matching the main page\'s own PEP 563 coverage.',
        'Since PEP 649 only became the language default in 3.14, and a great deal of Python code in active use today still targets 3.9 through 3.13 (this page\'s own "since" tag is Python 3.9+), the safe, version-independent default for any codebase not yet requiring 3.14+ exclusively is to keep quoting or using the __future__ import for TYPE_CHECKING-only names, rather than relying on the newer, more permissive default that only some readers\' interpreters will actually have.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Unquoted TYPE_CHECKING name — version-dependent outcome',
      language: 'typescript',
      code: `from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from some_heavy_module import HeavyClass   # only imported for type checkers

def process(obj: HeavyClass) -> None:   # UNQUOTED reference
    ...

# On Python <= 3.13 (eager annotation evaluation by default):
# NameError: name 'HeavyClass' is not defined
# — raised the moment this file is IMPORTED, at the 'def process'
#   line itself, since HeavyClass was never actually imported at
#   runtime (the TYPE_CHECKING block never runs).

# On Python 3.14+ (PEP 649 — lazy evaluation is now the default):
# No error at all — annotations aren't evaluated eagerly, so an
# undefined symbol used only in an annotation is harmless unless
# something later actually inspects/evaluates it.`,
    },
    {
      label: 'The version-safe fix — quote it, or defer the whole file',
      language: 'typescript',
      code: `from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from some_heavy_module import HeavyClass

# Option 1 — quote just this occurrence (works on every Python
# version this page targets, 3.9+, with no other changes needed):
def process(obj: "HeavyClass") -> None:
    ...

# Option 2 — defer ALL annotations in the whole file at once,
# matching the main page's own PEP 563 coverage (also works on
# every version 3.9+, and removes the need to quote individually):
from __future__ import annotations

def process2(obj: HeavyClass) -> None:   # unquoted — safe, because
    ...                                    # __future__ import defers
                                            # evaluation of every
                                            # annotation in this file`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A codebase pinned to Python 3.11 in its CI pipeline has a module with if TYPE_CHECKING: import pandas as pd, followed by an unquoted annotation def process(df: pd.DataFrame) -> None: .... A developer testing locally with a newly-installed Python 3.14 interpreter reports the module imports and runs fine. The same module fails with NameError: name \'pd\' is not defined the moment CI runs it against the pinned Python 3.11. Explain why, using what this subtopic covers.',
    hint: 'What changed about the DEFAULT annotation-evaluation behavior between Python 3.13 and 3.14, per this subtopic\'s theory? Does the same unquoted TYPE_CHECKING-only annotation behave identically across every Python version, or does its safety depend on which interpreter is actually running it?',
    solution: 'The discrepancy happens because Python\'s default annotation-evaluation behavior genuinely changed between versions, and the developer\'s local Python 3.14 interpreter benefits from that change while the CI pipeline\'s pinned Python 3.11 does not. Per PEP 649, Python 3.14 made deferred (lazy) evaluation of annotations the language DEFAULT, meaning an unquoted TYPE_CHECKING-only name like pd in an annotation is harmless on 3.14+ — Python\'s own current typing documentation confirms this exact pattern is safe there, "as long as you don\'t later examine them." Python 3.11, however, predates PEP 649 entirely and evaluates annotations EAGERLY by default, meaning the def process(df: pd.DataFrame) line itself tries to resolve pd the moment the module is imported — and since pd was only ever imported inside the if TYPE_CHECKING: block (which never actually executes at runtime), Python 3.11 correctly raises NameError: name \'pd\' is not defined at that exact point, exactly as documented for pre-3.14 behavior. The developer\'s local success was specific to their newer interpreter and never actually validated the code would work on the project\'s real, pinned target version. The fix is adding the standard pre-3.14 workaround — either quoting the annotation as def process(df: "pd.DataFrame") -> None: ..., or adding from __future__ import annotations at the top of the file to defer every annotation in it — either of which makes the code correct on Python 3.11 (and remains harmless, if slightly unnecessary, on 3.14+ too).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own TYPE_CHECKING example — using an unquoted name like HeavyClass directly in an annotation, with HeavyClass only ever imported inside the if TYPE_CHECKING: block — is universally safe on any Python version supporting TYPE_CHECKING at all (Python 3.5.3+).',
      reality: 'This subtopic\'s theory and first code example both show this depends entirely on which Python version is running the code — this exact pattern raises NameError at definition time on Python 3.13 and earlier (eager annotation evaluation by default), and only became safe unquoted starting in Python 3.14, once PEP 649 made lazy evaluation the language default.'
    },
    {
      thought: 'Since testing a piece of code locally shows it imports and runs without any NameError, that confirms the code is correct and will behave the same way when deployed or run in CI, regardless of any Python version differences between the two environments.',
      reality: 'This subtopic\'s exercise shows the opposite — the exact same unquoted TYPE_CHECKING annotation pattern can genuinely succeed on one Python version (3.14+) while failing with NameError on an older one (3.13 and earlier) the project might actually be pinned to in CI or production, making local success on a newer interpreter an unreliable signal on its own.'
    },
    {
      thought: 'Quoting a TYPE_CHECKING-only name in an annotation, or adding from __future__ import annotations, was only ever a temporary workaround needed for older Python versions and can now be safely dropped from any codebase, since Python 3.14 fixed the underlying issue.',
      reality: 'This subtopic\'s theory explains the opposite — since a large amount of Python code in active use still targets versions before 3.14 (this page\'s own scope is Python 3.9+), quoting or the __future__ import remains the correct, version-safe default for any codebase that has not already fully committed to requiring Python 3.14 or later.'
    }
  ];
}
