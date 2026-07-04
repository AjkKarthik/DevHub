import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-generating-clients-live-server-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './generating-clients-against-live-server-undermines-diffing-prs.html',
  styleUrl: './generating-clients-against-live-server-undermines-diffing-prs.scss',
})
export class GeneratingClientsAgainstLiveServerUndermineDiffingPrsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own nswag.json points at a LIVE localhost server — and elsewhere recommends "check the generated client into source control and diff it in PRs" — these two pieces of guidance quietly undermine each other',
      points: [
        'The main OpenAPI &amp; Swagger page\'s "NSwag Client Gen" code tab configures <code>"fromDocument": { "url": "http://localhost:5000/openapi/v1.json" }</code> — generating the client by querying a RUNNING dev server. Separately, the page\'s own "How should I handle breaking changes in my API spec?" Q&amp;A recommends: "Generate the spec as a CI artifact and diff it against the published spec to catch unintentional breaking changes before deployment," and its own mistakes/best-practices imply checking the generated client into source control and reviewing its diff in PRs. The problem: if the SOURCE the client is generated FROM is a live, locally-running server rather than a FIXED, versioned artifact, the "diff it in PRs" workflow becomes unreliable — the generated client\'s content depends on whatever code HAPPENS to be running on that developer\'s machine at generation time.',
      ],
    },
    {
      heading: 'Two developers on DIFFERENT branches (or the same developer at different points mid-refactor) regenerating the client from their own local dev servers produce DIFFERENT client diffs — even for PRs that touch completely unrelated endpoints',
      points: [
        'If Developer A is mid-way through an UNRELATED feature branch that happens to have some in-progress, uncommitted endpoint changes running locally, and regenerates the NSwag client as part of preparing an UNRELATED PR, the generated client picks up BOTH the intended change AND whatever transient state Developer A\'s local server happened to be in — producing spurious, unrelated churn in the committed client diff that has nothing to do with the actual PR\'s purpose. A reviewer seeing an unexpectedly large client diff for a supposedly small PR has no easy way to distinguish "real API surface change" from "generated against a stale/uncommitted local server state."',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own nswag.json — generating against a live, potentially inconsistent local server',
      language: 'bash',
      code: `{
  "runtime": "Net90",
  "documentGenerator": {
    "fromDocument": {
      // PROBLEM: this points at a RUNNING server process — whatever
      // code happens to be deployed/running on localhost:5000 at the
      // EXACT MOMENT 'nswag run' executes is what gets captured. If
      // the developer's local branch has uncommitted changes, or is
      // simply on a different commit than the PR being prepared,
      // the generated client reflects THAT state — not necessarily
      // the state actually being reviewed in the PR:
      "url": "http://localhost:5000/openapi/v1.json"
    }
  },
  "codeGenerators": {
    "openApiToCSharpClient": {
      "namespace": "MyApp.Client",
      "className": "{controller}Client",
      "output": "ApiClient.g.cs",
      "generateClientInterfaces": true,
      "generateResponseClasses": true,
      "exceptionClass": "ApiException"
    }
  }
}

// Running 'nswag run' as an MSBuild target (<NSwagGenerate>, as the
// main page's own theory section recommends) means this regeneration
// happens on EVERY BUILD — silently baking in whatever transient local
// server state happens to exist at that exact moment, on that exact
// developer's machine.`,
    },
    {
      label: 'The fix — generate the spec from a FIXED, versioned artifact, never from a live running process',
      language: 'bash',
      code: `{
  "runtime": "Net90",
  "documentGenerator": {
    "fromDocument": {
      // FIXED: point at a STATIC FILE checked into source control (or
      // produced by a dedicated, reproducible CI step) instead of a
      // live URL. This file is committed alongside the code that
      // produced it — exactly like the main page's own recommendation
      // to "generate the spec as a CI artifact":
      "url": "./openapi/v1.json"
    }
  },
  "codeGenerators": {
    "openApiToCSharpClient": {
      "namespace": "MyApp.Client",
      "className": "{controller}Client",
      "output": "ApiClient.g.cs",
      "generateClientInterfaces": true,
      "generateResponseClasses": true,
      "exceptionClass": "ApiException"
    }
  }
}

// THE CORRECTED WORKFLOW, three explicit, REPRODUCIBLE steps instead
// of one implicit, environment-dependent one:
//
//   1. A dedicated CI/build step runs the app briefly (or uses a
//      startup-time spec-export mechanism) to produce './openapi/v1.json'
//      from the EXACT COMMIT being built — no developer's local,
//      possibly-uncommitted state is ever involved.
//   2. That JSON file is committed to source control (or published as
//      a build artifact that the client-generation step consumes).
//   3. NSwag/Kiota generates the client FROM THAT FILE — meaning the
//      SAME commit always produces the SAME generated client,
//      regardless of which developer's machine runs the generation
//      step, or what else happens to be running on their localhost at
//      the time.
//
// NOW the "check the generated client into source control and diff it
// in PRs" recommendation from the main page's own Q&A actually holds:
// a PR's client diff reflects ONLY the actual API surface changes made
// in that PR's commits — nothing else.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Propose a concrete CI step (conceptually, not necessarily a full working script) that would produce the fixed, versioned "./openapi/v1.json" file described in this subtopic\'s fix, from a specific commit, without requiring a full running web server listening on a port.',
    hint: 'Consider that .NET\'s OpenAPI document generation (AddOpenApi()) can, in modern versions, produce the document directly during the build process without needing an actual HTTP server to be running and reachable — check whether a dedicated MSBuild target or CLI step exists for exactly this purpose.',
    solution: `Modern .NET tooling actually provides exactly this: a build-time
document generation step that does NOT require a running, listening
web server at all. Conceptually, the CI step looks like:

# In the CI pipeline, AFTER building the project for a specific commit:
dotnet build MyApi.csproj
# Microsoft.Extensions.ApiDescription.Server (or the equivalent modern
# tooling for AddOpenApi()) can generate the OpenAPI document as a
# BUILD OUTPUT artifact, written to disk, without needing the app to
# actually bind to a port and accept HTTP connections — this works by
# constructing the DI container and endpoint metadata in-process during
# the build, exactly the same reflection-based process that would
# normally run when a real request hits /openapi/v1.json, but
# triggered as a build step instead of a runtime HTTP request.

# The resulting file is then:
cp bin/Debug/net9.0/MyApi.json ./openapi/v1.json
git add ./openapi/v1.json   # (in a dedicated "update spec" commit/PR,
                              # reviewed like any other generated artifact)

# THEN, and only then, does the client-generation step run:
nswag run nswag.json   # reading from the FIXED, just-committed
                        # ./openapi/v1.json — not from any live URL

This produces a spec file that is DETERMINISTICALLY tied to a specific
commit — running this exact CI step against the exact same commit
always produces byte-identical output (modulo things like generation
timestamps, which should be excluded from the document if the tooling
includes them). This closes the gap entirely: the generated CLIENT,
committed alongside application code and reviewed via its diff in PRs
(as the main page recommends), now only ever changes when the actual
API surface changes — never as a side effect of what happened to be
running on a developer's own machine at generation time.

The broader principle: any workflow that says "diff the generated
output in PRs to catch changes" implicitly assumes the generation
process itself is DETERMINISTIC and REPRODUCIBLE from the same input —
generating against a live, mutable server violates that assumption
silently, while generating from a checked-in or build-artifact file
restores it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'pointing nswag.json\'s "fromDocument" at a live localhost URL (as the main page\'s own example shows) is a reasonable, low-friction way to keep the generated client always up to date with whatever the developer is currently running.',
      reality: 'generating against a live server makes the output depend on whatever transient, possibly-uncommitted state happens to be running on that specific developer\'s machine at that exact moment — undermining the reliability of diffing the generated client in PRs, since two runs against the "same" endpoint can produce different results depending on local server state.',
    },
    {
      thought: 'the "check the generated client into source control and diff it in PRs" recommendation from the main page works regardless of HOW the spec used to generate that client was produced.',
      reality: 'that recommendation implicitly assumes the generation process is deterministic and reproducible from the same commit — generating from a live URL breaks that assumption, while generating from a fixed, committed spec file (or a CI-produced build artifact) restores it.',
    },
    {
      thought: 'producing an OpenAPI spec file always requires actually running the web application and making a real HTTP request to fetch it.',
      reality: 'modern .NET tooling can generate the OpenAPI document as a build-time artifact without an actual listening HTTP server — the same reflection-based endpoint-metadata process that normally runs when a request hits /openapi/v1.json can be triggered directly during the build instead.',
    },
  ];
}
