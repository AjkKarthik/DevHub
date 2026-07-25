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
  templateUrl: './flatten-only-unwraps-nested-lists-not-lists-inside-maps.html',
  styleUrl: './flatten-only-unwraps-nested-lists-not-lists-inside-maps.scss'
})
export class FlattenOnlyUnwrapsNestedListsNotListsInsideMapsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s QnA says flatten() "removes all levels of nesting" — true, but only for one specific shape',
      points: [
        'The main page\'s QnA states: "flatten() removes all levels of nesting — it fully flattens regardless of depth. [[[1],2],[3]] becomes [1,2,3]." This is accurate for LISTS nested inside lists — but the phrasing "removes all levels of nesting" reads as a much broader claim than what the function actually does.',
      ]
    },
    {
      heading: 'flatten() only unwraps directly-nested LISTS — not lists tucked inside maps or objects',
      points: [
        'flatten() recursively collapses list-within-list nesting to any depth, exactly as the main page\'s own example shows — but it does NOT reach into a map or object and flatten a list value found there. A list sitting as a VALUE inside a map is left completely untouched, even though it looks structurally similar to the nested-list case flatten() does handle.',
        'Concretely: <code>flatten([{members = ["a", "b"]}, {members = ["c"]}])</code> does nothing useful — the input is a list of OBJECTS, not a list of LISTS, so there is no list-within-list nesting for flatten() to collapse; the result is the same list of two objects, each still holding its own <code>members</code> list untouched.',
      ]
    },
    {
      heading: 'The fix: extract the nested lists first, then flatten the resulting list of lists',
      points: [
        'The correct pattern for "a map/object whose values are lists that need to become one flat list" is a two-step transformation: first use a <code>for</code> expression to pull just the list values OUT of their containing maps/objects (producing a genuine list of lists), THEN call <code>flatten()</code> on that result.',
        'This is exactly the shape the main page\'s own "Practical Examples" codeTab already uses correctly for MODULE outputs (<code>flatten([module.az1.subnet_ids, module.az2.subnet_ids, module.az3.subnet_ids])</code>) — that works because each <code>module.azN.subnet_ids</code> reference already extracts a plain list value before <code>flatten()</code> ever sees it; the gap is specifically when the lists start out nested one level DEEPER, inside a map or object, requiring the extra <code>for</code>-expression step first.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap: flatten() on a list of objects containing lists',
      language: 'bash',
      code: `variable "groups" {
  type = map(object({
    members = list(string)
  }))
  default = {
    admins  = { members = ["alice", "bob"] }
    viewers = { members = ["carol"] }
  }
}

locals {
  # This does NOT produce a flat list of all members --
  # flatten() only unwraps LIST-in-LIST nesting, and this
  # input is a list of OBJECTS (each holding its own list),
  # not a list of lists:
  all_members_broken = flatten(values(var.groups))
}
# Result: unchanged -- still a list of the two original
# objects, each with its own untouched "members" list.
# No error, no warning -- just silently not what was wanted.`,
    },
    {
      label: 'The fix: extract the lists first, then flatten',
      language: 'bash',
      code: `locals {
  # Step 1: a for expression pulls just the "members" list
  # value OUT of each object -- producing a genuine list of
  # lists, the shape flatten() actually knows how to collapse:
  member_lists = [for g in values(var.groups) : g.members]
  # [["alice", "bob"], ["carol"]]

  # Step 2: NOW flatten() does exactly what was intended:
  all_members = flatten(local.member_lists)
  # ["alice", "bob", "carol"]
}

# The main page's own module-output example already follows
# this same two-step shape implicitly -- each module.azN
# reference already extracts a plain list before flatten()
# sees it:
locals {
  all_subnet_ids = flatten([
    module.az1.subnet_ids,   # already a plain list
    module.az2.subnet_ids,   # already a plain list
    module.az3.subnet_ids,
  ])
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A variable is typed `map(object({ members = list(string) }))`, holding several groups each with their own members list. A developer writes `flatten(values(var.groups))` expecting a single flat list of every member across every group — but the result is unchanged from the input, still a list of the original group objects. Why doesn\'t flatten() unwrap the members lists here, and what two-step transformation actually produces the intended flat list?',
    hint: 'flatten() only collapses LIST-within-LIST nesting. What is the actual outer structure of values(var.groups) — a list of lists, or a list of something else?',
    solution: 'values(var.groups) produces a list of OBJECTS (each object being { members = [...] }), not a list of LISTS — flatten() only unwraps directly-nested list-within-list structures, and a list value tucked inside an object one level down is not something it reaches into. The fix is a two-step transformation: first, a for expression extracts just the members list out of each object, producing a genuine list of lists — `[for g in values(var.groups) : g.members]` — and only THEN does `flatten(...)` on that result correctly collapse it into one flat list of every member across every group.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'flatten() "removes all levels of nesting" (as the main page\'s own QnA states) means it will unwrap any nested structure — lists inside maps, lists inside objects, lists inside lists — into one flat list.',
      reality: 'Per this subtopic\'s theory, flatten() specifically only collapses directly-nested LIST-within-LIST structures — a list value sitting inside a map or object is left completely untouched, even at one level of nesting.'
    },
    {
      thought: 'Calling flatten() on a list of objects that each contain a list attribute is a safe, valid way to combine all those inner lists into one, even if it requires an extra step to look right.',
      reality: 'Per this subtopic\'s theory, flatten() applied directly to a list of objects does nothing at all — it silently returns the same list of objects unchanged, since there is no list-within-list nesting present for it to act on; the actual fix requires extracting the inner lists first with a for expression.'
    },
    {
      thought: 'The main page\'s own module-output flatten() example (combining subnet_ids across three modules) is fundamentally the same pattern as flattening a map of lists — both should work identically.',
      reality: 'Per this subtopic\'s theory, the module-output example works specifically because each module.azN.subnet_ids reference already extracts a plain list value before flatten() sees it — it is not proof that flatten() can reach into a map/object to extract a nested list on its own.'
    }
  ];
}
