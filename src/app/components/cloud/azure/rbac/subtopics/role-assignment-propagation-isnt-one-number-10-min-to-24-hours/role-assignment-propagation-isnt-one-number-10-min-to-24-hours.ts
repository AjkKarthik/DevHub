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
  templateUrl: './role-assignment-propagation-isnt-one-number-10-min-to-24-hours.html',
  styleUrl: './role-assignment-propagation-isnt-one-number-10-min-to-24-hours.scss'
})
export class RoleAssignmentPropagationIsntOneNumber10MinTo24HoursSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states one flat ceiling for a delay that actually has at least three very different tiers',
      points: [
        'The main page\'s own theory states: "Role assignments take effect within a few minutes of creation but propagation across all Azure services can take up to 30 minutes — account for this in deployment pipelines." This reads as a single worst-case number a deployment pipeline can safely wait out.',
        'Microsoft\'s own troubleshooting documentation describes a meaningfully different picture — the general case is actually FASTER than 30 minutes, but there are specific, documented scenarios that are dramatically SLOWER, and neither direction is captured by the main page\'s single figure.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own troubleshooting reference: three distinct propagation tiers',
      points: [
        'Tier 1 — the general case is actually faster than the main page states: "When you assign roles or remove role assignments, it can take up to 10 minutes for changes to take effect." This applies to ordinary role assignment create/delete operations at resource, resource group, or subscription scope — not 30 minutes.',
        'Tier 2 — Managed Identity access granted via GROUP membership is dramatically slower: "You added managed identities to a group and assigned a role to that group... The back-end services for managed identities maintain a cache per resource URI for around 24 hours... It can take several hours for changes to a managed identity\'s group or role membership to take effect." A pattern the main page never distinguishes from a direct role assignment — assigning a role to a security GROUP that a managed identity belongs to, rather than to the managed identity directly, is a completely different and much slower propagation path.',
        'Tier 3 — management group scope has its own, separate slow path for data-plane access: "If you add or remove a built-in role assignment at management group scope and the built-in role has DataActions, the access on the data plane might not be updated for several hours. This applies only to management group scope and the data plane." Control-plane access at the same scope still follows the faster ~10-minute path — only the DataActions/management-group combination is slow.',
      ]
    },
    {
      heading: 'Why this matters for deployment pipelines specifically',
      points: [
        'A pipeline that grants a role, waits a fixed "safe" 30 seconds or even the main page\'s implied 30-minute ceiling, then immediately tries to use the new access will reliably work for a direct role assignment (Tier 1) but will reliably FAIL — not flakily, but consistently — for a group-based Managed Identity assignment (Tier 2), since the real wait can be measured in hours, not minutes.',
        'The practical mitigation for automation isn\'t a longer sleep — it\'s a retry loop with backoff around the actual operation that depends on the new access, since even the documented figures are described as "around" or "up to," not hard guarantees. For anything time-sensitive, prefer assigning roles directly to the Managed Identity\'s own principal ID rather than via group membership, specifically to stay on the faster propagation path.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The fast path: role assigned directly to a principal',
      language: 'bash',
      code: `# Direct role assignment to a Managed Identity's own principal ID --
# this follows the ~10-minute general propagation path per Microsoft's
# own troubleshooting docs, NOT the main page's "up to 30 minutes":
MI_PID=$(az vm show --name my-vm --resource-group my-rg \\
  --query identity.principalId -o tsv)

az role assignment create \\
  --assignee-object-id $MI_PID \\
  --assignee-principal-type ServicePrincipal \\
  --role "Storage Blob Data Reader" \\
  --scope /subscriptions/<subId>/resourceGroups/my-rg

# A pipeline step immediately after this can reasonably poll for
# up to ~10 minutes before treating access as failed -- this is the
# fast path.`,
    },
    {
      label: 'The slow path: role assigned to a group the identity belongs to',
      language: 'bash',
      code: `# Assigning the role to a GROUP instead of directly to the MI's
# principal ID looks equivalent -- but is NOT on the same
# propagation timeline:
az ad group member add \\
  --group my-app-identities-group \\
  --member-id $MI_PID

az role assignment create \\
  --assignee-object-id $(az ad group show --group my-app-identities-group --query id -o tsv) \\
  --assignee-principal-type Group \\
  --role "Storage Blob Data Reader" \\
  --scope /subscriptions/<subId>/resourceGroups/my-rg

# Per Microsoft's own docs: "The back-end services for managed
# identities maintain a cache per resource URI for around 24 hours...
# It can take several hours for changes to a managed identity's
# group or role membership to take effect."
#
# A pipeline that assumes this resolves within 30 minutes (the main
# page's stated ceiling) will see the new access fail to appear for
# up to a full day -- not a flaky delay, a documented one.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment pipeline adds a VM\'s system-assigned Managed Identity to an Entra ID security group, then assigns Storage Blob Data Reader to that GROUP (not directly to the MI). The pipeline waits 30 minutes — the main page\'s stated ceiling — then runs a smoke test that reads a blob using the MI\'s token. The smoke test fails with a 403. Is this pipeline broken, or is 30 minutes simply not long enough for this specific pattern?',
    hint: 'Check whether Microsoft documents a different, longer propagation path specifically for group-based Managed Identity role assignments, separate from the general role assignment propagation figure.',
    solution: 'The 30-minute wait is not long enough for this specific pattern — the pipeline itself may be fine. Per Microsoft\'s own troubleshooting documentation, group-based Managed Identity role assignments follow a much slower path than direct assignments: "The back-end services for managed identities maintain a cache per resource URI for around 24 hours... It can take several hours for changes to a managed identity\'s group or role membership to take effect." The general ~10-minute propagation figure (itself already faster than the main page\'s stated 30-minute ceiling) simply doesn\'t apply here. The fix isn\'t a longer fixed wait — it\'s either switching to a direct role assignment on the MI\'s own principal ID (the fast path) if the smoke test needs to run soon after deployment, or building the pipeline\'s smoke test as a retry-with-backoff step tolerant of a multi-hour delay if group-based assignment is required for other reasons.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure RBAC role assignment propagation has one documented ceiling — "up to 30 minutes" — that applies uniformly regardless of how the role was assigned.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own troubleshooting documentation describes at least three different tiers: ~10 minutes for direct assignments (faster than 30 minutes), up to ~24 hours for group-based Managed Identity assignments, and "several hours" for DataActions changes at management group scope.'
    },
    {
      thought: 'Assigning a role to a security group that a Managed Identity belongs to is functionally equivalent to assigning the role directly to the identity, just with an extra layer of indirection.',
      reality: 'Per this subtopic\'s theory, the two approaches follow measurably different propagation timelines — direct assignment follows the faster ~10-minute path, while group-based assignment can take up to 24 hours due to a separate per-resource-URI cache specific to Managed Identity group/role membership changes.'
    },
    {
      thought: 'If a deployment pipeline waits long enough after a role assignment (e.g. the main page\'s stated 30 minutes), the new access is guaranteed to be available by then, regardless of how the role was assigned.',
      reality: 'Per this subtopic\'s theory, this holds for direct role assignments but not for group-based Managed Identity assignments or DataActions changes at management group scope — both of which are documented to take substantially longer than 30 minutes in the worst case.'
    }
  ];
}
