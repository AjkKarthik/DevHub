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
  templateUrl: './workflow-run-grants-secrets-the-trigger-didnt-have.html',
  styleUrl: './workflow-run-grants-secrets-the-trigger-didnt-have.scss'
})
export class WorkflowRunGrantsSecretsTheTriggerDidntHaveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page uses workflow_run in its own CD Deploy Workflow code tab — and never explains it anywhere in theory',
      points: [
        'The main page\'s own CD Deploy Workflow code tab opens with on: workflow_run: workflows: [CI]: types: [completed]: branches: [main] — an entire deploy pipeline built around this one trigger. The main page\'s own Triggers theory section, however, only lists and explains push, pull_request, schedule, workflow_dispatch, and workflow_call — workflow_run appears in code, but its name and behavior are never mentioned in prose anywhere on the page.',
        'GitHub\'s own documentation states workflow_run\'s defining, security-relevant property directly: "The workflow started by the workflow_run event is able to access secrets and write tokens, even if the previous workflow was not." This is not a minor detail — it is the entire reason the main page\'s own deploy pipeline is structured this way instead of simply adding deploy steps to the CI workflow itself.',
        'This directly explains a design choice the main page\'s own code makes implicitly but never states outright: separating CI (which might run on pull_request, including from untrusted forks, and therefore correctly has NO secrets access per this hub\'s own fork-PR subtopic) from CD (triggered by workflow_run once CI completes, which per GitHub\'s own docs DOES get secrets access) is precisely how a project safely runs both untrusted-code testing and privileged deployment steps in the same overall pipeline.',
      ]
    },
    {
      heading: 'The other side of the coin — GitHub\'s own explicit security warning',
      points: [
        'GitHub\'s own documentation pairs the elevated-access fact with a direct warning: "Running untrusted code on the workflow_run trigger may lead to security vulnerabilities. These vulnerabilities include cache poisoning and granting unintended access to write privileges or secrets." The exact feature that makes workflow_run useful for safe post-CI deploys (secrets access regardless of the trigger) is also what makes it dangerous if misused.',
        'The dangerous pattern GitHub is warning against: a workflow_run-triggered job that checks out and EXECUTES code from the pull request that triggered the original (possibly fork-originated, untrusted) CI run — since the workflow_run job itself has full secrets access, running attacker-controlled code inside it (even indirectly, via a build script or test runner from the PR branch) can exfiltrate those secrets, defeating the entire protection the fork-PR restriction was designed to provide.',
        'Applied to the main page\'s own deploy workflow: its steps.checkout, build, and push steps operate on the repository\'s own main branch content (since the trigger condition is branches: [main] and the deploy pulls from main, not from whatever branch/fork originally triggered CI) — this is the SAFE way to use workflow_run\'s elevated access: deploy the already-merged, already-reviewed main branch, never the untrusted PR branch\'s own code.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why the main page\'s own CI/CD split is structured around workflow_run',
      language: 'bash',
      code: `# CI workflow -- runs on pull_request, INCLUDING from forks.
# Per this hub's own fork-PR subtopic, this correctly has NO
# secrets access when a fork PR triggers it -- exactly as it should,
# since PR code (possibly from an untrusted contributor) is running.

# .github/workflows/ci.yml
# on:
#   push: { branches: [main, develop] }
#   pull_request: { branches: [main] }
# jobs:
#   build-and-test:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - run: npm ci && npm test    # runs the PR's own (possibly
#                                       untrusted) test suite -- no
#                                       secrets available if this is
#                                       a fork PR, by design

# CD workflow -- runs on workflow_run AFTER CI completes on main.
# Per GitHub's own docs: "The workflow started by the workflow_run
# event is able to access secrets and write tokens, even if the
# previous workflow was not."

# .github/workflows/deploy.yml (matches the main page's own tab)
# on:
#   workflow_run:
#     workflows: [CI]
#     types: [completed]
#     branches: [main]      # <- only fires for CI runs ON main,
#                               never for a fork PR's own CI run
# jobs:
#   deploy:
#     if: \${{ github.event.workflow_run.conclusion == 'success' }}
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4    # checks out MAIN, not the
#                                          PR branch that triggered
#                                          the original CI run
#       - env:
#           AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
#         run: ./deploy.sh              # HAS secrets access, per
#                                          workflow_run's own
#                                          documented behavior`,
    },
    {
      label: 'The dangerous pattern GitHub\'s own docs warn against',
      language: 'bash',
      code: `# GitHub's own warning: "Running untrusted code on the workflow_run
# trigger may lead to security vulnerabilities... granting
# unintended access to write privileges or secrets."

# A DANGEROUS variant of the main page's own deploy workflow --
# checking out the PR BRANCH (not main) inside the elevated
# workflow_run context:

# on:
#   workflow_run:
#     workflows: [CI]
#     types: [completed]
# jobs:
#   deploy:
#     runs-on: ubuntu-latest
#     steps:
#       # DANGEROUS: checks out the PR's own head commit -- possibly
#       # from an untrusted fork -- INSIDE a job that has full
#       # secrets access, per workflow_run's own elevated permissions
#       - uses: actions/checkout@v4
#         with:
#           ref: \${{ github.event.workflow_run.head_sha }}
#       - env:
#           AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
#         run: npm ci && npm run build   # runs a build script FROM
#                                           the untrusted PR branch,
#                                           with full secrets in the
#                                           environment -- a
#                                           malicious build script
#                                           could exfiltrate them

# The main page's own deploy.yml avoids this entirely by using
# "branches: [main]" as the workflow_run filter (only fires for CI
# runs that happened ON main, which by definition never happens for
# a fork PR's own CI run) and checking out main's OWN content, not
# whatever branch/commit originally triggered the upstream CI run.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants to add automated PR comment previews (e.g. "here\'s a preview link for your changes") that work even for external contributors\' fork PRs, which don\'t have secrets access under the normal pull_request trigger. A developer proposes: change the existing workflow_run-triggered deploy workflow (currently filtered to branches: [main]) to also fire for CI runs from ANY branch, then have it check out and build whatever branch/commit triggered the original CI run, using the deploy credentials to publish a preview. Using this subtopic\'s theory, evaluate this proposal and identify the specific security risk it introduces.',
    hint: 'Per this subtopic\'s theory, does workflow_run\'s elevated secrets access depend on WHICH branch or PR originally triggered the upstream workflow, or is it granted regardless? If the proposal checks out and builds a fork PR\'s own code inside this elevated-access job, what could a malicious PR\'s build script do?',
    solution: 'This proposal recreates exactly the dangerous pattern GitHub\'s own documentation warns against. Per this subtopic\'s theory, workflow_run grants secrets and write-token access "even if the previous workflow was not" allowed to have them — critically, this elevated access is granted REGARDLESS of which branch or PR originally triggered the upstream CI run, including a fork PR from an untrusted external contributor. The proposal\'s plan to check out and build "whatever branch/commit triggered the original CI run" means an external contributor\'s build script (package.json scripts, a Makefile, anything executed during npm ci or npm run build) would run INSIDE a job that has full deploy credentials in its environment — a malicious contributor could write a build script that reads process.env.AWS_ACCESS_KEY_ID (or equivalent) and exfiltrates it to an external server, completely defeating the fork-PR secrets restriction the normal pull_request trigger is designed to enforce. This is precisely the scenario GitHub\'s own warning names: "granting unintended access to write privileges or secrets" via untrusted code running in the elevated workflow_run context. A safer design for the actual goal (PR previews for fork contributors) would build the preview artifact WITHOUT secrets in a separate, properly-restricted job (or using a service that doesn\'t require injecting deploy credentials into a build of untrusted code), keeping the workflow_run-triggered, secrets-bearing job restricted to deploying already-reviewed, already-merged main branch content — exactly the pattern the main page\'s own deploy.yml already follows.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own CD Deploy Workflow uses workflow_run instead of a simpler trigger for a stylistic or organizational reason — any equivalent trigger would work about as well.',
      reality: 'This subtopic\'s theory shows workflow_run is specifically chosen because, per GitHub\'s own documentation, it "is able to access secrets and write tokens, even if the previous workflow was not" — this is the mechanism that lets the main page split untrusted CI (which correctly lacks secrets for fork PRs) from privileged CD (which needs secrets to deploy) into two separate, appropriately-scoped workflows.'
    },
    {
      thought: 'Since workflow_run grants elevated secrets access, it is inherently unsafe to use and should be avoided in favor of simpler triggers whenever possible.',
      reality: 'This subtopic\'s theory and first code example show workflow_run is the STANDARD, documented pattern for safely running privileged post-CI steps — the main page\'s own deploy workflow uses it correctly by filtering to branches: [main] and checking out main\'s own content, never the untrusted branch that triggered the original CI run. The risk is specific to checking out and executing UNTRUSTED code inside the elevated context, not to using the trigger itself.'
    },
    {
      thought: 'Filtering a workflow_run trigger to branches: [main] is just a convenience to avoid running deploys for feature branches — it has no real security implication.',
      reality: 'This subtopic\'s second code example shows this filter is actually a meaningful security boundary: since a fork PR\'s own CI run never happens "on" the main branch, filtering workflow_run to branches: [main] structurally excludes fork-PR-triggered CI runs from ever reaching the secrets-bearing deploy job — removing this filter (as the exercise\'s proposed change does) is exactly what opens the door to the exfiltration risk GitHub\'s own docs warn about.'
    }
  ];
}
