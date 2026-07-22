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
  templateUrl: './fork-pr-builds-on-self-hosted-agents-run-untrusted-code-on-prem.html',
  styleUrl: './fork-pr-builds-on-self-hosted-agents-run-untrusted-code-on-prem.scss'
})
export class ForkPrBuildsOnSelfHostedAgentsRunUntrustedCodeOnPremSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s self-hosted agent coverage is entirely about tooling convenience, never security exposure',
      points: [
        'The main page\'s own theory describes self-hosted agents in purely operational terms: "Self-hosted agents persist tool caches and credentials between runs." Nothing on the main page discusses what code actually runs on that persistent machine, or where that code comes from.',
        'For any pipeline building a public GitHub repository, one very common source of that code is a pull request from a fork — meaning code an external, untrusted contributor wrote, not the project\'s own team. What happens when THAT code runs on a self-hosted agent is a real, documented security consideration the main page never raises.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own pipeline security documentation: fork PR builds on self-hosted agents let external code run on your own infrastructure',
      points: [
        'Per Microsoft\'s own guidance: "Avoid running builds from forks on self-hosted agents. If you use self-hosted agents, external organizations can run external code on machines within your corporate network." The pipeline YAML itself in a fork PR is exactly what triggers execution — script and task steps in that YAML run with whatever access the agent has, and that YAML comes from the fork, not from a reviewed, trusted source.',
        'By default, Azure Pipelines does apply one real protection here: "By default, your pipelines build forks, but they don\'t automatically expose secrets and protected resources to the jobs in those pipelines." A fork PR build normally runs with a restricted access token — this default is the main safety net, and Microsoft\'s own docs explicitly warn against disabling it: "Don\'t disable this protection to maintain security," referring to a setting literally named "Make fork builds have the same permissions as regular builds," which — if turned on — removes that restriction entirely.',
        'The recommended mitigations are layered, not just "use Microsoft-hosted agents": (1) prefer Microsoft-hosted agents for fork builds specifically, since each run gets an isolated, disposable VM; (2) if self-hosted agents must be used, "implement network isolation and ensure that agents don\'t persist their state between jobs" — directly at odds with the main page\'s own praised self-hosted-agent behavior of persisting caches and credentials between runs; (3) consider turning off automatic fork builds entirely and manually triggering them via a PR comment after a human reviews the diff first.',
      ]
    },
    {
      heading: 'Why this is a genuinely different risk model from the main page\'s own service-connection security coverage',
      points: [
        'The main page\'s existing mistakes and QnA content on service connections and secrets is about limiting what a LEGITIMATE pipeline can do if compromised (Workload Identity Federation, narrow scope, restricting which pipelines can use a connection). Fork PR builds are a different threat entirely: the pipeline YAML and code being executed are themselves attacker-controlled from the start, before any service connection is even reached.',
        'A self-hosted agent that persists tool caches and credentials between runs (the main page\'s own stated benefit) is precisely the property that makes it dangerous for untrusted fork code — anything that code leaves behind (a modified cache entry, a captured credential, a background process) can affect the NEXT job that reuses the same agent, including a job from the project\'s own trusted branch.',
        'This is why Microsoft\'s guidance singles out GitHub public repositories specifically — the risk is proportional to how easy it is for an untrusted party to submit a PR at all. A private Azure Repos project with no external contributors doesn\'t face this exact threat model, even on self-hosted agents.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The default protection, and the setting that removes it',
      language: 'bash',
      code: `# By default, a fork PR build runs with a RESTRICTED access token --
# it can build and test, but per Microsoft's own docs, forks
# "don't automatically expose secrets and protected resources."

# The setting that removes this protection lives in:
# Project Settings -> Pipelines -> Settings ->
#   "Make fork builds have the same permissions as regular builds"
#
# Per Microsoft's own guidance: "Don't disable this protection to
# maintain security." Turning this ON means a pull request from an
# untrusted fork gets the SAME secrets and resource access as a
# build from your own team's trusted branch.

# This setting should stay OFF for any public repository accepting
# external contributions -- there is no legitimate reason to grant
# fork PR builds full parity with trusted builds.`,
    },
    {
      label: 'Layered mitigations for a public repo with self-hosted agents in the mix',
      language: 'bash',
      code: `# 1. Route fork PR builds specifically to Microsoft-hosted agents,
#    even if the project's normal builds use self-hosted agents --
#    each Microsoft-hosted run is an isolated, disposable VM.
pool:
  \${{ if eq(variables['System.PullRequest.IsFork'], 'True') }}:
    vmImage: 'ubuntu-latest'   # untrusted fork PR -> Microsoft-hosted
  \${{ else }}:
    name: 'my-self-hosted-pool'  # trusted branch build -> self-hosted OK

# 2. If self-hosted agents genuinely must run fork PR code, per
#    Microsoft's own docs: "implement network isolation and ensure
#    that agents don't persist their state between jobs" -- this is
#    the OPPOSITE of the tool-cache-persistence behavior the main
#    page's own theory praises self-hosted agents for.

# 3. Turn off automatic fork builds entirely, requiring a manual
#    trigger via PR comment after human review:
#    Project Settings -> Pipelines -> Settings ->
#      "Build pull requests from forks of this repository" -> Off
#    (then use a documented comment trigger, e.g. "/azp run", once
#    a maintainer has reviewed the diff)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An open-source project on GitHub uses Azure Pipelines with a self-hosted agent pool for faster builds (the agent persists a large dependency cache between runs, exactly as the main page describes as a benefit). A new external contributor opens a pull request from their own fork. What is the specific risk in letting this PR trigger a build on the same self-hosted agent pool used for the project\'s own trusted branches, and what would Microsoft\'s own guidance recommend instead?',
    hint: 'Consider what code actually executes during a pipeline run, where that code comes from for a fork PR, and what persists on a self-hosted agent between different jobs.',
    solution: 'The specific risk is that the pipeline YAML and any script/task steps in the fork PR are attacker-controlled — that code would execute directly on the project\'s own self-hosted infrastructure. Per Microsoft\'s own guidance, "external organizations can run external code on machines within your corporate network" in exactly this scenario. Combined with the agent persisting tool caches and credentials between jobs (the same property the main page praises for speed), anything the untrusted PR\'s build leaves behind could affect a LATER job on the same agent, including a build from the project\'s own trusted branch. Microsoft\'s own recommendation is to route fork PR builds to Microsoft-hosted agents specifically (isolated, disposable VMs) rather than the self-hosted pool, and to leave the default "don\'t expose secrets to fork builds" protection enabled rather than granting fork builds the same permissions as regular builds.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Self-hosted agents are purely a performance and cost optimization — persisting tool caches and credentials between runs (as the main page describes) has no security downside worth considering.',
      reality: 'Per this subtopic\'s theory, that same persistence is exactly what makes self-hosted agents risky for untrusted code — Microsoft\'s own guidance recommends agents "don\'t persist their state between jobs" specifically when fork PR builds might run on them.'
    },
    {
      thought: 'Since Azure Pipelines builds pull requests from forks by default, a fork PR build automatically has the same access to secrets and service connections as a build from the project\'s own trusted branch.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the opposite is true by default: fork builds "don\'t automatically expose secrets and protected resources" — that protection only goes away if a specific setting ("Make fork builds have the same permissions as regular builds") is deliberately turned on.'
    },
    {
      thought: 'The main page\'s existing security advice on service connections (Workload Identity Federation, narrow scoping) already covers the risk of running fork PR builds on self-hosted agents.',
      reality: 'Per this subtopic\'s theory, this is a genuinely different threat model — service connection hardening limits what a LEGITIMATE, compromised pipeline can do, while fork PR builds involve attacker-controlled pipeline YAML and code from the very start, before any service connection is even reached.'
    }
  ];
}
