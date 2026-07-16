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
  templateUrl: './comprehensions-get-their-own-scope-in-python-3.html',
  styleUrl: './comprehensions-get-their-own-scope-in-python-3.scss'
})
export class ComprehensionsGetTheirOwnScopeInPython3Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A comprehension\'s loop variable does not leak into the enclosing scope in Python 3 — a plain for loop\'s does',
      points: [
        'The main page\'s own theory says comprehensions "run in optimised C bytecode" and are "generally faster than equivalent for loops," but doesn\'t mention a genuine behavioral difference beyond speed: scoping. Python\'s own language reference states plainly, in the section on list/set/dict displays: "the comprehension is executed in a separate implicitly nested scope. This ensures that names assigned to in the target list don\'t \'leak\' into the enclosing scope."',
        'This is a real, deliberate change from Python 2 — the official "What\'s New in Python 3.0" migration notes confirm list comprehensions "are closer to syntactic sugar for a generator expression inside a list() constructor, and in particular the loop control variables are no longer leaked into the surrounding scope." So [x**2 for x in range(5)] in Python 3 genuinely does NOT define x in the surrounding code — referencing x afterward (if it wasn\'t already defined some other way) raises NameError.',
        'This is the opposite of a plain for loop\'s behavior, which the main page\'s own control-flow section uses freely (for i, item in enumerate(items, start=1): ...) without needing to mention that i and item remain accessible and holding their LAST values after the loop finishes — a regular for loop has no scope of its own; it runs directly in whatever scope contains it, exactly like an if block does.',
      ]
    },
    {
      heading: 'Why this distinction is easy to miss and where it actually bites',
      points: [
        'Because both a for loop and a comprehension use the same for ... in ... syntax, and both are commonly taught side-by-side as interchangeable ("comprehensions can replace many loops," per the main page\'s own theory), it is natural to assume they share identical scoping rules too. They don\'t — a comprehension is, per the language reference itself, effectively compiled as its own nested function call.',
        'This surfaces as a real bug pattern: code that runs a comprehension for some quick transformation, then later — often much later, or in a different branch — tries to reuse what looks like "the last value of the loop variable" the way it could after a plain for loop, and gets a NameError instead, because the comprehension\'s loop variable was never accessible outside it in the first place.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'for loop leaks its variable; a comprehension does not',
      language: 'typescript',
      code: `# A plain for loop has NO scope of its own — i and item remain
# accessible after the loop, holding their LAST values.
items = ["a", "b", "c"]
for i, item in enumerate(items):
    pass
print(i, item)   # 2 c — both still accessible here

# A list comprehension is different — its loop variable x lives
# ONLY inside the comprehension's own implicit scope.
squares = [x**2 for x in range(5)]
print(squares)   # [0, 1, 4, 9, 16] — this works fine

print(x)   # NameError: name 'x' is not defined
           # x was never leaked into this scope at all — even
           # though the for-loop example above proves a REGULAR
           # for loop's variable WOULD have survived here.`,
    },
    {
      label: 'A real consequence — reusing a pre-existing name safely',
      language: 'typescript',
      code: `# Because comprehensions get their own scope, they can safely
# reuse a name that already means something in the enclosing code,
# without silently overwriting it — a real, useful consequence of
# the scoping rule, not just a theoretical detail.
x = "the current record"
doubled = [x * 2 for x in [1, 2, 3]]   # inner x is fully isolated

print(doubled)   # [2, 4, 6]
print(x)         # "the current record" — UNCHANGED, still the
                  # original string, because the comprehension's
                  # own x never touched the enclosing scope's x.

# Contrast: a plain for loop reusing the same name WOULD overwrite it.
x = "the current record"
for x in [1, 2, 3]:
    pass
print(x)   # 3 — the enclosing x really was overwritten this time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A function processes a batch of records using a list comprehension: results = [transform(record) for record in batch]. Later in the SAME function, the code tries to log the last record processed with logging.info(f"last record: {record}"), expecting record to still hold the final item from the comprehension, the way it would after a regular for loop. This raises a NameError. Explain why, using what this subtopic covers, and describe the fix.',
    hint: 'Does a list comprehension\'s loop variable behave the same way a plain for loop\'s does with respect to the enclosing scope — does it remain accessible after the comprehension finishes, the way this subtopic\'s first code example shows a for loop\'s variable does?',
    solution: 'The NameError happens because a list comprehension has its own separate, implicitly nested scope — per Python\'s own language reference, this "ensures that names assigned to in the target list don\'t leak into the enclosing scope," which is precisely why record, despite looking like an ordinary loop variable, was never actually defined in the function\'s own scope at any point. This is genuinely different from a plain for loop (for record in batch: ...), whose loop variable DOES remain accessible after the loop, holding its last value — the code\'s author was likely relying on that plain-for-loop behavior out of habit, not realizing list comprehensions follow a different, Python-3-specific scoping rule (this changed from Python 2, where comprehension variables did leak). The fix is either: (1) if the last-processed record genuinely needs to be referenced afterward, track it explicitly with its own assignment outside the comprehension (e.g., results = [], then for record in batch: results.append(transform(record)) — reverting to a plain for loop specifically because the loop variable needs to survive afterward), or (2) if only the last item of the ORIGINAL batch is actually needed (not something scoped to the comprehension itself), reference batch[-1] directly instead of relying on any loop variable\'s post-loop value at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since list comprehensions and plain for loops both use the exact same for x in iterable syntax and are described as interchangeable ways to write a loop, they must also share the same scoping behavior — a comprehension\'s loop variable should remain accessible afterward, just like a for loop\'s does.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — per Python\'s own language reference, a comprehension runs in its own separate implicitly nested scope specifically so its loop variable does NOT leak into the enclosing code, unlike a plain for loop, which has no scope of its own at all.'
    },
    {
      thought: 'This scoping behavior for comprehensions has always been true in Python — it is just a permanent, unremarkable language feature with no real history behind it.',
      reality: 'This subtopic\'s theory explains the opposite — this is a documented, deliberate CHANGE introduced in Python 3.0 specifically; Python 2\'s list comprehensions DID leak their loop variable into the enclosing scope, and the official "What\'s New in Python 3.0" notes describe fixing this as an explicit design decision.'
    },
    {
      thought: 'A comprehension reusing a variable name that already exists in the enclosing scope (e.g., x = "something"; result = [x for x in range(5)]) will overwrite that existing variable\'s value, the same way a plain for loop reusing the name would.',
      reality: 'This subtopic\'s second code example shows the opposite — because the comprehension\'s x lives entirely inside its own separate scope, the enclosing x is completely untouched and retains its original value afterward, in direct contrast to a plain for loop reusing the same name, which genuinely does overwrite it.'
    }
  ];
}
