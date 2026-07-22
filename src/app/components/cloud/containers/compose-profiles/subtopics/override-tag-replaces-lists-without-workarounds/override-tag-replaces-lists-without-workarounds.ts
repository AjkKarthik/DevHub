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
  templateUrl: './override-tag-replaces-lists-without-workarounds.html',
  styleUrl: './override-tag-replaces-lists-without-workarounds.scss'
})
export class OverrideTagReplacesListsWithoutWorkaroundsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake-entry fix is a workaround, not the actual mechanism Compose provides',
      points: [
        'The main page\'s own "Expecting lists to be replaced instead of merged" mistake entry correctly diagnoses the problem — merging `ports: ["3001:3000"]` into a base `ports: ["3000:3000"]` produces BOTH bindings, not a replacement — but its own suggested fix is vague and indirect: "remove the base entry or use a fresh service name."',
        'Neither of those options is a real, targeted fix for the common case: you want a SPECIFIC field replaced in the override, while every OTHER field on that same service still merges normally. "Remove the base entry" means editing the base file to accommodate the override, which defeats the purpose of having a stable, environment-independent base file at all.',
        'Compose has a purpose-built mechanism for exactly this — a dedicated YAML tag, `!override`, that replaces a single field\'s value outright during merge, without touching anything else about how that service merges, and without requiring any change to the base file. The main page never mentions it anywhere.',
      ]
    },
    {
      heading: 'What !override (and its companion !reset) actually do, precisely',
      points: [
        'Per Compose\'s own documented merge specification, prefixing a field\'s value with `!override` in the OVERRIDING file tells Compose to replace that field\'s value entirely, bypassing the normal merge rule for that field\'s type (list concatenation, or map key-merging) — every other field on the same service still merges normally.',
        'A companion tag, `!reset`, clears a field back to empty/default rather than replacing it with a new value — useful for an override that needs to REMOVE something the base file set (e.g. clearing a base `env_file:` list entirely) rather than adding to or replacing it.',
        'Applied to the main page\'s own worked example: `ports: !override ["3001:3000"]` in `docker-compose.override.yml` would produce EXACTLY the single-binding outcome the mistake entry\'s wrong example incorrectly expected from a plain override — no base-file editing, no fresh service name, just the one tag on the one field that needs replacing instead of merging.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own scenario, fixed with !override instead of a workaround',
      language: 'bash',
      code: `# compose.yml (base)
services:
  api:
    ports: ["3000:3000"]

# docker-compose.override.yml -- WITHOUT !override (the main page's
# own documented "wrong" behavior):
services:
  api:
    ports: ["3001:3000"]
# Result: BOTH bindings active -- 3000:3000 AND 3001:3000.
# This is genuinely surprising if you expected a replacement.

# docker-compose.override.yml -- WITH !override:
services:
  api:
    ports: !override
      - "3001:3000"
# Result: ONLY 3001:3000 is bound. The list is REPLACED, not merged,
# for this one field -- every other field on "api" (image, restart,
# environment, etc.) still merges normally with the base file.

docker compose config
# Confirm the resolved output directly -- with !override present,
# "ports" shows only the override's own single entry, not both.`,
    },
    {
      label: 'The companion !reset tag -- clearing a field instead of replacing it',
      language: 'bash',
      code: `# compose.yml (base) -- ships with a shared env file
services:
  api:
    env_file: [.env.shared, .env.secrets]

# compose.ci.yml -- CI doesn't want ANY of the base env files,
# preferring explicit environment: values injected by the pipeline:
services:
  api:
    env_file: !reset []
    environment:
      NODE_ENV: test
      DATABASE_URL: postgres://ci:ci@localhost/test

# !reset clears env_file back to empty (the [] here is just for
# readability -- per Compose's own docs, the actual value passed to
# !reset is ignored, and the field is always cleared to its type's
# default). Without !reset, env_file would instead MERGE (both the
# base's two files AND anything CI added), which is the opposite of
# what a clean CI environment needs.

docker compose -f compose.yml -f compose.ci.yml config
# Confirm: env_file is empty in the resolved output, not a merged
# three-file list.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own mistake-entry advice literally and restructures their base compose.yml to omit ports: entirely from the base api service, adding ports: only in whichever override file is active for a given environment — specifically to avoid the "both bindings get merged" surprise. Using this subtopic\'s theory, what does this restructuring cost them that using !override on the SAME field, in the SAME override file, would not have?',
    hint: 'Per this subtopic\'s theory, does using !override require any change to the base compose.yml file at all — and does omitting ports: from the base file change what running compose.yml ALONE (with no override) does?',
    solution: 'Per this subtopic\'s theory, the restructuring the team adopted has a real, avoidable cost: by removing ports: from the base file, running `compose.yml` alone (with no override active — a legitimate mode of use, e.g. as a library service referenced by another project) now publishes no port at all, when the team may have wanted a sensible default there. They\'ve coupled the base file\'s own correctness to always having an override applied, purely to work around the merge behavior for one field. Using `!override` instead would have avoided this entirely: the base compose.yml keeps its own sensible default `ports: ["3000:3000"]`, unchanged and independently correct, while the override file — using `ports: !override ["3001:3000"]` — cleanly replaces that one field for its specific environment, with zero changes needed to the base file and zero effect on any OTHER field\'s normal merge behavior. The main page\'s own suggested workarounds ("remove the base entry or use a fresh service name") both require restructuring around the problem; !override solves it directly, at the exact point where the replacement is actually needed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The only ways to prevent a list field like ports: from being merged (concatenated) across compose files are to remove it from the base file or use a separate service name, per the main page\'s own mistake-entry advice.',
      reality: 'Per this subtopic\'s theory, Compose has a dedicated, documented YAML tag, !override, specifically built to replace a single field\'s value during merge instead of following its normal merge rule — no base-file restructuring or service duplication needed.'
    },
    {
      thought: 'Removing a field entirely (like env_file:) in an override file, by setting it to an empty list, achieves the same "clear this out" effect that !reset provides.',
      reality: 'Per this subtopic\'s theory, without !reset, a plain empty list value for a field like env_file: in an override does not clear the base file\'s own value — the two are merged per the field\'s normal merge rule, meaning the base file\'s entries survive unless !reset is used to explicitly clear the field.'
    },
    {
      thought: 'Using !override or !reset on one field in a service changes how the REST of that service\'s fields merge across compose files.',
      reality: 'Per this subtopic\'s theory, !override and !reset are scoped to the single field they\'re applied to — every other field on the same service continues to follow Compose\'s normal, per-type merge behavior (list concatenation or map key-merging) exactly as it would without either tag present anywhere in the file.'
    }
  ];
}
