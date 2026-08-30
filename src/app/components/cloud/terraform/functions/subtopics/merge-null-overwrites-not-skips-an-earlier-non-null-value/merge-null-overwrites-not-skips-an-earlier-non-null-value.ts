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
  templateUrl: './merge-null-overwrites-not-skips-an-earlier-non-null-value.html',
  styleUrl: './merge-null-overwrites-not-skips-an-earlier-non-null-value.scss'
})
export class MergeNullOverwritesNotSkipsAnEarlierNonNullValueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry covers key-priority order, never a null value specifically',
      points: [
        'The main page\'s "Using merge() incorrectly" mistake entry is entirely about ORDER — "b WINS on duplicate keys," making sure the higher-priority map is passed last. Every example on the page merges maps with genuine, non-null values. The page never shows what happens if one of the LATER map\'s values is null.',
      ]
    },
    {
      heading: 'A later map\'s null value replaces an earlier map\'s real value — it does not get skipped',
      points: [
        'The intuitive expectation, especially coming from languages where merging often treats null/undefined as "no opinion, leave the existing value alone," is that <code>merge({a=1,b=2}, {a=null,c=3})</code> would keep <code>a=1</code> from the first map, since the second map\'s <code>a</code> "doesn\'t really have a value."',
        'Terraform\'s actual behavior is different and has been the subject of a long-standing, well-documented HashiCorp GitHub issue: <code>merge()</code> treats a later map\'s <code>null</code> exactly like any other value for that key — the key is overwritten, and since the new value is <code>null</code>, the key effectively disappears from a straightforward reading of the result rather than retaining the earlier map\'s <code>1</code>.',
      ]
    },
    {
      heading: 'The practical risk: an optional variable defaulting to null silently wipes out a required default',
      points: [
        'This surfaces most often when merging a set of REQUIRED defaults with a map of OPTIONAL, user-supplied overrides where an unset key naturally resolves to <code>null</code> (a common shape for an <code>optional()</code> object attribute with no explicit default, or a variable left unset) — merging <code>merge(local.required_defaults, var.optional_overrides)</code> can silently null out a required default the moment the corresponding override key is present but unset, rather than leaving the default untouched as the "no override supplied" case usually implies.',
        'The standard mitigation is filtering out null-valued keys BEFORE merging (commonly with a <code>for</code> expression like <code>{for k, v in var.optional_overrides : k => v if v != null}</code>), or using the null-coalescing <code>??</code> operator on individual values rather than merging maps that might contain nulls directly.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The surprising result: null wins, not skips',
      language: 'bash',
      code: `# Following the main page's own "later map wins" rule exactly --
# but one of the LATER map's values happens to be null:
locals {
  result = merge(
    { a = 1, b = 2 },
    { a = null, c = 3 }
  )
}
# Intuition (wrong): a stays 1, since null "has no opinion"
# Actual Terraform result:
# {
#   b = 2
#   c = 3
# }
# "a" is GONE -- null from the later map didn't just fail to
# override, it overwrote "a" with null, which then doesn't
# appear as a real key-value pair in a straightforward read
# of the merged result.`,
    },
    {
      label: 'Where this actually bites: optional overrides nulling required defaults',
      language: 'bash',
      code: `locals {
  required_defaults = {
    Environment = "prod"
    ManagedBy   = "Terraform"
    CostCenter  = "platform-team"
  }
}

variable "tag_overrides" {
  type    = map(string)
  default = {}
}

locals {
  # If a caller passes { CostCenter = null } -- meaning "I have
  # no specific override" -- this SILENTLY WIPES the required
  # default instead of leaving it untouched:
  final_tags_risky = merge(local.required_defaults, var.tag_overrides)

  # Safer: filter out null-valued keys before merging, so an
  # "unset" override genuinely means "use the default":
  clean_overrides = {
    for k, v in var.tag_overrides : k => v if v != null
  }
  final_tags_safe = merge(local.required_defaults, local.clean_overrides)
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own "put the higher-priority map last" merge() rule, a module merges `merge(local.required_defaults, var.tag_overrides)` where required_defaults includes `CostCenter = "platform-team"`. A caller passes `var.tag_overrides = { CostCenter = null }`, intending to signal "no specific override, use whatever the default is." Instead, the resulting tags have no CostCenter key at all. Why did following the documented "later map wins" rule produce this result, and what change to the merge call would preserve the default when an override is explicitly null?',
    hint: 'The main page\'s rule is entirely about which value wins when both maps have a real value for a key. What does merge() do when the winning value specifically happens to be null?',
    solution: 'merge() treats a later map\'s null value exactly like any other real value for that key — it overwrites the earlier map\'s value, and since the new value is null, the key effectively disappears from a straightforward reading of the merged result, rather than being skipped so the earlier default survives. The caller\'s null was meant as "no opinion, use the default," but merge() has no such concept — null is a real overriding value like any other. The fix is filtering out null-valued keys from tag_overrides before merging: `merge(local.required_defaults, {for k, v in var.tag_overrides : k => v if v != null})`. With the null-valued CostCenter key removed before the merge, the required default survives untouched.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'merge() treats a null value in a later map as "no opinion" and leaves the earlier map\'s value for that key untouched, the same way many other languages\' merge/spread utilities handle undefined or null.',
      reality: 'Per this subtopic\'s theory, merge() treats null exactly like any other value — a later map\'s null OVERWRITES an earlier map\'s real value for that key, rather than being skipped.'
    },
    {
      thought: 'The main page\'s "b wins on duplicate keys" merge() rule is a complete description of the function\'s behavior for any value type, including null.',
      reality: 'Per this subtopic\'s theory, the rule is technically still true (a later value does win) but its PRACTICAL consequence is easy to misjudge specifically for null, since "winning" with a null value produces a missing key rather than a preserved earlier value — worth calling out separately from the general priority-order rule.'
    },
    {
      thought: 'An unset (null-valued) key in an optional overrides map is a safe, no-op way to signal "use the existing default" when merged with a defaults map.',
      reality: 'Per this subtopic\'s theory, merging a null-valued override key directly wipes out the corresponding default rather than preserving it — filtering null values out before merging (or using ?? on individual values) is the correct way to achieve the "no-op" behavior actually intended.'
    }
  ];
}
