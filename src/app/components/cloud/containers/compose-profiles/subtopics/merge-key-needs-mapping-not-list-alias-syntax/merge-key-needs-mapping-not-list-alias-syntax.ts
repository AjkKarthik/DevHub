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
  templateUrl: './merge-key-needs-mapping-not-list-alias-syntax.html',
  styleUrl: './merge-key-needs-mapping-not-list-alias-syntax.scss'
})
export class MergeKeyNeedsMappingNotListAliasSyntaxSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes one YAML syntax in prose, then uses a different one in its own working code',
      points: [
        'The main page\'s own "YAML Anchors for DRY Config" theory says: "Example: x-env: &common-env with shared env vars, then environment: [*common-env] on each service." Read literally, this describes `environment:` as a LIST containing a single aliased item, using square brackets.',
        'The main page\'s own "YAML anchors" code tab does something different: `x-env: &common-env` defines a MAPPING (`DATABASE_URL: ...`, `REDIS_URL: ...`, `LOG_LEVEL: info` — key-value pairs, not list items), and each service applies it with `environment: <<: *common-env` — the YAML merge key (`<<:`), not a bracketed list containing an alias.',
        'These are not interchangeable syntaxes for the same outcome. Which one is even valid depends entirely on what TYPE of YAML node the anchor (`&common-env`) was attached to in the first place — and `x-env` in the main page\'s own code tab is unambiguously a mapping, not a sequence.',
      ]
    },
    {
      heading: 'Why environment: [*common-env] would not do what the theory bullet\'s prose implies, given how x-env is actually defined',
      points: [
        'YAML\'s merge key (`<<:`) is specifically defined for MAPPING merges — it takes a mapping (or a list of mappings) and merges its keys into the surrounding mapping. This is exactly what the main page\'s own working code tab uses: `environment: { <<: *common-env, SERVICE_NAME: api }` (written across multiple lines), producing one flat mapping with DATABASE_URL, REDIS_URL, LOG_LEVEL, and SERVICE_NAME all as sibling keys.',
        'Writing `environment: [*common-env]` instead — literal square brackets, as the theory bullet\'s prose describes — would make `environment` a YAML SEQUENCE containing exactly one element: the resolved `common-env` mapping, nested as a single list item. That is a structurally different result: not four flat environment variables, but a one-item list whose single element happens to be an object — not valid Compose `environment:` syntax at all, since Compose expects either a flat mapping or a flat list of `KEY=value` strings, never a list containing a nested object.',
        'The main page\'s own code tab has the syntax exactly right; only the theory bullet\'s prose description uses bracket notation that does not match how `x-env` was actually defined as a mapping anchor. For a mapping-type anchor, the merge key (`<<:`) is the correct and only way to splat its keys into a surrounding mapping — bracket-list alias syntax is a different YAML pattern, applicable only when the anchor itself was attached to a LIST, not a mapping.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What each syntax actually produces, given x-env is a mapping',
      language: 'bash',
      code: `# The main page's own x-env anchor -- unambiguously a MAPPING
# (key: value pairs, not list items):
x-env: &common-env
  DATABASE_URL: \${DATABASE_URL}
  REDIS_URL: redis://redis:6379
  LOG_LEVEL: info

# ── The main page's own CODE TAB syntax (correct, working) ────────────────
services:
  api:
    environment:
      <<: *common-env          # merge key -- splats the mapping's keys
      SERVICE_NAME: api        # additional key, sibling to the merged ones

# Resolves to:
#   environment:
#     DATABASE_URL: ...
#     REDIS_URL: redis://redis:6379
#     LOG_LEVEL: info
#     SERVICE_NAME: api
# Four flat keys. Exactly what Compose's environment: mapping form expects.

# ── The main page's own THEORY BULLET's described syntax ──────────────────
services:
  api:
    environment: [*common-env]   # literal bracket-list containing an alias

# This does NOT resolve to four flat keys. It resolves to a ONE-ITEM
# LIST whose single element is the *common-env mapping object itself
# -- not a valid Compose environment: value (Compose expects either
# a flat mapping, or a flat list of "KEY=value" strings -- never a
# list containing a nested object).`,
    },
    {
      label: 'When bracket-alias syntax IS correct -- a genuinely different anchor type',
      language: 'bash',
      code: `# The bracket-alias pattern the theory bullet describes IS valid
# YAML -- just for a LIST-type anchor, not a mapping-type one like
# x-env. Example, if the shared config were itself defined as a
# LIST of "KEY=value" strings instead of a mapping:

x-env-list: &common-env-list
  - DATABASE_URL=\${DATABASE_URL}
  - REDIS_URL=redis://redis:6379
  - LOG_LEVEL=info

services:
  api:
    environment:
      - *common-env-list       # NOTE: this splices the LIST's items
      #   in directly (YAML flattens a nested sequence alias here)
      - SERVICE_NAME=api

# This produces the flat list Compose expects, because the anchor
# itself was attached to a sequence, matching the bracket/list
# syntax being used to reference it. The rule: match the alias
# syntax to whatever YAML NODE TYPE the anchor was actually defined
# as -- mapping anchors need the merge key (<<:), list anchors can
# be spliced directly into another list.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, reading only the main page\'s own theory bullet (not its code tab), writes a NEW service using `environment: [*common-env]` against the SAME x-env mapping anchor shown in the code tab. Using this subtopic\'s theory, what happens when they run docker compose config against this new service, and why does the discrepancy trace back to a single word in the theory bullet\'s own description?',
    hint: 'Per this subtopic\'s theory, does the bracket-list alias syntax (`[*anchor]`) work correctly when the anchor it references was defined as a YAML mapping, like x-env is?',
    solution: 'Per this subtopic\'s theory, `docker compose config` would either reject this service\'s environment: value outright or resolve it to something unusable — a one-item list containing the entire common-env object as a single nested element, not the four flat environment variables the developer expected. This does not match Compose\'s own accepted shapes for environment: (a flat mapping, or a flat list of "KEY=value" strings), so the service either fails validation or silently ends up with an environment Compose cannot interpret sensibly. The root cause traces directly back to the theory bullet\'s own prose: describing the pattern as `environment: [*common-env]` implies bracket-list syntax works generically for any anchor, when in fact which syntax is valid depends entirely on whether the anchor was defined as a YAML mapping (needs the merge key, `<<:`) or a YAML sequence (can be spliced into a list with plain `- *anchor`). x-env, as the SAME page\'s own code tab defines it, is unambiguously a mapping — so the merge-key syntax the code tab actually uses is the only one that produces the intended flat environment variables.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'environment: [*common-env] and environment: <<: *common-env are two equivalent ways of writing the same YAML anchor merge, and either can be used interchangeably regardless of how the anchor itself was defined.',
      reality: 'Per this subtopic\'s theory, which syntax is valid depends entirely on whether the anchor (&common-env) was attached to a YAML mapping or a YAML sequence — for x-env, defined as a mapping in the main page\'s own code tab, only the merge key (<<:) correctly splats its keys; bracket-list syntax would nest the whole mapping as one list element instead.'
    },
    {
      thought: 'Since the main page\'s own theory bullet describes environment: [*common-env] as "the example," this must be valid, working syntax for the exact x-env anchor shown in the same page\'s code tab.',
      reality: 'Per this subtopic\'s theory, the theory bullet\'s prose uses bracket-list syntax while the code tab\'s actual, correct working example uses the merge key — these are two different YAML patterns, and only the merge-key version is valid for a mapping-type anchor like x-env.'
    },
    {
      thought: 'Bracket-list alias syntax (like [*common-env]) is simply invalid YAML and would never work for referencing an anchor in a Compose file.',
      reality: 'Per this subtopic\'s theory, this syntax is valid and correct — but only when the anchor itself was defined as a LIST (a sequence of "KEY=value" strings, for example), where a plain list-item alias correctly splices the anchored sequence\'s items in. The syntax itself isn\'t wrong in general — it\'s wrong specifically for a mapping-type anchor like x-env.'
    }
  ];
}
