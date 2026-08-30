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
  templateUrl: './classic-co-administrators-auto-converted-to-owner-december-2025.html',
  styleUrl: './classic-co-administrators-auto-converted-to-owner-december-2025.scss'
})
export class ClassicCoAdministratorsAutoConvertedToOwnerDecember2025Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own audit QnA lists az role assignment list as a primary tool, without mentioning a source of Owner access that didn\'t exist there until recently',
      points: [
        'The main page\'s own QnA on auditing access recommends: "az role assignment list --all: enumerate all role assignments in a subscription... Azure Portal → Resource → Access Control (IAM) → Role assignments." This advice assumes every Owner-equivalent assignment an auditor finds was deliberately created through normal RBAC role assignment.',
        'That assumption held until very recently. Azure\'s legacy classic subscription administrator roles — Co-Administrator and Service Administrator, predating Azure RBAC entirely — were retired on a specific, documented timeline, and their retirement process involved automatically CREATING new Owner role assignments that now genuinely do appear in az role assignment list, but with a distinguishing origin an auditor needs to know to look for.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own documentation: a dated, three-stage retirement with an automatic conversion step',
      points: [
        'Per Microsoft\'s own classic administrators reference: "As of August 31, 2024, Azure classic administrator roles... are retired and no longer supported. Starting in December 2025, Azure automatically assigned the Owner role at subscription scope to users in the public cloud who were still assigned the Co-Administrator or Service Administrator role. As of May 2026, classic administrator roles are fully retired."',
        'The automatic conversion specifically targeted accounts that still held Co-Administrator or Service Administrator roles as of December 2025 — years after those roles stopped being the primary way to manage access, meaning the accounts affected were often stale, forgotten legacy assignments rather than actively-managed ones.',
        'Critically, these auto-created Owner assignments are identifiable, not indistinguishable from a deliberately-granted Owner role: per Microsoft\'s own docs, they carry "description: \'The Classic Admin role was converted to an Azure Owner role on behalf of the user due to Classic Admin retirement\'" and a specific, fixed createdBy GUID (0469d4cd-df37-4d93-8a61-f8c75b809164) rather than the object ID of whichever admin actually ran az role assignment create.',
      ]
    },
    {
      heading: 'What this means for an audit run any time from December 2025 onward',
      points: [
        'A subscription that had ANY lingering Co-Administrator or Service Administrator assignment before this retirement now has one or more Owner role assignments that no one deliberately created via normal RBAC tooling — they surfaced automatically as a side effect of a platform-wide legacy-feature retirement, not a decision anyone reviewed for that specific account.',
        'Microsoft\'s own guidance is explicit about the follow-up action: "If you have an Owner role assignment with this description and the user no longer needs access, you should remove the role assignment." The retirement process intentionally preserved access rather than silently revoking it (to avoid orphaning subscriptions) — cleanup is left to the subscription owner to do deliberately, exactly the kind of access-review task the main page\'s own PIM and Access Reviews sections already recommend for privileged roles generally.',
        'The practical audit step: filter az role assignment list output for the specific description text or the fixed createdBy GUID to find every auto-converted assignment in one pass, rather than relying on institutional memory of who used to hold classic admin roles.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Finding auto-converted Owner assignments',
      language: 'bash',
      code: `# List all role assignments and filter for the auto-conversion
# description Microsoft's own docs specify:
az role assignment list --all --output json \\
  | jq '.[] | select(.description == "The Classic Admin role was converted to an Azure Owner role on behalf of the user due to Classic Admin retirement")'

# Alternative: filter by the fixed createdBy principal ID that
# Microsoft's own docs attribute to every auto-conversion:
az role assignment list --all --output json \\
  | jq '.[] | select(.createdBy == "0469d4cd-df37-4d93-8a61-f8c75b809164")'

# Neither filter requires remembering who used to hold classic
# Co-Administrator/Service Administrator roles -- both find every
# auto-converted assignment directly from the assignment's own
# metadata.`,
    },
    {
      label: 'Cleaning up an assignment that\'s no longer needed',
      language: 'bash',
      code: `# Per Microsoft's own guidance: "If you have an Owner role
# assignment with this description and the user no longer needs
# access, you should remove the role assignment."

az role assignment delete \\
  --assignee user@example.com \\
  --role "Owner" \\
  --scope /subscriptions/<subId>

# Before removing the LAST Owner assignment on a subscription,
# note the main page's own coverage of this restriction still
# applies here too -- Azure blocks removing the last Owner (or
# User Access Administrator) role assignment on a subscription
# by default, to avoid orphaning it. A Global Administrator can
# override this, or use PIM to temporarily activate Owner first.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Running an access review in mid-2026, you find a subscription with an Owner role assignment for a former employee\'s account. No one on the current team remembers granting it, and az role assignment list shows nothing unusual about it at first glance — same format as every other Owner assignment. What additional field should you check to determine whether this was a deliberate grant or a side effect of a legacy-feature retirement, and why would that distinction matter for how you handle it?',
    hint: 'Check the assignment\'s own description and createdBy fields, not just its role and scope, and consider what Microsoft\'s own retirement timeline for classic administrator roles implies about accounts still holding them as of December 2025.',
    solution: 'Check the role assignment\'s description field for the exact text "The Classic Admin role was converted to an Azure Owner role on behalf of the user due to Classic Admin retirement," or its createdBy field for the fixed GUID 0469d4cd-df37-4d93-8a61-f8c75b809164 — both are documented markers Microsoft attaches specifically to Owner assignments that were auto-created during the classic administrator retirement (December 2025 conversion, full retirement May 2026), rather than assignments a person deliberately created via az role assignment create. The distinction matters because an account that still held Co-Administrator or Service Administrator that late was very likely a stale, forgotten legacy assignment nobody had gotten around to cleaning up — not a recent, reviewed access decision — making it a strong candidate for removal per Microsoft\'s own follow-up guidance, versus a normal Owner assignment that would warrant checking with whoever created it first.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every Owner role assignment visible in az role assignment list was deliberately created by an administrator running a role assignment command at some point.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own retirement process for classic administrator roles automatically created Owner assignments for any account still holding Co-Administrator or Service Administrator as of December 2025 — these are real, functioning Owner assignments that no one directly created through normal RBAC tooling.'
    },
    {
      thought: 'Classic subscription administrator roles (Co-Administrator, Service Administrator) simply stopped working when they were retired, with no lasting effect on the subscription\'s access model.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes the opposite outcome — access was deliberately preserved by converting these roles into equivalent Owner role assignments, specifically to avoid orphaning subscriptions, rather than silently revoking access.'
    },
    {
      thought: 'An auto-converted Owner assignment from the classic administrator retirement is indistinguishable from any other Owner assignment once it appears in az role assignment list.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs specify a distinguishing description string and a fixed createdBy GUID (0469d4cd-df37-4d93-8a61-f8c75b809164) attached to every auto-converted assignment, making them directly filterable and identifiable in an audit.'
    }
  ];
}
