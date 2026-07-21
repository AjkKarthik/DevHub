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
  templateUrl: './web-depends-on-api-lacks-condition-because-api-has-no-healthcheck.html',
  styleUrl: './web-depends-on-api-lacks-condition-because-api-has-no-healthcheck.scss'
})
export class WebDependsOnApiLacksConditionBecauseApiHasNoHealthcheckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own flagship example appears to violate its own mistake entry',
      points: [
        'The main page\'s own "Using depends_on without a healthcheck condition" mistake entry is unambiguous: `depends_on: [db]` (simple array form) is flagged as WRONG, and `depends_on: db: condition: service_healthy` is the recommended fix — paired with a healthcheck on the dependency.',
        'The main page\'s own "Full stack compose.yml" code tab has THREE services with depends_on relationships. `api` correctly uses the object form with `condition: service_healthy` against `db`. But `web`\'s own `depends_on: [api]` uses the exact simple array form the mistake entry warns against — in the SAME code tab, one service below.',
        'Nothing on the page explains this apparent inconsistency. A reader who just read the mistake entry could reasonably flag `web`\'s own dependency as a bug the page\'s own example forgot to fix.',
      ]
    },
    {
      heading: 'Why web genuinely cannot use condition: service_healthy against api — api never defines a healthcheck',
      points: [
        'Per Compose\'s own documented requirement, `condition: service_healthy` is only valid when the TARGET service (the one being depended on) defines its own `healthcheck:` block — Compose needs an actual health check to evaluate before it can consider that dependency "healthy."',
        'Looking at the main page\'s own `api` service definition in the SAME code tab: it has `build`, `ports`, `environment`, `depends_on`, `restart`, and `networks` — but no `healthcheck:` block at all. Only `db` (and, in the separate Redis example, `redis`) define one.',
        'This means `web`\'s `depends_on: [api]` is not a missed application of the mistake entry\'s advice — it is the ONLY valid option available, given that `api` never defines a healthcheck for Compose to check against. Adding `condition: service_healthy` to `web`\'s dependency on `api`, without first adding a `healthcheck:` block to `api` itself, would be invalid configuration, not a stricter, safer alternative.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why web\'s depends_on looks inconsistent with api\'s own dependency, side by side',
      language: 'bash',
      code: `# The main page's own "Full stack compose.yml" -- both dependency
# relationships, and what each target service actually defines:

services:
  db:
    image: postgres:16-alpine
    healthcheck:                          # <- db DEFINES a healthcheck
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./api
    # ... no healthcheck: block anywhere in this service ...
    depends_on:
      db:
        condition: service_healthy        # <- valid: db HAS a healthcheck

  web:
    build: ./web
    depends_on: [api]                     # <- api has NO healthcheck,
                                           #    so this is the only
                                           #    valid form available

# Attempting the "stricter" version instead, without first adding a
# healthcheck to api:
#   web:
#     depends_on:
#       api:
#         condition: service_healthy      # ERROR: api has no
#                                          # healthcheck defined --
#                                          # Compose rejects this`,
    },
    {
      label: 'What it would actually take to give web a real readiness guarantee',
      language: 'bash',
      code: `# To make web's dependency on api behave like api's own dependency
# on db, api needs its OWN healthcheck: block added first --
# something that verifies api is actually accepting requests, not
# just that its process has started:

services:
  api:
    build: ./api
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    # ... rest unchanged ...

  web:
    build: ./web
    depends_on:
      api:
        condition: service_healthy        # NOW valid, and meaningful

# Without this addition, web starting right after api's PROCESS has
# started (but possibly before api has finished its own startup
# work, like connecting to db) is a real, if usually brief, race --
# the same category of risk the main page's own mistake entry warns
# about for depends_on: [db], just one level further down the chain.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, having just read the main page\'s own "Using depends_on without a healthcheck condition" mistake entry, submits a PR changing web\'s `depends_on: [api]` to `depends_on: api: condition: service_healthy`, without touching api\'s own service definition at all. Using this subtopic\'s theory, what happens when this compose.yml is run?',
    hint: 'Per this subtopic\'s theory, what does Compose require to exist on the TARGET service before condition: service_healthy is a valid configuration at all?',
    solution: 'Per this subtopic\'s theory, this change would fail outright rather than making the setup safer — Compose requires the target service (api, in this case) to define its own `healthcheck:` block before `condition: service_healthy` is valid configuration for anything depending on it. Since the PR only changes web\'s own depends_on syntax and never adds a healthcheck: block to api itself, `docker compose up` (or `docker compose config`) would reject the configuration as invalid, rather than silently working or silently being ignored. The correct fix, per this subtopic\'s theory, requires two changes together, not one: adding a genuine healthcheck: block to api (verifying it actually accepts requests, not just that its process exists) AND then updating web\'s depends_on to use condition: service_healthy against it — changing only the depends_on syntax without first giving api something to report health for skips the actual work the mistake entry\'s advice depends on.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own compose.yml example has an inconsistency — web should use condition: service_healthy against api, matching the pattern api itself uses against db, and simply forgot to.',
      reality: 'Per this subtopic\'s theory, this is not an inconsistency — api never defines its own healthcheck: block, and condition: service_healthy is only valid Compose configuration when the target service actually has one. web\'s simple-array depends_on is the only option available given api\'s current definition.'
    },
    {
      thought: 'condition: service_healthy is a general-purpose "wait longer before starting" setting that can be added to any depends_on relationship for extra safety, regardless of what the target service defines.',
      reality: 'Per this subtopic\'s exercise, condition: service_healthy specifically requires the target service to define its own healthcheck: — attempting to use it against a service with no healthcheck is invalid configuration that Compose rejects, not a safer variant of a plain dependency.'
    },
    {
      thought: 'The main page\'s own mistake entry ("Using depends_on without a healthcheck condition") means every depends_on relationship in a well-written compose.yml should use condition: service_healthy.',
      reality: 'Per this subtopic\'s theory, that advice applies specifically to dependencies on services that DO define a healthcheck (like db) — a service with no healthcheck of its own, like api in the main page\'s own example, cannot be depended on that way until a healthcheck is added to it first.'
    }
  ];
}
