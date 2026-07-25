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
  templateUrl: './nested-dynamic-blocks-shadow-the-outer-iterator-by-default.html',
  styleUrl: './nested-dynamic-blocks-shadow-the-outer-iterator-by-default.scss'
})
export class NestedDynamicBlocksShadowTheOuterIteratorByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own dynamic block example is a single, unnested block',
      points: [
        'The main page\'s Dynamic Blocks theory and its <code>dynamic "ingress"</code> codeTab both show exactly one level of nesting — a single <code>dynamic</code> block whose <code>content</code> accesses <code>ingress.value</code>. The page never shows what happens with TWO nested <code>dynamic</code> blocks, which is where a real, well-documented gotcha lives.',
      ]
    },
    {
      heading: 'The default iterator name is the block\'s own label — and an inner one hides an outer one sharing that name',
      points: [
        'When a <code>dynamic "block_type"</code> block doesn\'t specify an <code>iterator</code> argument, the iteration variable available inside its own <code>content</code> block defaults to the block\'s own label — exactly what the main page\'s own example relies on (<code>dynamic "ingress"</code> giving access to <code>ingress.value</code>).',
        'If a SECOND <code>dynamic</code> block is nested inside the first one\'s <code>content</code>, and it happens to use the SAME default-name pattern (its own label matching, or simply also relying on its own default iterator name landing on a name already in scope), the inner block\'s iterator SHADOWS the outer one within the inner <code>content</code> block — any reference to what was meant to be the outer iterator now resolves to the inner one instead, silently producing wrong values rather than an error.',
      ]
    },
    {
      heading: 'The fix: the iterator argument gives each dynamic block its own explicit name',
      points: [
        'Every <code>dynamic</code> block supports an <code>iterator</code> argument that renames its own iteration variable to whatever identifier is chosen — <code>dynamic "ingress" { iterator = "rule", for_each = ... }</code> makes the iteration variable available as <code>rule</code> instead of the default <code>ingress</code>.',
        'Giving every level of a nested <code>dynamic</code> block structure its own distinct, explicit <code>iterator</code> name (e.g. an outer <code>rule</code> and an inner <code>action</code>) removes any ambiguity — both the outer and inner iteration values remain simultaneously accessible by their own distinct names throughout the nested <code>content</code> blocks, with no shadowing risk regardless of what the block labels happen to be.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The shadowing trap: two nested dynamic blocks, default names',
      language: 'bash',
      code: `# A resource with nested repeatable structure -- rules, each
# containing multiple actions (a simplified illustrative shape)
resource "example_ruleset" "this" {
  dynamic "rule" {
    for_each = var.rules
    content {
      name = rule.value.name

      dynamic "rule" {                 # SAME default name as outer!
        for_each = rule.value.actions  # meant to reference the OUTER
                                        # rule.value -- but doesn't
        content {
          action = rule.value.action   # this rule.value is the
                                        # INNER dynamic block's own
                                        # iterator -- it silently
                                        # shadows the outer one here
        }
      }
    }
  }
}
# No error at all -- just silently wrong values inside the
# innermost content block, since "rule" now refers to whichever
# dynamic block's own default iterator is nearest in scope.`,
    },
    {
      label: 'The fix: distinct iterator names at every level',
      language: 'bash',
      code: `resource "example_ruleset" "this" {
  dynamic "rule" {
    iterator = "r"          # outer iterator explicitly named "r"
    for_each = var.rules
    content {
      name = r.value.name

      dynamic "rule" {
        iterator = "a"       # inner iterator explicitly named "a"
        for_each = r.value.actions
        content {
          action     = a.value.action
          rule_name  = r.value.name   # outer "r" still fully
                                       # accessible here -- no
                                       # shadowing, since the two
                                       # iterators have distinct
                                       # names throughout
        }
      }
    }
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A configuration nests one dynamic "rule" block inside another dynamic "rule" block (same label, both relying on their own default iterator name). The innermost content block needs to reference BOTH the outer rule\'s name and the inner rule\'s own action value, but every attempt to reference "the outer rule\'s value" from inside the innermost content block returns the INNER block\'s data instead. What is happening, and what single addition to each dynamic block fixes it?',
    hint: 'The default iterator name for a dynamic block is its own label. What happens when two nested dynamic blocks share that same default name?',
    solution: 'Both dynamic blocks are named "rule," and since neither specifies an iterator argument, both default their iteration variable to that same name — the inner dynamic block\'s own default iterator variable shadows the outer one within its own content block, so any reference to "rule" inside the innermost content resolves to the INNER block\'s data, silently hiding the outer one with no error at all. The fix is adding an explicit, distinct iterator argument to each dynamic block — e.g. `iterator = "r"` on the outer one and `iterator = "a"` on the inner one — so both `r.value` (the outer rule) and `a.value` (the inner action) remain simultaneously accessible by their own distinct names inside the innermost content block, with no shadowing.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Nesting two dynamic blocks with the same label (like two "rule" blocks) produces a build/plan-time error, the same way a genuine syntax mistake would.',
      reality: 'Per this subtopic\'s theory, this produces NO error at all — the inner block\'s default iterator silently shadows the outer one, producing wrong values inside the innermost content block with nothing flagging the problem.'
    },
    {
      thought: 'A dynamic block\'s iteration variable is always accessible by the resource\'s own attribute name, regardless of nesting.',
      reality: 'Per this subtopic\'s theory, the default iteration variable name is the dynamic block\'s own LABEL, not a fixed name — and nested dynamic blocks sharing (or coincidentally landing on) the same default name creates a real shadowing collision.'
    },
    {
      thought: 'The iterator argument on a dynamic block is an optional stylistic choice with no functional difference from leaving it at its default.',
      reality: 'Per this subtopic\'s theory, iterator is the specific mechanism that prevents shadowing collisions in nested dynamic blocks — without it, two nested blocks sharing a default name have no way to both remain accessible inside the innermost content block.'
    }
  ];
}
