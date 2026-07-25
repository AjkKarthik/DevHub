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
  templateUrl: './optional-lets-object-variables-evolve-without-breaking-callers.html',
  styleUrl: './optional-lets-object-variables-evolve-without-breaking-callers.scss'
})
export class OptionalLetsObjectVariablesEvolveWithoutBreakingCallersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own object example has no optional attributes at all',
      points: [
        'The main page\'s <code>vpc_config</code> object variable declares <code>cidr_block</code> and <code>az_count</code> as two REQUIRED attributes, both supplied in the default. The QnA separately explains <code>optional()</code> in words ("marks attributes in object variables as optional with an optional default value") but no codeTab on the page ever shows one.',
      ]
    },
    {
      heading: 'Without optional(), every object attribute is required — adding one breaks every existing caller',
      points: [
        'By default, an object type constraint like <code>object({ cidr_block = string, az_count = number })</code> requires EVERY listed attribute from every caller. If a module author later adds a new attribute (say, <code>enable_flow_logs = bool</code>) to that same object type, every existing caller who omits it now fails to plan — a type error, not a warning — even if the new attribute has an obvious sensible default.',
      ]
    },
    {
      heading: 'optional(type, default) attributes let a module\'s interface grow without breaking existing callers',
      points: [
        'Wrapping an attribute in <code>optional(bool, false)</code> (Terraform 1.3+) marks it as optional with a specified default — callers who omit it get the default; callers who supply it get their own value. If no default is given (<code>optional(bool)</code>), the attribute defaults to <code>null</code> when omitted, rather than causing a type error.',
        'This makes <code>optional()</code> the standard tool for evolving a module\'s public object-shaped variable over time: adding a new optional attribute with a sensible default is a non-breaking, backward-compatible change for every existing caller — adding a required (non-optional) attribute is always a breaking change.',
        '<code>optional()</code> attributes can themselves default to a nested object with its own optional sub-attributes and defaults — letting deeply nested configuration shapes evolve the same way, though early Terraform 1.3.x releases had some reported edge-case bugs around nested optional defaults, since fixed in later releases.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without optional(): adding a field breaks every caller',
      language: 'bash',
      code: `# Original module interface -- matches the main page's own example
variable "vpc_config" {
  type = object({
    cidr_block = string
    az_count   = number
  })
}

# A module author later adds a new attribute for a new feature:
variable "vpc_config" {
  type = object({
    cidr_block        = string
    az_count           = number
    enable_flow_logs  = bool   # NEW, no default mechanism -- required
  })
}
# Every existing caller that doesn't set enable_flow_logs now
# fails with a type error -- even though "false" would have been
# a perfectly reasonable default for anyone not opting in.`,
    },
    {
      label: 'With optional(): the same addition is backward-compatible',
      language: 'bash',
      code: `variable "vpc_config" {
  type = object({
    cidr_block        = string
    az_count           = number
    enable_flow_logs  = optional(bool, false)   # NEW, non-breaking
  })
  default = {
    cidr_block = "10.0.0.0/16"
    az_count   = 2
    # enable_flow_logs omitted here too -- optional() supplies false
  }
}

# Existing callers who never mention enable_flow_logs keep working
# unchanged, silently getting false.
module "network_old" {
  source     = "./modules/network"
  vpc_config = { cidr_block = "10.1.0.0/16", az_count = 3 }
}

# A new caller can opt into the new behavior explicitly:
module "network_new" {
  source     = "./modules/network"
  vpc_config = {
    cidr_block         = "10.2.0.0/16"
    az_count            = 2
    enable_flow_logs   = true
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A published module\'s vpc_config object variable has two required attributes: cidr_block and az_count, matching the main page\'s own example exactly. The module author wants to add a new enable_flow_logs boolean attribute that defaults to false for anyone not explicitly opting in, WITHOUT forcing every existing caller of the module to update their configuration. What object-type-constraint syntax achieves this, and what happens to a caller who never mentions the new attribute at all?',
    hint: 'Compare a plain object attribute (always required) to one wrapped in optional() with a supplied default.',
    solution: 'The fix is wrapping the new attribute in optional() with a default: `enable_flow_logs = optional(bool, false)` inside the object type constraint. A caller who never mentions enable_flow_logs at all continues to work exactly as before — Terraform automatically supplies `false` for that attribute, since optional() with a default value applies whenever the caller omits it. This is what makes optional() the standard way to evolve a module\'s object-shaped interface over time: adding a new optional attribute with a default is backward-compatible, while adding a plain (non-optional) required attribute — as the main page\'s own vpc_config example currently has for both its fields — would be a breaking change for every existing caller.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every attribute inside an object() type constraint is automatically treated as optional unless a description says otherwise.',
      reality: 'Per this subtopic\'s theory, every attribute in an object type constraint is REQUIRED by default — the main page\'s own vpc_config example has two required attributes with no optional wrapper at all. optional() must be applied explicitly to change this.'
    },
    {
      thought: 'Adding a new attribute to an existing object-typed variable is always a safe, backward-compatible change as long as the module\'s own logic handles it correctly.',
      reality: 'Per this subtopic\'s theory, adding a new REQUIRED (non-optional) attribute breaks every existing caller who does not already supply it — only wrapping the new attribute in optional() with a default makes the addition backward-compatible.'
    },
    {
      thought: 'optional() without a supplied default value causes a type error for callers who omit that attribute, the same as a plain required attribute would.',
      reality: 'Per this subtopic\'s theory, optional(type) without a default simply resolves to null when a caller omits it — it does not error, unlike a plain (non-optional) attribute, which does produce a type error when omitted.'
    }
  ];
}
