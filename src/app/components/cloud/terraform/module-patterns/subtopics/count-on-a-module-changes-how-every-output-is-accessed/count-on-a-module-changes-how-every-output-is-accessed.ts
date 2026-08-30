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
  templateUrl: './count-on-a-module-changes-how-every-output-is-accessed.html',
  styleUrl: './count-on-a-module-changes-how-every-output-is-accessed.scss'
})
export class CountOnAModuleChangesHowEveryOutputIsAccessedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends count for feature flags without mentioning what it does to the module\'s outputs',
      points: [
        'The main page\'s Feature Flags theory says: "Use <code>count = var.enable_monitoring ? 1 : 0</code> on optional resources." Sound advice — but the same pattern is extremely commonly applied to an entire MODULE block, and the moment it is, every one of that module\'s outputs changes shape for every caller referencing them. The page never mentions this.',
      ]
    },
    {
      heading: 'A module with count becomes a LIST of module instances — outputs are indexed, not direct',
      points: [
        'Without <code>count</code>, a module block produces exactly one instance, and its outputs are referenced directly: <code>module.monitoring.dashboard_url</code>.',
        'Adding <code>count</code> — even <code>count = 1</code>, and even when the intent is "zero or one" — turns the module into an indexed collection. The same output must now be referenced as <code>module.monitoring[0].dashboard_url</code>. Every existing reference elsewhere in the configuration breaks with a type error until it is updated.',
        'With <code>for_each</code> instead, the collection is keyed by string rather than index: <code>module.monitoring["prod"].dashboard_url</code> — the same structural change, just map-shaped rather than list-shaped, matching the same count-vs-for_each distinction the main Resources topic already draws.',
      ]
    },
    {
      heading: 'The zero-instance case is the one that actually hurts',
      points: [
        'For a genuine feature flag, the disabled case sets <code>count = 0</code>, which means the module has NO instances at all — so <code>module.monitoring[0].dashboard_url</code> is an out-of-range index, not merely a null value. Any downstream reference fails outright whenever the flag is off, which is precisely the configuration the flag exists to support.',
        'The usual handling is to avoid a bare indexed reference in anything that must work in both states: wrap it (<code>try(module.monitoring[0].dashboard_url, null)</code>), or gate the consumer on the same flag so nothing references the module when it is disabled. Using <code>one(module.monitoring[*].dashboard_url)</code> is the more idiomatic form — it collapses a zero-or-one collection to a single value or <code>null</code> without the index-out-of-range problem.',
        'This is a strong argument for the main page\'s own "default closed" advice cutting the other way too: a flag that is off by default means the zero-instance path is the DEFAULT path, so it has to be the one that genuinely works — not an afterthought discovered when someone first disables the feature.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The shape change count introduces',
      language: 'bash',
      code: `# No count -- one instance, direct output access:
module "monitoring" {
  source = "./modules/monitoring"
}

output "dashboard" {
  value = module.monitoring.dashboard_url   # direct
}

# --- Adding count for a feature flag ---
module "monitoring" {
  source = "./modules/monitoring"
  count  = var.enable_monitoring ? 1 : 0
}

output "dashboard" {
  value = module.monitoring.dashboard_url   # NOW BROKEN
}
# Error: Unsupported attribute
#   Because module.monitoring has "count" set, its attributes
#   must be accessed on specific instances.

# Every existing reference must become indexed:
output "dashboard" {
  value = module.monitoring[0].dashboard_url
}
# ...which then breaks in the other direction when the flag
# is off and there is no instance 0 at all.`,
    },
    {
      label: 'Handling the zero-instance case properly',
      language: 'bash',
      code: `module "monitoring" {
  source = "./modules/monitoring"
  count  = var.enable_monitoring ? 1 : 0
}

# one() collapses a zero-or-one collection to a single value
# or null -- the idiomatic form, no index-out-of-range risk:
output "dashboard" {
  value = one(module.monitoring[*].dashboard_url)
}
# enable_monitoring = true  -> the URL
# enable_monitoring = false -> null (not an error)

# try() also works, though it is broader than needed here:
output "dashboard_alt" {
  value = try(module.monitoring[0].dashboard_url, null)
}

# Or gate the consumer on the SAME flag, so nothing references
# the module when it is disabled:
resource "aws_cloudwatch_dashboard" "link" {
  count          = var.enable_monitoring ? 1 : 0
  dashboard_name = "link"
  dashboard_body = jsonencode({
    url = module.monitoring[0].dashboard_url
  })
}

# --- for_each instead: map-shaped, same structural change ---
module "monitoring" {
  source   = "./modules/monitoring"
  for_each = var.monitored_envs        # e.g. toset(["prod"])
}
output "prod_dashboard" {
  value = module.monitoring["prod"].dashboard_url
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A module is made optional with `count = var.enable_monitoring ? 1 : 0`, following the main page\'s feature-flag advice. All existing references are dutifully updated from `module.monitoring.dashboard_url` to `module.monitoring[0].dashboard_url` and everything passes with the flag on. The first time someone sets `enable_monitoring = false`, the plan fails. What specifically fails, why is this the DEFAULT path under the main page\'s own "default closed" guidance, and what is the idiomatic fix?',
    hint: 'With count = 0 the module has no instances at all. What does index [0] mean against an empty collection — a null, or something else?',
    solution: 'With `count = 0` the module has zero instances, so `module.monitoring[0]` is an out-of-range index rather than a null value — the reference fails outright, taking the whole plan with it. This is the default path precisely because the main page advises "default closed": if the flag is off by default, the zero-instance case is what most callers hit first, so it has to genuinely work rather than being discovered later. The idiomatic fix is `one(module.monitoring[*].dashboard_url)`, which collapses a zero-or-one collection to either the single value or `null` with no index-out-of-range risk. `try(module.monitoring[0].dashboard_url, null)` also works but is broader than needed, and gating the consumer on the same flag (so nothing references the module while disabled) is the alternative when the downstream resource is itself optional.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding count to a module block is a localized change affecting only that block, since the module itself and its outputs are unchanged.',
      reality: 'Per this subtopic\'s theory, count turns the module into an indexed collection — every output reference across the entire configuration must change from module.name.output to module.name[0].output, breaking with a type error until updated.'
    },
    {
      thought: 'When count = 0 disables a module, referencing module.name[0].output simply yields null, so downstream references degrade gracefully.',
      reality: 'Per this subtopic\'s theory, count = 0 means zero instances exist, so index [0] is out of range rather than null — the reference fails outright, breaking the plan in exactly the disabled state the flag was added to support.'
    },
    {
      thought: 'Using count = 1 rather than a conditional avoids the output-shape problem, since there is always exactly one instance.',
      reality: 'Per this subtopic\'s theory, the shape change comes from the presence of count at all, not from its value — even count = 1 makes the module an indexed collection requiring module.name[0].output everywhere.'
    }
  ];
}
