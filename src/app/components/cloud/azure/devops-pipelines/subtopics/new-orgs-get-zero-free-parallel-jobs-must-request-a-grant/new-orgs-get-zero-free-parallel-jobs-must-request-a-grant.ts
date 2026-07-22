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
  templateUrl: './new-orgs-get-zero-free-parallel-jobs-must-request-a-grant.html',
  styleUrl: './new-orgs-get-zero-free-parallel-jobs-must-request-a-grant.scss'
})
export class NewOrgsGetZeroFreeParallelJobsMustRequestAGrantSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states a free tier figure as though it applies automatically to any new organization',
      points: [
        'The main page\'s own quickRef states: "Azure Pipelines... Free tier: 1 parallel job, 1800 min/month." Read plainly, this describes what a new Azure DevOps organization gets out of the box — set up a pipeline, and it runs, within these limits.',
        'For a meaningful share of new organizations today, that isn\'t what actually happens. A very common first-pipeline experience is the run failing immediately with "No hosted parallelism has been purchased or granted" — zero free parallel jobs, not one.',
      ]
    },
    {
      heading: 'Confirmed: new organizations no longer receive free concurrent pipelines automatically, and the fix is a manual, human-reviewed request',
      points: [
        'Microsoft changed how the free grant of Microsoft-hosted parallel jobs works: new organizations no longer receive it automatically — this applies to both public and private projects created in a new organization. The grant of free parallel jobs is, per Microsoft\'s own current guidance, "temporarily disabled by default" for new organizations.',
        'The only supported path to get the free grant is submitting the Azure DevOps Parallelism Request form — a manual request reviewed by the Azure DevOps team, not an automatic account-level entitlement. This is a real, human-in-the-loop process, not a self-service toggle in the portal.',
        'Processing isn\'t instant: requests can take several business days, and during high-demand periods the wait has stretched to weeks with some requesters reporting no response at all after their first submission. A team building their first pipeline on a brand-new organization, expecting the main page\'s "1800 min/month" to just work, can be blocked for an unpredictable stretch of time waiting on a form.',
      ]
    },
    {
      heading: 'What to actually plan around when starting a new organization',
      points: [
        'Submit the parallelism request form as one of the very first setup steps for a new organization — before the team is depending on CI/CD working — rather than discovering the "No hosted parallelism has been purchased or granted" error mid-project when a deadline is looming.',
        'Self-hosted agents are not subject to this grant process at all — pointing a pipeline at a self-hosted agent pool (a VM or container you provide) sidesteps the Microsoft-hosted parallelism grant entirely, at the cost of managing that infrastructure yourself. This is a viable unblock for a team that can\'t wait on the grant request.',
        'Purchasing paid parallel jobs (a per-parallel-job monthly charge) is available immediately with no review wait, unlike the free grant — for a team on a deadline where even a few days\' delay is unacceptable, paying for the first parallel job rather than waiting for the free grant request is a legitimate practical choice.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The error a brand-new organization actually hits',
      language: 'bash',
      code: `# First pipeline run on a freshly created Azure DevOps organization:
az pipelines run --name my-pipeline --organization https://dev.azure.com/MyNewOrg --project MyProject

# Result (a real, commonly reported failure -- NOT a bug):
##[error]No hosted parallelism has been purchased or granted.
##[error]To request a free parallelism grant, please fill out
##[error]the following form https://aka.ms/azpipelines-parallelism-request

# This happens even though the organization is brand new and the
# pipeline YAML itself is completely correct -- the main page's
# "Free tier: 1 parallel job, 1800 min/month" does not describe
# the default state of a new org today.`,
    },
    {
      label: 'Unblocking a new organization',
      language: 'bash',
      code: `# Option 1: submit the free grant request (no guaranteed timeline --
# can take several business days, sometimes longer during high demand)
# https://aka.ms/azpipelines-parallelism-request

# Option 2: point the pipeline at a self-hosted agent instead --
# entirely bypasses the Microsoft-hosted parallelism grant process
az pipelines pool create \\
  --name my-self-hosted-pool \\
  --organization https://dev.azure.com/MyNewOrg
# ...then register a self-hosted agent against this pool, and change
# the pipeline's "pool:" to reference it instead of vmImage.

# Option 3: purchase a paid parallel job immediately -- available
# without any review wait, unlike the free grant:
# Organization Settings -> Parallel jobs -> Microsoft-hosted -> Buy`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Your team just created a brand-new Azure DevOps organization and set up a pipeline, expecting it to run immediately under the "free tier" the main page describes (1 parallel job, 1800 minutes/month). The very first run fails with "No hosted parallelism has been purchased or granted." Is this a misconfiguration in the pipeline YAML, and what are the realistic options to get CI/CD working today versus this week?',
    hint: 'Check whether the free parallel job grant is still automatic for brand-new Azure DevOps organizations, or whether it now requires a separate, manually-reviewed request.',
    solution: 'This is not a YAML misconfiguration — new Azure DevOps organizations no longer receive the free parallel job grant automatically; it must be requested via the Azure DevOps Parallelism Request form and is reviewed manually, which can take several business days or longer. For CI/CD working TODAY, the two realistic options are: (1) point the pipeline at a self-hosted agent pool, which entirely bypasses the Microsoft-hosted parallelism grant process, or (2) purchase a paid parallel job immediately, which is available without any review wait. Submitting the free grant request is still worth doing in parallel for the team\'s longer-term free-tier usage, but it shouldn\'t be the only plan if CI/CD is needed this week.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every new Azure DevOps organization automatically gets at least one free Microsoft-hosted parallel job, as the main page\'s "Free tier: 1 parallel job, 1800 min/month" figure implies.',
      reality: 'Per this subtopic\'s theory, new organizations no longer receive free concurrent pipelines automatically — the grant is currently disabled by default for new organizations and must be requested manually via a form, reviewed by the Azure DevOps team.'
    },
    {
      thought: 'A "No hosted parallelism has been purchased or granted" error on a brand-new organization indicates a mistake in the pipeline\'s own YAML configuration.',
      reality: 'Per this subtopic\'s theory, this error is unrelated to the pipeline YAML\'s correctness — it reflects the organization\'s parallelism grant status, which for a new organization today is commonly zero until a manual request is approved.'
    },
    {
      thought: 'Requesting the free parallelism grant is effectively instant, similar to any other self-service Azure DevOps setting.',
      reality: 'Per this subtopic\'s theory, the request is reviewed manually by the Azure DevOps team and can take several business days — sometimes longer during periods of high demand — making it unsuitable as the only plan for a team that needs CI/CD working immediately.'
    }
  ];
}
