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
  templateUrl: './map-form-environment-merges-by-key-not-concatenation.html',
  styleUrl: './map-form-environment-merges-by-key-not-concatenation.scss'
})
export class MapFormEnvironmentMergesByKeyNotConcatenationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory groups three fields together, but its own examples don\'t all follow the same rule',
      points: [
        'The main page\'s own theory says plainly: "When merging, lists (ports, volumes, environment) are concatenated; scalar values are overwritten." Grouping `ports`, `volumes`, and `environment` together implies all three merge the same way — by appending entries from one file after the other\'s.',
        'The main page\'s own "Override files" code tab writes `environment:` as a YAML MAPPING in both the base file (`NODE_ENV: production`) and the override (`NODE_ENV: development`, `DEBUG: "api:*"`) — key-value pairs, not a list of `KEY=value` strings. `ports`, by contrast, genuinely is written as a list in both files (`["3000:3000"]`).',
        'A mapping and a list are different YAML node types, and per Compose\'s own documented merge specification, they merge by different rules — grouping them as "lists... are concatenated" is only accurate for the list-form fields, not for environment when it is written as a mapping, which is how both of the main page\'s own code tab examples actually write it.',
      ]
    },
    {
      heading: 'What map-form environment actually does on merge: key-by-key, not append',
      points: [
        'Per Compose\'s own documented merge behavior, a YAML mapping is merged by "adding missing entries and merging the conflicting ones" — meaning each KEY is resolved independently: a key present in both files has the override\'s value WIN (not both values coexisting), while a key present in only one file is simply added.',
        'Applying this precisely to the main page\'s own worked example: `NODE_ENV` exists in both the base (`production`) and the override (`development`) — the override\'s value wins, leaving exactly one NODE_ENV in the resolved config, not two conflicting NODE_ENV entries sitting side by side the way "concatenation" would imply. `DEBUG`, present only in the override, is simply added as a new key.',
        'This is a genuinely different outcome from what happened with `ports` in the SAME code tab family — the main page\'s own separate mistake entry demonstrates `ports` correctly ending up with BOTH the base\'s and the override\'s entries present together (`3000:3000` AND `3001:3000`), because `ports` really is a list there. `environment`, written as a mapping, would never produce that kind of "both values present" outcome for a repeated key — only a genuine list-form environment (`- NODE_ENV=production`) would.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing the main page\'s own environment merge, key by key',
      language: 'bash',
      code: `# The main page's own compose.yml (base):
services:
  api:
    environment:
      NODE_ENV: production

# The main page's own docker-compose.override.yml:
services:
  api:
    environment:
      NODE_ENV: development    # SAME key as the base
      DEBUG: "api:*"           # NEW key, not in the base

docker compose config
# Resolved environment for api:
#   NODE_ENV: development      <- override's value WON for this key
#                                  (not "production,development" or
#                                  two separate NODE_ENV entries --
#                                  a genuine key-by-key merge)
#   DEBUG: "api:*"             <- added, since only the override had it

# Compare directly to what happens with "ports" (a genuine LIST) in
# the SAME override relationship, per the main page's own mistake
# entry:
#   ports: ["3000:3000"]                (base)
#   ports: ["3001:3000"]                (override)
#   -> resolved: ["3000:3000", "3001:3000"]   BOTH present -- true
#      concatenation, the opposite outcome from environment's
#      key-by-key merge for a repeated key.`,
    },
    {
      label: 'The one case where environment DOES behave like ports: list form',
      language: 'bash',
      code: `# If environment were instead written in LIST form in both files
# (a legitimate, equally valid Compose syntax):

# compose.yml (base)
services:
  api:
    environment:
      - NODE_ENV=production

# docker-compose.override.yml
services:
  api:
    environment:
      - NODE_ENV=development

# Per Compose's own docs, a YAML SEQUENCE merges by "appending
# values from the overriding file to the previous one" -- but
# Compose's own environment-specific handling still resolves
# duplicate KEY=value entries sensibly (the override's value for a
# repeated key wins in the final resolved environment), rather than
# genuinely keeping two conflicting NODE_ENV values active at once.
# The main page's own theory bullet ("lists... are concatenated")
# describes the RAW YAML merge mechanics correctly for this list
# form -- it just doesn't distinguish this from the mapping form its
# own two code-tab examples both actually use.

docker compose config
# Still resolves to a single NODE_ENV=development -- Compose applies
# environment-specific de-duplication on top of the raw YAML
# sequence-append behavior, regardless of which of the two valid
# syntaxes (mapping or list) was used to write it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, following the main page\'s own theory bullet literally ("lists — ports, volumes, environment — are concatenated"), expects that overriding NODE_ENV from production to development in docker-compose.override.yml (both written as mappings, exactly like the main page\'s own code tab) would leave BOTH values active somehow, similar to how ports ends up with two bindings. They\'re confused when docker compose config shows only NODE_ENV=development. Using this subtopic\'s theory, explain why their expectation, based on the main page\'s own wording, didn\'t match what actually happened.',
    hint: 'Per this subtopic\'s theory, does the main page\'s own theory bullet distinguish between environment written as a YAML mapping versus environment written as a YAML list — and which form does the main page\'s own code tab actually use?',
    solution: 'Per this subtopic\'s theory, the developer\'s confusion traces directly to the main page\'s own theory bullet grouping ports, volumes, and environment together as if they all "concatenate" identically — but that description is only accurate for genuine LIST-form fields. The main page\'s own code tab writes environment as a MAPPING (NODE_ENV: production / NODE_ENV: development), and per Compose\'s own documented merge rules, mappings merge key-by-key: a key present in both files has the override\'s value win outright, not both values coexisting. This is exactly why docker compose config correctly shows a single NODE_ENV=development rather than some concatenated or dual-value result — the mapping merge behavior is doing precisely what it\'s supposed to. The developer\'s expectation, based on the theory bullet\'s wording, would only have matched reality if environment had been written in LIST form in both files (- NODE_ENV=production / - NODE_ENV=development) — even then, Compose applies its own key-based de-duplication on top of the raw list-append behavior, still resolving to a single value, just via a different underlying mechanism than the mapping form uses.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own theory bullet — "lists (ports, volumes, environment) are concatenated" — means environment always merges the same way ports does, regardless of whether it\'s written as a YAML list or a YAML mapping.',
      reality: 'Per this subtopic\'s theory, ports and environment merge differently specifically because of the YAML node type each one is written as in the main page\'s own examples — ports is a genuine list (append/concatenate), while environment is written as a mapping in both of the page\'s own code tabs (key-by-key merge, override wins on repeated keys).'
    },
    {
      thought: 'Overriding a repeated environment key (like NODE_ENV) across compose files results in both values being present somehow, the same way overriding a repeated ports entry results in both bindings being active.',
      reality: 'Per this subtopic\'s exercise, a repeated key in map-form environment resolves to a single value — the override\'s — per Compose\'s own key-by-key mapping merge rule; this is a fundamentally different outcome from list-form fields like ports, where truly duplicate list entries (different values, same conceptual field) really do both end up present.'
    },
    {
      thought: 'Since environment can be written as either a mapping or a list in Compose, the choice between the two forms has no bearing on how a value gets resolved when merging multiple compose files.',
      reality: 'Per this subtopic\'s theory, the two forms use genuinely different underlying YAML merge mechanics (mapping key-merge vs. sequence append) — Compose\'s own environment-specific de-duplication happens to make the final resolved result consistent either way for a repeated key, but the mechanism getting there, and the general merge rule that applies to the field, differs by which form was chosen.'
    }
  ];
}
